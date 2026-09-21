import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { ChevronDown, Lock, LogOut, Plus, Settings, Trash2 } from "lucide-react";

import type {
  GuildDetailModel,
  GuildSummaryModel,
} from "~/@core/domain/models/guild-model";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { ChannelSettingsModal } from "~/features/servidor/components/channel-settings/ChannelSettingsModal";
import { CreateChannelModal } from "~/features/servidor/components/CreateChannelModal";
import { InviteModal } from "~/features/servidor/components/InviteModal";
import { CallTimer } from "~/features/voz/components/CallTimer";
import { VoiceMembers } from "~/features/voz/components/VoiceMembers";
import { useVoiceSync } from "~/features/voz/hooks/use-voice-sync";
import {
  CalendarBlank,
  CaretDown,
  ChatCircle,
  ChatsCircle,
  GearSix,
  Hash,
  LinkSimple,
  SpeakerHigh,
  UserPlus,
} from "@phosphor-icons/react";
import { useFavorites } from "~/features/servidor/stores/favoritos";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ServerSettingsModal } from "~/features/servidor/components/server-settings/ServerSettingsModal";
import { Tooltip } from "~/components/ui/tooltip";
import { usePermissions } from "~/hooks/use-permissions";
import { copyText } from "~/lib/copiar";
import { loadFont, fontFamily } from "~/features/perfil/lib/fontes";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";
import { useNotices } from "~/stores/notificacoes";
import { useCreateCategory } from "~/@core/application/queries/guild/use-create-category";
import { Button, IconButton } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input, Label } from "~/components/ui/input";
import { toast } from "react-toastify";
import { useServerSettingsStore } from "~/features/servidor/stores/server-settings-store";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { useCategoriesClosed } from "~/features/servidor/hooks/use-categorias-fechadas";
import { useTrackRatio } from "~/features/servidor/hooks/use-proporcao-da-faixa";
import { CommunitySeal } from "~/features/servidor/components/SeloDaComunidade";
import { ChannelStatus } from "~/features/servidor/components/StatusDoCanal";
import { EventsModal } from "~/features/servidor/components/EventsModal";
import { InviteFriendsCard } from "~/features/servidor/components/InviteFriendsCard";
import { useEvents } from "~/@core/application/queries/guild/use-events";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";

interface ChannelSidebarProps {
  detail: GuildDetailModel | undefined;
  summary: GuildSummaryModel | undefined;
  activeChannelId: string | undefined;
  readStates: Record<
    string,
    { read: string | null; notRead: number; mentions: number }
  >;
  user: SelfUserModel | null;
  onSelectChannel: (channelId: string) => void;
  onLeaveGuild: () => void;
  onOpenVoiceChat?: (channelId: string) => void;
  width: number;
  fluid?: boolean;
}

const PILL =
  "absolute left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-11 font-bold uppercase tracking-wide text-sobre-marca shadow-lg shadow-sombra transition hover:brightness-110";

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  detail,
  summary,
  activeChannelId,
  readStates,
  user,
  onSelectChannel,
  onLeaveGuild,
  onOpenVoiceChat,
  width,
  fluid = false,
}) => {
  const voiceChannelId = useVoiceStore((s) => s.channelId);
  const serverTrack = useAppearance((s) => s.serverTrack);
  const [viewingEvents, setViewingEvents] = useState(false);
  const [search, setSearch] = useSearchParams();

  /*
    O endereço de um evento chega como `?evento=`. Abrimos o painel e tiramos a
    marca da barra de endereço, senão fechar o painel e recarregar o abriria de
    novo para sempre.
  */
  const eventInFocus = search.get("evento");

  useEffect(() => {
    if (!eventInFocus) return;

    setViewingEvents(true);
    setSearch(
      (old) => {
        const next = new URLSearchParams(old);
        next.delete("evento");
        return next;
      },
      { replace: true },
    );
  }, [eventInFocus, setSearch]);
  const [collapsed, setCollapsed] = useCategoriesClosed();
  const { t } = useTranslation();
  const byChannel = useNotices((s) => s.byChannel);
  const events = useEvents(detail?.guild.id, true);
  const hideMuted = useNotices((s) => (detail ? (s.byServer[detail.guild.id]?.hideMuted ?? false) : false));
  const scroller = useRef<HTMLDivElement>(null);
  const [viewOutside, setViewOutside] = useState({ above: false, below: false });

  const measureViewOutside = useCallback(() => {
    const box = scroller.current;
    if (!box) return;

    let above = false;
    let below = false;
    for (const line of box.querySelectorAll<HTMLElement>("[data-nao-lido]")) {
      const top = line.offsetTop - box.scrollTop;
      if (top + line.offsetHeight < 0) above = true;
      else if (top > box.clientHeight) below = true;
    }

    setViewOutside((current) => (current.above === above && current.below === below ? current : { above, below }));
  }, []);

  useEffect(() => {
    measureViewOutside();
  }, [measureViewOutside, readStates, collapsed, detail]);

  const irForNotRead = (side: "acima" | "abaixo") => {
    const box = scroller.current;
    if (!box) return;

    const lines = [...box.querySelectorAll<HTMLElement>("[data-nao-lido]")];
    const target =
      side === "acima"
        ? lines.filter((l) => l.offsetTop - box.scrollTop + l.offsetHeight < 0).at(-1)
        : lines.find((l) => l.offsetTop - box.scrollTop > box.clientHeight);

    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  };
  const [creatingIn, setCreatingIn] = useState<string | null | false>(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const createCategory = useCreateCategory();
  const setServer = useNotices((s) => s.setServer);
  const [inviting, setInviting] = useState(false);
  const settings = useServerSettingsStore();

  const configuring =
    settings.isOpen && settings.guildId === detail?.guild.id;
  const [editingChannel, setEditingChannel] = useState<string | null>(null);

  const { can, canInChannel } = usePermissions(detail);

  useVoiceSync(detail?.guild.id, user?.id);
  const canManage = can("MANAGE_GUILD");
  const canManageChannels = can("MANAGE_CHANNELS");
  const canManageRoles = can("MANAGE_ROLES");
  const canManageWebhooks = can("MANAGE_WEBHOOKS");
  const canConfigure = canManage || canManageRoles || canManageWebhooks;
  const isOwner = Boolean(summary?.isOwner);
  const channels = detail?.channels ?? [];

  useEffect(() => {
    channels.forEach((c) => loadFont(c.font));
  }, [channels]);
  const uncategorized = channels.filter((c) => !c.categoryId);

  const favorites = useFavorites((s) => s.channels);
  const channelsFavorites = channels.filter((c) => favorites.includes(c.id));

  const groups = [
    ...(channelsFavorites.length
      ? [{ id: "favoritos", name: "Favoritos", channels: channelsFavorites }]
      : []),
    ...(uncategorized.length
      ? [{ id: null, name: null, channels: uncategorized }]
      : []),
    ...(detail?.categories ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      channels: channels.filter((c) => c.categoryId === category.id),
    })),
  ];

  const withTrack = Boolean(detail?.guild.bannerUrl) && serverTrack;

  const ratio = useTrackRatio(withTrack ? detail?.guild.bannerUrl : null);

  return (
    <>
      <aside data-gc="servidor.channel-sidebar.aside"
        {...flxAttr("listChannelsFrame")}
        className={cn(
          "group/coluna canto-do-miolo topo-do-miolo relative flex flex-col bg-surface-1",
          fluid ? "min-w-0 flex-1" : "shrink-0",
          flxCls("listChannelsFrame"),
        )}
        style={fluid ? undefined : { width: width }}
      >
        <div data-gc="servidor.channel-sidebar.div" aria-hidden {...flx("sideDivider", "absolute inset-y-0 right-0 w-px bg-transparent")} />
        <div data-gc="servidor.channel-sidebar.div--2" {...flx("listChannels", "lista-de-canais miolo-recortado flex min-h-0 flex-1 flex-col")}>
        <header data-gc="servidor.channel-sidebar.header"
          className={cn(
            flxCls("serverHeader"),
            flxCls("headerServerFrame"),
            "regiao-de-arrasto relative flex shrink-0 items-start overflow-hidden shadow-sm",
            /*
              A mesma divisa da lista de conversas (`border-divisor`). Aqui era
              `border-line`, que é outro token e, em todo tema menos o Grafite,
              é mais claro — a linha do topo mudava de cor quando você saía das
              diretas e entrava num servidor. Com estandarte, quem separa é a
              própria imagem, como na referência.
            */
            !withTrack && "h-[var(--layout-header-height)] border-b border-divisor",
          )}
          style={
            withTrack
              ? {
                  aspectRatio: String(ratio),
                  minHeight: "var(--layout-header-height)",
                  maxHeight: "min(30vh, 13rem)",
                }
              : undefined
          }
        >
          {withTrack && (
            <>
              <div data-gc="servidor.channel-sidebar.div--3"
                aria-hidden
                className="absolute inset-0 bg-cover bg-top bg-no-repeat"
                style={{ backgroundImage: `url(${detail!.guild.bannerUrl})` }}
              />
              <div data-gc="servidor.channel-sidebar.div--4"
                aria-hidden
                className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-sobre-midia to-transparent"
              />
            </>
          )}

          <div data-gc="servidor.channel-sidebar.div--5" className="relative z-10 flex h-[var(--layout-header-height)] w-full items-center justify-between px-2">
          <DropdownMenu data-gc="servidor.channel-sidebar.dropdown-menu">
            <DropdownMenuTrigger data-gc="servidor.channel-sidebar.dropdown-menu-trigger" asChild disabled={!detail}>
              <button data-gc="servidor.channel-sidebar.button"
                className={cn(
                  "group/nome flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-left transition",
                  withTrack
                    ? "hover:bg-sobre-midia data-[state=open]:bg-sobre-midia"
                    : "hover:bg-surface-3 data-[state=open]:bg-surface-3",
                )}
              >
                <CommunitySeal data-gc="servidor.channel-sidebar.community-seal"
                  verified={detail?.guild.verified}
                  detectable={detail?.guild.detectable}
                  className={cn(withTrack && "drop-shadow-[0_1px_2px_rgb(0_0_0/0.8)]")}
                />
                <h1 data-gc="servidor.channel-sidebar.h1"
                  className={cn(
                    "truncate font-semibold",
                    withTrack && "text-sobre-marca [text-shadow:0_1px_3px_rgb(0_0_0/0.9)]",
                  )}
                >
                  {detail?.guild.name ?? "…"}
                </h1>
                <ChevronDown data-gc="servidor.channel-sidebar.chevron-down"
                  size={16}
                  className={cn(
                    "shrink-0 transition-transform duration-150 group-data-[state=open]/nome:rotate-180",
                    withTrack
                      ? "text-sobre-marca drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                      : "text-ink-muted",
                  )}
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent data-gc="servidor.channel-sidebar.dropdown-menu-content" align="start" className="w-64">
              {can("CREATE_INVITE") && (
                <DropdownMenuItem data-gc="servidor.channel-sidebar.dropdown-menu-item" onSelect={() => setInviting(true)}>
                  Convidar pessoas <UserPlus data-gc="servidor.channel-sidebar.user-plus" size={16} />
                </DropdownMenuItem>
              )}

              {canConfigure && (
                <DropdownMenuItem data-gc="servidor.channel-sidebar.dropdown-menu-item--2"
                  onSelect={() => settings.open(detail!.guild.id)}
                >
                  Configurações do servidor <Settings data-gc="servidor.channel-sidebar.settings" size={16} />
                </DropdownMenuItem>
              )}

              {canManageChannels && (
                <>
                  <DropdownMenuSeparator data-gc="servidor.channel-sidebar.dropdown-menu-separator" />
                  <DropdownMenuItem data-gc="servidor.channel-sidebar.dropdown-menu-item--3" onSelect={() => setCreatingIn(null)}>
                    Criar canal <Plus data-gc="servidor.channel-sidebar.plus" size={16} />
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator data-gc="servidor.channel-sidebar.dropdown-menu-separator--2" />
              <DropdownMenuItem data-gc="servidor.channel-sidebar.dropdown-menu-item--4"
                onSelect={() => {
                  void copyText(detail?.guild.id ?? "");
                  toast.success("ID copiado.");
                }}
              >
                Copiar ID do servidor
              </DropdownMenuItem>

              <DropdownMenuSeparator data-gc="servidor.channel-sidebar.dropdown-menu-separator--3" />
              {isOwner ? (
                <DropdownMenuItem data-gc="servidor.channel-sidebar.dropdown-menu-item--5"
                  danger
                  onSelect={() =>
                    settings.open(detail!.guild.id, "doDelete")
                  }
                >
                  Excluir servidor <Trash2 data-gc="servidor.channel-sidebar.trash2" size={16} />
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem data-gc="servidor.channel-sidebar.dropdown-menu-item--6" danger onSelect={() => onLeaveGuild()}>
                  Sair do servidor <LogOut data-gc="servidor.channel-sidebar.log-out" size={16} />
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {detail && can("CREATE_INVITE") && (
            <Tooltip data-gc="servidor.channel-sidebar.tooltip" label="Convidar amigos">
              <IconButton data-gc="servidor.channel-sidebar.icon-button"
                onClick={() => setInviting(true)}
                label="Convidar amigos"
                className={cn(
                  "rounded-lg [&_svg]:size-[18px]",
                  withTrack &&
                    "text-sobre-marca drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] hover:bg-sobre-midia hover:text-sobre-marca/80",
                )}
              >
                <UserPlus data-gc="servidor.channel-sidebar.user-plus--2" weight="fill" />
              </IconButton>
            </Tooltip>
          )}
          </div>
        </header>

        {detail && detail.members.length <= 2 && can("CREATE_INVITE") && (
          <InviteFriendsCard data-gc="servidor.channel-sidebar.invite-friends-card" guildId={detail.guild.id} guildName={detail.guild.name} />
        )}

        <div data-gc="servidor.channel-sidebar.div--6" className="relative flex min-h-0 flex-1 flex-col">
          {viewOutside.above && (
            <Button data-gc="servidor.channel-sidebar.button--2" type="button" size="xs" onClick={() => irForNotRead("acima")} className={cn(PILL, "top-2")}>
              {t("servidor.novasMensagens")}
            </Button>
          )}
          {viewOutside.below && (
            <Button data-gc="servidor.channel-sidebar.button--3" type="button" size="xs" onClick={() => irForNotRead("abaixo")} className={cn(PILL, "bottom-2")}>
              {t("servidor.novasMensagens")}
            </Button>
          )}

          <ContextMenu data-gc="servidor.channel-sidebar.context-menu">
          <ContextMenuTrigger data-gc="servidor.channel-sidebar.context-menu-trigger" asChild>
          <div data-gc="servidor.channel-sidebar.div.measure-view-outside" ref={scroller} onScroll={measureViewOutside} {...flx("channelsScroller", "flex-1 overflow-y-auto px-2 py-3")}>
            <div data-gc="servidor.channel-sidebar.div--7" className="mb-2 border-b border-divisor pb-2">
              <button data-gc="servidor.channel-sidebar.button--4"
                type="button"
                onClick={() => setViewingEvents(true)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-base font-medium leading-5 text-ink-faint transition hover:bg-hover hover:text-ink"
              >
                <CalendarBlank data-gc="servidor.channel-sidebar.calendar-blank" size={20} weight="fill" className="shrink-0" />
                <span data-gc="servidor.channel-sidebar.span" className="min-w-0 flex-1 truncate">Eventos</span>

                {Boolean(events.data?.length) && (
                  <span data-gc="servidor.channel-sidebar.span--2" className="shrink-0 rounded-full bg-selecionado px-1.5 text-11 font-semibold text-ink-muted">
                    {events.data?.length}
                  </span>
                )}
              </button>
            </div>

            {groups.map((group) => {
              const isCollapsed = group.id ? collapsed[group.id] : false;

              return (
                <section data-gc="servidor.channel-sidebar.section" key={group.id ?? "sem-categoria"} {...flx("channelsGroup", "mb-4")}>
                  {group.name && (
                    <div data-gc="servidor.channel-sidebar.div--8" className="group flex items-center justify-between px-1">
                      <button data-gc="servidor.channel-sidebar.button--5"
                        onClick={() =>
                          group.id &&
                          setCollapsed({
                            ...collapsed,
                            [group.id]: !collapsed[group.id],
                          })
                        }
                        className="flex flex-1 items-center gap-1 py-1.5 text-sm font-semibold leading-5 text-ink-faint transition hover:text-ink"
                      >
                        <CaretDown data-gc="servidor.channel-sidebar.caret-down"
                          size={12}
                          weight="bold"
                          className={cn("shrink-0 transition-transform", isCollapsed && "-rotate-90")}
                        />
                        <span data-gc="servidor.channel-sidebar.span--3" className="truncate">{group.name}</span>
                      </button>
                      {canManageChannels && group.id !== "favoritos" && (
                        <button data-gc="servidor.channel-sidebar.button--6"
                          onClick={() => setCreatingIn(group.id)}
                          title="Criar canal"
                          className="text-ink-faint opacity-0 transition hover:text-ink group-hover:opacity-100"
                        >
                          <Plus data-gc="servidor.channel-sidebar.plus--2" size={16} />
                        </button>
                      )}
                    </div>
                  )}

                  {!isCollapsed &&
                    group.channels.map((channel) => {
                      const active = channel.id === activeChannelId;
                      if (!active && hideMuted && byChannel[channel.id] === "nada") return null;
                      const reading = readStates[channel.id];
                      const unread =
                        !active &&
                        channel.lastMessageId &&
                        channel.lastMessageId !== reading?.read;
                      const notRead = unread ? (reading?.notRead ?? 0) : 0;
                      const mentions = unread ? (reading?.mentions ?? 0) : 0;
                      const inThisCall = voiceChannelId === channel.id;
                      const blocked =
                        channel.type === "VOICE" &&
                        !canInChannel(channel.id, "CONNECT");

                      const entries = (detail?.voiceStates[channel.id] ?? [])
                        .map((v) => v.joinedAt)
                        .filter((t): t is number => Number.isFinite(t));
                      const callSince = entries.length
                        ? Math.min(...entries)
                        : null;

                      return (
                        <div data-gc="servidor.channel-sidebar.div--9" key={channel.id} className="group/canal relative" data-canal={channel.id} data-nao-lido={unread ? "1" : undefined}>
                          {unread && (
                            <span data-gc="servidor.channel-sidebar.span--4"
                              aria-hidden
                              {...flx("channelUnreadPill", "pointer-events-none absolute -left-2 top-1/2 h-2 w-1 -translate-y-1/2 rounded-r-full bg-pilula")}
                            />
                          )}
                          <button data-gc="servidor.channel-sidebar.button--7"
                            onClick={() =>
                              channel.type === "LINK"
                                ? channel.url &&
                                  window.open(channel.url, "_blank", "noopener,noreferrer")
                                : onSelectChannel(channel.id)
                            }
                            className={cn(
                              "mb-0.5 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-base font-medium leading-5 transition",
                              active
                                ? cn("bg-selecionado text-ink", flxCls("channelActiveItem"))
                                : blocked
                                  ? "text-ink-faint hover:bg-hover"
                                  : unread
                                    ? "font-semibold text-ink hover:bg-hover"
                                    : "text-ink-faint hover:bg-hover hover:text-ink",
                            )}
                          >
                            {channel.type === "VOICE" ? (
                              blocked ? (
                                <Lock data-gc="servidor.channel-sidebar.lock"
                                  size={20}
                                  className="shrink-0 text-ink-faint"
                                />
                              ) : (
                                <SpeakerHigh data-gc="servidor.channel-sidebar.speaker-high"
                                  size={20}
                                  weight="fill"
                                  className={cn(
                                    "shrink-0",
                                    inThisCall
                                      ? "text-online"
                                      : "text-ink-faint",
                                  )}
                                />
                              )
                            ) : channel.type === "LINK" ? (
                              <LinkSimple data-gc="servidor.channel-sidebar.link-simple"
                                size={20}
                                weight="bold"
                                className="shrink-0 text-ink-faint"
                              />
                            ) : channel.type === "FORUM" ? (
                              <ChatsCircle data-gc="servidor.channel-sidebar.chats-circle"
                                size={20}
                                weight="fill"
                                className="shrink-0 text-ink-faint"
                              />
                            ) : channel.isPrivate ? (
                              <Lock data-gc="servidor.channel-sidebar.lock--2"
                                size={20}
                                className="shrink-0 text-ink-faint"
                              />
                            ) : (
                              <Hash data-gc="servidor.channel-sidebar.hash"
                                size={20}
                                weight="bold"
                                className="shrink-0 text-ink-faint"
                              />
                            )}
                            <span data-gc="servidor.channel-sidebar.span--5"
                              className="flex min-w-0 flex-1 flex-col items-start justify-center text-left leading-[18px]"
                            >
                              <span data-gc="servidor.channel-sidebar.span--6"
                                className="-my-0.5 w-full truncate py-0.5"
                                style={{
                                  fontFamily:
                                    fontFamily(channel.font) ?? undefined,
                                }}
                              >
                                {channel.name}
                              </span>

                              {channel.type === "VOICE" && detail && (
                                <ChannelStatus data-gc="servidor.channel-sidebar.channel-status"
                                  guildId={detail.guild.id}
                                  channelId={channel.id}
                                  channelName={channel.name}
                                  status={channel.status}
                                  canEdit={inThisCall || canInChannel(channel.id, "MANAGE_CHANNELS")}
                                  visibleAlways={inThisCall}
                                />
                              )}
                            </span>

                            <span data-gc="servidor.channel-sidebar.span--7" className="ml-auto flex shrink-0 items-center gap-1.5 group-hover/canal:invisible">
                              {channel.type === "VOICE" &&
                                channel.userLimit > 0 && (
                                  <span data-gc="servidor.channel-sidebar.span--8"
                                    title={`${entries.length} de ${channel.userLimit}`}
                                    className={cn(
                                      "text-11 font-medium tabular-nums",
                                      entries.length >= channel.userLimit
                                        ? "text-danger"
                                        : "text-ink-faint",
                                    )}
                                  >
                                    {entries.length}/{channel.userLimit}
                                  </span>
                                )}

                              {channel.type === "VOICE" &&
                                callSince !== null &&
                                !unread && <CallTimer data-gc="servidor.channel-sidebar.call-timer" since={callSince} />}

                              {unread &&
                                (notRead > 0 ? (
                                  <span data-gc="servidor.channel-sidebar.span--9"
                                    title={
                                      mentions > 0
                                        ? `${mentions} menção(ões) a você`
                                        : undefined
                                    }
                                    className={cn(
                                      flxCls("mentionSeal"),
                                      "min-w-[18px] rounded-full px-1.5 text-center text-11 font-bold leading-[18px]",
                                      mentions > 0
                                        ? "bg-danger text-sobre-marca"
                                        : "bg-selecionado text-ink-muted",
                                    )}
                                  >
                                    {notRead > 99 ? "99+" : notRead}
                                  </span>
                                ) : (
                                  <span data-gc="servidor.channel-sidebar.span--10" className="size-2 rounded-full bg-ink" />
                                ))}
                            </span>
                          </button>

                          <div data-gc="servidor.channel-sidebar.div--10" className="pointer-events-none absolute right-2 top-1.5 flex gap-0.5 opacity-0 transition group-hover/canal:pointer-events-auto group-hover/canal:opacity-100">
                            {channel.type === "VOICE" && (
                              <IconButton data-gc="servidor.channel-sidebar.icon-button--2"
                                onClick={() => onOpenVoiceChat?.(channel.id)}
                                label="Abrir chat"
                                title="Abrir chat"
                                size="xs"
                                className="size-5 rounded text-ink-faint [&_svg]:size-4"
                              >
                                <ChatCircle data-gc="servidor.channel-sidebar.chat-circle" weight="fill" />
                              </IconButton>
                            )}

                            {can("CREATE_INVITE") && (
                              <IconButton data-gc="servidor.channel-sidebar.icon-button--3"
                                onClick={() => setInviting(true)}
                                label="Convidar pessoas"
                                title="Convidar pessoas"
                                size="xs"
                                className="size-5 rounded text-ink-faint [&_svg]:size-4"
                              >
                                <UserPlus data-gc="servidor.channel-sidebar.user-plus--3" weight="fill" />
                              </IconButton>
                            )}

                            {(canManageChannels || canManageRoles) && (
                              <IconButton data-gc="servidor.channel-sidebar.icon-button--4"
                                onClick={() => setEditingChannel(channel.id)}
                                label="Editar canal"
                                title="Editar canal"
                                size="xs"
                                className="size-5 rounded text-ink-faint [&_svg]:size-4"
                              >
                                <GearSix data-gc="servidor.channel-sidebar.gear-six" weight="fill" />
                              </IconButton>
                            )}
                          </div>

                          {channel.type === "VOICE" && (
                            <VoiceMembers data-gc="servidor.channel-sidebar.voice-members"
                              states={detail?.voiceStates[channel.id] ?? []}
                              members={detail?.members ?? []}
                              guildId={detail?.guild.id}
                              roles={detail?.roles}
                              voiceChannels={channels.filter(
                                (c) => c.type === "VOICE",
                              )}
                              minePermissions={detail?.permissions}
                              currentUserId={user?.id}
                            />
                          )}
                        </div>
                      );
                    })}
                </section>
              );
            })}
          </div>
          </ContextMenuTrigger>

          <ContextMenuContent data-gc="servidor.channel-sidebar.context-menu-content">
            <ContextMenuItem data-gc="servidor.channel-sidebar.context-menu-item"
              onSelect={() =>
                detail && setServer(detail.guild.id, { hideMuted: !hideMuted })
              }
            >
              Ocultar canais silenciados
              <Checkbox data-gc="servidor.channel-sidebar.checkbox" checked={hideMuted} readOnly tabIndex={-1} className="pointer-events-none" />
            </ContextMenuItem>

            {canManageChannels && (
              <>
                <ContextMenuSeparator data-gc="servidor.channel-sidebar.context-menu-separator" />
                <ContextMenuItem data-gc="servidor.channel-sidebar.context-menu-item--2" onSelect={() => setCreatingIn(null)}>Criar canal</ContextMenuItem>
                <ContextMenuItem data-gc="servidor.channel-sidebar.context-menu-item--3" onSelect={() => setCreatingCategory(true)}>Criar categoria</ContextMenuItem>
              </>
            )}

            {can("CREATE_INVITE") && (
              <>
                <ContextMenuSeparator data-gc="servidor.channel-sidebar.context-menu-separator--2" />
                <ContextMenuItem data-gc="servidor.channel-sidebar.context-menu-item--4" onSelect={() => setInviting(true)}>Convidar para o servidor</ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
          </ContextMenu>

        </div>
        </div>

      </aside>

      <CreateChannelModal data-gc="servidor.channel-sidebar.create-channel-modal"
        open={creatingIn !== false}
        guildId={detail?.guild.id}
        categoryId={creatingIn === false ? null : creatingIn}
        onClose={() => setCreatingIn(false)}
      />
      <Dialog data-gc="servidor.channel-sidebar.dialog" open={creatingCategory} onOpenChange={(isOpen) => !isOpen && setCreatingCategory(false)}>
        <DialogContent data-gc="servidor.channel-sidebar.dialog-content" className="max-w-sm">
          <DialogHeader data-gc="servidor.channel-sidebar.dialog-header">
            <DialogTitle data-gc="servidor.channel-sidebar.dialog-title">Criar categoria</DialogTitle>
          </DialogHeader>

          <DialogBody data-gc="servidor.channel-sidebar.dialog-body">
            <Label data-gc="servidor.channel-sidebar.label" htmlFor="nome-da-categoria">Nome da categoria</Label>
            <Input data-gc="servidor.channel-sidebar.input"
              id="nome-da-categoria"
              value={categoryName}
              maxLength={48}
              autoFocus
              placeholder="Ex: Conversas"
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || !categoryName.trim() || !detail) return;
                createCategory.mutate(
                  { guildId: detail.guild.id, name: categoryName.trim() },
                  { onSuccess: () => { setCategoryName(""); setCreatingCategory(false); } },
                );
              }}
            />
          </DialogBody>

          <DialogFooter data-gc="servidor.channel-sidebar.dialog-footer">
            <Button data-gc="servidor.channel-sidebar.button--8" variant="surface" onClick={() => setCreatingCategory(false)}>Cancelar</Button>
            <Button data-gc="servidor.channel-sidebar.button--9"
              disabled={!categoryName.trim() || createCategory.isPending}
              onClick={() =>
                detail &&
                createCategory.mutate(
                  { guildId: detail.guild.id, name: categoryName.trim() },
                  { onSuccess: () => { setCategoryName(""); setCreatingCategory(false); } },
                )
              }
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {detail && (
        <EventsModal data-gc="servidor.channel-sidebar.events-modal"
          guildId={detail.guild.id}
          open={viewingEvents}
          canCreate={isOwner || detail.permissions.includes("MANAGE_EVENTS")}
          onClose={() => setViewingEvents(false)}
        />
      )}

      <InviteModal data-gc="servidor.channel-sidebar.invite-modal"
        open={inviting}
        guildId={detail?.guild.id}
        guildName={detail?.guild.name}
        onClose={() => setInviting(false)}
      />

      {detail &&
        editingChannel &&
        (() => {
          const channel = channels.find((c) => c.id === editingChannel);
          if (!channel) return null;

          return (
            <ChannelSettingsModal data-gc="servidor.channel-sidebar.channel-settings-modal"
              open
              onClose={() => setEditingChannel(null)}
              guildId={detail.guild.id}
              channel={channel}
              roles={detail.roles}
              members={detail.members}
              minePermissions={detail.permissions}
              canManageChannels={canManageChannels}
              canManageRoles={canManageRoles}
            />
          );
        })()}

      {detail && (
        <ServerSettingsModal data-gc="servidor.channel-sidebar.server-settings-modal.close"
          open={configuring}
          onClose={settings.close}
          initialSection={settings.section}
          detail={detail}
          members={detail.members}
          currentUserId={user?.id}
          isOwner={isOwner}
          canManage={canManage}
          canManageRoles={canManageRoles}
          canManageWebhooks={canManageWebhooks}
          permissions={new Set(detail.permissions)}
        />
      )}
    </>
  );
};
