import { create } from "zustand";

const KEY = "gravae:dm-list";

interface Saved {
  pinned: string[];
  muted: string[];
}

function read(): Saved {
  try {
    const saved = localStorage.getItem(KEY);
    const parsed = saved ? (JSON.parse(saved) as Partial<Saved>) : null;

    return {
      pinned: Array.isArray(parsed?.pinned) ? parsed.pinned : [],
      muted: Array.isArray(parsed?.muted) ? parsed.muted : [],
    };
  } catch {
    return { pinned: [], muted: [] };
  }
}

function write(saved: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
  }
}

interface DmList extends Saved {
  togglePinned: (channelId: string) => void;
  toggleMuted: (channelId: string) => void;
}

const flip = (list: string[], id: string) =>
  list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

/*
  Fixar e silenciar conversa moram aqui, no aparelho, e não na conta.

  É o mesmo caminho das pastas do trilho e da lista de ignorados: ordem e
  barulho da lista são gosto de quem está na frente da tela, e não valem uma
  ida ao servidor a cada clique. Quem entra de outro computador vê a lista na
  ordem normal, com o som ligado.
*/
export const useDmList = create<DmList>((set, store) => ({
  ...read(),

  togglePinned: (channelId) => {
    const next = { ...store(), pinned: flip(store().pinned, channelId) };

    set({ pinned: next.pinned });
    write({ pinned: next.pinned, muted: next.muted });
  },

  toggleMuted: (channelId) => {
    const next = { ...store(), muted: flip(store().muted, channelId) };

    set({ muted: next.muted });
    write({ pinned: next.pinned, muted: next.muted });
  },
}));
