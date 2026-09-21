import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { inviteLinkCode, themeLinkId } from "@gravae/shared";

import { IconButton } from "~/components/ui/button";
import { LinkEmbeds } from "~/features/conversa/components/LinkEmbed";
import { firstLink } from "~/features/conversa/lib/first-link";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { useEmbed } from "~/@core/application/queries/embed/use-embed";
import { useFindInvite } from "~/@core/application/queries/invite/use-find-invite";
import { useTheme } from "~/@core/application/queries/tema/use-temas";
import { houseOrigins } from "~/lib/origens";
import { useTranslation } from "~/traducao";

const WAIT = 500;

/*
  O que o link vai virar, flutuando por cima da caixa de escrever.

  O cartão NÃO entra na coluna: a caixa levantava do chão e a conversa pulava a
  cada link colado. Ele mora numa faixa de altura zero e sobe em cima da
  conversa, com um biquinho apontando para a linha onde o link está escrito —
  igual à prévia que já aparece quando se passa o mouse num link enviado.

  É o mesmo cartão da mensagem: convite e tema saem das consultas que os
  cartões já usam, e link de fora sai do `/embeds`, que guarda a resposta por
  dez minutos — então o cartão de depois do envio não custa uma ida a mais.

  A espera de meio segundo é para não bater no servidor a cada tecla.
*/
export const ComposerLinkPreview: React.FC<{ text: string }> = ({ text }) => {
  const { t } = useTranslation();

  const [link, setLink] = useState<string | null>(null);
  const [dropped, setDropped] = useState<string[]>([]);

  const wanted = firstLink(text);

  useEffect(() => {
    if (!wanted) {
      setLink(null);
      return;
    }

    const id = setTimeout(() => setLink(wanted), WAIT);

    return () => clearTimeout(id);
  }, [wanted]);

  const our = useMemo(() => houseOrigins(), []);
  const outsidePreview = useAppearance((s) => s.linksPreview);

  const code = link ? inviteLinkCode(link, our) : null;
  const themeId = link ? themeLinkId(link, our) : null;
  const ours = Boolean(code ?? themeId);

  const { data: invite } = useFindInvite(code ?? undefined);
  const { data: theme } = useTheme(themeId ?? undefined);
  const { data: embed } = useEmbed(link ?? "", Boolean(link) && !ours && outsidePreview);

  if (!link || dropped.includes(link)) return null;
  if (!invite && !theme && !embed) return null;

  return (
    <div data-gc="conversa.composer-link-preview.div" className="relative z-20 h-0">
      {/*
        Sem moldura por fora: o cartão do convite, do tema e do link já vem com
        a sua própria borda e o seu próprio fundo. A caixa que estava aqui virava
        cartão dentro de cartão. O que sobra desta camada é a posição, a sombra
        que descola da conversa e o biquinho apontando para o link escrito.
      */}
      <div data-gc="conversa.composer-link-preview.div--2" className="absolute bottom-3 left-1 w-[min(26rem,calc(100%-0.5rem))] drop-shadow-2xl">
        <div data-gc="conversa.composer-link-preview.div--3" className="max-h-[min(24rem,45vh)] overflow-y-auto">
          <LinkEmbeds data-gc="conversa.composer-link-preview.link-embeds" content={link} />
        </div>

        <IconButton data-gc="conversa.composer-link-preview.icon-button"
          round
          onClick={() => setDropped((current) => [...current, link])}
          label={t("comum.descartar")}
          className="absolute right-2 top-3 size-6 bg-surface-3/90 text-ink-muted backdrop-blur hover:bg-surface-4 hover:text-ink [&_svg]:size-3.5"
        >
          <X data-gc="conversa.composer-link-preview.x" />
        </IconButton>

        <span data-gc="conversa.composer-link-preview.span"
          aria-hidden
          className="absolute -bottom-[5px] left-7 size-2.5 rotate-45 border-b border-r border-line-sutil bg-surface-1"
        />
      </div>
    </div>
  );
};
