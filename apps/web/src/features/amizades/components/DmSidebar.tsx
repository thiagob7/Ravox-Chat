import React, { useMemo, useState } from "react";
import { PLAN_NAME } from "@gravae/shared";
import { Mail, Phone, Plus, Users, Volume2, Infinity as InfinityIcon } from "lucide-react";
import type { ProfilePublic } from "@gravae/shared";

import { useFindDms } from "~/@core/application/queries/friend/use-find-dms";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useActive } from "~/@core/application/queries/friend/use-ativos";
import { useDmRequests } from "~/@core/application/queries/friend/use-pedidos-de-dm";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { chatStatus } from "~/features/amizades/lib/status-da-conversa";
import { useDmList } from "~/features/amizades/stores/dm-list";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserName } from "~/features/perfil/components/UserName";
import { DmContextMenu } from "~/features/amizades/components/DmContextMenu";
import { NewChatModal } from "~/features/amizades/components/NovaConversaModal";
import { IconButton } from "~/components/ui/button";
import { SearchField } from "~/components/ui/input";
import { CountBadge, NavItem } from "~/components/ui/nav-item";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { flx, flxAttr } from "~/lib/compat-de-tema";
import { flxCls } from "~/lib/compat-de-tema";
import { useTranslation } from "~/traducao";

interface DmSidebarProps {
  activeChannelId: string | undefined;
  readStates: Record<string, { read: string | null; notRead: number }>;
  user: SelfUserModel;
  onOpenFriends: () => void;
  onOpenRequests: () => void;
  onOpenInfinity: () => void;
  requestsIsOpen: boolean;
  infinityIsOpen: boolean;
  onSelectDm: (channelId: string) => void;
  width: number;
  fluid?: boolean;
}

export const DmSidebar: React.FC<DmSidebarProps> = ({
  activeChannelId,
  readStates,
  user,
  onOpenFriends,
  onOpenRequests,
  onOpenInfinity,
  requestsIsOpen,
  infinityIsOpen,
  onSelectDm,
  width,
  fluid = false,
}) => {
  const { t } = useTranslation();
  const { data: dms = [] } = useFindDms(true);
  const { data: relations = [] } = useFindFriends(true);

  const { data: requestsBox } = useDmRequests(true);
  const { data: actives = [] } = useActive();
  const inVoice = new Set(actives.map((a) => a.user.id));

  const channelCall = useVoiceStore((s) => s.channelId);
  const [creatingChat, setCreatingChat] = useState(false);

  const [search, setSearch] = useState("");

  const pinned = useDmList((s) => s.pinned);
  const muted = useDmList((s) => s.muted);

  /*
    Fixada sobe, e entre as fixadas vale a ordem em que foram fixadas. O resto
    da lista fica como o servidor mandou, que é por conversa mais recente.
  */
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    const found = term
      ? dms.filter(
          (dm) =>
            dm.user.displayName.toLowerCase().includes(term) ||
            dm.user.username.toLowerCase().includes(term),
        )
      : dms;

    if (!pinned.length) return found;

    const place = (id: string) => {
      const index = pinned.indexOf(id);
      return index === -1 ? pinned.length : index;
    };

    return [...found].sort((a, b) => place(a.id) - place(b.id));
  }, [dms, search, pinned]);

  const requestsReceived = relations.filter((r) => r.status === "PENDING_IN").length;
  const pendingRequests = requestsBox?.requests.length ?? 0;

  return (
    <aside data-gc="amizades.dm-sidebar.aside"
      {...flxAttr("chatsColumn")}
      className={cn(
        "group/coluna canto-do-miolo topo-do-miolo relative flex flex-col bg-surface-1",
        fluid ? "min-w-0 flex-1" : "shrink-0",
      )}
      style={fluid ? undefined : { width: width }}
    >
      <div data-gc="amizades.dm-sidebar.div" aria-hidden {...flx("sideDivider", "absolute inset-y-0 right-0 w-px bg-transparent")} />
      <div data-gc="amizades.dm-sidebar.div--2" {...flx("listChats", cn("lista-de-conversas miolo-recortado flex min-h-0 flex-1 flex-col", flxCls("listChatsPanel")))}>
      <header data-gc="amizades.dm-sidebar.header" className={cn("regiao-de-arrasto flex h-[var(--layout-header-height)] items-center border-b border-divisor px-4 shadow-sm", flxCls("listChatsTop"))}>
        <h1 data-gc="amizades.dm-sidebar.h1" className="truncate font-semibold">{t("amizades.mensagensDiretas")}</h1>
      </header>

      <div data-gc="amizades.dm-sidebar.div--3" className="relative flex min-h-0 flex-1 flex-col">
      <div data-gc="amizades.dm-sidebar.div--4" {...flx("chatsScroller", "flex-1 overflow-y-auto px-2 py-3")}>
        <SearchField data-gc="amizades.dm-sidebar.search-field"
          className="mb-3 h-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder={t("amizades.encontreConversa")}
          aria-label={t("amizades.encontreConversa")}
        />

        <NavItem data-gc="amizades.dm-sidebar.nav-item.on-open-friends"
          className="mb-0.5"
          active={!activeChannelId && !requestsIsOpen && !infinityIsOpen}
          icon={<Users data-gc="amizades.dm-sidebar.users" />}
          badge={<CountBadge data-gc="amizades.dm-sidebar.count-badge" count={requestsReceived} />}
          onClick={onOpenFriends}
        >
          {t("amizades.amigos")}
        </NavItem>

        <NavItem data-gc="amizades.dm-sidebar.nav-item.on-open-infinity"
          active={infinityIsOpen}
          icon={<InfinityIcon data-gc="amizades.dm-sidebar.infinity-icon" />}
          onClick={onOpenInfinity}
        >
          {PLAN_NAME}
        </NavItem>

        <NavItem data-gc="amizades.dm-sidebar.nav-item.on-open-requests"
          className="mb-3"
          active={requestsIsOpen}
          icon={<Mail data-gc="amizades.dm-sidebar.mail" />}
          badge={<CountBadge data-gc="amizades.dm-sidebar.count-badge--2" count={pendingRequests} />}
          onClick={onOpenRequests}
        >
          {t("amizades.solicitacoes")}
        </NavItem>

        <div data-gc="amizades.dm-sidebar.div--5" className="mb-1 mt-2 flex items-center gap-1 border-t border-line pl-2 pr-1 pt-3">
          <h2 data-gc="amizades.dm-sidebar.h2" className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {t("amizades.mensagensDiretas")}
          </h2>

          <Tooltip data-gc="amizades.dm-sidebar.tooltip" label={t("amizades.nova.titulo")}>
            <IconButton data-gc="amizades.dm-sidebar.icon-button"
              size="xs"
              label={t("amizades.nova.titulo")}
              onClick={() => setCreatingChat(true)}
            >
              <Plus data-gc="amizades.dm-sidebar.plus" />
            </IconButton>
          </Tooltip>
        </div>

        {visible.length === 0 && !search && (
          <p data-gc="amizades.dm-sidebar.p" className="px-2 py-1 text-xs text-ink-faint">
            {t("amizades.semConversas")}
          </p>
        )}

        {visible.length === 0 && search && (
          <p data-gc="amizades.dm-sidebar.p--2" className="px-2 py-1 text-xs text-ink-faint">{t("amizades.semConversaComEsseNome")}</p>
        )}

        {visible.map((dm) => {
          const active = dm.id === activeChannelId;
          const quiet = muted.includes(dm.id);
          const notRead = !active && !quiet && dm.lastMessageId && dm.lastMessageId !== readStates[dm.id]?.read;
          const friendship = relations.find((r) => r.status === "ACCEPTED" && r.user.id === dm.user.id);

          return (
            <DmContextMenu data-gc="amizades.dm-sidebar.dm-context-menu"
              key={dm.id}
              channelId={dm.id}
              userId={dm.user.id}
              name={dm.user.displayName}
              friendshipId={friendship?.id ?? null}
            >
            <button data-gc="amizades.dm-sidebar.button"
              onClick={() => onSelectDm(dm.id)}
              className={cn(
                "mb-0.5 flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-sm transition",
                flxCls("chatItem"),
                active
                  ? cn("bg-selecionado text-ink", flxCls("chatActiveItem"))
                  : notRead
                    ? "font-semibold text-ink hover:bg-surface-3"
                    : "text-ink-muted hover:bg-surface-3",
                quiet && !active && "opacity-50",
              )}
            >
              <Avatar data-gc="amizades.dm-sidebar.avatar"
                id={dm.user.id}
                name={dm.user.displayName}
                url={dm.user.avatarUrl}
                size={32}
                status={dm.user.status}
                charms={{ decoration: dm.user.decoration as ProfilePublic["decoration"] }}
              />
              <span data-gc="amizades.dm-sidebar.span" className="min-w-0 flex-1 text-left">
                <span data-gc="amizades.dm-sidebar.span--2" className="block truncate">
                  <UserName data-gc="amizades.dm-sidebar.user-name" name={dm.user.displayName} isBot={dm.user.isBot} isSystem={dm.user.system} seal="sm" />
                </span>

                {(() => {
                  const status = chatStatus({
                    inCallWithMe: channelCall === dm.id,
                    inVoiceServer: inVoice.has(dm.user.id),
                  });

                  if (!status) return null;

                  return (
                    <span data-gc="amizades.dm-sidebar.span--3" className="flex items-center gap-1 truncate text-xs font-normal text-ink-faint">
                      {status.kind === "chamada" ? (
                        <Phone data-gc="amizades.dm-sidebar.phone" size={11} className="shrink-0 text-online" />
                      ) : (
                        <Volume2 data-gc="amizades.dm-sidebar.volume2" size={11} className="shrink-0 text-online" />
                      )}
                      {t(status.key)}
                    </span>
                  );
                })()}
              </span>

              {notRead && <span data-gc="amizades.dm-sidebar.span--4" className="ml-auto size-2 shrink-0 rounded-full bg-ink" />}
            </button>
            </DmContextMenu>
          );
        })}
      </div>

      </div>
      </div>

      <NewChatModal data-gc="amizades.dm-sidebar.new-chat-modal.on-select-dm"
        isOpen={creatingChat}
        onClose={() => setCreatingChat(false)}
        onOpenChat={onSelectDm}
      />
    </aside>
  );
};
