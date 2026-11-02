import WebSocket from 'ws';
import { EventsClient, type WsEnvelope } from './EventsClient.js';

/** Mesmo limite por mensagem que o rnld-bots-websocket aceita em /ws/multi. */
const MAX_KEYS_PER_MESSAGE = 100;

/**
 * Close code: a conexão ficou sem nenhuma guild assinada (nunca assinou, só
 * mandou keys inválidas ou removeu todas). Mesmo valor do rnld-bots-websocket.
 */
export const CLOSE_NO_SUBSCRIPTIONS = 4001;
/** Close code: excesso de api_keys inválidas na mesma conexão. */
export const CLOSE_TOO_MANY_INVALID_KEYS = 4002;

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
 *   ex.: `invalid_key`, `limit_exceeded`, `unavailable` (banco do servidor
 *   indisponível; tente de novo) e `too_many_invalid_keys` (o servidor fechou a
 *   conexão por excesso de keys inválidas; o cliente reconecta com backoff)
 *
 * O servidor fecha conexões sem nenhuma guild assinada. Se isso acontecer com
 * o cliente sem keys, a reconexão fica suspensa até o próximo `subscribe()`.
 * Remova (`unsubscribe`) keys que voltarem `invalid_key`: elas são reenviadas a
 * cada reconexão.
 */
export class MultiEventsClient extends EventsClient {
  private readonly keys = new Set<string>();
  /** Reconexão suspensa: o servidor fechou por falta de assinatura e não há keys. */
  private paused = false;

  constructor(wsUrl: string) {
    super('', wsUrl);
  }

  /** Assina as guilds dessas api_keys. Se já conectado envia agora; senão, ao conectar. */
  subscribe(apiKeys: string | string[]): this {
    const list = toArray(apiKeys);
    for (const k of list) this.keys.add(k);
    if (this.paused && this.keys.size > 0 && !this.destroyed) {
      this.paused = false;
      this.connect(); // o onOpen envia todas as keys
      return this;
    }
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

  override connect(): this {
    this.paused = false;
    return super.connect();
  }

  protected override shouldReconnect(code: number): boolean {
    if (code === CLOSE_TOO_MANY_INVALID_KEYS) {
      this.emit('subscribeError', 'too_many_invalid_keys', undefined, undefined);
    }
    if (code === CLOSE_NO_SUBSCRIPTIONS && this.keys.size === 0) {
      this.paused = true;
      return false;
    }
    return true;
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
