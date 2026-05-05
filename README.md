# rnld-api-sdk

SDK oficial para integração com a **RNLD API** — permite que criadores de bots Discord consultem e gerenciem whitelists de servidores FiveM.

## Instalação

```bash
npm install rnld-api-sdk
```

## Início rápido

```ts
import { RnldClient } from 'rnld-api-sdk';

const client = new RnldClient({
  apiKey: 'SUA_API_KEY',
  guildId: 'ID_DA_GUILD',
  baseUrl: 'https://api.seuservidor.com',
  // querierUrl é opcional; se omitido usa o mesmo baseUrl
  // querierUrl: 'https://querier.seuservidor.com',
});
```

## Rotas disponíveis

### `whitelist.query(params)` — consultar jogador

Consulta o status de whitelist de um jogador. Retorna `null` se não encontrado.

```ts
const player = await client.whitelist.query({ discordId: '123456789012345678' });

if (!player) {
  console.log('Jogador não encontrado');
} else {
  console.log(player.isStaff);      // boolean
  console.log(player.isBanned);     // boolean
  console.log(player.banReason);    // string
  console.log(player.identities);   // { wl_id, discord_id, steamHex, license, ... }
}
```

Parâmetros (ao menos um obrigatório):

| Campo       | Tipo   | Descrição                    |
|-------------|--------|------------------------------|
| `wl_id`     | string | Token amigável do jogador    |
| `discordId` | string | Discord ID                   |
| `steam`     | string | Steam Hex                    |
| `license`   | string | License principal (Rockstar) |
| `license2`  | string | License secundária           |

---

### `whitelist.liberar(params)` — liberar jogador

Adiciona o jogador à whitelist.

```ts
const resultado = await client.whitelist.liberar({
  wl_id: 'TOKEN_DO_JOGADOR',
  discordId: '123456789012345678', // opcional
});

console.log(resultado.status);   // true | false
console.log(resultado.mensagem); // descrição do resultado
```

---

### `whitelist.remover(params)` — remover whitelist

Remove a whitelist de um jogador.

```ts
const resultado = await client.whitelist.remover({ wl_id: 'TOKEN_DO_JOGADOR' });
```

---

## Tratamento de erros

```ts
import { RnldApiError, RnldNotFoundError, RnldUnauthorizedError } from 'rnld-api-sdk';

try {
  await client.whitelist.liberar({ wl_id: 'TOKEN' });
} catch (err) {
  if (err instanceof RnldUnauthorizedError) {
    // API Key inválida ou guild_id incorreto
  } else if (err instanceof RnldNotFoundError) {
    // Jogador não existe
  } else if (err instanceof RnldApiError) {
    console.error(err.statusCode, err.message, err.body);
  }
}
```

> **Nota:** `whitelist.query()` **não lança** `RnldNotFoundError` — retorna `null` em caso de 404.
> Os métodos `liberar()` e `remover()` **lançam** o erro normalmente.

---

## Configuração

| Opção        | Tipo   | Obrigatório | Descrição                                                       |
|--------------|--------|-------------|------------------------------------------------------------------|
| `apiKey`     | string | sim         | API Key do servidor (header `x-api-key`)                        |
| `guildId`    | string | sim         | ID da guild Discord                                              |
| `baseUrl`    | string | sim         | URL base da RNLD API principal                                   |
| `querierUrl` | string | não         | URL do serviço de queries; usa `baseUrl` se não informado        |

## Build

```bash
npm run build
```
