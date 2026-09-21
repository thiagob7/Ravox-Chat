import { api } from "~/@core/lib/api";

export const clickAd = async (adId: string) => {
  await api.post(`/ads/${adId}/click`);
};
