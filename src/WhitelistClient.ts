import { post, del } from './http.js';
import { RnldNotFoundError } from './errors.js';
import type {
  QueryWhitelistParams,
  QueryWhitelistResponse,
  LiberarParams,
  LiberarResponse,
  RemoverWhitelistParams,
} from './types.js';

export class WhitelistClient {
  constructor(
    private readonly apiKey: string,
    private readonly guildId: string,
    private readonly baseUrl: string,
    private readonly querierUrl: string,
  ) {}

  /**
   * Consulta o status de whitelist de um jogador.
   * Ao menos um identificador deve ser informado.
   *
   * Retorna `null` se o jogador não for encontrado (404).
   * Lança `RnldApiError` para outros erros.
   */
  async query(params: QueryWhitelistParams): Promise<QueryWhitelistResponse | null> {
    const url = `${this.querierUrl}/whitelists/query`;

    try {
      return await post<QueryWhitelistResponse>(url, this.apiKey, {
        guild_id: this.guildId,
        ...params,
      });
    } catch (err) {
      if (err instanceof RnldNotFoundError) return null;
      throw err;
    }
  }

  /**
   * Libera (whitelist) um jogador.
   * Requer `wl_id` ou `discordId`.
   */
  async liberar(params: LiberarParams): Promise<LiberarResponse> {
    const url = `${this.baseUrl}/whitelists/liberar`;

    return post<LiberarResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      ...params,
    });
  }

  /**
   * Remove a whitelist de um jogador.
   * Requer `wl_id`.
   */
  async remover(params: RemoverWhitelistParams): Promise<LiberarResponse> {
    const url = `${this.baseUrl}/whitelists/liberar`;

    return del<LiberarResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      wl_id: params.wl_id,
    });
  }
}
