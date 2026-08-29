// Pure model for the settings card's Health tab (C2).
//
// The host serves the session telemetry at GET /web-search-ext/health
// (lib/health.js buildHealthJson). This module turns that wire payload into
// a display model — or null, when the payload is not what the card expects
// (the tab then shows its explicit unavailable line instead of guessing).
//
// React-free: unit-tested under node (test/health.test.mjs).

/** Same-origin route the Health tab fetches (host lib/health.js). */
export const HEALTH_ROUTE = "/web-search-ext/health";

/** Same-origin route the "Test now" button POSTs to (host lib/index.js, G3). */
export const PROBE_ROUTE = "/web-search-ext/probe";

/**
 * Closed set of probe detail codes the host may produce
 * (lib/index.js `classifyProbeError`). Anything else is a shape change —
 * reject the whole payload rather than render an unknown code.
 */
export const PROBE_DETAIL_CODES = ["ok", "rate-limited", "auth", "timeout", "error", "network", "disabled"];

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Validate the G3 probe payload (host `probeBackends` result). Returns the
 * display model — or null when malformed (a shape change must surface as
 * the unavailable line, exactly like the C2 counters).
 *
 * Display model: `{ at: number, backends: [{ name: string, label: string,
 * status: "ok" | "error" | "disabled", detail: <PROBE_DETAIL_CODES>,
 * ms: number }] }`. `label` defaults to `name`; a missing `ms` to 0.
 */
function parseProbe(probe) {
  if (probe === null || typeof probe !== "object" || Array.isArray(probe)) return null;
  if (!isFiniteNumber(probe.at) || probe.at < 0) return null;
  if (!Array.isArray(probe.backends)) return null;
  const backends = [];
  for (const row of probe.backends) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) return null;
    if (typeof row.name !== "string" || row.name === "") return null;
    if (row.status !== "ok" && row.status !== "error" && row.status !== "disabled") return null;
    if (typeof row.detail !== "string" || !PROBE_DETAIL_CODES.includes(row.detail)) return null;
    const ms = row.ms === undefined || row.ms === null ? 0 : row.ms;
    if (!isFiniteNumber(ms) || ms < 0) return null;
    backends.push({
      name: row.name,
      label: typeof row.label === "string" && row.label !== "" ? row.label : row.name,
      status: row.status,
      detail: row.detail,
      ms
    });
  }
  return { at: probe.at, backends };
}

/**
 * Normalize the wire payload into the display model, or null when any
 * required field is malformed (a shape change must surface as the
 * unavailable line, never as a silently wrong number).
 *
 * Display model:
 *   { startedAt: number, uptimeMs: number, searchCalls: number,
 *     fetchCalls: number, resultsReturned: number | null,
 *     backends: [{ provider: string, name: string, label: string,
 *       attempts: number, ok: number, failed: number,
 *       lastCallAt: number | null, lastCallMs: number | null,
 *       lastOk: boolean | null, cooldownRemainingMs: number }],
 *     probe: null | { at: number, backends: [{ name, label, status,
 *       detail, ms }] } }
 *
 * The `probe` field (G3) is absent/null until the first connectivity probe;
 * when present it must be well-formed, or the whole payload is rejected.
 */
export function parseHealth(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return null;
  const p = payload;
  if (!isFiniteNumber(p.startedAt) || p.startedAt < 0) return null;
  if (!isFiniteNumber(p.uptimeMs) || p.uptimeMs < 0) return null;
  if (!isFiniteNumber(p.searchCalls) || p.searchCalls < 0) return null;
  if (!isFiniteNumber(p.fetchCalls) || p.fetchCalls < 0) return null;
  if (p.resultsReturned !== undefined && p.resultsReturned !== null
    && (!isFiniteNumber(p.resultsReturned) || p.resultsReturned < 0)) return null;
  if (!Array.isArray(p.backends)) return null;
  const backends = [];
  for (const row of p.backends) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) return null;
    if (typeof row.provider !== "string" || row.provider === "") return null;
    if (typeof row.name !== "string" || row.name === "") return null;
    if (!isFiniteNumber(row.attempts) || row.attempts < 0) return null;
    if (!isFiniteNumber(row.ok) || row.ok < 0) return null;
    if (!isFiniteNumber(row.failed) || row.failed < 0) return null;
    // Missing last-call facts normalize to null (the wire shape always
    // carries them, but a shape evolution must not read as malformed).
    const lastCallAt = row.lastCallAt === undefined ? null : row.lastCallAt;
    const lastCallMs = row.lastCallMs === undefined ? null : row.lastCallMs;
    const lastOk = row.lastOk === undefined ? null : row.lastOk;
    if (lastCallAt !== null && !isFiniteNumber(lastCallAt)) return null;
    if (lastCallMs !== null && !isFiniteNumber(lastCallMs)) return null;
    if (lastOk !== null && typeof lastOk !== "boolean") return null;
    const cooldown = row.cooldownRemainingMs === undefined || row.cooldownRemainingMs === null
      ? 0
      : row.cooldownRemainingMs;
    if (!isFiniteNumber(cooldown) || cooldown < 0) return null;
    backends.push({
      provider: row.provider,
      name: row.name,
      label: typeof row.label === "string" && row.label !== "" ? row.label : row.name,
      attempts: row.attempts,
      ok: row.ok,
      failed: row.failed,
      lastCallAt,
      lastCallMs,
      lastOk,
      cooldownRemainingMs: cooldown
    });
  }
  // G3: optional probe result. Absent or null → no probe yet; present but
  // malformed → reject the whole payload (same strictness as the counters).
  const probe = p.probe === undefined || p.probe === null ? null : parseProbe(p.probe);
  if (probe === null && p.probe !== undefined && p.probe !== null) return null;
  return {
    startedAt: p.startedAt,
    uptimeMs: p.uptimeMs,
    searchCalls: p.searchCalls,
    fetchCalls: p.fetchCalls,
    resultsReturned: p.resultsReturned === undefined ? null : p.resultsReturned,
    backends,
    probe
  };
}

/**
 * Human duration from milliseconds: "12s" / "2m 3s" / "1h 1m" / "3d 2h".
 * Two units at most (the leading unit + the next smaller one); negatives
 * and non-finite values clamp to "0s" — the card must never render a
 * negative age or NaN.
 */
export function formatDuration(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

/**
 * "How long ago": null when the event is unknown (never called), else the
 * clamped age between `then` and `now` (defaults to Date.now()).
 */
export function ageOf(then, now = Date.now()) {
  if (!isFiniteNumber(then)) return null;
  if (!isFiniteNumber(now)) return null;
  return formatDuration(Math.max(0, now - then));
}
