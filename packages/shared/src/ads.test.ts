import { describe, expect, it } from "vitest";

import { adRunning } from "./ads.js";

const NOW = Date.UTC(2026, 8, 20, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

const ad = (extra: Partial<Parameters<typeof adRunning>[0]> = {}) => ({
  active: true,
  startsAt: null,
  endsAt: null,
  ...extra,
});

describe("anúncio no ar", () => {
  it("sem data nenhuma, basta estar ligado", () => {
    expect(adRunning(ad(), NOW)).toBe(true);
    expect(adRunning(ad({ active: false }), NOW)).toBe(false);
  });

  it("antes de começar, não aparece", () => {
    expect(adRunning(ad({ startsAt: new Date(NOW + DAY).toISOString() }), NOW)).toBe(false);
    expect(adRunning(ad({ startsAt: new Date(NOW - DAY).toISOString() }), NOW)).toBe(true);
  });

  it("depois de terminar, sai do ar", () => {
    expect(adRunning(ad({ endsAt: new Date(NOW - 1).toISOString() }), NOW)).toBe(false);
    expect(adRunning(ad({ endsAt: new Date(NOW + DAY).toISOString() }), NOW)).toBe(true);
  });

  it("aceita a data como Date, não só como texto", () => {
    expect(adRunning(ad({ startsAt: new Date(NOW - DAY), endsAt: new Date(NOW + DAY) }), NOW)).toBe(true);
  });
});
