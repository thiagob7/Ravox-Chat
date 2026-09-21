import React, { useEffect, useRef, useState } from "react";
import { Check, Gift, Infinity as InfinityIcon, Menu, Minus, MonitorPlay, Paperclip } from "lucide-react";
import { PLAN_LIMITS, PASS_PRICE_CENTS, PLAN_NAME, planOf, type BillingInterval, type BillingPrice, type PlanLimits } from "@gravae/shared";

import { useBilling } from "~/@core/application/queries/billing/use-billing";
import { Button } from "~/components/ui/button";
import { comparisonGroups, type Cell } from "~/features/plan/lib/comparison";
import { LottieArt } from "~/components/LottieArt";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { usePlanStore } from "~/features/plan/stores/plan-store";
import { yearlySavingPercent } from "~/features/plan/components/UpgradeModal";
import { cn } from "~/lib/utils";
import { currentLanguage, useTranslation } from "~/traducao";

const INTERVALS: BillingInterval[] = ["year", "month"];

const loadHero = () => import("~/assets/lottie/infinity-hero.json").then((mod) => mod.default);

const SECTIONS = [
  { id: "inicio", key: "configuracoes.subscription.pageStart" },
  { id: "melhor", key: "configuracoes.subscription.pageBest" },
  { id: "planos", key: "configuracoes.subscription.pagePlans" },
  { id: "comparar", key: "configuracoes.subscription.pageCompare" },
] as const;

const money = (cents: number, currency = "brl") =>
  new Intl.NumberFormat(currentLanguage(), { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

export const InfinityPage: React.FC<{ onOpenMenu?: () => void }> = ({ onOpenMenu }) => {
  const { t } = useTranslation();
  const billing = useBilling();
  const openUpgrade = usePlanStore((s) => s.openUpgrade);
  const [chosen, choose] = useState<BillingInterval>("year");
  const [seen, setSeen] = useState<string>(SECTIONS[0].id);
  const scroller = useRef<HTMLElement>(null);

  const status = billing.data;
  const premium = planOf(status?.premiumUntil) === "premium";
  const saving = yearlySavingPercent(status?.prices, status?.pixEnabled === true);

  const priceOf = (interval: BillingInterval): BillingPrice =>
    status?.prices?.automatic[interval] ?? status?.prices?.none[interval] ?? { amount: PASS_PRICE_CENTS[interval], currency: "brl" };

  const goTo = (id: string) => document.getElementById(`infinity-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  /*
    Qual seção o menu acende. O observador mira uma faixa fina logo abaixo do
    cabeçalho, senão duas seções altas ficam visíveis ao mesmo tempo e o menu
    pisca entre as duas enquanto a página rola.
  */
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;

    const eye = new IntersectionObserver(
      (entries) => {
        const inside = entries.find((entry) => entry.isIntersecting);
        if (inside) setSeen(inside.target.id.replace("infinity-", ""));
      },
      { root, rootMargin: "-20% 0px -70% 0px" },
    );

    for (const section of SECTIONS) {
      const target = document.getElementById(`infinity-${section.id}`);
      if (target) eye.observe(target);
    }

    return () => eye.disconnect();
  }, []);

  return (
    <main data-gc="plan.infinity-page.main" ref={scroller} className="mede-a-largura relative min-h-0 flex-1 overflow-y-auto bg-surface-2">
      <header data-gc="plan.infinity-page.header" className="sticky top-0 z-10 flex h-[var(--layout-header-height)] items-center gap-3 border-b border-divisor bg-surface-2/85 px-4 backdrop-blur">
        {onOpenMenu && (
          <button data-gc="plan.infinity-page.button.on-open-menu" type="button" onClick={onOpenMenu} aria-label={t("comum.voltar")} className="text-ink-muted @md:hidden">
            <Menu data-gc="plan.infinity-page.menu" size={18} />
          </button>
        )}

        <span data-gc="plan.infinity-page.span" className="flex items-center gap-2 font-semibold">
          <InfinityIcon data-gc="plan.infinity-page.infinity-icon" size={18} className="text-brand" /> {PLAN_NAME}
        </span>

        <nav data-gc="plan.infinity-page.nav" className="ml-2 hidden items-center gap-1 @lg:flex">
          {SECTIONS.map((section) => (
            <button data-gc="plan.infinity-page.button"
              key={section.id}
              type="button"
              onClick={() => goTo(section.id)}
              className={cn(
                "rounded px-2.5 py-1.5 text-sm transition hover:bg-hover hover:text-ink",
                seen === section.id ? "text-ink" : "text-ink-muted",
              )}
            >
              {t(section.key)}
            </button>
          ))}
        </nav>

        <Button data-gc="plan.infinity-page.button--2" size="sm" variant="surface" className="ml-auto" onClick={() => openUpgrade()}>
          <Gift data-gc="plan.infinity-page.gift" size={15} /> {t("configuracoes.subscription.buyGift")}
        </Button>
      </header>

      <section data-gc="plan.infinity-page.section" id="infinity-inicio" className="relative overflow-hidden px-6 pb-20 pt-16 text-center">
        <div data-gc="plan.infinity-page.div" aria-hidden className="pointer-events-none absolute inset-0 infinity-glow" />
        <Bits data-gc="plan.infinity-page.bits" />

        <div data-gc="plan.infinity-page.div--2" className="relative mx-auto max-w-3xl">
          <LottieArt data-gc="plan.infinity-page.lottie-art" name="infinity-hero" load={loadHero} label={PLAN_NAME} className="mx-auto w-52" />

          <h1 data-gc="plan.infinity-page.h1" className="mt-6 text-balance text-5xl font-black uppercase leading-[0.95] tracking-tight text-ink drop-shadow-[0_2px_18px_rgb(0_0_0/0.35)] @md:text-6xl">
            {t("configuracoes.subscription.pageTitle", { plan: PLAN_NAME })}
          </h1>

          <p data-gc="plan.infinity-page.p" className="mx-auto mt-5 max-w-lg text-balance text-sm text-ink-muted @md:text-base">
            {t("configuracoes.subscription.upgradeSubtitle")}
          </p>

          {premium && status?.premiumUntil ? (
            <p data-gc="plan.infinity-page.p--2" className="mt-8 inline-flex rounded-full border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-medium text-brand">
              {t("configuracoes.subscription.activeUntil", {
                date: new Date(status.premiumUntil).toLocaleDateString(currentLanguage(), { dateStyle: "long" }),
              })}
            </p>
          ) : (
            <div data-gc="plan.infinity-page.div--3" className="mt-9 flex flex-wrap items-center justify-center gap-2">
              <Button data-gc="plan.infinity-page.button--3" size="lg" onClick={() => openUpgrade()}>
                <InfinityIcon data-gc="plan.infinity-page.infinity-icon--2" size={17} /> {t("configuracoes.subscription.subscribe")}
              </Button>
              <Button data-gc="plan.infinity-page.button--4" size="lg" variant="surface" onClick={() => openUpgrade()}>
                <Gift data-gc="plan.infinity-page.gift--2" size={17} /> {t("configuracoes.subscription.buyGift")}
              </Button>
            </div>
          )}

          <p data-gc="plan.infinity-page.p--3" className="mt-5 text-xs text-ink-faint">
            {t("configuracoes.subscription.fromPrice", { amount: money(Math.round(priceOf("year").amount / 12), priceOf("year").currency) })}
          </p>
        </div>
      </section>

      <div data-gc="plan.infinity-page.div--4" className="mx-auto w-full max-w-5xl px-6 pb-24">
        <Perks data-gc="plan.infinity-page.perks" />
        <Plans data-gc="plan.infinity-page.plans" chosen={chosen} choose={choose} priceOf={priceOf} saving={saving} premium={premium} />
        <Comparison data-gc="plan.infinity-page.comparison" />
        <Closing data-gc="plan.infinity-page.closing" premium={premium} />
      </div>
    </main>
  );
};

const Bits: React.FC = () => (
  <div data-gc="plan.infinity-page.div--5" aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    <span data-gc="plan.infinity-page.span--2" className="infinity-bit left-[12%] top-[18%] size-16 bg-brand/25" style={{ animationDelay: "0s" }} />
    <span data-gc="plan.infinity-page.span--3" className="infinity-bit left-[78%] top-[12%] size-10 bg-brand-hover/30" style={{ animationDelay: "1.4s" }} />
    <span data-gc="plan.infinity-page.span--4" className="infinity-bit left-[86%] top-[52%] size-20 bg-brand/20" style={{ animationDelay: "0.7s" }} />
    <span data-gc="plan.infinity-page.span--5" className="infinity-bit left-[6%] top-[62%] size-12 bg-brand-hover/25" style={{ animationDelay: "2.1s" }} />
  </div>
);

const Perks: React.FC = () => {
  const { t } = useTranslation();
  const limits = PLAN_LIMITS.premium;
  const free = PLAN_LIMITS.free;

  const megabytes = (bytes: number) => Math.round(bytes / (1024 * 1024));
  const size = (bytes: number) => t("configuracoes.subscription.megabytesValue", { value: megabytes(bytes) });

  return (
    <section data-gc="plan.infinity-page.section--2" id="infinity-melhor" className="scroll-mt-20 pt-10">
      <Reveal data-gc="plan.infinity-page.reveal">
        <Title data-gc="plan.infinity-page.title">{t("configuracoes.subscription.pageBest")}</Title>
      </Reveal>

      <div data-gc="plan.infinity-page.div--6" className="mt-10 space-y-4">
        <Perk data-gc="plan.infinity-page.perk"
          title={t("configuracoes.subscription.filesTitle")}
          text={t("configuracoes.subscription.filesText")}
          visual={
            <>
              <Numeral data-gc="plan.infinity-page.numeral">{size(limits.attachmentBytes)}</Numeral>

              <div data-gc="plan.infinity-page.div--7" className="mt-5 w-full max-w-sm space-y-2">
                <Chip data-gc="plan.infinity-page.chip" name="show-do-ano.mp4" size={size(limits.attachmentBytes)} />
                <Chip data-gc="plan.infinity-page.chip--2" name="foto.png" size={size(free.attachmentBytes)} muted />
              </div>
            </>
          }
        />

        <Perk data-gc="plan.infinity-page.perk--2"
          flip
          title={t("configuracoes.subscription.videoTitle")}
          text={t("configuracoes.subscription.videoText")}
          visual={
            <div data-gc="plan.infinity-page.div--8" className="w-full max-w-sm overflow-hidden rounded-2xl border border-line-sutil bg-surface-0 shadow-2xl shadow-sombra">
              <div data-gc="plan.infinity-page.div--9" className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-brand/40 via-brand/10 to-brand-hover/20">
                <MonitorPlay data-gc="plan.infinity-page.monitor-play" size={38} className="text-ink/85" />

                <span data-gc="plan.infinity-page.span--6" className="absolute bottom-2.5 left-2.5 flex gap-1.5">
                  <Tag data-gc="plan.infinity-page.tag">{`${limits.screenResolutions.at(-1)}p`}</Tag>
                  <Tag data-gc="plan.infinity-page.tag--2">{`${limits.screenFrameRates.at(-1)} fps`}</Tag>
                </span>
              </div>

              <div data-gc="plan.infinity-page.div--10" className="flex items-center gap-2 px-3 py-2.5">
                <span data-gc="plan.infinity-page.span--7" className="size-6 rounded-full bg-surface-4" />
                <span data-gc="plan.infinity-page.span--8" className="h-1.5 flex-1 rounded-full bg-surface-4" />
                <span data-gc="plan.infinity-page.span--9" className="size-2 rounded-full bg-online" />
              </div>
            </div>
          }
        />

        <Perk data-gc="plan.infinity-page.perk--3"
          title={t("configuracoes.subscription.messageTitle")}
          text={t("configuracoes.subscription.messageText")}
          visual={
            <>
              <Numeral data-gc="plan.infinity-page.numeral--2">{limits.messageLength.toLocaleString(currentLanguage())}</Numeral>

              <div data-gc="plan.infinity-page.div--11" className="mt-5 w-full max-w-sm rounded-2xl border border-line-sutil bg-surface-0 p-4">
                <div data-gc="plan.infinity-page.div--12" className="space-y-2">
                  <span data-gc="plan.infinity-page.span--10" className="block h-1.5 w-full rounded-full bg-surface-4" />
                  <span data-gc="plan.infinity-page.span--11" className="block h-1.5 w-11/12 rounded-full bg-surface-4" />
                  <span data-gc="plan.infinity-page.span--12" className="block h-1.5 w-9/12 rounded-full bg-surface-4" />
                  <span data-gc="plan.infinity-page.span--13" className="block h-1.5 w-6/12 rounded-full bg-surface-4" />
                </div>
              </div>
            </>
          }
        />

        <Perk data-gc="plan.infinity-page.perk--4"
          flip
          title={t("configuracoes.subscription.colorsTitle")}
          text={t("configuracoes.subscription.colorsText")}
          visual={
            <div data-gc="plan.infinity-page.div--13" className="w-full max-w-sm">
              <div data-gc="plan.infinity-page.div--14" className="flex h-36 overflow-hidden rounded-2xl border border-line-sutil shadow-2xl shadow-sombra">
                <span data-gc="plan.infinity-page.span--14" className="w-8 shrink-0 bg-surface-0" />
                <span data-gc="plan.infinity-page.span--15" className="w-20 shrink-0 bg-surface-1" />

                <span data-gc="plan.infinity-page.span--16" className="flex-1 bg-surface-2 p-3">
                  <span data-gc="plan.infinity-page.span--17" className="block h-1.5 w-10/12 rounded-full bg-surface-4" />
                  <span data-gc="plan.infinity-page.span--18" className="mt-2 block h-1.5 w-7/12 rounded-full bg-surface-4" />
                  <span data-gc="plan.infinity-page.span--19" className="mt-4 block h-7 w-full rounded-lg bg-brand/25" />
                </span>
              </div>

              <div data-gc="plan.infinity-page.div--15" className="mt-3 flex items-center gap-2">
                {["bg-brand", "bg-online", "bg-idle", "bg-danger", "bg-link"].map((tone) => (
                  <span data-gc="plan.infinity-page.span--20" key={tone} className={cn("size-7 rounded-lg", tone)} />
                ))}
                <span data-gc="plan.infinity-page.span--21" className="size-7 rounded-lg border border-dashed border-line" />
              </div>
            </div>
          }
        />

        <Perk data-gc="plan.infinity-page.perk--5"
          title={t("configuracoes.subscription.profileTitle")}
          text={t("configuracoes.subscription.profileText")}
          visual={
            <div data-gc="plan.infinity-page.div--16" className="flex w-full max-w-sm items-end justify-center gap-3">
              {["bg-brand", "bg-brand-hover", "bg-surface-4"].map((tone, index) => (
                <div data-gc="plan.infinity-page.div--17"
                  key={tone}
                  className={cn(
                    "flex-1 rounded-2xl border border-line-sutil bg-surface-0 p-3 shadow-lg shadow-sombra",
                    index === 1 && "-translate-y-3",
                  )}
                >
                  <span data-gc="plan.infinity-page.span--22" className={cn("block size-10 rounded-full", tone)} />
                  <span data-gc="plan.infinity-page.span--23" className="mt-3 block h-1.5 w-full rounded-full bg-surface-4" />
                  <span data-gc="plan.infinity-page.span--24" className="mt-1.5 block h-1.5 w-2/3 rounded-full bg-surface-4" />
                </div>
              ))}
            </div>
          }
        />
      </div>
    </section>
  );
};

const Plans: React.FC<{
  chosen: BillingInterval;
  choose: (interval: BillingInterval) => void;
  priceOf: (interval: BillingInterval) => BillingPrice;
  saving: number | null;
  premium: boolean;
}> = ({ chosen, choose, priceOf, saving, premium }) => {
  const { t } = useTranslation();
  const openUpgrade = usePlanStore((s) => s.openUpgrade);

  const price = priceOf(chosen);
  const perMonth = money(Math.round(priceOf("year").amount / 12), priceOf("year").currency);

  /*
    Os dois cartões listam as MESMAS quatro linhas, cada um com o seu número.
    Lado a lado, a conta se faz sozinha: 25 MB contra 500 MB, 2.000 contra
    4.000. Antes só o cartão grátis tinha lista, e o pago era um preço solto.
  */
  const facts = (limits: PlanLimits) => [
    {
      name: t("configuracoes.subscription.attachmentRow"),
      value: t("configuracoes.subscription.megabytesValue", { value: Math.round(limits.attachmentBytes / (1024 * 1024)) }),
    },
    {
      name: t("configuracoes.subscription.messageRow"),
      value: limits.messageLength.toLocaleString(currentLanguage()),
    },
    {
      name: t("configuracoes.subscription.screenRow"),
      value: t("configuracoes.subscription.screenValue", {
        resolution: `${limits.screenResolutions.at(-1)}p`,
        fps: limits.screenFrameRates.at(-1) ?? 30,
      }),
    },
    {
      name: t("configuracoes.subscription.communitiesRow"),
      value: limits.communities.toLocaleString(currentLanguage()),
    },
  ];

  return (
    <section data-gc="plan.infinity-page.section--3" id="infinity-planos" className="scroll-mt-20 pt-20">
      <Reveal data-gc="plan.infinity-page.reveal--2">
        <Title data-gc="plan.infinity-page.title--2">{t("configuracoes.subscription.pageChoose")}</Title>
      </Reveal>

      <div data-gc="plan.infinity-page.div--18" className="mt-10 grid items-stretch gap-4 @2xl:grid-cols-[1fr_1.25fr]">
        <Reveal data-gc="plan.infinity-page.reveal--3" className="h-full">
          <article data-gc="plan.infinity-page.article" className="flex h-full flex-col rounded-3xl border border-line-sutil bg-surface-1 p-7">
            <p data-gc="plan.infinity-page.p--4" className="text-sm font-semibold text-ink-muted">{t("configuracoes.subscription.freeColumn")}</p>

            <p data-gc="plan.infinity-page.p--5" className="mt-3 text-4xl font-black tabular-nums tracking-tight">{money(0)}</p>
            <p data-gc="plan.infinity-page.p--6" className="mt-1.5 text-xs text-ink-faint">{t("configuracoes.subscription.freeDetail")}</p>

            <ul data-gc="plan.infinity-page.ul" className="mt-7 space-y-3 text-sm">
              {facts(PLAN_LIMITS.free).map((fact) => (
                <li data-gc="plan.infinity-page.li" key={fact.name} className="flex items-baseline gap-2.5 text-ink-muted">
                  <Check data-gc="plan.infinity-page.check" size={15} className="shrink-0 translate-y-0.5 text-ink-faint" />
                  <span data-gc="plan.infinity-page.span--25" className="min-w-0 flex-1">{fact.name}</span>
                  <span data-gc="plan.infinity-page.span--26" className="shrink-0 text-xs tabular-nums">{fact.value}</span>
                </li>
              ))}
            </ul>

            {!premium && (
              <p data-gc="plan.infinity-page.p--7" className="mt-auto pt-8 text-center text-xs font-medium text-ink-faint">
                {t("configuracoes.subscription.currentPlan")}
              </p>
            )}
          </article>
        </Reveal>

        <Reveal data-gc="plan.infinity-page.reveal--4" className="h-full">
          <article data-gc="plan.infinity-page.article--2" className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-brand/50 bg-surface-1 p-7 shadow-[0_0_80px_-40px_var(--color-brand)]">
            <div data-gc="plan.infinity-page.div--19" aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand/20 to-transparent" />

            <div data-gc="plan.infinity-page.div--20" className="relative flex items-center gap-2">
              <InfinityIcon data-gc="plan.infinity-page.infinity-icon--3" size={19} className="text-brand" />
              <p data-gc="plan.infinity-page.p--8" className="text-sm font-semibold">{PLAN_NAME}</p>

              <span data-gc="plan.infinity-page.span--27" className="ml-auto rounded-full bg-brand px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wide text-sobre-marca">
                {t("configuracoes.subscription.popular")}
              </span>
            </div>

            <p data-gc="plan.infinity-page.p--9" className="relative mt-3 flex items-baseline gap-1.5">
              <span data-gc="plan.infinity-page.span--28" className="text-4xl font-black tabular-nums tracking-tight">{money(price.amount, price.currency)}</span>
              <span data-gc="plan.infinity-page.span--29" className="text-sm font-medium text-ink-faint">
                {t(chosen === "year" ? "configuracoes.subscription.perYear" : "configuracoes.subscription.perMonth")}
              </span>
            </p>

            <p data-gc="plan.infinity-page.p--10" className="relative mt-1.5 text-xs text-ink-faint">
              {chosen === "year"
                ? t("configuracoes.subscription.yearlyDetail", { amount: perMonth })
                : t("configuracoes.subscription.monthlyDetail")}
            </p>

            <fieldset data-gc="plan.infinity-page.fieldset" className="relative mt-6 space-y-2">
              {INTERVALS.map((interval) => {
                const value = priceOf(interval);
                const active = chosen === interval;

                return (
                  <button data-gc="plan.infinity-page.button--5"
                    key={interval}
                    type="button"
                    aria-pressed={active}
                    onClick={() => choose(interval)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                      active ? "border-brand bg-brand/10" : "border-line bg-surface-2 hover:border-brand/40",
                    )}
                  >
                    <span data-gc="plan.infinity-page.span--30" className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border", active ? "border-brand" : "border-line")}>
                      {active && <span data-gc="plan.infinity-page.span--31" className="size-2 rounded-full bg-brand" />}
                    </span>

                    <span data-gc="plan.infinity-page.span--32" className="min-w-0">
                      <span data-gc="plan.infinity-page.span--33" className="block font-medium">
                        {t(interval === "year" ? "configuracoes.subscription.yearly" : "configuracoes.subscription.monthly")}
                      </span>

                      {interval === "year" && (
                        <span data-gc="plan.infinity-page.span--34" className="block text-xs text-ink-faint">{`${perMonth} · ${t("configuracoes.subscription.perMonth")}`}</span>
                      )}
                    </span>

                    {interval === "year" && saving && (
                      <span data-gc="plan.infinity-page.span--35" className="shrink-0 rounded-full bg-online/15 px-2 py-0.5 text-[0.6875rem] font-semibold text-online">
                        {t("configuracoes.subscription.save", { percent: saving })}
                      </span>
                    )}

                    <span data-gc="plan.infinity-page.span--36" className="ml-auto shrink-0 tabular-nums text-ink-muted">{money(value.amount, value.currency)}</span>
                  </button>
                );
              })}
            </fieldset>

            <ul data-gc="plan.infinity-page.ul--2" className="relative mt-6 space-y-3 text-sm">
              {facts(PLAN_LIMITS.premium).map((fact) => (
                <li data-gc="plan.infinity-page.li--2" key={fact.name} className="flex items-baseline gap-2.5">
                  <Check data-gc="plan.infinity-page.check--2" size={15} className="shrink-0 translate-y-0.5 text-brand" />
                  <span data-gc="plan.infinity-page.span--37" className="min-w-0 flex-1 text-ink-muted">{fact.name}</span>
                  <span data-gc="plan.infinity-page.span--38" className="shrink-0 text-xs font-semibold tabular-nums text-brand">{fact.value}</span>
                </li>
              ))}
            </ul>

            {premium ? (
              <p data-gc="plan.infinity-page.p--11" className="relative mt-auto pt-8 text-center text-xs font-medium text-brand">
                {t("configuracoes.subscription.currentPlan")}
              </p>
            ) : (
              <div data-gc="plan.infinity-page.div--21" className="relative mt-auto pt-8">
                <Button data-gc="plan.infinity-page.button--6" className="w-full" size="lg" onClick={() => openUpgrade(chosen)}>
                  <InfinityIcon data-gc="plan.infinity-page.infinity-icon--4" size={17} /> {t("configuracoes.subscription.subscribe")}
                </Button>

                <p data-gc="plan.infinity-page.p--12" className="mt-3 text-center text-xs leading-relaxed text-ink-faint">{t("configuracoes.subscription.legal")}</p>
              </div>
            )}
          </article>
        </Reveal>
      </div>
    </section>
  );
};

const Comparison: React.FC = () => {
  const { t } = useTranslation();
  const groups = comparisonGroups(t);

  const cell = (value: Cell, highlight: boolean) =>
    value === true ? (
      <Check data-gc="plan.infinity-page.check--3" size={16} className={cn("mx-auto", highlight ? "text-brand" : "text-online")} />
    ) : value === false ? (
      <Minus data-gc="plan.infinity-page.minus" size={16} className="mx-auto text-ink-faint" />
    ) : (
      value
    );

  return (
    <section data-gc="plan.infinity-page.section--4" id="infinity-comparar" className="scroll-mt-16 pt-20">
      <Reveal data-gc="plan.infinity-page.reveal--5"><Title data-gc="plan.infinity-page.title--3">{t("configuracoes.subscription.compare")}</Title></Reveal>

      <div data-gc="plan.infinity-page.div--22" className="mt-8 overflow-hidden rounded-2xl border border-line-sutil bg-surface-1">
        <table data-gc="plan.infinity-page.table" className="w-full text-sm">
          <thead data-gc="plan.infinity-page.thead">
            <tr data-gc="plan.infinity-page.tr" className="border-b border-line-sutil">
              <th data-gc="plan.infinity-page.th" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-faint">
                {t("configuracoes.subscription.featureColumn")}
              </th>
              <th data-gc="plan.infinity-page.th--2" className="w-28 px-3 py-3 text-center text-xs font-medium uppercase tracking-wide text-ink-faint">
                {t("configuracoes.subscription.freeColumn")}
              </th>
              <th data-gc="plan.infinity-page.th--3" className="w-32 border-x border-brand/25 bg-brand/10 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-brand">
                {PLAN_NAME}
              </th>
            </tr>
          </thead>

          {groups.map((group) => (
            <tbody data-gc="plan.infinity-page.tbody" key={group.title} className="divide-y divide-line-sutil border-b border-line-sutil last:border-0">
              <tr data-gc="plan.infinity-page.tr--2">
                <td data-gc="plan.infinity-page.td" colSpan={2} className="bg-surface-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {group.title}
                </td>
                <td data-gc="plan.infinity-page.td--2" className="border-x border-brand/25 bg-brand/10" />
              </tr>

              {group.rows.map((row) => {
                const free = row.value(PLAN_LIMITS.free);
                const premium = row.value(PLAN_LIMITS.premium);

                return (
                  <tr data-gc="plan.infinity-page.tr--3" key={row.name}>
                    <td data-gc="plan.infinity-page.td--3" className="px-4 py-2.5">{row.name}</td>
                    <td data-gc="plan.infinity-page.td--4" className="px-3 py-2.5 text-center tabular-nums text-ink-muted">{cell(free, false)}</td>
                    <td data-gc="plan.infinity-page.td--5"
                      className={cn(
                        "border-x border-brand/25 bg-brand/10 px-3 py-2.5 text-center tabular-nums",
                        free !== premium ? "font-semibold text-brand" : "text-ink-muted",
                      )}
                    >
                      {cell(premium, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
};

const Closing: React.FC<{ premium: boolean }> = ({ premium }) => {
  const { t } = useTranslation();
  const openUpgrade = usePlanStore((s) => s.openUpgrade);

  if (premium) return null;

  return (
    <section data-gc="plan.infinity-page.section--5" className="relative mt-20 overflow-hidden rounded-3xl border border-line-sutil px-6 py-16 text-center">
      <div data-gc="plan.infinity-page.div--23" aria-hidden className="pointer-events-none absolute inset-0 infinity-glow" />

      <h2 data-gc="plan.infinity-page.h2" className="relative text-balance text-3xl font-black uppercase leading-tight tracking-tight @md:text-4xl">
        {t("configuracoes.subscription.closingTitle")}
      </h2>

      <div data-gc="plan.infinity-page.div--24" className="relative mt-7 flex flex-wrap items-center justify-center gap-2">
        <Button data-gc="plan.infinity-page.button--7" size="lg" onClick={() => openUpgrade()}>
          <InfinityIcon data-gc="plan.infinity-page.infinity-icon--5" size={17} /> {t("configuracoes.subscription.subscribe")}
        </Button>
        <Button data-gc="plan.infinity-page.button--8" size="lg" variant="surface" onClick={() => openUpgrade()}>
          <Gift data-gc="plan.infinity-page.gift--3" size={17} /> {t("configuracoes.subscription.buyGift")}
        </Button>
      </div>
    </section>
  );
};

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 data-gc="plan.infinity-page.h2--2" className="text-center text-2xl font-black uppercase tracking-tight @md:text-3xl">{children}</h2>
);

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span data-gc="plan.infinity-page.span--39" className="rounded-md bg-brand/15 px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-brand">{children}</span>
);

const Chip: React.FC<{ name: string; size: string; muted?: boolean }> = ({ name, size, muted }) => (
  <div data-gc="plan.infinity-page.div--25" className={cn("flex items-center gap-2.5 rounded-xl border border-line-sutil bg-surface-0 px-3 py-2.5", muted && "opacity-45")}>
    <Paperclip data-gc="plan.infinity-page.paperclip" size={16} className={muted ? "text-ink-faint" : "text-brand"} />

    <div data-gc="plan.infinity-page.div--26" className="min-w-0 flex-1">
      <p data-gc="plan.infinity-page.p--13" className="truncate text-xs font-medium">{name}</p>
      <span data-gc="plan.infinity-page.span--40" className="mt-1.5 block h-1 overflow-hidden rounded-full bg-surface-4">
        <span data-gc="plan.infinity-page.span--41" className={cn("block h-full rounded-full", muted ? "w-2/12 bg-ink-faint" : "w-full bg-brand")} />
      </span>
    </div>

    <span data-gc="plan.infinity-page.span--42" className={cn("shrink-0 text-xs font-semibold tabular-nums", muted ? "text-ink-faint" : "text-brand")}>{size}</span>
  </div>
);

const Perk: React.FC<{
  title: string;
  text: string;
  visual: React.ReactNode;
  flip?: boolean;
}> = ({ title, text, visual, flip }) => (
  <Reveal data-gc="plan.infinity-page.reveal--6">
    <article data-gc="plan.infinity-page.article--3" className="grid items-center gap-6 overflow-hidden rounded-3xl border border-line-sutil bg-surface-1 p-6 @2xl:grid-cols-2 @2xl:gap-10 @2xl:p-10">
      <div data-gc="plan.infinity-page.div--27"
        className={cn(
          "relative flex min-h-[13rem] flex-col items-center justify-center overflow-hidden rounded-2xl border border-line-sutil bg-surface-2 p-6",
          flip && "@2xl:order-2",
        )}
      >
        <div data-gc="plan.infinity-page.div--28" aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-brand-hover/10" />
        <div data-gc="plan.infinity-page.div--29" className="relative flex w-full flex-col items-center">{visual}</div>
      </div>

      <div data-gc="plan.infinity-page.div--30">
        <h3 data-gc="plan.infinity-page.h3" className="text-xl font-bold @2xl:text-2xl">{title}</h3>
        <p data-gc="plan.infinity-page.p--14" className="mt-3 text-sm leading-relaxed text-ink-muted @2xl:text-base">{text}</p>
      </div>
    </article>
  </Reveal>
);

const Numeral: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p data-gc="plan.infinity-page.p--15" className="bg-gradient-to-br from-ink to-brand bg-clip-text text-center text-4xl font-black tabular-nums tracking-tight text-transparent @2xl:text-5xl">
    {children}
  </p>
);

/*
  Cada bloco sobe um palmo quando entra na tela, uma vez só. Quem pediu menos
  movimento, ou quem pediu no sistema, já nasce no lugar — a classe nem entra.
*/
const Reveal: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const box = useRef<HTMLDivElement>(null);
  const still = useAppearance((state) => state.reduceAnimation);

  useEffect(() => {
    const target = box.current;
    if (!target || still) return;

    const eye = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          entry.target.classList.add("apareceu");
          eye.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    eye.observe(target);

    return () => eye.disconnect();
  }, [still]);

  return (
    <div data-gc="plan.infinity-page.div--31" ref={box} className={cn(!still && "sobe-ao-entrar", className)}>
      {children}
    </div>
  );
};
