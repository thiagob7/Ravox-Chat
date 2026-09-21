import { LINK, clearLink, extractLinks } from "~/features/conversa/lib/links";

const CODE_FENCE = /```[\s\S]*?```/g;
const INLINE_CODE = /`[^`\n]*`/g;
const SPOILER = /\|\|[\s\S]*?\|\|/g;

/*
  O link que a prévia da caixa de escrever vai olhar: o primeiro do texto.

  Link dentro de bloco de código, de crase ou de spoiler não conta. Quem cola
  código não quer ver cartão de nada, e quem esconde o link no spoiler pediu
  justamente que ele não apareça — na mensagem enviada é assim, e aqui também.
*/
export function firstLink(text: string): string | null {
  const clean = text.replace(CODE_FENCE, " ").replace(INLINE_CODE, " ").replace(SPOILER, " ");

  return extractLinks(clean, 1)[0] ?? null;
}

/*
  Qual link está debaixo do cursor, para abrir com ⌘/Ctrl + clique.

  Clique simples não abre de propósito: dentro de um campo de texto o clique
  serve para pôr o cursor no meio do endereço e corrigir o que foi digitado
  errado. Quem quer abrir segura a tecla, que é o gesto de editor.
*/
export function linkAt(text: string, caret: number): string | null {
  for (const match of text.matchAll(LINK)) {
    const start = match.index!;
    const url = clearLink(match[0]);

    if (caret >= start && caret <= start + url.length) return url;
  }

  return null;
}
