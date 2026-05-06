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

export interface DefaultResponse {
  status: boolean;
  mensagem: string;
  code?: number;
}

// ---------- Divergência ----------

export interface DivergenciaParams {
  /** Código da divergência */
  code: string;
}

export interface DivergenceData {
  divergenceId: string;
  player_id: string;
  discord_id: string;
  steamhex: string;
  license: string;
  license2: string;
  resolved: number;
  divergence_code: string;
}

export interface DivergenciaResponse {
  status: boolean;
  data: DivergenceData;
  mensagem: string;
  code: number;
}

export interface DivergenciaFixParams {
  /** ID da divergência */
  divergenceId: string;
}

export interface DivergenciaFixIdentitiesUpdated {
  discord_id: string;
  steamhex: string;
  license: string;
  license2: string;
}

export interface DivergenciaFixData {
  divergenceId: string;
  player_id: string;
  identities_updated: DivergenciaFixIdentitiesUpdated;
}

export interface DivergenciaFixResponse {
  status: boolean;
  data: DivergenciaFixData;
  mensagem: string;
  code: number;
}

export interface DeletarTokenParams {
  /** Token amigável do jogador */
  wl_id: string;
  /** Discord ID do ator responsável pela ação */
  actorDiscordId?: string;
}

export type DeletarTokenResponse = DefaultResponse;

export interface LimparHwidsParams {
  /** Token amigável do jogador */
  wl_id: string;
}

export type LimparHwidsResponse = DefaultResponse;

// ---------- Liberar ----------

export interface LiberarParams {
  /** Token amigável do jogador */
  wl_id?: string;
  /** Discord ID do jogador */
  discordId?: string;
}

export type LiberarResponse = DefaultResponse;

export interface BanReasonParams {
  /** Token amigável do jogador */
  wl_id: string;
  /** Novo motivo do banimento */
  reason: string;
}

export type BanReasonResponse = DefaultResponse;

export interface StaffParams {
  /** Token amigável do jogador */
  wl_id: string;
  /** Discord ID do jogador (opcional no POST) */
  discordId?: string;
}

export interface DestaffParams {
  /** Token amigável do jogador */
  wl_id: string;
}

export type StaffResponse = DefaultResponse;

export interface TempbanParams {
  /** Token amigável do jogador */
  wl_id: string;
  /** Duração do banimento temporário em horas */
  hours: number;
  /** Motivo do banimento temporário */
  reason?: string;
}

export interface TempbanResponse {
  status: boolean;
  code: number;
  topic: string;
  token: string;
  expires_at: string;
  mensagem: string;
}

export interface PrecadastroParams {
  /** Discord ID do jogador */
  discordId?: string;
  /** Steam Hex */
  steam?: string;
  /** License principal (Rockstar) */
  license?: string;
  /** License secundária */
  license2?: string;
  /** Se deve marcar como banido no pré-cadastro */
  isBanned?: boolean;
  /** Motivo do banimento (quando aplicável) */
  reason?: string;
}

export interface PrecadastroResponse {
  status: boolean;
  mensagem: string;
  code: number;
  data: {
    wl_id: string;
  };
}

export interface AtualizaTokenParams {
  /** Token amigável do jogador */
  wl_id: string;
  /** Discord ID do jogador */
  discordId?: string;
  /** Steam Hex */
  steam?: string;
  /** License principal (Rockstar) */
  license?: string;
  /** License secundária */
  license2?: string;
}

export type AtualizaTokenResponse = DefaultResponse;

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

// ---------- Msg Command ----------

export interface MsgCommandParams {
  /** Tópico da mensagem */
  topic: string;
  /** Payload dinâmico: aceita quaisquer chaves extras */
  [key: string]: unknown;
}

export interface MsgCommandResponse {
  code: number;
  result: any;
}
