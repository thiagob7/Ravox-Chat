import React from "react";
import { Infinity as InfinityIcon } from "lucide-react";
import { planOf } from "@gravae/shared";

import {
  useBilling,
  useOpenBillingPortal,
  useRequestRefund,
} from "~/@core/application/queries/billing/use-billing";
import { Button } from "~/components/ui/button";
import { useConfirm } from "~/components/ui/confirm";
import { Skeleton } from "~/components/ui/skeleton";
import { ConfigSection } from "~/features/configuracoes/components/SecaoDeConfig";
import { ComparisonTable } from "~/features/plan/components/UpgradeModal";
import { GiftsPanel } from "~/features/plan/components/GiftsPanel";
import { usePlanStore } from "~/features/plan/stores/plan-store";
import { cn } from "~/lib/utils";
import { currentLanguage, useTranslation } from "~/traducao";

export const SubscriptionSection: React.FC = () => {
  const { t } = useTranslation();
  const billing = useBilling();
  const portal = useOpenBillingPortal();
  const refund = useRequestRefund();
  const confirm = useConfirm();
  const awaiting = usePlanStore((s) => s.awaitingPaymentSince);

  const openUpgrade = usePlanStore((s) => s.openUpgrade);

  const date = (iso: string) => new Date(iso).toLocaleDateString(currentLanguage(), { dateStyle: "long" });
  const money = (amount: number, currency: string) =>
    new Intl.NumberFormat(currentLanguage(), { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);

  if (billing.isPending) return <Skeleton data-gc="plan.subscription-section.skeleton" className="h-48 max-w-2xl rounded-xl" />;

  const status = billing.data;
  const premium = planOf(status?.premiumUntil) === "premium";
  const subscription = status?.subscription ?? null;

  const askRefund = async () => {
    if (!status?.refund) return;

    const { confirmed } = await confirm({
      title: t("configuracoes.subscription.refundConfirm"),
      description: t("configuracoes.subscription.refundConfirmDetail"),
      action: t("configuracoes.subscription.refund"),
      destructive: true,
    });

    if (confirmed) refund.mutate();
  };

  return (
    <div data-gc="plan.subscription-section.div" className="max-w-2xl pb-10">
      <div data-gc="plan.subscription-section.div--2" className="flex items-center gap-3 rounded-xl border border-line-sutil bg-surface-1 p-4">
        <span data-gc="plan.subscription-section.span"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            premium ? "bg-brand/15 text-brand" : "bg-surface-3 text-ink-faint",
          )}
        >
          <InfinityIcon data-gc="plan.subscription-section.infinity-icon" size={20} />
        </span>

        <div data-gc="plan.subscription-section.div--3" className="min-w-0 flex-1 text-sm">
          <p data-gc="plan.subscription-section.p" className="font-semibold">
            {premium && status?.premiumUntil
              ? t("configuracoes.subscription.activeUntil", { date: date(status.premiumUntil) })
              : awaiting
                ? t("configuracoes.subscription.waiting")
                : t("configuracoes.subscription.free")}
          </p>

          {premium && subscription?.status === "past_due" && (
            <p data-gc="plan.subscription-section.p--2" className="text-aviso">{t("configuracoes.subscription.pastDue")}</p>
          )}
          {premium && subscription?.currentPeriodEnd && subscription.status !== "past_due" && (
            <p data-gc="plan.subscription-section.p--3" className="text-ink-muted">
              {subscription.cancelAtPeriodEnd
                ? t("configuracoes.subscription.endsAt", { date: date(subscription.currentPeriodEnd) })
                : t("configuracoes.subscription.renews", { date: date(subscription.currentPeriodEnd) })}
            </p>
          )}
        </div>

        {status?.canManage && status.enabled && (
          <Button data-gc="plan.subscription-section.button" variant="surface" size="sm" loading={portal.isPending} onClick={() => portal.mutate()}>
            {t("configuracoes.subscription.manage")}
          </Button>
        )}
      </div>

      <ComparisonTable data-gc="plan.subscription-section.comparison-table" className="mt-8" />

      {!subscription && !premium && (
        <Button data-gc="plan.subscription-section.button--2" className="mt-8" onClick={() => openUpgrade()}>
          <InfinityIcon data-gc="plan.subscription-section.infinity-icon--2" size={16} /> {t("configuracoes.subscription.seePlans")}
        </Button>
      )}

      <ConfigSection data-gc="plan.subscription-section.config-section" id="gifts" title={t("configuracoes.subscription.gifts")}>
        <GiftsPanel data-gc="plan.subscription-section.gifts-panel" />
      </ConfigSection>

      {status?.refund && (
        <ConfigSection data-gc="plan.subscription-section.config-section--2" id="refund" title={t("configuracoes.subscription.refund")}>
          <p data-gc="plan.subscription-section.p--4" className="text-sm text-ink-muted">
            {t("configuracoes.subscription.refundDetail", {
              amount: money(status.refund.amount, status.refund.currency),
              date: date(status.refund.openUntil),
            })}
          </p>
          <Button data-gc="plan.subscription-section.button--3" className="mt-3" variant="danger" loading={refund.isPending} onClick={() => void askRefund()}>
            {t("configuracoes.subscription.refund")}
          </Button>
        </ConfigSection>
      )}
    </div>
  );
};

