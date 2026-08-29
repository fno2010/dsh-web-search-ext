// Session-scoped telemetry backing GET /web-search-ext/health (C2) and the
// first-install connectivity probe (G3: POST /web-search-ext/probe).
//
// Transport choice (design evidence in docs/settings-ui-plan.md): this host
// version gives classic plugins no way to add `/api` methods (the map is a
// closed set in dsh-host-apiproxy) and no plugin event channel; the one
// extensible host→browser surface is the web server's route table
// (dsh-host-webserver, `webServer` service). lib/index.js registers the
// exact routes on it; the settings card fetches them same-origin.
//
// The payload is counters + probe results only — no credentials, no vendor
// messages, no URLs, no query text. The probe result carries plan literals
// (name/label) and closed detail codes. The routes sit OUTSIDE the /api
// trust fence, so they answer anything that can reach the host web server
// (loopback by default); the secret-free invariant is load-bearing.

/**
 * Create the session-scoped health state (one per plugin apply, shared by
 * the search and fetch providers).
 * @param {number} [startedAt] - session start (epoch ms); defaults to now.
 * @returns {object} mutable state: `{ startedAt, searchCalls, fetchCalls,
 *   resultsReturned, backends: Map<"provider:name", entry>, probe }`.
 *   `probe` (G3) is `null` until the first connectivity probe runs.
 */
export function createHealthState(startedAt = Date.now()) {
  return {
    startedAt,
    searchCalls: 0,
    fetchCalls: 0,
    resultsReturned: 0,
    backends: new Map(),
    probe: null
  };
}

/**
 * Record one backend attempt under `(provider, name)`. The label may vary
 * per call (exa serves as exa-rest or exa-mcp depending on key presence);
 * the LAST label seen is the one displayed.
 * @param {object} state - createHealthState() output.
 * @param {"search"|"fetch"} provider - which provider made the attempt.
 * @param {string} name - backend name (exa / firecrawl / exa-mcp).
 * @param {string} [label] - receipt label that served (or would serve) it.
 * @param {boolean} ok - whether the attempt succeeded.
 * @param {number} startedAt - epoch ms the attempt began.
 * @param {number} [now] - epoch ms the attempt ended.
 */
export function recordBackend(state, provider, name, label, ok, startedAt, now = Date.now()) {
  const key = `${provider}:${name}`;
  let entry = state.backends.get(key);
  if (entry === undefined) {
    entry = {
      provider,
      name,
      label: label ?? name,
      attempts: 0,
      ok: 0,
      failed: 0,
      lastCallAt: null,
      lastCallMs: null,
      lastOk: null
    };
    state.backends.set(key, entry);
  }
  if (label !== undefined) entry.label = label;
  entry.attempts += 1;
  if (ok) entry.ok += 1;
  else entry.failed += 1;
  entry.lastCallAt = now;
  entry.lastCallMs = now - startedAt;
  entry.lastOk = ok;
}

/** One tool-level call through the named provider ("search" | "fetch"). */
export function noteCall(state, provider) {
  if (provider === "search") state.searchCalls += 1;
  else state.fetchCalls += 1;
}

/** Sources a search returned to the caller (fetch results carry no count). */
export function noteResults(state, count) {
  state.resultsReturned += count;
}

/**
 * Store a connectivity probe result (G3). The result is a closed,
 * locale-neutral payload from `probeBackends`:
 * `{ at: number, backends: [{ name, label, status, detail, ms }] }` — plan
 * literals and closed detail codes only. No vendor messages, URLs, or keys:
 * the probe rides the same secret-free route family as the counters.
 * @param {object} state - createHealthState() output.
 * @param {object} result - lib/index.js `probeBackends()` output.
 */
export function storeProbe(state, result) {
  state.probe = result;
}

/**
 * Still-active cooldowns among raw provider cooldown entries.
 * @param {Array<{name: string, at: number, ms: number}>} entries - provider
 *   `cooldownEntries()` output.
 * @param {number} [now]
 * @returns {Array<{name: string, remainingMs: number}>} - active ones only.
 */
export function activeCooldowns(entries, now = Date.now()) {
  const out = [];
  for (const { name, at, ms } of entries) {
    const remainingMs = at + ms - now;
    if (remainingMs > 0) out.push({ name, remainingMs });
  }
  return out;
}

/**
 * Build the wire JSON for GET /web-search-ext/health.
 * @param {object} state - createHealthState() output.
 * @param {object} cooldowns - `{ searchCooldowns, fetchCooldowns }`, raw
 *   provider `cooldownEntries()` arrays.
 * @param {number} [now]
 * @returns {object} JSON-safe: `{ startedAt, uptimeMs, searchCalls,
 *   fetchCalls, resultsReturned, backends: [...], probe }` where each
 *   backend row carries `provider, name, label, attempts, ok, failed,
 *   lastCallAt, lastCallMs, lastOk, cooldownRemainingMs` (0 = not cooling
 *   down) and `probe` is the last stored connectivity probe (G3) or null.
 */
export function buildHealthJson(state, { searchCooldowns = [], fetchCooldowns = [] }, now = Date.now()) {
  const active = (entries, provider) =>
    activeCooldowns(entries, now).map(({ name, remainingMs }) => ({ provider, name, remainingMs }));
  const cooldowns = [...active(searchCooldowns, "search"), ...active(fetchCooldowns, "fetch")];
  return {
    startedAt: state.startedAt,
    uptimeMs: Math.max(0, now - state.startedAt),
    searchCalls: state.searchCalls,
    fetchCalls: state.fetchCalls,
    resultsReturned: state.resultsReturned,
    probe: state.probe === undefined ? null : state.probe,
    backends: [...state.backends.values()].map((entry) => ({
      ...entry,
      cooldownRemainingMs:
        cooldowns.find((c) => c.provider === entry.provider && c.name === entry.name)?.remainingMs ?? 0
    }))
  };
}
