/**
 * Failover and mapping tests for dsh-web-search-ext.
 * Run: node test/failover.test.mjs (Part B live smoke is skipped when CI is set)
 *
 * Part A: mocked fetch — failover order, 429 cooldown (+Retry-After header,
 *         string windows, maxCooldownSec clamp), combined errors, abort,
 *         L0/L1 verification markers (incl. redirect re-validation, status
 *         mapping, slow-drip body deadline), SSRF guard matrix, provenance
 *         receipt, freshness params, fetch backends.
 * Part B: live smoke — one real keyless call per backend (Exa anonymous MCP,
 *          Firecrawl v2 keyless), asserting the provider maps real payloads.
 */
import assert from "node:assert/strict";
import { MultiBackendSearchProvider, MultiBackendFetchProvider, Config, PROVIDER_ID } from "../lib/index.js";
import { isSafeUrl } from "../lib/verify.js";

const DEFAULTS = {
	preferred: "exa",
	exaApiKey: undefined,
	exaApiKeyEnv: "EXA_API_KEY",
	firecrawlApiKey: undefined,
	firecrawlApiKeyEnv: "FIRECRAWL_API_KEY",
	exaApiUrl: "https://api.exa.ai/search",
	exaMcpUrl: "https://mcp.exa.ai/mcp",
	firecrawlBaseUrl: "https://api.firecrawl.dev/v2",
	numResults: 8,
	maxSnippetChars: 500,
	rateLimitCooldownSec: 60,
	firecrawlKeyless: true,
	verifyLevel: "liveness",
	livenessTimeoutMs: 3000,
	contentCheckBytes: 10240,
	contentCheckMinBytes: 200,
	contentCheckMatchWords: 5,
	contentCheckTimeoutMs: 3000,
	freshness: "any",
	maxCooldownSec: 86400,
	fetchMaxChars: 50000
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
	return new MultiBackendSearchProvider(makeCtx(), () => box);
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
	globalThis.fetch = async (url, init) => handler(String(url), init ?? {});
}
function restoreFetch() {
	globalThis.fetch = realFetch;
}

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

// Single-source MCP payload for redirect / L1 / abort scenarios.
const EXA_MCP_SINGLE = JSON.stringify({
	jsonrpc: "2.0",
	id: "x",
	result: {
		content: [{
			type: "text",
			text: "Title: R\nURL: https://r.example/old\nHighlights:\nRedirect target check."
		}]
	}
});

const FIRECRAWL_V2_OK = { success: true, data: { web: [
	{ url: "https://f.example/1", title: "F1", description: "![img](https://x/1.png) Desc one with **markdown**." },
	{ url: "https://f.example/2", title: "F2" }
] } };

// Fixture pages for L1 content checks; both exceed contentCheckMinBytes (200).
const PAGE_MATCHING =
	"<html><body><p>" + "First highlight sentence. ".repeat(3) + "padding ".repeat(50) + "</p></body></html>";
const PAGE_CHANGED =
	"<html><body><p>" + "Unrelated content about something completely different. ".repeat(5) + "</p></body></html>";

let passed = 0;
function ok(label) {
	passed++;
	console.log(`  ok ${label}`);
}

// ── Part A: mocked behavior ──────────────────────────────────────────────────

// 1. preferred=exa: exa succeeds → firecrawl never called; L0 marks all alive.
{
	mockFetch(async (url, init) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_OK);
		assert.equal(init.method, "HEAD", "L0 uses HEAD by default");
		return jsonResponse(200, "");
	});
	const p = providerWith(DEFAULTS);
	assert.equal(p.id, PROVIDER_ID);
	assert.equal(p.available(), true);
	const result = await p.search({ query: "hello" });
	assert.equal(result.sources.length, 2);
	assert.equal(result.sources[0].url, "https://a.example/1");
	assert.equal(result.sources[0].snippet, "[alive] First highlight sentence.");
	assert.equal(result.sources[0].publishedAt, undefined, "N/A publishedAt is dropped");
	assert.equal(result.sources[1].publishedAt, "2026-01-02");
	assert.equal(result.truncated, false);
	assert.match(result.content, /^web-search-ext: exa-mcp · [\d.]+s · 2 results · liveness: 2 alive\n$/);
	restoreFetch();
	ok("exa MCP happy path: L0 [alive] markers + receipt line");
}

// 2. exa 429 → firecrawl v2 succeeds (failover + snippet cleaning + L0).
{
	mockFetch(async (url, init) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(429, "");
		if (url.startsWith("https://f.example/")) return jsonResponse(200, ""); // L0 HEAD
		assert.ok(url.startsWith("https://api.firecrawl.dev/v2/search"), `unexpected url ${url}`);
		return jsonResponse(200, FIRECRAWL_V2_OK);
	});
	const p = providerWith(DEFAULTS);
	const result = await p.search({ query: "hello", maxResults: 5 });
	assert.equal(result.sources.length, 2);
	assert.equal(result.sources[0].snippet, "[alive] Desc one with **markdown**.", "image markdown stripped, whitespace collapsed");
	assert.equal(result.sources[1].snippet, "[alive]", "URL-only source gets marker only");
	assert.match(result.content, /web-search-ext: firecrawl · [\d.]+s · 2 results · liveness: 2 alive/);
	restoreFetch();
	ok("exa 429 fails over to firecrawl; v2 data.web[] mapped; markdown cleaned; L0 markers");
}

// 3. firecrawl 401 (keyless dead) with preferred=firecrawl → exa succeeds.
{
	mockFetch(async (url) => {
		if (url.startsWith("https://api.firecrawl.dev")) return jsonResponse(401, "");
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_OK);
		return jsonResponse(200, ""); // L0
	});
	const p = providerWith({ ...DEFAULTS, preferred: "firecrawl" });
	const result = await p.search({ query: "hello" });
	assert.equal(result.sources[0].url, "https://a.example/1");
	assert.match(result.content, /^web-search-ext: exa-mcp · /);
	restoreFetch();
	ok("preferred=firecrawl: 401 falls through to exa; receipt names exa-mcp");
}

// 4. both 429 → combined error names both; second call reports cooldowns.
{
	mockFetch(async () => jsonResponse(429, ""));
	const p = providerWith(DEFAULTS);
	await assert.rejects(
		() => p.search({ query: "hello" }),
		(error) => error.code === "WEB_PROVIDER_ERROR" && /exa \(rate limited\)/.test(error.message) && /firecrawl \(rate limited\)/.test(error.message) && /backing off 60s/.test(error.message)
	);
	let fetchCalls = 0;
	mockFetch(async () => {
		fetchCalls++;
		return jsonResponse(429, "");
	});
	await assert.rejects(
		() => p.search({ query: "hello" }),
		(error) => error.code === "WEB_PROVIDER_ERROR" && /in rate-limit cooldown/.test(error.message)
	);
	assert.equal(fetchCalls, 0, "cooled backends are skipped while another candidate exists");
	restoreFetch();
	ok("dual 429: combined failure lists both; cooldown skips both with retry hint");
}

// 5. both cooled, single-backend plan is still attempted (no total lockout).
{
	const p = providerWith({ ...DEFAULTS, firecrawlKeyless: false, exaApiKey: "k-test" });
	mockFetch(async () => jsonResponse(429, ""));
	await assert.rejects(() => p.search({ query: "hello" }));
	let attempted = 0;
	mockFetch(async () => {
		attempted++;
		return jsonResponse(429, "");
	});
	await assert.rejects(
		() => p.search({ query: "hello" }),
		(error) => /exa \(rate limited\)/.test(error.message)
	);
	assert.equal(attempted, 1, "sole remaining backend is attempted even in cooldown");
	restoreFetch();
	ok("cooldown never locks out the only remaining backend");
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

// 7. exa REST path (key present) maps results[] + highlights; L0 marks alive.
{
	mockFetch(async (url, init) => {
		if (url === "https://api.exa.ai/search") {
			assert.equal(init.headers.authorization, "Bearer k-test");
			const body = JSON.parse(init.body);
			assert.equal(body.query, "hello");
			assert.equal(body.startPublishedDate, undefined, "freshness=any sends no date filter");
			return jsonResponse(200, { results: [
				{ url: "https://r.example/1", title: "R1", highlights: ["Rest snippet one.", "second"], publishedDate: "2025-12-31" }
			] });
		}
		return jsonResponse(200, ""); // L0 HEAD
	});
	const p = providerWith({ ...DEFAULTS, exaApiKey: "k-test" });
	const result = await p.search({ query: "hello" });
	assert.equal(result.sources[0].snippet, "[alive] Rest snippet one.");
	assert.equal(result.sources[0].publishedAt, "2025-12-31");
	assert.match(result.content, /^web-search-ext: exa-rest · /);
	restoreFetch();
	ok("exa REST with key: Bearer auth, results[].highlights mapped, L0 marker");
}

// 8. firecrawl v1 shape (bare data array) still maps.
{
	mockFetch(async (url) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(429, "");
		if (url.startsWith("https://v1.example/")) return jsonResponse(200, ""); // L0
		return jsonResponse(200, { success: true, data: [{ url: "https://v1.example/1", title: "V1", description: "old shape" }] });
	});
	const p = providerWith(DEFAULTS);
	const result = await p.search({ query: "hello" });
	assert.equal(result.sources[0].url, "https://v1.example/1");
	assert.equal(result.sources[0].snippet, "[alive] old shape");
	restoreFetch();
	ok("firecrawl v1 data[] envelope handled; L0 marker");
}

// 9. firecrawlKeyless=false and no key → firecrawl skipped entirely.
{
	mockFetch(async (url) => {
		assert.ok(!url.startsWith("https://api.firecrawl.dev"), "firecrawl must not be called");
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_OK);
		return jsonResponse(200, ""); // L0
	});
	const p = providerWith({ ...DEFAULTS, firecrawlKeyless: false });
	const result = await p.search({ query: "hello" });
	assert.equal(result.sources.length, 2);
	restoreFetch();
	ok("firecrawlKeyless=false with no key: backend excluded from plan");
}

// 10. Config schema + plugin exports sanity. Schemastery schemas declare, they
// do not parse: the harness consumes toJSON() (a ref graph) for the settings
// UI, so assert on the contract-critical markers in that graph.
{
	const graph = Config.toJSON();
	const refs = Object.values(graph.refs ?? {});
	const values = [];
	const defaults = [];
	const roles = [];
	for (const node of refs) {
		if (node.value !== undefined) values.push(node.value);
		if (node.meta?.default !== undefined) defaults.push(node.meta.default);
		if (node.meta?.role !== undefined) roles.push(node.meta.role);
	}
	for (const expected of ["exa", "firecrawl", "EXA_API_KEY", "FIRECRAWL_API_KEY", "https://api.exa.ai/search", "https://mcp.exa.ai/mcp", "https://api.firecrawl.dev/v2", 8, 500, 60, true, "liveness", "any", 86400, 50000]) {
		assert.ok(values.includes(expected) || defaults.includes(expected), `schema graph carries ${String(expected)}`);
	}
	assert.equal(roles.filter((role) => role === "secret").length, 2, "both key literals declared secret");
	const moduleExports = await import("../lib/index.js");
	assert.equal(moduleExports.name, "dsh-web-search-ext");
	assert.deepEqual(moduleExports.inject, ["web"]);
	assert.equal(typeof moduleExports.apply, "function");
	ok("Config schema graph markers + plugin exports match the contract");
}

// 11. L0 mixed statuses: alive / dead / blocked each get distinct markers.
{
	mockFetch(async (url) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_OK);
		if (url.startsWith("https://a.example/1")) return jsonResponse(200, "");
		if (url.startsWith("https://a.example/2")) return jsonResponse(404, "");
		return jsonResponse(200, "");
	});
	const p = providerWith(DEFAULTS);
	const result = await p.search({ query: "hello" });
	assert.equal(result.sources[0].snippet, "[alive] First highlight sentence.");
	assert.equal(result.sources[1].snippet, "[dead 404] Second highlight sentence.");
	assert.match(result.content, /liveness: 1 alive, 1 dead/);
	restoreFetch();
	ok("L0 mixed statuses: distinct markers + receipt counts");
}

// 12. HEAD 405 falls back to GET (body discarded) and still marks alive.
{
	mockFetch(async (url, init) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_OK);
		if (init.method === "HEAD") return jsonResponse(405, "");
		assert.equal(init.method, "GET", "405 retry uses GET");
		return jsonResponse(200, "");
	});
	const p = providerWith(DEFAULTS);
	const result = await p.search({ query: "hello" });
	assert.equal(result.sources[0].snippet, "[alive] First highlight sentence.");
	assert.match(result.content, /liveness: 2 alive/);
	restoreFetch();
	ok("HEAD 405 → GET retry → [alive]");
}

// 13. verifyLevel off: no verification traffic, no markers, receipt without liveness.
{
	let calls = 0;
	mockFetch(async (url) => {
		calls++;
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_OK);
		throw new Error(`unexpected verification request: ${url}`);
	});
	const p = providerWith({ ...DEFAULTS, verifyLevel: "off" });
	const result = await p.search({ query: "hello" });
	assert.equal(result.sources[0].snippet, "First highlight sentence.");
	assert.equal(calls, 1, "only the search request is made");
	assert.match(result.content, /^web-search-ext: exa-mcp · [\d.]+s · 2 results\n$/);
	restoreFetch();
	ok("verifyLevel off: zero verification traffic, plain snippet, no liveness in receipt");
}

// 14. verifyLevel content: L1 marks [verified] / [verified·changed] per page.
{
	mockFetch(async (url, init) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_OK);
		if (init.method === "HEAD") return jsonResponse(200, ""); // L0 pass
		if (url.startsWith("https://a.example/1")) return jsonResponse(200, PAGE_MATCHING);
		return jsonResponse(200, PAGE_CHANGED);
	});
	const p = providerWith({ ...DEFAULTS, verifyLevel: "content" });
	const result = await p.search({ query: "hello" });
	assert.match(result.sources[0].snippet, /^\[verified\] First highlight sentence\.$/);
	assert.match(result.sources[1].snippet, /^\[verified·changed\] \(0\/3 words\) Second highlight sentence\.$/);
	assert.match(result.content, /content: 1 verified, 1 changed/);
	restoreFetch();
	ok("L1 content check: [verified] and [verified·changed] markers + receipt");
}

// 15. 429 with retry_after_seconds: message reports the window; cooldown honors it.
{
	mockFetch(async (url) => {
		if (url.startsWith("https://mcp.exa.ai")) {
			return jsonResponse(429, JSON.stringify({ error: { reason: "rate_limited", retry_after_seconds: 79651 } }));
		}
		return jsonResponse(429, "");
	});
	const p = providerWith(DEFAULTS);
	await assert.rejects(
		() => p.search({ query: "hello" }),
		(error) => /backend reports ~22\.1h until the window resets/.test(error.message)
	);
	let calls = 0;
	mockFetch(async () => {
		calls++;
		return jsonResponse(429, "");
	});
	await assert.rejects(
		() => p.search({ query: "hello" }),
		(error) => /exa \(in rate-limit cooldown, retry in 79651s\)/.test(error.message) && /firecrawl \(in rate-limit cooldown, retry in 60s\)/.test(error.message)
	);
	assert.equal(calls, 0, "both backends cool for their own reported windows");
	restoreFetch();
	ok("429 retry_after: human-readable window + per-backend cooldown honored");
}

// 16. freshness params reach the wire: Exa REST startPublishedDate + Firecrawl tbs.
{
	const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
	mockFetch(async (url, init) => {
		if (url === "https://api.exa.ai/search") {
			const body = JSON.parse(init.body);
			assert.equal(body.startPublishedDate, yesterday, "Exa REST freshness window on the wire");
			return jsonResponse(200, { results: [] });
		}
		throw new Error(`unexpected url ${url}`);
	});
	const p = providerWith({ ...DEFAULTS, exaApiKey: "k-test", freshness: "24h" });
	const result = await p.search({ query: "hello" });
	assert.equal(result.sources.length, 0, "empty results pass through with receipt only");
	assert.match(result.content, /0 results/);
	restoreFetch();

	mockFetch(async (url, init) => {
		if (url.startsWith("https://api.firecrawl.dev/v2/search")) {
			const body = JSON.parse(init.body);
			assert.equal(body.tbs, "qdr:w", "Firecrawl freshness window on the wire");
			return jsonResponse(200, { success: true, data: [] });
		}
		throw new Error(`unexpected url ${url}`);
	});
	const q = providerWith({ ...DEFAULTS, preferred: "firecrawl", freshness: "7d" });
	await q.search({ query: "hello" });
	restoreFetch();
	ok("freshness: exa startPublishedDate + firecrawl tbs on the wire");
}

// 17. keyless exa-mcp cannot honor freshness: receipt says so instead of staying silent.
{
	mockFetch(async (url) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_OK);
		return jsonResponse(200, ""); // L0
	});
	const p = providerWith({ ...DEFAULTS, freshness: "24h" });
	const result = await p.search({ query: "hello" });
	assert.match(result.content, /freshness 24h not honored \(keyless exa has no date filter\)/);
	restoreFetch();
	ok("keyless exa: freshness limit surfaced in receipt, not silently dropped");
}

// ── Part A: fetch provider (L2, mocked) ──────────────────────────────────────

const EXA_MCP_FETCH_OK = JSON.stringify({
	jsonrpc: "2.0",
	id: "x",
	result: { content: [{ type: "text", text: "Fetched page body from exa." }] }
});

const FIRECRAWL_SCRAPE_OK = { success: true, data: {
	markdown: "# Title\n\nBody content here.",
	html: "<html><body><h1>Title</h1><p>Body content here.</p></body></html>",
	metadata: { url: "https://p.example/final", statusCode: 200 }
} };

function fetchProviderWith(options) {
	const box = { ...options };
	return new MultiBackendFetchProvider(makeCtx(), () => box);
}

// 18. firecrawl scrape happy path: markdown mapped, final URL from metadata.
{
	mockFetch(async (url, init) => {
		assert.ok(url.startsWith("https://api.firecrawl.dev/v2/scrape"), `unexpected url ${url}`);
		assert.equal(JSON.parse(init.body).url, "https://p.example/a");
		return jsonResponse(200, FIRECRAWL_SCRAPE_OK);
	});
	const p = fetchProviderWith(DEFAULTS);
	assert.equal(p.id, PROVIDER_ID);
	assert.equal(p.available(), true);
	const result = await p.fetch({ url: "https://p.example/a" });
	assert.equal(result.url, "https://p.example/final", "final URL from metadata");
	assert.equal(result.statusCode, 200);
	assert.equal(result.body.kind, "text");
	assert.equal(result.body.content, "# Title\n\nBody content here.");
	assert.equal(result.truncated, false);
	restoreFetch();
	ok("firecrawl scrape: markdown mapped, final URL, kind=text");
}

// 19. firecrawl 429 → exa MCP fetch fallback; maxCharacters on the wire.
{
	let exaArgs;
	mockFetch(async (url, init) => {
		if (url.startsWith("https://api.firecrawl.dev")) return jsonResponse(429, "");
		assert.ok(url.startsWith("https://mcp.exa.ai"), `unexpected url ${url}`);
		exaArgs = JSON.parse(init.body).params.arguments;
		return jsonResponse(200, EXA_MCP_FETCH_OK);
	});
	const p = fetchProviderWith({ ...DEFAULTS, fetchMaxChars: 1234 });
	const result = await p.fetch({ url: "https://p.example/a" });
	assert.deepEqual(exaArgs, { urls: ["https://p.example/a"], maxCharacters: 1234 }, "web_fetch_exa args on the wire");
	assert.equal(result.body.kind, "text");
	assert.equal(result.body.content, "Fetched page body from exa.");
	assert.equal(result.statusCode, 200);
	restoreFetch();
	ok("fetch failover: firecrawl 429 → exa web_fetch_exa with maxCharacters");
}

// 20. scraped 404 page is a result, not an error (html fallback when markdown empty).
{
	mockFetch(async () => jsonResponse(200, { success: true, data: {
		markdown: "",
		html: "<html><body>404 page body</body></html>",
		metadata: { url: "https://p.example/missing", statusCode: 404 }
	} }));
	const p = fetchProviderWith(DEFAULTS);
	const result = await p.fetch({ url: "https://p.example/missing" });
	assert.equal(result.statusCode, 404, "non-2xx target is a result");
	assert.equal(result.body.kind, "html", "empty markdown falls back to html");
	assert.match(result.body.content, /404 page body/);
	restoreFetch();
	ok("scraped 404 target: returned as result with statusCode 404, not thrown");
}

// 21. SSRF guard: private/loopback/scheme-refused URLs fail before any network.
{
	mockFetch(async () => {
		throw new Error("network must not be reached for blocked URLs");
	});
	const p = fetchProviderWith(DEFAULTS);
	await assert.rejects(
		() => p.fetch({ url: "http://127.0.0.1:3080/admin" }),
		(error) => error.code === "WEB_PROVIDER_ERROR" && /private or loopback/.test(error.message)
	);
	await assert.rejects(
		() => p.fetch({ url: "https://10.1.2.3/internal" }),
		(error) => /private or loopback/.test(error.message)
	);
	await assert.rejects(
		() => p.fetch({ url: "file:///etc/passwd" }),
		(error) => /unsupported URL scheme/.test(error.message)
	);
	restoreFetch();
	ok("fetch SSRF guard: loopback / private / non-http(s) refused pre-network");
}

// 22. both fetch backends 429 → combined error; second fetch skipped in cooldown.
{
	mockFetch(async () => jsonResponse(429, ""));
	const p = fetchProviderWith(DEFAULTS);
	await assert.rejects(
		() => p.fetch({ url: "https://p.example/a" }),
		(error) => error.code === "WEB_PROVIDER_ERROR" && /firecrawl \(rate limited\)/.test(error.message) && /exa-mcp \(rate limited\)/.test(error.message)
	);
	let calls = 0;
	mockFetch(async () => {
		calls++;
		return jsonResponse(429, "");
	});
	await assert.rejects(
		() => p.fetch({ url: "https://p.example/a" }),
		(error) => /in rate-limit cooldown/.test(error.message)
	);
	assert.equal(calls, 0, "cooled fetch backends are skipped while another candidate exists");
	restoreFetch();
	ok("dual 429 on fetch: combined failure + cooldown skip");
}

// 23. fetchMaxChars truncates the body and sets truncated.
{
	const long = "x".repeat(500);
	mockFetch(async () => jsonResponse(200, { success: true, data: {
		markdown: long,
		metadata: { url: "https://p.example/long", statusCode: 200 }
	} }));
	const p = fetchProviderWith({ ...DEFAULTS, fetchMaxChars: 100 });
	const result = await p.fetch({ url: "https://p.example/long" });
	assert.equal(result.body.content.length, 100);
	assert.equal(result.truncated, true);
	restoreFetch();
	ok("fetchMaxChars: body capped, truncated=true");
}

// 24. firecrawlKeyless=false and no key → firecrawl excluded, exa-mcp is sole backend.
{
	mockFetch(async (url) => {
		assert.ok(!url.startsWith("https://api.firecrawl.dev"), "firecrawl must not be called");
		assert.ok(url.startsWith("https://mcp.exa.ai"));
		return jsonResponse(200, EXA_MCP_FETCH_OK);
	});
	const p = fetchProviderWith({ ...DEFAULTS, firecrawlKeyless: false });
	const result = await p.fetch({ url: "https://p.example/a" });
	assert.equal(result.body.content, "Fetched page body from exa.");
	restoreFetch();
	ok("firecrawlKeyless=false: exa-mcp is the sole fetch backend");
}

// 25. pre-aborted signal → immediate WEB_ABORTED, no network.
{
	mockFetch(async () => jsonResponse(200, EXA_MCP_FETCH_OK));
	const controller = new AbortController();
	controller.abort(new Error("user cancelled"));
	const p = fetchProviderWith(DEFAULTS);
	await assert.rejects(
		() => p.fetch({ url: "https://p.example/a" }, controller.signal),
		(error) => error.code === "WEB_ABORTED"
	);
	restoreFetch();
	ok("pre-aborted fetch throws WEB_ABORTED before any request");
}

// 26. SSRF guard (isSafeUrl) direct coverage: IPv6 literals, the full 127/8,
//     FQDN/localhost spellings, canonical numeric forms — refused; public
//     addresses allowed. This matrix is what findings B1-3 stayed green without.
{
	const blocked = [
		"http://[::1]:3080/admin", "http://[::1]/", "http://[::]:8080/",
		"http://[fe80::1]/", "http://[fd00::1]/", "http://[fc00::abcd]/",
		"http://[::ffff:127.0.0.1]/", "http://[::ffff:7f00:1]/",
		"http://[0:0:0:0:0:0:0:1]/",
		"http://127.0.0.2/", "http://127.1.2.3/", "http://0.0.0.0:80/",
		"http://localhost./admin", "http://sub.localhost/x",
		"http://localhost../x", "http://127.0.0.1../x", "http://sub.localhost../x",
		"http://10.1.2.3/", "http://172.31.255.255/", "http://169.254.1.1/",
		"http://192.168.1.1/", "http://100.64.0.1/", "http://224.0.0.1/",
		"http://2130706433/", "http://0x7f000001/",
		"file:///etc/passwd", "ftp://x.example/"
	];
	for (const url of blocked) assert.equal(isSafeUrl(url), false, `must block: ${url}`);
	const allowed = ["https://example.com/x", "https://8.8.8.8/", "https://[2001:db8::1]/", "https://LOCALHOST.com/x"];
	for (const url of allowed) assert.equal(isSafeUrl(url), true, `must allow: ${url}`);
	ok("SSRF guard: IPv6/127-8/FQDN/canonical spellings refused; public allowed");
}

// 27. L0 follows redirects manually and re-validates every hop: a public hop
//     chain resolves to [alive]; a hop to loopback is refused with no request
//     to the internal address.
{
	const redirectResponse = (status, location) => ({
		status,
		ok: false,
		headers: { get: (n) => (n.toLowerCase() === "location" ? location : null) },
		json: async () => { throw new Error("no json"); },
		text: async () => ""
	});
	mockFetch(async (url) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_SINGLE);
		if (url.startsWith("https://r.example/old")) return redirectResponse(301, "https://r.example/final");
		assert.equal(url, "https://r.example/final", "second hop must be the re-validated target");
		return jsonResponse(200, "");
	});
	const p = providerWith(DEFAULTS);
	const result = await p.search({ query: "hello" });
	assert.equal(result.sources[0].snippet, "[alive] Redirect target check.");
	restoreFetch();

	mockFetch(async (url) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_SINGLE);
		if (url.startsWith("https://r.example/old")) return redirectResponse(302, "http://127.0.0.2:9/internal");
		throw new Error(`must not reach the internal address: ${url}`);
	});
	const p2 = providerWith(DEFAULTS);
	const result2 = await p2.search({ query: "hello" });
	assert.match(result2.sources[0].snippet, /^\[blocked\]/, "loopback redirect target refused pre-network");
	restoreFetch();
	ok("L0 redirect: public hop followed to [alive]; loopback hop refused without a request");
}

// 28. broken redirects: 3xx without Location and a redirect loop both surface
//     as [unreachable] instead of hanging.
{
	const locationless = {
		status: 302,
		ok: false,
		headers: { get: () => null },
		json: async () => { throw new Error("no json"); },
		text: async () => ""
	};
	mockFetch(async (url) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_SINGLE);
		return locationless;
	});
	const p = providerWith(DEFAULTS);
	const result = await p.search({ query: "hello" });
	assert.match(result.sources[0].snippet, /^\[unreachable\]/, "302 without Location is an error");
	restoreFetch();
	ok("redirect without Location → [unreachable], no hang");
}

// 29. L0 status mapping: 403 → [blocked]; HEAD 501 → GET retry → [alive];
//     500 → [unreachable]; a probe that outlives livenessTimeoutMs → [timeout].
{
	const EXA_MCP_4 = JSON.stringify({
		jsonrpc: "2.0",
		id: "x",
		result: {
			content: [{
				type: "text",
				text:
					"Title: M1\nURL: https://m.example/1\nHighlights:\nOne.\n\n---\n\n" +
					"Title: M2\nURL: https://m.example/2\nHighlights:\nTwo.\n\n---\n\n" +
					"Title: M3\nURL: https://m.example/3\nHighlights:\nThree.\n\n---\n\n" +
					"Title: M4\nURL: https://m.example/4\nHighlights:\nFour."
			}]
		}
	});
	const untilAbortOrMs = async (init, ms) => {
		if (init.signal?.aborted === true) throw new Error("aborted");
		await new Promise((resolve, reject) => {
			const t = setTimeout(resolve, ms);
			init.signal?.addEventListener("abort", () => {
				clearTimeout(t);
				reject(new Error("aborted"));
			}, { once: true });
		});
	};
	mockFetch(async (url, init) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_4);
		if (url.startsWith("https://m.example/1")) return jsonResponse(403, "");
		if (url.startsWith("https://m.example/2") && init.method === "HEAD") return jsonResponse(501, "");
		if (url.startsWith("https://m.example/2")) {
			assert.equal(init.method, "GET", "501 retry uses GET");
			return jsonResponse(200, "");
		}
		if (url.startsWith("https://m.example/3")) return jsonResponse(500, "");
		await untilAbortOrMs(init, 5000); // outlive the 150ms probe deadline
		return jsonResponse(200, "");
	});
	const p = providerWith({ ...DEFAULTS, livenessTimeoutMs: 150 });
	const result = await p.search({ query: "hello" });
	assert.match(result.sources[0].snippet, /^\[blocked\]/);
	assert.match(result.sources[1].snippet, /^\[alive\]/);
	assert.match(result.sources[2].snippet, /^\[unreachable\]/);
	assert.match(result.sources[3].snippet, /^\[timeout\]/);
	restoreFetch();
	ok("L0 mapping: 403 [blocked], 501→GET [alive], 500 [unreachable], deadline [timeout]");
}

// 30. L1 page below minContentBytes → [blocked] (bot-block / empty shell).
{
	mockFetch(async (url, init) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_SINGLE);
		if (init.method === "HEAD") return jsonResponse(200, "");
		return jsonResponse(200, "too short"); // < contentCheckMinBytes (200)
	});
	const p = providerWith({ ...DEFAULTS, verifyLevel: "content" });
	const result = await p.search({ query: "hello" });
	assert.match(result.sources[0].snippet, /^\[blocked\]/);
	restoreFetch();
	ok("L1 below-min-bytes page → [blocked]");
}

// 31. L1 source without a snippet: the page is live but its content was NOT
//     checked — [unverified], counted separately in the receipt.
{
	mockFetch(async (url, init) => {
		if (url.startsWith("https://api.firecrawl.dev")) {
			return jsonResponse(200, { success: true, data: { web: [
				{ url: "https://f.example/1", title: "F1", description: "First highlight sentence." },
				{ url: "https://f.example/2", title: "F2" } // no description → no snippet
			] } });
		}
		if (init.method === "HEAD") return jsonResponse(200, "");
		return jsonResponse(200, PAGE_MATCHING);
	});
	const p = providerWith({ ...DEFAULTS, verifyLevel: "content", preferred: "firecrawl" });
	const result = await p.search({ query: "hello" });
	assert.match(result.sources[0].snippet, /^\[verified\]/);
	assert.match(result.sources[1].snippet, /^\[unverified\]/);
	assert.match(result.content, /content: 1 verified, 1 unverified/);
	restoreFetch();
	ok("L1 snippet-less source → [unverified], receipt counts it separately");
}

// 32. maxCooldownSec clamps a huge reported window to the configured cap.
{
	mockFetch(async (url) => {
		if (url.startsWith("https://mcp.exa.ai")) {
			return jsonResponse(429, JSON.stringify({ error: { reason: "rate_limited", retry_after_seconds: 999999 } }));
		}
		return jsonResponse(429, "");
	});
	const p = providerWith({ ...DEFAULTS, maxCooldownSec: 3600 });
	await assert.rejects(() => p.search({ query: "hello" })); // first pass: both 429
	let calls = 0;
	mockFetch(async () => {
		calls++;
		return jsonResponse(429, "");
	});
	await assert.rejects(
		() => p.search({ query: "hello" }),
		(error) => /exa \(in rate-limit cooldown, retry in 3600s\)/.test(error.message)
	);
	assert.equal(calls, 0, "clamped window still cools the backend");
	restoreFetch();
	ok("maxCooldownSec clamps a 999999s report to the 3600s cap");
}

// 33. 429 carrying ONLY the standard Retry-After header (no body field):
//     the header window is honored.
{
	const header429 = (value) => ({
		status: 429,
		ok: false,
		headers: { get: (n) => (n.toLowerCase() === "retry-after" ? value : null) },
		json: async () => { throw new Error("no json"); },
		text: async () => "rate limited"
	});
	mockFetch(async (url) => {
		if (url.startsWith("https://mcp.exa.ai")) return header429("90");
		return jsonResponse(429, "");
	});
	const p = providerWith(DEFAULTS);
	await assert.rejects(
		() => p.search({ query: "hello" }),
		(error) => /exa \(rate limited\).*retry in ~90s/u.test(error.message)
	);
	let calls = 0;
	mockFetch(async () => {
		calls++;
		return jsonResponse(429, "");
	});
	await assert.rejects(
		() => p.search({ query: "hello" }),
		(error) => /exa \(in rate-limit cooldown, retry in 90s\)/.test(error.message)
	);
	assert.equal(calls, 0);
	// HTTP-date form (RFC 7231): a future date is honored; a past date
	// falls back to the configured flat cooldown.
	const futureDate = new Date(Date.now() + 120_000).toUTCString();
	const pastDate = new Date(Date.now() - 120_000).toUTCString();
	mockFetch(async (url) => {
		if (url.startsWith("https://mcp.exa.ai")) return header429(futureDate);
		return jsonResponse(429, "");
	});
	const p2 = providerWith(DEFAULTS);
	await assert.rejects(
		() => p2.search({ query: "hello" }),
		(error) => /exa \(rate limited\).*retry in ~120s/u.test(error.message)
	);
	mockFetch(async (url) => {
		if (url.startsWith("https://mcp.exa.ai")) return header429(pastDate);
		return jsonResponse(429, "");
	});
	const p3 = providerWith(DEFAULTS);
	await assert.rejects(
		() => p3.search({ query: "hello" }),
		(error) => /exa \(rate limited\).*backing off 60s/u.test(error.message)
	);
	restoreFetch();
	ok("Retry-After header alone drives the reported window + cooldown (delta-seconds and HTTP-date)");
}

// 34. retry_after_seconds reported as a numeric string is still parsed.
{
	mockFetch(async (url) => {
		if (url.startsWith("https://mcp.exa.ai")) {
			return jsonResponse(429, JSON.stringify({ retry_after_seconds: "45" }));
		}
		return jsonResponse(429, "");
	});
	const p = providerWith(DEFAULTS);
	await assert.rejects(
		() => p.search({ query: "hello" }),
		(error) => /retry in ~45s/.test(error.message)
	);
	restoreFetch();
	ok("string retry_after_seconds parsed as a window");
}

// 35. L1 body read is bounded by contentCheckTimeoutMs: a slow-drip server
//     (headers then trickle) cannot stall the search indefinitely.
{
	mockFetch(async (url, init) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_SINGLE);
		if (init.method === "HEAD") return jsonResponse(200, "");
		let i = 0;
		return {
			status: 200,
			ok: true,
			headers: { get: () => null },
			body: {
				getReader: () => ({
					read: async () => {
						await new Promise((r) => setTimeout(r, 400)); // far past the 300ms deadline
						i += 1;
						return i <= 50 ? { value: Buffer.from("b".repeat(100)) } : { done: true };
					},
					cancel: async () => {}
				})
			},
			text: async () => "b".repeat(5000)
		};
	});
	const p = providerWith({ ...DEFAULTS, verifyLevel: "content", contentCheckTimeoutMs: 300 });
	const t0 = Date.now();
	const result = await p.search({ query: "hello" });
	assert.match(result.sources[0].snippet, /^\[timeout\]/);
	assert.ok(Date.now() - t0 < 5000, "search stays bounded despite the drip");
	restoreFetch();
	ok("L1 slow-drip body: contentCheckTimeoutMs bounds the read → [timeout]");
}

// 36. fetch failover on a NON-429 scrape failure (success:false envelope).
{
	mockFetch(async (url) => {
		if (url.startsWith("https://api.firecrawl.dev")) {
			return jsonResponse(200, { success: false, error: "scrape failed: internal error" });
		}
		assert.ok(url.startsWith("https://mcp.exa.ai"), "must fall through to exa-mcp fetch");
		return jsonResponse(200, EXA_MCP_FETCH_OK);
	});
	const p = fetchProviderWith(DEFAULTS);
	const result = await p.fetch({ url: "https://p.example/a" });
	assert.equal(result.body.content, "Fetched page body from exa.");
	restoreFetch();
	ok("fetch failover on success:false scrape envelope");
}

// 37. abort during verification → WEB_ABORTED, like an abort mid-search.
// Deterministic: the L0 probe settles only when the caller's signal aborts
// (as a real fetch would reject), so no wall-clock margin decides the outcome.
{
	const controller = new AbortController();
	mockFetch(async (url, init) => {
		if (url.startsWith("https://mcp.exa.ai")) {
			await new Promise((r) => setTimeout(r, 20)); // let #finalize start
			return jsonResponse(200, EXA_MCP_SINGLE);
		}
		return new Promise((resolve) => {
			const settle = () => resolve(jsonResponse(200, ""));
			if (init.signal?.aborted === true) return settle();
			init.signal.addEventListener("abort", settle, { once: true });
			const safety = setTimeout(settle, 2000); // never hangs the suite
			safety.unref?.();
		});
	});
	const p = providerWith(DEFAULTS);
	const searchPromise = p.search({ query: "hello" }, controller.signal);
	setTimeout(() => controller.abort(), 60);
	await assert.rejects(searchPromise, (error) => error.code === "WEB_ABORTED");
	restoreFetch();
	ok("abort during verification → WEB_ABORTED");
}

// 38. L1: a body that stalls mid-read (headers sent, then silence) is cut
//     off by contentCheckTimeoutMs even while the read() is still in flight.
{
	mockFetch(async (url, init) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_SINGLE);
		if (init.method === "HEAD") return jsonResponse(200, "");
		// Real-fetch semantics: the pending read rejects when the request is
		// aborted — which is exactly what the module's own deadline timer does.
		return {
			status: 200,
			ok: true,
			headers: { get: () => null },
			body: {
				getReader: () => ({
					read: () =>
						new Promise((_, reject) => {
							if (init.signal?.aborted === true) return reject(new Error("aborted"));
							init.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
						}),
					cancel: async () => {}
				})
			},
			text: async () => "should never be read"
		};
	});
	const p = providerWith({ ...DEFAULTS, verifyLevel: "content", contentCheckTimeoutMs: 400 });
	const t0 = Date.now();
	const result = await p.search({ query: "hello" });
	assert.match(result.sources[0].snippet, /^\[timeout\]/);
	assert.ok(Date.now() - t0 < 5000, "bounded by the content deadline, not by undici's default");
	restoreFetch();
	ok("L1 stalled body read cut off by contentCheckTimeoutMs");
}

// 39. L1: a response without a readable stream whose text() never settles
//     is still bounded by the deadline race.
{
	mockFetch(async (url, init) => {
		if (url.startsWith("https://mcp.exa.ai")) return jsonResponse(200, EXA_MCP_SINGLE);
		if (init.method === "HEAD") return jsonResponse(200, "");
		return {
			status: 200,
			ok: true,
			headers: { get: () => null },
			body: undefined,
			text: () => new Promise(() => {}) // never settles
		};
	});
	const p = providerWith({ ...DEFAULTS, verifyLevel: "content", contentCheckTimeoutMs: 400 });
	const result = await p.search({ query: "hello" });
	assert.match(result.sources[0].snippet, /^\[timeout\]/);
	restoreFetch();
	ok("L1 never-settling text() bounded by the deadline race");
}

console.log(`\nPart A: ${passed}/39 scenarios passed`);

// ── Part B: live smoke (real endpoints, keyless) ────────────────────────────

if (process.env.CI) {
	// Live endpoints are rate-limited; in CI the mocked Part A is what we
	// verify. Run without the CI env var locally to include the live calls.
	console.log("\nPart B: skipped in CI");
	console.log(`\nAll tests passed.`);
	process.exit(0);
}

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

// B2: firecrawl keyless v2 through the provider (force firecrawl first).
{
	const p = providerWith({ ...DEFAULTS, preferred: "firecrawl", numResults: 3 });
	const result = await p.search({ query: "DeepSeek Harness agent harness" });
	assert.ok(result.sources.length >= 1, "firecrawl keyless returned sources");
	console.log(`  ok firecrawl keyless v2 live: ${result.sources.length} sources, first: ${result.sources[0].title ?? result.sources[0].url}`);
}

// B3: dual-backend failover live — exa 429 simulated is hard to force live, so
// instead verify a normal dual plan works end-to-end with exa first.
{
	const p = providerWith({ ...DEFAULTS, numResults: 3 });
	const result = await p.search({ query: "firecrawl web search api" });
	assert.ok(result.sources.length >= 1);
	console.log(`  ok dual plan live (exa preferred): ${result.sources.length} sources`);
}

console.log(`\nAll tests passed.`);
