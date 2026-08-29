# dsh-web-search-ext

English | [中文](README.zh.md)

![CI](https://github.com/fno2010/dsh-web-search-ext/actions/workflows/ci.yml/badge.svg)
![npm version](https://img.shields.io/npm/v/@fno2010/dsh-web-search-ext)
![npm downloads](https://img.shields.io/npm/dm/@fno2010/dsh-web-search-ext)
![license](https://img.shields.io/badge/license-MIT-blue.svg)
![node](https://img.shields.io/badge/node-%E2%89%A522-brightgreen)

Multi-backend `web_search` **and** `web_fetch` provider for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH). **Works with no API keys at all**; add keys to unlock higher limits. Registered into the web capability seam (`ctx.web`) under one stable provider id (`web-search-ext`).

## Why

The built-in `web_search` tool is backend-pluggable; the in-box default provider (`deepseek-official`) requires a DeepSeek API key. This plugin is a key-free-capable alternative: it works out of the box via Exa's anonymous MCP endpoint, and **fails over automatically** when one backend saturates. It also registers a keyless `web_fetch` provider, and verifies what it hands to the model (dead links, changed pages, which backend actually answered — all visible in the result).

## Features

- **Two backends today**: Exa (REST with key, anonymous hosted MCP without) and Firecrawl (v2 search + scrape API, keyed or keyless)
- **Keyless `web_fetch`**: fetch a URL through Firecrawl scrape, falling back to Exa's anonymous MCP `web_fetch_exa`; no API key required, output capped by `fetchMaxChars`
- **Automatic failover**: on any backend failure (429, 401/402/403, 5xx, network, malformed body) the search — and the fetch — falls through to the next backend in order
- **Per-backend 429 cooldown**: a saturated backend is skipped on subsequent calls; the cooldown honors the window the backend itself reports (`Retry-After` header or `retry_after_seconds` in the body), clamped by `maxCooldownSec`; when all backends fail, the error lists every failure including cooldown state
- **Result verification** (L0 liveness, on by default): every returned source is probed locally and each snippet tagged `[alive]` / `[dead 404]` / `[blocked]` / `[timeout]` / `[unreachable]` / `[skipped]` — no result is ever dropped; experimental L1 content check via `verifyLevel: "content"` adds `[verified]` / `[verified·changed]` / `[unverified]` (page live but no snippet to compare)
- **Provenance receipt**: `web_search` results carry a one-line receipt (`web-search-ext: <backend> · <elapsed>s · <n> results · liveness: …`), naming the backend that actually served the result and surfacing limitations (e.g. keyless Exa cannot honor a freshness window) instead of hiding them
- **Freshness window**: `freshness: 24h | 7d | 30d` is sent on the wire where the backend supports it (Exa `startPublishedDate`, Firecrawl `tbs`); the keyless Exa MCP path says so in the receipt
- **Optional keys** with per-backend precedence: settings literal → credentials service → launch environment variable
- **Settings card on the Web**: Settings → Plugins → Plugin configuration exposes the five core config fields and both API keys, with key state auto-discovered from the credentials layers (the 0.3.0 verification/freshness fields are `settings.yaml`-only for now; the card gains them in 0.3.1)
- **`web_search` toolview card on the Web**: the `web_search` row in a conversation takes over the host's built-in web card and adds the provenance receipt line, tone-coded per-source verification badges (`alive`, `verified`, `dead 404`, …), the truncation notice, and a per-result drill-down (click a source to see its serving backend, freshness, and verification state); when the web seam is not pinned to this provider it degrades gracefully (no receipt line claimed, no badges invented, no backend claimed) instead of mislabeling someone else's results
- **No install-time scripts**: plain ESM JavaScript, no build step, no `postinstall`/`prepare`
- **Extensible**: adding a backend is one search function + one plan entry + config fields — see [CONTRIBUTING](CONTRIBUTING.md)

## Backends

| Backend | Search | Fetch |
|---|---|---|
| **Exa** | With key: REST `POST https://api.exa.ai/search` (higher limits, highlight snippets). Without: anonymous hosted MCP `POST https://mcp.exa.ai/mcp` (JSON-RPC 2.0, documented public fallback, rate-limited → HTTP 429) | Keyless: hosted MCP `web_fetch_exa` tool (fallback path) |
| **Firecrawl** | `POST https://api.firecrawl.dev/v2/search` (Bearer with key; keyless requests when `firecrawlKeyless: true` — unofficial, may be rate-limited or removed) | `POST {base}/scrape` (keyed or keyless; preferred fetch path — markdown + metadata) |

## Install

```sh
dsh plugin --profile web add @fno2010/dsh-web-search-ext
# or from a local checkout:
dsh plugin --profile web add ./path/to/dsh-web-search-ext
```

Installing a plugin requires restarting the running `dsh web` process (the profile bundle list is resolved at boot). Config changes afterwards are hot — no restart.

The bundle patch selects this provider for the `web_search` tool (`web.searchProvider: web-search-ext`) and for `web_fetch` (`web.fetchProvider: web-search-ext`). The official `deepseek-official` provider stays registered but unused; the explicit selection also prevents `WEB_PROVIDER_AMBIGUOUS`.

The plugin also makes the model-facing `web_fetch` tool available out of the box. The stock tool is normally registered by the agent-preset layer (`tool-web`), but every shipped preset ships that row with `fetch: false`, and the `dsh web` profile additionally disables the profile-layer `tool-web` row — so no stock composition registers `web_fetch`, and the model gets `unknown tool "web_fetch"` even with a working fetch provider installed. This plugin closes the gap at apply time: when `web_fetch` is not already registered, it registers the stock tool by reusing `@deepseek-ai/dsh-tool-web`'s own `applyWebFetchTool` (same schema, prompt, and presentation as the harness). The tool's execution routes through `ctx.web.fetch` — the seam pinned to this provider — whose fetch path is guarded by a fail-closed SSRF check (public http(s) targets only; the base's reason for disabling the tool). A preset that enables `tool-web.fetch` registers its own agent-scoped tool, which takes precedence; if the tool is already registered, this plugin's step is a no-op. To keep `web_fetch` off entirely, uninstall the plugin.

## Configuration

Settings namespace `web-search-ext` in `~/.dsh/settings.yaml` (hot-reloaded):

| Field | Default | Description |
|---|---|---|
| `preferred` | `exa` | Backend to try first: `exa` \| `firecrawl` |
| `numResults` | `8` | Result count to request; also a hard cap on results returned (context budget) — a larger `maxResults` request is clamped to it and the receipt says so |
| `maxSnippetChars` | `500` | Snippet length bound |
| `rateLimitCooldownSec` | `60` | Fallback 429 cooldown when the backend reports no window; `0` disables |
| `firecrawlKeyless` | `true` | Allow keyless Firecrawl requests (search + fetch) |
| `exaApiKey` / `firecrawlApiKey` | — | Literal API key per backend |
| `exaApiKeyEnv` / `firecrawlApiKeyEnv` | `EXA_API_KEY` / `FIRECRAWL_API_KEY` | Env var names for key resolution |
| `exaApiUrl` / `exaMcpUrl` / `firecrawlBaseUrl` | `https://api.exa.ai/search` / `https://mcp.exa.ai/mcp` / `https://api.firecrawl.dev/v2` | Endpoint overrides |
| `verifyLevel` | `liveness` | Result verification tier: `off` \| `liveness` (HEAD every source) \| `content` (experimental: also word-match the snippet against the live page) |
| `livenessTimeoutMs` | `3000` | Per-URL timeout for L0 HEAD probes |
| `contentCheckBytes` | `10240` | L1: max bytes read from each page |
| `contentCheckMinBytes` | `200` | L1: pages shorter than this count as bot-blocks |
| `contentCheckMatchWords` | `5` | L1: leading snippet words checked against the page |
| `contentCheckTimeoutMs` | `3000` | L1: timeout per request and body-read phase |
| `freshness` | `any` | Recency window: `any` \| `24h` \| `7d` \| `30d` (sent on the wire where the backend supports it; keyless Exa MCP cannot filter and says so in the receipt) |
| `maxCooldownSec` | `86400` | Cap on 429 cooldowns taken from a backend's reported `retry_after`; `0` = always honor the reported value |
| `fetchMaxChars` | `50000` | Character cap for `web_fetch` provider output |

```yaml
web-search-ext:
  preferred: exa
  numResults: 8
  # rateLimitCooldownSec: 60   # all other values are defaults
```

Or select this provider without the bundle patch: `DSH_WEB_SEARCH_PROVIDER=web-search-ext`.

## Keys (optional but recommended)

Any of these, in order of precedence per backend:

1. Literal key in the settings section (`exaApiKey` / `firecrawlApiKey`)
2. Credentials service: the `EXA_API_KEY` / `FIRECRAWL_API_KEY` entries in `~/.dsh/.credentials.yaml` (or a `.env` file)
3. Launch environment variable of the same name

**Settings UI (Web)**: this plugin has a card on **Settings → Plugins → Plugin configuration** that edits the five config fields and both API keys. Key state is auto-discovered from the layers above — the configured/not-configured badges update live when `~/.dsh/.credentials.yaml` changes — and a key supplied by the live process environment is rendered read-only, because the host rejects UI writes that an environment value would shadow. (The "Models" page manages LLM provider credentials only.)

No keys at all still works: Exa uses its anonymous MCP endpoint and Firecrawl is tried keyless.

## How failover works

Each search (and each fetch) builds an ordered plan from the backends that are available under the current key situation — preferred backend first for search; Firecrawl scrape first for fetch (richer markdown), with the keyless Exa MCP fetch as fallback. The first backend whose request fails is reported as the failure only if every later backend also fails — a 429 additionally starts that backend's cooldown, sized by the window the backend itself reports (`Retry-After` header, or `retry_after_seconds` in the response body; clamped by `maxCooldownSec`), so it is skipped on subsequent calls until the window expires.

`web_search` results also carry a one-line provenance receipt (`web-search-ext: <backend> · <elapsed>s · <n> results · liveness: …`): which backend actually answered, and whether the freshness window or verification tier was honored or had to be skipped. Nothing is silently dropped.

## Uninstall

```sh
dsh plugin --profile web remove @fno2010/dsh-web-search-ext   # then restart dsh web
```

## Security notes

- The only outbound requests are to the configured Exa and Firecrawl endpoints (plus the local verification probes described below); nothing else is contacted.
- API keys travel only in the `authorization` header of their own backend's requests — never in bodies, never to the other backend, never in error messages.
- No install-time scripts: plain ESM JavaScript, no build step, no `postinstall`/`prepare`.
- One search's context is bounded: results are clamped to `numResults` (when a request's `maxResults` exceeds it, the receipt carries the `(numResults cap)` marker — `N of M results` when the backend also over-delivered) and snippets are bounded to `maxSnippetChars`; Firecrawl's page-markdown descriptions are stripped of image links before entering model context.
- Verification probes (L0/L1) only fetch URLs that appear in backend results, with bounded bytes/timeouts; redirects are followed manually and every hop is re-validated against the same SSRF rules (public http(s) only; loopback, private, link-local, and CGNAT ranges are refused — including IPv6 literal and trailing-dot spellings; addresses that cannot be confidently classified are refused, fail closed).
- The `web_fetch` provider refuses non-public targets (non-http(s) schemes, loopback, private, link-local) before sending the URL to any scraping backend.

## Development

- Tests: `npm test` — mocked failover/mapping/verification/fetch scenarios (deterministic, no network) plus live keyless smoke calls (smoke is skipped in CI).
- Adding a backend, branch/PR conventions, and the release process: [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
