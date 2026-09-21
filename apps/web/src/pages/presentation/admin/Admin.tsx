import React from "react";
import { Link, Navigate, useParams } from "react-router";
import { ArrowLeft, Crown, Flag, Infinity as InfinityIcon, LockKeyhole, Megaphone, Rocket, Server, ShieldCheck, Speech, Users } from "lucide-react";
import type { AdminArea } from "@gravae/shared";

import { useAdminMe, useLockPanel } from "~/@core/application/queries/admin/use-painel";
import { AdsSection } from "~/features/configuracoes/components/AdsSection";
import { AnnouncementsSection } from "~/features/configuracoes/components/ComunicadosSection";
import { AdminsSection } from "~/features/configuracoes/components/AdministradoresSection";
import { ReportsSection } from "~/features/configuracoes/components/DenunciasSection";
import { PanelChangePassword, PanelUnlock } from "~/features/configuracoes/components/PainelTrancado";
import { PostsSection } from "~/features/configuracoes/components/PublicacoesSection";
import { PremiumSection } from "~/features/configuracoes/components/PremiumSection";
import { ServerSection } from "~/features/configuracoes/components/ServidorSection";
import { Splash } from "~/features/app/components/Splash";
import { cn } from "~/lib/utils";

type Display = "publicacoes" | "servidor" | "denuncias" | "comunicado" | "premium" | "ads" | "administradores";

const SCREENS: { id: Display; area: AdminArea; name: string; icon: React.ElementType; summary: string }[] = [
  { id: "publicacoes", area: "publicacoes", name: "Publicações", icon: Rocket, summary: "o que roda e o que sobe" },
  { id: "servidor", area: "servidor", name: "Servidor", icon: Server, summary: "saúde das máquinas" },
  { id: "denuncias", area: "denuncias", name: "Denúncias", icon: Flag, summary: "a fila do que chegou" },
  { id: "comunicado", area: "comunicado", name: "Comunicado", icon: Megaphone, summary: "avisar todo mundo" },
  { id: "premium", area: "premium", name: "Infinity", icon: InfinityIcon, summary: "dar e tirar dias de Infinity" },
  { id: "ads", area: "ads", name: "Anúncios", icon: Speech, summary: "quem anuncia na coluna da direita" },
  { id: "administradores", area: "administradores", name: "Administradores", icon: Users, summary: "quem entra e o que faz" },
];

export const Admin: React.FC = () => {
  const { display } = useParams<{ display?: string }>();
  const { data: me, isPending, isError } = useAdminMe();
  const lock = useLockPanel();

  if (isPending) return <Splash data-gc="admin.admin.splash" />;
  if (isError || !me) return <Navigate to="/channels" replace />;

  const visible = SCREENS.filter((screen) => me.areas.includes(screen.area));
  const current = visible.find((screen) => screen.id === display) ?? visible[0];
  const open = !me.locked && !me.mustChangePassword;

  return (
    <div data-gc="admin.admin.div" className="flex h-full bg-surface-0">
      <aside data-gc="admin.admin.aside" className="flex w-64 shrink-0 flex-col border-r border-divisor bg-surface-1">
        <header data-gc="admin.admin.header" className="flex h-[var(--layout-header-height)] shrink-0 items-center gap-2 border-b border-divisor px-4">
          <Link data-gc="admin.admin.link"
            to="/channels"
            aria-label="Voltar para o app"
            className="rounded p-1 text-ink-faint transition hover:bg-hover hover:text-ink"
          >
            <ArrowLeft data-gc="admin.admin.arrow-left" size={18} />
          </Link>
          <h1 data-gc="admin.admin.h1" className="truncate font-semibold">Administração</h1>
        </header>

        {open && (
          <nav data-gc="admin.admin.nav" className="flex flex-col gap-0.5 px-2 py-3">
            {visible.map((item) => (
              <Link data-gc="admin.admin.link--2"
                key={item.id}
                to={`/admin/${item.id}`}
                className={cn(
                  "flex items-start gap-2.5 rounded px-2.5 py-2 text-left text-sm transition",
                  current?.id === item.id ? "bg-selecionado text-ink" : "text-ink-muted hover:bg-hover hover:text-ink",
                )}
              >
                <item.icon data-gc="admin.admin.itemicon" size={18} className="mt-0.5 shrink-0" />
                <span data-gc="admin.admin.span" className="min-w-0">
                  <span data-gc="admin.admin.span--2" className="block truncate font-medium">{item.name}</span>
                  <span data-gc="admin.admin.span--3" className="block truncate text-11 text-ink-faint">{item.summary}</span>
                </span>
              </Link>
            ))}
          </nav>
        )}

        <div data-gc="admin.admin.div--2" className="mt-auto border-t border-divisor px-4 py-3">
          <p data-gc="admin.admin.p" className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
            {me.role === "dono" ? <Crown data-gc="admin.admin.crown" size={13} className="text-brand" /> : <ShieldCheck data-gc="admin.admin.shield-check" size={13} />}
            {me.role === "dono" ? "Dono do painel" : "Administrador"}
          </p>
          <p data-gc="admin.admin.p--2" className="mt-0.5 truncate text-11 text-ink-faint">{me.email}</p>

          {me.role === "admin" && !me.locked && (
            <button data-gc="admin.admin.button"
              type="button"
              onClick={() => lock.mutate()}
              className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted transition hover:text-ink"
            >
              <LockKeyhole data-gc="admin.admin.lock-keyhole" size={13} /> Trancar o painel
            </button>
          )}
        </div>
      </aside>

      <div data-gc="admin.admin.div--3" className="flex min-w-0 flex-1 flex-col bg-surface-2">
        {me.locked ? (
          <PanelUnlock data-gc="admin.admin.panel-unlock" email={me.email} />
        ) : me.mustChangePassword ? (
          <PanelChangePassword data-gc="admin.admin.panel-change-password" />
        ) : !current ? (
          <p data-gc="admin.admin.p--3" className="p-6 text-sm text-ink-muted">Sua conta não tem nenhuma área liberada.</p>
        ) : (
          <>
            <header data-gc="admin.admin.header--2" className="flex h-[var(--layout-header-height)] shrink-0 items-center gap-2 border-b border-divisor bg-surface-2 px-6">
              <current.icon data-gc="admin.admin.currenticon" size={17} className="shrink-0 text-ink-muted" />
              <h2 data-gc="admin.admin.h2" className="shrink-0 font-semibold">{current.name}</h2>
              <span data-gc="admin.admin.span--4" className="mx-1 h-4 w-px shrink-0 bg-line" aria-hidden />
              <span data-gc="admin.admin.span--5" className="truncate text-sm text-ink-faint">{current.summary}</span>
            </header>

            <div data-gc="admin.admin.div--4" className="min-h-0 flex-1 overflow-y-auto">
              <div data-gc="admin.admin.div--5" className="mx-auto w-full max-w-[1600px] px-6 py-6">
              {current.id === "publicacoes" && <PostsSection data-gc="admin.admin.posts-section" />}
              {current.id === "servidor" && <ServerSection data-gc="admin.admin.server-section" />}
              {current.id === "denuncias" && <ReportsSection data-gc="admin.admin.reports-section" />}
              {current.id === "comunicado" && <AnnouncementsSection data-gc="admin.admin.announcements-section" />}
              {current.id === "premium" && <PremiumSection data-gc="admin.admin.premium-section" />}
              {current.id === "ads" && <AdsSection data-gc="admin.admin.ads-section" />}
              {current.id === "administradores" && <AdminsSection data-gc="admin.admin.admins-section" me={me} />}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
