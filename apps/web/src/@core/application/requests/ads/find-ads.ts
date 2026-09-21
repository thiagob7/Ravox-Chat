import type { AdView } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export const findAds = async () => (await api.get<AdView[]>("/ads")).data;
