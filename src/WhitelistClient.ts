import { get, post, del, patch } from './http.js';
import { RnldNotFoundError } from './errors.js';
import type {
  QueryWhitelistParams,
  QueryWhitelistResponse,
  DivergenciaParams,
  DivergenciaResponse,
  DivergenciaFixParams,
  DivergenciaFixResponse,
  DeletarTokenParams,
  DeletarTokenResponse,
  LimparHwidsParams,
  LimparHwidsResponse,
  BanReasonParams,
  BanReasonResponse,
  StaffParams,
  DestaffParams,
  StaffResponse,
  TempbanParams,
  TempbanResponse,
  PrecadastroParams,
  PrecadastroResponse,
  AtualizaTokenParams,
  AtualizaTokenResponse,
  LiberarParams,
  LiberarResponse,
  RemoverWhitelistParams,
  BanParams,
  DesbanParams,
  MsgCommandParams,
  MsgCommandResponse,
} from './types.js';

export class WhitelistClient {
  constructor(
    private readonly apiKey: string,
    private readonly guildId: string,
    private readonly baseUrl: string,
  ) { }

  /**
   * Consulta o status de whitelist de um jogador.
   * Ao menos um identificador deve ser informado.
   *
   * Retorna `null` se o jogador não for encontrado (404).
   * Lança `RnldApiError` para outros erros.
   */
  async query(params: QueryWhitelistParams): Promise<QueryWhitelistResponse | null> {
    const url = `${this.baseUrl}/whitelists/query`;

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
   * Consulta uma divergência de whitelist pelo código.
   *
   * Retorna `null` se a divergência não for encontrada (404).
   * Lança `RnldApiError` para outros erros.
   */
  async divergencia(params: DivergenciaParams): Promise<DivergenciaResponse | null> {
    const url = `${this.baseUrl}/whitelists/divergence`;

    try {
      return await get<DivergenciaResponse>(url, this.apiKey, {
        guild_id: this.guildId,
        code: params.code,
      });
    } catch (err) {
      if (err instanceof RnldNotFoundError) return null;
      throw err;
    }
  }

  /**
   * Resolve uma divergência de whitelist.
   * Requer `divergenceId`.
   */
  async divergenciaFix(params: DivergenciaFixParams): Promise<DivergenciaFixResponse> {
    const url = `${this.baseUrl}/whitelists/divergencefix`;

    return post<DivergenciaFixResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      divergenceId: params.divergenceId,
    });
  }

  /**
   * Deleta o token de whitelist de um jogador.
   * Requer `wl_id`. `actorDiscordId` é opcional.
   */
  async deletarToken(params: DeletarTokenParams): Promise<DeletarTokenResponse> {
    const url = `${this.baseUrl}/whitelists/tokenclean`;

    return post<DeletarTokenResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      wl_id: params.wl_id,
      actorDiscordId: params.actorDiscordId,
    });
  }

  /**
   * Limpa os HWIDs vinculados a um jogador.
   * Requer `wl_id`.
   */
  async limparHwids(params: LimparHwidsParams): Promise<LimparHwidsResponse> {
    const url = `${this.baseUrl}/whitelists/refresh`;

    return post<LimparHwidsResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      wl_id: params.wl_id,
    });
  }

  /**
   * Atualiza o motivo de banimento de um jogador.
   * Requer `wl_id` e `reason`.
   */
  async atualizarMotivoBan(params: BanReasonParams): Promise<BanReasonResponse> {
    const url = `${this.baseUrl}/whitelists/banreason`;

    return patch<BanReasonResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      wl_id: params.wl_id,
      reason: params.reason,
    });
  }

  /**
   * Adiciona condição de staff ao token.
   * Requer `wl_id`. `discordId` é opcional.
   */
  async staff(params: StaffParams): Promise<StaffResponse> {
    const url = `${this.baseUrl}/whitelists/staff`;

    return post<StaffResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      wl_id: params.wl_id,
      discordId: params.discordId,
    });
  }

  /**
   * Remove condição de staff do token.
   * Requer `wl_id`.
   */
  async destaff(params: DestaffParams): Promise<StaffResponse> {
    const url = `${this.baseUrl}/whitelists/staff`;

    return del<StaffResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      wl_id: params.wl_id,
    });
  }

  /**
   * Aplica banimento temporário.
   * Requer `wl_id` e `hours`. `reason` é opcional.
   */
  async tempban(params: TempbanParams): Promise<TempbanResponse> {
    const url = `${this.baseUrl}/whitelists/tempban`;

    return post<TempbanResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      wl_id: params.wl_id,
      hours: params.hours,
      reason: params.reason,
    });
  }

  /**
   * Pré-cadastra um jogador.
   * Requer ao menos um identificador entre `discordId`, `steam`, `license` ou `license2`.
   */
  async precadastro(params: PrecadastroParams): Promise<PrecadastroResponse> {
    const url = `${this.baseUrl}/whitelists/precadastro`;

    if (!params.discordId && !params.steam && !params.license && !params.license2) {
      throw new Error(
        'É necessário informar ao menos um identificador: discordId, steam, license ou license2.',
      );
    }

    return post<PrecadastroResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      discordId: params.discordId,
      steam: params.steam,
      license: params.license,
      license2: params.license2,
      isBanned: params.isBanned ?? false,
      reason: params.reason,
    });
  }

  /**
   * Atualiza os identificadores de um token.
   * Requer `wl_id` e ao menos um entre `discordId`, `steam`, `license` ou `license2`.
   */
  async atualizaToken(params: AtualizaTokenParams): Promise<AtualizaTokenResponse> {
    const url = `${this.baseUrl}/whitelists/update`;

    if (!params.discordId && !params.steam && !params.license && !params.license2) {
      throw new Error(
        'É necessário informar ao menos um identificador para atualizar: discordId, steam, license ou license2.',
      );
    }

    return patch<AtualizaTokenResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      wl_id: params.wl_id,
      discordId: params.discordId,
      steam: params.steam,
      license: params.license,
      license2: params.license2,
    });
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

  /**
   * Bane um jogador.
   * Requer `wl_id`. `reason` é opcional.
   */
  async ban(params: BanParams): Promise<LiberarResponse> {
    const url = `${this.baseUrl}/whitelists/ban`;

    return post<LiberarResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      wl_id: params.wl_id,
      reason: params.reason,
    });
  }

  /**
   * Desbane um jogador.
   * Requer `wl_id`.
   */
  async desban(params: DesbanParams): Promise<LiberarResponse> {
    const url = `${this.baseUrl}/whitelists/ban`;

    return del<LiberarResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      wl_id: params.wl_id,
    });
  }

  /**
   * Envia comando dinâmico para endpoint de mensagens.
   * Requer `topic` e aceita quaisquer outras chaves no payload.
   */
  async msgCommand(params: MsgCommandParams): Promise<MsgCommandResponse> {
    const url = `${this.baseUrl}/msg/command`;

    return post<MsgCommandResponse>(url, this.apiKey, {
      guild_id: this.guildId,
      ...params,
    });
  }
}
