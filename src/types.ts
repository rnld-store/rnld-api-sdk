export interface RnldClientOptions {
  /** API Key do servidor (mesmo header x-api-key) */
  apiKey: string;
  /** ID da guild Discord do servidor */
  guildId: string;
  /** URL do rnld-bots-websocket (ex: ws://localhost:8080/ws). Necessário para client.events */
  wsUrl?: string;
}

// ---------- Query ----------

export interface QueryWhitelistParams {
  /** Token amigável do jogador (wl_id) */
  wl_id?: string;
  /** Discord ID do jogador */
  discordId?: string;
  /** Steam Hex */
  steam?: string;
  /** License principal (Rockstar) */
  license?: string;
  /** License secundária */
  license2?: string;
}

export interface BanHistoryEntry {
  action: string;
  ban_reason: string | null;
  ban_expires_at: string | null;
  changed_at: string;
}

export interface PlayerIdentities {
  guild_id: string;
  discord_id: string;
  steamHex: string;
  license: string;
  license2: string;
  fivem: string;
  live: string;
  whitelisted: number;
  /** Token amigável (encoded) */
  id: string;
  /** Token amigável (encoded) — igual a `id` */
  wl_id: string;
}

export interface QueryWhitelistResponse {
  isStaff: boolean;
  isBanned: boolean;
  banReason: string;
  banExpiresAt: string | null;
  banHistory: BanHistoryEntry[];
  last_ip: string | null;
  identities: PlayerIdentities;
  code: number;
  mensagem: string;
}

// ---------- Liberar ----------

export interface LiberarParams {
  /** Token amigável do jogador */
  wl_id?: string;
  /** Discord ID do jogador */
  discordId?: string;
}

export interface LiberarResponse {
  status: boolean;
  mensagem: string;
  code?: number;
}

// ---------- Remover whitelist ----------

export interface RemoverWhitelistParams {
  /** Token amigável do jogador */
  wl_id: string;
}

// ---------- Ban / Desban ----------

export interface BanParams {
  /** Token amigável do jogador */
  wl_id: string;
  /** Motivo do banimento */
  reason?: string;
}

export interface DesbanParams {
  /** Token amigável do jogador */
  wl_id: string;
}
