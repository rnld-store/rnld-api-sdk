import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import type { RnldEventMap, LiberationEvent } from './events/types.js';

const CHANNEL_LIBERATION = 'rnld_liberation_events';

const MIN_RECONNECT_MS = 1_000;
const MAX_RECONNECT_MS = 30_000;

/** Envelope enviado pelo rnld-bots-websocket */
export interface WsEnvelope {
  channel: string;
  payload: Record<string, unknown>;
}

export class EventsClient extends EventEmitter {
  protected readonly apiKey: string;
  protected readonly wsUrl: string;
  protected ws: WebSocket | null = null;
  protected reconnectDelay = MIN_RECONNECT_MS;
  protected destroyed = false;

  constructor(apiKey: string, wsUrl: string) {
    super();
    this.apiKey = apiKey;
    this.wsUrl = wsUrl;
  }

  // ── Typed overloads ────────────────────────────────────────────────────────

  on<K extends keyof RnldEventMap>(event: K, listener: (...args: RnldEventMap[K]) => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }

  once<K extends keyof RnldEventMap>(event: K, listener: (...args: RnldEventMap[K]) => void): this;
  once(event: string, listener: (...args: unknown[]) => void): this;
  once(event: string, listener: (...args: unknown[]) => void): this {
    return super.once(event, listener);
  }

  off<K extends keyof RnldEventMap>(event: K, listener: (...args: RnldEventMap[K]) => void): this;
  off(event: string, listener: (...args: unknown[]) => void): this;
  off(event: string, listener: (...args: unknown[]) => void): this {
    return super.off(event, listener);
  }

  emit<K extends keyof RnldEventMap>(event: K, ...args: RnldEventMap[K]): boolean;
  emit(event: string, ...args: unknown[]): boolean;
  emit(event: string, ...args: unknown[]): boolean {
    return super.emit(event, ...args);
  }

  // ── Conexão ───────────────────────────────────────────────────────────────

  /** Inicia a conexão WebSocket. Reconecta automaticamente em caso de queda. */
  connect(): this {
    this.destroyed = false;
    this._connect();
    return this;
  }

  /** Encerra a conexão e cancela reconexões futuras. */
  destroy(): void {
    this.destroyed = true;
    this.ws?.close();
    this.ws = null;
  }

  /** Abre o socket. Subclasses sobrescrevem para mudar a autenticação do handshake. */
  protected createSocket(): WebSocket {
    return new WebSocket(this.wsUrl, { headers: { 'x-api-key': this.apiKey } });
  }

  /** Chamado após cada `open` (inclusive reconexões), depois de emitir `connected`. */
  protected onOpen(): void {}

  /**
   * Chamado quando o socket fecha (sem `destroy()`), com o close code do
   * servidor. Retornar `false` suspende a reconexão automática.
   */
  protected shouldReconnect(_code: number, _reason: string): boolean {
    return true;
  }

  private _connect(): void {
    if (this.destroyed) return;

    const ws = this.createSocket();
    this.ws = ws;

    ws.on('open', () => {
      this.reconnectDelay = MIN_RECONNECT_MS;
      this.emit('connected');
      this.onOpen();
    });

    ws.on('message', (data) => {
      try {
        const envelope = JSON.parse(data.toString()) as WsEnvelope;
        this._dispatch(envelope);
      } catch {
        // ignora payloads malformados
      }
    });

    ws.on('close', (code, reason) => {
      if (!this.destroyed) {
        this.emit('disconnected');
        if (this.shouldReconnect(code, reason.toString())) this._scheduleReconnect();
      }
    });

    ws.on('error', (err) => {
      this.emit('error', err);
    });
  }

  private _scheduleReconnect(): void {
    // jitter (50–100% do delay): evita que muitos clientes reconectem em sincronia
    // quando o servidor reinicia.
    const delay = this.reconnectDelay * (0.5 + Math.random() * 0.5);
    setTimeout(() => this._connect(), delay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_MS);
  }

  protected _dispatch(envelope: WsEnvelope): void {
    const { channel, payload } = envelope;

    if (channel === CHANNEL_LIBERATION) {
      this.emit('liberation', payload as unknown as LiberationEvent);
      return;
    }

    const type = payload['type'] as string | undefined;
    if (type) {
      this.emit(type as keyof RnldEventMap, payload as never);
    }
  }
}
