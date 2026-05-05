// ── rnld_ban_events ──────────────────────────────────────────────────────────

export interface BanEvent {
  type: 'ban';
  guild_id: string;
  discord_id: string;
  wl_id: string;
  reason: string;
  ts: string;
}

export interface TempBanEvent {
  type: 'tempban';
  guild_id: string;
  discord_id: string;
  wl_id: string;
  reason: string;
  expires_at: string;
  ts: string;
}

export interface UnbanEvent {
  type: 'unban';
  guild_id: string;
  discord_id: string;
  wl_id: string;
  reason: string;
  /** 'auto_expired' quando o tempban expirou automaticamente */
  subtype?: 'auto_expired';
  ts: string;
}

// ── rnld_nickname_events ─────────────────────────────────────────────────────

export interface NicknameFailedMemberEvent {
  type: 'nicknameFailed';
  reason: 'member_not_found';
  guild_id: string;
  discord_id: string;
  wl_id: string;
  nickname: string;
  ts: string;
}

export interface NicknameFailedDiscordEvent {
  type: 'nicknameFailed';
  reason: 'discord_id_not_found';
  guild_id: string;
  license: string;
  nickname: string;
  ts: string;
}

export type NicknameFailedEvent = NicknameFailedMemberEvent | NicknameFailedDiscordEvent;

export interface UpdateNicknameEvent {
  type: 'updateNickname';
  guild_id: string;
  discord_id: string;
  new_nickname: string;
  ts: string;
}

// ── rnld_roles_events ────────────────────────────────────────────────────────

export interface UpdateRolesEvent {
  type: 'updateRoles';
  guild_id: string;
  discord_id: string;
  roles_add: string[];
  roles_remove: string[];
  ts: string;
}

// ── rnld_liberation_events ───────────────────────────────────────────────────

export interface LiberationEvent {
  guild_id: string;
  discord_id: string;
  wl_id: string;
  ts: string;
}

// ── rnld_channelbridge_events ────────────────────────────────────────────────

export interface BridgeAttachment {
  url: string;
  name: string;
  content_type: string | null;
}

export interface BridgeMessageEvent {
  type: 'bridge_message';
  source_guild_id: string;
  source_guild_name: string;
  source_guild_icon: string | null;
  source_channel_id: string;
  source_channel_name: string | null;
  author_id: string;
  author_username: string;
  author_tag: string;
  author_nickname: string;
  author_avatar: string | null;
  content: string;
  attachments: BridgeAttachment[];
  ts: string;
}

// ── Mapa de eventos para o EventEmitter ─────────────────────────────────────

export interface RnldEventMap {
  ban: [BanEvent];
  tempban: [TempBanEvent];
  unban: [UnbanEvent];
  nicknameFailed: [NicknameFailedEvent];
  updateNickname: [UpdateNicknameEvent];
  updateRoles: [UpdateRolesEvent];
  liberation: [LiberationEvent];
  bridge_message: [BridgeMessageEvent];
  /** Conexão WebSocket estabelecida (ou reestabelecida após queda) */
  connected: [];
  /** Conexão perdida; reconexão automática será tentada */
  disconnected: [];
  error: [Error];
}
