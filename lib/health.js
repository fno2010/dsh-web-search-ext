// Session-scoped telemetry backing GET /web-search-ext/health (C2).
//
// Transport choice (design evidence in docs/settings-ui-plan.md): this host
// version gives classic plugins no way to add `/api` methods (the map is a
// closed set in dsh-host-apiproxy) and no plugin event channel; the one
// extensible host→browser surface is the web server's route table
// (dsh-host-webserver, `webServer` service). lib/index.js registers the
// exact route on it; the settings card fetches it same-origin.
//
// The payload is counters only — no credentials, no URLs, no query text.
// The route sits OUTSIDE the /api trust fence, so it answers anything that
// can reach the host web server (loopback by default); it must stay
// secret-free.

/**
 * Create the session-scoped health state (one per plugin apply, shared by
 * the search and fetch providers).
 * @param {number} [startedAt] - session start (epoch ms); defaults to now.
 * @returns {object} mutable state: `{ startedAt, searchCalls, fetchCalls,
 *   resultsReturned, backends: Map<"provider:name", entry> }`.
 */
export function createHealthState(startedAt = Date.now()) {
  return {
    startedAt,
    searchCalls: 0,
    fetchCalls: 0,
    resultsReturned: 0,
    backends: new Map()
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
 *   fetchCalls, resultsReturned, backends: [...] }` where each backend row
 *   carries `provider, name, label, attempts, ok, failed, lastCallAt,
 *   lastCallMs, lastOk, cooldownRemainingMs` (0 = not cooling down).
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
    backends: [...state.backends.values()].map((entry) => ({
      ...entry,
      cooldownRemainingMs:
        cooldowns.find((c) => c.provider === entry.provider && c.name === entry.name)?.remainingMs ?? 0
    }))
  };
}
