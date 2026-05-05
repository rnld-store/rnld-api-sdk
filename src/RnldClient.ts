import { WhitelistClient } from './WhitelistClient.js';
import type { RnldClientOptions } from './types.js';

export class RnldClient {
  readonly whitelist: WhitelistClient;

  private static readonly BASE_URL = 'https://api.rnld.dev';

  constructor(options: RnldClientOptions) {
    const { apiKey, guildId } = options;

    this.whitelist = new WhitelistClient(apiKey, guildId, RnldClient.BASE_URL);
  }
}
