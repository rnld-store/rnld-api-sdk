import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import type { RnldEventMap, LiberationEvent } from './events/types.js';

const CHANNEL_LIBERATION = 'rnld_liberation_events';

const MIN_RECONNECT_MS = 1_000;
const MAX_RECONNECT_MS = 30_000;

/** Envelope enviado pelo rnld-bots-websocket */
interface WsEnvelope {
  channel: string;
  payload: Record<string, unknown>;
}

export class EventsClient extends EventEmitter {
  private readonly apiKey: string;
  private readonly wsUrl: string;
  private ws: WebSocket | null = null;
  private reconnectDelay = MIN_RECONNECT_MS;
  private destroyed = false;

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

  private _connect(): void {
    if (this.destroyed) return;

    const ws = new WebSocket(this.wsUrl, { headers: { 'x-api-key': this.apiKey } });
    this.ws = ws;

    ws.on('open', () => {
      this.reconnectDelay = MIN_RECONNECT_MS;
      this.emit('connected');
    });

    ws.on('message', (data) => {
      try {
        const envelope = JSON.parse(data.toString()) as WsEnvelope;
        this._dispatch(envelope);
      } catch {
        // ignora payloads malformados
      }
    });

    ws.on('close', () => {
      if (!this.destroyed) {
        this.emit('disconnected');
        this._scheduleReconnect();
      }
    });

    ws.on('error', (err) => {
      this.emit('error', err);
    });
  }

  private _scheduleReconnect(): void {
    setTimeout(() => this._connect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_MS);
  }

  private _dispatch(envelope: WsEnvelope): void {
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
