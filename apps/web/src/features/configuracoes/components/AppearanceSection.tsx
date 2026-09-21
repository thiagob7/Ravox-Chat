import React from "react";
import {
  Check,
  Contrast,
  Flame,
  Monitor,
  Moon,
  MousePointer2,
  Palette,
  Sparkles,
  Sun,
  Video,
} from "lucide-react";

import { Switch } from "~/components/ui/switch";
import { SelectField } from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { useStudioWindow } from "~/features/configuracoes/stores/janela-do-estudio";
import { useCursorsWindow } from "~/features/configuracoes/stores/janela-de-cursores";
import {
  HIGHLIGHT_COLORS,
  useAppearance,
  type Density,
  type WhenShowSpoiler,
  type Theme,
} from "~/features/configuracoes/stores/aparencia";
import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";
import { isDesktop } from "~/lib/desktop";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import { AppColorsPanel } from "~/features/tema/components/CoresDoApp";
import { ScaleControl } from "~/features/configuracoes/components/ControleDeEscala";
import { EffectsSection } from "~/features/configuracoes/components/SecaoDeEfeitos";
import { Line, Choice } from "~/features/configuracoes/components/campos-de-config";
import themeSamples from "~/features/configuracoes/lib/amostras-de-tema.json";
import { useTranslation } from "~/traducao";

interface ListTheme {
  id: Theme;
  name: string;
  icon: React.ReactNode;
  brand?: boolean;
}

const SAMPLES = themeSamples as Record<
  Theme,
  { sample: string[]; accent: string }
>;

const THEMES: ListTheme[] = [
  {
    id: "claro",
    name: "Claro",
    icon: <Sun data-gc="configuracoes.appearance-section.sun" size={14} />,
  },
  {
    id: "escuro",
    name: "Escuro",
    icon: <Moon data-gc="configuracoes.appearance-section.moon" size={14} />,
  },
  {
    id: "mais-escuro",
    name: "Mais escuro",
    icon: <Moon data-gc="configuracoes.appearance-section.moon--2" size={14} />,
  },
  {
    id: "grafite",
    name: "Grafite",
    icon: <Contrast data-gc="configuracoes.appearance-section.contrast" size={14} />,
  },
  {
    id: "sistema",
    name: "Seguir o sistema",
    icon: <Monitor data-gc="configuracoes.appearance-section.monitor" size={14} />,
  },
  {
    id: "gravae",
    name: "Modo Ravox Chat",
    icon: <Flame data-gc="configuracoes.appearance-section.flame" size={14} />,
    brand: true,
  },
];

export const AppearanceSection: React.FC = () => {
  const { t } = useTranslation();
  const prefs = useAppearance();
  const openStudio = useStudioWindow((s) => s.open);
  const openCursors = useCursorsWindow((s) => s.open);
  const closeSettings = useSettings((s) => s.close);

  return (
    <div data-gc="configuracoes.appearance-section.div">
      <p data-gc="configuracoes.appearance-section.p" className="text-sm text-ink-muted">
        Vale para este aparelho — nada aqui viaja com a conta.
      </p>

      <Section data-gc="configuracoes.appearance-section.section" id="tema" title="Tema">
        <div data-gc="configuracoes.appearance-section.div--2" className="flex flex-wrap gap-3">
          {THEMES.map((theme) => (
            <button data-gc="configuracoes.appearance-section.button"
              key={theme.id}
              onClick={() => prefs.set({ theme: theme.id })}
              aria-pressed={prefs.theme === theme.id}
              className={cn(
                flxCls("themeButton"),
                "relative w-36 overflow-hidden rounded-lg border-2 text-left transition",
                prefs.theme === theme.id
                  ? "border-brand"
                  : "border-line hover:border-ink-faint",
              )}
            >
              <span data-gc="configuracoes.appearance-section.span" className="relative flex h-14" aria-hidden>
                {SAMPLES[theme.id].sample.map((color, i) => (
                  <span data-gc="configuracoes.appearance-section.span--2"
                    key={i}
                    className="flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}

                {theme.brand && (
                  <img data-gc="configuracoes.appearance-section.img"
                    src="/brand/marca.svg"
                    alt=""
                    className="absolute inset-0 m-auto h-8 w-auto drop-shadow"
                  />
                )}

                {!theme.brand && (
                  <span data-gc="configuracoes.appearance-section.span--3"
                    className="absolute inset-0 m-auto size-6 rounded-full shadow"
                    style={{ backgroundColor: SAMPLES[theme.id].accent }}
                  />
                )}
              </span>

              <span data-gc="configuracoes.appearance-section.span--4"
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium",
                  theme.brand && "text-brand",
                )}
              >
                {theme.icon}
                {theme.name}
              </span>

              {prefs.theme === theme.id && (
                <span data-gc="configuracoes.appearance-section.span--5" className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-sobre-marca">
                  <Check data-gc="configuracoes.appearance-section.check" size={12} />
                </span>
              )}
            </button>
          ))}
        </div>

        <div data-gc="configuracoes.appearance-section.div--3" className="mt-4">
          <div data-gc="configuracoes.appearance-section.div--4" className="flex flex-wrap items-center gap-2">
            <Button data-gc="configuracoes.appearance-section.button--2"
              variant="surface"
              onClick={() => {
                openStudio();
                closeSettings();
              }}
            >
              <Palette data-gc="configuracoes.appearance-section.palette" size={16} /> Abrir estúdio de temas…
            </Button>

            <Button data-gc="configuracoes.appearance-section.button--3"
              variant="surface"
              onClick={() => {
                openCursors();
                closeSettings();
              }}
            >
              <MousePointer2 data-gc="configuracoes.appearance-section.mouse-pointer2" size={16} /> Abrir cursores…
            </Button>
          </div>
          <p data-gc="configuracoes.appearance-section.p--2" className="mt-1.5 text-xs text-ink-faint">
            Muda cor por cor em cima do tema base, escreve CSS e guarda o
            resultado. Vale só neste aparelho.
          </p>
        </div>

      </Section>

      <Section data-gc="configuracoes.appearance-section.section--2"
        id="cores-do-app"
        title={t("configuracoes.appColors.title")}
        detail={t("configuracoes.appColors.detail")}
      >
        <AppColorsPanel data-gc="configuracoes.appearance-section.app-colors-panel" />
      </Section>

      <Section data-gc="configuracoes.appearance-section.section--3"
        id="cor-de-destaque"
        title="Cor de destaque"
        detail="A cor dos botões, dos links e de tudo o que o app quer que você veja primeiro."
      >
        <div data-gc="configuracoes.appearance-section.div--5" className="flex flex-wrap items-center gap-2">
          {HIGHLIGHT_COLORS.map((color, index) => {
            const value = index === 0 ? null : color.value;
            const picked = prefs.highlight === value;

            return (
              <button data-gc="configuracoes.appearance-section.button--4"
                key={color.value}
                onClick={() => prefs.set({ highlight: value })}
                title={color.name}
                aria-label={color.name}
                aria-pressed={picked}
                style={{ backgroundColor: color.value }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sobre-marca transition hover:scale-110",
                  picked &&
                    "ring-2 ring-ink ring-offset-2 ring-offset-surface-2",
                )}
              >
                {picked && <Check data-gc="configuracoes.appearance-section.check--2" size={14} />}
              </button>
            );
          })}
        </div>
      </Section>

      <Section data-gc="configuracoes.appearance-section.section--4"
        id="zoom-do-app"
        title="Nível de zoom do app"
        detail="Cresce a interface inteira — texto, ícones, avatares e espaçamentos, na mesma proporção."
      >
        <ScaleControl data-gc="configuracoes.appearance-section.scale-control"
          value={prefs.zoomDoApp}
          onChange={(zoomDoApp) => prefs.set({ zoomDoApp })}
          min={50}
          max={200}
          step={5}
          brands={[50, 75, 100, 125, 150, 200]}
        />
      </Section>

      <Section data-gc="configuracoes.appearance-section.section--5"
        id="escala-da-fonte"
        title="Escala da fonte do chat"
        detail="Cresce só o texto das mensagens. Os menus e a lista de canais ficam como estão."
      >
        <ScaleControl data-gc="configuracoes.appearance-section.scale-control--2"
          value={prefs.chatScale}
          onChange={(chatScale) => prefs.set({ chatScale })}
          min={80}
          max={180}
          step={5}
          brands={[80, 100, 120, 150, 180]}
        />
      </Section>

      <EffectsSection data-gc="configuracoes.appearance-section.effects-section" />

      <Section data-gc="configuracoes.appearance-section.section--6"
        id="interface"
        title="Interface"
        detail="O contorno da janela e as colunas que ficam em volta da conversa."
      >
        {isDesktop() && (
          <Choice data-gc="configuracoes.appearance-section.choice"
            title="Cantos arredondados"
            detail="A curva no alto à esquerda do miolo, onde ele encontra a faixa de título."
            on={prefs.cornersRounded}
            onChange={(cornersRounded) =>
              prefs.set({ cornersRounded })
            }
          />
        )}

        <Choice data-gc="configuracoes.appearance-section.choice--2"
          title="Lista de membros"
          detail="A coluna da direita com quem está no servidor. Ela já some sozinha em tela estreita; isto é para quem tem tela larga e prefere a conversa ocupando tudo."
          on={prefs.listMembers}
          onChange={(listMembers) => prefs.set({ listMembers })}
        />
      </Section>

      <Section data-gc="configuracoes.appearance-section.section--7"
        id="lista-de-canais"
        title="Lista de canais"
        detail="A coluna da esquerda, dentro de um servidor."
      >
        <Choice data-gc="configuracoes.appearance-section.choice--3"
          title="Faixa do servidor"
          detail="A imagem larga no alto da lista, quando o servidor tem uma. O nome continua logo abaixo de qualquer jeito."
          on={prefs.serverTrack}
          onChange={(serverTrack) => prefs.set({ serverTrack })}
        />

        <Choice data-gc="configuracoes.appearance-section.choice--4"
          title="Lembrar categorias fechadas"
          detail="Fechar uma categoria passa a valer na próxima vez que você abrir o app. Desligado, tudo volta aberto a cada recarga."
          on={prefs.rememberCategoriesClosed}
          onChange={(rememberCategoriesClosed) =>
            prefs.set({ rememberCategoriesClosed })
          }
        />
      </Section>

      <Section data-gc="configuracoes.appearance-section.section--8"
        id="modo-streamer"
        title="Privacidade de transmissão"
        detail="Para quando a sua tela está sendo vista por gente que não está na conversa."
      >
        <div data-gc="configuracoes.appearance-section.div--6" className="mb-3 flex items-start gap-3 rounded bg-surface-2 p-3">
          <Video data-gc="configuracoes.appearance-section.video"
            size={18}
            className={cn(
              "mt-0.5 shrink-0",
              prefs.modeStreamer ? "text-brand" : "text-ink-faint",
            )}
          />
          <div data-gc="configuracoes.appearance-section.div--7" className="min-w-0 flex-1">
            <p data-gc="configuracoes.appearance-section.p--3" className="text-sm font-medium">
              {prefs.modeStreamer
                ? "Ligado — a tela está protegida"
                : "Desligado"}
            </p>
            <p data-gc="configuracoes.appearance-section.p--4" className="mt-0.5 text-xs text-ink-muted">
              Ligue antes de começar a transmitir. O que estiver marcado abaixo
              some da tela enquanto ele estiver de pé.
            </p>
          </div>
          <Switch data-gc="configuracoes.appearance-section.switch"
            checked={prefs.modeStreamer}
            onCheckedChange={(v) => prefs.set({ modeStreamer: v })}
          />
        </div>

        <Choice data-gc="configuracoes.appearance-section.choice--5"
          title="Esconder meus dados"
          detail="E-mail e a forma de login, na tela de conta."
          on={prefs.streamerHidesData}
          onChange={(v) => prefs.set({ streamerHidesData: v })}
        />

        <Choice data-gc="configuracoes.appearance-section.choice--6"
          title="Esconder links de convite"
          detail="O código do convite fica tapado até você clicar para revelar."
          on={prefs.streamerHidesInvites}
          onChange={(v) => prefs.set({ streamerHidesInvites: v })}
        />

        <Choice data-gc="configuracoes.appearance-section.choice--7"
          title="Silenciar os sons"
          detail="Entrar e sair de chamada, mutar, mensagem nova."
          on={prefs.streamerWithoutSound}
          onChange={(v) => prefs.set({ streamerWithoutSound: v })}
        />

        <Choice data-gc="configuracoes.appearance-section.choice--8"
          title="Não mostrar avisos na tela"
          detail="A janelinha do sistema com o que chegou — que é o jeito mais rápido de vazar uma conversa numa live."
          on={prefs.streamerWithoutNotices}
          onChange={(v) => prefs.set({ streamerWithoutNotices: v })}
        />
      </Section>

      <div data-gc="configuracoes.appearance-section.div--8" className="mt-10 border-t border-line pt-5">
        <Button data-gc="configuracoes.appearance-section.button.default-restore" variant="surface" size="sm" onClick={prefs.defaultRestore}>
          Voltar ao padrão
        </Button>
      </div>
    </div>
  );
};
