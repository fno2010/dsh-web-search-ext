# Changelog

All notable changes to this project are documented in this file.

## [0.3.1] - 2026-08-30

### Added

- **`web_search` toolview card on the Web**: the `web_search` row in a conversation takes over the host's built-in web card and adds the provenance receipt line, tone-coded per-source verification badges (`alive`, `verified`, `dead 404`, …), the truncation notice, and a per-result drill-down (click a source to see its serving backend, freshness, and verification state). When the web seam is not pinned to this provider the row degrades gracefully (no receipt line claimed, no badges invented, no backend claimed) instead of mislabeling someone else's results.
- **In-flight search indicator**: while a search is running the toolview row shows a sweep animation plus a client-ticked elapsed label; neither the phase nor the serving backend is claimed until the result settles.
- **Session Health tab on the Web**: the settings card's Health tab shows session telemetry served by the host's `GET /web-search-ext/health` — uptime, per-backend success/failure counts, last-call timing, active 429 cooldowns, and session search/fetch counts. The payload is counters and closed codes only (no credentials, URLs, or query text), and the tab shows an explicit unavailable state with a retry when the route is not mounted.
- **First-install connectivity probe**: the Health tab's Connectivity section probes Exa (keyed REST or anonymous MCP) and Firecrawl (keyed or keyless) — automatically once when the tab first opens with no stored result, and at will via "Test now". The host runs the probe on demand at `POST /web-search-ext/probe` and never at apply time, so installs, host restarts, and CI make zero vendor calls; the payload carries plan literals and closed codes only (no vendor messages, URLs, or keys).
- **`/search-engine` slash command**: switch the preferred backend, see live status (key source, last-call outcome, active 429 cooldown), and run the connectivity test — straight from the composer's `/` menu, in the host's popup shell. If `/search-engine` is already taken the command registers under `/web-search-engine` instead, and the settings card says which name materialized (or that neither was available) — the fallback is surfaced, never silent.
- **Verification-tier selector in the settings card**: the card now exposes `verifyLevel` (`off` / `liveness` / `content`) as a labeled select. A saved tier applies from the next `web_search`/`web_fetch` onward — no restart; the host resolves the settings document live per call. A hand-edited `settings.yaml` with an unrecognized tier shows the schema default instead of a dead option, and saving writes the schema-valid value back.
- **Context budget**: `numResults` is now a hard cap on `web_search` output — a caller's larger `maxResults` is clamped before any backend runs, vendor over-delivery is clamped before verification (so L0/L1 never probes a URL that will not be returned), and the receipt reports the cap with the structured `truncated` flag.

### Fixed

- **`web_fetch` available on live hosts**: 0.3.0 pinned this plugin as the web seam's fetch provider, but no composition path registered the model-facing `web_fetch` tool (preset layers ship `fetch: false` and `dsh web` disables the profile-layer `tool-web` row), so live hosts returned `unknown tool "web_fetch"`. The plugin now registers the stock `web_fetch` tool at apply time when the preset layer left it unregistered — same schema, prompt section, and presentation as the harness stock tool, dedup-guarded, with execution routed through the SSRF-guarded `ctx.web.fetch`.
- **L1 byte cap**: when a fetched chunk crossed `contentCheckBytes`, the entire chunk was dropped while `length` still counted the dropped bytes, so `contentCheckMinBytes` could gate on bytes that were never kept. The crossing chunk's fitting prefix is now retained (decoded-character cap, matching the existing slice model).

### Changed

- Attribution user-agent bumped to `dsh-web-search-ext/0.3.1`.

## [0.3.0] - 2026-08-26

### Added

- **Keyless `web_fetch`**: a new fetch provider is registered as the web seam's `fetchProvider`, so `web_fetch` works without any API key. It scrapes through Firecrawl (`POST {base}/scrape`; keyless requests allowed by default) and fails over to Exa's anonymous hosted MCP `web_fetch_exa` when Firecrawl is unavailable or rate-limited. Output is capped by `fetchMaxChars` (default 50 000) with `truncated` set when the cap bites. The bundle patch now pins `web.fetchProvider: web-search-ext` alongside `web.searchProvider`.
- **Result verification (L0 liveness, on by default)**: every returned source is probed locally (HEAD first, GET on 405/501; redirects are followed manually — at most 3 hops, each hop re-validated against the SSRF guard before being followed) before the result is returned; each snippet gains a status marker — `[alive]`, `[dead 404]`, `[blocked]`, `[timeout]`, `[unreachable]`, `[skipped]` — and no result is ever dropped. Verification is purely local HTTP: no vendor quota, no keys.
- **L1 content check (experimental, opt-in via `verifyLevel: "content"`)**: fetches the first `contentCheckBytes` of each page (body read bounded by `contentCheckTimeoutMs`) and checks that the snippet's leading words still appear; markers `[verified]` / `[verified·changed]` plus a word-match ratio. Sources with no snippet get `[unverified]` (page live, content not checked) and are counted separately in the receipt. `unsafe`/`forbidden` outcomes mark `[blocked]`.
- **Provenance receipt**: `web_search` results now carry a one-line receipt at the top of `content` — e.g. `web-search-ext: exa-mcp · 1.2s · 5 results · liveness: 5 alive · freshness 24h not honored (keyless exa has no date filter)` — naming the backend that actually served the result and surfacing every limitation instead of hiding it.
- **Freshness window**: `freshness` setting (`any` | `24h` | `7d` | `30d`) is sent on the wire where the backend supports it (Exa REST `startPublishedDate`, Firecrawl `tbs: qdr:d|w|m`). The keyless Exa MCP path has no date filter, so the receipt says so explicitly instead of silently ignoring the request.
- **429 diagnostics**: a rate-limited backend's reported retry window is parsed from the standard `Retry-After` header (delta-seconds or HTTP-date) and/or structured response-body fields (`retry_after_seconds`, as number or string) and reported in human-readable form ("retry in ~22.1h"); it becomes that backend's cooldown (clamped by `maxCooldownSec`, default 24 h), and the error names the unlock path (set the corresponding API key).
- New config fields (all optional, all defaulted): `verifyLevel`, `livenessTimeoutMs`, `contentCheckBytes`, `contentCheckMinBytes`, `contentCheckMatchWords`, `contentCheckTimeoutMs`, `freshness`, `maxCooldownSec`, `fetchMaxChars`.
- Test suite grew from 10 to 39 mocked scenarios: L0/L1 markers, receipt shape, HEAD-405/501 fallback, verify-off zero-traffic, 429 retry-after (delta-seconds and HTTP-date headers, body fields, string values, clamp) + cooldown, freshness on the wire, fetch failover (429 and non-429), 404-as-result, SSRF guard matrix (IPv6/127-8/FQDN spellings incl. multi-dot), redirect re-validation, L0 status mapping, L1 deadlines (slow-drip, stalled mid-read, unstreamed text) + snippet-less `[unverified]`, abort during verification, dual-429, truncation, keyless-only plans.
- `ROADMAP.md`: version plan and per-version deliverables for 0.3.0+.

### Changed

- Fetch-side SSRF guard: explicit URL fetches refuse non-http(s) schemes and loopback/private/link-local targets before any network traffic.
- SSRF guard hardened (both the verification probes and `web_fetch`): IPv6 loopback/link-local/unique-local literals (including IPv4-mapped forms such as `[::ffff:127.0.0.1]`), the entire `127.0.0.0/8` loopback range, trailing-dot hostnames (`localhost.`), CGNAT and multicast ranges are all refused; addresses that cannot be confidently classified as public are refused (fail closed).
- Firecrawl scrape requests now explicitly ask for both `markdown` and `html` formats, so the "scraped 404 is a result" path still works when markdown comes back empty.
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
