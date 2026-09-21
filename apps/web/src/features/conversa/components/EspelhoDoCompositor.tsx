import React from "react";

import { EMOJI, urlDoEmoji } from "~/features/expressao/lib/twemoji";
import { LINK, clearLink } from "~/features/conversa/lib/links";
import { cn } from "~/lib/utils";
import { mentionPattern } from "~/features/conversa/lib/mention-labels";

interface Props {
  text: string;
  mentions?: string[];
  fontFamily?: string;
  className?: string;
}

const EmojiText: React.FC<{ emoji: string }> = ({ emoji }) => {
  const [withoutDrawing, setWithoutDrawing] = React.useState(false);

  React.useEffect(() => setWithoutDrawing(false), [emoji]);

  if (withoutDrawing) return <>{emoji}</>;

  return (
    <span data-gc="conversa.espelho-do-compositor.span" className="relative text-transparent">
      {emoji}
      <img data-gc="conversa.espelho-do-compositor.img"
        src={urlDoEmoji(emoji)}
        alt=""
        aria-hidden
        onError={() => setWithoutDrawing(true)}
        className="pointer-events-none absolute inset-0 size-full object-contain"
      />
    </span>
  );
};

export const ComposerMirror = React.forwardRef<HTMLDivElement, Props>(
  ({ text, mentions = [], fontFamily, className }, ref) => {
    const parts: React.ReactNode[] = [];
    const pattern = mentionPattern(mentions);

    /*
      O link fica azul enquanto se escreve, igual ao da mensagem enviada.

      A pontuação que vem colada no fim (ponto, vírgula, parêntese) fica fora do
      azul, pela mesma regra do `clearLink` que decide o que é o endereço na
      hora de mandar. Assim o que está pintado é exatamente o que vai virar
      link — e o que não está, não vira.
    */
    const withLinks = (piece: string, key: number) => {
      const out: React.ReactNode[] = [];
      let from = 0;

      for (const match of piece.matchAll(LINK)) {
        const start = match.index!;
        const url = clearLink(match[0]);

        if (start > from) out.push(piece.slice(from, start));

        out.push(
          <span data-gc="conversa.espelho-do-compositor.span--2" key={`link-${key}-${start}`} style={{ color: "var(--color-link)" }}>
            {url}
          </span>,
        );

        out.push(match[0].slice(url.length));
        from = start + match[0].length;
      }

      if (from < piece.length) out.push(piece.slice(from));
      return out;
    };

    const withMentions = (piece: string, key: number) => {
      if (!pattern) return withLinks(piece, key);

      const out: React.ReactNode[] = [];
      let from = 0;

      for (const match of piece.matchAll(pattern)) {
        const start = match.index!;
        if (start > from) out.push(...withLinks(piece.slice(from, start), from));
        out.push(
          <span data-gc="conversa.espelho-do-compositor.span--3"
            key={`${key}-${start}`}
            className="rounded-sm"
            style={{
              color: "var(--color-mencao)",
              backgroundColor: "color-mix(in srgb, var(--color-mencao) 15%, transparent)",
            }}
          >
            {match[0]}
          </span>,
        );
        from = start + match[0].length;
      }

      if (from < piece.length) out.push(...withLinks(piece.slice(from), from));
      return out;
    };

    let last = 0;

    for (const match of text.matchAll(EMOJI)) {
      const start = match.index!;
      if (start > last) parts.push(...withMentions(text.slice(last, start), last));
      parts.push(<EmojiText data-gc="conversa.espelho-do-compositor.emoji-text" key={start} emoji={match[0]} />);
      last = start + match[0].length;
    }

    if (last < text.length) parts.push(...withMentions(text.slice(last), last));
    if (text.endsWith("\n")) parts.push("​");

    return (
      <div data-gc="conversa.espelho-do-compositor.div"
        ref={ref}
        aria-hidden
        style={{ fontFamily }}
        className={cn(
          "pointer-events-none absolute inset-0 select-none overflow-hidden whitespace-pre-wrap break-words text-ink",
          className,
        )}
      >
        {parts}
      </div>
    );
  },
);

ComposerMirror.displayName = "EspelhoDoCompositor";
