import { useQuery } from "@tanstack/react-query";

import { findAds } from "~/@core/application/requests/ads/find-ads";

export const useAds = (enabled = true) =>
  useQuery({
    queryKey: ["anuncios"],
    enabled,
    queryFn: findAds,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
