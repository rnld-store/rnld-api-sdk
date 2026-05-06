import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get, patch } from '../http.js';
import { RnldApiError, RnldNotFoundError, RnldUnauthorizedError } from '../errors.js';

const API_KEY = 'test-key';

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('http.get', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('serializa query params e envia headers esperados', async () => {
    const fetchMock = mockFetch(200, { status: true });
    vi.stubGlobal('fetch', fetchMock);

    const result = await get<{ status: boolean }>('https://api.rnld.dev/whitelists/query', API_KEY, {
      guild_id: '123',
      wl_id: 'WPLP',
      page: 2,
      active: true,
      ignoredNull: null,
      ignoredUndefined: undefined,
    });

    expect(result.status).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(calledUrl);

    expect(parsed.pathname).toBe('/whitelists/query');
    expect(parsed.searchParams.get('guild_id')).toBe('123');
    expect(parsed.searchParams.get('wl_id')).toBe('WPLP');
    expect(parsed.searchParams.get('page')).toBe('2');
    expect(parsed.searchParams.get('active')).toBe('true');
    expect(parsed.searchParams.get('ignoredNull')).toBeNull();
    expect(parsed.searchParams.get('ignoredUndefined')).toBeNull();

    expect(init.method).toBe('GET');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    });
  });
});

describe('http.patch', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('envia método PATCH com body JSON e headers esperados', async () => {
    const fetchMock = mockFetch(200, { status: true });
    vi.stubGlobal('fetch', fetchMock);

    const payload = { guild_id: '123', wl_id: 'WPLP' };
    const result = await patch<{ status: boolean }>(
      'https://api.rnld.dev/whitelists/liberar',
      API_KEY,
      payload,
    );

    expect(result.status).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('https://api.rnld.dev/whitelists/liberar');
    expect(init.method).toBe('PATCH');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    });
    expect(init.body).toBe(JSON.stringify(payload));
  });

  it('propaga RnldUnauthorizedError para 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'Acesso negado' }));

    await expect(
      patch('https://api.rnld.dev/whitelists/liberar', API_KEY, { guild_id: '123' }),
    ).rejects.toBeInstanceOf(RnldUnauthorizedError);
  });

  it('propaga RnldNotFoundError para 404', async () => {
    vi.stubGlobal('fetch', mockFetch(404, { mensagem: 'Não encontrado' }));

    await expect(
      patch('https://api.rnld.dev/whitelists/liberar', API_KEY, { guild_id: '123' }),
    ).rejects.toBeInstanceOf(RnldNotFoundError);
  });

  it('propaga RnldApiError em JSON inválido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('invalid json')),
      }),
    );

    await expect(
      patch('https://api.rnld.dev/whitelists/liberar', API_KEY, { guild_id: '123' }),
    ).rejects.toBeInstanceOf(RnldApiError);
  });
});
