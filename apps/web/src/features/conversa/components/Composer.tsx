import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, FileUp, Infinity as InfinityIcon, Paperclip, Plus, Send, Timer, X } from "lucide-react";
import { PLAN_LIMITS, type NameFont, type Sticker } from "@gravae/shared";

import { ComposerMirror } from "~/features/conversa/components/EspelhoDoCompositor";
import { withMentionTokens, type MentionLabel } from "~/features/conversa/lib/mention-labels";

import { useSendMessage } from "~/@core/application/queries/message/use-send-message";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import type { MessagePageModel } from "~/@core/domain/models/message-model";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { messageForEdit } from "~/features/conversa/lib/editar-com-a-seta";
import { useEditStore } from "~/features/conversa/stores/edicao-store";
import { invokeCommand, startTyping } from "~/@core/lib/websocket/emit-message-actions";
import { AttachmentTray } from "~/features/conversa/components/AttachmentTray";
import { ComposerLinkPreview } from "~/features/conversa/components/ComposerLinkPreview";
import { linkAt } from "~/features/conversa/lib/first-link";
import { useDrafts } from "~/features/conversa/stores/drafts";
import { CreatePollModal } from "~/features/conversa/components/CreatePollModal";
import { ExpressionPicker, type Tab } from "~/features/expressao/components/ExpressionPicker";
import { useShortcutGlobal } from "~/features/app/hooks/use-atalho-global";
import { BoxActions } from "~/features/conversa/components/AcoesDaCaixa";
import { RecordingBar } from "~/features/conversa/components/BarraDeGravacao";
import type { NoteRecorded } from "~/features/conversa/hooks/use-gravador-de-voz";
import { sendFile } from "~/lib/upload";
import { apiErrorMessage } from "~/@core/lib/api";
import { boxButtonClass } from "~/components/ui/button";
import { CommandSuggestions, CommandHint } from "~/features/conversa/components/ComandoSugestoes";
import { MentionSuggestions } from "~/features/conversa/components/MencaoSugestoes";
import {
  FontPicker,
  storeFont,
  readFontSaves,
} from "~/components/SeletorDeFonte";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useAttachments } from "~/features/conversa/hooks/use-attachments";
import { usePermissions } from "~/hooks/use-permissions";
import { detectCommand, useCommands } from "~/features/conversa/hooks/use-comandos";
import { detectMention, useMentions, type Mentionable } from "~/features/conversa/hooks/use-mencoes";
import { fontFamily } from "~/features/perfil/lib/fontes";
import { useScreenNarrow } from "~/hooks/use-tela-estreita";
import { cn } from "~/lib/utils";
import { useReplyStore } from "~/features/conversa/stores/reply-store";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { Button, IconButton } from "~/components/ui/button";
import { IllustratedModal } from "~/components/ui/illustrated-modal";
import {
  FileLargeArt,
  TextLongArt,
} from "~/features/conversa/components/artes/ArteDeLimite";
import { surroundCode, looksCode, textForFile } from "~/features/conversa/lib/codigo";

import { convertEmoticons } from "~/features/conversa/lib/emoticons";
import { useTranslation } from "~/traducao";
import { toast } from "react-toastify";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";
import { usePlanLimits, usePlanStore } from "~/features/plan/stores/plan-store";

interface ComposerProps {
  channelId: string;
  channelName: string;
  guildId?: string;
  postId?: string;
  canWrite?: boolean;
  canAttach?: boolean;
  modeSlow?: number;
}

export const Composer: React.FC<ComposerProps> = ({
  channelId,
  channelName,
  guildId,
  postId,
  canWrite = true,
  canAttach = true,
  modeSlow = 0,
}) => {
  const { t } = useTranslation();
  const sendMessage = useSendMessage();
  const replyIsOpen = useReplyStore((s) => s.target);
  const mentionReply = useReplyStore((s) => s.mention);
  const toggleMention = useReplyStore((s) => s.toggleMention);
  const cancelReply = useReplyStore((s) => s.cancel);

  const reply = replyIsOpen?.channelId === channelId ? replyIsOpen : null;
  const replying = reply?.messageId ?? null;

  const [font, setFont] = useState<NameFont>(readFontSaves);
  const [recording, setRecording] = useState(false);
  const attachments = useAttachments();

  const [value, setValue] = useState("");
  const [mentionLabels, setMentionLabels] = useState<MentionLabel[]>([]);

  /*
    Um rascunho por conversa.

    A caixa é o mesmo componente em todas elas, só trocando a propriedade do
    canal, então o texto ficava na tela ao pular de conversa. A troca é lida no
    meio da renderização de propósito: se fosse num efeito, o efeito que salva
    rodaria antes, com o texto da conversa anterior, e gravaria o rascunho de um
    no outro.
  */
  const draftKey = postId ?? channelId;
  const saveDraft = useDrafts((s) => s.save);
  const [draftOf, setDraftOf] = useState(draftKey);

  if (draftOf !== draftKey) {
    const saved = useDrafts.getState().byKey[draftKey];

    setDraftOf(draftKey);
    setValue(saved?.text ?? "");
    setMentionLabels(saved?.mentions ?? []);
  }

  useEffect(() => {
    if (draftOf !== draftKey) return;

    saveDraft(draftKey, { text: value, mentions: mentionLabels });
  }, [draftKey, draftOf, value, mentionLabels, saveDraft]);
  const [textLong, setTextLong] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const limits = usePlanLimits();
  const openUpgrade = usePlanStore((s) => s.openUpgrade);
  const requestEdit = useEditStore((s) => s.askFor);

  const openLastForEdit = () => {
    const key = postId ? queryKeys.channel.postMessages(postId) : queryKeys.channel.messages(channelId);
    const cache = queryClient.getQueryData<{ pages: MessagePageModel[] }>(key);
    const eu = queryClient.getQueryData<SelfUserModel>([queryKeys.auth.me]);

    const messages = [...(cache?.pages ?? [])].reverse().flatMap((p) => p.messages);

    const target = messageForEdit({ draft: value, euAm: eu?.id, messages });
    if (!target) return false;

    requestEdit(target);
    return true;
  };
  const [dragging, setDragging] = useState(false);
  const [picker, setPicker] = useState<Tab | null>(null);

  useShortcutGlobal("expressoes", () => {
    if (canWrite) setPicker((current) => (current ? null : "emoji"));
  });
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [mention, setMention] = useState<{ term: string; start: number } | null>(null);
  const [command, setCommand] = useState<{ term: string } | null>(null);
  const [picked, setPicked] = useState(0);
  const lastTypingSent = useRef(0);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const mirror = useRef<HTMLDivElement>(null);
  const inputFile = useRef<HTMLInputElement>(null);

  const { data: detail } = useFindGuild(guildId);
  const { canInChannel } = usePermissions(detail);

  const showSuggestions = useAppearance((s) => s.suggestions);
  const convertEmoticon = useAppearance((s) => s.emoticons);
  const chosenSendButton = useAppearance((s) => s.sendButton);
  const screenNarrow = useScreenNarrow();

  /*
    No telefone não existe Enter à mão: sem o botão, não há como mandar a
    mensagem. Então lá ele aparece sempre, e a preferência só manda na tela
    grande, onde o Enter resolve.
  */
  const showSendButton = chosenSendButton || screenNarrow;

  const { filter } = useMentions(guildId, canInChannel(channelId, "MENTION_EVERYONE"));
  const suggestions = showSuggestions && mention ? filter(mention.term) : [];

  const { filter: filterCommands, analyse } = useCommands(guildId);
  const commands = showSuggestions && command ? filterCommands(command.term) : [];

  const invocation = attachments.items.length ? null : analyse(value);

  useEffect(() => {
    if (!replying) return;

    const field = textarea.current;
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(field.value.length, field.value.length);
    });
  }, [replying]);

  const pickCommand = (item: (typeof commands)[number]) => {
    const field = textarea.current;
    const text = `/${item.name} `;

    setValue(text);
    setCommand(null);
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(text.length, text.length);
    });
  };

  const detect = (text: string, cursor: number) => {
    setMention(detectMention(text, cursor));
    setCommand(detectCommand(text, cursor));
  };

  const insertMention = (item: Mentionable) => {
    const field = textarea.current;
    if (!mention || !field) return;

    const cursor = field.selectionStart ?? value.length;
    const label = item.kind === "todos" ? item.text : `@${item.name}`;
    const text = `${label} `;

    if (label !== item.text) {
      setMentionLabels((current) =>
        current.some((m) => m.label === label) ? current : [...current, { label, token: item.text }],
      );
    }
    const next = value.slice(0, mention.start) + text + value.slice(cursor);
    const position = mention.start + text.length;

    setValue(next);
    setMention(null);
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(position, position);
    });
  };

  const canSend =
    canWrite &&
    (value.trim().length > 0 || attachments.ready.length > 0) &&
    !attachments.uploading &&
    !invocation?.missing.length;

  const adjustHeight = useCallback(() => {
    const field = textarea.current;
    if (!field) return;

    field.style.height = "auto";
    if (field.value) field.style.height = `${Math.min(field.scrollHeight, window.innerHeight / 2)}px`;
  }, []);

  useEffect(adjustHeight, [value, recording, adjustHeight]);

  const clearBox = () => {
    setValue("");
    setMentionLabels([]);
    setMention(null);
    setCommand(null);
  };

  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (waitUntil <= now) return;

    const clock = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(clock);
  }, [waitUntil, now]);

  useEffect(() => setWaitUntil(0), [channelId]);

  const missing = Math.max(0, Math.ceil((waitUntil - now) / 1000));

  const markWait = () => {
    if (modeSlow > 0) setWaitUntil(Date.now() + modeSlow * 1000);
  };

  const submit = () => {
    if (!canSend) return;

    if (invocation) {
      clearBox();
      cancelReply();

      void invokeCommand({
        channelId,
        botId: invocation.command.botId,
        command: invocation.command.name,
        options: invocation.options,
      }).catch((error: Error) => toast.error(error.message));

      return;
    }

    const written = withMentionTokens(value.trim(), mentionLabels);
    const content = convertEmoticon ? convertEmoticons(written) : written;

    clearBox();

    sendMessage.mutate({
      channelId,
      content,
      mentionAuthor: Boolean(reply && mentionReply),
      ...(font !== "padrao" ? { font } : {}),
      attachments: attachments.ready,
      replyToId: reply?.messageId ?? null,
      postId,
      nonce: crypto.randomUUID(),
    });

    attachments.clear();
    cancelReply();
    markWait();
  };

  const sendNote = async (note: NoteRecorded) => {
    try {
      const attachment = await sendFile(note.file);

      sendMessage.mutate({
        channelId,
        content: "",
        attachments: [{ ...attachment, durationMs: note.durationMs, waves: note.waves }],
        replyToId: reply?.messageId ?? null,
        postId,
        nonce: crypto.randomUUID(),
      });

      cancelReply();
      markWait();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não deu para mandar o recado."));
    }
  };

  const sendSticker = (sticker: Sticker) => {
    sendMessage.mutate({ channelId, content: "", stickerId: sticker.id, postId, nonce: crypto.randomUUID() });
    markWait();
    setPicker(null);
  };

  const sendGif = (url: string) => {
    sendMessage.mutate({ channelId, content: url, postId, nonce: crypto.randomUUID() });
    markWait();
    setPicker(null);
  };

  const insertEmoji = (text: string) => {
    const field = textarea.current;

    if (!field) {
      setValue((current) => current + text);
      return;
    }

    const start = field.selectionStart ?? value.length;
    const end = field.selectionEnd ?? value.length;

    setValue(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const notifyTyping = () => {
    const now = Date.now();
    if (now - lastTypingSent.current < 3000) return;

    lastTypingSent.current = now;
    void startTyping(channelId).catch(() => undefined);
  };

  const paste = (event: React.ClipboardEvent) => {
    const files = [...event.clipboardData.files];

    if (files.length) {
      event.preventDefault();
      void attachments.add(files);
      return;
    }

    const text = event.clipboardData.getData("text");
    if (!text) return;

    const textField = textarea.current;
    const alreadyHas =
      value.length -
      ((textField?.selectionEnd ?? 0) - (textField?.selectionStart ?? 0));

    if (alreadyHas + text.length > limits.messageLength) {
      event.preventDefault();
      setTextLong(text);
      return;
    }

    if (!looksCode(text)) return;

    const surrounded = surroundCode(text);
    const field = textarea.current;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + surrounded + value.slice(end);

    event.preventDefault();
    setValue(next);

    requestAnimationFrame(() => {
      if (!field) return;

      const cursor = start + surrounded.length;
      field.focus();
      field.setSelectionRange(cursor, cursor);

      adjustHeight();
    });
  };

  const flipFile = (text: string) => {
    const { name, content } = textForFile(text);

    void attachments.add([new File([content], name, { type: "text/plain;charset=utf-8" })]);
  };

  const sendAsFile = () => {
    if (!textLong) return;

    const alreadyComesSurrounded = textLong.includes("```");
    const fresh =
      !alreadyComesSurrounded && looksCode(textLong)
        ? surroundCode(textLong)
        : textLong.trim();

    flipFile([value.trim(), fresh].filter(Boolean).join("\n\n"));
    clearBox();
    setTextLong(null);
  };

  return (
    <section data-gc="conversa.composer.section" aria-label="Caixa de escrever" {...flx("writeBox", "caixa-de-escrever mede-a-largura bg-composer px-2 pb-3 @sm:px-3")}>
      <IllustratedModal data-gc="conversa.composer.illustrated-modal"
        open={Boolean(textLong)}
        onClose={() => setTextLong(null)}
        art={<TextLongArt data-gc="conversa.composer.text-long-art" />}
        title={t("conversa.caixa.longaTitulo")}
        description={t("conversa.caixa.longaDescricao", { limite: limits.messageLength })}
      >
        <Button data-gc="conversa.composer.button.send-as-file" onClick={sendAsFile}>
          <Paperclip data-gc="conversa.composer.paperclip" size={16} /> {t("conversa.caixa.enviarComoArquivo")}
        </Button>

        {limits.messageLength < PLAN_LIMITS.premium.messageLength && (
          <Button data-gc="conversa.composer.button" variant="surface" onClick={() => { setTextLong(null); openUpgrade(); }}>
            <InfinityIcon data-gc="conversa.composer.infinity-icon" size={16} /> {t("configuracoes.subscription.upsell")}
          </Button>
        )}

        <Button data-gc="conversa.composer.button--2" variant="ghost" onClick={() => setTextLong(null)}>
          {t("comum.cancelar")}
        </Button>
      </IllustratedModal>

      <IllustratedModal data-gc="conversa.composer.illustrated-modal.forget-large-too"
        open={Boolean(attachments.largeToo)}
        onClose={attachments.forgetLargeToo}
        art={<FileLargeArt data-gc="conversa.composer.file-large-art" />}
        title={t("conversa.caixa.arquivoGrandeTitulo")}
        description={t("conversa.caixa.arquivoGrandeDescricao", {
          arquivo: attachments.largeToo?.filename ?? "",
          limite: Math.round((attachments.largeToo?.limit ?? limits.attachmentBytes) / (1024 * 1024)),
        })}
      >
        {attachments.largeToo?.premiumFits && (
          <Button data-gc="conversa.composer.button--3" onClick={() => { attachments.forgetLargeToo(); openUpgrade(); }}>
            <InfinityIcon data-gc="conversa.composer.infinity-icon--2" size={16} /> {t("configuracoes.subscription.upsell")}
          </Button>
        )}
        <Button data-gc="conversa.composer.button.forget-large-too" variant={attachments.largeToo?.premiumFits ? "ghost" : undefined} onClick={attachments.forgetLargeToo}>{t("comum.fechar")}</Button>
      </IllustratedModal>
      {missing > 0 && (
        <div data-gc="conversa.composer.div" {...flx("noticeRail", "mb-1 flex items-center justify-end")}>
          <Tooltip data-gc="conversa.composer.tooltip" label={t("conversa.caixa.modoLentoDica", { segundos: modeSlow })}>
            <p data-gc="conversa.composer.p" {...flx("modeSlowNotice", "flex items-center gap-1 text-right text-xs font-medium text-danger")}>
              {t("conversa.caixa.modoLento", {
                tempo: `${String(Math.floor(missing / 60)).padStart(2, "0")}:${String(missing % 60).padStart(2, "0")}`,
              })}
              <Timer data-gc="conversa.composer.timer" size={13} />
            </p>
          </Tooltip>
        </div>
      )}

      <div data-gc="conversa.composer.div--2"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void attachments.add([...e.dataTransfer.files]);
        }}
        {...flxAttr("writeField")}
        className={cn(
          flxCls("writeField"),
          "flex min-h-[var(--composer-box-height)] flex-col justify-center rounded-[var(--footer-box-radius)] leading-[var(--textarea-line-height)] bg-campo transition",
          dragging && "ring-2 ring-brand ring-offset-2 ring-offset-surface-2",
        )}
      >
        {reply && (
          <div data-gc="conversa.composer.div--3" className="flex items-center gap-2 rounded-t bg-surface-3 px-2.5 py-1.5 text-sm">
            <span data-gc="conversa.composer.span" className="min-w-0 flex-1 truncate text-ink-muted">
              {t("conversa.caixa.respondendoPara")}{" "}
              <span data-gc="conversa.composer.span--2" className="font-semibold text-ink">{reply.author}</span>
            </span>

            <button data-gc="conversa.composer.button.toggle-mention"
              type="button"
              onClick={toggleMention}
              title={t(
                mentionReply
                  ? "conversa.caixa.vaiNotificar"
                  : "conversa.caixa.naoVaiNotificar",
              )}
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-xs font-bold uppercase transition",
                mentionReply
                  ? "text-brand hover:bg-surface-4"
                  : "text-ink-faint hover:bg-surface-4 hover:text-ink-muted",
              )}
            >
              @ {t(mentionReply ? "conversa.caixa.ligado" : "conversa.caixa.desligado")}
            </button>

            <IconButton data-gc="conversa.composer.icon-button.cancel-reply"
              round
              onClick={cancelReply}
              label={t("conversa.caixa.pararDeResponder")}
              className="size-[18px] text-ink-faint hover:bg-surface-4 [&_svg]:size-3.5"
            >
              <X data-gc="conversa.composer.x" />
            </IconButton>
          </div>
        )}

        <ComposerLinkPreview data-gc="conversa.composer.composer-link-preview" text={value} />

        <AttachmentTray data-gc="conversa.composer.attachment-tray.remove"
          items={attachments.items}
          onRemove={attachments.remove}
          onPatch={attachments.patchAttachment}
        />

        <div data-gc="conversa.composer.div--4" {...flx("writeStack", "flex min-h-[var(--composer-box-height)] flex-col justify-center")}>
        <div data-gc="conversa.composer.div--5" {...flx("writeLine", "relative flex items-end gap-1 px-2 @sm:gap-1.5 @sm:px-3")}>
          <MentionSuggestions data-gc="conversa.composer.mention-suggestions.insert-mention"
            items={suggestions}
            index={picked}
            onPick={insertMention}
            onPassMouse={setPicked}
          />

          <CommandSuggestions data-gc="conversa.composer.command-suggestions.pick-command"
            items={commands}
            index={picked}
            onPick={pickCommand}
            onPassMouse={setPicked}
          />

          {!commands.length && !suggestions.length && invocation && (
            <CommandHint data-gc="conversa.composer.command-hint"
              command={invocation.command}
              filled={invocation.options}
              missing={invocation.missing}
              onChoose={(choice) => {
                const next = `${value.replace(/\s*$/, " ")}${choice} `;
                setValue(next);
                requestAnimationFrame(() => {
                  textarea.current?.focus();
                  textarea.current?.setSelectionRange(next.length, next.length);
                });
              }}
            />
          )}

          <DropdownMenu data-gc="conversa.composer.dropdown-menu">
            <DropdownMenuTrigger data-gc="conversa.composer.dropdown-menu-trigger" asChild disabled={!canWrite}>
              <button data-gc="conversa.composer.button--4"
                aria-label={t("conversa.caixa.mais")}
                className={cn(
                  flxCls("boxButton"),
                  boxButtonClass,
                  "gc-icone--bate text-ink-muted hover:bg-hover hover:text-ink",
                )}
              >
                <Plus data-gc="conversa.composer.plus" size={22} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent data-gc="conversa.composer.dropdown-menu-content" align="start" side="top" className="w-56">
              <DropdownMenuItem data-gc="conversa.composer.dropdown-menu-item" disabled={!canAttach} onSelect={() => inputFile.current?.click()}>
                {t("conversa.caixa.enviarArquivo")} <FileUp data-gc="conversa.composer.file-up" size={16} />
              </DropdownMenuItem>
              <DropdownMenuItem data-gc="conversa.composer.dropdown-menu-item--2"
                disabled={!canAttach || !value.trim()}
                onSelect={() => {
                  const text = value;
                  clearBox();
                  flipFile(text);
                }}
              >
                {t("conversa.caixa.textoComoArquivo")} <Paperclip data-gc="conversa.composer.paperclip--2" size={16} />
              </DropdownMenuItem>

              <DropdownMenuItem data-gc="conversa.composer.dropdown-menu-item--3" onSelect={() => setCreatingPoll(true)}>
                {t("conversa.caixa.criarEnquete")} <BarChart3 data-gc="conversa.composer.bar-chart3" size={16} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input data-gc="conversa.composer.input"
            ref={inputFile}
            type="file"
            multiple
            onChange={(e) => {
              void attachments.add([...(e.target.files ?? [])]);
              e.target.value = "";
            }}
            className="hidden"
          />

          <div
            data-gc="conversa.composer.div--6"
            {...flx("textColumn", cn("relative min-w-0 flex-1", recording && "hidden"))}
          >
          <ComposerMirror data-gc="conversa.composer.composer-mirror"
            ref={mirror}
            text={value}
            mentions={mentionLabels.map((m) => m.label)}
            fontFamily={fontFamily(font) ?? undefined}
            className="py-[5px]"
          />

          <textarea data-gc="conversa.composer.textarea.paste"
            ref={textarea}
            value={value}
            rows={1}
            maxLength={limits.messageLength}
            disabled={!canWrite}
            placeholder={
              !canWrite
                ? t("conversa.caixa.semPermissao")
                : dragging
                  ? t("conversa.caixa.solteParaAnexar")
                  : channelName
                    ? t("conversa.caixa.escrever", { canal: channelName })
                    : t("conversa.caixa.escreverSemCanal")
            }
            onPaste={paste}
            onChange={(e) => {
              setValue(e.target.value);
              detect(e.target.value, e.target.selectionStart ?? 0);
              setPicked(0);
              notifyTyping();
              adjustHeight();
            }}
            onClick={(e) => {
              const caret = e.currentTarget.selectionStart ?? 0;

              /*
                ⌘/Ctrl + clique abre o link que está debaixo do cursor. Clique
                simples continua só pondo o cursor ali, senão não dava para
                corrigir um endereço digitado errado.
              */
              if (e.metaKey || e.ctrlKey) {
                const url = linkAt(value, caret);

                if (url) {
                  window.open(url, "_blank", "noopener,noreferrer");
                  return;
                }
              }

              detect(value, caret);
            }}
            onBlur={() => {
              setMention(null);
              setCommand(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" && !suggestions.length && !commands.length) {
                if (openLastForEdit()) {
                  e.preventDefault();
                  return;
                }
              }

              if (e.key === "Escape" && reply && !suggestions.length && !commands.length) {
                e.preventDefault();
                cancelReply();
                return;
              }

              if (commands.length) {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  const step = e.key === "ArrowDown" ? 1 : -1;
                  setPicked((i) => (i + step + commands.length) % commands.length);
                  return;
                }

                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  const item = commands[picked];
                  if (item) pickCommand(item);
                  return;
                }

                if (e.key === "Escape") {
                  e.preventDefault();
                  setCommand(null);
                  return;
                }
              }

              if (suggestions.length) {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  const step = e.key === "ArrowDown" ? 1 : -1;
                  setPicked((i) => (i + step + suggestions.length) % suggestions.length);
                  return;
                }

                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  const item = suggestions[picked];
                  if (item) insertMention(item);
                  return;
                }

                if (e.key === "Escape") {
                  e.preventDefault();
                  setMention(null);
                  return;
                }
              }

              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                requestAnimationFrame(() =>
                  detect(value, textarea.current?.selectionStart ?? 0),
                );
              }

              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            onScroll={(e) => {
              if (mirror.current) mirror.current.scrollTop = e.currentTarget.scrollTop;
            }}
            style={{ fontFamily: fontFamily(font) ?? undefined }}
            className={cn(
              flxCls("boxParagraph"),
              "relative block max-h-[50vh] w-full resize-none bg-transparent py-[5px] text-transparent caret-ink outline-none selection:bg-brand/40 placeholder:truncate placeholder:text-ink-faint disabled:cursor-not-allowed",
            )}
          />
          </div>

          <RecordingBar data-gc="conversa.composer.recording-bar.set-recording"
            off={!canAttach}
            onReady={(note) => void sendNote(note)}
            onRecordingChanged={setRecording}
          />

          <div
            data-gc="conversa.composer.div--7"
            {...flx(
              "boxButtons",
              cn("flex shrink-0 items-center gap-[var(--composer-action-gap)]", recording && "hidden"),
            )}
          >
            <span data-gc="conversa.composer.span--3" className="hidden @md:flex">
            <FontPicker data-gc="conversa.composer.font-picker"
              font={font}
              disabled={!canWrite}
              onPick={(fresh) => {
                setFont(fresh);
                storeFont(fresh);
                setTimeout(() => textarea.current?.focus(), 0);
              }}
            />
            </span>

            <Popover data-gc="conversa.composer.popover"
              open={picker !== null}
              onOpenChange={(isOpen) => setPicker(isOpen ? (picker ?? "emoji") : null)}
            >
              <PopoverTrigger data-gc="conversa.composer.popover-trigger" asChild>
                <span data-gc="conversa.composer.span--4" className="flex items-center gap-[var(--composer-action-gap)]">
                  <BoxActions data-gc="conversa.composer.box-actions"
                    canAttach={canAttach}
                    isOpen={picker}
                    onOpen={(tab) => setPicker(picker === tab ? null : tab)}
                    onAttach={() => inputFile.current?.click()}
                  />
                </span>
              </PopoverTrigger>

              <PopoverContent data-gc="conversa.composer.popover-content" side="top" align="end" className="w-auto border-0 bg-transparent p-0">
                {picker && (
                  <ExpressionPicker data-gc="conversa.composer.expression-picker.send-sticker"
                    guildId={guildId}
                    initialTab={picker}
                    onClose={() => setPicker(null)}
                    onEmoji={(text) => insertEmoji(text)}
                    onSticker={sendSticker}
                    onGif={(gif) => sendGif(gif.url)}
                  />
                )}
              </PopoverContent>
            </Popover>

            {showSendButton && (
              <Tooltip data-gc="conversa.composer.tooltip--2"
                label={t(
                  attachments.uploading ? "conversa.caixa.aguardandoEnvio" : "conversa.caixa.enviar",
                )}
              >
                <button data-gc="conversa.composer.button.submit"
                  onClick={submit}
                  disabled={!canSend}
                  aria-label={t("conversa.caixa.enviar")}
                  className={cn(
                    flxCls("boxButton"),
                    boxButtonClass,
                    "text-ink-muted hover:bg-hover hover:text-brand",
                    canSend ? "flex" : "hidden @md:flex",
                  )}
                >
                  <Send data-gc="conversa.composer.send" size={20} />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
        </div>
      </div>

      <CreatePollModal data-gc="conversa.composer.create-poll-modal"
        open={creatingPoll}
        onClose={() => setCreatingPoll(false)}
        onCreate={(poll) => {
          sendMessage.mutate({ channelId, content: "", poll, postId, nonce: crypto.randomUUID() });
          setCreatingPoll(false);
        }}
      />
    </section>
  );
};

