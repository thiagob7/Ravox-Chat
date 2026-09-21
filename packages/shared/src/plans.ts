export const PLAN_NAME = "Infinity";

export const PLANS = ["free", "premium"] as const;
export type Plan = (typeof PLANS)[number];

export const PREMIUM_SOURCES = ["grant", "stripe_subscription", "stripe_pass", "gift"] as const;
export type PremiumSource = (typeof PREMIUM_SOURCES)[number];

export const SCREEN_RESOLUTIONS = ["480", "720", "1080", "1440", "original"] as const;
export const SCREEN_FRAME_RATES = [15, 30, 60] as const;

export type ScreenResolution = (typeof SCREEN_RESOLUTIONS)[number];
export type ScreenFrameRate = (typeof SCREEN_FRAME_RATES)[number];

export interface PlanLimits {
  messageLength: number;
  attachmentBytes: number;
  uploadQuotaByHour: number;
  screenResolutions: readonly ScreenResolution[];
  screenFrameRates: readonly ScreenFrameRate[];
  communities: number;
  savedMessages: number;
  customTag: boolean;
  guildProfiles: boolean;
  profileBadge: boolean;
  animatedProfile: boolean;
  expressionsAnywhere: boolean;
  customColors: boolean;
  earlyAccess: boolean;
  adFree: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    messageLength: 2000,
    attachmentBytes: 25 * 1024 * 1024,
    uploadQuotaByHour: 500 * 1024 * 1024,
    screenResolutions: ["480", "720"],
    screenFrameRates: [15, 30],
    communities: 100,
    savedMessages: 50,
    customTag: false,
    guildProfiles: false,
    profileBadge: false,
    animatedProfile: false,
    expressionsAnywhere: false,
    customColors: false,
    earlyAccess: false,
    adFree: false,
  },
  premium: {
    messageLength: 4000,
    attachmentBytes: 500 * 1024 * 1024,
    uploadQuotaByHour: 5 * 1024 * 1024 * 1024,
    screenResolutions: ["480", "720", "1080"],
    screenFrameRates: SCREEN_FRAME_RATES,
    communities: 200,
    savedMessages: 300,
    customTag: true,
    guildProfiles: true,
    profileBadge: true,
    animatedProfile: true,
    expressionsAnywhere: true,
    customColors: true,
    earlyAccess: true,
    adFree: true,
  },
};

export const HIGHEST_LIMITS = {
  messageLength: Math.max(...PLANS.map((plan) => PLAN_LIMITS[plan].messageLength)),
  attachmentBytes: Math.max(...PLANS.map((plan) => PLAN_LIMITS[plan].attachmentBytes)),
};

export const PREMIUM_GRANT_MAX_DAYS = 3660;

export function planOf(premiumUntil: Date | string | null | undefined, now: number = Date.now()): Plan {
  if (!premiumUntil) return "free";

  const until = new Date(premiumUntil).getTime();
  return Number.isFinite(until) && until > now ? "premium" : "free";
}

export const limitsOf = (premiumUntil: Date | string | null | undefined, now?: number): PlanLimits =>
  PLAN_LIMITS[planOf(premiumUntil, now)];

export function extendPremium(current: Date | null | undefined, days: number, now: number = Date.now()): Date {
  const start = current && current.getTime() > now ? current.getTime() : now;
  return new Date(start + days * 24 * 60 * 60 * 1000);
}
