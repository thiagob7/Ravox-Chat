/// Os anúncios da casa: quadros vendidos na coluna "Ativo agora". Quem cadastra
/// é o painel de administração; quem vê é só quem está no plano grátis.

export const AD_LIMITS = {
  advertiser: 60,
  title: 60,
  body: 160,
  url: 500,
} as const;

/// A medida do quadro na tela. A imagem enviada deve chegar nesta proporção.
export const AD_SIZE = { width: 288, height: 250 } as const;

export interface AdView {
  id: string;
  advertiser: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string;
}

export interface AdAdminView extends AdView {
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  impressions: number;
  clicks: number;
  createdAt: string;
}

export interface AdInput {
  advertiser: string;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  linkUrl: string;
  active?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

/// No ar agora: ligado e dentro do período, se houver período.
export const adRunning = (
  ad: { active: boolean; startsAt: string | Date | null; endsAt: string | Date | null },
  now: number = Date.now(),
): boolean => {
  if (!ad.active) return false;
  if (ad.startsAt && new Date(ad.startsAt).getTime() > now) return false;
  if (ad.endsAt && new Date(ad.endsAt).getTime() <= now) return false;

  return true;
};
