import { WhitelistClient } from './WhitelistClient.js';
import { EventsClient } from './EventsClient.js';
import type { RnldClientOptions } from './types.js';

export class RnldClient {
  readonly whitelist: WhitelistClient;
  readonly events: EventsClient;

  private static readonly BASE_URL = 'https://api.rnld.dev';
  private static readonly WS_URL = 'wss://events.rnld.dev/ws';

  constructor(options: RnldClientOptions) {
    const { apiKey, guildId, wsUrl } = options;

    this.whitelist = new WhitelistClient(apiKey, guildId, RnldClient.BASE_URL);
    this.events = new EventsClient(apiKey, wsUrl ?? RnldClient.WS_URL);
  }
}
