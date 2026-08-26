# Changelog

All notable changes to this project are documented in this file.

## [0.3.0] - 2026-08-26

### Added

- **Keyless `web_fetch`**: a new fetch provider is registered as the web seam's `fetchProvider`, so `web_fetch` works without any API key. It scrapes through Firecrawl (`POST {base}/scrape`; keyless requests allowed by default) and fails over to Exa's anonymous hosted MCP `web_fetch_exa` when Firecrawl is unavailable or rate-limited. Output is capped by `fetchMaxChars` (default 50 000) with `truncated` set when the cap bites. The bundle patch now pins `web.fetchProvider: web-search-ext` alongside `web.searchProvider`.
- **Result verification (L0 liveness, on by default)**: every returned source is probed locally (HEAD first, GET on 405/501) before the result is returned; each snippet gains a status marker — `[alive]`, `[dead 404]`, `[blocked]`, `[timeout]`, `[unreachable]`, `[skipped]` — and no result is ever dropped. Verification is purely local HTTP: no vendor quota, no keys.
- **L1 content check (experimental, opt-in via `verifyLevel: "content"`)**: fetches the first `contentCheckBytes` of each page and checks that the snippet's leading words still appear; markers `[verified]` / `[verified·changed]` plus a word-match ratio. `unsafe`/`forbidden` outcomes mark `[blocked]`.
- **Provenance receipt**: `web_search` results now carry a one-line receipt at the top of `content` — e.g. `web-search-ext: exa-mcp · 1.2s · 5 results · liveness: 5 alive · freshness 24h not honored (keyless exa has no date filter)` — naming the backend that actually served the result and surfacing every limitation instead of hiding it.
- **Freshness window**: `freshness` setting (`any` | `24h` | `7d` | `30d`) is sent on the wire where the backend supports it (Exa REST `startPublishedDate`, Firecrawl `tbs: qdr:d|w|m`). The keyless Exa MCP path has no date filter, so the receipt says so explicitly instead of silently ignoring the request.
- **429 diagnostics**: a rate-limited backend's own `retry_after_seconds` / `Retry-After` is parsed and reported in human-readable form ("retry in ~22.1h"), used as that backend's cooldown (clamped by `maxCooldownSec`, default 24 h), and the error names the unlock path (set the corresponding API key).
- New config fields (all optional, all defaulted): `verifyLevel`, `livenessTimeoutMs`, `contentCheckBytes`, `contentCheckMinBytes`, `contentCheckMatchWords`, `contentCheckTimeoutMs`, `freshness`, `maxCooldownSec`, `fetchMaxChars`.
- Test suite grew from 10 to 25 mocked scenarios: L0/L1 markers, receipt shape, HEAD-405 fallback, verify-off zero-traffic, 429 retry-after + cooldown, freshness on the wire, fetch failover, 404-as-result, fetch SSRF guard, dual-429, truncation, keyless-only plans.
- `ROADMAP.md`: version plan and per-version deliverables for 0.3.0+.

### Changed

- Fetch-side SSRF guard: explicit URL fetches refuse non-http(s) schemes and loopback/private/link-local targets before any network traffic.
- 429 handling unified across all three backends (Exa REST, Exa MCP, Firecrawl): one `WEB_RATE_LIMIT` error shape with `retryAfterSec`.
- Attribution user-agent bumped to `dsh-web-search-ext/0.3.0`.

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
