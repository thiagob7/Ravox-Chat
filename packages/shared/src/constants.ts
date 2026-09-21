export const CHANNEL_TYPES = ["TEXT", "VOICE", "FORUM", "LINK"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export const PRESENCE_STATUSES = ["ONLINE", "IDLE", "DND", "OFFLINE"] as const;
export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

export const DESIRED_STATUSES = ["ONLINE", "IDLE", "DND", "INVISIBLE"] as const;
export type DesiredStatus = (typeof DESIRED_STATUSES)[number];

export const SPAM_FILTERS = ["TODOS", "DESCONHECIDOS", "NENHUM"] as const;
export type SpamFilter = (typeof SPAM_FILTERS)[number];

export const LIMITS = {
  messageLength: 4000,
  guildName: 64,
  channelName: 48,
  channelStatus: 500,
  username: 32,
  displayName: 48,
  attachmentsPerMessage: 10,
  attachmentBytes: 50 * 1024 * 1024,
  avatarBytes: 2 * 1024 * 1024,
  bannerBytes: 10 * 1024 * 1024,
  roleIconBytes: 256 * 1024,
  adBytes: 1024 * 1024,
  tag: 6,
  badgesByServer: 20,
  badgesByMember: 5,
  badgeName: 24,
  badgeBytes: 128 * 1024,
  customStatus: 96,
  bio: 512,
  pronouns: 40,
  messagePageSize: 50,
  typingTtlMs: 6000,
  emojisByServer: 50,
  stickersByServer: 5,
  soundsByServer: 8,
  soundWaitMs: 1500,
  stickerBytes: 512 * 1024,
  soundBytes: 512 * 1024,
  optionsByPoll: 5,
  messagesPinned: 50,
  modeSlowMax: 21_600,
  postTitle: 100,
  embedsPerMessage: 10,
  embedFields: 25,
  embedTotalLength: 6000,
  componentRows: 5,
  componentsPerRow: 5,
  selectOptions: 25,
  modalFields: 5,
  modalFieldLength: 4000,
} as const;

export const NOTE_LIMIT = 120;

export const UPLOAD_PURPOSES = ["anexo", "avatar", "banner", "iconeDeCargo", "ad"] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export const CEILING_BY_PURPOSE: Record<UploadPurpose, number> = {
  anexo: LIMITS.attachmentBytes,
  avatar: LIMITS.avatarBytes,
  banner: LIMITS.bannerBytes,
  iconeDeCargo: LIMITS.roleIconBytes,
  ad: LIMITS.adBytes,
};

export const MODE_SLOW_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 21_600] as const;
