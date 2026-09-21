import React from "react";
import { Infinity as InfinityIcon, Plus, Shuffle, Trash2 } from "lucide-react";
import { PLAN_NAME } from "@gravae/shared";

import { Button } from "~/components/ui/button";
import { ColorField } from "~/components/ui/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Slider } from "~/components/ui/slider";
import { usePlanLimits, usePlanStore } from "~/features/plan/stores/plan-store";
import { DEFAULT_ANGLE, DEFAULT_INTENSITY, MAX_COLORS, gradientOf } from "~/features/tema/lib/app-colors";
import { useAppColors } from "~/features/tema/stores/app-colors";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

const randomColor = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;

export const AppColorsPanel: React.FC = () => {
  const { t } = useTranslation();
  const allowed = usePlanLimits().customColors;
  const openUpgrade = usePlanStore((s) => s.openUpgrade);

  const colors = useAppColors((s) => s.colors);
  const angle = useAppColors((s) => s.angle);
  const intensity = useAppColors((s) => s.intensity);
  const change = useAppColors((s) => s.set);
  const clear = useAppColors((s) => s.clear);

  const preview = colors.length
    ? gradientOf({ colors, angle, intensity })
    : `linear-gradient(${angle}deg, var(--color-surface-3), var(--color-surface-1))`;

  const swap = (index: number, color: string) =>
    change({ colors: colors.map((current, at) => (at === index ? color : current)) });

  if (!allowed) {
    return (
      <div data-gc="tema.cores-do-app.div" className="flex flex-wrap items-center gap-3 rounded-xl border border-brand/40 bg-brand/10 p-4">
        <span data-gc="tema.cores-do-app.span" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/20 text-brand">
          <InfinityIcon data-gc="tema.cores-do-app.infinity-icon" size={18} />
        </span>
        <p data-gc="tema.cores-do-app.p" className="min-w-0 flex-1 text-sm text-ink-muted">
          {t("configuracoes.appColors.locked", { plan: PLAN_NAME })}
        </p>
        <Button data-gc="tema.cores-do-app.button" size="sm" onClick={() => openUpgrade()}>
          {t("configuracoes.subscription.seePlans")}
        </Button>
      </div>
    );
  }

  return (
    <div data-gc="tema.cores-do-app.div--2" className="space-y-4">
      <div data-gc="tema.cores-do-app.div--3" className="h-20 rounded-xl border border-line-sutil" style={{ backgroundImage: preview }} />

      <div data-gc="tema.cores-do-app.div--4" className="flex flex-wrap items-center gap-2">
        {colors.map((color, index) => (
          <Popover data-gc="tema.cores-do-app.popover" key={`${color}-${index}`}>
            <PopoverTrigger data-gc="tema.cores-do-app.popover-trigger" asChild>
              <button data-gc="tema.cores-do-app.button--2"
                type="button"
                aria-label={t("configuracoes.appColors.color", { number: index + 1 })}
                className="size-9 rounded-lg border border-line-sutil"
                style={{ backgroundColor: color }}
              />
            </PopoverTrigger>
            <PopoverContent data-gc="tema.cores-do-app.popover-content" className="w-64">
              <ColorField data-gc="tema.cores-do-app.color-field" value={color} onChange={(value) => swap(index, value)} />
              <Button data-gc="tema.cores-do-app.button--3"
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={() => change({ colors: colors.filter((_, at) => at !== index) })}
              >
                <Trash2 data-gc="tema.cores-do-app.trash2" size={14} /> {t("configuracoes.appColors.removeColor")}
              </Button>
            </PopoverContent>
          </Popover>
        ))}

        {colors.length < MAX_COLORS && (
          <Button data-gc="tema.cores-do-app.button--4" variant="surface" size="sm" onClick={() => change({ colors: [...colors, randomColor()] })}>
            <Plus data-gc="tema.cores-do-app.plus" size={14} /> {t("configuracoes.appColors.addColor")}
          </Button>
        )}

        <Button data-gc="tema.cores-do-app.button--5"
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() =>
            change({
              colors: [randomColor(), randomColor()],
              angle: Math.floor(Math.random() * 360),
              intensity: DEFAULT_INTENSITY,
            })
          }
        >
          <Shuffle data-gc="tema.cores-do-app.shuffle" size={14} /> {t("configuracoes.appColors.surprise")}
        </Button>
      </div>

      <label data-gc="tema.cores-do-app.label" className={cn("block", !colors.length && "opacity-50")}>
        <span data-gc="tema.cores-do-app.span--2" className="flex items-baseline justify-between text-sm">
          {t("configuracoes.appColors.direction")}
          <span data-gc="tema.cores-do-app.span--3" className="text-xs tabular-nums text-ink-faint">{angle}°</span>
        </span>
        <Slider data-gc="tema.cores-do-app.slider"
          className="mt-2"
          min={0}
          max={359}
          value={angle}
          filled={angle / 359}
          defaultAt={DEFAULT_ANGLE / 359}
          disabled={!colors.length}
          onChange={(event) => change({ angle: Number(event.target.value) })}
        />
      </label>

      <label data-gc="tema.cores-do-app.label--2" className={cn("block", !colors.length && "opacity-50")}>
        <span data-gc="tema.cores-do-app.span--4" className="flex items-baseline justify-between text-sm">
          {t("configuracoes.appColors.intensity")}
          <span data-gc="tema.cores-do-app.span--5" className="text-xs tabular-nums text-ink-faint">{intensity}%</span>
        </span>
        <Slider data-gc="tema.cores-do-app.slider--2"
          className="mt-2"
          min={0}
          max={40}
          value={intensity}
          filled={intensity / 40}
          defaultAt={DEFAULT_INTENSITY / 40}
          disabled={!colors.length}
          onChange={(event) => change({ intensity: Number(event.target.value) })}
        />
      </label>

      {colors.length > 0 && (
        <Button data-gc="tema.cores-do-app.button.clear" variant="ghost" size="sm" onClick={clear}>
          {t("configuracoes.appColors.reset")}
        </Button>
      )}
    </div>
  );
};
