import React, { useMemo } from "react";
import { Megaphone } from "lucide-react";
import type { AdView } from "@gravae/shared";

import { clickAd } from "~/@core/application/requests/ads/click-ad";
import { useAds } from "~/@core/application/queries/ads/use-ads";
import { Button } from "~/components/ui/button";
import { usePlanLimits } from "~/features/plan/stores/plan-store";
import { useTranslation } from "~/traducao";

const CONTACT =
  (import.meta.env.VITE_ADS_CONTACT_URL as string | undefined) ?? "mailto:suporte@gravae.io";

/*
  Um anúncio por vez. Quando há mais de um no ar, o sorteio acontece na hora em
  que a coluna se desenha e vale enquanto ela estiver aberta — assim cada um
  aparece para uma parte das pessoas sem ficar trocando na cara de quem lê.
*/
const draw = (ads: AdView[]): AdView | null =>
  ads.length === 0 ? null : (ads[Math.floor(Math.random() * ads.length)] ?? null);

export const AdSlot: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation();
  const adFree = usePlanLimits().adFree;
  const { data: ads } = useAds(!adFree);

  const ad = useMemo(() => draw(ads ?? []), [ads]);

  if (adFree) return null;

  return (
    <section data-gc="ads.ad-slot.section" className={className}>
      <p data-gc="ads.ad-slot.p" className="mb-1.5 text-10 font-semibold uppercase tracking-wide text-ink-faint">
        {t("comum.ads.label")}
      </p>

      {ad ? (
        <a data-gc="ads.ad-slot.a"
          href={ad.linkUrl}
          target="_blank"
          rel="noreferrer sponsored"
          onClick={() => void clickAd(ad.id)}
          title={ad.title}
          className="block overflow-hidden rounded-lg border border-line bg-surface-3 transition hover:brightness-110"
        >
          {ad.imageUrl ? (
            <img data-gc="ads.ad-slot.img"
              src={ad.imageUrl}
              alt={ad.title}
              width={288}
              height={250}
              loading="lazy"
              className="h-[250px] w-full object-cover"
            />
          ) : (
            <span data-gc="ads.ad-slot.span" className="flex h-[250px] flex-col items-center justify-center gap-2 p-4 text-center">
              <span data-gc="ads.ad-slot.span--2" className="text-sm font-semibold">{ad.title}</span>
              {ad.body && <span data-gc="ads.ad-slot.span--3" className="text-xs leading-relaxed text-ink-muted">{ad.body}</span>}
            </span>
          )}

          <span data-gc="ads.ad-slot.span--4" className="block truncate border-t border-line px-2 py-1 text-10 text-ink-faint">
            {ad.advertiser}
          </span>
        </a>
      ) : (
        <div data-gc="ads.ad-slot.div" className="flex h-[250px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface-3 p-4 text-center">
          <Megaphone data-gc="ads.ad-slot.megaphone" size={22} aria-hidden className="text-ink-faint" />

          <p data-gc="ads.ad-slot.p--2" className="text-sm font-semibold">{t("comum.ads.title")}</p>

          <p data-gc="ads.ad-slot.p--3" className="text-xs leading-relaxed text-ink-muted">{t("comum.ads.detail")}</p>

          <Button data-gc="ads.ad-slot.button" asChild size="sm" variant="surface" className="mt-1">
            <a data-gc="ads.ad-slot.a--2" href={CONTACT} target="_blank" rel="noreferrer">
              {t("comum.ads.action")}
            </a>
          </Button>
        </div>
      )}
    </section>
  );
};
