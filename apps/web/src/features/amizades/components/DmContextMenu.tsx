import React from "react";
import { Ban, Bell, BellOff, Eye, EyeOff, Hash, IdCard, Phone, Pin, PinOff, UserMinus } from "lucide-react";
import { toast } from "react-toastify";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { useBlockUser } from "~/@core/application/queries/friend/use-block-user";
import { useConfirm } from "~/components/ui/confirm";
import { useDmList } from "~/features/amizades/stores/dm-list";
import { useIgnoreStore } from "~/stores/ignore-store";
import { useRemoveFriend } from "~/@core/application/queries/friend/use-remove-friend";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { useTranslation } from "~/traducao";

interface DmContextMenuProps {
  channelId: string;
  userId: string;
  name: string;
  friendshipId: string | null;
  children: React.ReactNode;
}

/*
  O menu de botão direito da conversa direta.

  Fixar, silenciar e ignorar ficam no aparelho; chamar, desfazer amizade e
  bloquear são as rotas que já existem. Nada aqui é enfeite: item que não teria
  efeito não entra, pela mesma razão que a privacidade por comunidade ficou de
  fora quando a checamos.
*/
export const DmContextMenu: React.FC<DmContextMenuProps> = ({
  channelId,
  userId,
  name,
  friendshipId,
  children,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirm();

  const join = useVoiceStore((s) => s.join);
  const block = useBlockUser();
  const removeFriend = useRemoveFriend();

  const pinned = useDmList((s) => s.pinned.includes(channelId));
  const muted = useDmList((s) => s.muted.includes(channelId));
  const togglePinned = useDmList((s) => s.togglePinned);
  const toggleMuted = useDmList((s) => s.toggleMuted);

  const ignored = useIgnoreStore((s) => s.ignoredList.includes(userId));
  const toggleIgnored = useIgnoreStore((s) => s.toggle);

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value).catch(() => null);
    toast.success(t("perfil.idCopiado"));
  };

  const unfriend = async () => {
    if (!friendshipId) return;

    const { confirmed } = await confirm({
      title: t("perfil.amizade.desfazerTitulo", { nome: name }),
      description: t("perfil.amizade.desfazerDescricao"),
      action: t("perfil.amizade.desfazer"),
    });

    if (confirmed) removeFriend.mutate(friendshipId);
  };

  const blockUser = async () => {
    const { confirmed } = await confirm({
      title: t("perfil.amizade.bloquearTitulo", { nome: name }),
      description: t("perfil.amizade.bloquearDescricao"),
      action: t("perfil.amizade.bloquear"),
    });

    if (confirmed) block.mutate(userId);
  };

  return (
    <ContextMenu data-gc="amizades.dm-context-menu.context-menu">
      <ContextMenuTrigger data-gc="amizades.dm-context-menu.context-menu-trigger" asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent data-gc="amizades.dm-context-menu.context-menu-content" className="w-60">
        <ContextMenuItem data-gc="amizades.dm-context-menu.context-menu-item" onSelect={() => void join(channelId)}>
          {t("amizades.menu.chamada")} <Phone data-gc="amizades.dm-context-menu.phone" size={14} />
        </ContextMenuItem>

        <ContextMenuSeparator data-gc="amizades.dm-context-menu.context-menu-separator" />

        <ContextMenuItem data-gc="amizades.dm-context-menu.context-menu-item--2" onSelect={() => togglePinned(channelId)}>
          {t(pinned ? "amizades.menu.desafixar" : "amizades.menu.fixar")}
          {pinned ? <PinOff data-gc="amizades.dm-context-menu.pin-off" size={14} /> : <Pin data-gc="amizades.dm-context-menu.pin" size={14} />}
        </ContextMenuItem>

        <ContextMenuItem data-gc="amizades.dm-context-menu.context-menu-item--3" onSelect={() => toggleMuted(channelId)}>
          {t(muted ? "amizades.menu.reativar" : "amizades.menu.silenciar")}
          {muted ? <Bell data-gc="amizades.dm-context-menu.bell" size={14} /> : <BellOff data-gc="amizades.dm-context-menu.bell-off" size={14} />}
        </ContextMenuItem>

        <ContextMenuItem data-gc="amizades.dm-context-menu.context-menu-item--4" onSelect={() => toggleIgnored(userId)}>
          {t(ignored ? "perfil.deixarDeIgnorar" : "perfil.ignorar")}
          {ignored ? <Eye data-gc="amizades.dm-context-menu.eye" size={14} /> : <EyeOff data-gc="amizades.dm-context-menu.eye-off" size={14} />}
        </ContextMenuItem>

        <ContextMenuSeparator data-gc="amizades.dm-context-menu.context-menu-separator--2" />

        {friendshipId && (
          <ContextMenuItem data-gc="amizades.dm-context-menu.context-menu-item--5" onSelect={() => void unfriend()}>
            {t("perfil.amizade.desfazer")} <UserMinus data-gc="amizades.dm-context-menu.user-minus" size={14} />
          </ContextMenuItem>
        )}

        <ContextMenuItem data-gc="amizades.dm-context-menu.context-menu-item--6" danger onSelect={() => void blockUser()}>
          {t("perfil.amizade.bloquear")} <Ban data-gc="amizades.dm-context-menu.ban" size={14} />
        </ContextMenuItem>

        <ContextMenuSeparator data-gc="amizades.dm-context-menu.context-menu-separator--3" />

        <ContextMenuItem data-gc="amizades.dm-context-menu.context-menu-item--7" onSelect={() => void copy(userId)}>
          {t("perfil.copiarId")} <IdCard data-gc="amizades.dm-context-menu.id-card" size={14} />
        </ContextMenuItem>

        <ContextMenuItem data-gc="amizades.dm-context-menu.context-menu-item--8" onSelect={() => void copy(channelId)}>
          {t("amizades.menu.copiarIdDoCanal")} <Hash data-gc="amizades.dm-context-menu.hash" size={14} />
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
