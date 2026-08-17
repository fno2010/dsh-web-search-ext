/**
 * Failover and mapping tests for dsh-web-search-ext.
 * Run: node test/failover.test.mjs
 *
 * Part A: mocked fetch — Exa anonymous MCP result mapping and abort handling.
 * Part B: live smoke — one real keyless call to the Exa anonymous MCP.
 */
import assert from "node:assert/strict";
import { MultiBackendSearchProvider, Config, PROVIDER_ID } from "../lib/index.js";

const DEFAULTS = {
	exaMcpUrl: "https://mcp.exa.ai/mcp",
	numResults: 8,
	maxSnippetChars: 500,
	rateLimitCooldownSec: 60
};

// A mock plugin context: no credentials service, launch env = process.env.
function makeCtx() {
	return { get: (key) => undefined };
}

// A provider whose options can be mutated between calls; the real class
// snapshots options per search through the injected thunk, so mutating the
// box re-shapes the next search exactly as a live settings commit would.
function providerWith(options) {
	const box = { ...options };
	const p = new MultiBackendSearchProvider(makeCtx(), () => box);
	p.setOptions = (patch) => Object.assign(box, patch);
	return p;
}

function jsonResponse(status, body) {
	return {
		status,
		ok: status >= 200 && status < 300,
		json: async () => (typeof body === "string" ? JSON.parse(body) : body),
		text: async () => (typeof body === "string" ? body : JSON.stringify(body))
	};
}

const realFetch = globalThis.fetch;
function mockFetch(handler) {
	globalThis.fetch = async (url, init) => handler(String(url), init);
}
function restoreFetch() {
	globalThis.fetch = realFetch;
}

// ── Part A: mocked behavior ──────────────────────────────────────────────────

const EXA_MCP_OK = JSON.stringify({
	jsonrpc: "2.0",
	id: "x",
	result: {
		content: [
			{
				type: "text",
				text:
					"Title: First result\nURL: https://a.example/1\nPublished: N/A\nAuthor: N/A\nHighlights:\nFirst highlight sentence.\n\n---\n\nTitle: Second result\nURL: https://a.example/2\nPublished: 2026-01-02\nAuthor: N/A\nHighlights:\nSecond highlight sentence."
			}
		]
	}
});

let passed = 0;
function ok(label) {
	passed++;
	console.log(`  ok ${label}`);
}

// 1. Exa anonymous MCP happy path maps Title/URL/Published/Highlights.
{
	mockFetch(async () => jsonResponse(200, EXA_MCP_OK));
	const p = providerWith(DEFAULTS);
	assert.equal(p.id, PROVIDER_ID);
	assert.equal(p.available(), true);
	const result = await p.search({ query: "hello" });
	assert.equal(result.sources.length, 2);
	assert.equal(result.sources[0].url, "https://a.example/1");
	assert.equal(result.sources[0].snippet, "First highlight sentence.");
	assert.equal(result.sources[0].publishedAt, undefined, "N/A publishedAt is dropped");
	assert.equal(result.sources[1].publishedAt, "2026-01-02");
	assert.equal(result.truncated, false);
	restoreFetch();
	ok("exa MCP happy path maps Title/URL/Highlights, drops N/A");
}

// 6. abort already signaled → immediate WEB_ABORTED, no network.
{
	mockFetch(async () => jsonResponse(200, EXA_MCP_OK));
	const controller = new AbortController();
	controller.abort(new Error("user cancelled"));
	const p = providerWith(DEFAULTS);
	await assert.rejects(
		() => p.search({ query: "hello" }, controller.signal),
		(error) => error.code === "WEB_ABORTED"
	);
	restoreFetch();
	ok("pre-aborted signal throws WEB_ABORTED before any request");
}

console.log(`\nPart A: ${passed}/2 scenarios passed`);

// ── Part B: live smoke (real endpoints, keyless) ────────────────────────────

console.log("\nPart B: live smoke tests (real network)");
restoreFetch();

// B1: exa anonymous MCP through the provider.
{
	const p = providerWith({ ...DEFAULTS, firecrawlKeyless: false, numResults: 3 });
	const result = await p.search({ query: "DeepSeek Harness agent harness" });
	assert.ok(result.sources.length >= 1, "exa anonymous returned sources");
	for (const source of result.sources) {
		assert.ok(source.url.startsWith("http"), `source url well-formed: ${source.url}`);
		assert.ok(source.snippet.length > 0, "snippet present");
	}
	console.log(`  ok exa anonymous MCP live: ${result.sources.length} sources, first: ${result.sources[0].title ?? result.sources[0].url}`);
}

console.log(`\nAll tests passed.`);
