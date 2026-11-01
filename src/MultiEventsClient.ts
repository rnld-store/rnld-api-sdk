import WebSocket from 'ws';
import { EventsClient, type WsEnvelope } from './EventsClient.js';

/** Mesmo limite por mensagem que o rnld-bots-websocket aceita em /ws/multi. */
const MAX_KEYS_PER_MESSAGE = 100;

/** Resposta de controle do servidor (tem `op` em vez de `channel`). */
interface ControlReply {
  op: 'subscribed' | 'unsubscribed' | 'error';
  guild_id?: string;
  api_key_hint?: string;
  reason?: string;
}

/**
 * Uma única conexão WebSocket (`/ws/multi`) para várias guilds.
 *
 * Em vez de uma conexão por api_key, a conexão assina guilds por mensagem,
 * provando cada uma com a respectiva api_key. Os eventos são os mesmos do
 * `EventsClient` e já trazem `guild_id` no payload. Ao reconectar, todas as
 * keys assinadas são reenviadas automaticamente.
 *
 * Eventos extras (além dos de `RnldEventMap`):
 * - `subscribed` `(guildId: string)` — o servidor confirmou a assinatura
 * - `unsubscribed` `(guildId: string)`
 * - `subscribeError` `(reason: string, apiKeyHint?: string, guildId?: string)` —
 *   ex.: `invalid_key`, `limit_exceeded`
 */
export class MultiEventsClient extends EventsClient {
  private readonly keys = new Set<string>();

  constructor(wsUrl: string) {
    super('', wsUrl);
  }

  /** Assina as guilds dessas api_keys. Se já conectado envia agora; senão, ao conectar. */
  subscribe(apiKeys: string | string[]): this {
    const list = toArray(apiKeys);
    for (const k of list) this.keys.add(k);
    this.send('subscribe', list);
    return this;
  }

  /** Deixa de receber eventos das guilds dessas api_keys. */
  unsubscribe(apiKeys: string | string[]): this {
    const list = toArray(apiKeys);
    for (const k of list) this.keys.delete(k);
    this.send('unsubscribe', list);
    return this;
  }

  protected override createSocket(): WebSocket {
    // a autenticação é por mensagem (subscribe), não por header
    return new WebSocket(this.wsUrl);
  }

  protected override onOpen(): void {
    this.send('subscribe', [...this.keys]);
  }

  protected override _dispatch(envelope: WsEnvelope): void {
    const op = (envelope as unknown as Partial<ControlReply>).op;
    if (!op) {
      super._dispatch(envelope);
      return;
    }

    const reply = envelope as unknown as ControlReply;
    if (reply.op === 'subscribed') this.emit('subscribed', reply.guild_id);
    else if (reply.op === 'unsubscribed') this.emit('unsubscribed', reply.guild_id);
    else if (reply.op === 'error') {
      this.emit('subscribeError', reply.reason, reply.api_key_hint, reply.guild_id);
    }
  }

  private send(op: 'subscribe' | 'unsubscribe', apiKeys: string[]): void {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    for (let i = 0; i < apiKeys.length; i += MAX_KEYS_PER_MESSAGE) {
      ws.send(JSON.stringify({ op, api_keys: apiKeys.slice(i, i + MAX_KEYS_PER_MESSAGE) }));
    }
  }
}

function toArray(v: string | string[]): string[] {
  return Array.isArray(v) ? v : [v];
}
