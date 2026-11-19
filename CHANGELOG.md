# Changelog

## [1.10.0] - 2026-11-18
### Added
- Flag `v2: true` em `RnldClient` para usar a API v2 (`https://api-v2.rnld.dev`); o padrão continua a v1 (`https://api.rnld.dev`). O contrato das rotas é o mesmo.
- Opção `baseUrl` para apontar para uma URL customizada (precedência sobre `v2`) e helper `resolveBaseUrl`, com as constantes `BASE_URL_V1`/`BASE_URL_V2`.
### Notes
- Na v2, `whitelist.atualizaToken()`/`divergenciaFix()` lançam `RnldConflictError` (409) quando o identificador pertence a outro jogador, e `deletarToken`/resets de staff podem responder 400 (`RnldApiError`) se o jogador estiver banido em alguma guild.

## [1.9.0] - 2026-11-11
### Added
- `RnldConflictError` (409) lançado por `whitelist.divergenciaFix()` quando um identificador da divergência já pertence a outro token da guild; expõe `conflictingTokens` e `conflicts` (`{ kind, value, token }`). Requer `rnld-api` com a checagem de conflito em `/whitelists/divergencefix`.

## [1.8.0] - 2026-11-02
### Added
- `MultiEventsClient`: tratamento dos close codes do `rnld-bots-websocket` em `/ws/multi`, exportados como `CLOSE_NO_SUBSCRIPTIONS` (4001) e `CLOSE_TOO_MANY_INVALID_KEYS` (4002).
  - 4001 (conexão sem nenhuma guild assinada): sem keys, a reconexão fica suspensa até o próximo `subscribe()`; com keys, reconecta normalmente.
  - 4002 (excesso de keys inválidas): emite `subscribeError` com `too_many_invalid_keys` e reconecta com backoff.
- `subscribeError` pode trazer `unavailable` (banco do servidor indisponível).
### Changed
- `EventsClient`: hook protegido `shouldReconnect(code, reason)` para subclasses decidirem a reconexão a partir do close code.

## [1.7.0] - 2026-11-01
### Added
- `MultiEventsClient` — uma única conexão WebSocket (`/ws/multi`) para várias guilds: `subscribe(apiKeys)` / `unsubscribe(apiKeys)` (lotes de 100), reassinatura automática após reconexão e eventos `subscribed` / `unsubscribed` / `subscribeError`. Os demais eventos são os mesmos do `EventsClient` e já trazem `guild_id`. Requer `rnld-bots-websocket` com o endpoint `/ws/multi`.
### Changed
- `EventsClient`: reconexão com jitter (50–100% do delay) para evitar reconexões sincronizadas após queda do servidor.

## [1.6.0] - 2026-10-24
### Added
- Evento `guild_wipe` (wipe de uma guild via `POST /mngr/wipeguild`) com `players_removed`, `total_removed` e `deleted` por tabela; tipo `GuildWipeEvent`

## [1.5.0] - 2026-10-21
### Added
- Evento `unban_bulk` (desbanimento em massa, em chunks por `batch_id`) e tipos `UnbanBulkEvent`/`UnbanBulkPlayer`

## [1.4.4] - 2026-06-19
### Added
- `whitelist.listarStaffIds()` — lista todos os discord_ids com condição de staff
- `whitelist.listarStaff(params?)` — informações de staff paginadas (`page`/`limit`)
- `whitelist.condicaoStaff(params)` — condição de staff de um único discord_id
- Tipos: `StaffMember`, `StaffIdsResponse`, `StaffListParams`, `StaffPagination`, `StaffListResponse`, `StaffConditionParams`, `StaffConditionData`, `StaffConditionResponse`

## [1.1.1] - 2026-05-05
### Fixed
- Documentação atualizada com ban/desban

## [1.1.0] - 2026-05-05
### Added
- `whitelist.ban()` — banir jogador
- `whitelist.desban()` — desbanir jogador
- Comandos `/wl-ban` e `/wl-desban` no bot de exemplo

## [1.0.0] - 2026-05-05
### Added
- `whitelist.query()` — consultar status de whitelist
- `whitelist.liberar()` — liberar jogador
- `whitelist.remover()` — remover whitelist
- Bot de exemplo com discord.js
