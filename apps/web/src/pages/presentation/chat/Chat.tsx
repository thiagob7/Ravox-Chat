import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { Check, Menu } from "lucide-react";
import {
  Bell,
  BellSlash,
  ChatCircle,
  ChatsCircle,
  Hash,
  SpeakerHigh,
  Users,
} from "@phosphor-icons/react";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useReadStates } from "~/@core/application/queries/message/use-read-states";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useLogout } from "~/@core/application/queries/auth/use-logout";
import { useRemoveMember } from "~/@core/application/queries/guild/use-remove-member";
import { joinChannel } from "~/@core/lib/websocket/join-channel";
import { Sheet, SheetCloseButton, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { useScreenNarrow } from "~/hooks/use-tela-estreita";
import type { ForumPostModel } from "~/@core/application/requests/forum/forum";
import {
  ChatArea,
  ChatPanel,
  ChatFooter,
} from "~/features/conversa/components/AreaDeConversa";
import type { SearchScope } from "~/@core/application/requests/message/buscar-mensagens";
import { SearchField } from "~/features/conversa/components/CampoDeBusca";
import { ChannelTopic } from "~/features/conversa/components/TopicoDoCanal";
import { ChannelSidebar } from "~/features/servidor/components/ChannelSidebar";
import { Composer } from "~/features/conversa/components/Composer";
import { ForumChannel } from "~/features/conversa/components/ForumChannel";
import { ForumPostView } from "~/features/conversa/components/ForumPostView";
import { PinnedMessagesPanel } from "~/features/conversa/components/PinnedMessagesPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useNotices, type ChannelMode } from "~/stores/notificacoes";
import { AppButton } from "~/features/app/components/BotaoDoAplicativo";
import { EntryBox } from "~/features/conversa/components/CaixaDeEntrada";
import { VoiceChatPanel } from "~/features/voz/components/VoiceChatPanel";
import { useVoiceChat } from "~/features/voz/stores/chat-da-voz";
import { LeftColumn } from "~/features/app/components/ColunaDaEsquerda";
import { WidthHandle, useResizableWidth } from "~/components/ui/resizable";
import { BarFooter } from "~/features/app/components/RodapeDaBarra";
import { GuildRail } from "~/features/servidor/components/GuildRail";
import { MemberList } from "~/features/servidor/components/MemberList";
import { MessageList } from "~/features/conversa/components/MessageList";
import { VoiceConfirmation } from "~/features/voz/components/ConfirmacaoDeVoz";
import { ModeratorView } from "~/features/servidor/components/ModeratorView";
import { ChannelStar } from "~/features/conversa/components/EstrelaDoCanal";
import { SearchPanel } from "~/features/conversa/components/PainelDeBusca";
import { TypingIndicator } from "~/features/conversa/components/TypingIndicator";
import { VoiceStage } from "~/features/voz/components/VoiceStage";
import { Button, IconButton } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { useSession } from "~/contexts/session-context";
import { usePermissions } from "~/hooks/use-permissions";
import { useRealtime } from "~/hooks/use-realtime";
import { useReconnectVoice } from "~/features/voz/hooks/use-reconnect-voice";
import { useModeration } from "~/features/servidor/stores/moderacao";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { fontFamily, loadFont } from "~/features/perfil/lib/fontes";
import { cn } from "~/lib/utils";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";

export const Chat: React.FC = () => {
  const { guildId: routeGuildId, channelId: routeChannelId } = useParams();
  const navigate = useNavigate();

  const { user, endSession, voiceReachable } = useSession();
  const { data: guilds = [], isSuccess: guildsLoaded } = useFindManyGuilds(true);
  const { data: detail } = useFindGuild(routeGuildId);
  const { data: readStates = {} } = useReadStates(true);
  const { data: relations = [] } = useFindFriends(true);
  const logout = useLogout();
  const removeMember = useRemoveMember();

  const joinVoice = useVoiceStore((s) => s.join);
  const voiceChannelId = useVoiceStore((s) => s.channelId);
  const [showMembers, setShowMembers] = useState(true);
  const [postIsOpen, setPostIsOpen] = useState<ForumPostModel | null>(null);
  const [voiceIsOpenChat, setVoiceIsOpenChat] = useState(false);
  const [search, setSearch] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("servidor");

  useRealtime(routeGuildId, routeChannelId);

  useEffect(() => {
    if (!routeGuildId && guildsLoaded && guilds[0]) {
      navigate(`/channels/${guilds[0].id}`, { replace: true });
    }
  }, [routeGuildId, guildsLoaded, guilds, navigate]);

  useEffect(() => {
    const channels = detail?.channels ?? [];
    if (!routeGuildId || !channels.length) return;

    const picked = channels.find((c) => c.id === routeChannelId);
    const target =
      picked && picked.type !== "LINK"
        ? picked
        : channels.find((c) => c.type === "TEXT");
    if (!target) return;

    if (target.id !== routeChannelId) {
      navigate(`/channels/${routeGuildId}/${target.id}`, { replace: true });
      return;
    }

    if (target.type === "TEXT" || target.type === "FORUM" || target.type === "VOICE") {
      void joinChannel(target.id).catch(() => undefined);
    }
  }, [routeGuildId, routeChannelId, detail, navigate]);

  useEffect(() => setPostIsOpen(null), [routeChannelId]);
  useEffect(() => setSearch(""), [routeGuildId]);
  useEffect(() => useModeration.getState().close(), [routeGuildId]);

  const channel = detail?.channels.find((c) => c.id === routeChannelId);

  useEffect(() => loadFont(channel?.font), [channel?.font]);
  const voiceVisibleChat = voiceIsOpenChat && channel?.type === "VOICE";
  const chatVoiceSide = useVoiceChat((s) => s.side);

  const summary = guilds.find((g) => g.id === routeGuildId);
  const { can, canInChannel } = usePermissions(detail);
  const chatVoicePanel =
    voiceVisibleChat && channel && detail ? (
      <VoiceChatPanel data-gc="chat.chat.voice-chat-panel"
        channelId={channel.id}
        channelName={channel.name}
        guildId={detail.guild.id}
        currentUserId={user?.id}
        isModerator={canInChannel(channel.id, "MANAGE_MESSAGES")}
        canWrite={canInChannel(channel.id, "SEND_MESSAGES")}
        onClose={() => setVoiceIsOpenChat(false)}
      />
    ) : null;
  const pendingRequests = relations.filter((r) => r.status === "PENDING_IN").length;

  const myVoiceState = Object.values(detail?.voiceStates ?? {})
    .flat()
    .find((state) => state.userId === user?.id);

  const accountVoiceChannelId = myVoiceState?.channelId ?? null;

  useReconnectVoice(Boolean(user));

  const inCallHere = voiceChannelId !== null;
  const inCallElsewhere = Boolean(accountVoiceChannelId) && !inCallHere;

  const selectChannel = (channelId: string) => {
    navigate(`/channels/${routeGuildId}/${channelId}`);

    const target = detail?.channels.find((c) => c.id === channelId);
    if (target?.type !== "VOICE") return;
    if (voiceChannelId === channelId) return;

    const accountAlreadyThisThisChannel = (detail?.voiceStates[channelId] ?? []).some(
      (state) => state.userId === user?.id,
    );
    if (accountAlreadyThisThisChannel) return setConfirmingVoice(channelId);
    if (!canInChannel(channelId, "CONNECT")) return;
    if (!voiceReachable) return;

    void joinVoice(channelId).catch(() => undefined);
  };

  const screenNarrow = useScreenNarrow();
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [membersIsOpen, setMembersIsOpen] = useState(false);

  const withoutHeader = channel?.type === "VOICE" && !screenNarrow;
  const [confirmingVoice, setConfirmingVoice] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout.mutateAsync().catch(() => undefined);
    endSession();
  };

  const side = useResizableWidth("canais", {
    initial: 320,
    token: "--layout-sidebar-width",
    min: 180,
    max: 420,
    edge: "right",
  });

  if (guildsLoaded && !guilds.length) return <Navigate to="/dm" replace />;

  const navigation = (
    <LeftColumn data-gc="chat.chat.left-column"
      fluid={screenNarrow}
      footer={
        <BarFooter data-gc="chat.chat.bar-footer"
          user={user}
          guildId={routeGuildId}
          onLogout={() => void handleLogout()}
          accountChannelId={inCallElsewhere ? accountVoiceChannelId : null}
        />
      }
      alca={
        <WidthHandle data-gc="chat.chat.width-handle"
          edge="right"
          dragging={side.dragging}
          width={side.width}
          bounds={side.bounds}
          {...side.handle}
        />
      }
    >
        <GuildRail data-gc="chat.chat.guild-rail"
          activeGuildId={routeGuildId ?? null}
          onSelect={(id) => navigate(`/channels/${id}`)}
          onOpenFriends={() => navigate("/dm")}
          pendingFriendRequests={pendingRequests}
        />

        <ChannelSidebar data-gc="chat.chat.channel-sidebar"
          detail={detail}
          summary={summary}
          activeChannelId={routeChannelId}
          width={side.width}
          fluid={screenNarrow}
          readStates={readStates}
          user={user}
          onSelectChannel={(id) => {
          selectChannel(id);
          setMenuIsOpen(false);
        }}
          onOpenVoiceChat={(id) => {
            navigate(`/channels/${routeGuildId}/${id}`);
            setVoiceIsOpenChat(true);
          }}
          onLeaveGuild={() => {
            if (!routeGuildId || !user) return;
            removeMember.mutate(
              { guildId: routeGuildId, userId: user.id },
              { onSuccess: () => navigate("/channels", { replace: true }) },
            );
          }}
        />
    </LeftColumn>
  );

  return (
    <div data-gc="chat.chat.div" {...flx("appLine", "flex h-full")}>
      {screenNarrow ? (
        <Sheet data-gc="chat.chat.sheet.set-menu-is-open" open={menuIsOpen} onOpenChange={setMenuIsOpen}>
          <SheetContent data-gc="chat.chat.sheet-content" className="inset-y-0 left-0 right-auto w-full max-w-none flex-row p-0 sm:w-[min(24rem,93vw)]">
            <SheetTitle data-gc="chat.chat.sheet-title" className="sr-only">Servidores e canais</SheetTitle>
            <SheetCloseButton data-gc="chat.chat.sheet-close-button" className="fechar-seguro absolute right-2 top-2 z-[60] rounded-full bg-surface-3/90 p-1.5 shadow-lg shadow-sombra backdrop-blur-sm sm:hidden" />
            {navigation}
          </SheetContent>
        </Sheet>
      ) : (
        navigation
      )}

      {screenNarrow && (
        <Sheet data-gc="chat.chat.sheet.set-members-is-open" open={membersIsOpen} onOpenChange={setMembersIsOpen}>
          <SheetContent data-gc="chat.chat.sheet-content--2" className="w-full max-w-none p-0">
            <header data-gc="chat.chat.header"
              className="flex h-[var(--layout-header-height)] shrink-0 items-center justify-between border-b border-divisor bg-cabecalho px-4 shadow-sm"
            >
              <SheetTitle data-gc="chat.chat.sheet-title--2" className="text-sm font-semibold text-ink">Membros</SheetTitle>
              <SheetCloseButton data-gc="chat.chat.sheet-close-button--2" className="-mr-1" />
            </header>

            <MemberList data-gc="chat.chat.member-list"
              fluid
              members={detail?.members ?? []}
              loading={!detail}
              roles={detail?.roles ?? []}
              ownerId={detail?.guild.hideOwnerCrown ? undefined : detail?.guild.ownerId}
              guildId={detail?.guild.id}
              canModerate={can("MODERATE_MEMBERS")}
            />
          </SheetContent>
        </Sheet>
      )}

      {/*
        A linha de cima é UMA só, e é do cabeçalho.

        Antes ela vinha do `topo-do-miolo` desta coluna. Medindo o print, a
        linha sobre a conversa saía em `#3e3e3f` enquanto a da lista de canais,
        na mesma altura da mesma captura, saía em `#2b2b2c` — o dobro da força,
        que é o que acontece quando dois fios de 1px caem um sobre o outro.
        Com a borda no cabeçalho, existe um fio só por construção. Sem
        cabeçalho não há o que segurar a linha, e aí a coluna volta a desenhar.
      */}
      <div data-gc="chat.chat.div--2" {...flx("coreColumn", cn("flex min-w-0 flex-1 flex-col", withoutHeader && "topo-do-miolo"))}>
        {!withoutHeader && (
        <header data-gc="chat.chat.header--2" {...flx("channelTop", "topo-do-canal regiao-de-arrasto mede-a-largura h-[var(--layout-header-height)] shrink-0 border-y border-divisor bg-cabecalho shadow-sm")}>
          <div data-gc="chat.chat.div--3"
            {...flx("topChannelCore", "flex h-full w-full items-center gap-2 px-4")}
          >
            {screenNarrow && (
              <IconButton data-gc="chat.chat.icon-button"
                onClick={() => setMenuIsOpen(true)}
                label="Abrir servidores e canais"
                className="-ml-1 rounded hover:bg-surface-3 [&_svg]:size-5"
              >
                <Menu data-gc="chat.chat.menu" />
              </IconButton>
            )}

            {channel?.type === "VOICE" ? (
              <SpeakerHigh data-gc="chat.chat.speaker-high" size={20} weight="fill" className={cn("text-ink-faint", flxCls("channelIcon"))} />
            ) : channel?.type === "FORUM" ? (
              <ChatsCircle data-gc="chat.chat.chats-circle" size={20} weight="fill" className={cn("text-ink-faint", flxCls("channelIcon"))} />
            ) : (
              <Hash data-gc="chat.chat.hash" size={20} weight="bold" className={cn("text-ink-faint", flxCls("channelIcon"))} />
            )}
            <h2 data-gc="chat.chat.h2"
              {...flx("channelName", "font-semibold")}
              style={{ fontFamily: fontFamily(channel?.font) ?? undefined }}
            >
              {channel?.name ?? "…"}
            </h2>

            {channel?.topic && (
              <ChannelTopic data-gc="chat.chat.channel-topic"
                name={channel.name}
                topic={channel.topic}
                compact={screenNarrow}
              />
            )}

            <div data-gc="chat.chat.div--4" {...flx("topSideRight", "ml-auto flex items-center gap-3")}>
              {channel && channel.type !== "VOICE" && <ChannelBell data-gc="chat.chat.channel-bell" channelId={channel.id} />}

              {channel && channel.type !== "VOICE" && (
                <PinnedMessagesPanel data-gc="chat.chat.pinned-messages-panel"
                  channelId={channel.id}
                  canManage={canInChannel(channel.id, "MANAGE_MESSAGES")}
                />
              )}

              {channel && <ChannelStar data-gc="chat.chat.channel-star" channelId={channel.id} />}

              {channel?.type === "VOICE" && (
                <Tooltip data-gc="chat.chat.tooltip" label={voiceIsOpenChat ? "Fechar chat" : "Abrir chat"}>
                  <button data-gc="chat.chat.button"
                    onClick={() => setVoiceIsOpenChat((isOpen) => !isOpen)}
                    aria-label={voiceIsOpenChat ? "Fechar chat" : "Abrir chat"}
                    className={cn(
                      "gc-icone transition hover:text-ink",
                      voiceIsOpenChat ? "text-ink" : "text-ink-muted",
                    )}
                  >
                    <ChatCircle data-gc="chat.chat.chat-circle" size={20} weight="fill" />
                  </button>
                </Tooltip>
              )}

              <Tooltip data-gc="chat.chat.tooltip--2" label="Membros">
                <button data-gc="chat.chat.button--2"
                  onClick={() =>
                    screenNarrow ? setMembersIsOpen(true) : setShowMembers((v) => !v)
                  }
                  className={cn("gc-icone transition hover:text-ink", flxCls("topChannelButton"), showMembers || membersIsOpen ? "text-ink" : "text-ink-muted")}
                >
                  <Users data-gc="chat.chat.users" size={20} weight="fill" />
                </button>
              </Tooltip>

              {routeGuildId && (
                <SearchField data-gc="chat.chat.search-field.set-search"
                  term={search}
                  onSearch={setSearch}
                  scope={searchScope}
                  scopes={["servidor", "comunidades", "dms", "tudo"]}
                  onScope={setSearchScope}
                />
              )}

              <AppButton data-gc="chat.chat.app-button" />
              <EntryBox data-gc="chat.chat.entry-box" />
            </div>
          </div>
        </header>
        )}

        <main data-gc="chat.chat.main" {...flx("channelFrame", "flex min-h-0 flex-1")}>
          <div data-gc="chat.chat.div--5" {...flx("chatColumn", "flex min-w-0 flex-1 flex-col bg-surface-2")}>

        {channel?.type === "VOICE" ? (
          voiceChannelId === channel.id ? (
            <VoiceStage data-gc="chat.chat.voice-stage"
              channelName={channel.name}
              guildId={detail?.guild.id}
              guildName={detail?.guild.name}
              members={detail?.members}
              roles={detail?.roles}
              voiceChannels={detail?.channels.filter((c) => c.type === "VOICE")}
              voiceStates={detail?.voiceStates[channel.id]}
              minePermissions={detail?.permissions}
              currentUserId={user?.id}
              chatIsOpen={voiceIsOpenChat}
              onToggleChat={() => setVoiceIsOpenChat((isOpen) => !isOpen)}
              canInvite={can("CREATE_INVITE")}
            />
          ) : (
            <div data-gc="chat.chat.div--6" {...flxAttr("voiceEmpty")} className="relative flex flex-1 flex-col items-center justify-center gap-3 text-center">
              {withoutHeader && (
                <div data-gc="chat.chat.div--7" className="regiao-de-arrasto absolute inset-x-0 top-0 h-12" />
              )}

              <SpeakerHigh data-gc="chat.chat.speaker-high--2" size={48} weight="fill" className="text-ink-faint" />
              <h3 data-gc="chat.chat.h3"
                className="text-lg font-semibold"
                style={{ fontFamily: fontFamily(channel.font) ?? undefined }}
              >
                {channel.name}
              </h3>

              {!canInChannel(channel.id, "CONNECT") ? (
                <p data-gc="chat.chat.p" className="max-w-sm text-sm text-ink-muted">
                  Você não tem permissão para entrar nesta chamada.
                </p>
              ) : !voiceReachable ? (
                <p data-gc="chat.chat.p--2" className="max-w-sm text-sm text-ink-muted">
                  A voz não está disponível neste acesso — o servidor de voz roda só na máquina de
                  quem hospeda. O chat, os anexos e o resto funcionam normalmente.
                </p>
              ) : accountVoiceChannelId === channel.id && inCallElsewhere ? (
                <>
                  <p data-gc="chat.chat.p--3" className="max-w-xs text-sm text-ink-muted">
                    Você já está nesta chamada — só que em outra aba. O áudio está tocando lá.
                  </p>
                  <Button data-gc="chat.chat.button--3" onClick={() => void joinVoice(channel.id).catch(() => undefined)}>
                    Trazer a chamada para esta aba
                  </Button>
                </>
              ) : (
                <Button data-gc="chat.chat.button--4"
                  variant="success"
                  onClick={() => void joinVoice(channel.id).catch(() => undefined)}
                >
                  Entrar na chamada
                </Button>
              )}
            </div>
          )
        ) : channel?.type === "FORUM" ? (
          postIsOpen ? (
            <ForumPostView data-gc="chat.chat.forum-post-view"
              post={postIsOpen}
              guildId={channel.guildId ?? ""}
              currentUserId={user?.id}
              isModerator={canInChannel(channel.id, "MANAGE_MESSAGES")}
              canWrite={canInChannel(channel.id, "SEND_MESSAGES")}
              onBack={() => setPostIsOpen(null)}
            />
          ) : (
            <ForumChannel data-gc="chat.chat.forum-channel.set-post-is-open"
              channelId={channel.id}
              channelName={channel.name}
              canWrite={canInChannel(channel.id, "SEND_MESSAGES")}
              onOpenPost={setPostIsOpen}
            />
          )
        ) : channel ? (
          <ChatArea data-gc="chat.chat.chat-area">
            <ChatPanel data-gc="chat.chat.chat-panel">
              <MessageList data-gc="chat.chat.message-list"
                channelId={channel.id}
                channelName={channel.name}
                guildId={channel.guildId ?? undefined}
                currentUserId={user?.id}
                isModerator={canInChannel(channel.id, "MANAGE_MESSAGES")}
              />
            </ChatPanel>

            <ChatFooter data-gc="chat.chat.chat-footer">
              <TypingIndicator data-gc="chat.chat.typing-indicator" channelId={channel.id} currentUserId={user?.id} />
              <Composer data-gc="chat.chat.composer"
                channelId={channel.id}
                channelName={channel.name}
                guildId={channel.guildId ?? undefined}
                canWrite={canInChannel(channel.id, "SEND_MESSAGES")}
                canAttach={canInChannel(channel.id, "ATTACH_FILES")}
                modeSlow={channel.slowmodeSeconds}
              />
            </ChatFooter>
          </ChatArea>
        ) : (
          <div data-gc="chat.chat.div--8" className="flex-1" />
        )}

        {chatVoiceSide === "baixo" && chatVoicePanel}
          </div>

          {chatVoiceSide === "direita" && chatVoicePanel}

          {search && routeGuildId && !voiceVisibleChat && (
            <SearchPanel data-gc="chat.chat.search-panel"
              guildId={routeGuildId}
              term={search}
              scope={searchScope}
              currentUserId={user?.id}
              onClose={() => setSearch("")}
              onIr={(channelId, messageId) => {
                const channel = detail?.channels.find((c) => c.id === channelId);
                navigate(channel ? `/channels/${routeGuildId}/${channelId}?m=${messageId}` : `/dm/${channelId}?m=${messageId}`);
              }}
            />
          )}

          {showMembers && channel?.type !== "VOICE" && !voiceVisibleChat && !search && (
            <MemberList data-gc="chat.chat.member-list--2"
              members={detail?.members ?? []}
              loading={!detail}
              roles={detail?.roles ?? []}
              ownerId={detail?.guild.hideOwnerCrown ? undefined : detail?.guild.ownerId}
              guildId={detail?.guild.id}
              canModerate={can("MODERATE_MEMBERS")}
            />
          )}

          <ModeratorView data-gc="chat.chat.moderator-view" roles={detail?.roles ?? []} />
        </main>
      </div>

      <VoiceConfirmation data-gc="chat.chat.voice-confirmation"
        channel={
          confirmingVoice
            ? (detail?.channels.find((c) => c.id === confirmingVoice)?.name ?? null)
            : null
        }
        onClose={() => setConfirmingVoice(null)}
        onBringForCa={() => {
          const target = confirmingVoice;
          setConfirmingVoice(null);
          if (target) void joinVoice(target).catch(() => undefined);
        }}
      />
    </div>
  );
};

const ChannelBell: React.FC<{ channelId: string }> = ({ channelId }) => {
  const mode = useNotices((s) => s.byChannel[channelId] ?? null);
  const setChannel = useNotices((s) => s.setChannel);

  const options: { mode: ChannelMode | null; label: string; detail: string }[] = [
    { mode: null, label: "Seguir o padrão", detail: "o que estiver em Notificações" },
    { mode: "tudo", label: "Todas as mensagens", detail: "avisa de tudo o que chegar" },
    { mode: "mencoes", label: "Só menções", detail: "avisa quando falarem com você" },
    { mode: "nada", label: "Silenciar canal", detail: "nenhum aviso, nenhum som" },
  ];

  return (
    <DropdownMenu data-gc="chat.chat.dropdown-menu">
      <DropdownMenuTrigger data-gc="chat.chat.dropdown-menu-trigger" asChild>
        <IconButton data-gc="chat.chat.icon-button--2"
          label="Avisos deste canal"
          className={cn(
            "gc-icone gc-icone--balanca rounded hover:bg-surface-3 [&_svg]:size-5",
            mode === "nada" ? "text-ink-faint" : "text-ink-muted",
          )}
        >
          <Tooltip data-gc="chat.chat.tooltip--3" label={mode === "nada" ? "Canal silenciado" : "Avisos deste canal"}>
            {mode === "nada" ? (
              <BellSlash data-gc="chat.chat.bell-slash" size={20} weight="fill" />
            ) : (
              <Bell data-gc="chat.chat.bell" size={20} weight="fill" />
            )}
          </Tooltip>
        </IconButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent data-gc="chat.chat.dropdown-menu-content" align="end" className="w-64">
        {options.map((option) => (
          <DropdownMenuItem data-gc="chat.chat.dropdown-menu-item"
            key={option.label}
            onSelect={() => setChannel(channelId, option.mode)}
            className="flex-col items-start gap-0"
          >
            <span data-gc="chat.chat.span" className="flex w-full items-center justify-between gap-2">
              {option.label}
              {mode === option.mode && <Check data-gc="chat.chat.check" size={15} className="shrink-0 text-brand" />}
            </span>
            <span data-gc="chat.chat.span--2" className="text-xs text-ink-faint">{option.detail}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

