import { beforeEach, describe, expect, it, vi } from "vitest";

const env = {
  WEB_ORIGIN: "https://app-ravox-chat.vercel.app",
  ACCEPT_PREVIEWS_VERCEL: false,
  VERCEL_PREVIEW_SCOPE: "thiago",
};

vi.mock("~/env.js", () => ({ env, isDev: false }));

const { originAllowed } = await import("~/lib/origins.js");

beforeEach(() => {
  env.ACCEPT_PREVIEWS_VERCEL = false;
  env.VERCEL_PREVIEW_SCOPE = "thiago";
});

describe("origens aceitas", () => {
  it("aceita a que está configurada", () => {
    expect(originAllowed("https://app-ravox-chat.vercel.app")).toBe(true);
  });

  it("recusa uma qualquer", () => {
    expect(originAllowed("https://site-de-outro.com")).toBe(false);
  });

  it("pedido sem origem passa — é o curl e o app de desktop", () => {
    expect(originAllowed(undefined)).toBe(true);
  });
});

describe("prévias da Vercel", () => {
  it("desligado, a prévia é recusada como qualquer outra", () => {
    expect(originAllowed("https://ravox-chat-abc123-thiago.vercel.app")).toBe(false);
  });

  it("ligado, as prévias do projeto neste time entram", () => {
    env.ACCEPT_PREVIEWS_VERCEL = true;

    for (const o of [
      "https://ravox-chat-r5t85inxa-thiago.vercel.app",
      "https://ravox-chat-git-staging-thiago.vercel.app",
      "https://app-ravox-chat-abc123-thiago.vercel.app",
      "https://app-ravox-chat-git-staging-thiago.vercel.app",
    ]) {
      expect({ o, ok: originAllowed(o) }).toEqual({ o, ok: true });
    }
  });

  it("ligado, recusa http, outro projeto, outro time e domínio parecido", () => {
    env.ACCEPT_PREVIEWS_VERCEL = true;

    for (const o of [
      "http://app-ravox-chat.vercel.app",
      "https://vercel.app.site-de-outro.com",
      "https://naovercel.app.br",
      "https://atacante.vercel.app",
      "https://ravox-chat-abc123-outro-time.vercel.app",
      "https://gravae-chat-abc123-thiago.vercel.app",
      "https://outro-projeto-abc123-thiago.vercel.app",
    ]) {
      expect({ o, ok: originAllowed(o) }).toEqual({ o, ok: false });
    }
  });
});

describe("prévias sem time configurado", () => {
  it("sem VERCEL_PREVIEW_SCOPE, nenhuma prévia entra", () => {
    env.ACCEPT_PREVIEWS_VERCEL = true;
    env.VERCEL_PREVIEW_SCOPE = "";

    expect(originAllowed("https://ravox-chat-abc123-thiago.vercel.app")).toBe(false);
  });
});
