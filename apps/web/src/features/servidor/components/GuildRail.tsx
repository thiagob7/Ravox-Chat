import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowDownToLine, Compass, Download, Infinity as InfinityIcon, Plus, RotateCw } from "lucide-react";
import { PLAN_NAME } from "@gravae/shared";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { useReadStatesByServer } from "~/@core/application/queries/message/use-read-states";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";
import { AddServerModal } from "~/features/servidor/components/AdicionarServidorModal";
import { Tooltip } from "~/components/ui/tooltip";
import { InviteModal } from "~/features/servidor/components/InviteModal";
import { ServerItem, DRAG_KIND } from "~/features/servidor/components/ItemDoServidor";
import { RailFolder } from "~/features/servidor/components/PastaDoTrilho";
import { buildRail, type Destination } from "~/features/servidor/lib/trilho";
import { useFolders } from "~/features/servidor/stores/pastas";
import { useVoiceStates } from "~/@core/application/queries/voice/use-voice-states";
import { desktop, isDesktop } from "~/lib/desktop";
import { useShortcutGlobal } from "~/features/app/hooks/use-atalho-global";
import { useUpdate } from "~/features/app/hooks/use-atualizacao";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { flx, flxAttr, flxCls, type Places } from "~/lib/compat-de-tema";
import { usePlanStore } from "~/features/plan/stores/plan-store";

interface GuildRailProps {
  activeGuildId: string | null;
  onSelect: (guildId: string) => void;
  onOpenFriends: () => void;
  pendingFriendRequests: number;
}

const isMac =
  desktop()?.platform === "darwin" ||
  (typeof navigator !== "undefined" && /Mac/.test(navigator.platform));

export const GuildRail: React.FC<GuildRailProps> = ({
  activeGuildId,
  onSelect,
  onOpenFriends,
  pendingFriendRequests,
}) => {
  const { t } = useTranslation();
  const { data: guilds = [] } = useFindManyGuilds(true);
  const [invitingAt, setInvitingAt] = useState<string | null>(null);
  const layout = useFolders((s) => s.layout);
  const move = useFolders((s) => s.move);
  const [droppingEnd, setDroppingEnd] = useState(false);
  const items = buildRail(guilds, layout);
  const drop = (guildId: string, destination: Destination) => move(guilds.map((g) => g.id), guildId, destination);
  const { data: byServer = {} } = useReadStatesByServer(true);
  const { data: voices = {} } = useVoiceStates(true);
  const [creating, setCreating] = useState(false);
  const openSettings = useSettings((s) => s.open);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const inExplore = pathname.startsWith("/explorar") || pathname.startsWith("/apps/");
  const inChats = activeGuildId === null && !inExplore;
  const update = useUpdate();
  const upgradeOpen = usePlanStore((s) => s.upgradeOpen);
  const openUpgrade = usePlanStore((s) => s.openUpgrade);

  useShortcutGlobal("servidor-novo", () => setCreating(true));
  useShortcutGlobal("configuracoes", () => openSettings("account"));

  return (
    <>
      <nav data-gc="servidor.guild-rail.nav" {...flx("serversRail", "trilho-de-servidores flex w-[var(--layout-guild-list-width)] shrink-0 flex-col bg-surface-1")}>
        <div data-gc="servidor.guild-rail.div" {...flx("railScroller", "flex min-h-0 flex-1 flex-col overflow-y-auto")}>
        <div data-gc="servidor.guild-rail.div--2" {...flx("railContent", "flex flex-col items-center gap-2 pb-36 pt-3")}>
        <div data-gc="servidor.guild-rail.div--3" {...flx("topRailSection", "flex w-full flex-col items-center gap-2")}>
        <div data-gc="servidor.guild-rail.div--4" {...flx("railItem", "group/servidor relative flex w-full justify-center")}>
          <span data-gc="servidor.guild-rail.span"
            {...flx(
              "serverPill",
              cn(
                "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-pilula transition-all",
                inChats ? "h-10" : "h-0 group-hover/servidor:h-5",
              ),
            )}
          />
          <Tooltip data-gc="servidor.guild-rail.tooltip" label="Amigos e mensagens diretas" side="right">
            <button data-gc="servidor.guild-rail.button.on-open-friends"
              onClick={onOpenFriends}
              className={cn(
                "relative flex size-[var(--guild-icon-size)] items-center justify-center text-xl font-bold transition-all duration-200 ease-out",
                inChats
                  ? "rounded-xl bg-brand"
                  : "rounded-[calc(var(--guild-icon-size)*0.5)] bg-surface-3 hover:rounded-xl hover:bg-brand",
              )}
            >
              <img data-gc="servidor.guild-rail.img"
                src="/brand/logo%20g%20branco.svg"
                alt=""
                className="h-6 w-auto object-contain"
                draggable={false}
              />
              {pendingFriendRequests > 0 && (
                <span data-gc="servidor.guild-rail.span--2" {...flx("serverSeal", "absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-surface-1 bg-danger text-10 font-bold text-sobre-marca")}>
                  {pendingFriendRequests}
                </span>
              )}
            </button>
          </Tooltip>
        </div>

        <div data-gc="servidor.guild-rail.div--5" {...flx("railDivider", "my-1 h-0.5 w-8 rounded-full bg-surface-3")} />
        </div>

        <div data-gc="servidor.guild-rail.div--6" {...flx("serversSection", "flex w-full flex-col items-center gap-2")}>

        {items.map((item) =>
          item.kind === "pasta" ? (
            <RailFolder data-gc="servidor.guild-rail.rail-folder.on-select"
              key={`pasta:${item.folder.id}`}
              folder={item.folder}
              guilds={item.guilds}
              activeGuildId={activeGuildId}
              byServer={byServer}
              voices={voices}
              onSelect={onSelect}
              onInvite={setInvitingAt}
              onDrop={drop}
            />
          ) : (
            <ServerItem data-gc="servidor.guild-rail.server-item.on-select"
              key={item.guild.id}
              guild={item.guild}
              active={item.guild.id === activeGuildId}
              notRead={byServer[item.guild.id]?.notRead ?? 0}
              mentions={byServer[item.guild.id]?.mentions ?? 0}
              voices={voices[item.guild.id] ?? []}
              onSelect={onSelect}
              onInvite={() => setInvitingAt(item.guild.id)}
              onDrop={drop}
            />
          ),
        )}

        <div data-gc="servidor.guild-rail.div--7"
          aria-hidden
          className={cn("h-2 w-full transition-all", droppingEnd && "h-6")}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes(DRAG_KIND)) return;
            e.preventDefault();
            setDroppingEnd(true);
          }}
          onDragLeave={() => setDroppingEnd(false)}
          onDrop={(e) => {
            const dragged = e.dataTransfer.getData(DRAG_KIND);
            setDroppingEnd(false);
            if (!dragged) return;
            e.preventDefault();
            drop(dragged, { kind: "fim" });
          }}
        />
        </div>

        {guilds.length > 0 && (
          <div data-gc="servidor.guild-rail.div--8" className="my-1 h-0.5 w-8 rounded-full bg-surface-3" />
        )}

        <RailAction data-gc="servidor.guild-rail.rail-action"
          label="Criar ou entrar num servidor"
          place="createServerButton"
          shortcut={[isMac ? "⌘" : "Ctrl", "Shift", "N"]}
          onClick={() => setCreating(true)}
        >
          <Plus data-gc="servidor.guild-rail.plus" size={22} className={flxCls("createServerIcon")} />
        </RailAction>

        <RailAction data-gc="servidor.guild-rail.rail-action--2"
          label="Explorar comunidades"
          place="exploreButton"
          active={inExplore}
          onClick={() => navigate("/explorar")}
        >
          <Compass data-gc="servidor.guild-rail.compass" size={22} />
        </RailAction>

        {!isDesktop() ? (
          <RailAction data-gc="servidor.guild-rail.rail-action--3" label="Baixar o aplicativo" onClick={() => openSettings("app")}>
            <Download data-gc="servidor.guild-rail.download" size={20} />
          </RailAction>
        ) : (
          update.hasNews && (
            <Tooltip data-gc="servidor.guild-rail.tooltip--2"
              side="right"
              label={
                update.installing
                  ? `Instalando a versão ${update.state?.available}…`
                  : update.state?.error && update.ready
                    ? `${update.state.error} Clique para tentar de novo.`
                    : update.ready
                      ? `Versão ${update.state?.available} pronta — clique para reiniciar`
                      : update.downloading
                        ? `Baixando a versão ${update.state?.available}…`
                        : `Saiu a versão ${update.state?.available} — clique para baixar`
              }
            >
              <button data-gc="servidor.guild-rail.button"
                aria-label="Atualização do aplicativo"
                disabled={update.downloading || update.installing}
                onClick={() =>
                  void (update.ready
                    ? update.bridge?.install()
                    : update.bridge?.download())
                }
                className={cn(
                  "relative flex size-12 items-center justify-center rounded-3xl border-2 border-dashed transition-all",
                  "hover:rounded-2xl disabled:cursor-default",
                  update.state?.error && update.ready
                    ? "border-danger text-danger hover:bg-danger-fundo"
                    : update.ready || update.installing
                      ? "border-online text-online hover:bg-online/10"
                      : "border-surface-4 text-ink-muted hover:border-ink hover:text-ink",
                )}
              >
                {update.installing ? (
                  <RotateCw data-gc="servidor.guild-rail.rotate-cw" size={20} className="animate-spin" />
                ) : update.downloading ? (
                  <ArrowDownToLine data-gc="servidor.guild-rail.arrow-down-to-line" size={20} className="animate-pulse" />
                ) : (
                  <ArrowDownToLine data-gc="servidor.guild-rail.arrow-down-to-line--2" size={20} />
                )}

                {update.ready && (
                  <span data-gc="servidor.guild-rail.span--3" className="absolute right-0 top-0 size-3 rounded-full border-2 border-surface-1 bg-online" />
                )}
              </button>
            </Tooltip>
          )
        )}

        <RailAction data-gc="servidor.guild-rail.rail-action--4"
          label={PLAN_NAME}
          active={upgradeOpen}
          onClick={() => openUpgrade()}
        >
          <InfinityIcon data-gc="servidor.guild-rail.infinity-icon" size={22} />
        </RailAction>
        </div>
        </div>
      </nav>

      <AddServerModal data-gc="servidor.guild-rail.add-server-modal.on-select"
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={onSelect}
      />
      <InviteModal data-gc="servidor.guild-rail.invite-modal"
        open={invitingAt !== null}
        guildId={invitingAt ?? ""}
        guildName={guilds.find((g) => g.id === invitingAt)?.name ?? ""}
        onClose={() => setInvitingAt(null)}
      />
    </>
  );
};

const RailAction: React.FC<{
  label: string;
  shortcut?: string[];
  place?: Places;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, shortcut, place, active = false, onClick, children }) => (
  <div data-gc="servidor.guild-rail.div--9" {...flx("railItem", "group/servidor relative flex w-full justify-center")}>
    <span data-gc="servidor.guild-rail.span--4"
      {...flx(
        "serverPill",
        cn(
          "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-pilula transition-all",
          active ? "h-10" : "h-0 group-hover/servidor:h-5",
        ),
      )}
    />

    <Tooltip data-gc="servidor.guild-rail.tooltip--3" label={label} shortcut={shortcut} side="right">
      <button data-gc="servidor.guild-rail.button.on-click"
        {...(place ? flxAttr(place) : {})}
        onClick={onClick}
        aria-label={label}
        aria-current={active}
        className={cn(
          "flex size-12 items-center justify-center border-2 transition-all",
          active
            ? "rounded-2xl border-solid border-transparent bg-brand text-sobre-marca"
            : "rounded-3xl border-dashed border-surface-4 text-ink-muted hover:rounded-2xl hover:border-ink hover:text-ink",
        )}
      >
        {children}
      </button>
    </Tooltip>
  </div>
);
