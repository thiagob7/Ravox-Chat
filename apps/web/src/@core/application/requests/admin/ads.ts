import type { AdAdminView, AdInput } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export const findAds = async () => (await api.get<AdAdminView[]>("/admin/ads")).data;

export const createAd = async (data: AdInput) => (await api.post<AdAdminView>("/admin/ads", data)).data;

export const editAd = async (adId: string, data: Partial<AdInput>) =>
  (await api.patch<AdAdminView>(`/admin/ads/${adId}`, data)).data;

export const removeAd = async (adId: string) => {
  await api.delete(`/admin/ads/${adId}`);
};
