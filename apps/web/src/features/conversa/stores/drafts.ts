import { create } from "zustand";

import type { MentionLabel } from "~/features/conversa/lib/mention-labels";

export interface Draft {
  text: string;
  mentions: MentionLabel[];
}

interface Drafts {
  byKey: Record<string, Draft>;
  save: (key: string, draft: Draft) => void;
  drop: (key: string) => void;
}

/*
  O que está escrito e ainda não foi enviado, guardado por conversa.

  A caixa de escrever é um componente só, que troca de canal por propriedade —
  então o texto ficava na tela ao mudar de conversa, e o que era para o Leonardo
  aparecia na conversa do Bot-test. Aqui cada canal (ou cada post do fórum) tem
  o seu rascunho, e trocar de conversa devolve exatamente o que tinha ficado ali.

  As menções vêm junto porque elas são um par (o que se lê × o token que vai no
  envio); sem elas, um rascunho restaurado mandaria @fulano como texto puro.

  Fica na memória: fechou o app, foi embora. Guardar em disco é outra conversa,
  porque rascunho é conteúdo de mensagem e ninguém pediu para ele sobreviver.
*/
export const useDrafts = create<Drafts>((set, store) => ({
  byKey: {},

  save: (key, draft) => {
    const current = store().byKey[key];
    if (current?.text === draft.text && current?.mentions === draft.mentions) return;

    if (!draft.text && !draft.mentions.length) {
      if (!current) return;

      const { [key]: _gone, ...rest } = store().byKey;
      set({ byKey: rest });
      return;
    }

    set({ byKey: { ...store().byKey, [key]: draft } });
  },

  drop: (key) => {
    const { [key]: _gone, ...rest } = store().byKey;
    set({ byKey: rest });
  },
}));
