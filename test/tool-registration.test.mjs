/**
 * Tool-registration test — proves the model-facing web_fetch path the
 * profile-layer patch cannot provide.
 *
 * Why this test exists (the 0.3.0/0.3.1 root cause): model-facing tools are
 * registered by plugin apply() calls, and the `web_fetch` tool is owned by
 * the agent-preset layer, where every shipped preset ships `tool-web` with
 * `fetch: false` (and `dsh web` additionally disables the profile-layer
 * tool-web row). No composition path therefore registered `web_fetch`, and
 * the model got `unknown tool "web_fetch"` even though this plugin had a
 * working fetch provider pinned on the web seam.
 *
 * The fix under test: lib/index.js → registerWebFetchToolIfAbsent() calls
 * dsh-tool-web's own applyWebFetchTool when `web_fetch` is not already
 * visible, so the stock tool (schema, prompt section, presentation) is
 * registered by this plugin at apply time. Its execution routes through
 * `ctx.web.fetch` — the seam pinned to this plugin's SSRF-guarded
 * multi-backend provider by the bundle patch.
 *
 * The fake ctx mirrors the @deepseek-ai/dsh-tools ToolRuntime contract
 * (0.1.1-rc.2): register() inserts into the calling (global) layer and
 * throws on a same-layer duplicate; get() on an unscoped ctx resolves the
 * global layer only (scoped/agent registrations are invisible — scenario 7).
 * The registered tool's execute() must reach ctx.web.fetch. The end-to-end
 * proof that a real agent session then sees and calls the tool is the
 * release-time live smoke (AGENTS.md, Releasing step 1).
 */

import assert from "node:assert/strict";
import { registerWebFetchToolIfAbsent } from "../lib/index.js";

let passed = 0;
function ok(name, fn) {
	return fn().then(
		() => {
			passed += 1;
			console.log(`ok - ${name}`);
		},
		(err) => {
			console.error(`not ok - ${name}`);
			throw err;
		}
	);
}

/**
 * Minimal ctx mirroring the surfaces registerWebFetchToolIfAbsent touches:
 * tools (registry contract: register inserts into the GLOBAL layer and
 * throws on a same-layer duplicate; get on this unscoped apply-time ctx
 * sees the global layer only — agent-scoped registrations are invisible,
 * exactly as in ToolRuntime), systemPrompt (section recording), and
 * web.fetch (the seam — what the tool must route through; in a real host
 * this resolves to our pinned provider).
 */
function makeCtx({ globalTools = {}, scopedTools = {} } = {}) {
	const global = new Map(Object.entries(globalTools));
	const scoped = new Map(Object.entries(scopedTools));
	const sections = [];
	const webFetchCalls = [];
	const ctx = {
		tools: {
			register(definition) {
				// ToolRuntime contract: duplicates in one layer fail.
				if (global.has(definition.name)) throw new Error(`duplicate tool in layer: ${definition.name}`);
				global.set(definition.name, definition);
				return () => global.delete(definition.name);
			},
			// Unscoped apply-time ctx: the global layer only.
			get: (name) => global.get(name),
			has: (name) => global.has(name)
		},
		systemPrompt: {
			section: (spec) => sections.push(spec)
		},
		web: {
			fetch: async (request, signal) => {
				webFetchCalls.push({ request, signal });
				return {
					url: request.url,
					statusCode: 200,
					body: { kind: "text", content: "fetched-body" },
					truncated: false
				};
			}
		}
	};
	return { ctx, global, scoped, sections, webFetchCalls };
}

const { ctx, global: tools, sections, webFetchCalls } = makeCtx();

await ok("registers the stock web_fetch tool when it is absent", async () => {
	registerWebFetchToolIfAbsent(ctx);
	const def = tools.get("web_fetch");
	assert.ok(def, "web_fetch must be registered");
	assert.equal(def.name, "web_fetch");
	// defineTool compiles the parameter spec into raw JSON Schema.
	assert.equal(def.parameters.type, "object");
	assert.equal(def.parameters.properties.url.type, "string");
	assert.ok(
		Array.isArray(def.parameters.required) && def.parameters.required.includes("url"),
		"url must be required"
	);
	assert.equal(typeof def.execute, "function");
	assert.equal(typeof def.output?.render, "function", "must carry the stock output contract");
	assert.equal(def.timeoutMs, 30000, "stock tool timeout (DEFAULT_WEB_TOOL_TIMEOUT_MS)");
});

await ok("adds the stock web_fetch system-prompt section (order 111)", async () => {
	const section = sections.find((s) => s.name === "tool:web_fetch");
	assert.ok(section, "the tool's prompt section must be registered");
	assert.equal(section.order, 111);
});

await ok("execution routes through the ctx.web seam (our pinned provider)", async () => {
	const def = tools.get("web_fetch");
	const signal = new AbortController().signal;
	const result = await def.execute({ url: "https://example.com/article" }, { signal });
	assert.deepEqual(webFetchCalls, [
		{ request: { url: "https://example.com/article" }, signal }
	]);
	assert.deepEqual(result, {
		url: "https://example.com/article",
		statusCode: 200,
		body: { kind: "text", content: "fetched-body" },
		truncated: false
	});
});

await ok("no-ops when web_fetch is already visible in the global layer (preset/profile registered it)", async () => {
	const other = makeCtx({ globalTools: { web_fetch: { name: "web_fetch", presetRegistered: true } } });
	registerWebFetchToolIfAbsent(other.ctx);
	assert.equal(other.global.get("web_fetch").presetRegistered, true, "must not replace an existing registration");
	assert.equal(other.global.size, 1);
});

await ok("is idempotent in one scope (no same-layer duplicate error)", async () => {
	registerWebFetchToolIfAbsent(ctx); // second call on the same ctx
	assert.equal(tools.size, 1, "exactly one tool registered");
	assert.equal(tools.get("web_fetch").name, "web_fetch");
});

await ok("never registers web_search (the preset layer owns it)", async () => {
	assert.equal(tools.has("web_search"), false, "web_search stays preset-layer-owned; double registration would be a same-layer duplicate");
});

// Known benign edge (documented behavior of the ToolRuntime scope contract):
// an agent-SCOPED web_fetch (a future preset enabling tool-web.fetch) is
// invisible to this unscoped apply-time ctx's get(), so the guard registers
// a redundant GLOBAL web_fetch. No same-layer duplicate occurs; for that
// agent the scoped registration shadows the global one. The redundant
// global entry is harmless (identical stock tool, same seam) and is how the
// guard stays safe when scope visibility diverges.
await ok("scoped web_fetch is invisible to the unscoped guard; global fallback still registers without error", async () => {
	const { ctx, global, scoped } = makeCtx({
		scopedTools: { web_fetch: { name: "web_fetch", agentScoped: true } }
	});
	registerWebFetchToolIfAbsent(ctx);
	assert.ok(global.has("web_fetch"), "global fallback registered (scoped registration is invisible to the unscoped get)");
	assert.equal(scoped.get("web_fetch").agentScoped, true, "the scoped registration is left untouched");
});

console.log(`# tool-registration: ${passed} passed`);
