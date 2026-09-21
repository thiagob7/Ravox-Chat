import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import type { AdInput } from "@gravae/shared";

import { createAd, editAd, findAds, removeAd } from "~/@core/application/requests/admin/ads";
import { apiErrorMessage } from "~/@core/lib/api";

const ADS = "painel-anuncios";

export const useAdminAds = (enabled: boolean) =>
  useQuery({ queryKey: [ADS], queryFn: findAds, enabled });

export const useCreateAd = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: AdInput) => createAd(data),
    onSuccess: () => {
      toast.success("Anúncio no ar.");
      void client.invalidateQueries({ queryKey: [ADS] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para criar o anúncio.")),
  });
};

export const useEditAd = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ adId, data }: { adId: string; data: Partial<AdInput> }) => editAd(adId, data),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [ADS] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para salvar o anúncio.")),
  });
};

export const useRemoveAd = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (adId: string) => removeAd(adId),
    onSuccess: () => {
      toast.success("Anúncio removido.");
      void client.invalidateQueries({ queryKey: [ADS] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para remover o anúncio.")),
  });
};
