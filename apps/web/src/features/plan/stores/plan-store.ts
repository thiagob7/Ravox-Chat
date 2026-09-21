import { create } from "zustand";
import { limitsOf, type BillingInterval, type PlanLimits } from "@gravae/shared";

type PlanStore = {
  premiumUntil: string | null;
  awaitingPaymentSince: number | null;
  upgradeOpen: boolean;
  upgradeInterval: BillingInterval | null;
  guildProfileFor: string | null;
  giftCode: string | null;
  claimingGift: string | null;
  setPremiumUntil: (premiumUntil: string | null) => void;
  awaitPayment: () => void;
  openUpgrade: (interval?: BillingInterval) => void;
  closeUpgrade: () => void;
  openGuildProfile: (guildId: string) => void;
  closeGuildProfile: () => void;
  setGiftCode: (code: string | null) => void;
  claimGift: (code: string | null) => void;
};

export const usePlanStore = create<PlanStore>((set) => ({
  premiumUntil: null,
  awaitingPaymentSince: null,
  setPremiumUntil: (premiumUntil) => set({ premiumUntil }),
  awaitPayment: () => set({ awaitingPaymentSince: Date.now() }),
  upgradeOpen: false,
  upgradeInterval: null,
  openUpgrade: (interval) => set({ upgradeOpen: true, upgradeInterval: interval ?? null }),
  closeUpgrade: () => set({ upgradeOpen: false }),
  guildProfileFor: null,
  openGuildProfile: (guildId) => set({ guildProfileFor: guildId }),
  closeGuildProfile: () => set({ guildProfileFor: null }),
  giftCode: null,
  setGiftCode: (giftCode) => set({ giftCode }),
  claimingGift: null,
  claimGift: (claimingGift) => set({ claimingGift }),
}));

export const usePlanLimits = (): PlanLimits => limitsOf(usePlanStore((s) => s.premiumUntil));

export const planLimitsNow = (): PlanLimits => limitsOf(usePlanStore.getState().premiumUntil);
