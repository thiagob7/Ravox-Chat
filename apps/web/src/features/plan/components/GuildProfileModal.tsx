import React, { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Infinity as InfinityIcon, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { GUILD_BIO_MAX, PLAN_NAME } from "@gravae/shared";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useMe } from "~/@core/application/queries/auth/use-me";
import { updateGuildProfile, type GuildProfileDto } from "~/@core/application/requests/guild/guild-profile";
import { apiErrorMessage } from "~/@core/lib/api";
import { Button } from "~/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label, Textarea } from "~/components/ui/input";
import { Avatar } from "~/features/perfil/components/Avatar";
import { usePlanLimits, usePlanStore } from "~/features/plan/stores/plan-store";
import { uploadImage } from "~/lib/upload";
import { useTranslation } from "~/traducao";

type ImageField = "avatarUrl" | "bannerUrl";

const SIZES: Record<ImageField, number> = { avatarUrl: 256, bannerUrl: 960 };

export const GuildProfileModal: React.FC = () => {
  const guildId = usePlanStore((s) => s.guildProfileFor);
  const close = usePlanStore((s) => s.closeGuildProfile);

  return (
    <Dialog data-gc="plan.guild-profile-modal.dialog" open={Boolean(guildId)} onOpenChange={(open) => !open && close()}>
      <DialogContent data-gc="plan.guild-profile-modal.dialog-content" className="max-w-lg">
        {guildId && <GuildProfileBody data-gc="plan.guild-profile-modal.guild-profile-body.close" key={guildId} guildId={guildId} onDone={close} />}
      </DialogContent>
    </Dialog>
  );
};

const GuildProfileBody: React.FC<{ guildId: string; onDone: () => void }> = ({ guildId, onDone }) => {
  const { t } = useTranslation();
  const { data: me } = useMe(true);
  const { data: detail } = useFindGuild(guildId);
  const allowed = usePlanLimits().guildProfiles;
  const openUpgrade = usePlanStore((s) => s.openUpgrade);

  const current = detail?.members.find((m) => m.user.id === me?.id);
  const [draft, setDraft] = useState<GuildProfileDto>({});
  const [uploading, setUploading] = useState<ImageField | null>(null);
  const files = useRef<Record<ImageField, HTMLInputElement | null>>({ avatarUrl: null, bannerUrl: null });

  const value = <K extends keyof GuildProfileDto>(field: K) =>
    field in draft ? draft[field] ?? null : (current?.[field] ?? null);

  const save = useMutation({
    mutationFn: () => updateGuildProfile(guildId, draft),
    onSuccess: () => {
      toast.success(t("servidor.perfilNoServidor.salvo"));
      onDone();
    },
    onError: (error) => toast.error(apiErrorMessage(error, t("configuracoes.subscription.error"))),
  });

  const choose = async (field: ImageField, file: File | undefined) => {
    if (!file) return;
    setUploading(field);

    try {
      const sent = await uploadImage(file, { maxSize: SIZES[field], purpose: field === "avatarUrl" ? "avatar" : "banner" });
      setDraft((d) => ({ ...d, [field]: sent.attachment.url }));
    } catch (error) {
      toast.error(apiErrorMessage(error, t("configuracoes.subscription.error")));
    } finally {
      setUploading(null);
    }
  };

  const avatar = value("avatarUrl");
  const banner = value("bannerUrl");

  return (
    <>
      <DialogHeader data-gc="plan.guild-profile-modal.dialog-header">
        <DialogTitle data-gc="plan.guild-profile-modal.dialog-title">{t("servidor.perfilNoServidor.titulo")}</DialogTitle>
        <DialogDescription data-gc="plan.guild-profile-modal.dialog-description">
          {t("servidor.perfilNoServidor.descricao", { server: detail?.guild.name ?? "" })}
        </DialogDescription>
      </DialogHeader>

      <DialogBody data-gc="plan.guild-profile-modal.dialog-body" className="space-y-5">
        {!allowed && (
          <button data-gc="plan.guild-profile-modal.button"
            type="button"
            onClick={() => openUpgrade()}
            className="flex w-full items-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2.5 text-left text-sm text-ink"
          >
            <InfinityIcon data-gc="plan.guild-profile-modal.infinity-icon" size={16} className="shrink-0 text-brand" />
            {t("servidor.perfilNoServidor.soInfinity", { plan: PLAN_NAME })}
          </button>
        )}

        <div data-gc="plan.guild-profile-modal.div">
          <div data-gc="plan.guild-profile-modal.div--2"
            className="relative h-24 overflow-hidden rounded-lg bg-surface-3"
            style={banner ? { backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          />
          <div data-gc="plan.guild-profile-modal.div--3" className="-mt-8 flex items-end gap-3 px-3">
            {me && (
              <Avatar data-gc="plan.guild-profile-modal.avatar"
                id={me.id}
                name={current?.nickname ?? me.displayName}
                url={avatar ?? me.avatarUrl}
                size={64}
                className="ring-4 ring-surface-1"
              />
            )}
          </div>
        </div>

        {(["avatarUrl", "bannerUrl"] as const).map((field) => (
          <div data-gc="plan.guild-profile-modal.div--4" key={field} className="flex items-center gap-2">
            <input data-gc="plan.guild-profile-modal.input"
              ref={(node) => {
                files.current[field] = node;
              }}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void choose(field, file);
              }}
            />
            <Button data-gc="plan.guild-profile-modal.button--2"
              variant="surface"
              size="sm"
              disabled={!allowed}
              loading={uploading === field}
              onClick={() => files.current[field]?.click()}
            >
              <ImagePlus data-gc="plan.guild-profile-modal.image-plus" size={14} />
              {t(field === "avatarUrl" ? "servidor.perfilNoServidor.trocarFoto" : "servidor.perfilNoServidor.trocarFaixa")}
            </Button>
            {value(field) && (
              <Button data-gc="plan.guild-profile-modal.button--3" variant="ghost" size="sm" onClick={() => setDraft((d) => ({ ...d, [field]: null }))}>
                <Trash2 data-gc="plan.guild-profile-modal.trash2" size={14} /> {t("servidor.perfilNoServidor.usarDaConta")}
              </Button>
            )}
          </div>
        ))}

        <div data-gc="plan.guild-profile-modal.div--5">
          <Label data-gc="plan.guild-profile-modal.label" htmlFor="guild-profile-bio">{t("servidor.perfilNoServidor.bio")}</Label>
          <Textarea data-gc="plan.guild-profile-modal.textarea"
            id="guild-profile-bio"
            rows={3}
            maxLength={GUILD_BIO_MAX}
            disabled={!allowed && !value("bio")}
            value={value("bio") ?? ""}
            placeholder={t("servidor.perfilNoServidor.bioDica")}
            onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
          />
        </div>
      </DialogBody>

      <DialogFooter data-gc="plan.guild-profile-modal.dialog-footer">
        <Button data-gc="plan.guild-profile-modal.button.on-done" variant="ghost" onClick={onDone}>
          {t("comum.cancelar")}
        </Button>
        <Button data-gc="plan.guild-profile-modal.button--4" disabled={!Object.keys(draft).length} loading={save.isPending} onClick={() => save.mutate()}>
          {t("comum.salvar")}
        </Button>
      </DialogFooter>
    </>
  );
};
