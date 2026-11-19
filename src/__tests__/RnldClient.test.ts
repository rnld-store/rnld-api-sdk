import { describe, it, expect, vi, afterEach } from 'vitest';
import { RnldClient, resolveBaseUrl, BASE_URL_V1, BASE_URL_V2 } from '../RnldClient.js';

describe('resolveBaseUrl', () => {
  it('usa a v1 por padrão', () => {
    expect(resolveBaseUrl({})).toBe(BASE_URL_V1);
    expect(resolveBaseUrl({ v2: false })).toBe(BASE_URL_V1);
  });
  it('usa a v2 com a flag', () => {
    expect(resolveBaseUrl({ v2: true })).toBe(BASE_URL_V2);
  });
  it('baseUrl tem precedência e perde a barra final', () => {
    expect(resolveBaseUrl({ v2: true, baseUrl: 'http://localhost:3001/' })).toBe('http://localhost:3001');
  });
});

describe('RnldClient v2', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('envia as chamadas para api-v2', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ status: true }) });
    vi.stubGlobal('fetch', f);
    const c = new RnldClient({ apiKey: 'k', guildId: 'g', v2: true });
    await c.whitelist.ban({ wl_id: 'ABC' });
    expect(f.mock.calls[0][0]).toBe('https://api-v2.rnld.dev/whitelists/ban');
  });
});
