import React, { useRef, useState } from "react";
import { BarChart3, Image as ImageIcon, MousePointerClick, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "react-toastify";
import { AD_LIMITS, AD_SIZE, adRunning, type AdAdminView, type AdInput } from "@gravae/shared";

import { useAdminAds, useCreateAd, useEditAd, useRemoveAd } from "~/@core/application/queries/admin/use-ads";
import { uploadFile } from "~/@core/application/requests/upload/upload-file";
import { Button } from "~/components/ui/button";
import { useConfirm } from "~/components/ui/confirm";
import { Input, Textarea } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { Callout, EmptyState, Panel, StatusPill } from "~/features/configuracoes/components/painel/PainelUi";
import { cn } from "~/lib/utils";

const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const EMPTY = {
  advertiser: "",
  title: "",
  body: "",
  imageUrl: "",
  linkUrl: "",
  startsAt: "",
  endsAt: "",
};

type Draft = typeof EMPTY;

/*
  O <input type="datetime-local"> fala a hora de quem está olhando, sem fuso. A
  ida e a volta passam por aqui para o banco guardar sempre em UTC.
*/
const toField = (iso: string | null): string => {
  if (!iso) return "";

  const date = new Date(iso);
  const minutes = date.getTimezoneOffset();

  return new Date(date.getTime() - minutes * 60_000).toISOString().slice(0, 16);
};

const toIso = (field: string): string | null => (field ? new Date(field).toISOString() : null);

const rate = (ad: AdAdminView) =>
  ad.impressions === 0 ? "—" : `${((ad.clicks / ad.impressions) * 100).toFixed(1)}%`;

const period = (ad: AdAdminView) => {
  if (!ad.startsAt && !ad.endsAt) return "sem data de começo nem de fim";
  if (ad.startsAt && ad.endsAt) return `de ${when.format(new Date(ad.startsAt))} a ${when.format(new Date(ad.endsAt))}`;
  if (ad.startsAt) return `a partir de ${when.format(new Date(ad.startsAt))}`;

  return `até ${when.format(new Date(ad.endsAt!))}`;
};

const ImageField: React.FC<{ value: string; onChange: (url: string) => void }> = ({ value, onChange }) => {
  const input = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);

  const send = async (file: File) => {
    setSending(true);

    try {
      const sent = await uploadFile(file, "ad");
      onChange(sent.url);
    } catch {
      toast.error("Não deu para enviar a imagem.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-gc="configuracoes.ads-section.div" className="flex items-start gap-3">
      <div data-gc="configuracoes.ads-section.div--2"
        className={cn(
          "flex h-[125px] w-[144px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-3",
          !value && "border-dashed",
        )}
      >
        {value ? (
          <img data-gc="configuracoes.ads-section.img" src={value} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon data-gc="configuracoes.ads-section.image-icon" size={20} className="text-ink-faint" />
        )}
      </div>

      <div data-gc="configuracoes.ads-section.div--3" className="min-w-0 flex-1 space-y-2">
        <input data-gc="configuracoes.ads-section.input"
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void send(file);
          }}
        />

        <Button data-gc="configuracoes.ads-section.button" type="button" size="sm" variant="surface" loading={sending} onClick={() => input.current?.click()}>
          <Upload data-gc="configuracoes.ads-section.upload" size={14} /> Enviar imagem
        </Button>

        <p data-gc="configuracoes.ads-section.p" className="text-11 text-ink-faint">
          {AD_SIZE.width}×{AD_SIZE.height}, até 1 MB. PNG, JPG, WEBP ou GIF.
        </p>

        <Input data-gc="configuracoes.ads-section.input--2"
          value={value}
          placeholder="ou cole o endereço da imagem"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

const AdForm: React.FC<{
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  onSubmit: () => void;
  sending: boolean;
  submitLabel: string;
}> = ({ draft, setDraft, onSubmit, sending, submitLabel }) => {
  const field = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((old) => ({ ...old, [key]: e.target.value }));

  const ready = draft.advertiser.trim() && draft.title.trim() && draft.linkUrl.trim();

  return (
    <div data-gc="configuracoes.ads-section.div--4" className="space-y-4">
      <div data-gc="configuracoes.ads-section.div--5" className="grid gap-3 sm:grid-cols-2">
        <label data-gc="configuracoes.ads-section.label" className="block">
          <span data-gc="configuracoes.ads-section.span" className="mb-1 block text-xs font-medium text-ink-muted">Quem anuncia</span>
          <Input data-gc="configuracoes.ads-section.input--3" value={draft.advertiser} maxLength={AD_LIMITS.advertiser} onChange={field("advertiser")} />
        </label>

        <label data-gc="configuracoes.ads-section.label--2" className="block">
          <span data-gc="configuracoes.ads-section.span--2" className="mb-1 block text-xs font-medium text-ink-muted">Para onde leva</span>
          <Input data-gc="configuracoes.ads-section.input--4" value={draft.linkUrl} placeholder="https://" onChange={field("linkUrl")} />
        </label>
      </div>

      <label data-gc="configuracoes.ads-section.label--3" className="block">
        <span data-gc="configuracoes.ads-section.span--3" className="mb-1 block text-xs font-medium text-ink-muted">Título</span>
        <Input data-gc="configuracoes.ads-section.input--5" value={draft.title} maxLength={AD_LIMITS.title} onChange={field("title")} />
      </label>

      <label data-gc="configuracoes.ads-section.label--4" className="block">
        <span data-gc="configuracoes.ads-section.span--4" className="mb-1 block text-xs font-medium text-ink-muted">
          Recado (só aparece quando não há imagem)
        </span>
        <Textarea data-gc="configuracoes.ads-section.textarea" value={draft.body} rows={2} maxLength={AD_LIMITS.body} onChange={field("body")} />
      </label>

      <ImageField data-gc="configuracoes.ads-section.image-field" value={draft.imageUrl} onChange={(imageUrl) => setDraft((old) => ({ ...old, imageUrl }))} />

      <div data-gc="configuracoes.ads-section.div--6" className="grid gap-3 sm:grid-cols-2">
        <label data-gc="configuracoes.ads-section.label--5" className="block">
          <span data-gc="configuracoes.ads-section.span--5" className="mb-1 block text-xs font-medium text-ink-muted">Começa em (opcional)</span>
          <Input data-gc="configuracoes.ads-section.input--6" type="datetime-local" value={draft.startsAt} onChange={field("startsAt")} />
        </label>

        <label data-gc="configuracoes.ads-section.label--6" className="block">
          <span data-gc="configuracoes.ads-section.span--6" className="mb-1 block text-xs font-medium text-ink-muted">Termina em (opcional)</span>
          <Input data-gc="configuracoes.ads-section.input--7" type="datetime-local" value={draft.endsAt} onChange={field("endsAt")} />
        </label>
      </div>

      <Button data-gc="configuracoes.ads-section.button.on-submit" disabled={!ready} loading={sending} onClick={onSubmit}>
        <Plus data-gc="configuracoes.ads-section.plus" size={15} /> {submitLabel}
      </Button>
    </div>
  );
};

export const AdsSection: React.FC = () => {
  const ads = useAdminAds(true);
  const create = useCreateAd();
  const edit = useEditAd();
  const remove = useRemoveAd();
  const confirm = useConfirm();

  const [draft, setDraft] = useState<Draft>(EMPTY);

  const asInput = (): AdInput => ({
    advertiser: draft.advertiser.trim(),
    title: draft.title.trim(),
    body: draft.body.trim() || null,
    imageUrl: draft.imageUrl.trim() || null,
    linkUrl: draft.linkUrl.trim(),
    startsAt: toIso(draft.startsAt),
    endsAt: toIso(draft.endsAt),
  });

  const save = () =>
    create.mutate(asInput(), {
      onSuccess: () => setDraft(EMPTY),
    });

  const drop = async (ad: AdAdminView) => {
    const { confirmed } = await confirm({
      title: `Tirar o anúncio de ${ad.advertiser}?`,
      description: "Ele some da coluna na hora. Os números de exibição e clique vão junto.",
      action: "Tirar",
      destructive: true,
    });

    if (confirmed) remove.mutate(ad.id);
  };

  const list = ads.data ?? [];

  return (
    <div data-gc="configuracoes.ads-section.div--7" className="grid w-full items-start gap-6 pb-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div data-gc="configuracoes.ads-section.div--8" className="space-y-4">
        <Panel data-gc="configuracoes.ads-section.panel"
          title="No ar"
          icon={<BarChart3 data-gc="configuracoes.ads-section.bar-chart3" size={16} />}
          description="quadro da coluna “Ativo agora”, só para quem não tem Infinity"
          actions={<StatusPill data-gc="configuracoes.ads-section.status-pill" tone="neutral" dot={false}>{list.length} cadastrado{list.length === 1 ? "" : "s"}</StatusPill>}
          flush
        >
          {ads.isPending ? (
            <p data-gc="configuracoes.ads-section.p--2" className="p-4 text-sm text-ink-muted">Carregando…</p>
          ) : list.length === 0 ? (
            <EmptyState data-gc="configuracoes.ads-section.empty-state"
              icon={<ImageIcon data-gc="configuracoes.ads-section.image-icon--2" size={22} />}
              title="Nenhum anúncio ainda"
              detail="Enquanto não houver nenhum no ar, a coluna mostra o convite “Anuncie aqui”."
              className="p-8"
            />
          ) : (
            <ul data-gc="configuracoes.ads-section.ul" className="divide-y divide-line-sutil">
              {list.map((ad) => (
                <li data-gc="configuracoes.ads-section.li" key={ad.id} className="flex items-start gap-3 p-4">
                  <div data-gc="configuracoes.ads-section.div--9" className="flex h-14 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-3">
                    {ad.imageUrl ? (
                      <img data-gc="configuracoes.ads-section.img--2" src={ad.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <ImageIcon data-gc="configuracoes.ads-section.image-icon--3" size={16} className="text-ink-faint" />
                    )}
                  </div>

                  <div data-gc="configuracoes.ads-section.div--10" className="min-w-0 flex-1">
                    <div data-gc="configuracoes.ads-section.div--11" className="flex items-center gap-2">
                      <span data-gc="configuracoes.ads-section.span--7" className="truncate text-sm font-semibold">{ad.advertiser}</span>
                      <StatusPill data-gc="configuracoes.ads-section.status-pill--2" tone={adRunning(ad) ? "ok" : "neutral"}>
                        {adRunning(ad) ? "no ar" : "parado"}
                      </StatusPill>
                    </div>

                    <p data-gc="configuracoes.ads-section.p--3" className="truncate text-xs text-ink-muted">{ad.title}</p>
                    <p data-gc="configuracoes.ads-section.p--4" className="truncate text-11 text-ink-faint">{period(ad)}</p>

                    <p data-gc="configuracoes.ads-section.p--5" className="mt-1 flex flex-wrap items-center gap-3 text-11 text-ink-faint">
                      <span data-gc="configuracoes.ads-section.span--8">{ad.impressions.toLocaleString("pt-BR")} exibições</span>
                      <span data-gc="configuracoes.ads-section.span--9" className="flex items-center gap-1">
                        <MousePointerClick data-gc="configuracoes.ads-section.mouse-pointer-click" size={12} /> {ad.clicks.toLocaleString("pt-BR")} cliques
                      </span>
                      <span data-gc="configuracoes.ads-section.span--10">{rate(ad)}</span>
                    </p>
                  </div>

                  <div data-gc="configuracoes.ads-section.div--12" className="flex shrink-0 items-center gap-2">
                    <Switch data-gc="configuracoes.ads-section.switch"
                      checked={ad.active}
                      aria-label={ad.active ? "Parar o anúncio" : "Pôr o anúncio no ar"}
                      onCheckedChange={(active) => edit.mutate({ adId: ad.id, data: { active } })}
                    />

                    <Button data-gc="configuracoes.ads-section.button--2"
                      size="icon"
                      variant="ghost"
                      aria-label="Tirar o anúncio"
                      onClick={() => void drop(ad)}
                    >
                      <Trash2 data-gc="configuracoes.ads-section.trash2" size={15} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div data-gc="configuracoes.ads-section.div--13" className="space-y-4">
        <Panel data-gc="configuracoes.ads-section.panel--2" title="Novo anúncio" icon={<Plus data-gc="configuracoes.ads-section.plus--2" size={16} />} description="entra na fila de sorteio assim que salvar">
          <AdForm data-gc="configuracoes.ads-section.ad-form.save" draft={draft} setDraft={setDraft} onSubmit={save} sending={create.isPending} submitLabel="Salvar anúncio" />
        </Panel>

        <Callout data-gc="configuracoes.ads-section.callout" tone="brand" icon={<ImageIcon data-gc="configuracoes.ads-section.image-icon--4" size={16} />} title="Como aparece">
          Um por vez, sorteado na hora em que a coluna se desenha. Quem tem Infinity não vê nenhum. Com a imagem
          vazia, o quadro mostra o título e o recado.
        </Callout>
      </div>
    </div>
  );
};
