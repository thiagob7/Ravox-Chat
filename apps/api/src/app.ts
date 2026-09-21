import { createServer } from "node:http";

import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import sensible from "@fastify/sensible";
import { env, isDev } from "~/env.js";
import { authPlugin } from "~/plugins/auth.js";
import { rateLimitPlugin } from "~/plugins/rate-limit.js";
import { swaggerPlugin } from "~/plugins/swagger.js";
import { errorAnswer } from "~/lib/erro-de-rota.js";
import { HEADER_CEILING } from "~/lib/limites-http.js";
import { corsOrigin } from "~/lib/origins.js";
import { healthRoutes } from "~/routes/health.js";
import { statusPublicRoutes } from "~/routes/status-publico.js";
import { adminRoutes } from "~/routes/admin.js";
import { adRoutes } from "~/routes/ads.js";
import { statusRoutes } from "~/routes/status.js";
import { authRoutes } from "~/routes/auth.js";
import { meRoutes } from "~/routes/me.js";
import { guildRoutes } from "~/routes/guilds.js";
import { roleRoutes } from "~/routes/roles.js";
import { webhookRoutes, publicWebhookRoutes } from "~/routes/webhooks.js";
import { expressionRoutes } from "~/routes/expressions.js";
import { moderationRoutes } from "~/routes/moderation.js";
import { forumRoutes } from "~/routes/forum.js";
import { gifRoutes } from "~/routes/gifs.js";
import { attachmentRoutes } from "~/routes/anexos.js";
import { discoveryRoutes } from "~/routes/descoberta.js";
import { themeRoutes } from "~/routes/temas.js";
import { inviteRoutes } from "~/routes/invites.js";
import { messageRoutes } from "~/routes/messages.js";
import { uploadRoutes } from "~/routes/uploads.js";
import { voiceRoutes } from "~/routes/voice.js";
import { friendRoutes } from "~/routes/friends.js";
import { userRoutes } from "~/routes/users.js";
import { botRoutes } from "~/routes/bots.js";
import { oauthRoutes } from "~/routes/oauth.js";
import { botApiRoutes } from "~/routes/bot-api.js";
import { embedRoutes } from "~/routes/embeds.js";
import { billingRoutes, billingWebhookRoutes, mercadoPagoWebhookRoutes, publicGiftRoutes } from "~/routes/billing.js";

export async function buildApp() {
  const app = Fastify({
    serverFactory: (answer) => createServer({ maxHeaderSize: HEADER_CEILING }, answer),
    logger: isDev
      ? { transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } } }
      : true,
    trustProxy: ["127.0.0.1", "::1"],
  });

  app.addHook("onSend", async (_req, reply) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    if (!isDev) reply.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  });

  await app.register(sensible);

  await app.register(cors, {
    origin: (origin, cb) => corsOrigin(origin, cb),
    credentials: true,
  });

  await app.register(cookie, { secret: env.COOKIE_SECRET });
  await app.register(authPlugin);

  await app.register(rateLimitPlugin);
  await app.register(swaggerPlugin);

  app.setErrorHandler((error, req, reply) => {
    const answer = errorAnswer(error);
    if (answer.log) req.log.error(error as Error);

    return reply.code(answer.status).send(answer.body);
  });

  await app.register(
    async (api) => {
      await api.register(healthRoutes);
      await api.register(statusPublicRoutes);
      await api.register(statusRoutes);
      await api.register(adminRoutes);
      await api.register(adRoutes);
      await api.register(authRoutes);
      await api.register(meRoutes);
      await api.register(guildRoutes);
      await api.register(botRoutes);
      await api.register(oauthRoutes);
      await api.register(botApiRoutes);
      await api.register(roleRoutes);
      await api.register(inviteRoutes);
      await api.register(attachmentRoutes);
      await api.register(discoveryRoutes);
      await api.register(themeRoutes);
      await api.register(messageRoutes);
      await api.register(uploadRoutes);
      await api.register(voiceRoutes);
      await api.register(friendRoutes);
      await api.register(userRoutes);
      await api.register(webhookRoutes);
      await api.register(expressionRoutes);
      await api.register(moderationRoutes);
      await api.register(forumRoutes);
      await api.register(gifRoutes);
      await api.register(embedRoutes);
      await api.register(billingRoutes);
      await api.register(billingWebhookRoutes);
      await api.register(mercadoPagoWebhookRoutes);
      await api.register(publicGiftRoutes);
      await api.register(publicWebhookRoutes);
    },
    { prefix: "/api" },
  );

  return app;
}

export type App = Awaited<ReturnType<typeof buildApp>>;
