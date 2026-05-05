import { WhitelistClient } from './WhitelistClient.js';
import type { RnldClientOptions } from './types.js';

export class RnldClient {
  readonly whitelist: WhitelistClient;

  constructor(options: RnldClientOptions) {
    const { apiKey, guildId, baseUrl, querierUrl } = options;

    const normalizedBase = baseUrl.replace(/\/$/, '');
    const normalizedQuerier = (querierUrl ?? baseUrl).replace(/\/$/, '');

    this.whitelist = new WhitelistClient(
      apiKey,
      guildId,
      normalizedBase,
      normalizedQuerier,
    );
  }
}
