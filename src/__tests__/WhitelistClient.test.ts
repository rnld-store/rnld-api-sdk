import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhitelistClient } from '../WhitelistClient.js';
import { RnldNotFoundError, RnldUnauthorizedError } from '../errors.js';

const BASE_URL = 'https://api.rnld.dev';
const API_KEY = 'test-key';
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

describe('WhitelistClient.divergencia', () => {
  let client: WhitelistClient;

  beforeEach(() => {
    client = new WhitelistClient(API_KEY, GUILD_ID, BASE_URL);
  });

  it('retorna dados da divergência em caso de sucesso', async () => {
    const fetchMock = mockFetch(200, {
      status: true,
      data: {
        divergenceId: 'DIV-WPLP-25749',
        player_id: 'WPLP',
        discord_id: '148073845960605698',
        steamhex: '11000010865fc9a',
        license: '98ab74e6d810075f9f62cad5b1a6605de5621555',
        license2: '838d7baa1e9e4e0742b07f1d1005db0898ac87e3',
        resolved: 0,
        divergence_code: 'DIV-WPLP-25749',
      },
      mensagem: 'Divergência encontrada com sucesso.',
      code: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.divergencia({ code: 'DIV-WPLP-25749' });

    expect(result?.status).toBe(true);
    expect(result?.data.divergenceId).toBe('DIV-WPLP-25749');
    expect(result?.data.player_id).toBe('WPLP');

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(calledUrl);
    expect(parsed.pathname).toBe('/whitelists/divergence');
    expect(parsed.searchParams.get('guild_id')).toBe(GUILD_ID);
    expect(parsed.searchParams.get('code')).toBe('DIV-WPLP-25749');
    expect(init.method).toBe('GET');
  });

  it('retorna null quando divergência não encontrada (404)', async () => {
    vi.stubGlobal('fetch', mockFetch(404, { mensagem: 'Não encontrado' }));

    const result = await client.divergencia({ code: 'DIV-WPLP-25749' });
    expect(result).toBeNull();
  });

  it('lança RnldUnauthorizedError em 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'Acesso negado' }));

    await expect(client.divergencia({ code: 'DIV-WPLP-25749' })).rejects.toBeInstanceOf(
      RnldUnauthorizedError,
    );
  });
});

describe('WhitelistClient.divergenciaFix', () => {
  let client: WhitelistClient;

  beforeEach(() => {
    client = new WhitelistClient(API_KEY, GUILD_ID, BASE_URL);
  });

  it('envia POST para divergencefix com guild_id e divergenceId', async () => {
    const fetchMock = mockFetch(200, {
      status: true,
      mensagem: 'Divergência corrigida com sucesso.',
      code: 200,
      data: {
        divergenceId: 'DIV-WPLP-25749',
        player_id: 'WPLP',
        identities_updated: {
          discord_id: '148073845960605698',
          steamhex: '11000010865fc9a',
          license: '98ab74e6d810075f9f62cad5b1a6605de5621555',
          license2: '838d7baa1e9e4e0742b07f1d1005db0898ac87e3',
        },
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.divergenciaFix({ divergenceId: 'DIV-WPLP-25749' });
    expect(result.status).toBe(true);
    expect(result.data.divergenceId).toBe('DIV-WPLP-25749');
    expect(result.data.identities_updated.discord_id).toBe('148073845960605698');

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(`${BASE_URL}/whitelists/divergencefix`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(
      JSON.stringify({
        guild_id: GUILD_ID,
        divergenceId: 'DIV-WPLP-25749',
      }),
    );
  });

  it('lança RnldUnauthorizedError em 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'Acesso negado' }));

    await expect(client.divergenciaFix({ divergenceId: 'DIV-WPLP-25749' })).rejects.toBeInstanceOf(
      RnldUnauthorizedError,
    );
  });
});

describe('WhitelistClient.deletarToken', () => {
  let client: WhitelistClient;

  beforeEach(() => {
    client = new WhitelistClient(API_KEY, GUILD_ID, BASE_URL);
  });

  it('envia POST com guild_id, wl_id e actorDiscordId quando informado', async () => {
    const fetchMock = mockFetch(200, {
      status: true,
      mensagem: 'Token deletado com sucesso.',
      code: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.deletarToken({
      wl_id: 'WPLP',
      actorDiscordId: '148073845960605698',
    });

    expect(result.status).toBe(true);
    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(`${BASE_URL}/whitelists/tokenclean`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(
      JSON.stringify({
        guild_id: GUILD_ID,
        wl_id: 'WPLP',
        actorDiscordId: '148073845960605698',
      }),
    );
  });

  it('envia POST com actorDiscordId ausente quando não informado', async () => {
    const fetchMock = mockFetch(200, {
      status: true,
      mensagem: 'Token deletado com sucesso.',
      code: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    await client.deletarToken({ wl_id: 'WPLP' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(
      JSON.stringify({
        guild_id: GUILD_ID,
        wl_id: 'WPLP',
        actorDiscordId: undefined,
      }),
    );
  });

  it('lança RnldUnauthorizedError em 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'Acesso negado' }));

    await expect(client.deletarToken({ wl_id: 'WPLP' })).rejects.toBeInstanceOf(
      RnldUnauthorizedError,
    );
  });
});

describe('WhitelistClient.limparHwids', () => {
  let client: WhitelistClient;

  beforeEach(() => {
    client = new WhitelistClient(API_KEY, GUILD_ID, BASE_URL);
  });

  it('envia POST para refresh com guild_id e wl_id', async () => {
    const fetchMock = mockFetch(200, {
      status: true,
      mensagem: 'HWIDs limpos com sucesso.',
      code: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.limparHwids({ wl_id: 'WPLP' });
    expect(result.status).toBe(true);

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(`${BASE_URL}/whitelists/refresh`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(
      JSON.stringify({
        guild_id: GUILD_ID,
        wl_id: 'WPLP',
      }),
    );
  });

  it('lança RnldUnauthorizedError em 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'Acesso negado' }));

    await expect(client.limparHwids({ wl_id: 'WPLP' })).rejects.toBeInstanceOf(
      RnldUnauthorizedError,
    );
  });
});

describe('WhitelistClient.banReason', () => {
  let client: WhitelistClient;

  beforeEach(() => {
    client = new WhitelistClient(API_KEY, GUILD_ID, BASE_URL);
  });

  it('envia PATCH para banreason com guild_id, wl_id e reason', async () => {
    const fetchMock = mockFetch(200, {
      status: true,
      mensagem: 'Motivo atualizado com sucesso.',
      code: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.atualizarMotivoBan({ wl_id: 'WPLP', reason: 'updated reason' });
    expect(result.status).toBe(true);

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(`${BASE_URL}/whitelists/banreason`);
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe(
      JSON.stringify({
        guild_id: GUILD_ID,
        wl_id: 'WPLP',
        reason: 'updated reason',
      }),
    );
  });

  it('lança RnldUnauthorizedError em 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'Acesso negado' }));

    await expect(client.atualizarMotivoBan({ wl_id: 'WPLP', reason: 'updated reason' })).rejects.toBeInstanceOf(
      RnldUnauthorizedError,
    );
  });
});

describe('WhitelistClient.staff / destaff', () => {
  let client: WhitelistClient;

  beforeEach(() => {
    client = new WhitelistClient(API_KEY, GUILD_ID, BASE_URL);
  });

  it('staff envia POST com guild_id, wl_id e discordId quando informado', async () => {
    const fetchMock = mockFetch(200, {
      status: true,
      mensagem: 'Staff adicionado com sucesso.',
      code: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.staff({ wl_id: 'WPLP', discordId: '148073845960605698' });
    expect(result.status).toBe(true);

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(`${BASE_URL}/whitelists/staff`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(
      JSON.stringify({
        guild_id: GUILD_ID,
        wl_id: 'WPLP',
        discordId: '148073845960605698',
      }),
    );
  });

  it('destaff envia DELETE sem discordId', async () => {
    const fetchMock = mockFetch(200, {
      status: true,
      mensagem: 'Staff removido com sucesso.',
      code: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.destaff({ wl_id: 'WPLP' });
    expect(result.status).toBe(true);

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(`${BASE_URL}/whitelists/staff`);
    expect(init.method).toBe('DELETE');
    expect(init.body).toBe(
      JSON.stringify({
        guild_id: GUILD_ID,
        wl_id: 'WPLP',
      }),
    );
  });

  it('staff e destaff lançam RnldUnauthorizedError em 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'Acesso negado' }));
    await expect(client.staff({ wl_id: 'WPLP' })).rejects.toBeInstanceOf(RnldUnauthorizedError);

    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'Acesso negado' }));
    await expect(client.destaff({ wl_id: 'WPLP' })).rejects.toBeInstanceOf(RnldUnauthorizedError);
  });
});

describe('WhitelistClient.tempban', () => {
  let client: WhitelistClient;

  beforeEach(() => {
    client = new WhitelistClient(API_KEY, GUILD_ID, BASE_URL);
  });

  it('envia POST para tempban com guild_id, wl_id, hours e reason', async () => {
    const fetchMock = mockFetch(200, {
      status: true,
      code: 200,
      topic: 'tempban',
      token: 'WPLP',
      expires_at: '2026-05-06T02:17:21.043Z',
      mensagem: 'Usuário banido temporariamente até 06/05/2026, 02:17:21',
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.tempban({
      wl_id: 'WPLP',
      hours: 24,
      reason: 'comportamento inadequado',
    });
    expect(result.status).toBe(true);
    expect(result.topic).toBe('tempban');
    expect(result.token).toBe('WPLP');
    expect(result.expires_at).toBe('2026-05-06T02:17:21.043Z');

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(`${BASE_URL}/whitelists/tempban`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(
      JSON.stringify({
        guild_id: GUILD_ID,
        wl_id: 'WPLP',
        hours: 24,
        reason: 'comportamento inadequado',
      }),
    );
  });

  it('envia POST com reason ausente quando não informado', async () => {
    const fetchMock = mockFetch(200, {
      status: true,
      code: 200,
      topic: 'tempban',
      token: 'WPLP',
      expires_at: '2026-05-06T02:17:21.043Z',
      mensagem: 'Usuário banido temporariamente até 06/05/2026, 02:17:21',
    });
    vi.stubGlobal('fetch', fetchMock);

    await client.tempban({ wl_id: 'WPLP', hours: 24 });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(
      JSON.stringify({
        guild_id: GUILD_ID,
        wl_id: 'WPLP',
        hours: 24,
        reason: undefined,
      }),
    );
  });

  it('lança RnldUnauthorizedError em 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'Acesso negado' }));
    await expect(client.tempban({ wl_id: 'WPLP', hours: 24 })).rejects.toBeInstanceOf(
      RnldUnauthorizedError,
    );
  });
});

describe('WhitelistClient.precadastro', () => {
  let client: WhitelistClient;

  beforeEach(() => {
    client = new WhitelistClient(API_KEY, GUILD_ID, BASE_URL);
  });

  it('envia POST para precadastro com identificador e retorno esperado', async () => {
    const fetchMock = mockFetch(200, {
      status: true,
      mensagem: 'Registro pré-cadastrado com sucesso.',
      code: 200,
      data: {
        wl_id: 'XP9T',
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.precadastro({
      discordId: '148073845960605698',
      isBanned: true,
      reason: 'motivo',
    });
    expect(result.status).toBe(true);
    expect(result.data.wl_id).toBe('XP9T');

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(`${BASE_URL}/whitelists/precadastro`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(
      JSON.stringify({
        guild_id: GUILD_ID,
        discordId: '148073845960605698',
        steam: undefined,
        license: undefined,
        license2: undefined,
        isBanned: true,
        reason: 'motivo',
      }),
    );
  });

  it('aplica isBanned=false por padrão', async () => {
    const fetchMock = mockFetch(200, {
      status: true,
      mensagem: 'Registro pré-cadastrado com sucesso.',
      code: 200,
      data: {
        wl_id: 'XP9T',
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    await client.precadastro({ steam: '11000010865fc9a' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(
      JSON.stringify({
        guild_id: GUILD_ID,
        discordId: undefined,
        steam: '11000010865fc9a',
        license: undefined,
        license2: undefined,
        isBanned: false,
        reason: undefined,
      }),
    );
  });

  it('lança erro local quando nenhum identificador é informado', async () => {
    await expect(client.precadastro({})).rejects.toThrow(
      'É necessário informar ao menos um identificador: discordId, steam, license ou license2.',
    );
  });

  it('lança RnldUnauthorizedError em 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'Acesso negado' }));
    await expect(client.precadastro({ discordId: '148073845960605698' })).rejects.toBeInstanceOf(
      RnldUnauthorizedError,
    );
  });
});

describe('WhitelistClient.atualizaToken', () => {
  let client: WhitelistClient;

  beforeEach(() => {
    client = new WhitelistClient(API_KEY, GUILD_ID, BASE_URL);
  });

  it('envia PATCH com guild_id, wl_id e identificadores informados', async () => {
    const fetchMock = mockFetch(200, {
      status: true,
      mensagem: 'Token atualizado com sucesso.',
      code: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.atualizaToken({
      wl_id: 'WPLP',
      discordId: '148073845960605698',
      license: '98ab74e6d810075f9f62cad5b1a6605de5621555',
    });
    expect(result.status).toBe(true);

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(`${BASE_URL}/whitelists/update`);
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe(
      JSON.stringify({
        guild_id: GUILD_ID,
        wl_id: 'WPLP',
        discordId: '148073845960605698',
        steam: undefined,
        license: '98ab74e6d810075f9f62cad5b1a6605de5621555',
        license2: undefined,
      }),
    );
  });

  it('lança erro local quando nenhum identificador de atualização é informado', async () => {
    await expect(client.atualizaToken({ wl_id: 'WPLP' })).rejects.toThrow(
      'É necessário informar ao menos um identificador para atualizar: discordId, steam, license ou license2.',
    );
  });

  it('lança RnldUnauthorizedError em 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'Acesso negado' }));
    await expect(client.atualizaToken({ wl_id: 'WPLP', steam: '11000010865fc9a' })).rejects.toBeInstanceOf(
      RnldUnauthorizedError,
    );
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

describe('WhitelistClient.msgCommand', () => {
  let client: WhitelistClient;

  beforeEach(() => {
    client = new WhitelistClient(API_KEY, GUILD_ID, BASE_URL);
  });

  it('envia POST para /msg/command com guild_id, topic e payload dinâmico', async () => {
    const fetchMock = mockFetch(200, {
      code: 200,
      result: {
        ok: true,
        id: 123,
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.msgCommand({
      topic: 'alert',
      foo: 'bar',
      retries: 3,
    });

    expect(result.code).toBe(200);
    expect(result.result).toMatchObject({ ok: true, id: 123 });

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(`${BASE_URL}/msg/command`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(
      JSON.stringify({
        guild_id: GUILD_ID,
        topic: 'alert',
        foo: 'bar',
        retries: 3,
      }),
    );
  });

  it('lança RnldUnauthorizedError em 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { mensagem: 'Acesso negado' }));
    await expect(client.msgCommand({ topic: 'alert' })).rejects.toBeInstanceOf(
      RnldUnauthorizedError,
    );
  });
});
