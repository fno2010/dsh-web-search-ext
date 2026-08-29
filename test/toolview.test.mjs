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
import { parseMarker, queryTitle, webSearchCardModel } from "../src/client/model.js";

let passed = 0;
function ok(label) {
	passed++;
	console.log(`  ok ${label}`);
}

const RECEIPT = "web-search-ext: exa · 1.2s · 8 results · liveness: 6 alive, 1 dead, 1 blocked";

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
	ok("marker detail extracted; empty rest tolerated");
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

// ── webSearchCardModel: states ───────────────────────────────────────────────

// Running call: no resultView yet — the card shows query + running sweep only.
{
	const model = webSearchCardModel(runningBlock());
	assert.equal(model.state, "running");
	assert.equal(model.title, "quantum computing");
	assert.equal(model.provenance, null);
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
	assert.equal(model.provenance, RECEIPT);
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
	assert.equal(model.provenance, RECEIPT);
	assert.equal(model.answer, null, "trailing newline leaves no answer body");
	assert.equal(model.truncated, false);
	ok("settled ok: receipt-only answer → provenance only, no empty answer");
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
	assert.equal(model.provenance, null, "a foreign answer is not our receipt");
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
	assert.equal(model.provenance, null);
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
	assert.equal(model.provenance, null);
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

console.log(`\nAll ${passed} toolview model scenarios passed.`);
