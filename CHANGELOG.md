# Changelog

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
