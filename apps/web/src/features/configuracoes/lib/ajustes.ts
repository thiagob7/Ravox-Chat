import type { Section } from "~/features/configuracoes/components/secoes";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { useShortcuts } from "~/features/configuracoes/stores/atalhos";
import { SHORTCUTS, writeCombo } from "~/features/configuracoes/lib/atalhos";
import { useNotices } from "~/stores/notificacoes";

export type SettingCategory =
  | "appearance"
  | "accessibility"
  | "chat"
  | "media"
  | "notices"
  | "language"
  | "shortcuts";

export const CATEGORIES: { id: SettingCategory; name: string }[] = [
  { id: "appearance", name: "Aparência" },
  { id: "chat", name: "Bate-papo" },
  { id: "media", name: "Mídia" },
  { id: "notices", name: "Notificações" },
  { id: "accessibility", name: "Acessibilidade" },
  { id: "language", name: "Language" },
  { id: "shortcuts", name: "Atalhos" },
];

interface Base {
  id: string;
  category: SettingCategory;
  label: string;
  detail: string;
  display: Section;
  sub?: string;
}

export type Setting =
  | (Base & { kind: "interruptor"; read: () => boolean; write: (v: boolean) => void })
  | (Base & { kind: "value"; read: () => string });

const appearance = () => useAppearance.getState();
const notices = () => useNotices.getState();

const fromAppearance = (
  field:
    | "cornersRounded"
    | "listMembers"
    | "serverTrack"
    | "rememberCategoriesClosed"
    | "reduceAnimation"
    | "visibleFocusAlways"
    | "hourIn24h"
    | "linksImages"
    | "imagesSent"
    | "linksPreview"
    | "reactions"
    | "avatars"
    | "suggestions"
    | "emoticons"
    | "sendButton"
    | "modeStreamer"
    | "streamerHidesData"
    | "streamerHidesInvites"
    | "streamerWithoutSound"
    | "streamerWithoutNotices",
) => ({
  read: () => appearance()[field],
  write: (value: boolean) => appearance().set({ [field]: value }),
});

const fromNotice = (field: "notice" | "soMentions" | "sound" | "counter") => ({
  read: () => notices()[field],
  write: (value: boolean) => notices().set({ [field]: value }),
});

const THEMES: Record<string, string> = {
  dark: "Escuro",
  "mais-escuro": "Mais escuro",
  grafite: "Grafite",
  light: "Claro",
  system: "Do sistema",
  gravae: "Ravox Chat",
};

const READING: Record<string, string> = {
  never: "Nunca",
  always: "Sempre",
  "so-mencoes": "Só menções",
};

export const SETTINGS: Setting[] = [
  {
    id: "theme",
    category: "appearance",
    label: "Theme",
    detail: "A base clara ou escura de tudo.",
    display: "appearance",
    sub: "theme",
    kind: "value",
    read: () => THEMES[appearance().theme] ?? appearance().theme,
  },
  {
    id: "highlight",
    category: "appearance",
    label: "Cor de destaque",
    detail: "A cor dos botões e do que está selecionado.",
    display: "appearance",
    sub: "cor-de-destaque",
    kind: "value",
    read: () => appearance().highlight ?? "Padrão",
  },
  {
    id: "density",
    category: "appearance",
    label: "Espaçamento das mensagens",
    detail: "Confortável dá ar entre as mensagens; compacta cabe mais na tela.",
    display: "chat",
    sub: "exibicao",
    kind: "value",
    read: () => (appearance().density === "compacta" ? "Compacta" : "Confortável"),
  },
  {
    id: "zoom-do-app",
    category: "appearance",
    label: "Zoom do app",
    detail: "Aumenta tudo junto, como o zoom do navegador.",
    display: "appearance",
    sub: "zoom-do-app",
    kind: "value",
    read: () => `${appearance().zoomDoApp}%`,
  },
  {
    id: "escala-do-chat",
    category: "appearance",
    label: "Escala da fonte do chat",
    detail: "Mexe só no tamanho do texto das mensagens.",
    display: "appearance",
    sub: "escala-da-fonte",
    kind: "value",
    read: () => `${appearance().chatScale}%`,
  },
  {
    id: "cantos-arredondados",
    category: "appearance",
    label: "Cantos arredondados",
    detail: "Arredonda os painéis e os cartões.",
    display: "appearance",
    sub: "interface",
    kind: "interruptor",
    ...fromAppearance("cornersRounded"),
  },
  {
    id: "lista-de-membros",
    category: "appearance",
    label: "Lista de membros",
    detail: "A coluna da direita, com quem está no servidor.",
    display: "appearance",
    sub: "interface",
    kind: "interruptor",
    ...fromAppearance("listMembers"),
  },
  {
    id: "faixa-do-servidor",
    category: "appearance",
    label: "Faixa do servidor",
    detail: "A imagem no topo da lista de canais.",
    display: "appearance",
    sub: "interface",
    kind: "interruptor",
    ...fromAppearance("serverTrack"),
  },
  {
    id: "lembrar-categorias",
    category: "appearance",
    label: "Lembrar categorias fechadas",
    detail: "As categorias que você fecha continuam fechadas na volta.",
    display: "appearance",
    sub: "lista-de-canais",
    kind: "interruptor",
    ...fromAppearance("rememberCategoriesClosed"),
  },
  {
    id: "modo-streamer",
    category: "appearance",
    label: "Modo streamer",
    detail: "Esconde o que não pode aparecer numa transmissão.",
    display: "appearance",
    sub: "modo-streamer",
    kind: "interruptor",
    ...fromAppearance("modeStreamer"),
  },
  {
    id: "streamer-esconde-dados",
    category: "appearance",
    label: "Esconder meus dados na transmissão",
    detail: "Some com e-mail, telefone e código de convite pessoal.",
    display: "appearance",
    sub: "modo-streamer",
    kind: "interruptor",
    ...fromAppearance("streamerHidesData"),
  },
  {
    id: "streamer-esconde-convites",
    category: "appearance",
    label: "Esconder links de convite",
    detail: "Some com convite de servidor enquanto o modo streamer está ligado.",
    display: "appearance",
    sub: "modo-streamer",
    kind: "interruptor",
    ...fromAppearance("streamerHidesInvites"),
  },
  {
    id: "streamer-sem-som",
    category: "appearance",
    label: "Silenciar os sons na transmissão",
    detail: "Cala os avisos sonoros enquanto o modo streamer está ligado.",
    display: "appearance",
    sub: "modo-streamer",
    kind: "interruptor",
    ...fromAppearance("streamerWithoutSound"),
  },
  {
    id: "streamer-sem-avisos",
    category: "appearance",
    label: "Não mostrar avisos na tela",
    detail: "Segura as notificações do sistema durante a transmissão.",
    display: "appearance",
    sub: "modo-streamer",
    kind: "interruptor",
    ...fromAppearance("streamerWithoutNotices"),
  },
  {
    id: "reactions",
    category: "chat",
    label: "Reações",
    detail: "Mostrar as reações embaixo das mensagens.",
    display: "chat",
    sub: "exibicao",
    kind: "interruptor",
    ...fromAppearance("reactions"),
  },
  {
    id: "avatars",
    category: "chat",
    label: "Avatares",
    detail: "A foto de quem escreveu, ao lado da mensagem.",
    display: "chat",
    sub: "exibicao",
    kind: "interruptor",
    ...fromAppearance("avatars"),
  },
  {
    id: "spoilers",
    category: "chat",
    label: "Mostrar spoilers",
    detail: "Quando o conteúdo escondido se revela.",
    display: "chat",
    sub: "exibicao",
    kind: "value",
    read: () => (appearance().spoilers === "sempre" ? "Sempre" : "Ao clicar"),
  },
  {
    id: "suggestions",
    category: "chat",
    label: "Sugestões enquanto digita",
    detail: "Completa emoji, pessoas e canais conforme você escreve.",
    display: "chat",
    sub: "entry",
    kind: "interruptor",
    ...fromAppearance("suggestions"),
  },
  {
    id: "emoticons",
    category: "chat",
    label: "Converter emoticons em emoji",
    detail: "Troca :) por 🙂 na hora de enviar.",
    display: "chat",
    sub: "entry",
    kind: "interruptor",
    ...fromAppearance("emoticons"),
  },
  {
    id: "botao-de-enviar",
    category: "chat",
    label: "Botão de enviar",
    detail: "Mostra um botão ao lado da caixa, além do Enter.",
    display: "chat",
    sub: "entry",
    kind: "interruptor",
    ...fromAppearance("sendButton"),
  },
  {
    id: "imagens-de-links",
    category: "media",
    label: "Imagens e vídeos de links",
    detail: "Abrir a mídia que vem de um link colado.",
    display: "chat",
    sub: "media",
    kind: "interruptor",
    ...fromAppearance("linksImages"),
  },
  {
    id: "imagens-enviadas",
    category: "media",
    label: "Imagens enviadas aqui",
    detail: "Abrir os anexos direto na conversa.",
    display: "chat",
    sub: "media",
    kind: "interruptor",
    ...fromAppearance("imagesSent"),
  },
  {
    id: "previa-de-links",
    category: "media",
    label: "Prévia de links",
    detail: "O cartão com título e descrição do site.",
    display: "chat",
    sub: "media",
    kind: "interruptor",
    ...fromAppearance("linksPreview"),
  },
  {
    id: "notice",
    category: "notices",
    label: "Aviso na tela",
    detail: "A janelinha do sistema quando chega mensagem.",
    display: "notices",
    sub: "general",
    kind: "interruptor",
    ...fromNotice("notice"),
  },
  {
    id: "counter",
    category: "notices",
    label: "Contador no título",
    detail: "O número de não lidas na aba e no ícone do app.",
    display: "notices",
    sub: "general",
    kind: "interruptor",
    ...fromNotice("counter"),
  },
  {
    id: "so-mencoes",
    category: "notices",
    label: "Só quando me chamarem",
    detail: "Menção direta, cargo seu, @everyone e conversa privada.",
    display: "notices",
    sub: "preferencia-de-mencao",
    kind: "interruptor",
    ...fromNotice("soMentions"),
  },
  {
    id: "sound",
    category: "notices",
    label: "Sons",
    detail: "O interruptor de cima, que cala todos os sons de uma vez.",
    display: "notices",
    sub: "sounds",
    kind: "interruptor",
    ...fromNotice("sound"),
  },
  {
    id: "reduzir-animacao",
    category: "accessibility",
    label: "Reduzir movimento",
    detail: "Corta aberturas, deslizes e transições.",
    display: "accessibility",
    sub: "movimento",
    kind: "interruptor",
    ...fromAppearance("reduceAnimation"),
  },
  {
    id: "foco-sempre-visivel",
    category: "accessibility",
    label: "Anel de foco sempre visível",
    detail: "Mostra onde está o foco mesmo usando o mouse.",
    display: "accessibility",
    sub: "teclado",
    kind: "interruptor",
    ...fromAppearance("visibleFocusAlways"),
  },
  {
    id: "ler-em-voz-alta",
    category: "accessibility",
    label: "Ler mensagens em voz alta",
    detail: "A mensagem que chega, lida pelo sintetizador do sistema.",
    display: "accessibility",
    sub: "texto-em-voz",
    kind: "value",
    read: () => READING[appearance().readVoiceHigh] ?? appearance().readVoiceHigh,
  },
  {
    id: "hora-em-24h",
    category: "language",
    label: "Hora em 24 horas",
    detail: "Desligado, mostra AM e PM.",
    display: "language",
    sub: "formato-da-hora",
    kind: "interruptor",
    ...fromAppearance("hourIn24h"),
  },
];

const shortcuts = () => useShortcuts.getState();

export function shortcutsSettings(): Setting[] {
  return SHORTCUTS.filter((shortcut) => !shortcut.fixed).map((shortcut) => ({
    id: `atalho-${shortcut.id}`,
    category: "shortcuts" as const,
    label: shortcut.name,
    detail: `${shortcut.detail} Hoje em ${writeCombo(
      shortcuts().swapped[shortcut.id] ?? shortcut.fallback,
    )}.`,
    display: "shortcuts" as Section,
    sub: `atalhos-${shortcut.area}`,
    kind: "interruptor" as const,
    read: () => !shortcuts().off.includes(shortcut.id),
    write: (value: boolean) => shortcuts().toggle(shortcut.id, value),
  }));
}
