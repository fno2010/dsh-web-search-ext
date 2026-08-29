/**
 * C6 settings-card model tests (src/client/settings-model.js, no React).
 * Run: node test/settings.test.mjs
 *
 * The card's verifyLevel select is a pure function of the stored value:
 * the host schema (lib/index.js) is the source of truth —
 * z.union(["off","liveness","content"]).default("liveness") — so the model
 * pins the closed tier set and the unset/unknown → default normalization
 * that keeps the select (and any write it produces) schema-valid.
 */
import assert from "node:assert/strict";
import { VERIFY_LEVELS, VERIFY_LEVEL_DEFAULT, effectiveVerifyLevel } from "../src/client/settings-model.js";

let passed = 0;
function ok(label) {
	passed++;
	console.log(`  ok ${label}`);
}

// Closed tier set: exactly the three schema tiers, in display order.
{
	assert.deepEqual([...VERIFY_LEVELS], ["off", "liveness", "content"]);
	assert.equal(VERIFY_LEVELS.length, 3, "tier set is closed");
	assert.ok(Object.isFrozen(VERIFY_LEVELS), "tier set is frozen");
	assert.equal(VERIFY_LEVEL_DEFAULT, "liveness", "default matches the host schema");
	ok("C6 tier set: off/liveness/content, default liveness (schema mirror)");
}

// Valid tiers pass through untouched.
{
	for (const tier of VERIFY_LEVELS) {
		assert.equal(effectiveVerifyLevel(tier), tier);
	}
	ok("C6 effective tier: all three valid values pass through");
}

// Unset (undefined / null — the document has no verifyLevel key) shows the
// schema default, exactly as the host would resolve it.
{
	assert.equal(effectiveVerifyLevel(undefined), "liveness");
	assert.equal(effectiveVerifyLevel(null), "liveness");
	ok("C6 effective tier: unset value → schema default liveness");
}

// A hand-edited settings.yaml may hold anything — every unrecognized shape
// normalizes to the default instead of echoing back a dead select option
// that the host would reject on save.
{
	for (const bad of ["LIVENESS", "Off", "content ", 0, 3, true, "", {}, []]) {
		assert.equal(effectiveVerifyLevel(bad), "liveness", `rejects ${JSON.stringify(bad)}`);
	}
	ok("C6 effective tier: case-garbage/number/boolean/empty/object → default, no echo");
}

// Sentinel: the scenario count lives in-test, never in docs.
assert.equal(passed, 4, "scenario sentinel");

console.log(`\nAll ${passed} settings model scenarios passed.`);
