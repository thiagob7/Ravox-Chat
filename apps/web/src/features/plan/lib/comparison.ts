import { PLAN_LIMITS, type PlanLimits } from "@gravae/shared";

import { currentLanguage } from "~/traducao";

export type Cell = boolean | string;

export interface Row {
  name: string;
  value: (limits: PlanLimits) => Cell;
}

export interface Group {
  title: string;
  rows: Row[];
}

type Translate = (key: string, values?: Record<string, string | number>) => string;

const megabytes = (bytes: number) => Math.round(bytes / (1024 * 1024));

export const comparisonGroups = (t: Translate): Group[] => {
  const number = (value: number) => value.toLocaleString(currentLanguage());

  const screen = (limits: PlanLimits) => {
    const resolution = limits.screenResolutions.at(-1) ?? "720";

    return t("configuracoes.subscription.screenValue", {
      resolution: resolution === "original" ? t("chamada.tela.original") : `${resolution}p`,
      fps: limits.screenFrameRates.at(-1) ?? 15,
    });
  };

  return [
    {
      title: t("configuracoes.subscription.groupStyle"),
      rows: [
        { name: t("configuracoes.subscription.tagRow"), value: (l) => l.customTag },
        { name: t("configuracoes.subscription.badgeRow"), value: (l) => l.profileBadge },
        { name: t("configuracoes.subscription.animatedProfileRow"), value: (l) => l.animatedProfile },
        { name: t("configuracoes.subscription.guildProfilesRow"), value: (l) => l.guildProfiles },
      ],
    },
    {
      title: t("configuracoes.subscription.groupLook"),
      rows: [
        { name: t("configuracoes.subscription.colorsRow"), value: (l) => l.customColors },
        { name: t("configuracoes.subscription.themesRow"), value: () => true },
        { name: t("configuracoes.subscription.animatedEmojiRow"), value: () => true },
        { name: t("configuracoes.subscription.expressionsRow"), value: (l) => l.expressionsAnywhere },
      ],
    },
    {
      title: t("configuracoes.subscription.groupLimits"),
      rows: [
        { name: t("configuracoes.subscription.messageRow"), value: (l) => number(l.messageLength) },
        {
          name: t("configuracoes.subscription.attachmentRow"),
          value: (l) => t("configuracoes.subscription.megabytesValue", { value: megabytes(l.attachmentBytes) }),
        },
        { name: t("configuracoes.subscription.screenRow"), value: screen },
        { name: t("configuracoes.subscription.communitiesRow"), value: (l) => number(l.communities) },
        { name: t("configuracoes.subscription.savedRow"), value: (l) => number(l.savedMessages) },
        { name: t("configuracoes.subscription.earlyAccessRow"), value: (l) => l.earlyAccess },
      ],
    },
  ];
};

export const comparisonRows = (t: Translate): Row[] => comparisonGroups(t).flatMap((group) => group.rows);

export const premiumOnly = (row: Row): boolean => row.value(PLAN_LIMITS.free) !== row.value(PLAN_LIMITS.premium);
