/**
 * Card-model tests for the web_search toolview (C1).
 * Run: node test/toolview.test.mjs
 *
 * The client card is a pure function of the frozen wire block, so the model
 * (src/client/model.js, no React/CSS imports) is unit-testable under node:
 * marker → badge mapping, receipt/provenance extraction, truncation flag,
 * error/stopped states, and the non-web-view fallback (never throws).
 */
import assert from "node:assert/strict";
import { isSafeHref, parseMarker, queryTitle, webSearchCardModel } from "../src/client/model.js";
import { commandOptions } from "../src/client/command.js";

let passed = 0;
function ok(label) {
	passed++;
	console.log(`  ok ${label}`);
}

const RECEIPT = "web-search-ext: exa-rest · 1.2s · 8 results · liveness: 6 alive, 1 dead, 1 blocked";

function webView(overrides = {}) {
	return {
		card: "web",
		kind: "search",
		title: "quantum computing",
		sources: [],
		truncated: false,
		...overrides
	};
}

function settledBlock(view, { isError = false, error, content = [] } = {}) {
	return {
		kind: "tool-result",
		seq: 1,
		time: 0,
		callId: "call_1",
		call: { name: "web_search", argsRaw: JSON.stringify({ queries: ["quantum computing"] }) },
		callTime: 0,
		content,
		isError,
		...(error !== undefined ? { error } : {}),
		callView: null,
		resultView: view,
		subCalls: []
	};
}

function runningBlock(argsRaw) {
	return {
		callId: "call_1",
		name: "web_search",
		argsRaw: argsRaw ?? JSON.stringify({ queries: ["quantum computing"] }),
		turn: 0,
		step: 0,
		time: 0,
		callView: null,
		subCalls: []
	};
}

// ── parseMarker: our verify.js marker grammar ───────────────────────────────

// Every shipped marker maps to the expected tone (lib/verify.js MARKERS keys:
// alive/consistent/changed/unverified/not_found/blocked|forbidden|unsafe|
// unsafe_url/timeout/error/aborted — the marker TEXTS here are what
// markSnippet actually prefixes).
{
	const cases = [
		["[alive]", "ok"],
		["[verified]", "ok"],
		["[verified·changed]", "warn"],
		["[unverified]", "muted"],
		["[dead 404]", "error"],
		["[blocked]", "error"],
		["[timeout]", "warn"],
		["[unreachable]", "error"],
		["[skipped]", "muted"]
	];
	for (const [prefix, tone] of cases) {
		const m = parseMarker(`${prefix} some snippet`);
		assert.equal(m.tone, tone, `${prefix} → ${tone}`);
		assert.equal(m.marker, prefix.replace(/[\[\]]/g, ""));
		assert.equal(m.detail, null);
		assert.equal(m.rest, "some snippet");
	}
	ok("all nine shipped markers map to their tones; detail absent; rest preserved");
}

// Detail form: "[verified·changed] (8/9 words) original" (lib/verify.js
// surfaces detail only for changed/error statuses).
{
	const m = parseMarker("[verified·changed] (8/9 words) The snippet body");
	assert.equal(m.tone, "warn");
	assert.equal(m.detail, "8/9 words");
	assert.equal(m.rest, "The snippet body");
	const m2 = parseMarker("[unreachable] (fetch failed) ");
	assert.equal(m2.detail, "fetch failed");
	assert.equal(m2.rest, "");
	// Detail with nested parens (fetch error reasons can carry them):
	// a `[^)]*` regex would truncate at the inner ")".
	const m3 = parseMarker("[unreachable] (error: connect ECONNREFUSED (127.0.0.1:443)) Body text");
	assert.equal(m3.detail, "error: connect ECONNREFUSED (127.0.0.1:443)");
	assert.equal(m3.rest, "Body text");
	// Unbalanced detail (no closing paren): no detail claimed, rest keeps it.
	const m4 = parseMarker("[timeout] (connect ETIMEDOUT Body");
	assert.equal(m4.detail, null);
	assert.equal(m4.rest, "(connect ETIMEDOUT Body");
	ok("marker detail extracted; balanced parens; unbalanced detail tolerated");
}

// Not a marker: absent, unknown bracket prefix, or a snippet that merely
// contains brackets later on. Unknown prefixes must NOT badge (a vendor
// snippet starting with "[Title]" is not our verification output).
{
	assert.equal(parseMarker(""), null);
	assert.equal(parseMarker("   "), null);
	assert.equal(parseMarker("[Some Title] body"), null);
	assert.equal(parseMarker("text [alive] inside"), null);
	assert.equal(parseMarker(undefined), null);
	assert.equal(parseMarker(null), null);
	ok("absent / unknown / embedded bracket prefixes parse to null (no false-positive badge)");
}

// Source links: only public http(s) anchors are clickable (mirrors the host's
// SafeLink policy — the wire only guarantees a string, and our own markers
// never introduce schemes, but a foreign snippet title can).
{
	const safe = [
		"https://a.example/x",
		"http://a.example",
		"https://a.example/x?y=1#z"
	];
	for (const url of safe) assert.equal(isSafeHref(url), true, url);
	const unsafe = [
		"javascript:alert(1)",
		"data:text/html,evil",
		"file:///etc/passwd",
		"/relative/path",
		"not a url",
		"",
		undefined,
		null
	];
	for (const url of unsafe) assert.equal(isSafeHref(url), false, String(url));
	ok("isSafeHref: http/https clickable; javascript:/data:/file:/relative/malformed inert");
}

// ── webSearchCardModel: states ───────────────────────────────────────────────

// Running call: no resultView yet — the card shows query + running sweep only.
{
	const model = webSearchCardModel(runningBlock());
	assert.equal(model.state, "running");
	assert.equal(model.title, "quantum computing");
	assert.equal(model.provenance.length, 0);
	assert.equal(model.sources.length, 0);
	assert.equal(model.truncated, false);
	assert.equal(model.text, null);
	ok("running: title from argsRaw, no card data, no throw");
}

// Multi-query argsRaw joins with ", " (the host's own title convention).
{
	const model = webSearchCardModel(runningBlock(JSON.stringify({ queries: ["q one", "q two"] })));
	assert.equal(model.title, "q one, q two");
	ok("running: multi-query title joined");
}

// C5: the running call's start time (the host's tool/call log time, Unix
// epoch ms — the only start-time fact the wire carries) is surfaced as
// startMs for the row's client-ticked elapsed label. Malformed/absent times
// degrade to null (the row shows the label without a number); settled blocks
// never expose a start time.
{
	assert.equal(webSearchCardModel({ ...runningBlock(), time: 1_000_000 }).startMs, 1_000_000);
	assert.equal(webSearchCardModel(runningBlock()).startMs, 0, "fixture time 0 is a valid epoch ms");
	for (const bad of ["123", Number.NaN, -1]) {
		const block = runningBlock();
		block.time = bad;
		assert.equal(webSearchCardModel(block).startMs, null, `time ${String(bad)} → null`);
	}
	const noTime = runningBlock();
	delete noTime.time;
	assert.equal(webSearchCardModel(noTime).startMs, null, "absent time → null");
	assert.equal(webSearchCardModel(settledBlock(webView())).startMs, null, "settled → null");
	ok("C5 running startMs: valid epoch ms surfaced; malformed/absent → null; settled → null");
}

// Settled ok, full structured web view: receipt becomes provenance, the rest
// of our content becomes the answer, badges parse, truncation passes through.
{
	const view = webView({
		title: "q1, q2",
		truncated: true,
		answer: `${RECEIPT}\nVendor summary text.`,
		sources: [
			{ url: "https://a.example/1", title: "A", snippet: "[alive] Snippet one", publishedAt: "2026-01-01" },
			{ url: "https://b.example/2", title: "B", snippet: "[dead 404] Gone" },
			{ url: "https://c.example/3", snippet: "[verified] Checked" }
		]
	});
	const model = webSearchCardModel(settledBlock(view));
	assert.equal(model.state, "ok");
	assert.equal(model.title, "q1, q2", "view title wins over argsRaw");
	assert.deepEqual(model.provenance, [{ query: null, receipt: RECEIPT, backend: "exa-rest" }]);
	assert.deepEqual(model.backends, ["exa-rest"], "single receipt → single backend");
	assert.equal(model.answer, "Vendor summary text.");
	assert.equal(model.truncated, true);
	assert.equal(model.sources.length, 3);
	assert.deepEqual(model.sources[0].badge, { label: "alive", tone: "ok", detail: null });
	assert.equal(model.sources[0].snippet, "Snippet one");
	assert.deepEqual(model.sources[1].badge, { label: "dead 404", tone: "error", detail: null });
	assert.equal(model.sources[2].badge.tone, "ok", "consistent → [verified] → ok");
	assert.equal(model.sources[2].title, null, "absent title stays null (hostname fallback in the row)");
	ok("settled ok: provenance/answer split, badges, snippet de-prefixed, truncation");
}

// Receipt-only answer (no vendor content, the common Exa REST/Firecrawl case).
{
	const view = webView({ answer: `${RECEIPT}\n`, sources: [] });
	const model = webSearchCardModel(settledBlock(view));
	assert.deepEqual(model.provenance, [{ query: null, receipt: RECEIPT, backend: "exa-rest" }]);
	assert.deepEqual(model.backends, ["exa-rest"]);
	assert.equal(model.answer, null, "trailing newline leaves no answer body");
	assert.equal(model.truncated, false);
	ok("settled ok: receipt-only answer → provenance only, no empty answer");
}

// Empty settled result (vendor returned nothing): structured web view with no
// sources, no answer, no truncation. The row must render the explicit empty
// note (row.noResults) rather than a bare, non-expandable row.
{
	const model = webSearchCardModel(settledBlock(webView()));
	assert.equal(model.state, "ok");
	assert.equal(model.provenance.length, 0);
	assert.equal(model.sources.length, 0);
	assert.equal(model.answer, null);
	assert.equal(model.text, null, "a web view has no raw-text fallback");
	assert.equal(model.truncated, false);
	ok("settled ok with empty result shape: nothing claimed, no throw");
}

// Multi-query merge (host dsh-tool-web mergeSearchResults shape): each sub-query
// section is `### <query>\n\n<receipt>…`. Every section's receipt is claimed as
// its own provenance entry (with the query label), headers and receipts are
// stripped from the answer body, and vendor text survives as the answer.
{
	const r1 = "web-search-ext: exa-rest · 1.2s · 8 results · liveness: 8 alive";
	const r2 = "web-search-ext: exa-rest · 0.9s · 5 results · liveness: 4 alive, 1 dead";
	const view = webView({
		title: "harness release notes, dsh toolview slots",
		answer: `### harness release notes\n\n${r1}\n\n### dsh toolview slots\n\n${r2}\n\nVendor follow-up text for the second query.`,
		sources: [{ url: "https://a.example/1", snippet: "[alive] One" }]
	});
	const model = webSearchCardModel(settledBlock(view));
	assert.deepEqual(model.provenance, [
		{ query: "harness release notes", receipt: r1, backend: "exa-rest" },
		{ query: "dsh toolview slots", receipt: r2, backend: "exa-rest" }
	]);
	assert.deepEqual(model.backends, ["exa-rest"], "identical backends dedupe");
	assert.equal(model.answer, "Vendor follow-up text for the second query.", "receipts+headers stripped, vendor text kept, no re-prefixed headers");
	ok("multi-query merge: per-query receipts claimed with labels, answer de-duplicated");
}

// C4: multi-backend merge — a 429 failover mid-flight serves sub-queries from
// different backends (real buildReceipt labels: exa-rest / exa-mcp /
// firecrawl). The drill-down shows the honest union; attribution per source
// is not a wire fact, so the card says "merged".
{
	const r1 = "web-search-ext: exa-rest · 1.1s · 5 results · liveness: 5 alive";
	const r2 = "web-search-ext: firecrawl · 2.3s · 3 results · liveness: 2 alive, 1 dead";
	const view = webView({
		title: "q one, q two",
		answer: `### q one\n\n${r1}\n\n### q two\n\n${r2}`,
		sources: []
	});
	const model = webSearchCardModel(settledBlock(view));
	assert.deepEqual(model.provenance, [
		{ query: "q one", receipt: r1, backend: "exa-rest" },
		{ query: "q two", receipt: r2, backend: "firecrawl" }
	]);
	assert.deepEqual(model.backends, ["exa-rest", "firecrawl"], "union, first-seen order");
	// Malformed receipts: the line is still claimed as provenance, but its
	// "backend" must not display as garbage. Three shapes: empty label, a "·"
	// glued to the label without spaces, and a free-text label with a space —
	// all fall outside the kebab-label bound (receiptBackend in model.js).
	const bad = webSearchCardModel(settledBlock(webView({ answer: "web-search-ext:  · 1.2s · 5 results" })));
	assert.equal(bad.provenance[0].backend, null, "empty-label receipt claims provenance but no backend");
	assert.deepEqual(bad.backends, []);
	const glued = webSearchCardModel(settledBlock(webView({ answer: "web-search-ext: exa-rest·1s · 5 results" })));
	assert.equal(glued.provenance[0].backend, null, "no-space separator: label outside the kebab bound");
	assert.deepEqual(glued.backends, []);
	const free = webSearchCardModel(settledBlock(webView({ answer: "web-search-ext: totally-not-a-label whatever" })));
	assert.equal(free.provenance[0].backend, null, "free-text label: outside the kebab bound");
	assert.deepEqual(free.backends, []);
	ok("C4 backend: two backends in one merge → per-entry labels + union");
}

// Multi-query merge where a sub-section carries no receipt (host text is
// provider-owned): that section keeps its `### <query>` header as raw answer
// text and contributes no provenance.
{
	const view = webView({
		answer: `### q1\n\n${RECEIPT}\n\n### q2\n\nforeign provider section text`,
		sources: []
	});
	const model = webSearchCardModel(settledBlock(view));
	assert.deepEqual(model.provenance, [{ query: "q1", receipt: RECEIPT, backend: "exa-rest" }]);
	assert.equal(model.answer, "### q2\nforeign provider section text", "receipt-less section keeps its header");
	ok("multi-query merge: receipt-less section stays foreign text with header");
}

// verifyLevel off: snippets carry no markers → no badges, snippets untouched.
{
	const view = webView({
		answer: RECEIPT,
		sources: [{ url: "https://a.example/1", snippet: "Plain snippet, no markers" }]
	});
	const model = webSearchCardModel(settledBlock(view));
	assert.equal(model.sources[0].badge, null);
	assert.equal(model.sources[0].snippet, "Plain snippet, no markers");
	ok("verifyLevel off: badgeless sources render verbatim");
}

// The seam is not pinned to us (another provider answers web_search): no
// receipt prefix in the answer → no provenance line (never mislabel). Badge
// policy stays marker-driven: a leading marker is still shown (the marker is
// self-describing), an embedded one is not.
{
	const view = webView({
		answer: "Some other provider's summary line.",
		sources: [
			{ url: "https://a.example/1", title: "A", snippet: "[alive] Their snippet" },
			{ url: "https://b.example/2", title: "B", snippet: "Their text with [alive] embedded" }
		]
	});
	const model = webSearchCardModel(settledBlock(view));
	assert.equal(model.provenance.length, 0, "a foreign answer is not our receipt");
	assert.deepEqual(model.backends, [], "no receipt → no backend claim");
	assert.equal(model.answer, "Some other provider's summary line.");
	assert.equal(model.sources[0].badge.tone, "ok", "leading marker in a foreign snippet still badges");
	assert.equal(model.sources[1].badge, null, "embedded marker does not badge");
	ok("non-pinned provider: no provenance line, marker-driven badges, clean source list");
}

// Error: the row summary is the first content line (or the error name:code).
{
	const model = webSearchCardModel(
		settledBlock(webView(), { isError: true, content: [{ type: "text", text: "web_search: all backends failed — exa: 429 | firecrawl: 401\nsecond line" }] })
	);
	assert.equal(model.state, "error");
	assert.equal(model.provenance.length, 0);
	assert.ok(model.text.startsWith("web_search: all backends failed"));
	ok("error: state + full text for the row");
}

{
	const model = webSearchCardModel(
		settledBlock(null, { isError: true, error: { name: "WEB_TIMEOUT", code: "WEB_TIMEOUT" }, content: [] })
	);
	assert.equal(model.state, "error");
	assert.equal(model.text, "WEB_TIMEOUT: WEB_TIMEOUT");
	ok("error with no content: error name:code line");
}

// Interrupted → "stopped" (the host's interrupted error code).
{
	const model = webSearchCardModel(
		settledBlock(null, { isError: true, error: { name: "Interrupted", code: "interrupted" }, content: [] })
	);
	assert.equal(model.state, "stopped");
	ok("interrupted error → stopped state");
}

// No structured web view at all (generic view / older host / malformed):
// degrade to the raw content text. Never throws.
{
	const view = { card: "generic", title: "x", body: "should be ignored" };
	const model = webSearchCardModel(settledBlock(view, { content: [{ type: "text", text: "raw fallback text" }] }));
	assert.equal(model.state, "ok");
	assert.equal(model.text, "raw fallback text");
	assert.equal(model.provenance.length, 0);
	assert.equal(model.sources.length, 0);
	const nullView = webSearchCardModel(settledBlock(null, { content: [{ type: "text", text: "raw" }] }));
	assert.equal(nullView.text, "raw");
	// A web view whose sources are not an array is treated as malformed.
	const badView = webSearchCardModel(settledBlock({ card: "web", kind: "search", title: "t", sources: "nope" }, { content: [{ type: "text", text: "raw2" }] }));
	assert.equal(badView.text, "raw2");
	ok("non-web / null / malformed view: raw-text fallback, no throw");
}

// Window-truncated replay: the call head is dropped (call: null) — the title
// still comes from the resultView.
{
	const block = settledBlock(webView({ title: "kept title" }));
	block.call = null;
	const model = webSearchCardModel(block);
	assert.equal(model.title, "kept title");
	ok("window-truncated replay: title survives via resultView");
}

// Empty / malformed argsRaw on a running call: bare title, no throw.
{
	assert.equal(webSearchCardModel(runningBlock("")).title, "");
	assert.equal(webSearchCardModel(runningBlock("{not json")).title, "");
	assert.equal(webSearchCardModel(runningBlock(JSON.stringify({ queries: [] }))).title, "");
	ok("running with empty/malformed/empty-queries argsRaw: bare row");
}

// C3: /search-engine command options (src/client/command.js, pure model).
// The fake translator echoes its key plus the interpolated params, so the
// assertions pin both the closed vocabulary and the exact param flow.
const tEcho = (key, params) =>
	params && typeof params === "object" ? key + " " + JSON.stringify(params) : key;

// Happy path: configured keys, live search backends, stored probe.
{
	const now = Date.now();
	const health = {
		backends: [
			{ provider: "search", name: "exa", label: "Exa", attempts: 5, ok: 5, failed: 0, lastCallAt: now - 7_200_000, lastCallMs: 321, lastOk: true, cooldownRemainingMs: 0 },
			{ provider: "search", name: "firecrawl", label: "Firecrawl", attempts: 2, ok: 0, failed: 2, lastCallAt: now - 60_000, lastCallMs: 800, lastOk: false, cooldownRemainingMs: 45_000 }
		],
		probe: {
			at: now - 7_200_000,
			backends: [
				{ name: "exa", label: "Exa", status: "ok", detail: "ok", ms: 412 },
				{ name: "firecrawl", label: "Firecrawl", status: "fail", detail: "auth", ms: 96 }
			]
		}
	};
	const opts = commandOptions({
		t: tEcho,
		preferred: "firecrawl",
		exaKey: { configured: true, writable: true, source: "env" },
		fcKey: { configured: true, writable: true, source: "file" },
		fcKeyless: true,
		health
	});
	assert.deepEqual(opts.map((o) => o.id), ["exa", "firecrawl", "test"]);
	assert.equal(opts[0].detail, `cmd.keyedEnv · cmd.lastOk ${JSON.stringify({ time: "2h 0m" })}`);
	assert.equal(opts[1].detail, `cmd.keyedFile · cmd.cooldown ${JSON.stringify({ time: "45s" })}`);
	assert.equal(opts[0].active, false);
	assert.equal(opts[1].active, true);
	assert.ok(!("active" in opts[2]), "test row carries no active flag");
	assert.equal(opts[2].detail, `cmd.testLast ${JSON.stringify({ age: "2h 0m", codes: "Exa probe.ok · Firecrawl probe.auth" })}`);
	ok("C3 command options: keys + live backends + stored probe → active flags and detail words");
}

// Degraded: health unavailable, no keys, keyless only for exa.
{
	const opts = commandOptions({
		t: tEcho,
		preferred: "exa",
		exaKey: null,
		fcKey: null,
		fcKeyless: false,
		health: null
	});
	assert.equal(opts[0].detail, "cmd.keyless · cmd.never");
	assert.equal(opts[1].detail, "cmd.keyMissing · cmd.never");
	assert.equal(opts[2].detail, "cmd.neverTested");
	assert.equal(opts[0].active, true);
	assert.equal(opts[1].active, false);
	assert.ok(!("active" in opts[2]), "test row carries no active flag");
	ok("C3 command options: degraded health + key states → never words, no throw");
}

// Probe edge: malformed backend entries are skipped, closed codes map through probe.*.
{
	const now = Date.now();
	const opts = commandOptions({
		t: tEcho,
		preferred: "exa",
		exaKey: { configured: true, writable: true, source: "" },
		fcKey: null,
		fcKeyless: true,
		health: {
			backends: [],
			probe: {
				at: now - 7_200_000,
				backends: [{ label: "Exa", detail: "ok" }, { label: null }, { label: "FC", detail: "disabled" }]
			}
		}
	});
	assert.equal(opts[0].detail, `cmd.keyedFile · cmd.never`);
	assert.equal(opts[1].detail, `cmd.keyless · cmd.never`);
	assert.equal(opts[2].detail, `cmd.testLast ${JSON.stringify({ age: "2h 0m", codes: "Exa probe.ok · FC probe.disabled" })}`);
	ok("C3 command options: malformed probe rows skipped, closed codes translated");
}

// Sentinel: the scenario count lives in-test, never in docs.
assert.equal(passed, 24, "scenario sentinel");

console.log(`\nAll ${passed} toolview model scenarios passed.`);
