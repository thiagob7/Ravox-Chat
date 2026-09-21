import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  asLe,
  connectionAddress,
  SERVICES_NAMES,
  type Connection,
} from "@gravae/shared";
import { toast } from "react-toastify";

import { apiErrorMessage } from "~/@core/lib/api";
import {
  Ban,
  Check,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldAlert,
  User,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import { toast as notice } from "react-toastify";

import { useFindProfile } from "~/@core/application/queries/user/use-find-profile";
import { useRequestFriend } from "~/@core/application/queries/friend/use-request-friend";
import { useRespondFriend } from "~/@core/application/queries/friend/use-respond-friend";
import { useRemoveFriend } from "~/@core/application/queries/friend/use-remove-friend";
import { useOpenDm } from "~/@core/application/queries/friend/use-open-dm";
import { prefetchMessages } from "~/@core/application/queries/message/use-find-messages";
import { useSendMessage } from "~/@core/application/queries/message/use-send-message";
import { useQueryClient } from "@tanstack/react-query";
import type { ProfileModel } from "~/@core/domain/models/profile-model";
import { highestPosition, type Role } from "@gravae/shared";

import { useModeration } from "~/features/servidor/stores/moderacao";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useMe } from "~/@core/application/queries/auth/use-me";
import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import { useSetMemberRoles } from "~/@core/application/queries/role/use-set-member-roles";
import { ProfileEditorModal } from "~/features/perfil/components/cartao/ProfileEditorModal";
import { StatusModal } from "~/features/perfil/components/cartao/StatusModal";
import { PickBadges } from "~/features/perfil/components/cartao/EscolherEmblemas";
import { ProfileCardVisual } from "~/features/perfil/components/cartao/ProfileCardVisual";
import { Tooltip } from "~/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { PickerFace, usePickerFace } from "~/features/expressao/components/CarinhaDoSeletor";
import { EmojiPicker } from "~/features/expressao/components/SeletorDeEmoji";
import { FullProfileModal } from "~/features/perfil/components/FullProfileModal";
import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { useCreateInvite } from "~/@core/application/queries/guild/use-create-invite";
import { useBlockUser } from "~/@core/application/queries/friend/use-block-user";
import { useIgnoreStore } from "~/stores/ignore-store";
import { sendMessage } from "~/@core/lib/websocket/send-message";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useConfirm } from "~/components/ui/confirm";
import { useCharms } from "~/features/perfil/hooks/use-enfeites";
import { usePermissions } from "~/hooks/use-permissions";
import { copyText } from "~/lib/copiar";
import { roleMoreHighColor } from "~/features/perfil/lib/cargo";
import { useTranslation } from "~/traducao";

let closeOpenCard: (() => void) | null = null;

interface UserProfilePopoverProps {
  userId: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  guildId?: string;
  roles?: Role[];
  roleIds?: string[];
  canModerate?: boolean;
}

const CARD_HEIGHT = 440;

export const UserProfilePopover: React.FC<UserProfilePopoverProps> = ({
  userId,
  children,
  side = "right",
  guildId,
  roles = [],
  roleIds = [],
  canModerate = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { data: profile, isLoading, isError } = useFindProfile(isOpen ? userId : null);

  const close = useRef(() => setIsOpen(false)).current;
  const trigger = useRef<HTMLButtonElement>(null);
  const anchor = useRef({ getBoundingClientRect: () => new DOMRect() });
  const [opening, setOpening] = useState(false);
  const [align, setAlign] = useState<"start" | "end">("start");

  const changeOpen = (open: boolean) => {
    if (open) {
      if (trigger.current) {
        const rect = trigger.current.getBoundingClientRect();
        const below = window.innerHeight - rect.top;
        anchor.current = { getBoundingClientRect: () => rect };
        setAlign(below < Math.min(CARD_HEIGHT, window.innerHeight * 0.8) && rect.bottom > below ? "end" : "start");
      }
      if (closeOpenCard !== close) closeOpenCard?.();
      closeOpenCard = close;
      setOpening(true);
      return;
    }

    if (closeOpenCard === close) closeOpenCard = null;
    setIsOpen(false);
  };

  useEffect(() => {
    if (!opening) return;
    setOpening(false);
    setIsOpen(true);
  }, [opening]);

  useEffect(() => () => {
    if (closeOpenCard === close) closeOpenCard = null;
  }, [close]);

  return (
    <Popover data-gc="perfil.user-profile-popover.popover.change-open" open={isOpen} onOpenChange={changeOpen} modal>
      <PopoverTrigger data-gc="perfil.user-profile-popover.popover-trigger" ref={trigger} asChild>{children}</PopoverTrigger>
      <PopoverAnchor data-gc="perfil.user-profile-popover.popover-anchor" virtualRef={anchor} />

      <PopoverContent data-gc="perfil.user-profile-popover.popover-content"
        side={side}
        align={align}
        className="max-h-[80vh] w-[300px] overflow-y-auto p-0 shadow-lg shadow-sombra"
      >
        {isError ? (
          <div data-gc="perfil.user-profile-popover.div" className="p-6 text-sm text-ink-faint">
            {t("perfil.semCartao")}
          </div>
        ) : isLoading || !profile ? (
          <div data-gc="perfil.user-profile-popover.div--2" className="p-6 text-sm text-ink-faint">{t("perfil.carregando")}</div>
        ) : (
          <ProfileCard data-gc="perfil.user-profile-popover.profile-card"
            profile={profile}
            onClose={() => setIsOpen(false)}
            guildId={guildId}
            roles={roles}
            roleIds={roleIds}
            canModerate={canModerate}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};

const ProfileCard: React.FC<{
  profile: ProfileModel;
  onClose: () => void;
  guildId?: string;
  roles: Role[];
  roleIds: string[];
  canModerate: boolean;
}> = ({ profile, onClose, guildId, roles, roleIds, canModerate }) => {
  const { t } = useTranslation();
  const [completeProfile, setProfileComplete] = useState(false);
  const [noteWanted, setNoteWanted] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [settingStatus, setSettingStatus] = useState(false);
  const { data: eu } = useMe(true);
  const updateProfile = useUpdateProfile();

  const block = useBlockUser();
  const guilds = useFindManyGuilds(true);
  const createInvite = useCreateInvite();
  const ignoredList = useIgnoreStore((s) => s.ignoredList);
  const toggleIgnored = useIgnoreStore((s) => s.toggle);

  const ignored = ignoredList.includes(profile.id);

  const charms = useCharms(guildId);
  const badges = charms.badges(profile.id);
  const { data: serverDetail } = useFindGuild(guildId);
  const guildMember = serverDetail?.members.find((m) => m.user.id === profile.id);
  const { can } = usePermissions(serverDetail);
  const setRoles = useSetMemberRoles(guildId);

  const serverRoles = serverDetail?.roles ?? roles;
  const serverMembers = serverDetail?.members ?? [];
  const memberIds =
    serverMembers.find((m) => m.user.id === profile.id)?.roleIds ?? roleIds;

  const memberRoles = serverRoles.filter(
    (r) => !r.isEveryone && memberIds.includes(r.id),
  );

  const roleColor = roleMoreHighColor(memberIds, serverRoles);

  const amOwner = Boolean(eu && serverDetail?.guild.ownerId === eu.id);
  const mineIds =
    serverMembers.find((m) => m.user.id === eu?.id)?.roleIds ?? [];
  const myPosition = amOwner
    ? Number.POSITIVE_INFINITY
    : highestPosition(serverRoles.filter((r) => mineIds.includes(r.id)));

  const canTouchPerson =
    amOwner || highestPosition(memberRoles) < myPosition;

  const givesRoles = Boolean(guildId) && can("MANAGE_ROLES") && canTouchPerson;

  const rolesCanGive = givesRoles
    ? serverRoles.filter((r) => !r.isEveryone && r.position < myPosition)
    : [];

  const toggleRole = (roleId: string) => {
    if (!guildId) return;

    const next = memberIds.includes(roleId)
      ? memberIds.filter((id) => id !== roleId)
      : [...memberIds, roleId];

    setRoles.mutate({ guildId, userId: profile.id, roleIds: next });
  };

  const inviteFor = async (targetGuildId: string) => {
    const invite = await createInvite
      .mutateAsync({ guildId: targetGuildId })
      .catch(() => null);
    if (!invite) return;

    const link = `${window.location.origin}/invite/${invite.code}`;

    if (profile.friendship === "ACCEPTED") {
      const channel = await openDm.mutateAsync(profile.id).catch(() => null);

      if (channel) {
        await sendMessage({
          channelId: channel.id,
          content: link,
          nonce: crypto.randomUUID(),
        });
        return notice.success(t("perfil.conviteEnviado", { nome: profile.displayName }));
      }
    }

    await copyText(link);
    notice.info(t("perfil.amizade.linkCopiado"));
  };
  const navigate = useNavigate();
  const requestFriend = useRequestFriend();
  const respondFriend = useRespondFriend();
  const confirm = useConfirm();
  const removeFriend = useRemoveFriend();
  const openDm = useOpenDm();

  const undoFriendship = async () => {
    const { confirmed } = await confirm({
      title: t("perfil.amizade.desfazerTitulo", { nome: profile.displayName }),
      description:
        t("perfil.amizade.desfazerDescricao"),
      action: t("perfil.amizade.desfazer"),
    });

    if (confirmed && profile.friendshipId)
      removeFriend.mutate(profile.friendshipId);
  };

  const blockUser = async () => {
    const { confirmed } = await confirm({
      title: t("perfil.amizade.bloquearTitulo", { nome: profile.displayName }),
      description:
        t("perfil.amizade.bloquearDescricao"),
      action: t("perfil.amizade.bloquear"),
    });

    if (confirmed) {
      block.mutate(profile.id);
      onClose();
    }
  };

  const chat = async () => {
    const channel = await openDm.mutateAsync(profile.id).catch(() => null);
    if (!channel) return;

    onClose();
    navigate(`/dm/${channel.id}`);
  };

  const busy =
    requestFriend.isPending ||
    respondFriend.isPending ||
    removeFriend.isPending ||
    openDm.isPending;

  const isSystem = Boolean(profile.system);
  const isBot = profile.isBot && !isSystem;
  /*
    Escrever para quem não é amigo é permitido, e quem decide é o servidor: ele
    aceita quando vocês dividem alguma comunidade e a pessoa não fechou a porta,
    e a primeira mensagem cai nas Solicitações dela — na aba Pedidos, ou na aba
    Spam, conforme o filtro que ela escolheu.

    Aqui só não se oferece o que com certeza não vai: para quem bloqueou, para
    você mesmo, para quem não divide comunidade nenhuma — e para a conta da
    casa, cuja conversa é de mão única. Escrever para ela nunca entrega: a
    mensagem volta com a recusa de conversa.recusada, e oferecer a caixa era
    convidar para um erro. O resto tenta, e a recusa do servidor chega escrita.
  */
  const canChat =
    profile.friendship === "ACCEPTED" ||
    isBot ||
    (profile.friendship !== "SELF" &&
      profile.friendship !== "BLOCKED" &&
      profile.mutualGuilds > 0);

  const topActions =
    profile.friendship === "SELF" ? null : (
      <>
        {canModerate && guildId && (
          <ButtonRound data-gc="perfil.user-profile-popover.button-round"
            label={t("perfil.moderador")}
            onClick={() => {
              useModeration.getState().open({
                guildId,
                userId: profile.id,
                displayName: profile.displayName,
                username: profile.username,
                avatarUrl: profile.avatarUrl,
              });
              onClose();
            }}
          >
            <ShieldAlert data-gc="perfil.user-profile-popover.shield-alert" size={15} />
          </ButtonRound>
        )}

        {!isBot && !isSystem && (
          <FriendshipButton data-gc="perfil.user-profile-popover.friendship-button" profile={profile} onAdd={() => requestFriend.mutate(profile.username)} />
        )}

        <DropdownMenu data-gc="perfil.user-profile-popover.dropdown-menu">
          <DropdownMenuTrigger data-gc="perfil.user-profile-popover.dropdown-menu-trigger" asChild>
            <button data-gc="perfil.user-profile-popover.button" aria-label={t("perfil.mais")} className={TRACK_BUTTON}>
              <MoreHorizontal data-gc="perfil.user-profile-popover.more-horizontal" size={15} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent data-gc="perfil.user-profile-popover.dropdown-menu-content" align="end">
            {canChat && (
              <>
                <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item" onSelect={() => void chat()}>
                  {t("perfil.abrirConversa")} <MessageSquare data-gc="perfil.user-profile-popover.message-square" size={14} />
                </DropdownMenuItem>
                <DropdownMenuSeparator data-gc="perfil.user-profile-popover.dropdown-menu-separator" />
              </>
            )}

            <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--2" onSelect={() => setProfileComplete(true)}>
              {t("perfil.verCompleto")} <User data-gc="perfil.user-profile-popover.user" size={14} />
            </DropdownMenuItem>

            {!isSystem && (
              <>
                <DropdownMenuSub data-gc="perfil.user-profile-popover.dropdown-menu-sub">
                  <DropdownMenuSubTrigger data-gc="perfil.user-profile-popover.dropdown-menu-sub-trigger">{t("perfil.convidarParaServidor")}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent data-gc="perfil.user-profile-popover.dropdown-menu-sub-content">
                    {guilds.data?.length ? (
                      guilds.data.map((server) => (
                        <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--3" key={server.id} onSelect={() => void inviteFor(server.id)}>
                          {server.name}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--4" disabled>{t("perfil.semServidores")}</DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator data-gc="perfil.user-profile-popover.dropdown-menu-separator--2" />

                <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--5" onSelect={() => toggleIgnored(profile.id)}>
                  {t(ignored ? "perfil.deixarDeIgnorar" : "perfil.ignorar")}
                  {ignored ? <Eye data-gc="perfil.user-profile-popover.eye" size={14} /> : <EyeOff data-gc="perfil.user-profile-popover.eye-off" size={14} />}
                </DropdownMenuItem>

                <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--6" danger onSelect={() => void blockUser()}>
                  {t("perfil.amizade.bloquear")} <Ban data-gc="perfil.user-profile-popover.ban" size={14} />
                </DropdownMenuItem>

                {profile.friendship === "ACCEPTED" && (
                  <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--7" danger onSelect={() => void undoFriendship()}>
                    {t("perfil.amizade.desfazer")} <UserX data-gc="perfil.user-profile-popover.user-x" size={14} />
                  </DropdownMenuItem>
                )}
              </>
            )}

            <DropdownMenuSeparator data-gc="perfil.user-profile-popover.dropdown-menu-separator--3" />

            <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--8"
              onSelect={() => {
                void copyText(profile.id);
                notice.success(t("perfil.idCopiado"));
              }}
            >
              {t("perfil.copiarId")} <Copy data-gc="perfil.user-profile-popover.copy" size={14} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );

  const downActions =
    profile.friendship === "SELF" ? (
      <Button data-gc="perfil.user-profile-popover.button--2" className="w-full" onClick={() => setEditingProfile(true)}>
        <Pencil data-gc="perfil.user-profile-popover.pencil" size={14} /> {t("perfil.editar")}
      </Button>
    ) : (
      <>
        {isBot && profile.botId && (
          <Button data-gc="perfil.user-profile-popover.button--3"
            className="w-full"
            variant={canChat ? "surface" : "primary"}
            onClick={() => {
              onClose();
              navigate(`/bots/${profile.botId}/adicionar`);
            }}
          >
            <Plus data-gc="perfil.user-profile-popover.plus" size={14} /> {t("perfil.adicionarAoServidor")}
          </Button>
        )}

        {/*
          A caixa de escrever fica no pé do cartão, e dentro dele. Fora, ela
          pegava o fundo do popover — mais claro que o do cartão — e o pé virava
          uma faixa de outra cor, com um vazio preto acima.
        */}
        {canChat && (
          <ProfileComposer data-gc="perfil.user-profile-popover.profile-composer.on-close"
            userId={profile.id}
            username={profile.username}
            onGo={onClose}
          />
        )}
      </>
    );

  return (
    <>
      {editingProfile && eu && (
        <ProfileEditorModal data-gc="perfil.user-profile-popover.profile-editor-modal"
          open
          user={eu}
          onClose={() => setEditingProfile(false)}
        />
      )}

      {settingStatus && eu && (
        <StatusModal data-gc="perfil.user-profile-popover.status-modal"
          open
          user={eu}
          profile={eu.profile}
          onClose={() => setSettingStatus(false)}
          onSave={(status) =>
            void updateProfile
              .mutateAsync({ customStatus: status })
              .then(() => setSettingStatus(false))
              .catch(() => null)
          }
          saving={updateProfile.isPending}
        />
      )}

      {completeProfile && (
        <FullProfileModal data-gc="perfil.user-profile-popover.full-profile-modal"
          open
          profile={profile}
          roleList={memberRoles}
          focusNote={noteWanted}
          onClose={() => {
            setProfileComplete(false);
            setNoteWanted(false);
          }}
        />
      )}

      <ProfileCardVisual data-gc="perfil.user-profile-popover.profile-card-visual"
        onOpenProfile={() => {
          setNoteWanted(false);
          setProfileComplete(true);
        }}
        onIrForNote={
          profile.friendship === "SELF" || profile.system
            ? undefined
            : () => {
                setNoteWanted(true);
                setProfileComplete(true);
              }
        }
        id={profile.id}
        displayName={profile.displayName}
        username={profile.username}
        isBot={profile.isBot}
        isSystem={profile.system}
        staff={profile.staff}
        premium={profile.premium}
        avatarUrl={guildMember?.avatarUrl ?? profile.avatarUrl}
        status={profile.status}
        profile={guildMember?.bannerUrl ? { ...profile.profile, bannerUrl: guildMember.bannerUrl } as typeof profile.profile : profile.profile}
        serverTag={profile.serverTag}
        customStatus={profile.customStatus}
        roleColor={roleColor}
        bio={guildMember?.bio ?? profile.bio}
        pronouns={profile.pronouns}
        detailed={profile.friendship === "SELF"}
        createdAt={profile.friendship === "SELF" ? profile.createdAt : null}
        joinedAt={
          profile.friendship === "SELF"
            ? serverDetail?.members.find((m) => m.user.id === profile.id)?.joinedAt
            : undefined
        }
        serverName={profile.friendship === "SELF" ? serverDetail?.guild.name : undefined}
        mutualFriends={profile.mutualFriends}
        mutualGuilds={profile.mutualGuilds}
        roleList={memberRoles}
        availableRoles={rolesCanGive}
        onToggleRole={givesRoles ? toggleRole : undefined}
        savingRoles={setRoles.isPending}
        onStatus={
          profile.friendship === "SELF"
            ? () => setSettingStatus(true)
            : undefined
        }
        badges={badges}
        topActions={topActions}
        downActions={downActions}
        className="rounded-none"
      >
        <ProfileConnections data-gc="perfil.user-profile-popover.profile-connections" connections={profile.profile?.connections} />

        {profile.friendship === "SELF" && guildId && (
          <PickBadges data-gc="perfil.user-profile-popover.pick-badges"
            guildId={guildId}
            available={serverDetail?.badges ?? []}
            worn={badges}
          />
        )}

        <div data-gc="perfil.user-profile-popover.div--3" className="mt-4 space-y-2 empty:mt-0">
          {profile.friendship !== "SELF" && !profile.system && (
            <>
              {profile.friendship === "PENDING_IN" && (
                <>
                  <p data-gc="perfil.user-profile-popover.p" className="mb-1 text-center text-xs text-ink-faint">
                    {t("perfil.amizade.teMandouPedido")}
                  </p>
                  <Button data-gc="perfil.user-profile-popover.button--4"
                    variant="success"
                    onClick={() =>
                      profile.friendshipId &&
                      respondFriend.mutate({
                        friendshipId: profile.friendshipId,
                        accept: true,
                      })
                    }
                    disabled={busy}
                    className="w-full"
                  >
                    <Check data-gc="perfil.user-profile-popover.check" size={16} /> {t("perfil.amizade.aceitar")}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </ProfileCardVisual>
    </>
  );
};

/*
  Escrever daqui abre a conversa e leva a pessoa para lá. Antes a mensagem
  saía, o cartão dizia "enviada" e você ficava onde estava — do outro lado
  alguém respondia e você não via, porque nada te levou para a conversa.
*/
const ProfileComposer: React.FC<{
  userId: string;
  username: string;
  onGo: () => void;
}> = ({ userId, username, onGo }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const face = usePickerFace();
  const openDm = useOpenDm();
  const queryClient = useQueryClient();
  const sendToConversation = useSendMessage();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  /*
    A mensagem sai pela conversa, e não por fora dela. Assim, se o servidor
    recusar, a recusa aparece onde a pessoa vai estar olhando — na conversa,
    marcada, com o aviso do Ravox Chat explicando — em vez de um toast que some.
  */
  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);

    try {
      const channel = await openDm.mutateAsync(userId).catch(() => null);
      if (!channel) return;

      await prefetchMessages(queryClient, channel.id);
      sendToConversation.mutate({ channelId: channel.id, content, nonce: crypto.randomUUID() });

      setText("");
      onGo();
      navigate(`/dm/${channel.id}`);
    } finally {
      setSending(false);
    }
  };

  /*
    A caixa não tem botão de enviar, e isso é de propósito: quem escreve aqui
    escreve uma linha e aperta Enter. O lugar do botão fica com o emoji, que é
    o que falta quando a caixa é pequena — a referência faz igual.
  */
  return (
    <div data-gc="perfil.user-profile-popover.div--4">
      <div data-gc="perfil.user-profile-popover.div--5" className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 pr-1.5">
        <Input data-gc="perfil.user-profile-popover.input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={t("perfil.recado.escrever", { usuario: username })}
          disabled={sending}
          className="border-0 bg-transparent shadow-none"
        />

        <EmojiPicker data-gc="perfil.user-profile-popover.emoji-picker" onPick={(emoji) => setText((current) => current + emoji)}>
          <button data-gc="perfil.user-profile-popover.button.enter"
            aria-label="Emoji"
            disabled={sending}
            onMouseEnter={face.enter}
            onMouseLeave={face.leave}
            onFocus={face.enter}
            onBlur={face.leave}
            className="shrink-0 rounded-md p-1.5 transition disabled:opacity-40"
          >
            <PickerFace data-gc="perfil.user-profile-popover.picker-face" face={face.face} lit={face.lit} />
          </button>
        </EmojiPicker>
      </div>

    </div>
  );
};

const TRACK_BUTTON =
  "flex size-8 items-center justify-center rounded-full bg-sobre-midia text-palco-ink/85 backdrop-blur-sm transition hover:bg-sobre-midia hover:text-palco-ink";

const ButtonRound: React.FC<{
  children: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ children, label, onClick, disabled }) => (
  <Tooltip data-gc="perfil.user-profile-popover.tooltip" label={label}>
    <button data-gc="perfil.user-profile-popover.button.on-click"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={TRACK_BUTTON + " disabled:cursor-default"}
    >
      {children}
    </button>
  </Tooltip>
);

const FriendshipButton: React.FC<{
  profile: ProfileModel;
  onAdd: () => void;
}> = ({ profile, onAdd }) => {
  const { t } = useTranslation();

  if (profile.friendship === "ACCEPTED") {
    return (
      <ButtonRound data-gc="perfil.user-profile-popover.button-round--2" label={t("perfil.amizade.amigo")} disabled>
        <UserCheck data-gc="perfil.user-profile-popover.user-check" size={16} className="text-online" />
      </ButtonRound>
    );
  }

  if (profile.friendship === "PENDING_OUT") {
    return (
      <ButtonRound data-gc="perfil.user-profile-popover.button-round--3" label={t("perfil.amizade.pedidoEnviado")} disabled>
        <Clock data-gc="perfil.user-profile-popover.clock" size={16} />
      </ButtonRound>
    );
  }

  if (profile.friendship === "PENDING_IN") {
    return (
      <ButtonRound data-gc="perfil.user-profile-popover.button-round--4" label={t("perfil.amizade.respondaAbaixo")} disabled>
        <UserPlus data-gc="perfil.user-profile-popover.user-plus" size={16} className="text-idle" />
      </ButtonRound>
    );
  }

  return (
    <ButtonRound data-gc="perfil.user-profile-popover.button-round.on-add" label={t("perfil.amizade.adicionar")} onClick={onAdd}>
      <UserPlus data-gc="perfil.user-profile-popover.user-plus--2" size={16} />
    </ButtonRound>
  );
};

const ProfileConnections: React.FC<{ connections?: Connection[] }> = ({ connections }) => {
  const { t } = useTranslation();
  const valid = (connections ?? [])
    .map((connection) => ({ connection, address: connectionAddress(connection) }))
    .filter(
      (c): c is { connection: Connection; address: string } => c.address !== null,
    );

  if (!valid.length) return null;

  return (
    <div data-gc="perfil.user-profile-popover.div--6" className="mt-3">
      <p data-gc="perfil.user-profile-popover.p--2" className="mb-1.5 text-11 font-semibold uppercase tracking-wide text-ink-faint">
        {t("perfil.conexoes")}
      </p>

      <div data-gc="perfil.user-profile-popover.div--7" className="flex flex-wrap gap-1.5">
        {valid.map(({ connection, address }, index) => (
          <a data-gc="perfil.user-profile-popover.a"
            key={`${connection.service}-${index}`}
            href={address}
            target="_blank"
            rel="noreferrer noopener"
            title={`${SERVICES_NAMES[connection.service]} — ${asLe(connection)}`}
            className="flex max-w-full items-center gap-1.5 rounded-md bg-surface-3 px-2 py-1 text-11 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
          >
            <Link2 data-gc="perfil.user-profile-popover.link2" size={12} className="shrink-0" />
            <span data-gc="perfil.user-profile-popover.span" className="truncate">{asLe(connection)}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
