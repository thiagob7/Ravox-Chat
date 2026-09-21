import React, { useState } from "react";
import { Check, CreditCard, Infinity as InfinityIcon, QrCode } from "lucide-react";
import {
  PLAN_LIMITS,
  PASS_PRICE_CENTS,
  PLAN_NAME,
  planOf,
  type PurchaseTarget,
  type BillingInterval,
  type BillingPrice,
  type BillingPrices,
  type CardIntent,
  type PixChargeView,
  type PlanLimits,
} from "@gravae/shared";

import {
  useBilling,
  useCreatePixCharge,
  useStartCardPayment,
} from "~/@core/application/queries/billing/use-billing";
import { CardPayment } from "~/features/plan/components/CardPayment";
import { comparisonRows, type Cell } from "~/features/plan/lib/comparison";
import { PixPayment } from "~/features/plan/components/PixPayment";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { usePlanStore } from "~/features/plan/stores/plan-store";
import { cn } from "~/lib/utils";
import { currentLanguage, useTranslation } from "~/traducao";

const INTERVALS: BillingInterval[] = ["month", "year"];

const megabytes = (bytes: number) => Math.round(bytes / (1024 * 1024));

type PayOption = "automatic" | "pix";

const priceOf = (prices: BillingPrices | null | undefined, interval: BillingInterval, pix = false): BillingPrice | null =>
  prices?.automatic[interval] ?? prices?.none[interval] ?? (pix ? { amount: PASS_PRICE_CENTS[interval], currency: "brl" } : null);

export function yearlySavingPercent(prices: BillingPrices | null | undefined, pix = false): number | null {
  const month = priceOf(prices, "month", pix);
  const year = priceOf(prices, "year", pix);
  if (!month || !year || month.currency !== year.currency || month.amount <= 0) return null;

  const percent = Math.round((1 - year.amount / (month.amount * 12)) * 100);
  return percent > 0 ? percent : null;
}

export const UpgradeModal: React.FC = () => {
  const open = usePlanStore((s) => s.upgradeOpen);
  const close = usePlanStore((s) => s.closeUpgrade);

  return (
    <Dialog data-gc="plan.upgrade-modal.dialog" open={open} onOpenChange={(state) => !state && close()}>
      <DialogContent data-gc="plan.upgrade-modal.dialog-content" className="max-w-2xl">
        {open && <UpgradeBody data-gc="plan.upgrade-modal.upgrade-body.close" onDone={close} />}
      </DialogContent>
    </Dialog>
  );
};

const UpgradeBody: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { t } = useTranslation();
  const billing = useBilling();
  const createPix = useCreatePixCharge();
  const startCard = useStartCardPayment();
  const openSettings = useSettings((s) => s.open);

  const wanted = usePlanStore((s) => s.upgradeInterval);

  const [target, setTarget] = useState<PurchaseTarget>("me");
  const [interval, setBillingInterval] = useState<BillingInterval>(wanted ?? "year");
  const [renewal, setRenewal] = useState<PayOption | null>(null);
  const [pixCharge, setPixCharge] = useState<PixChargeView | null>(null);
  const [cardIntent, setCardIntent] = useState<CardIntent | null>(null);

  const status = billing.data;
  const prices = status?.prices;
  const pixEnabled = status?.pixEnabled === true;
  const saving = yearlySavingPercent(prices, pixEnabled);
  const premium = planOf(status?.premiumUntil) === "premium";

  const money = (price: BillingPrice) =>
    new Intl.NumberFormat(currentLanguage(), { style: "currency", currency: price.currency.toUpperCase() }).format(
      price.amount / 100,
    );

  /*
    O cartão é digitado AQUI DENTRO, nos campos da Stripe embutidos no modal.

    Antes, quando a chave pública não chegava, a gente mandava a pessoa para a
    página de pagamento da Stripe, fora do app. Isso sai da nossa tela, muda de
    marca no meio da compra e é o oposto do que se quer. Agora, sem a chave, o
    cartão simplesmente não é oferecido — e se não sobrar nenhuma forma de
    pagamento, o modal diz que a assinatura não está disponível.

    Sem a chave no `.env` da API (`STRIPE_PUBLISHABLE_KEY`), só o Pix aparece.
  */
  const renewals = (["automatic", "pix"] as const).filter((option) =>
    option === "pix"
      ? pixEnabled
      : Boolean(status?.enabled && status?.publishableKey && prices?.automatic[interval]),
  );
  const chosen = renewal && renewals.includes(renewal) ? renewal : renewals[0] ?? null;

  const pay = () => {
    const renewal = target === "gift" ? ("none" as const) : ("automatic" as const);

    if (chosen === "pix") createPix.mutate({ interval, target }, { onSuccess: setPixCharge });
    else if (chosen === "automatic") startCard.mutate({ interval, renewal, target }, { onSuccess: setCardIntent });
  };

  return (
    <div data-gc="plan.upgrade-modal.div" className="min-h-0 overflow-y-auto px-6 pb-6 pt-7">
      <div data-gc="plan.upgrade-modal.div--2" className="flex flex-col items-center text-center">
        <span data-gc="plan.upgrade-modal.span" className="flex size-12 items-center justify-center rounded-2xl bg-brand/15 text-brand">
          <InfinityIcon data-gc="plan.upgrade-modal.infinity-icon" size={26} />
        </span>
        <DialogTitle data-gc="plan.upgrade-modal.dialog-title" className="mt-3 text-xl font-bold">{PLAN_NAME}</DialogTitle>
        <DialogDescription data-gc="plan.upgrade-modal.dialog-description" className="max-w-md text-balance">
          {t("configuracoes.subscription.upgradeSubtitle")}
        </DialogDescription>

        {!pixCharge && !cardIntent && (
          <div data-gc="plan.upgrade-modal.div--3" className="mt-4 inline-flex rounded-lg border border-line p-0.5">
            {(["me", "gift"] as const).map((option) => (
              <button data-gc="plan.upgrade-modal.button"
                key={option}
                type="button"
                aria-pressed={target === option}
                onClick={() => setTarget(option)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition",
                  target === option ? "bg-surface-3 font-medium text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                {t(option === "me" ? "configuracoes.subscription.forMe" : "configuracoes.subscription.asGift")}
              </button>
            ))}
          </div>
        )}
      </div>

      {billing.isPending ? (
        <Skeleton data-gc="plan.upgrade-modal.skeleton" className="mt-6 h-40 rounded-xl" />
      ) : premium && status?.premiumUntil && target === "me" ? (
        <div data-gc="plan.upgrade-modal.div--4" className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-brand/40 bg-brand/10 p-4 text-center text-sm">
          <p data-gc="plan.upgrade-modal.p">
            {t("configuracoes.subscription.alreadyPremium", {
              date: new Date(status.premiumUntil).toLocaleDateString(currentLanguage(), { dateStyle: "long" }),
            })}
          </p>
          <Button data-gc="plan.upgrade-modal.button--2"
            variant="surface"
            size="sm"
            onClick={() => {
              onDone();
              openSettings("subscription");
            }}
          >
            {t("configuracoes.subscription.manage")}
          </Button>
        </div>
      ) : cardIntent && status?.publishableKey ? (
        <CardPayment data-gc="plan.upgrade-modal.card-payment.on-done"
          intent={cardIntent}
          publishableKey={status.publishableKey}
          onPaid={onDone}
        />
      ) : pixCharge ? (
        <PixPayment data-gc="plan.upgrade-modal.pix-payment.on-done"
          initial={pixCharge}
          onPaid={onDone}
          onGift={() => openSettings("subscription")}
          onRetry={() => {
            setPixCharge(null);
            createPix.mutate({ interval: pixCharge.interval, target: pixCharge.target }, { onSuccess: setPixCharge });
          }}
        />
      ) : !renewals.length ? (
        <p data-gc="plan.upgrade-modal.p--2" className="mt-6 rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-ink-faint">
          {t("configuracoes.subscription.unavailable")}
        </p>
      ) : (
        <>
          <div data-gc="plan.upgrade-modal.div--5" className="mt-6 grid gap-3 sm:grid-cols-2">
            {INTERVALS.map((option) => {
              const price = priceOf(prices, option, pixEnabled);
              if (!price) return null;

              return (
                <button data-gc="plan.upgrade-modal.button--3"
                  key={option}
                  type="button"
                  aria-pressed={interval === option}
                  onClick={() => setBillingInterval(option)}
                  className={cn(
                    "relative flex flex-col items-center rounded-xl border px-4 py-5 transition",
                    interval === option ? "border-brand bg-brand/10" : "border-line hover:bg-hover",
                  )}
                >
                  {option === "year" && saving && (
                    <span data-gc="plan.upgrade-modal.span--2" className="absolute -top-2.5 rounded-full bg-brand px-2 py-0.5 text-11 font-semibold text-sobre-marca">
                      {t("configuracoes.subscription.save", { percent: saving })}
                    </span>
                  )}
                  <span data-gc="plan.upgrade-modal.span--3" className="text-sm font-semibold">
                    {t(option === "month" ? "configuracoes.subscription.monthly" : "configuracoes.subscription.yearly")}
                  </span>
                  <span data-gc="plan.upgrade-modal.span--4" className="mt-1 text-2xl font-bold tabular-nums">{money(price)}</span>
                  <span data-gc="plan.upgrade-modal.span--5" className="text-xs text-ink-faint">
                    {t(option === "month" ? "configuracoes.subscription.perMonth" : "configuracoes.subscription.perYear")}
                  </span>
                </button>
              );
            })}
          </div>

          {renewals.length > 0 && (
            <fieldset data-gc="plan.upgrade-modal.fieldset" className="mt-5">
              <legend data-gc="plan.upgrade-modal.legend" className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {t("configuracoes.subscription.howToPay")}
              </legend>
              <div data-gc="plan.upgrade-modal.div--6" className="grid gap-2 sm:grid-cols-2">
                {renewals.map((option) => (
                  <button data-gc="plan.upgrade-modal.button--4"
                    key={option}
                    type="button"
                    aria-pressed={chosen === option}
                    onClick={() => setRenewal(option)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition",
                      chosen === option ? "border-brand/50 bg-brand/10 text-ink" : "border-line text-ink-muted hover:bg-hover hover:text-ink",
                    )}
                  >
                    {option === "pix" ? (
                      <QrCode data-gc="plan.upgrade-modal.qr-code" size={16} className="shrink-0" />
                    ) : (
                      <CreditCard data-gc="plan.upgrade-modal.credit-card" size={16} className="shrink-0" />
                    )}
                    {t(option === "automatic" ? "configuracoes.subscription.automatic" : "configuracoes.subscription.pixOption")}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <Button data-gc="plan.upgrade-modal.button.pay"
            className="mt-5 w-full"
            disabled={!chosen}
            loading={createPix.isPending || startCard.isPending}
            onClick={pay}
          >
            {t(target === "gift" ? "configuracoes.subscription.buyGift" : "configuracoes.subscription.subscribe")}
          </Button>

          <p data-gc="plan.upgrade-modal.p--3" className="mt-3 text-center text-xs text-ink-faint">{t("configuracoes.subscription.legal")}</p>
        </>
      )}

      <ComparisonTable data-gc="plan.upgrade-modal.comparison-table" />
    </div>
  );
};

export const ComparisonTable: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation();
  const rows = comparisonRows(t);

  const cell = (value: Cell, highlight: boolean) =>
    value === true ? (
      <Check data-gc="plan.upgrade-modal.check" size={16} className={cn("mx-auto", highlight ? "text-brand" : "text-online")} />
    ) : value === false ? (
      t("configuracoes.subscription.no")
    ) : (
      value
    );

  return (
    <section data-gc="plan.upgrade-modal.section" className={cn("mt-7", className)}>
      <h3 data-gc="plan.upgrade-modal.h3" className="mb-2 text-sm font-semibold">{t("configuracoes.subscription.compare")}</h3>
      <div data-gc="plan.upgrade-modal.div--7" className="overflow-hidden rounded-xl border border-line-sutil">
        <table data-gc="plan.upgrade-modal.table" className="w-full text-sm">
          <thead data-gc="plan.upgrade-modal.thead" className="bg-surface-2 text-left text-xs text-ink-muted">
            <tr data-gc="plan.upgrade-modal.tr">
              <th data-gc="plan.upgrade-modal.th" className="px-3 py-2 font-medium">{t("configuracoes.subscription.featureColumn")}</th>
              <th data-gc="plan.upgrade-modal.th--2" className="px-3 py-2 text-center font-medium">{t("configuracoes.subscription.freeColumn")}</th>
              <th data-gc="plan.upgrade-modal.th--3" className="px-3 py-2 text-center font-medium text-brand">{PLAN_NAME}</th>
            </tr>
          </thead>
          <tbody data-gc="plan.upgrade-modal.tbody" className="divide-y divide-line-sutil">
            {rows.map((row) => {
              const free = row.value(PLAN_LIMITS.free);
              const premium = row.value(PLAN_LIMITS.premium);

              return (
                <tr data-gc="plan.upgrade-modal.tr--2" key={row.name}>
                  <td data-gc="plan.upgrade-modal.td" className="px-3 py-2">{row.name}</td>
                  <td data-gc="plan.upgrade-modal.td--2" className="px-3 py-2 text-center text-ink-muted tabular-nums">{cell(free, false)}</td>
                  <td data-gc="plan.upgrade-modal.td--3"
                    className={cn("px-3 py-2 text-center tabular-nums", free !== premium ? "font-semibold text-brand" : "text-ink-muted")}
                  >
                    {cell(premium, true)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
