/**
 * dsh-web-search-ext
 *
 * Dual-backend `WebSearchProvider` for the DeepSeek Harness web capability seam
 * (`ctx.web`), built for the model-facing `web_search` tool:
 *
 *   - Exa: `POST {exaApiUrl}` (REST) when an API key is available, otherwise
 *     Exa's documented unauthenticated public MCP fallback
 *     (`POST {exaMcpUrl}`, JSON-RPC 2.0, SSE response) — no key required,
 *     rate-limited by Exa (HTTP 429).
 *   - Firecrawl: `POST {firecrawlBaseUrl}/search` with Bearer auth when a key
 *     is available; keyless requests are allowed when `firecrawlKeyless` is
 *     true (its anonymous endpoint worked at build time and may be
 *     rate-limited or removed at any time).
 *
 * Failover: backends are tried in `preferred` order (default: Exa first).
 * Any backend failure (429, 401/402/403, 5xx, network error, malformed
 * response) falls through to the next backend; a 429 additionally starts a
 * per-backend cooldown (`rateLimitCooldownSec`, default 60s) during which the
 * backend is skipped — unless it is the only remaining candidate. When every
 * backend fails, the error message lists each backend's failure.
 *
 * This is an implementation package: it registers ONE provider into `ctx.web`
 * and owns no model-facing tools (those belong to `@deepseek-ai/dsh-tool-web`).
 * It installs a Settings section (`web-search-ext`) so the Web panel
 * or `settings.yaml` can reconfigure it live — no restart on config change.
 *
 * Security: the only outbound requests are to the configured Exa and
 * Firecrawl endpoints. Keys never appear in request bodies, never in error
 * messages, and are never sent to the other backend. No install-time scripts
 * run (plain ESM, no build step).
 *
 * @module dsh-web-search-ext
 */

import z from "@deepseek-ai/schemastery";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { installSettingsSection, settingsNamespace } from "@deepseek-ai/dsh-settings";
import { launchEnvironmentOf } from "@deepseek-ai/dsh-launch-environment";
import { WebError } from "@deepseek-ai/dsh-web";
import { randomUUID } from "node:crypto";

/** Cordis plugin name used by loader diagnostics. */
const name = "dsh-web-search-ext";
/** The web seam this provider registers into. */
const inject = ["web"];

/** Stable id this provider registers under (`ctx.web` registry key). */
const PROVIDER_ID = "web-search-ext";
/** Settings namespace carrying this provider's configuration. */
const SETTINGS_NAMESPACE = settingsNamespace("web-search-ext");
/** Attribution user agent for both backends. */
const USER_AGENT = "dsh-web-search-ext/0.1.2";
/** Attribution header on Exa anonymous MCP requests (Exa documents this header). */
const EXA_MCP_SOURCE = "dsh-web-search-ext";
/** Exa hosted MCP tool name for plain web search. */
const EXA_MCP_TOOL = "web_search_exa";
/** Firecrawl accepts at most 50 results per search; clamp silently. */
const FIRECRAWL_MAX_LIMIT = 50;

/**
 * Plugin configuration. The Settings section (settings.yaml namespace
 * `web-search-ext`) and the row config in `cordis.patch.yml` both
 * feed this schema; the settings section wins on overlap.
 */
const Config = z.object({
	/** Backend tried first when both are usable. */
	preferred: z.union(["exa", "firecrawl"]).default("exa"),
	/** Literal Exa API key; empty/missing enables the anonymous MCP path. */
	exaApiKey: z.string().role("secret"),
	/** Credential/env name for the Exa key when no literal is set. */
	exaApiKeyEnv: z.string().role("credential-ref").default("EXA_API_KEY"),
	/** Literal Firecrawl API key; empty/missing uses the keyless endpoint. */
	firecrawlApiKey: z.string().role("secret"),
	/** Credential/env name for the Firecrawl key when no literal is set. */
	firecrawlApiKeyEnv: z.string().role("credential-ref").default("FIRECRAWL_API_KEY"),
	/** Exa REST search endpoint (used only when a key is available). */
	exaApiUrl: z.string().default("https://api.exa.ai/search"),
	/** Exa hosted MCP endpoint (the anonymous fallback). */
	exaMcpUrl: z.string().default("https://mcp.exa.ai/mcp"),
	/** Firecrawl base URL; `/search` is appended (v2 API by default). */
	firecrawlBaseUrl: z.string().default("https://api.firecrawl.dev/v2"),
	/** Default result count when the request carries no `maxResults`. */
	numResults: z.number().step(1).min(1).default(8),
	/** Upper bound on characters kept from one snippet. */
	maxSnippetChars: z.number().step(1).min(1).default(500),
	/** Seconds a 429-rate-limited backend is skipped; 0 disables the cooldown. */
	rateLimitCooldownSec: z.number().step(1).min(0).default(60),
	/** Allow Firecrawl without a key (unofficial, may be rate-limited or removed). */
	firecrawlKeyless: z.boolean().default(true)
});

// ── shared helpers ───────────────────────────────────────────────────────────

/** True for a fetch/`AbortSignal` abort, surfaced as `WEB_ABORTED`. */
function isAbortError(error) {
	return error instanceof DOMException && error.name === "AbortError";
}

/** Stable cancellation error carrying the caller's abort reason. */
function searchAborted(reason) {
	return new WebError("web search aborted", "WEB_ABORTED", { cause: reason });
}

/** Throw when the caller already aborted; safe to call before every network op. */
function throwIfAborted(signal) {
	if (signal?.aborted === true) throw searchAborted(signal.reason);
}

/** Re-throw aborts as `WEB_ABORTED`; wrap plain fetch failures as `WEB_PROVIDER_ERROR`. */
function wrapNetworkError(label, error, signal) {
	if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal?.reason ?? error);
	throw new WebError(`${label} request failed: ${String(error?.message ?? error)}`, "WEB_PROVIDER_ERROR", { cause: error });
}

/** Bound text to `max` characters. */
function truncateTo(text, max) {
	return text.length <= max ? text : text.slice(0, max);
}

/**
 * Resolve one backend's API key for the current options: literal config first,
 * then the credentials service, then the launch environment. `undefined`
 * means "no key" — callers decide what that means for their backend.
 */
async function resolveKey(ctx, options, kind) {
	const literal = options[`${kind}ApiKey`];
	if (literal !== undefined && literal.length > 0) return literal;
	const envName = options[`${kind}ApiKeyEnv`];
	const credentials = ctx.get("credentials");
	if (credentials !== undefined) {
		const hit = await credentials.resolve(credentialRef(envName));
		if (hit !== undefined && hit.value !== undefined && hit.value.length > 0) return hit.value;
	}
	const ambient = launchEnvironmentOf(ctx).get(envName);
	if (ambient !== undefined && ambient.value !== undefined && ambient.value.length > 0) return ambient.value;
	return undefined;
}

// ── Exa backends ─────────────────────────────────────────────────────────────

/** Map one Exa REST result to a normalized source, or `undefined` when snippet-less. */
function mapExaRestResult(result, maxSnippetChars) {
	const snippet = result.highlights?.find((highlight) => typeof highlight === "string" && highlight.trim().length > 0);
	if (snippet === undefined) return undefined;
	return {
		url: result.url,
		...result.title !== undefined && result.title.length > 0 ? { title: result.title } : {},
		snippet: truncateTo(snippet.trim(), maxSnippetChars),
		...result.publishedDate !== undefined && result.publishedDate.length > 0 ? { publishedAt: result.publishedDate } : {}
	};
}

/**
 * Exa REST search (`POST {exaApiUrl}`, Bearer auth). Returns normalized
 * sources. HTTP 429 throws `WEB_RATE_LIMIT`; any other failure throws
 * `WEB_PROVIDER_ERROR`.
 */
async function exaRestSearch(options, apiKey, request, signal) {
	throwIfAborted(signal);
	const numResults = request.maxResults ?? options.numResults;
	let response;
	try {
		response = await fetch(options.exaApiUrl, {
			method: "POST",
			redirect: "error",
			signal,
			headers: {
				"authorization": `Bearer ${apiKey}`,
				"content-type": "application/json",
				"accept": "application/json",
				"user-agent": USER_AGENT
			},
			body: JSON.stringify({
				query: request.query,
				type: "auto",
				numResults,
				contents: { highlights: { highlightsPerUrl: 2 } }
			})
		});
	} catch (error) {
		wrapNetworkError("Exa REST", error, signal);
	}
	if (response.status === 429) {
		throw new WebError("Exa REST rate limit (HTTP 429)", "WEB_RATE_LIMIT");
	}
	if (response.status === 401 || response.status === 402 || response.status === 403) {
		throw new WebError(`Exa REST rejected the API key (HTTP ${response.status})`, "WEB_PROVIDER_ERROR");
	}
	if (!response.ok) {
		let detail = "";
		try {
			detail = String((await response.json()).error ?? (await response.text()).slice(0, 200));
		} catch {
			/* keep the status-only message */
		}
		throw new WebError(`Exa REST error (HTTP ${response.status})${detail.length > 0 ? `: ${detail}` : ""}`, "WEB_PROVIDER_ERROR");
	}
	let parsed;
	try {
		parsed = await response.json();
	} catch (error) {
		wrapNetworkError("Exa REST", error, signal);
	}
	const sources = (parsed.results ?? []).map((result) => mapExaRestResult(result, options.maxSnippetChars)).filter((source) => source !== undefined);
	return { sources, truncated: false };
}

/** Parse an SSE (`text/event-stream`) body into its first `data:` payload, else plain JSON. */
function parseSsePayload(text) {
	const dataLines = text.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).replace(/^\s/, ""));
	if (dataLines.length > 0) {
		try {
			return JSON.parse(dataLines.join("\n"));
		} catch {
			return null;
		}
	}
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

/** Collect non-blank `content[].text` blocks from a normalized MCP result, joined with blank lines. */
function collectMcpText(payload) {
	const content = payload?.result?.content;
	if (!Array.isArray(content)) return [];
	return content
		.map((item) => (typeof item?.text === "string" ? item.text.replace(/\r\n?/g, "\n").trim() : ""))
		.filter((text) => text.length > 0)
		.join("\n\n");
}

/** Split joined Exa MCP text into per-result sections, each starting with `Title:`. */
function splitExaSections(joined) {
	return joined
		.split(/\n{2,}(?=Title:\s*)/)
		.map((section) => section.trim())
		.filter((section) => section.length > 0 && section.startsWith("Title:"));
}

/**
 * Parse one `Title:`-led section into a partial source. Handles both
 * `Published:` and `Published Date:` spellings; `N/A` values are dropped;
 * `---` separator lines never leak into highlights.
 */
function parseExaSection(section) {
	const out = {};
	let field = null;
	let textLines = null;
	for (const line of section.split("\n")) {
		if (/^---\s*$/.test(line)) {
			field = null;
			continue;
		}
		const title = line.match(/^Title:\s*(.*)$/);
		const url = line.match(/^URL:\s*(.*)$/);
		const published = line.match(/^Published(?: Date)?:\s*(.*)$/);
		const author = line.match(/^Author:\s*(.*)$/);
		if (title) {
			out.title = title[1].trim();
			field = null;
		} else if (url) {
			out.url = url[1].trim();
			field = null;
		} else if (published) {
			out.publishedAt = published[1].trim();
			field = null;
		} else if (author) {
			out.author = author[1].trim();
			field = null;
		} else if (/^Highlights:\s*$/.test(line)) {
			field = "highlights";
		} else if (/^Text:\s*$/.test(line)) {
			field = "text";
			textLines = [];
		} else if (field === "highlights") {
			const trimmed = line.trim();
			if (trimmed.length > 0) out.highlights ??= (out.highlights ?? []).concat(trimmed.replace(/^[-•]\s*/, ""));
		} else if (field === "text" && textLines !== null) {
			textLines.push(line);
		}
	}
	if (textLines !== null) out.text = textLines.join("\n").trim();
	if (out.publishedAt === "N/A") delete out.publishedAt;
	if (out.author === "N/A") delete out.author;
	return out;
}

/** Map parsed Exa MCP sections to normalized sources (snippet-less entries dropped). */
function mapExaMcpSections(sections, maxSnippetChars) {
	const sources = [];
	for (const section of sections) {
		const parsed = parseExaSection(section);
		if (parsed.url === undefined || parsed.url.length === 0) continue;
		const highlight = parsed.highlights?.find((item) => item.trim().length > 0 && item.trim() !== "---");
		const snippet = highlight !== undefined ? highlight : parsed.text !== undefined && parsed.text.length > 0 ? truncateTo(parsed.text, maxSnippetChars) : undefined;
		if (snippet === undefined) continue;
		sources.push({
			url: parsed.url,
			...parsed.title !== undefined && parsed.title.length > 0 ? { title: parsed.title } : {},
			snippet: truncateTo(snippet, maxSnippetChars),
			...parsed.publishedAt !== undefined && parsed.publishedAt.length > 0 ? { publishedAt: parsed.publishedAt } : {}
		});
	}
	return sources;
}

/**
 * Exa anonymous search through the hosted MCP server. No credentials are
 * sent; the `x-exa-source` header carries attribution. Rate-limited by Exa
 * (HTTP 429 → `WEB_RATE_LIMIT`).
 */
async function exaMcpSearch(options, request, signal) {
	throwIfAborted(signal);
	const numResults = request.maxResults ?? options.numResults;
	let response;
	try {
		response = await fetch(options.exaMcpUrl, {
			method: "POST",
			redirect: "error",
			signal,
			headers: {
				"content-type": "application/json",
				"accept": "application/json, text/event-stream",
				"x-exa-source": EXA_MCP_SOURCE,
				"user-agent": USER_AGENT
			},
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: randomUUID(),
				method: "tools/call",
				params: {
					name: EXA_MCP_TOOL,
					arguments: {
						query: request.query,
						numResults
					}
				}
			})
		});
	} catch (error) {
		wrapNetworkError("Exa MCP", error, signal);
	}
	if (response.status === 429) {
		throw new WebError("Exa anonymous MCP rate limit reached (HTTP 429); configure an EXA_API_KEY for higher limits", "WEB_RATE_LIMIT");
	}
	if (!response.ok) {
		throw new WebError(`Exa anonymous MCP error (HTTP ${response.status})`, "WEB_PROVIDER_ERROR");
	}
	const payload = parseSsePayload(await response.text());
	if (payload === null) throw new WebError("Exa MCP returned an unprocessable response body", "WEB_PROVIDER_ERROR");
	if (payload.error !== undefined && payload.error !== null) {
		throw new WebError(`Exa MCP error: ${String(payload.error.message ?? JSON.stringify(payload.error))}`, "WEB_PROVIDER_ERROR");
	}
	if (payload.result?.isError === true) {
		const detail = collectMcpText(payload);
		throw new WebError(`Exa MCP tool error${detail.length > 0 ? `: ${detail.slice(0, 300)}` : ""}`, "WEB_PROVIDER_ERROR");
	}
	const sections = splitExaSections(collectMcpText(payload));
	const sources = mapExaMcpSections(sections, options.maxSnippetChars);
	return { sources, truncated: false };
}

// ── Firecrawl backend ────────────────────────────────────────────────────────

/** Strip markdown image links from a Firecrawl description (page-markdown excerpts are noisy). */
function cleanFirecrawlDescription(text) {
	return text
		.replace(/!\[[^\]]*\]\([^)]*\)/gu, "")
		.replace(/\s+/gu, " ")
		.trim();
}

/**
 * Firecrawl search (`POST {base}/search`). Handles both the v2 envelope
 * (`data.web[]`) and the v1 envelope (`data[]`). Without a key the request
 * is anonymous — allowed only when `options.firecrawlKeyless` is true.
 * HTTP 429 throws `WEB_RATE_LIMIT`; 401/402/403 throw `WEB_PROVIDER_ERROR`.
 */
async function firecrawlSearch(options, apiKey, request, signal) {
	throwIfAborted(signal);
	const limit = Math.min(request.maxResults ?? options.numResults, FIRECRAWL_MAX_LIMIT);
	const url = `${options.firecrawlBaseUrl.replace(/\/+$/u, "")}/search`;
	const headers = {
		"content-type": "application/json",
		"accept": "application/json",
		"user-agent": USER_AGENT
	};
	if (apiKey !== undefined) headers.authorization = `Bearer ${apiKey}`;
	let response;
	try {
		response = await fetch(url, {
			method: "POST",
			redirect: "error",
			signal,
			headers,
			body: JSON.stringify({ query: request.query, limit })
		});
	} catch (error) {
		wrapNetworkError("Firecrawl", error, signal);
	}
	if (response.status === 429) {
		throw new WebError("Firecrawl rate limit (HTTP 429)", "WEB_RATE_LIMIT");
	}
	if (response.status === 401 || response.status === 402 || response.status === 403) {
		throw new WebError(
			apiKey === undefined
				? `Firecrawl keyless endpoint unavailable (HTTP ${response.status}); set a FIRECRAWL_API_KEY`
				: `Firecrawl rejected the API key (HTTP ${response.status})`,
			"WEB_PROVIDER_ERROR"
		);
	}
	if (!response.ok) {
		throw new WebError(`Firecrawl error (HTTP ${response.status})`, "WEB_PROVIDER_ERROR");
	}
	let parsed;
	try {
		parsed = await response.json();
	} catch (error) {
		wrapNetworkError("Firecrawl", error, signal);
	}
	if (parsed.success === false) {
		throw new WebError(`Firecrawl search failed: ${String(parsed.error ?? "unknown error")}`, "WEB_PROVIDER_ERROR");
	}
	// v2 nests results under data.web; v1 returns a bare data array.
	const items = Array.isArray(parsed.data) ? parsed.data : parsed.data?.web ?? [];
	const sources = items
		.filter((item) => typeof item?.url === "string" && item.url.length > 0)
		.map((item) => {
			const description = cleanFirecrawlDescription(item.description ?? "");
			return {
				url: item.url,
				...typeof item.title === "string" && item.title.length > 0 ? { title: item.title } : {},
				...description.length > 0 ? { snippet: truncateTo(description, options.maxSnippetChars) } : {}
			};
		});
	return { sources, truncated: false };
}

// ── provider ─────────────────────────────────────────────────────────────────

/**
 * The multi-backend provider. One registered seam provider (`web-search-ext`)
 * that plans a per-call backend order, executes with failover, and keeps a
 * per-backend 429 cooldown so a saturated backend is not re-tried on every
 * search. Options are snapshotted once per search so one operation never
 * mixes two settings sections.
 */
class MultiBackendSearchProvider {
	#ctx;
	#resolveOptions;
	/** backend name → epoch ms of last observed 429. */
	#cooldowns = new Map();
	/** backend name → last observed non-429 failure (for the combined error). */

	/**
	 * @param ctx - plugin context (credentials, launch environment).
	 * @param resolveOptions - thunk returning the options for the NEXT search.
	 */
	constructor(ctx, resolveOptions) {
		this.#ctx = ctx;
		this.#resolveOptions = resolveOptions;
	}

	/** Stable seam registry key. */
	get id() {
		return PROVIDER_ID;
	}

	/**
	 * Cheap local usability check: at least one endpoint must be parseable.
	 * Exa's anonymous path needs no credentials, so the provider is almost
	 * always usable; key problems surface per-search with actionable errors.
	 */
	available() {
		const options = this.#resolveOptions();
		return URL.canParse(options.exaMcpUrl) || URL.canParse(options.firecrawlBaseUrl);
	}

	/**
	 * Run one search with failover. Tries backends in `preferred` order;
	 * each failure falls through to the next; a 429 starts the cooldown.
	 * Abort always propagates immediately. When all backends fail, throws
	 * `WEB_PROVIDER_ERROR` with one line per failed backend.
	 */
	async search(request, signal) {
		throwIfAborted(signal);
		const options = this.#resolveOptions();
		const plan = [];
		const exaKey = await resolveKey(this.#ctx, options, "exa");
		plan.push({
			name: "exa",
			run: () => (exaKey !== undefined ? exaRestSearch(options, exaKey, request, signal) : exaMcpSearch(options, request, signal))
		});
		const firecrawlKey = await resolveKey(this.#ctx, options, "firecrawl");
		if (firecrawlKey !== undefined || options.firecrawlKeyless === true) {
			plan.push({ name: "firecrawl", run: () => firecrawlSearch(options, firecrawlKey, request, signal) });
		}
		if (options.preferred === "firecrawl") plan.reverse();

		const now = Date.now();
		const cooldownMs = options.rateLimitCooldownSec * 1000;
		const failures = [];
		for (const backend of plan) {
			const until = this.#cooldowns.get(backend.name);
			const cooledDown = until !== undefined && now < until + cooldownMs;
			// Skip a cooling backend only when another candidate remains; a
			// skipped backend is reported so an all-cooling failure explains
			// why nothing was attempted.
			if (cooledDown && plan.length > 1) {
				failures.push(`${backend.name} (in rate-limit cooldown, retry in ${Math.ceil((until + cooldownMs - now) / 1000)}s)`);
				continue;
			}
			try {
				return await backend.run();
			} catch (error) {
				if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal?.reason ?? error);
				const rateLimited = error instanceof WebError && error.code === "WEB_RATE_LIMIT";
				if (rateLimited) this.#cooldowns.set(backend.name, Date.now());
				failures.push(`${backend.name}${rateLimited ? " (rate limited)" : ""}: ${String(error.message ?? error)}`);
			}
		}
		throw new WebError(
			`web_search: all backends failed — ${failures.join(" | ") || "no backend was usable"}`,
			"WEB_PROVIDER_ERROR"
		);
	}
}

// ── Cordis plugin wiring ─────────────────────────────────────────────────────

/**
 * Register the dual-backend provider with `ctx.web` and install its Settings
 * section, so `settings.yaml` (or a future settings card) edits the same
 * config the provider serves — live, without restart.
 */
function apply(ctx, config) {
	let current = () => config;
	installSettingsSection(ctx, SETTINGS_NAMESPACE, Config, config, {
		setSource: (source) => {
			current = source;
		},
		onChange: () => {}
	});
	ctx.web.registerSearchProvider(new MultiBackendSearchProvider(ctx, () => current()));
}

export {
	PROVIDER_ID,
	SETTINGS_NAMESPACE,
	Config,
	MultiBackendSearchProvider,
	apply,
	inject,
	name
};
