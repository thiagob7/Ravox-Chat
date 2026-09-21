import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import { AD_LIMITS, ADMIN_AREAS, ADMIN_TOKEN_HEADER, PREMIUM_GRANT_MAX_DAYS, type AdminArea, type PremiumAccount } from "@gravae/shared";

import { NotFoundError } from "~/lib/http.js";
import { announceUserUpdated } from "~/realtime/difusao.js";
import { objectId } from "~/validations/common.js";
import { userRepository } from "~/repositories/user-repository.js";
import { adService } from "~/services/ad-service.js";
import { adminService } from "~/services/admin-service.js";
import { reportService } from "~/services/denuncia-service.js";
import { githubService } from "~/services/github-service.js";
import { systemService } from "~/services/sistema-service.js";
import { planService } from "~/services/plan-service.js";
import { billingService } from "~/services/billing/billing-service.js";

const announcement = z.object({
  content: z.string().trim().min(1).max(4000),
  userIds: z.array(objectId).max(10_000).optional(),
});

const reportsQueue = z.object({
  pending: z.stringbool().optional(),
  before: objectId.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const outcome = z.object({ decision: z.enum(["procede", "arquivada", "reabrir"]) });

const premiumSearch = z.object({ term: z.string().trim().min(2).max(200).optional() });
const premiumGrant = z.object({ days: z.number().int().min(1).max(PREMIUM_GRANT_MAX_DAYS) });

type UserRow = NonNullable<Awaited<ReturnType<typeof userRepository.findById>>>;

const toPremiumAccount = (u: UserRow): PremiumAccount => ({
  id: u.id,
  email: u.email,
  username: u.username,
  displayName: u.displayName,
  avatarUrl: u.avatarUrl,
  premiumUntil: u.premiumUntil ? u.premiumUntil.toISOString() : null,
  premiumSource: (u.premiumSource as PremiumAccount["premiumSource"]) ?? null,
});

const moment = z.iso.datetime().nullable().optional();

const ad = z.object({
  advertiser: z.string().trim().min(1).max(AD_LIMITS.advertiser),
  title: z.string().trim().min(1).max(AD_LIMITS.title),
  body: z.string().trim().max(AD_LIMITS.body).nullable().optional(),
  imageUrl: z.url().max(AD_LIMITS.url).nullable().optional(),
  linkUrl: z.url().max(AD_LIMITS.url),
  active: z.boolean().optional(),
  startsAt: moment,
  endsAt: moment,
});

const areas = z.array(z.enum(ADMIN_AREAS)).max(ADMIN_AREAS.length);
const password = z.string().min(1).max(200);

export const adminToken = (req: FastifyRequest) => {
  const value = req.headers[ADMIN_TOKEN_HEADER];
  return typeof value === "string" && value ? value : undefined;
};

export const requireAdmin = (req: FastifyRequest, area: AdminArea) =>
  adminService.require(req.userId, adminToken(req), area);

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/admin/eu", async (req) => {
    const me = await adminService.me(req.userId, adminToken(req));
    if (!me) throw new NotFoundError("Não encontrado");

    return me;
  });

  app.post(
    "/admin/entrar",
    { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } },
    async (req) => {
      const body = z.object({ password }).parse(req.body);
      return adminService.unlock(req.userId, body.password);
    },
  );

  app.post("/admin/sair", async (req, reply) => {
    await adminService.lock(adminToken(req));
    return reply.code(204).send();
  });

  app.post("/admin/senha", async (req) => {
    const body = z.object({ current: password, fresh: password }).parse(req.body);
    return adminService.changePassword(req.userId, adminToken(req), body.current, body.fresh);
  });

  app.get("/admin/administradores", async (req) => {
    await requireAdmin(req, "administradores");
    return adminService.list();
  });

  app.post("/admin/administradores", async (req, reply) => {
    const actor = await requireAdmin(req, "administradores");
    const body = z.object({ email: z.string().email().max(200), areas, password }).parse(req.body);

    const id = await adminService.add(actor, body);
    return reply.code(201).send({ id });
  });

  app.patch("/admin/administradores/:memberId", async (req, reply) => {
    const actor = await requireAdmin(req, "administradores");
    const { memberId } = z.object({ memberId: objectId }).parse(req.params);
    const body = z.object({ areas }).parse(req.body);

    await adminService.setAreas(actor, memberId, body.areas);
    return reply.code(204).send();
  });

  app.post("/admin/administradores/:memberId/senha", async (req, reply) => {
    const actor = await requireAdmin(req, "administradores");
    const { memberId } = z.object({ memberId: objectId }).parse(req.params);
    const body = z.object({ password }).parse(req.body);

    await adminService.resetPassword(actor, memberId, body.password);
    return reply.code(204).send();
  });

  app.delete("/admin/administradores/:memberId", async (req, reply) => {
    const actor = await requireAdmin(req, "administradores");
    const { memberId } = z.object({ memberId: objectId }).parse(req.params);

    await adminService.remove(actor, memberId);
    return reply.code(204).send();
  });

  app.get("/admin/registro", async (req) => {
    await requireAdmin(req, "administradores");
    return adminService.history();
  });

  app.get("/admin/publicacoes", async (req) => {
    const actor = await requireAdmin(req, "publicacoes");
    const { fresh } = z.object({ fresh: z.stringbool().optional() }).parse(req.query);

    return githubService.publications(actor.areas.includes("aprovar"), fresh === true);
  });

  app.post(
    "/admin/publicacoes/:runId/:decision",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (req) => {
      const actor = await requireAdmin(req, "aprovar");
      const { runId, decision } = z
        .object({ runId: z.coerce.number().int().positive(), decision: z.enum(["aprovar", "recusar"]) })
        .parse(req.params);

      const user = await userRepository.findById(actor.userId);
      const result = await githubService.review(runId, decision === "aprovar", user?.displayName ?? actor.email);

      await adminService.log(actor.userId, decision === "aprovar" ? "aprovou-publicacao" : "recusou-publicacao", {
        runId,
        environments: result.environments,
      });

      return result;
    },
  );

  app.get("/admin/pessoas", async (req) => {
    await requireAdmin(req, "comunicado");
    const total = await userRepository.count();
    return { total };
  });

  app.get("/admin/denuncias", async (req) => {
    await requireAdmin(req, "denuncias");
    const { pending, before, limit } = reportsQueue.parse(req.query);

    return reportService.list({ pending, before, limit });
  });

  app.patch("/admin/denuncias/:reportId", async (req) => {
    const actor = await requireAdmin(req, "denuncias");
    const { reportId } = z.object({ reportId: objectId }).parse(req.params);
    const { decision } = outcome.parse(req.body);

    const result =
      decision === "reabrir"
        ? await reportService.reopen(reportId)
        : await reportService.resolve(req.userId, reportId, decision);

    await adminService.log(actor.userId, "decidiu-denuncia", { reportId, decision });
    return result;
  });

  app.post(
    "/admin/comunicados",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req) => {
      const actor = await requireAdmin(req, "comunicado");
      const { content, userIds } = announcement.parse(req.body);
      const destinations = userIds ?? (await userRepository.allIds());

      const result = await systemService.announce(destinations, content, req.log);
      await adminService.log(actor.userId, "mandou-comunicado", { recipients: result.recipients });

      return result;
    },
  );

  app.get("/admin/ads", async (req) => {
    await requireAdmin(req, "ads");
    return adService.list();
  });

  app.post("/admin/ads", async (req, reply) => {
    const actor = await requireAdmin(req, "ads");
    const body = ad.parse(req.body);

    const created = await adService.create(actor.userId, body);
    await adminService.log(actor.userId, "created-ad", { adId: created.id, advertiser: created.advertiser });

    return reply.code(201).send(created);
  });

  app.patch("/admin/ads/:adId", async (req) => {
    const actor = await requireAdmin(req, "ads");
    const { adId } = z.object({ adId: objectId }).parse(req.params);
    const body = ad.partial().parse(req.body);

    const edited = await adService.edit(adId, body);
    await adminService.log(actor.userId, "edited-ad", { adId });

    return edited;
  });

  app.delete("/admin/ads/:adId", async (req, reply) => {
    const actor = await requireAdmin(req, "ads");
    const { adId } = z.object({ adId: objectId }).parse(req.params);

    await adService.remove(adId);
    await adminService.log(actor.userId, "removed-ad", { adId });

    return reply.code(204).send();
  });

  app.get("/admin/premium", async (req) => {
    await requireAdmin(req, "premium");
    const { term } = premiumSearch.parse(req.query);

    const users = term ? await userRepository.search(term) : await userRepository.findPremium(new Date());
    return users.map(toPremiumAccount);
  });

  app.post("/admin/premium/:userId", async (req) => {
    const actor = await requireAdmin(req, "premium");
    const { userId } = z.object({ userId: objectId }).parse(req.params);
    const { days } = premiumGrant.parse(req.body);

    const user = await planService.grant(userId, days, "grant");
    await announceUserUpdated(user);
    await adminService.log(actor.userId, "granted-premium", { userId, days, until: user.premiumUntil?.toISOString() });

    return toPremiumAccount(user);
  });

  app.delete("/admin/premium/:userId", async (req) => {
    const actor = await requireAdmin(req, "premium");
    const { userId } = z.object({ userId: objectId }).parse(req.params);

    await billingService.endSubscription(userId);
    const user = await planService.revoke(userId);
    await announceUserUpdated(user);
    await adminService.log(actor.userId, "revoked-premium", { userId });

    return toPremiumAccount(user);
  });
}
