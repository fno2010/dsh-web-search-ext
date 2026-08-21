# Changelog

All notable changes to this project are documented in this file.

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
