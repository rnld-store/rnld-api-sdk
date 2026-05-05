export interface RnldClientOptions {
  /** API Key do servidor (mesmo header x-api-key) */
  apiKey: string;
  /** ID da guild Discord do servidor */
  guildId: string;
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
  ban_reason: string;
  ban_expires_at: string | null;
  changed_at: string;
}

export interface PlayerIdentities {
  guild_id: string | null;
  discord_id: string | null;
  steamHex: string | null;
  license: string | null;
  license2: string | null;
  fivem: string | null;
  live: string | null;
  whitelisted: number | boolean | null;
  /** Token amigável (encoded) */
  id: string | null;
  /** Token amigável (encoded) — igual a `id` */
  wl_id: string | null;
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
