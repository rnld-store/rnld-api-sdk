# @ronaldmiranda/api-sdk

SDK oficial para integração com a **RNLD API** — permite que criadores de bots Discord consultem e gerenciem whitelists de servidores FiveM.

## Instalação

```bash
npm install @ronaldmiranda/api-sdk
```

## Início rápido

```ts
import { RnldClient } from '@ronaldmiranda/api-sdk';

const client = new RnldClient({
  apiKey: 'SUA_API_KEY',
  guildId: 'ID_DA_GUILD',
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

### `whitelist.ban(params)` — banir jogador

Bane um jogador. `reason` é opcional.

```ts
const resultado = await client.whitelist.ban({
  wl_id: 'TOKEN_DO_JOGADOR',
  reason: 'Uso de cheats', // opcional
});

console.log(resultado.status);   // true | false
console.log(resultado.mensagem);
```

| Campo    | Tipo   | Obrigatório | Descrição          |
|----------|--------|-------------|--------------------|
| `wl_id`  | string | sim         | Token do jogador   |
| `reason` | string | não         | Motivo do banimento |

---

### `whitelist.desban(params)` — desbanir jogador

Remove o banimento de um jogador.

```ts
const resultado = await client.whitelist.desban({ wl_id: 'TOKEN_DO_JOGADOR' });

console.log(resultado.status);   // true | false
console.log(resultado.mensagem);
```

---

## Tratamento de erros

```ts
import { RnldApiError, RnldNotFoundError, RnldUnauthorizedError } from '@ronaldmiranda/api-sdk';

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
> Os demais métodos (`liberar`, `remover`, `ban`, `desban`) **lançam** o erro normalmente.

---

## Configuração

| Opção        | Tipo   | Obrigatório | Descrição                                                       |
|--------------|--------|-------------|------------------------------------------------------------------|
| `apiKey`  | string | sim | API Key do servidor (header `x-api-key`) |
| `guildId` | string | sim | ID da guild Discord                      |

## Exemplo — bot Discord

Veja um bot completo com `discord.js` em [`example/bot.js`](./example/bot.js).

```bash
cd example
cp .env.example .env   # preencha as variáveis
npm install
npm start
```

Comandos registrados automaticamente na guild:

| Comando | Descrição |
|---|---|
| `/wl-status` | Consulta whitelist por `discord_id` ou `wl_id` |
| `/wl-liberar` | Libera a whitelist de um jogador |
| `/wl-remover` | Remove a whitelist de um jogador |
| `/wl-ban` | Bane um jogador (motivo opcional) |
| `/wl-desban` | Desbane um jogador |

## Build

```bash
npm run build
```
