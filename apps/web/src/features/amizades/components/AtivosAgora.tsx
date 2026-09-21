import React from "react";
import { useNavigate } from "react-router";
import { ChevronRight, PhoneCall, Volume2 } from "lucide-react";

import { useActive } from "~/@core/application/queries/friend/use-ativos";
import { LottieArt } from "~/components/LottieArt";
import { AdSlot } from "~/features/ads/components/AdSlot";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { useSession } from "~/contexts/session-context";
import { avatarColor, initials } from "~/lib/format";
import { cn } from "~/lib/utils";
import { flx, flxCls } from "~/lib/compat-de-tema";
import { useTranslation } from "~/traducao";

const loadCatCrying = () =>
  import("~/assets/animations/cat-crying.json").then((mod) => mod.default);

export const ActiveNow: React.FC = () => {
  const { t } = useTranslation();
  const { data: actives = [], isLoading } = useActive();
  const { user } = useSession();
  const myId = user?.id;
  const navigate = useNavigate();

  const rooms = new Map<string, { channel: (typeof actives)[number]["channel"]; server: (typeof actives)[number]["server"]; folks: typeof actives }>();

  for (const active of actives) {
    const room = rooms.get(active.channel.id);
    if (room) room.folks.push(active);
    else rooms.set(active.channel.id, { channel: active.channel, server: active.server, folks: [active] });
  }

  return (
    <aside data-gc="amizades.ativos-agora.aside" {...flx("activeNow", "topo-do-miolo hidden w-72 shrink-0 border-l border-divisor bg-surface-2 p-4 xl:flex xl:flex-col")}>
      <h2 data-gc="amizades.ativos-agora.h2" {...flx("activeTitle", "mb-3 text-sm font-semibold")}>{t("amizades.ativosAgora")}</h2>

      {isLoading ? (
        <p data-gc="amizades.ativos-agora.p" className="text-sm text-ink-faint">{t("amizades.procurando")}</p>
      ) : rooms.size === 0 ? (
        <div data-gc="amizades.ativos-agora.div" {...flx("activeEmpty", "flex flex-col items-center justify-center gap-2 px-2 py-24 text-center")}>
          <span data-gc="amizades.ativos-agora.span"
            {...flx("emptyActiveIcon", "flex h-18 items-start justify-center overflow-hidden")}
            aria-hidden
          >
            <LottieArt data-gc="amizades.ativos-agora.lottie-art"
              name="cat-crying"
              load={loadCatCrying}
              label={t("amizades.gatinhoChorando")}
              className="size-36 shrink-0 -translate-x-[7px] -translate-y-10"
            />
          </span>

          <p data-gc="amizades.ativos-agora.p--2" {...flx("emptyActiveTitle", "text-sm font-semibold")}>{t("amizades.tudoTranquilo")}</p>
          <p data-gc="amizades.ativos-agora.p--3" {...flx("emptyActiveDescription", "text-xs leading-relaxed text-ink-muted")}>
            {t("amizades.tudoTranquiloDetalhe")}
          </p>
        </div>
      ) : (
        <div data-gc="amizades.ativos-agora.div--2" {...flx("activeContent", "min-h-0 flex-1 space-y-3 overflow-y-auto")}>
          {[...rooms.values()].map(({ channel, server, folks }) => (
            <div data-gc="amizades.ativos-agora.div--3" key={channel.id} className={cn("rounded-lg bg-surface-3 p-3", flxCls("voiceActiveCard"))}>
              <p data-gc="amizades.ativos-agora.p--4" className="flex items-center gap-1.5 text-11 font-semibold uppercase tracking-wide text-online">
                <Volume2 data-gc="amizades.ativos-agora.volume2" size={12} className="shrink-0" /> {t("amizades.emVoz")}
              </p>

              <button data-gc="amizades.ativos-agora.button"
                onClick={() => navigate(`/channels/${server.id}/${channel.id}`)}
                title={t("amizades.abrirCanal", { canal: channel.name, servidor: server.name })}
                className="mt-2 flex w-full min-w-0 items-center gap-1.5 text-left"
              >
                {server.iconUrl ? (
                  <img data-gc="amizades.ativos-agora.img"
                    src={server.iconUrl}
                    alt=""
                    className="size-5 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span data-gc="amizades.ativos-agora.span--2"
                    aria-hidden
                    className="flex size-5 shrink-0 items-center justify-center rounded-full text-10 font-bold text-sobre-marca"
                    style={{ backgroundColor: avatarColor(server.id) }}
                  >
                    {initials(server.name)}
                  </span>
                )}

                <ChevronRight data-gc="amizades.ativos-agora.chevron-right" size={12} className="shrink-0 text-ink-faint" />
                <Volume2 data-gc="amizades.ativos-agora.volume2--2" size={13} className="shrink-0 text-ink-muted" />

                <span data-gc="amizades.ativos-agora.span--3" className="min-w-0 truncate text-sm font-medium hover:underline">
                  {channel.name}
                </span>
              </button>

              <div data-gc="amizades.ativos-agora.div--4" className="mt-3 flex items-center gap-2">
                <div data-gc="amizades.ativos-agora.div--5" className={cn(flxCls("avatarsStack"), "flex -space-x-2")}>
                  {folks.slice(0, 5).map((active) => (
                    <Tooltip data-gc="amizades.ativos-agora.tooltip"
                      key={active.user.id}
                      label={active.user.id === myId ? t("amizades.voce") : active.user.displayName}
                    >
                      <span data-gc="amizades.ativos-agora.span--4" className="rounded-full">
                        <Avatar data-gc="amizades.ativos-agora.avatar"
                          id={active.user.id}
                          name={active.user.displayName}
                          url={active.user.avatarUrl}
                          size={28}
                          className="ring-2 ring-surface-1"
                        />
                      </span>
                    </Tooltip>
                  ))}
                </div>

                <span data-gc="amizades.ativos-agora.span--5" className="min-w-0 flex-1 truncate text-xs text-ink-muted">
                  {folks.length === 1
                    ? folks[0]!.user.id === myId
                      ? t("amizades.soVoce")
                      : folks[0]!.user.displayName
                    : t("amizades.pessoas", { quantas: folks.length })}
                </span>
              </div>

              <Button data-gc="amizades.ativos-agora.button--2"
                size="sm"
                className="mt-3 w-full"
                onClick={() => navigate(`/channels/${server.id}/${channel.id}`)}
              >
                <PhoneCall data-gc="amizades.ativos-agora.phone-call" size={14} />
                {folks.some((a) => a.user.id === myId)
                  ? t("amizades.voltarParaChamada")
                  : t("amizades.entrarNaChamada")}
              </Button>
            </div>
          ))}
        </div>
      )}

      <AdSlot data-gc="amizades.ativos-agora.ad-slot" className="mt-auto shrink-0 pt-4" />
    </aside>
  );
};
