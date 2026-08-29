/**
 * C2 health tests: the host wire model (lib/health.js) and the pure-model
 * client (src/client/health.js) behind the settings card's Health tab and
 * the GET /web-search-ext/health route. Node-runnable, no React, no
 * network — the same hand-rolled ok() + sentinel style as the other
 * suites.
 * Run: node test/health.test.mjs
 */
import assert from "node:assert/strict";
import {
	createHealthState,
	recordBackend,
	noteCall,
	noteResults,
	activeCooldowns,
	buildHealthJson,
	storeProbe
} from "../lib/health.js";
import { HEALTH_ROUTE, PROBE_ROUTE, parseHealth, formatDuration, ageOf } from "../src/client/health.js";

let passed = 0;
function ok(label) {
	passed++;
	console.log(`  ok ${label}`);
}

// 1. formatDuration: the two-unit ladder and the clamp for anything
//    that is not a usable non-negative millisecond count.
{
	assert.equal(formatDuration(0), "0s");
	assert.equal(formatDuration(12_000), "12s");
	assert.equal(formatDuration(59_999), "59s", "just under a minute stays seconds");
	assert.equal(formatDuration(60_000), "1m 0s");
	assert.equal(formatDuration(123_000), "2m 3s");
	assert.equal(formatDuration(3_599_999), "59m 59s", "just under an hour stays minutes");
	assert.equal(formatDuration(3_600_000), "1h 0m");
	assert.equal(formatDuration(3_660_000), "1h 1m");
	assert.equal(formatDuration(86_399_999), "23h 59m", "just under a day stays hours");
	assert.equal(formatDuration(86_400_000), "1d 0h");
	assert.equal(formatDuration(86_400_000 + 2 * 3_600_000), "1d 2h");
	assert.equal(formatDuration(-5), "0s", "negatives clamp");
	assert.equal(formatDuration(NaN), "0s", "NaN clamps");
	assert.equal(formatDuration(Infinity), "0s", "Infinity clamps");
	assert.equal(formatDuration(undefined), "0s", "non-numbers clamp");
	ok("formatDuration: ladder + clamps");
}

// 2. ageOf: unknown events are null, the age clamps at 0, now defaults to
//    the present, and the route constant matches the host's.
{
	assert.equal(HEALTH_ROUTE, "/web-search-ext/health");
	const t0 = 1_000_000_000;
	assert.equal(ageOf(null, t0 + 5000), null, "never called → null");
	assert.equal(ageOf(t0, t0 + 123_000), "2m 3s");
	assert.equal(ageOf(t0 + 999_999, t0), "0s", "a future event clamps to 0s");
	assert.equal(typeof ageOf(t0), "string", "now defaults to the present");
	ok("ageOf: null for never, clamped age, default now");
}

// 3. parseHealth: a full valid wire payload normalizes, nulls are
//    preserved, and missing optional fields take their defaults.
{
	const wire = {
		startedAt: 1000,
		uptimeMs: 12_000,
		searchCalls: 3,
		fetchCalls: 1,
		resultsReturned: 7,
		backends: [
			{
				provider: "search",
				name: "exa",
				label: "exa-mcp",
				attempts: 2,
				ok: 1,
				failed: 1,
				lastCallAt: 900,
				lastCallMs: 120,
				lastOk: true,
				cooldownRemainingMs: 0
			},
			{
				provider: "search",
				name: "firecrawl",
				label: "firecrawl",
				attempts: 1,
				ok: 1,
				failed: 0,
				lastCallAt: null,
				lastCallMs: null,
				lastOk: null
			}
		]
	};
	const model = parseHealth(wire);
	assert.equal(model.startedAt, 1000);
	assert.equal(model.uptimeMs, 12_000);
	assert.equal(model.searchCalls, 3);
	assert.equal(model.fetchCalls, 1);
	assert.equal(model.resultsReturned, 7);
	const exa = model.backends[0];
	assert.equal(exa.label, "exa-mcp");
	assert.equal(exa.attempts, 2);
	assert.equal(exa.lastCallAt, 900);
	assert.equal(exa.lastOk, true);
	const fc = model.backends[1];
	assert.equal(fc.lastCallAt, null, "nulls preserved");
	assert.equal(fc.lastCallMs, null);
	assert.equal(fc.lastOk, null);
	// Minimal payload: missing optional fields take their defaults.
	const minimal = parseHealth({
		startedAt: 1000,
		uptimeMs: 0,
		searchCalls: 0,
		fetchCalls: 0,
		backends: [{ provider: "search", name: "exa", attempts: 0, ok: 0, failed: 0 }]
	});
	assert.equal(minimal.resultsReturned, null, "missing resultsReturned → null");
	const row = minimal.backends[0];
	assert.equal(row.label, "exa", "missing label → name");
	assert.equal(row.cooldownRemainingMs, 0, "missing cooldown → 0");
	assert.equal(row.lastCallAt, null, "missing lastCallAt → null");
	ok("parseHealth: valid payload normalized, nulls preserved, defaults filled");
}

// 4. parseHealth: every malformed shape is rejected — the card would then
//    show its explicit unavailable line instead of a silently wrong number.
{
	const good = (over = {}) => ({
		startedAt: 1,
		uptimeMs: 2,
		searchCalls: 0,
		fetchCalls: 0,
		resultsReturned: 0,
		backends: [],
		...over
	});
	const row = (over = {}) => ({
		provider: "search",
		name: "exa",
		attempts: 0,
		ok: 0,
		failed: 0,
		...over
	});
	assert.equal(parseHealth(null), null);
	assert.equal(parseHealth("x"), null);
	assert.equal(parseHealth(42), null);
	assert.equal(parseHealth([]), null, "an array is not an object");
	assert.equal(parseHealth(good({ startedAt: "x" })), null, "string startedAt");
	assert.equal(parseHealth(good({ startedAt: -1 })), null, "negative startedAt");
	assert.equal(parseHealth(good({ uptimeMs: -1 })), null, "negative uptime");
	assert.equal(parseHealth(good({ uptimeMs: Infinity })), null, "non-finite uptime");
	assert.equal(parseHealth(good({ searchCalls: -1 })), null, "negative searchCalls");
	assert.equal(parseHealth(good({ resultsReturned: -1 })), null, "negative resultsReturned");
	assert.equal(parseHealth(good({ backends: "no" })), null, "backends not an array");
	assert.equal(parseHealth(good({ backends: [null] })), null, "null backend row");
	assert.equal(parseHealth(good({ backends: [row({ name: "" })] })), null, "empty backend name");
	assert.equal(parseHealth(good({ backends: [row({ ok: -1 })] })), null, "negative ok counter");
	assert.equal(parseHealth(good({ backends: [row({ lastCallAt: "nope" })] })), null, "string lastCallAt");
	assert.equal(parseHealth(good({ backends: [row({ lastOk: 1 })] })), null, "non-boolean lastOk");
	assert.equal(parseHealth(good({ backends: [row({ cooldownRemainingMs: -3 })] })), null, "negative cooldown");
	assert.notEqual(parseHealth(good()), null, "minimal valid payload accepted");
	ok("parseHealth: malformed payloads rejected, minimal accepted");
}

// 5. Host state: recordBackend counters and last-call facts (last label
//    seen wins), the call/result notes, and activeCooldowns filtering out
//    expired windows.
{
	const state = createHealthState(500);
	assert.equal(state.startedAt, 500);
	assert.equal(state.searchCalls, 0);
	assert.equal(state.fetchCalls, 0);
	assert.equal(state.resultsReturned, 0);
	assert.ok(state.backends instanceof Map, "backends keyed by provider:name");
	recordBackend(state, "search", "exa", "exa-mcp", false, 600, 700);
	recordBackend(state, "search", "exa", "exa-rest", true, 800, 850);
	const exa = state.backends.get("search:exa");
	assert.equal(exa.attempts, 2);
	assert.equal(exa.ok, 1);
	assert.equal(exa.failed, 1);
	assert.equal(exa.lastOk, true);
	assert.equal(exa.lastCallAt, 850);
	assert.equal(exa.lastCallMs, 50);
	assert.equal(exa.label, "exa-rest", "last label seen wins");
	noteCall(state, "search");
	noteCall(state, "fetch");
	noteResults(state, 4);
	assert.equal(state.searchCalls, 1);
	assert.equal(state.fetchCalls, 1);
	assert.equal(state.resultsReturned, 4);
	const now = 1_000_000;
	const entries = [
		{ name: "exa", at: now - 1000, ms: 60_000 }, // active
		{ name: "firecrawl", at: now - 120_000, ms: 60_000 } // expired
	];
	const active = activeCooldowns(entries, now);
	assert.equal(active.length, 1, "expired windows filtered out");
	assert.equal(active[0].name, "exa");
	assert.equal(active[0].remainingMs, 59_000);
	assert.deepEqual(activeCooldowns([], now), []);
	ok("host state: counters, last facts, label update, cooldown filter");
}

// 6. buildHealthJson: the wire shape — provider tags, uptime, counters —
//    with only ACTIVE cooldowns merged onto the matching backend rows,
//    JSON-safe on a round trip, and re-parsable by the client model.
{
	const state = createHealthState(1_000_000);
	recordBackend(state, "search", "exa", "exa-mcp", false, 1_000_010, 1_000_020);
	recordBackend(state, "search", "firecrawl", "firecrawl", true, 1_000_020, 1_000_030);
	recordBackend(state, "fetch", "firecrawl", "firecrawl", true, 1_000_040, 1_000_050);
	noteCall(state, "search");
	noteCall(state, "fetch");
	noteResults(state, 3);
	const now = 1_030_000;
	const json = buildHealthJson(
		state,
		{
			// exa cooldown: active (ends at 1_060_010).
			searchCooldowns: [{ name: "exa", at: 1_000_010, ms: 60_000 }],
			// fetch firecrawl cooldown: expired (ended at 1_000_000 < now).
			fetchCooldowns: [{ name: "firecrawl", at: now - 90_000, ms: 60_000 }]
		},
		now
	);
	assert.equal(json.startedAt, 1_000_000);
	assert.equal(json.uptimeMs, 30_000);
	assert.equal(json.searchCalls, 1);
	assert.equal(json.fetchCalls, 1);
	assert.equal(json.resultsReturned, 3);
	assert.equal(json.backends.length, 3);
	for (const b of json.backends) {
		assert.ok(b.provider === "search" || b.provider === "fetch", "provider tag present");
	}
	const wireExa = json.backends.find((b) => b.provider === "search" && b.name === "exa");
	assert.equal(wireExa.label, "exa-mcp");
	assert.equal(wireExa.failed, 1);
	assert.equal(wireExa.cooldownRemainingMs, 30_010, "active cooldown merged with the right window");
	const wireFetchFc = json.backends.find((b) => b.provider === "fetch" && b.name === "firecrawl");
	assert.equal(wireFetchFc.cooldownRemainingMs, 0, "expired cooldown not merged");
	const wireSearchFc = json.backends.find((b) => b.provider === "search" && b.name === "firecrawl");
	assert.equal(wireSearchFc.cooldownRemainingMs, 0, "cooldowns never cross providers");
	// JSON-safe on a round trip and re-parsable by the client model.
	const round = JSON.parse(JSON.stringify(json));
	assert.deepEqual(round, json, "JSON round trip is lossless");
	const model = parseHealth(round);
	assert.notEqual(model, null, "wire JSON passes the client's parseHealth");
	assert.equal(model.backends.length, 3);
	assert.equal(model.resultsReturned, 3);
	ok("buildHealthJson: wire shape, cooldown merge, JSON round trip → parseHealth");
}

// 7. G3 probe payload: the route constant matches the host; parseHealth
//    accepts a well-formed probe (label defaults to name, missing ms to 0,
//    absent probe to null) and rejects a malformed probe shape by rejecting
//    the WHOLE payload; the stored probe round-trips buildHealthJson →
//    JSON → parseHealth losslessly.
{
	assert.equal(PROBE_ROUTE, "/web-search-ext/probe", "client route matches the host");
	const goodProbe = {
		at: 500,
		backends: [
			{ name: "exa", label: "exa-mcp", status: "ok", detail: "ok", ms: 123 },
			{ name: "firecrawl", status: "error", detail: "rate-limited" }
		]
	};
	const wire = {
		startedAt: 1000,
		uptimeMs: 12_000,
		searchCalls: 0,
		fetchCalls: 0,
		resultsReturned: 0,
		backends: [],
		probe: goodProbe
	};
	const model = parseHealth(wire);
	assert.notEqual(model, null, "valid probe accepted");
	assert.equal(model.probe.at, 500);
	const pExa = model.probe.backends[0];
	assert.equal(pExa.label, "exa-mcp");
	assert.equal(pExa.status, "ok");
	assert.equal(pExa.detail, "ok");
	assert.equal(pExa.ms, 123);
	const pFc = model.probe.backends[1];
	assert.equal(pFc.label, "firecrawl", "missing label → name");
	assert.equal(pFc.detail, "rate-limited");
	assert.equal(pFc.ms, 0, "missing ms → 0");
	// Absent or null probe → null (fresh session, not yet probed).
	assert.equal(parseHealth({ ...wire, probe: null }).probe, null);
	assert.equal(parseHealth({ ...wire, probe: undefined }).probe, null);

	// Malformed probe → the whole payload is rejected.
	const bad = (probe) => parseHealth({ ...wire, probe });
	assert.equal(bad({ at: "x", backends: [] }), null, "string at");
	assert.equal(bad({ at: -1, backends: [] }), null, "negative at");
	assert.equal(bad({ backends: [] }), null, "missing at");
	assert.equal(bad({ at: 1, backends: "no" }), null, "backends not an array");
	assert.equal(bad({ at: 1, backends: [null] }), null, "null probe row");
	assert.equal(bad({ at: 1, backends: [{ name: "", status: "ok", detail: "ok" }] }), null, "empty name");
	assert.equal(bad({ at: 1, backends: [{ name: "exa", status: "maybe", detail: "ok" }] }), null, "status outside the closed set");
	assert.equal(bad({ at: 1, backends: [{ name: "exa", status: "ok", detail: "unknown-code" }] }), null, "detail outside the closed set");
	assert.equal(bad({ at: 1, backends: [{ name: "exa", status: "ok", detail: "ok", ms: -5 }] }), null, "negative ms");
	assert.equal(bad("probe"), null, "probe is not an object");

	// Round trip: host stores the probe, the wire JSON carries it, and the
	// client parses it back losslessly.
	const state = createHealthState(1_000_000);
	storeProbe(state, goodProbe);
	const json = buildHealthJson(state, {});
	assert.deepEqual(JSON.parse(JSON.stringify(json.probe)), goodProbe, "wire probe is JSON-safe");
	const reparsed = parseHealth(JSON.parse(JSON.stringify(json)));
	assert.notEqual(reparsed, null);
	assert.deepEqual(reparsed.probe, parseHealth(wire).probe, "round trip preserves the probe");
	ok("G3 probe: route const, valid/absent/malformed parsing, store→wire→parse round trip");
}

// Single source of truth for this suite's coverage: the suite FAILS on
// scenario drift instead of silently printing a lower count. Bump this
// when adding a scenario — no doc anywhere else restates the number on
// purpose.
const HEALTH_SCENARIOS = 7;
assert.equal(passed, HEALTH_SCENARIOS, `health scenario drift: ${passed} ok() of ${HEALTH_SCENARIOS}`);
console.log(`\nhealth: ${passed}/${HEALTH_SCENARIOS} scenarios passed`);
