# dsh-web-search-ext

English | [中文](README.zh.md)

![CI](https://github.com/fno2010/dsh-web-search-ext/actions/workflows/ci.yml/badge.svg)
![npm version](https://img.shields.io/npm/v/@fno2010/dsh-web-search-ext)
![npm downloads](https://img.shields.io/npm/dm/@fno2010/dsh-web-search-ext)
![license](https://img.shields.io/badge/license-MIT-blue.svg)
![node](https://img.shields.io/badge/node-%E2%89%A522-brightgreen)

Multi-backend `web_search` provider for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH). **Works with no API keys at all**; add keys to unlock higher limits. Registered into the web capability seam (`ctx.web`) under one stable provider id (`web-search-ext`).

## Why

The built-in `web_search` tool is backend-pluggable; the in-box default provider (`deepseek-official`) requires a DeepSeek API key. This plugin is a key-free-capable alternative: it works out of the box via Exa's anonymous MCP endpoint, and **fails over automatically** when one backend saturates.

## Features

- **Two backends today**: Exa (REST with key, anonymous hosted MCP without) and Firecrawl (v2 search API, keyed or keyless)
- **Automatic failover**: on any backend failure (429, 401/402/403, 5xx, network, malformed body) the search falls through to the next backend in preference order
- **Per-backend 429 cooldown** (default 60 s): a saturated backend is skipped on subsequent searches; when all backends fail, the error lists every failure including cooldown state
- **Optional keys** with per-backend precedence: settings literal → credentials service → launch environment variable
- **No install-time scripts**: plain ESM JavaScript, no build step, no `postinstall`/`prepare`
- **Extensible**: adding a backend is one search function + one plan entry + config fields — see [CONTRIBUTING](CONTRIBUTING.md)

## Backends

| Backend | With key | Without key |
|---|---|---|
| **Exa** | REST `POST https://api.exa.ai/search` (higher limits, highlight snippets) | Anonymous hosted MCP `POST https://mcp.exa.ai/mcp` (JSON-RPC 2.0, documented public fallback, rate-limited → HTTP 429) |
| **Firecrawl** | `POST https://api.firecrawl.dev/v2/search` (Bearer) | Keyless requests when `firecrawlKeyless: true` (unofficial; may be rate-limited or removed) |

## Install

```sh
dsh plugin --profile web add @fno2010/dsh-web-search-ext
# or from a local checkout:
dsh plugin --profile web add ./path/to/dsh-web-search-ext
```

Installing a plugin requires restarting the running `dsh web` process (the profile bundle list is resolved at boot). Config changes afterwards are hot — no restart.

The bundle patch selects this provider for the `web_search` tool by setting `web.searchProvider: web-search-ext`. The official `deepseek-official` provider stays registered but unused; an explicit selection also prevents `WEB_PROVIDER_AMBIGUOUS`.

## Configuration

Settings namespace `web-search-ext` in `~/.dsh/settings.yaml` (hot-reloaded):

| Field | Default | Description |
|---|---|---|
| `preferred` | `exa` | Backend to try first: `exa` \| `firecrawl` |
| `numResults` | `8` | Default result count when the tool doesn't cap it |
| `maxSnippetChars` | `500` | Snippet length bound |
| `rateLimitCooldownSec` | `60` | Skip a 429'd backend this long; `0` disables |
| `firecrawlKeyless` | `true` | Allow keyless Firecrawl requests |
| `exaApiKey` / `firecrawlApiKey` | — | Literal API key per backend |
| `exaApiKeyEnv` / `firecrawlApiKeyEnv` | `EXA_API_KEY` / `FIRECRAWL_API_KEY` | Env var names for key resolution |
| `exaApiUrl` / `exaMcpUrl` / `firecrawlBaseUrl` | `https://api.exa.ai/search` / `https://mcp.exa.ai/mcp` / `https://api.firecrawl.dev/v2` | Endpoint overrides |

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
2. Credentials service: `EXA_API_KEY` / `FIRECRAWL_API_KEY` (the Web "Models" page writes them; `~/.dsh/.credentials.yaml`)
3. Launch environment variable of the same name

No keys at all still works: Exa uses its anonymous MCP endpoint and Firecrawl is tried keyless.

## How failover works

Each search builds an ordered plan (preferred backend first) from the backends that are available under the current key situation. The first backend whose request fails is reported as the failure only if every later backend also fails — a 429 additionally starts that backend's cooldown so it is skipped on subsequent searches until the window expires.

## Uninstall

```sh
dsh plugin --profile web remove @fno2010/dsh-web-search-ext   # then restart dsh web
```

## Security notes

- The only outbound requests are to the configured Exa and Firecrawl endpoints; nothing else is contacted.
- API keys travel only in the `authorization` header of their own backend's requests — never in bodies, never to the other backend, never in error messages.
- No install-time scripts: plain ESM JavaScript, no build step, no `postinstall`/`prepare`.
- Snippets are bounded (`maxSnippetChars`) and Firecrawl's page-markdown descriptions are stripped of image links before entering model context.

## Development

- Tests: `npm test` — 10 mocked failover/mapping scenarios plus live keyless smoke calls (smoke is skipped in CI).
- Adding a backend, branch/PR conventions, and the release process: [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
