/**
 * Composition regression test — host-level wiring, not provider-level.
 *
 * Feeds the SHIPPED bundle patch (../cordis.patch.yml) through the harness's
 * own patch engine (applyEntryPatches from @deepseek-ai/cordis-plugin-include,
 * the exact function the host uses) on top of the real layer stack:
 *
 *   BASE_ROWS    — dsh-base@0.1.1-rc.2 rows this patch targets (verbatim
 *                  values, verified on the running host)
 *   WEB_APP_ROWS — the @deepseek-ai/dsh-web-app@0.1.1-rc.2 web-profile patch
 *                  entry that disables the profile-layer `tool-web` row
 *
 * 0.3.1 lesson, encoded as assertions: the 0.3.0 hotfix originally patched
 * `tool-web.fetch: true` into the profile layer and asserted exactly that.
 * The fixture omitted the web-app layer and the preset layer, so the test
 * passed against a composition the host never builds — on a real `dsh web`
 * host the row is `disabled: true` upstream and the model-facing tool comes
 * from the agent-preset layer (shipped with `fetch: false`), i.e. the patch
 * row was inert. This version composes the layers the host actually composes
 * and asserts the REAL resulting state:
 *
 *   1. the `web` row pins BOTH searchProvider and fetchProvider to
 *      `web-search-ext` in every profile (the 0.3.0 provider-level fix);
 *   2. in the web profile the composed `tool-web` row is DISABLED (web-app
 *      owns that decision) with the base config untouched — no patch row may
 *      claim to have changed it;
 *   3. the shipped patch contains NO `tool-web` entry: a profile-layer row
 *      cannot enable the model-facing tool (disabled upstream in web,
 *      preset-layer-owned otherwise), so claiming it would be a false green;
 *   4. no patch entry was skipped by the loader.
 *
 * The model-facing `web_fetch` registration itself (the plugin's apply-time
 * call into dsh-tool-web's applyWebFetchTool) is covered by
 * test/tool-registration.test.mjs, and the end-to-end tool call by the
 * release-time live smoke (AGENTS.md, Releasing step 1).
 *
 * Base fixture source (bump when the host harness updates, and re-verify
 * against the installed @deepseek-ai/dsh-base / dsh-web-app — see the note
 * in AGENTS.md):
 *   - @deepseek-ai/dsh-base@0.1.1-rc.2, cordis.patch.yml rows `web`,
 *     `web-search-deepseek`, `tool-web`
 *   - @deepseek-ai/dsh-web-app@0.1.1-rc.2, web-profile patch entry `tool-web`
 * Patch engine pin (must match the host's engine semantics):
 *   - @deepseek-ai/cordis-plugin-include@1.0.6
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { applyEntryPatches, entryListSchema } from "@deepseek-ai/cordis-plugin-include";

let passed = 0;
function ok(name, fn) {
	fn();
	passed += 1;
	console.log(`ok - ${name}`);
}

/**
 * The base rows as shipped in @deepseek-ai/dsh-base@0.1.1-rc.2. The real file
 * is one top-level `- insert:` list; only the rows relevant to this plugin's
 * composition are reproduced here (verbatim config values).
 */
const BASE_ROWS = [
	{
		id: "web",
		name: "@deepseek-ai/dsh-web",
		config: { searchProvider: "deepseek-official" }
	},
	{
		id: "web-search-deepseek",
		name: "@deepseek-ai/dsh-web-search-deepseek",
		config: { apiKeyEnv: "DEEPSEEK_API_KEY" }
	},
	{
		id: "tool-web",
		name: "@deepseek-ai/dsh-tool-web",
		config: { fetch: false, searchTimeoutMs: 60000 }
	}
];

/**
 * The web-profile patch entry from @deepseek-ai/dsh-web-app@0.1.1-rc.2
 * (verbatim: the web profile disables the profile-layer tool-web row — the
 * model-facing web tools come from the agent-preset layer instead).
 */
const WEB_APP_ROWS = [{ id: "tool-web", disabled: true }];

/** Parse a patch file exactly like the loader does (entryListSchema accepts the !!js tag). */
function loadPatches(file) {
	const text = readFileSync(file, "utf8");
	const parsed = yaml.load(text, { schema: entryListSchema });
	assert.ok(Array.isArray(parsed), `patch file must parse to a list: ${file}`);
	return parsed;
}

const ourPatches = loadPatches(new URL("../cordis.patch.yml", import.meta.url));

/**
 * Compose exactly the way the host does: base rows first, then the bundle
 * patch (ours — installed plugins), then the profile patch (web-app). The
 * 0.3.0/0.3.1 first drafts omitted the profile layer; that omission is what
 * made the old assertions false-green.
 */
function compose(bundleFirst, profileRows = []) {
	const warnings = [];
	const composed = applyEntryPatches(
		[],
		[{ insert: structuredClone(BASE_ROWS) }, ...(bundleFirst ? ourPatches : []), ...profileRows],
		(msg) => warnings.push(msg)
	);
	return { composed, byId: new Map(composed.map((row) => [row.id, row])), warnings };
}

// ── 1. web profile (the 0.3.0 bug path): base + our bundle + web-app ────────

{
	const { byId, warnings } = compose(true, WEB_APP_ROWS);

	ok("web profile: no patch entry was skipped (no loader warnings)", () => {
		assert.deepEqual(warnings, [], `unexpected loader warnings: ${JSON.stringify(warnings)}`);
	});

	ok("web profile: provider row is mounted and enabled", () => {
		const row = byId.get("web-search-ext");
		assert.ok(row, "web-search-ext row missing from composed tree");
		// name is the loader's import specifier and must be the scoped npm
		// registry name, so a fresh `dsh plugin add` install resolves it.
		assert.equal(row.name, "@fno2010/dsh-web-search-ext");
		assert.notEqual(row.disabled, true, "web-search-ext row must not be disabled");
	});

	ok("web profile: web row pins our provider for search AND fetch", () => {
		assert.deepEqual(byId.get("web")?.config, {
			searchProvider: "web-search-ext",
			fetchProvider: "web-search-ext"
		});
	});

	// The honest assertion (the 0.3.1 false green asserted the opposite): in
	// the web profile the composed tool-web row IS disabled — web-app owns
	// that decision, and no bundle-patch row can or should change it. The
	// base config stays intact under the disabled flag.
	ok("web profile: tool-web row is disabled by the web profile (real host state)", () => {
		const row = byId.get("tool-web");
		assert.ok(row, "tool-web row missing from composed tree");
		assert.equal(row.disabled, true, "web-app disables the profile-layer tool-web row; the host really composes it disabled");
		assert.deepEqual(row.config, { fetch: false, searchTimeoutMs: 60000 }, "disabled row keeps the base config");
	});
}

// ── 2. non-web profile (CLI): base + our bundle, no web-app layer ───────────

{
	const { byId, warnings } = compose(true);

	ok("CLI profile: no patch entry was skipped", () => {
		assert.deepEqual(warnings, [], `unexpected loader warnings: ${JSON.stringify(warnings)}`);
	});

	ok("CLI profile: web row pins our provider for search AND fetch", () => {
		assert.deepEqual(byId.get("web")?.config, {
			searchProvider: "web-search-ext",
			fetchProvider: "web-search-ext"
		});
	});

	// We must NOT touch the tool-web row at all: the model-facing tools are
	// owned by the preset layer, and the plugin registers web_fetch itself at
	// apply time (test/tool-registration.test.mjs). Restating the base config
	// verbatim proves the patch leaves the row untouched.
	ok("CLI profile: tool-web row untouched by our patch (preset-layer ownership)", () => {
		const row = byId.get("tool-web");
		assert.ok(row, "tool-web row missing from composed tree");
		assert.notEqual(row.disabled, true, "our patch must not disable tool-web");
		assert.deepEqual(row.config, { fetch: false, searchTimeoutMs: 60000 });
	});
}

// ── 3. shipped-patch shape guard ────────────────────────────────────────────

ok("shipped patch has no tool-web entry (the profile layer cannot own the model-facing tool)", () => {
	const ids = ourPatches.flatMap((p) => (p.insert ? p.insert : [p])).map((row) => row.id);
	assert.ok(ids.includes("web-search-ext"), "patch must still insert the provider row");
	assert.ok(ids.includes("web"), "patch must still patch the web seam row");
	assert.ok(!ids.includes("tool-web"), "tool-web entries are inert in the web profile and redundant elsewhere — the plugin registers web_fetch at apply time instead");
});

// ── 4. manifest sanity ──────────────────────────────────────────────────────

ok("package.json still declares the bundle patch (auto-apply mechanism) and ships it", () => {
	const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
	assert.equal(manifest.dsh?.bundle?.patch, "./cordis.patch.yml");
	assert.ok(manifest.files?.includes("cordis.patch.yml"), "cordis.patch.yml must be in the published files list");
});

ok("package.json declares @deepseek-ai/dsh-tool-web (the apply-time tool registration imports it)", () => {
	const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
	assert.ok(
		manifest.peerDependencies?.["@deepseek-ai/dsh-tool-web"] ?? manifest.dependencies?.["@deepseek-ai/dsh-tool-web"],
		"dsh-tool-web must be a declared dependency (runtime import of applyWebFetchTool)"
	);
});

console.log(`# composition: ${passed} passed`);
