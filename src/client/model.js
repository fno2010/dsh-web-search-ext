// Pure card model for the web_search toolview (C1). No React / CSS imports so
// the host-side test suite can unit-test it under plain node.
//
// Data source (verified against the installed harness): the host's
// dsh-tool-web projects our seam result into the wire `resultView` —
//   { card: "web", kind: "search", title, sources, truncated, answer? }
// where `sources` are byte-projected to { url, title?, snippet?, publishedAt? }
// (snippet carries our verify.js marker prefix) and `answer` is the tool's
// output `content`.
//
// `content` is single-query for one query, and for multiple queries the host
// merges per-query contents as `### <query>\n\n<content>\n\n### <query>…`
// (dsh-tool-web `mergeSearchResults`). Our provider's content is
// receipt-first, so every section of a merged answer opens with our receipt
// line.
//
// `resultView` is null while the call runs (RunningToolCall), so the running
// state is derived from argsRaw alone. A settled call whose view is not a
// `web` search card (generic view, older host) degrades to raw content text —
// never throws, and a non-pinned provider's answer is never claimed as our
// provenance.

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

/** Receipt prefix: our provenance line is only ever claimed from a line that
 *  starts with this (lib/index.js buildReceipt). */
const RECEIPT_PREFIX = "web-search-ext:";

/**
 * Parse the serving backend's label out of a claimed receipt line.
 * buildReceipt emits `web-search-ext: <label> · <seconds>s · …` where label
 * is the backend that answered the call ("exa-rest" / "exa-mcp" /
 * "firecrawl"). The per-source backend is NOT a wire field — dsh-tool-web's
 * projectSource keeps only url/title/snippet/publishedAt — so the receipt is
 * the card's only source of backend truth (all of a call's sources come
 * from that one backend; failover is per-call, not per-result).
 * @param {string} receipt - a claimed receipt line.
 * @returns {string | null} the backend label, or null when unparseable.
 */
function receiptBackend(receipt) {
  const rest = receipt.slice(RECEIPT_PREFIX.length).trimStart();
  const sep = rest.indexOf(" · ");
  const label = (sep === -1 ? rest : rest.slice(0, sep)).trim();
  return label !== "" ? label : null;
}

/**
 * Parse our verification marker off a source snippet. verify.js `markSnippet`
 * emits `[label] (detail) rest`, where `detail` is free text that may itself
 * contain parentheses (fetch error reasons), so the detail group is matched
 * with a balanced-paren scan, not a `[^)]*` regex (which truncates at the
 * first inner `)`).
 * @param {string} snippet - the source snippet as it arrived on the wire.
 * @returns {{ marker: string, tone: string, detail: string | null, rest: string } | null}
 *   null when the snippet carries no known marker (verifyLevel off, or a
 *  host that stripped it) — the snippet then renders as-is.
 */
export function parseMarker(snippet) {
  if (typeof snippet !== "string" || snippet === "") return null;
  if (snippet[0] !== "[") return null;
  const close = snippet.indexOf("]");
  if (close === -1) return null;
  const marker = snippet.slice(1, close);
  const tone = MARKER_TONE[marker];
  if (tone === undefined) return null;
  let restStart = close + 1;
  let detail = null;
  if (snippet[restStart] === " " && snippet[restStart + 1] === "(") {
    // Optional detail: "(…)" with the closing paren found by balance.
    let depth = 0;
    let end = -1;
    for (let i = restStart + 1; i < snippet.length; i += 1) {
      if (snippet[i] === "(") depth += 1;
      else if (snippet[i] === ")") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end !== -1) {
      detail = snippet.slice(restStart + 2, end) || null;
      restStart = end + 1;
    }
  }
  return {
    marker,
    tone,
    detail,
    rest: snippet.slice(restStart).replace(/^\s+/, "")
  };
}

/**
 * Whether a wire source URL is safe to render as a clickable link. The
 * mirror of the host's SafeLink policy: only public http(s) URLs are links;
 * everything else renders as inert text (the wire only guarantees a string,
 * and a nonconforming or malicious provider could carry javascript:/data:
 * URLs).
 * @param {unknown} url
 * @returns {boolean}
 */
export function isSafeHref(url) {
  if (typeof url !== "string" || url === "") return false;
  try {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
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
    if (
      view !== null &&
      view !== undefined &&
      view.card === "web" &&
      view.kind === "search" &&
      typeof view.title === "string" &&
      view.title !== ""
    ) {
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
    if (item !== null && typeof item === "object" && item.type === "text" && typeof item.text === "string") {
      parts.push(item.text);
    }
  }
  const text = parts.join("\n").trim();
  return text === "" ? null : text;
}

/**
 * Split a tool output answer into per-query sections. The host joins
 * multi-query results as `### <query>\n\n<content>` (dsh-tool-web
 * mergeSearchResults); a single-query answer is one section without a header.
 * An unanchored leading `###` line in provider text is treated as a section
 * boundary too — worst case a receipt-less foreign section, which is exactly
 * how foreign text is identified (no receipt claimed for it).
 * @param {string} answer
 * @returns {Array<{ query: string | null, body: string }>}
 */
function splitSections(answer) {
  const sections = [];
  const parts = answer.split(/\n(?=### )/);
  for (const part of parts) {
    const m = part.match(/^### ([^\n]*)\n/);
    if (m !== null) {
      sections.push({ query: m[1].trim() || null, body: part.slice(m[0].length).trim() });
    } else {
      sections.push({ query: null, body: part.trim() });
    }
  }
  return sections.filter((section) => section.body !== "");
}

/**
 * Extract (receipt, rest) pairs from one section body. A section contributes
 * a receipt only when one of its lines starts with our receipt prefix —
 * foreign provider text is never dressed up as web-search-ext provenance.
 * @param {string} body
 * @returns {{ receipt: string | null, rest: string | null }}
 */
function splitReceipt(body) {
  const lines = body.split("\n");
  const receiptIndex = lines.findIndex((line) => line.trimStart().startsWith(RECEIPT_PREFIX));
  if (receiptIndex === -1) {
    return { receipt: null, rest: body };
  }
  const receipt = lines[receiptIndex].trim();
  lines.splice(receiptIndex, 1);
  const rest = lines.join("\n").trim();
  return { receipt, rest: rest !== "" ? rest : null };
}

/**
 * Derive the whole card from the frozen block. Pure: no subscriptions, no
 * host lookups — the view is a function of what the turn already knows.
 * @param {object} block - frozen RunningToolCall or ToolResultNode.
 * @returns the card model consumed by the row component:
 *   { state, title, provenance: [{query, receipt, backend}], backends: string[],
 *     answer, truncated, sources: [{url,title,snippet,publishedAt,badge}], text }
 */
export function webSearchCardModel(block) {
  const settled = "kind" in block;
  const state = !settled
    ? "running"
    : block.error?.code === "interrupted"
      ? "stopped"
      : block.isError
        ? "error"
        : "ok";
  const model = {
    state,
    title: queryTitle(block),
    provenance: [],
    backends: [],
    answer: null,
    truncated: false,
    sources: [],
    text: null
  };
  if (!settled) return model;

  if (state === "error") {
    model.text =
      contentText(block) ??
      (block.error !== undefined
        ? `${block.error.name ?? "error"}: ${block.error.code ?? ""}`
        : null);
    return model;
  }

  const view = block.resultView;
  const web =
    view !== null &&
    view !== undefined &&
    view.card === "web" &&
    view.kind === "search" &&
    Array.isArray(view.sources)
      ? view
      : null;
  if (web === null) {
    // No structured web view (generic view, error path the host kept, or an
    // older host): degrade to the raw result text. Never throw — a malformed
    // view must still render, visibly.
    model.text = contentText(block);
    return model;
  }

  model.truncated = web.truncated === true;
  if (typeof web.answer === "string" && web.answer !== "") {
    // Our provider puts the one-line receipt FIRST in each sub-query's
    // content; the host forwards that content as the card's `answer`
    // (multi-query answers carry `### <query>` section headers). Claim
    // provenance only for lines that really are our receipt.
    const sections = splitSections(web.answer);
    const rest = [];
    for (const section of sections) {
      const { receipt, rest: restText } = splitReceipt(section.body);
      if (receipt !== null) {
        const backend = receiptBackend(receipt);
        model.provenance.push({ query: section.query, receipt, backend });
        if (backend !== null && !model.backends.includes(backend)) model.backends.push(backend);
      }
      // A claimed receipt carries the query label in the provenance section;
      // a receipt-less section keeps its `### <query>` header as raw text.
      if (restText !== null) {
        rest.push(receipt === null && section.query !== null ? `### ${section.query}\n${restText}` : restText);
      }
    }
    model.answer = rest.length > 0 ? rest.join("\n\n") : null;
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
