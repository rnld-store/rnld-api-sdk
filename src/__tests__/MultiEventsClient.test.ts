import { afterEach, describe, expect, it } from 'vitest';
import { WebSocketServer, type WebSocket as ServerSocket } from 'ws';
import type { AddressInfo } from 'node:net';
import { MultiEventsClient } from '../MultiEventsClient.js';

interface Control {
  op: string;
  api_keys: string[];
}

let wss: WebSocketServer | null = null;
let client: MultiEventsClient | null = null;

afterEach(async () => {
  client?.destroy();
  client = null;
  await new Promise<void>((resolve) => {
    if (!wss) return resolve();
    for (const c of wss.clients) c.terminate();
    wss.close(() => resolve());
    wss = null;
  });
});

/** Sobe um servidor que registra os pedidos de controle e responde como o rnld-bots-websocket. */
async function startServer() {
  const received: Control[] = [];
  const sockets: ServerSocket[] = [];
  wss = new WebSocketServer({ port: 0 });
  await new Promise<void>((r) => wss!.once('listening', () => r()));

  wss.on('connection', (socket, req) => {
    sockets.push(socket);
    expect(req.headers['x-api-key']).toBeUndefined();
    socket.on('message', (data) => {
      const msg = JSON.parse(data.toString()) as Control;
      received.push(msg);
      for (const key of msg.api_keys) {
        if (key.startsWith('bad')) {
          socket.send(JSON.stringify({ op: 'error', api_key_hint: key.slice(0, 4), reason: 'invalid_key' }));
        } else {
          socket.send(JSON.stringify({ op: msg.op === 'subscribe' ? 'subscribed' : 'unsubscribed', guild_id: `g-${key}` }));
        }
      }
    });
  });

  const url = `ws://127.0.0.1:${(wss.address() as AddressInfo).port}/ws/multi`;
  return { url, received, sockets };
}

const once = <T extends unknown[]>(c: MultiEventsClient, ev: string) =>
  new Promise<T>((resolve) => c.once(ev, (...args: unknown[]) => resolve(args as T)));

describe('MultiEventsClient', () => {
  it('assina ao conectar as keys registradas antes do open e confirma com subscribed', async () => {
    const { url, received } = await startServer();
    client = new MultiEventsClient(url);
    client.subscribe(['k1', 'k2']);

    const acks: string[] = [];
    client.on('subscribed', (g: unknown) => acks.push(g as string));
    client.connect();

    await once(client, 'connected');
    await new Promise((r) => setTimeout(r, 100));

    expect(received).toEqual([{ op: 'subscribe', api_keys: ['k1', 'k2'] }]);
    expect(acks.sort()).toEqual(['g-k1', 'g-k2']);
  });

  it('envia subscribe/unsubscribe imediatamente quando já conectado', async () => {
    const { url, received } = await startServer();
    client = new MultiEventsClient(url).connect();
    await once(client, 'connected');

    client.subscribe('k1');
    client.unsubscribe('k1');
    await new Promise((r) => setTimeout(r, 100));

    expect(received).toEqual([
      { op: 'subscribe', api_keys: ['k1'] },
      { op: 'unsubscribe', api_keys: ['k1'] },
    ]);
  });

  it('divide pedidos grandes em lotes de 100 keys', async () => {
    const { url, received } = await startServer();
    client = new MultiEventsClient(url).connect();
    await once(client, 'connected');

    client.subscribe(Array.from({ length: 250 }, (_, i) => `k${i}`));
    await new Promise((r) => setTimeout(r, 150));

    expect(received.map((m) => m.api_keys.length)).toEqual([100, 100, 50]);
  });

  it('despacha eventos normalmente e expõe erros de assinatura', async () => {
    const { url, sockets } = await startServer();
    client = new MultiEventsClient(url).connect();
    await once(client, 'connected');

    const errors: unknown[][] = [];
    client.on('subscribeError', (...args: unknown[]) => errors.push(args));
    client.subscribe('bad-key');

    const ban = once<[{ guild_id: string }]>(client, 'ban');
    sockets[0]!.send(JSON.stringify({ channel: 'rnld_ban_events', payload: { type: 'ban', guild_id: 'g1' } }));

    expect((await ban)[0].guild_id).toBe('g1');
    await new Promise((r) => setTimeout(r, 100));
    expect(errors).toEqual([['invalid_key', 'bad-', undefined]]);
  });

  it('não reassina keys removidas e reassina as demais após reconectar', async () => {
    const { url, received, sockets } = await startServer();
    client = new MultiEventsClient(url).connect();
    await once(client, 'connected');

    client.subscribe(['k1', 'k2']);
    client.unsubscribe('k1');
    await new Promise((r) => setTimeout(r, 100));
    received.length = 0;

    const reconnected = once(client, 'connected');
    sockets[0]!.terminate();
    await reconnected;
    await new Promise((r) => setTimeout(r, 100));

    expect(received).toEqual([{ op: 'subscribe', api_keys: ['k2'] }]);
  }, 10_000);
});
