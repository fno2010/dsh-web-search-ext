# Changelog

All notable changes to this project are documented in this file.

## [0.2.0] - 2026-08-22

### Added

- **Settings card on the Web** (Settings → Plugins → Plugin configuration): edit the five config fields (`preferred`, `numResults`, `maxSnippetChars`, `rateLimitCooldownSec`, `firecrawlKeyless`) with live save/discard, and manage both API keys.
- API-key state is **auto-discovered** from the credentials layers (live process env → `~/.dsh/.credentials.yaml` → `.env` files), refreshes on `credentials/reference-updated` (file edits update the badges live, no restart), and renders **read-only** when the live process environment supplies the key — the host rejects UI writes that an environment value would shadow.
- Card chrome mirrors the host's `PluginCard` design language (shared design tokens, host chevron/loading icons, tsdown CSS-module injection); EN + ZH copy.
- The client bundle registers under both install-form entry names (the scoped npm key and the unscoped link-install key), so the card loads whether the plugin was added from npm or via a local `link:` install.
- `docs/settings-ui-plan.md`: the researched implementation plan (extension-point verdict, wire API, risks).

### Changed

- Attribution user-agent bumped to match the package version.

## [0.1.2] - 2026-08-21

### Fixed

- Corrected the README (EN + ZH) claim about where the Exa/Firecrawl keys are configured: the Web "Models" page manages **LLM provider** credentials only and has no field for `EXA_API_KEY` / `FIRECRAWL_API_KEY`. The docs now name the real channels (settings literal, the credentials file, launch env var) and point to the tracked settings-UI feature request.

### Changed

- Attribution user-agent bumped to match the package version.

## [0.1.1] - 2026-08-21

### Added

- `repository` metadata so the npm package links back to this repo (plugin-marketplace npm linkage and download counts).

### Changed

- Attribution user-agent now carries the package version.

## [0.1.0] - 2026-08-21

### Added

- Initial release.
- Multi-backend `web_search` provider registered into the DSH web seam (`ctx.web`) under provider id `web-search-ext`.
- **Exa backend**: REST search with key; anonymous hosted MCP endpoint without a key.
- **Firecrawl backend**: v2 search API (keyed or keyless), with v1 envelope compatibility.
- Preferred-backend ordering with automatic failover on any backend failure.
- Per-backend 429 cooldown (default 60 s) with skipped-backend reporting in combined failures.
- Key resolution chain per backend: settings literal → credentials service → launch environment variable.
- Bundle patch wiring the provider into the built-in `web_search` tool (`web.searchProvider`).
- Test suite: 10 mocked failover/mapping scenarios + 3 live keyless smoke tests (skipped in CI).
