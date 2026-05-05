import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhitelistClient } from '../WhitelistClient.js';
import { RnldNotFoundError, RnldUnauthorizedError } from '../errors.js';

const BASE_URL = 'https://api.rnld.dev';
const API_KEY  = 'test-key';
const GUILD_ID = '123456789';

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

const queryFixture = {
  isStaff: false,
  isBanned: false,
  banReason: 'N/A',
  banExpiresAt: null,
  banHistory: [],
  last_ip: '127.0.0.1',
  identities: {
    guild_id: GUILD_ID,
    discord_id: '111',
    steamHex: '',
    license: '',
    license2: '',
    fivem: '',
    live: '',
    whitelisted: 1,
    id: 'WPLP',
    wl_id: 'WPLP',
  },
  code: 200,
  mensagem: 'OK',
};

describe('WhitelistClient.query', () => {
  let client: WhitelistClient;

  beforeEach(() => {
    client = new WhitelistClient(API_KEY, GUILD_ID, BASE_URL);
  });

  it('retorna dados do jogador em caso de sucesso', async () => {
    vi.stubGlobal('fetch', mockFetch(200, queryFixture));

    const result = await client.query({ discordId: '111' });
    expect(result).toMatchObject({ isStaff: false, isBanned: false });
    expect(result?.identities.wl_id).toBe('WPLP');
  });

  it('retorna null quando jogador não encontrado (404)', async () => {
    vi.stubGlobal('fetch', mockFetch(404, { mensagem: 'Não encontrado' }));

    const result = await client.query({ discordId: '999' });
    expect(result).toBeNull();
  });

  it('lança RnldUnauthorizedError em 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'Acesso negado' }));

    await expect(client.query({ discordId: '111' })).rejects.toBeInstanceOf(RnldUnauthorizedError);
  });
});

describe('WhitelistClient.liberar', () => {
  let client: WhitelistClient;

  beforeEach(() => {
    client = new WhitelistClient(API_KEY, GUILD_ID, BASE_URL);
  });

  it('retorna status true em caso de sucesso', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { status: true, mensagem: 'Whitelist liberada.' }));

    const result = await client.liberar({ wl_id: 'WPLP' });
    expect(result.status).toBe(true);
  });

  it('lança RnldUnauthorizedError em 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'API Key inválida' }));

    await expect(client.liberar({ wl_id: 'WPLP' })).rejects.toBeInstanceOf(RnldUnauthorizedError);
  });
});

describe('WhitelistClient.ban / desban', () => {
  let client: WhitelistClient;

  beforeEach(() => {
    client = new WhitelistClient(API_KEY, GUILD_ID, BASE_URL);
  });

  it('ban retorna status true', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { status: true, mensagem: 'Jogador banido.' }));

    const result = await client.ban({ wl_id: 'WPLP', reason: 'cheats' });
    expect(result.status).toBe(true);
  });

  it('desban retorna status true', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { status: true, mensagem: 'Jogador desbanido.' }));

    const result = await client.desban({ wl_id: 'WPLP' });
    expect(result.status).toBe(true);
  });
});
