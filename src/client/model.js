// Pure card model for the web_search toolview (C1). No React / CSS imports so
// the host-side test suite can unit-test it under plain node.
//
// Data source (verified against the pinned harness): the host's dsh-tool-web
// projects our seam result into the wire `resultView` —
//   { card: "web", kind: "search", title, sources, truncated, answer? }
// where `sources` are byte-projected to { url, title?, snippet?, publishedAt? }
// (snippet carries our verify.js marker prefix) and `answer` is our provider's
// `content` — receipt line first, then optional vendor text. `resultView` is
// null while the call runs (RunningToolCall), so the running state is derived
// from argsRaw alone. A settled call whose view is not a `web` search card
// (generic error view, older host) degrades to raw content text — never throws.

/** Marker label → visual tone. Closed list, keyed by the EXACT marker text
 *  our verify.js MARKERS emits — an unknown bracket prefix in a snippet is
 *  not a marker (avoids false-positive badges on `[Some Title]` snippets). */
const MARKER_TONE = {
  alive: "ok",
  verified: "ok",
  "verified·changed": "warn",
  unverified: "muted",
  "dead 404": "error",
  blocked: "error",
  timeout: "warn",
  unreachable: "error",
  skipped: "muted"
};

/** Leading marker shape from verify.js `markSnippet`: `[label]( detail)? rest`. */
const MARKER_RE = /^\[([^\]]+)\](?:\s*\(([^)]*)\))?\s*/;

/**
 * Parse our verification marker off a source snippet.
 * @param {string} snippet - the source snippet as it arrived on the wire.
 * @returns {{ marker: string, tone: string, detail: string | null, rest: string } | null}
 *   null when the snippet carries no known marker (verifyLevel off, or a
 *  host that stripped it) — the snippet then renders as-is.
 */
export function parseMarker(snippet) {
  if (typeof snippet !== "string" || snippet === "") return null;
  const m = snippet.match(MARKER_RE);
  if (m === null) return null;
  const tone = MARKER_TONE[m[1]];
  if (tone === undefined) return null;
  return { marker: m[1], tone, detail: m[2] || null, rest: snippet.slice(m[0].length) };
}

/**
 * The row title: the host's authoritative view title when present, else the
 * query list parsed from the raw args. A window-truncated replay may drop the
 * call head, so the settled form falls back to the resultView title.
 * @param {object} block - frozen RunningToolCall or ToolResultNode.
 * @returns {string} the title, possibly "" (the row renders bare then).
 */
export function queryTitle(block) {
  if ("kind" in block) {
    const view = block.resultView;
    if (view !== null && view !== undefined && view.card === "web" && view.kind === "search" && typeof view.title === "string" && view.title !== "") {
      return view.title;
    }
  }
  const argsRaw = ("kind" in block ? block.call?.argsRaw : block.argsRaw) ?? "";
  try {
    const parsed = JSON.parse(argsRaw);
    if (typeof parsed === "object" && parsed !== null && Array.isArray(parsed.queries)) {
      const queries = parsed.queries.filter((q) => typeof q === "string" && q !== "");
      if (queries.length > 0) return queries.join(", ");
    }
  } catch {
    // malformed argsRaw: bare row, same as the built-in web row's fallback
  }
  return "";
}

/** Flatten the settled result's content blocks to one text (the host's generic contract). */
function contentText(block) {
  const parts = [];
  for (const item of block.content ?? []) {
    if (item !== null && typeof item === "object" && item.type === "text" && typeof item.text === "string") parts.push(item.text);
  }
  const text = parts.join("\n").trim();
  return text === "" ? null : text;
}

/**
 * Derive the whole card from the frozen block. Pure: no subscriptions, no
 * host lookups — the view is a function of what the turn already knows.
 * @param {object} block - frozen RunningToolCall or ToolResultNode.
 * @returns the card model consumed by the row component.
 */
export function webSearchCardModel(block) {
  const settled = "kind" in block;
  const state = !settled ? "running" : block.error?.code === "interrupted" ? "stopped" : block.isError ? "error" : "ok";
  const model = { state, title: queryTitle(block), provenance: null, answer: null, truncated: false, sources: [], text: null };
  if (!settled) return model;

  if (state === "error") {
    model.text = contentText(block) ?? (block.error !== undefined ? `${block.error.name ?? "error"}: ${block.error.code ?? ""}` : null);
    return model;
  }

  const view = block.resultView;
  const web = view !== null && view !== undefined && view.card === "web" && view.kind === "search" && Array.isArray(view.sources) ? view : null;
  if (web === null) {
    // No structured web view (generic view, error path the host kept, or an
    // older host): degrade to the raw result text. Never throw — a malformed
    // view must still render, visibly.
    model.text = contentText(block);
    return model;
  }

  model.truncated = web.truncated === true;
  if (typeof web.answer === "string" && web.answer !== "") {
    // Our provider puts the one-line receipt FIRST in content; the host
    // forwards that content as the card's `answer`. Only claim provenance
    // when the first line really is our receipt — a foreign provider's
    // summary must not be dressed up as web-search-ext provenance.
    const nl = web.answer.indexOf("\n");
    const first = (nl === -1 ? web.answer : web.answer.slice(0, nl)).trim();
    if (first.startsWith("web-search-ext:")) {
      model.provenance = first;
      model.answer = nl === -1 ? null : web.answer.slice(nl + 1).trim() !== "" ? web.answer.slice(nl + 1).trim() : null;
    } else {
      model.answer = web.answer.trim() !== "" ? web.answer.trim() : null;
    }
  }
  for (const source of web.sources) {
    if (source === null || typeof source !== "object") continue;
    const snippet = typeof source.snippet === "string" ? source.snippet : "";
    const marker = parseMarker(snippet);
    model.sources.push({
      url: typeof source.url === "string" ? source.url : "",
      title: typeof source.title === "string" && source.title !== "" ? source.title : null,
      snippet: marker !== null ? marker.rest : snippet,
      publishedAt: typeof source.publishedAt === "string" ? source.publishedAt : null,
      badge: marker !== null ? { label: marker.marker, tone: marker.tone, detail: marker.detail } : null
    });
  }
  return model;
}
