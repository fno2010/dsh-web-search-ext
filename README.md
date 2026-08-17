# dsh-web-search-ext

Multi-backend `web_search` provider for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH), registered into the web capability seam (`ctx.web`) under one stable provider id (`web-search-ext`).

The built-in `web_search` tool is backend-pluggable; the in-box default (`deepseek-official`) requires a DeepSeek API key. This plugin provides a key-free-capable alternative with **automatic failover** between backends.

## Current backends

| Backend | With key | Without key |
|---|---|---|
| **Exa** | REST `POST https://api.exa.ai/search` (higher limits, highlight snippets) | Anonymous hosted MCP `POST https://mcp.exa.ai/mcp` (JSON-RPC 2.0, documented public fallback, rate-limited → HTTP 429) |
| **Firecrawl** | `POST https://api.firecrawl.dev/v2/search` (Bearer) | Keyless requests when `firecrawlKeyless: true` (unofficial; may be rate-limited or removed) |

On any backend failure (429, 401/402/403, 5xx, network, malformed body) the search fails over to the next backend. A 429 additionally starts a per-backend cooldown (default 60 s) so a saturated backend is skipped on subsequent searches. When all backends fail, the error lists each failure (including cooldown state).

## Adding another backend (e.g. SearXNG)

The provider is deliberately small and uniform; a backend is:

1. one `async function <name>Search(options, apiKey?, request, signal)` that returns `{ sources, truncated: false }` and throws `WebError` (`WEB_RATE_LIMIT` for 429, `WEB_PROVIDER_ERROR` otherwise, aborts as `WEB_ABORTED`);
2. one entry pushed onto `plan` in `search()` when its availability condition holds (key present, or keyless mode allowed);
3. its config fields in the `Config` schema and key resolution in `resolveKey()`.

No other code changes: failover, cooldown, abort handling, and snippet bounding all apply automatically. A self-hosted [SearXNG](https://docs.searxng.org/) instance (JSON API) is the natural next candidate — no key, no rate limit of your own, fully local.

## Install

```sh
dsh plugin --profile web add dsh-web-search-ext
# or from a local checkout:
dsh plugin --profile web add ./path/to/dsh-web-search-ext
```

Installing a plugin requires restarting the running `dsh web` process (the profile bundle list is resolved at boot). Config changes afterwards are hot — no restart.

The bundle patch selects this provider for the `web_search` tool by setting `web.searchProvider: web-search-ext`. The official `deepseek-official` provider stays registered but unused; an explicit selection also prevents `WEB_PROVIDER_AMBIGUOUS`.

## Keys (optional but recommended)

Any of these, in order of precedence per backend:

1. Literal key in the settings section (`exaApiKey` / `firecrawlApiKey`)
2. Credentials service: `EXA_API_KEY` / `FIRECRAWL_API_KEY` (the Web "Models" page writes them; `~/.dsh/.credentials.yaml`)
3. Launch environment variable of the same name

No keys at all still works: Exa uses its anonymous MCP endpoint and Firecrawl is tried keyless.

## Configuration

Settings namespace `web-search-ext` in `~/.dsh/settings.yaml` (hot-reloaded):

```yaml
web-search-ext:
  preferred: exa               # exa | firecrawl — which backend to try first
  # exaApiKeyEnv: EXA_API_KEY      # defaults shown
  # firecrawlApiKeyEnv: FIRECRAWL_API_KEY
  # exaApiUrl: https://api.exa.ai/search
  # exaMcpUrl: https://mcp.exa.ai/mcp
  # firecrawlBaseUrl: https://api.firecrawl.dev/v2
  numResults: 8                # default result count when the tool doesn't cap it
  maxSnippetChars: 500         # snippet length bound
  rateLimitCooldownSec: 60     # skip a 429'd backend this long; 0 disables
  firecrawlKeyless: true       # allow keyless Firecrawl requests
```

Or select this provider without the bundle patch: `DSH_WEB_SEARCH_PROVIDER=web-search-ext`.

## Uninstall

```sh
dsh plugin --profile web remove dsh-web-search-ext   # then restart dsh web
```

## Security notes

- The only outbound requests are to the configured Exa and Firecrawl endpoints; nothing else is contacted.
- API keys travel only in the `authorization` header of their own backend's requests — never in bodies, never to the other backend, never in error messages.
- No install-time scripts: plain ESM JavaScript, no build step, no `postinstall`/`prepare`.
- Snippets are bounded (`maxSnippetChars`) and Firecrawl's page-markdown descriptions are stripped of image links before entering model context.

## Verified against (2026-08-17)

- Exa anonymous MCP: live call to `mcp.exa.ai/mcp` returned structured `Title:/URL:/Highlights:` results without credentials.
- Exa REST without key: HTTP 402 (`X402_PAYMENT_REQUIRED`) — treated as "no key", not an error to surface.
- Firecrawl v2 without key: live call returned `data.web[]` (v1 shape `data[]` is also handled).
- Test suite: `node test/failover.test.mjs` — 10 mocked failover/mapping scenarios + live smoke calls.
