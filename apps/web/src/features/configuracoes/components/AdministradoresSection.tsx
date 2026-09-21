import React, { useState } from "react";
import { Crown, KeyRound, Plus, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { ADMIN_AREAS, ADMIN_PASSWORD_MIN, type AdminArea, type AdminMe, type AdminMemberView } from "@gravae/shared";

import {
  useAddAdmin,
  useAdminLog,
  useAdmins,
  useRemoveAdmin,
  useResetAdminPassword,
  useSetAdminAreas,
} from "~/@core/application/queries/admin/use-painel";
import { Button } from "~/components/ui/button";
import { useConfirm } from "~/components/ui/confirm";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input, Label } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar } from "~/features/perfil/components/Avatar";
import { cn } from "~/lib/utils";

export const AREA_INFO: Record<AdminArea, { name: string; detail: string }> = {
  publicacoes: { name: "Publicações", detail: "ver o que roda em cada máquina e o que está subindo" },
  aprovar: { name: "Aprovar publicações", detail: "mandar código para produção pelo painel" },
  servidor: { name: "Servidor", detail: "saúde das máquinas, serviços e chamadas" },
  denuncias: { name: "Denúncias", detail: "decidir o que chegou na fila" },
  comunicado: { name: "Comunicado", detail: "mandar mensagem da conta do sistema para todo mundo" },
  comunidades: { name: "Comunidades", detail: "dar e tirar o selo de verificada" },
  administradores: { name: "Administradores", detail: "adicionar pessoas, mudar áreas e senhas" },
  premium: { name: "Premium", detail: "dar e tirar dias de premium de uma conta" },
  ads: { name: "Anúncios", detail: "cadastrar e tirar os anúncios da coluna da direita" },
};

const ACTION_NAME: Record<string, string> = {
  entrou: "abriu o painel",
  "trocou-a-senha": "trocou a senha do painel",
  adicionou: "adicionou",
  "mudou-as-areas": "mudou as áreas de",
  "redefiniu-a-senha": "redefiniu a senha de",
  removeu: "removeu",
  "aprovou-publicacao": "aprovou uma publicação",
  "recusou-publicacao": "recusou uma publicação",
  "decidiu-denuncia": "decidiu uma denúncia",
  "mandou-comunicado": "mandou um comunicado",
  "verificou-comunidade": "verificou uma comunidade",
  "tirou-o-selo": "tirou o selo de uma comunidade",
  "granted-premium": "deu premium a uma conta",
  "revoked-premium": "tirou o premium de uma conta",
  "created-ad": "cadastrou um anúncio",
  "edited-ad": "mexeu num anúncio",
  "removed-ad": "tirou um anúncio",
};

const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const AdminsSection: React.FC<{ me: AdminMe }> = ({ me }) => {
  const admins = useAdmins(true);
  const log = useAdminLog(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AdminMemberView | null>(null);

  return (
    <div data-gc="configuracoes.administradores-section.div" className="w-full space-y-6 pb-10">
      <div data-gc="configuracoes.administradores-section.div--2" className="flex flex-wrap items-center gap-3">
        <p data-gc="configuracoes.administradores-section.p" className="max-w-2xl text-sm text-ink-muted">
          Quem entra no painel e o que cada um pode fazer. Cada pessoa entra com a própria senha de painel, separada da
          senha da conta, e troca a senha provisória no primeiro acesso.
        </p>

        <Button data-gc="configuracoes.administradores-section.button" className="ml-auto" onClick={() => setAdding(true)}>
          <Plus data-gc="configuracoes.administradores-section.plus" size={16} /> Adicionar
        </Button>
      </div>

      <div data-gc="configuracoes.administradores-section.div--3" className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section data-gc="configuracoes.administradores-section.section" className="space-y-3">
          {admins.isPending ? (
            <Skeleton data-gc="configuracoes.administradores-section.skeleton" className="h-40 rounded-xl" />
          ) : (
            <>
              {admins.data?.owners.map((owner) => (
                <article data-gc="configuracoes.administradores-section.article" key={owner.email} className="flex items-center gap-3 rounded-xl border border-line-sutil bg-surface-1 p-4">
                  <Avatar data-gc="configuracoes.administradores-section.avatar" id={owner.email} name={owner.displayName ?? owner.email} url={owner.avatarUrl} size={40} />
                  <div data-gc="configuracoes.administradores-section.div--4" className="min-w-0 flex-1">
                    <p data-gc="configuracoes.administradores-section.p--2" className="truncate text-sm font-semibold">{owner.displayName ?? owner.email}</p>
                    <p data-gc="configuracoes.administradores-section.p--3" className="truncate text-xs text-ink-faint">{owner.email}</p>
                  </div>
                  <span data-gc="configuracoes.administradores-section.span" className="flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-1 text-xs font-medium text-brand">
                    <Crown data-gc="configuracoes.administradores-section.crown" size={12} /> Dono · tudo
                  </span>
                </article>
              ))}

              {admins.data?.members.map((member) => (
                <article data-gc="configuracoes.administradores-section.article--2" key={member.id} className="rounded-xl border border-line-sutil bg-surface-1 p-4">
                  <div data-gc="configuracoes.administradores-section.div--5" className="flex items-center gap-3">
                    <Avatar data-gc="configuracoes.administradores-section.avatar--2" id={member.userId} name={member.displayName} url={member.avatarUrl} size={40} />
                    <div data-gc="configuracoes.administradores-section.div--6" className="min-w-0 flex-1">
                      <p data-gc="configuracoes.administradores-section.p--4" className="truncate text-sm font-semibold">{member.displayName}</p>
                      <p data-gc="configuracoes.administradores-section.p--5" className="truncate text-xs text-ink-faint">
                        {member.email}
                        {member.lastUnlockAt ? ` · entrou ${when.format(new Date(member.lastUnlockAt))}` : " · ainda não entrou"}
                      </p>
                    </div>

                    {member.mustChangePassword && (
                      <span data-gc="configuracoes.administradores-section.span--2" className="hidden rounded-full bg-idle/15 px-2.5 py-1 text-xs text-idle sm:inline">senha provisória</span>
                    )}

                    <Button data-gc="configuracoes.administradores-section.button--2" variant="surface" size="sm" onClick={() => setEditing(member)}>
                      <UserCog data-gc="configuracoes.administradores-section.user-cog" size={14} /> Gerenciar
                    </Button>
                  </div>

                  <div data-gc="configuracoes.administradores-section.div--7" className="mt-3 flex flex-wrap gap-1.5">
                    {member.areas.map((area) => (
                      <span data-gc="configuracoes.administradores-section.span--3"
                        key={area}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          area === "aprovar" ? "bg-aviso/15 text-aviso" : "bg-surface-3 text-ink-muted",
                        )}
                      >
                        {AREA_INFO[area].name}
                      </span>
                    ))}
                  </div>
                </article>
              ))}

              {admins.data && !admins.data.members.length && (
                <p data-gc="configuracoes.administradores-section.p--6" className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-faint">
                  Só o dono tem acesso por enquanto.
                </p>
              )}
            </>
          )}
        </section>

        <section data-gc="configuracoes.administradores-section.section--2">
          <h3 data-gc="configuracoes.administradores-section.h3" className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Registro</h3>

          <ol data-gc="configuracoes.administradores-section.ol" className="space-y-2 rounded-xl border border-line-sutil bg-surface-1 p-3 text-sm">
            {(log.data ?? []).map((entry) => (
              <li data-gc="configuracoes.administradores-section.li" key={entry.id} className="flex gap-2">
                <span data-gc="configuracoes.administradores-section.span--4" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-faint" />
                <span data-gc="configuracoes.administradores-section.span--5" className="min-w-0 flex-1">
                  <span data-gc="configuracoes.administradores-section.span--6" className="font-medium">{entry.actor}</span>{" "}
                  <span data-gc="configuracoes.administradores-section.span--7" className="text-ink-muted">{ACTION_NAME[entry.action] ?? entry.action}</span>
                  {typeof entry.detail?.email === "string" && <span data-gc="configuracoes.administradores-section.span--8" className="text-ink-muted"> {entry.detail.email}</span>}
                  <span data-gc="configuracoes.administradores-section.span--9" className="block text-xs text-ink-faint">{when.format(new Date(entry.createdAt))}</span>
                </span>
              </li>
            ))}
            {log.data && !log.data.length && <li data-gc="configuracoes.administradores-section.li--2" className="text-ink-faint">Nada registrado ainda.</li>}
          </ol>
        </section>
      </div>

      <AddDialog data-gc="configuracoes.administradores-section.add-dialog" open={adding} me={me} onClose={() => setAdding(false)} />
      <ManageDialog data-gc="configuracoes.administradores-section.manage-dialog" member={editing} me={me} onClose={() => setEditing(null)} />
    </div>
  );
};

const AreasPicker: React.FC<{ me: AdminMe; value: AdminArea[]; onChange: (areas: AdminArea[]) => void }> = ({
  me,
  value,
  onChange,
}) => (
  <div data-gc="configuracoes.administradores-section.div--8" className="space-y-1.5">
    {ADMIN_AREAS.map((area) => {
      const allowed = me.areas.includes(area) && (area !== "administradores" || me.role === "dono");
      const checked = value.includes(area);

      return (
        <label data-gc="configuracoes.administradores-section.label"
          key={area}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition",
            checked ? "border-brand/50 bg-brand/10" : "border-line hover:bg-hover",
            !allowed && "cursor-not-allowed opacity-50",
          )}
        >
          <input data-gc="configuracoes.administradores-section.input"
            type="checkbox"
            className="mt-1 accent-[var(--color-brand)]"
            checked={checked}
            disabled={!allowed}
            onChange={(e) => onChange(e.target.checked ? [...value, area] : value.filter((a) => a !== area))}
          />
          <span data-gc="configuracoes.administradores-section.span--10" className="min-w-0">
            <span data-gc="configuracoes.administradores-section.span--11" className="block text-sm font-medium">{AREA_INFO[area].name}</span>
            <span data-gc="configuracoes.administradores-section.span--12" className="block text-xs text-ink-faint">{AREA_INFO[area].detail}</span>
          </span>
        </label>
      );
    })}
  </div>
);

const PasswordField: React.FC<{ value: string; onChange: (v: string) => void; label: string }> = ({ value, onChange, label }) => (
  <div data-gc="configuracoes.administradores-section.div--9">
    <Label data-gc="configuracoes.administradores-section.label--2">{label}</Label>
    <Input data-gc="configuracoes.administradores-section.input--2" type="text" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    <p data-gc="configuracoes.administradores-section.p--7" className="mt-1 text-xs text-ink-faint">
      Pelo menos {ADMIN_PASSWORD_MIN} caracteres. Passe para a pessoa por fora; ela troca no primeiro acesso.
    </p>
  </div>
);

const AddDialog: React.FC<{ open: boolean; me: AdminMe; onClose: () => void }> = ({ open, me, onClose }) => {
  const add = useAddAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [areas, setAreas] = useState<AdminArea[]>(["publicacoes", "servidor"]);

  const close = () => {
    setEmail("");
    setPassword("");
    setAreas(["publicacoes", "servidor"]);
    onClose();
  };

  const valid = email.includes("@") && password.length >= ADMIN_PASSWORD_MIN && areas.length > 0;

  return (
    <Dialog data-gc="configuracoes.administradores-section.dialog" open={open} onOpenChange={(isOpen) => !isOpen && close()}>
      <DialogContent data-gc="configuracoes.administradores-section.dialog-content" className="max-w-lg">
        <DialogHeader data-gc="configuracoes.administradores-section.dialog-header">
          <DialogTitle data-gc="configuracoes.administradores-section.dialog-title">Adicionar administrador</DialogTitle>
          <DialogDescription data-gc="configuracoes.administradores-section.dialog-description">A pessoa precisa já ter conta no Ravox Chat com este e-mail.</DialogDescription>
        </DialogHeader>

        <DialogBody data-gc="configuracoes.administradores-section.dialog-body" className="space-y-4">
          <div data-gc="configuracoes.administradores-section.div--10">
            <Label data-gc="configuracoes.administradores-section.label--3">E-mail da conta</Label>
            <Input data-gc="configuracoes.administradores-section.input--3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@gmail.com" />
          </div>

          <PasswordField data-gc="configuracoes.administradores-section.password-field.set-password" label="Senha provisória do painel" value={password} onChange={setPassword} />

          <div data-gc="configuracoes.administradores-section.div--11">
            <Label data-gc="configuracoes.administradores-section.label--4">O que ela pode fazer</Label>
            <AreasPicker data-gc="configuracoes.administradores-section.areas-picker.set-areas" me={me} value={areas} onChange={setAreas} />
          </div>
        </DialogBody>

        <DialogFooter data-gc="configuracoes.administradores-section.dialog-footer">
          <Button data-gc="configuracoes.administradores-section.button.close" variant="surface" onClick={close}>
            Cancelar
          </Button>
          <Button data-gc="configuracoes.administradores-section.button--3"
            disabled={!valid || add.isPending}
            onClick={() => add.mutate({ email, password, areas }, { onSuccess: close })}
          >
            <ShieldCheck data-gc="configuracoes.administradores-section.shield-check" size={16} /> Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ManageDialog: React.FC<{ member: AdminMemberView | null; me: AdminMe; onClose: () => void }> = ({
  member,
  me,
  onClose,
}) => {
  const confirm = useConfirm();
  const setAreasMutation = useSetAdminAreas();
  const reset = useResetAdminPassword();
  const remove = useRemoveAdmin();

  const [areas, setAreas] = useState<AdminArea[]>([]);
  const [password, setPassword] = useState("");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (member && loadedFor !== member.id) {
    setLoadedFor(member.id);
    setAreas(member.areas);
    setPassword("");
  }

  if (!member) return null;

  const close = () => {
    setLoadedFor(null);
    onClose();
  };

  const removeMember = async () => {
    const { confirmed } = await confirm({
      title: `Remover ${member.displayName} do painel?`,
      description: "O acesso acaba na hora, inclusive num painel que já esteja aberto.",
      action: "Remover",
      destructive: true,
    });

    if (confirmed) remove.mutate(member.id, { onSuccess: close });
  };

  return (
    <Dialog data-gc="configuracoes.administradores-section.dialog--2" open onOpenChange={(isOpen) => !isOpen && close()}>
      <DialogContent data-gc="configuracoes.administradores-section.dialog-content--2" className="max-w-lg">
        <DialogHeader data-gc="configuracoes.administradores-section.dialog-header--2">
          <DialogTitle data-gc="configuracoes.administradores-section.dialog-title--2">{member.displayName}</DialogTitle>
          <DialogDescription data-gc="configuracoes.administradores-section.dialog-description--2">{member.email}</DialogDescription>
        </DialogHeader>

        <DialogBody data-gc="configuracoes.administradores-section.dialog-body--2" className="space-y-5">
          <div data-gc="configuracoes.administradores-section.div--12">
            <Label data-gc="configuracoes.administradores-section.label--5">Áreas</Label>
            <AreasPicker data-gc="configuracoes.administradores-section.areas-picker.set-areas--2" me={me} value={areas} onChange={setAreas} />
            <Button data-gc="configuracoes.administradores-section.button--4"
              size="sm"
              className="mt-2"
              disabled={!areas.length || setAreasMutation.isPending}
              onClick={() => setAreasMutation.mutate({ id: member.id, areas })}
            >
              Salvar áreas
            </Button>
          </div>

          <div data-gc="configuracoes.administradores-section.div--13" className="border-t border-line pt-4">
            <PasswordField data-gc="configuracoes.administradores-section.password-field.set-password--2" label="Nova senha provisória" value={password} onChange={setPassword} />
            <Button data-gc="configuracoes.administradores-section.button--5"
              size="sm"
              variant="surface"
              className="mt-2"
              disabled={password.length < ADMIN_PASSWORD_MIN || reset.isPending}
              onClick={() => reset.mutate({ id: member.id, password }, { onSuccess: () => setPassword("") })}
            >
              <KeyRound data-gc="configuracoes.administradores-section.key-round" size={14} /> Redefinir senha
            </Button>
          </div>
        </DialogBody>

        <DialogFooter data-gc="configuracoes.administradores-section.dialog-footer--2" className="justify-between">
          <Button data-gc="configuracoes.administradores-section.button--6" variant="ghost" className="text-danger" onClick={() => void removeMember()}>
            <Trash2 data-gc="configuracoes.administradores-section.trash2" size={16} /> Remover do painel
          </Button>
          <Button data-gc="configuracoes.administradores-section.button.close--2" variant="surface" onClick={close}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
