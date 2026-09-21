import { create } from "zustand";

import type { ReadingMode } from "~/lib/voz";

export type Theme = "escuro" | "mais-escuro" | "grafite" | "claro" | "sistema" | "gravae";
export type Density = "confortavel" | "compacta";
export type WhenShowSpoiler = "ao-clicar" | "sempre";

export interface AppearancePrefs {
  theme: Theme;
  highlight: string | null;
  density: Density;

  zoomDoApp: number;
  chatScale: number;

  cornersRounded: boolean;
  listMembers: boolean;

  serverTrack: boolean;
  rememberCategoriesClosed: boolean;

  reduceAnimation: boolean;
  visibleFocusAlways: boolean;

  readVoiceHigh: ReadingMode;
  readingVoice: string | null;
  readingSpeed: number;

  hourIn24h: boolean;

  linksImages: boolean;
  imagesSent: boolean;
  linksPreview: boolean;
  reactions: boolean;
  spoilers: WhenShowSpoiler;
  avatars: boolean;

  suggestions: boolean;
  emoticons: boolean;
  sendButton: boolean;

  cursorTrail: boolean;
  trailColor: string;
  trailSize: number;
  trailWisp: number;

  clickSpark: boolean;
  sparkColor: string;
  sparkSize: number;
  countSparks: number;

  modeStreamer: boolean;
  streamerHidesData: boolean;
  streamerHidesInvites: boolean;
  streamerWithoutSound: boolean;
  streamerWithoutNotices: boolean;
}

const DEFAULT: AppearancePrefs = {
  theme: "escuro",
  highlight: null,
  density: "confortavel",

  zoomDoApp: 100,
  chatScale: 100,

  cornersRounded: true,
  listMembers: true,
  serverTrack: true,
  rememberCategoriesClosed: true,

  reduceAnimation: false,
  visibleFocusAlways: false,
  readVoiceHigh: "nunca",
  readingVoice: null,
  readingSpeed: 1,
  hourIn24h: true,

  linksImages: true,
  imagesSent: true,
  linksPreview: true,
  reactions: true,
  spoilers: "ao-clicar",
  avatars: true,

  suggestions: true,
  emoticons: true,
  sendButton: false,

  cursorTrail: false,
  trailColor: "#a78bfa",
  trailSize: 8,
  trailWisp: 24,

  clickSpark: false,
  sparkColor: "#ffffff",
  sparkSize: 10,
  countSparks: 8,

  modeStreamer: false,
  streamerHidesData: true,
  streamerHidesInvites: true,
  streamerWithoutSound: true,
  streamerWithoutNotices: true,
};

const KEY = "gravae:aparencia";

const OLD_NAMES: Record<string, Theme> = {
  indigo: "escuro",
  "indigo-carvao": "mais-escuro",
  "indigo-claro": "claro",
};

function read(): AppearancePrefs {
  try {
    const saved = localStorage.getItem(KEY);
    if (!saved) return DEFAULT;

    const prefs = {
      ...DEFAULT,
      ...(JSON.parse(saved) as Partial<AppearancePrefs>),
    };
    return { ...prefs, theme: OLD_NAMES[prefs.theme] ?? prefs.theme };
  } catch {
    return DEFAULT;
  }
}

interface AppearanceStore extends AppearancePrefs {
  set: (change: Partial<AppearancePrefs>) => void;
  defaultRestore: () => void;
}

export const useAppearance = create<AppearanceStore>((set, store) => ({
  ...read(),

  set: (change) => {
    set(change);

    try {
      const { set, defaultRestore, ...prefs } = store();
      void set;
      void defaultRestore;
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {}
  },

  defaultRestore: () => store().set(DEFAULT),
}));

export const appearancePrefs = (): AppearancePrefs => {
  const { set, defaultRestore, ...prefs } = useAppearance.getState();
  void set;
  void defaultRestore;
  return prefs;
};

export const HIGHLIGHT_COLORS = [
  { name: "Ravox Chat", value: "#5c5ff0" },
  { name: "Vermelho", value: "#d30404" },
  { name: "Laranja", value: "#e2620d" },
  { name: "Âmbar", value: "#b7791f" },
  { name: "Verde", value: "#0f8a4b" },
  { name: "Turquesa", value: "#0d7d8c" },
  { name: "Azul", value: "#1f5fd0" },
  { name: "Violeta", value: "#6b3fd4" },
  { name: "Rosa", value: "#c02b7a" },
] as const;
