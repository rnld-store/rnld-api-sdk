import { WhitelistClient } from './WhitelistClient.js';
import { EventsClient } from './EventsClient.js';
import type { RnldClientOptions } from './types.js';

export const BASE_URL_V1 = 'https://api.rnld.dev';
export const BASE_URL_V2 = 'https://api-v2.rnld.dev';

/**
 * Resolve a URL base da API: `baseUrl` explícita > `v2` > v1 (padrão).
 * A barra final é removida para não gerar `//` nas rotas.
 */
export function resolveBaseUrl(options: Pick<RnldClientOptions, 'baseUrl' | 'v2'>): string {
  const url = options.baseUrl ?? (options.v2 ? BASE_URL_V2 : BASE_URL_V1);
  return url.replace(/\/+$/, '');
}

export class RnldClient {
  readonly whitelist: WhitelistClient;
  readonly events: EventsClient;

  private static readonly WS_URL = 'wss://events.rnld.dev/ws';

  constructor(options: RnldClientOptions) {
    const { apiKey, guildId, wsUrl } = options;

    this.whitelist = new WhitelistClient(apiKey, guildId, resolveBaseUrl(options));
    this.events = new EventsClient(apiKey, wsUrl ?? RnldClient.WS_URL);
  }
}
