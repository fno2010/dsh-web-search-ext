# Roadmap

Versioning plan for this plugin. Shipped changes are recorded in
[CHANGELOG](CHANGELOG.md); this file describes what comes next and why.

## Current state (0.3.0)

- Multi-backend `web_search` and keyless `web_fetch` providers
  (Exa REST/MCP + Firecrawl v2) with automatic failover and per-backend 429
  cooldowns that honor backend-reported retry windows
- Result verification: L0 liveness markers on by default, experimental L1
  content check; provenance receipt on every search result
- Works with no API keys (Exa anonymous MCP + keyless Firecrawl); optional
  keys raise limits
- Settings card (Settings → Plugins) with key discovery, backend preference,
  and result limits

## 0.3.0 — verifiable, current search

Status: implemented on this branch; the table below is the delivered spec.

Goal: each search result carries a machine- and human-readable trust signal,
and `web_fetch` works keyless.

| Area | Deliverable |
|------|-------------|
| Result liveness (on by default) | Before returning results, check every result URL with concurrent HEAD requests (per-URL timeout, SSRF-safe manual redirects). Tag each source `[alive]`, `[dead 404]`, `[blocked]`, `[timeout]`, or `[unreachable]`. No result is dropped. Purely local HTTP: no vendor quota, no LLM tokens; added latency bounded by the slowest check. |
| Content-consistency check (experimental, off by default) | Fetch the first ~10 KB of each page and check that the snippet's leading words still appear on the live page. Tags results `[verified]` / `[verified·changed]`. |
| Freshness window | `freshness: any \| 24h \| 7d \| 30d` maps to `startPublishedDate` (Exa REST) and `tbs` (Firecrawl). The keyless Exa MCP endpoint has no date filter; when the window is ignored, the receipt says so. |
| Keyless `web_fetch` | The provider also registers as the web fetch provider: keyless Firecrawl scrape, Exa MCP fetch as fallback. |
| Readable failures | 429s and backend errors report the cause, the backend's own `retry-after` when provided, and how to remove the limit (add a key in Settings). |
| Provenance receipt | One line at the top of the search content: backend used, latency, liveness summary. |
| Configuration | All thresholds configurable (`verifyLevel`, `livenessTimeoutMs`, `contentCheckBytes`, `contentCheckMinBytes`, `contentCheckMatchWords`, `contentCheckTimeoutMs`, `freshness`, `maxCooldownSec`, `fetchMaxChars`), each with a documented default. |

Acceptance (0.3.0):

1. Every returned result carries a liveness tag by default; total added
   latency ≤ 2 s (P95) with the default settings.
2. `web_fetch` works with no keys configured.
3. A 429 error names the backend, reports the retry window when the backend
   provides one, and states how to remove the limit.
4. `freshness: 24h` sends a date filter on Exa REST and a time filter to
   Firecrawl.
5. Full test suite green (`CI=true npm test`); mocked scenarios cover each
   new behavior.

## 0.3.1 — visibility and observability

- Custom tool-view card for `web_search`: provenance line, per-result
  liveness badges, source summary (replaces the host's plain SERP card).
- Health panel: per-backend last call, success/failure counts, cooldown
  state, session usage (host web-server route; settings card "Health" tab).
- `/search-engine` command: switch preferred backend, view status, run a
  connectivity test. (Command registration is name-collision-checked at load
  time; the name falls back to `/web-search-engine` if taken.)
- Per-result drill-down: source backend, freshness, verification state.
- Running-state feedback during a search (backend → fallback → verification).
- Verification-tier selector in the settings card (`off` / `liveness` /
  `content`).
- First-run connectivity check shown on the settings card.
- Context budget: bounded `results × snippet size` with an explicit
  truncation notice.

## 0.3.2 — Chinese-language search

- Intent routing: queries containing Chinese prefer mainland-reachable
  backends when keys are configured; otherwise the existing preference order
  applies. No NLP classification — the rule is language detection only.
- Bocha backend (Bing-compatible schema; free individual tier, user-supplied
  key).
- Zhipu search API (user-supplied key; standard/pro/sogou/quark channels —
  the only API access to WeChat / Zhihu content).
- Baidu Qianfan as a paid fallback (free daily quota).
- Deterministic deduplication (canonical URL / identical title) plus a
  user-configurable domain blocklist (ships with a default list of common
  content-farm domains; the list is user-owned).

Rationale: Microsoft retired the Bing Search APIs (August 2025), closing the
main keyless access to a Chinese index; mainland reachability of the current
keyless backends is unreliable; Bocha's free tier and Bing-compatible schema
minimize integration cost; Zhipu's sogou/quark channels cover content the
current backends do not index.

## 0.4.0 — differentiation

- **Result-level multi-engine fusion (opt-in).** For queries that route
  ambiguously (or on explicit request), query two engines in parallel,
  deduplicate by URL, merge with reciprocal-rank fusion, and label each
  result with its source engine. This is distinct from session-level
  provider rotation, which the 0.3.0 failover already covers.
- Full health dashboard: multi-day history, quota prediction, cost trend.
- Session-scoped fetch cache: re-fetching the same URL within a session is a
  no-op.
- Per-result citation quality score (domain reputation + freshness +
  verification status), informed by session history.

Deliberately out of scope: LLM-based quality re-ranking of SERP results.
Judging whether a result is good belongs to the model, which has the
conversation context; the plugin supplies the signals (freshness, liveness,
domain, verification state) and leaves the judgment there.

## Design principles (stable across versions)

1. The provider id and settings namespace are stable: `web-search-ext`.
2. No install-time scripts; plain ESM, no build step on the host side.
3. API keys never leave their own backend.
4. No silent degradation: every fallback, cooldown, or skip is visible in
   the result content or the error message.
5. Keyless must keep working: zero-configuration search, always.
6. The provider does not choose which results the model should read; it
   labels every result and leaves the judgment to the model.
7. Every numeric default is configurable and has a documented reason.
