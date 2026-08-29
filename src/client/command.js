// C3: /search-engine command model — pure option/detail builders for the
// client-side command contribution (ctx.commandUi.register with the
// popupSelect shell). No React imports so the host-side test suite can
// exercise it under plain node, same as model.js / health.js.
//
// The host ships no in-flight progress channel and classic plugins have no
// host command surface, so the command is CLIENT-only: it switches the
// preferred backend (settings write through the bound settings scope),
// reports status (the health route's session counters + key discovery via
// credentials.describe), and runs the G3 connectivity test (POST to the
// probe route). None of that touches the wire beyond our own same-origin
// routes; the contribution's callbacks capture the plugin root ctx at
// registration (the popup passes a session projection that carries only a
// sessionId, so root-ctx capture is the documented access path).

import { ageOf, formatDuration } from "./health.js";

/**
 * Primary command name and its fallback. The host's contribution registry
 * rejects a duplicate name at register time (and a host-catalog collision
 * fails loud at candidate synthesis), so registration tries the primary
 * name first and falls back to the second — the card shows which one
 * actually materialized.
 */
export const COMMAND_PRIMARY = "search-engine";
export const COMMAND_FALLBACK = "web-search-engine";

/**
 * Key-state word for one API key ref.
 * @param {{configured: boolean, source: string}} key - credentials.describe
 *   projection (NO_KEY_STATE when the ref is absent).
 * @param {boolean} keylessAllowed - whether the backend serves without a key
 *   (exa: always — the anonymous MCP path; firecrawl: only when
 *   firecrawlKeyless is on).
 * @param {(key: string, params?: object) => string} t - bound translator.
 * @returns {string} one of the closed cmd.keyed* / cmd.keyless words.
 */
export function keyWord(key, keylessAllowed, t) {
  if (key !== null && key !== undefined && key.configured === true) {
    return key.source === "env" ? t("cmd.keyedEnv") : t("cmd.keyedFile");
  }
  return keylessAllowed ? t("cmd.keyless") : t("cmd.keyMissing");
}

/**
 * Status word for one health backends row (search provider): cooldown, last
 * call outcome + age, or "never called". Closed vocabulary, locale-neutral
 * on the wire, translated here.
 * @param {{cooldownRemainingMs: number, lastCallAt: number | null, lastOk: boolean | null} | null} backend
 * @param {(key: string, params?: object) => string} t
 * @returns {string}
 */
export function backendStatusWord(backend, t) {
  if (backend === null || backend === undefined) return t("cmd.never");
  if (typeof backend.cooldownRemainingMs === "number" && backend.cooldownRemainingMs > 0) {
    return t("cmd.cooldown", { time: formatDuration(backend.cooldownRemainingMs) });
  }
  if (typeof backend.lastCallAt !== "number" || !Number.isFinite(backend.lastCallAt)) {
    return t("cmd.never");
  }
  return backend.lastOk === true
    ? t("cmd.lastOk", { time: ageOf(backend.lastCallAt) })
    : t("cmd.lastFail", { time: ageOf(backend.lastCallAt) });
}

/**
 * One-line probe summary for the "Test connectivity" row: "last test {age}
 * ago: {codes}" where codes join the stored probe's per-backend CLOSED
 * detail codes through the existing probe.* keys (locale parity with the
 * Health tab).
 * @param {{at: number, backends: Array<{label: string, detail: string}>} | null} probe
 * @param {(key: string, params?: object) => string} t
 * @returns {string}
 */
export function probeWord(probe, t) {
  if (probe === null || probe === undefined) return t("cmd.neverTested");
  const codes = (Array.isArray(probe.backends) ? probe.backends : [])
    .filter((b) => b !== null && typeof b === "object" && typeof b.detail === "string")
    .map((b) => `${typeof b.label === "string" && b.label !== "" ? b.label : b.name} ${t(`probe.${b.detail}`)}`)
    .join(" · ");
  return codes === "" ? t("cmd.neverTested") : t("cmd.testLast", { age: ageOf(probe.at), codes });
}

/**
 * Build the popupSelect options for the /search-engine command.
 * @param {object} args
 * @param {(key: string, params?: object) => string} args.t - bound translator.
 * @param {"exa" | "firecrawl"} args.preferred - effective preferred backend
 *   (the merged settings value, schema default "exa" when unset).
 * @param {{configured: boolean, source: string} | null} args.exaKey
 * @param {{configured: boolean, source: string} | null} args.fcKey
 * @param {boolean} args.fcKeyless - effective firecrawlKeyless setting.
 * @param {{backends?: Array<object>, probe?: object | null} | null} args.health -
 *   parseHealth output for the live payload, or null when the health route
 *   is unavailable (degrade: status words fall back to "never called").
 * @returns {Array<{id: string, label: string, detail: string, active?: boolean}>}
 *   Two "prefer <backend>" rows (the active one marked) + one test row.
 */
export function commandOptions({ t, preferred, exaKey, fcKey, fcKeyless, health }) {
  const searchBackends = Array.isArray(health?.backends) ? health.backends : [];
  const exa = searchBackends.find((b) => b !== null && typeof b === "object" && b.provider === "search" && b.name === "exa") ?? null;
  const fc = searchBackends.find((b) => b !== null && typeof b === "object" && b.provider === "search" && b.name === "firecrawl") ?? null;
  return [
    {
      id: "exa",
      label: t("cmd.preferExa"),
      detail: `${keyWord(exaKey, true, t)} · ${backendStatusWord(exa, t)}`,
      active: preferred === "exa"
    },
    {
      id: "firecrawl",
      label: t("cmd.preferFirecrawl"),
      detail: `${keyWord(fcKey, fcKeyless === true, t)} · ${backendStatusWord(fc, t)}`,
      active: preferred === "firecrawl"
    },
    {
      id: "test",
      label: t("cmd.test"),
      detail: probeWord(health?.probe ?? null, t)
    }
  ];
}
