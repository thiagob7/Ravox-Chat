import type { Ad } from "@prisma/client";
import type { AdAdminView, AdInput, AdView } from "@gravae/shared";

import { NotFoundError } from "~/lib/http.js";
import { adRepository } from "~/repositories/ad-repository.js";
import { planService } from "~/services/plan-service.js";

const toView = (ad: Ad): AdView => ({
  id: ad.id,
  advertiser: ad.advertiser,
  title: ad.title,
  body: ad.body,
  imageUrl: ad.imageUrl,
  linkUrl: ad.linkUrl,
});

const toAdminView = (ad: Ad): AdAdminView => ({
  ...toView(ad),
  active: ad.active,
  startsAt: ad.startsAt ? ad.startsAt.toISOString() : null,
  endsAt: ad.endsAt ? ad.endsAt.toISOString() : null,
  impressions: ad.impressions,
  clicks: ad.clicks,
  createdAt: ad.createdAt.toISOString(),
});

const date = (value: string | null | undefined) => (value ? new Date(value) : null);

export const adService = {
  /// O que o aplicativo mostra. Quem tem Infinity não recebe nada.
  async running(userId: string): Promise<AdView[]> {
    if (await planService.hasFeature(userId, "adFree")) return [];

    const ads = await adRepository.findRunning(new Date());
    if (ads.length === 0) return [];

    await adRepository.addImpressions(ads.map((ad) => ad.id));

    return ads.map(toView);
  },

  async click(adId: string) {
    const ad = await adRepository.findById(adId);
    if (!ad) throw new NotFoundError("Anúncio não encontrado");

    await adRepository.addClick(adId);
  },

  async list(): Promise<AdAdminView[]> {
    const ads = await adRepository.findMany();
    return ads.map(toAdminView);
  },

  async create(createdById: string, input: AdInput): Promise<AdAdminView> {
    const ad = await adRepository.create({
      advertiser: input.advertiser,
      title: input.title,
      body: input.body ?? null,
      imageUrl: input.imageUrl ?? null,
      linkUrl: input.linkUrl,
      active: input.active ?? true,
      startsAt: date(input.startsAt),
      endsAt: date(input.endsAt),
      createdById,
    });

    return toAdminView(ad);
  },

  async edit(adId: string, input: Partial<AdInput>): Promise<AdAdminView> {
    const current = await adRepository.findById(adId);
    if (!current) throw new NotFoundError("Anúncio não encontrado");

    const ad = await adRepository.update(adId, {
      ...(input.advertiser === undefined ? {} : { advertiser: input.advertiser }),
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.body === undefined ? {} : { body: input.body ?? null }),
      ...(input.imageUrl === undefined ? {} : { imageUrl: input.imageUrl ?? null }),
      ...(input.linkUrl === undefined ? {} : { linkUrl: input.linkUrl }),
      ...(input.active === undefined ? {} : { active: input.active }),
      ...(input.startsAt === undefined ? {} : { startsAt: date(input.startsAt) }),
      ...(input.endsAt === undefined ? {} : { endsAt: date(input.endsAt) }),
    });

    return toAdminView(ad);
  },

  async remove(adId: string) {
    const { count } = await adRepository.deleteOne(adId);
    if (count === 0) throw new NotFoundError("Anúncio não encontrado");
  },
};
