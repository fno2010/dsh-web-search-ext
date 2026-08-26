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
import { checkLiveness, verifySources, markSnippet, isSafeUrl } from "./verify.js";

/** Cordis plugin name used by loader diagnostics. */
const name = "dsh-web-search-ext";
/** The web seam this provider registers into. */
const inject = ["web"];

/** Stable id this provider registers under (`ctx.web` registry key). */
const PROVIDER_ID = "web-search-ext";
/** Settings namespace carrying this provider's configuration. */
const SETTINGS_NAMESPACE = settingsNamespace("web-search-ext");
/** Attribution user agent for both backends. */
const USER_AGENT = "dsh-web-search-ext/0.3.0";
/** Attribution header on Exa anonymous MCP requests (Exa documents this header). */
const EXA_MCP_SOURCE = "dsh-web-search-ext";
/** Exa hosted MCP tool name for plain web search. */
const EXA_MCP_TOOL = "web_search_exa";
/** Exa hosted MCP tool name for single-URL content fetch. */
const EXA_MCP_FETCH_TOOL = "web_fetch_exa";
/** Firecrawl accepts at most 50 results per search; clamp silently. */
const FIRECRAWL_MAX_LIMIT = 50;

/**
 * Map the user-facing freshness window to per-backend parameters.
 * - Exa REST: `startPublishedDate` (YYYY-MM-DD, inclusive lower bound).
 * - Firecrawl v2: `tbs` time filter (Google-style relative windows).
 * - Exa anonymous MCP: NOT supported (the tool's schema only accepts
 *   `query` + `numResults`); the window is simply ignored there.
 */
function freshnessParams(freshness) {
	switch (freshness) {
		case "24h":
			return { exaStartDate: new Date(Date.now() - 86_400_000).toISOString().slice(0, 10), firecrawlTbs: "qdr:d" };
		case "7d":
			return { exaStartDate: new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10), firecrawlTbs: "qdr:w" };
		case "30d":
			return { exaStartDate: new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10), firecrawlTbs: "qdr:m" };
		default:
			return {};
	}
}

/**
 * Best-effort extraction of a `retry_after_seconds` value from a 429 body
 * (Firecrawl's structured `{error:{reason, retry_after_seconds}}` as well as
 * any `Retry-After`-style text). Returns `undefined` when absent.
 */
function extractRetryAfterSeconds(body) {
	if (body === undefined || body === null) return undefined;
	try {
		const parsed = typeof body === "string" ? JSON.parse(body) : body;
		const candidates = [
			parsed?.error?.retry_after_seconds,
			parsed?.retry_after_seconds,
			parsed?.retryAfterSeconds
		];
		for (const value of candidates) {
			// Backends may report the window as a numeric string.
			const num = typeof value === "string" ? Number(value.trim()) : value;
			if (typeof num === "number" && Number.isFinite(num) && num > 0) return Math.floor(num);
		}
	} catch {
		/* not JSON — fall through to the text scan */
	}
	const text = typeof body === "string" ? body : JSON.stringify(body);
	const match = text.match(/retry[_\s-]?after(?:[_\s-]?seconds)?["']?\s*[:=]\s*["']?(\d{1,9})/iu);
	return match !== null && match[1] !== undefined ? Number(match[1]) : undefined;
}

/**
 * Parse the standard `Retry-After` response header (RFC 7231): either
 * delta-seconds or an HTTP-date. Returns undefined when absent/unparsable
 * or when the date is in the past.
 * @param {{get?: (name: string) => string|null|undefined}} [headers]
 * @returns {number|undefined}
 */
function retryAfterHeaderSeconds(headers) {
	const raw = headers?.get?.("retry-after");
	if (typeof raw !== "string" || raw.trim() === "") return undefined;
	const trimmed = raw.trim();
	if (/^\d+$/.test(trimmed)) {
		const secs = Number(trimmed);
		return secs > 0 ? secs : undefined;
	}
	const dateMs = Date.parse(trimmed);
	if (Number.isNaN(dateMs)) return undefined;
	const secs = Math.ceil((dateMs - Date.now()) / 1000);
	return secs > 0 ? secs : undefined;
}

/**
 * Read a response body as text for error diagnostics, capped so a large
 * error body cannot bloat the message. Never throws: returns "" when the
 * body is missing or unreadable.
 */
async function safeBody(response) {
	try {
		const text = await response.text();
		return text.length > 4096 ? text.slice(0, 4096) : text;
	} catch {
		return "";
	}
}

/**
 * Build the WEB_RATE_LIMIT error for a 429 response (G2-lite):
 * human-readable cause, the backend's own retry window when it reports
 * one (clamped to `maxCooldownSec`; falls back to `rateLimitCooldownSec`
 * when the backend reports nothing), and the path to remove the limit.
 */
async function rateLimitError(label, response, options) {
	// Standard header first (RFC 7231), then the backend's own body-reported
	// window (e.g. Firecrawl's `error.retry_after_seconds`).
	const reported =
		retryAfterHeaderSeconds(response?.headers) ??
		(await extractRetryAfterSeconds(await safeBody(response)));
	const capSec = options.maxCooldownSec;
	const effectiveSec =
		reported === undefined
			? options.rateLimitCooldownSec
			: capSec !== undefined && capSec > 0
				? Math.min(reported, capSec)
				: reported;
	const windowText =
		reported !== undefined && reported >= 3600
			? `; backend reports ~${Math.round((reported / 3600) * 10) / 10}h until the window resets`
			: reported !== undefined
				? `; retry in ~${reported}s`
				: effectiveSec > 0
					? `; backing off ${effectiveSec}s`
					: "";
	const unlock = label.startsWith("Firecrawl")
		? "Set FIRECRAWL_API_KEY (free tier available) to use your own quota instead of the shared keyless pool."
		: "Set EXA_API_KEY for higher limits.";
	const error = new WebError(`${label} rate limit (HTTP 429)${windowText}. ${unlock}`, "WEB_RATE_LIMIT");
	error.retryAfterSec = effectiveSec;
	return error;
}

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
	/** Seconds a transient-failure backend is skipped; 0 disables the cooldown. */
	rateLimitCooldownSec: z.number().step(1).min(0).default(60),
	/** Allow Firecrawl without a key (unofficial, may be rate-limited or removed). */
	firecrawlKeyless: z.boolean().default(true),
	/**
	 * Result verification tier (B1). `liveness`: HEAD every returned source and
	 * tag it alive/404/blocked/timeout (purely local, no vendor quota).
	 * `content`: also GET the first N KB and check the snippet text still
	 * appears on the live page (experimental). `off`: no verification.
	 */
	verifyLevel: z.union(["off", "liveness", "content"]).default("liveness"),
	/** Per-URL timeout for L0 liveness HEAD checks. */
	livenessTimeoutMs: z.number().step(1).min(500).max(30000).default(3000),
	/** L1: max bytes read from each page. */
	contentCheckBytes: z.number().step(1).min(1024).max(200000).default(10240),
	/** L1: pages shorter than this are treated as bot-blocks / empty shells. */
	contentCheckMinBytes: z.number().step(1).min(0).max(10000).default(200),
	/** L1: leading snippet words checked against the live page. */
	contentCheckMatchWords: z.number().step(1).min(1).max(50).default(5),
	/** L1: per-URL timeout for content checks. */
	contentCheckTimeoutMs: z.number().step(1).min(500).max(30000).default(3000),
	/**
	 * Freshness window (B2). `any` disables; otherwise results are restricted
	 * to pages published within the window (Exa REST startPublishedDate,
	 * Firecrawl tbs). The keyless Exa MCP path ignores it (schema-limited).
	 */
	freshness: z.union(["any", "24h", "7d", "30d"]).default("any"),
	/**
	 * Cap on 429 cooldowns derived from a backend's reported
	 * `retry_after_seconds`; a missing or malformed value falls back to
	 * `rateLimitCooldownSec`. 0 means "always honor the reported value".
	 */
	maxCooldownSec: z.number().step(1).min(0).max(172800).default(86400),
	/** Character cap for web_fetch provider output (L2 deep read). */
	fetchMaxChars: z.number().step(1).min(1000).max(200000).default(50000)
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
	const body = {
		query: request.query,
		type: "auto",
		numResults,
		contents: { highlights: { highlightsPerUrl: 2 } }
	};
	const fp = freshnessParams(options.freshness);
	if (fp.exaStartDate !== undefined) body.startPublishedDate = fp.exaStartDate;
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
			body: JSON.stringify(body)
		});
	} catch (error) {
		wrapNetworkError("Exa REST", error, signal);
	}
	if (response.status === 429) {
		throw await rateLimitError("Exa REST", response, options);
	}
	if (response.status === 401 || response.status === 402 || response.status === 403) {
		throw new WebError(`Exa REST rejected the API key (HTTP ${response.status})`, "WEB_PROVIDER_ERROR");
	}
	if (!response.ok) {
		// safeBody never throws (unlike the json()-then-text() fallback,
		// which can never run: the body stream is consumed by json()).
		const detail = (await safeBody(response)).slice(0, 200);
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
		throw await rateLimitError("Exa MCP", response, options);
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
	const body = { query: request.query, limit };
	const fp = freshnessParams(options.freshness);
	if (fp.firecrawlTbs !== undefined) body.tbs = fp.firecrawlTbs;
	let response;
	try {
		response = await fetch(url, {
			method: "POST",
			redirect: "error",
			signal,
			headers,
			body: JSON.stringify(body)
		});
	} catch (error) {
		wrapNetworkError("Firecrawl", error, signal);
	}
	if (response.status === 429) {
		throw await rateLimitError("Firecrawl", response, options);
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

// ── fetch backends (0.3.0, L2) ───────────────────────────────────────────────

/**
 * Shared guard for explicit URL fetches: the URL must be a public http(s)
 * address (SSRF guard — same rules as the verification checks). The target
 * URL is not fetched by this process; it is handed to a backend's scraping
 * service — but internal addresses are refused regardless.
 * @throws {WebError} WEB_PROVIDER_ERROR when the URL is invalid or not public.
 */
function assertFetchableUrl(url) {
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		throw new WebError(`web_fetch: not a valid URL: ${String(url).slice(0, 200)}`, "WEB_PROVIDER_ERROR");
	}
	if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
		throw new WebError(`web_fetch: unsupported URL scheme: ${parsed.protocol}`, "WEB_PROVIDER_ERROR");
	}
	if (!isSafeUrl(url)) {
		throw new WebError(
			`web_fetch: refusing to fetch a private or loopback address (${parsed.hostname}); only public http(s) addresses are allowed`,
			"WEB_PROVIDER_ERROR"
		);
	}
}

/**
 * Firecrawl scrape (`POST {base}/scrape`): fetch one URL through the
 * Firecrawl service (keyed or keyless) and normalize it to a WebFetchResult.
 * A non-2xx target page is a RESULT, not an error, when Firecrawl reports
 * it (the status code is part of the page's state). HTTP 429 from Firecrawl
 * throws `WEB_RATE_LIMIT` with the reported retry window; other failures
 * throw `WEB_PROVIDER_ERROR`.
 */
async function firecrawlScrape(options, apiKey, url, maxChars, signal) {
	throwIfAborted(signal);
	assertFetchableUrl(url);
	const endpoint = `${options.firecrawlBaseUrl.replace(/\/+$/u, "")}/scrape`;
	const headers = {
		"content-type": "application/json",
		accept: "application/json",
		"user-agent": USER_AGENT
	};
	if (apiKey !== undefined) headers.authorization = `Bearer ${apiKey}`;
	let response;
	try {
		response = await fetch(endpoint, {
			method: "POST",
			redirect: "error",
			signal,
			headers,
			body: JSON.stringify({ url, formats: ["markdown", "html"] })
		});
	} catch (error) {
		wrapNetworkError("Firecrawl", error, signal);
	}
	if (response.status === 429) {
		throw await rateLimitError("Firecrawl", response, options);
	}
	if (response.status === 401 || response.status === 402 || response.status === 403) {
		throw new WebError(
			apiKey === undefined
				? `Firecrawl keyless scrape unavailable (HTTP ${response.status}); set a FIRECRAWL_API_KEY`
				: `Firecrawl rejected the API key (HTTP ${response.status})`,
			"WEB_PROVIDER_ERROR"
		);
	}
	if (!response.ok) {
		throw new WebError(`Firecrawl scrape error (HTTP ${response.status})`, "WEB_PROVIDER_ERROR");
	}
	let parsed;
	try {
		parsed = await response.json();
	} catch (error) {
		wrapNetworkError("Firecrawl", error, signal);
	}
	const data = parsed?.data;
	// Prefer the richest non-empty representation: markdown > html > text.
	// A scraped 404 page usually has empty markdown but a body in html.
	const markdown = typeof data?.markdown === "string" && data.markdown.length > 0 ? data.markdown : undefined;
	const html = typeof data?.html === "string" && data.html.length > 0 ? data.html : undefined;
	const text =
		markdown ?? html ?? (typeof data?.text === "string" && data.text.length > 0 ? data.text : undefined);
	if (text === undefined) {
		throw new WebError(
			`Firecrawl scrape failed: ${String(parsed?.error ?? "no readable content in response")}`,
			"WEB_PROVIDER_ERROR"
		);
	}
	// The target page's status comes from Firecrawl's metadata; a scraped
	// 404 page is a result (empty content), not a provider error.
	const statusCode = typeof data?.metadata?.statusCode === "number" ? data.metadata.statusCode : 200;
	const finalUrl =
		typeof data?.metadata?.url === "string" && data.metadata.url.length > 0 ? data.metadata.url : url;
	const truncated = text.length > maxChars;
	return {
		url: finalUrl,
		statusCode,
		// kind describes the representation actually delivered: html is only
		// used when markdown is absent, so text-only payloads say "text".
		body: { kind: markdown === undefined && html !== undefined ? "html" : "text", content: truncateTo(text, maxChars) },
		truncated
	};
}

/**
 * Exa hosted-MCP content fetch (`web_fetch_exa`). Keyless: no credentials
 * are sent; the anonymous pool applies and `maxCharacters` is capped by the
 * caller. Exa does not report the target's HTTP status, so a successful
 * retrieval is represented as 200.
 */
async function exaMcpFetch(options, url, maxChars, signal) {
	throwIfAborted(signal);
	assertFetchableUrl(url);
	let response;
	try {
		response = await fetch(options.exaMcpUrl, {
			method: "POST",
			redirect: "error",
			signal,
			headers: {
				"content-type": "application/json",
				accept: "application/json, text/event-stream",
				"x-exa-source": EXA_MCP_SOURCE,
				"user-agent": USER_AGENT
			},
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: randomUUID(),
				method: "tools/call",
				params: {
					name: EXA_MCP_FETCH_TOOL,
					arguments: {
						urls: [url],
						...maxChars !== undefined ? { maxCharacters: maxChars } : {}
					}
				}
			})
		});
	} catch (error) {
		wrapNetworkError("Exa MCP", error, signal);
	}
	if (response.status === 429) {
		throw await rateLimitError("Exa MCP", response, options);
	}
	if (!response.ok) {
		throw new WebError(`Exa MCP fetch error (HTTP ${response.status})`, "WEB_PROVIDER_ERROR");
	}
	const payload = parseSsePayload(await response.text());
	if (payload === null) throw new WebError("Exa MCP fetch returned an unprocessable response body", "WEB_PROVIDER_ERROR");
	if (payload.error !== undefined && payload.error !== null) {
		throw new WebError(`Exa MCP fetch error: ${String(payload.error.message ?? JSON.stringify(payload.error))}`, "WEB_PROVIDER_ERROR");
	}
	if (payload.result?.isError === true) {
		const detail = collectMcpText(payload);
		throw new WebError(`Exa MCP fetch failed${detail.length > 0 ? `: ${detail.slice(0, 300)}` : ""}`, "WEB_PROVIDER_ERROR");
	}
	const text = collectMcpText(payload).trim();
	if (text.length === 0) {
		throw new WebError("Exa MCP fetch returned no content", "WEB_PROVIDER_ERROR");
	}
	return {
		url,
		statusCode: 200,
		body: { kind: "text", content: truncateTo(text, maxChars) },
		truncated: text.length > maxChars
	};
}

// ── verification + receipt (0.3.0) ───────────────────────────────────────────

/** Status → compact receipt word for the verification summary. */
const RECEIPT_WORDS = {
	alive: "alive",
	consistent: "verified",
	unverified: "unverified",
	changed: "changed",
	not_found: "dead",
	blocked: "blocked",
	forbidden: "blocked",
	unsafe: "blocked",
	unsafe_url: "blocked",
	timeout: "timeout",
	error: "unreachable",
	aborted: "skipped"
};

/**
 * One-line provenance receipt (C-lite): which backend answered, how long
 * the search took, how many results came back, and the verification
 * summary when a tier ran. Lands at the top of `content` so the model
 * (and a future tool-view card) sees the result's provenance without
 * re-deriving it.
 */
function buildReceipt(label, startedAt, total, { truncated, tier, statuses, freshness, ignoredFreshness }) {
	const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
	let line = `web-search-ext: ${label} · ${seconds}s · ${total} result${total === 1 ? "" : "s"}`;
	if (truncated === true) line += " · (truncated)";
	if (statuses !== undefined && tier !== undefined) {
		const counts = new Map();
		for (const entry of statuses.values()) {
			const word = RECEIPT_WORDS[entry.status] ?? "unknown";
			counts.set(word, (counts.get(word) ?? 0) + 1);
		}
		const summary = [...counts.entries()].map(([word, n]) => `${n} ${word}`).join(", ");
		line += ` · ${tier}: ${summary}`;
	}
	if (ignoredFreshness === true && freshness !== undefined && freshness !== "any") {
		line += ` · freshness ${freshness} not honored (keyless exa has no date filter)`;
	}
	return `${line}\n`;
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
	/** backend name → `{ at: epoch ms of last 429, ms: per-backend cooldown duration }` (G2: honors the backend's own retry window). */
	#cooldowns = new Map();

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
		const startedAt = Date.now();
		const plan = [];
		const exaKey = await resolveKey(this.#ctx, options, "exa");
		plan.push({
			name: "exa",
			label: exaKey !== undefined ? "exa-rest" : "exa-mcp",
			run: () => (exaKey !== undefined ? exaRestSearch(options, exaKey, request, signal) : exaMcpSearch(options, request, signal))
		});
		const firecrawlKey = await resolveKey(this.#ctx, options, "firecrawl");
		if (firecrawlKey !== undefined || options.firecrawlKeyless === true) {
			plan.push({ name: "firecrawl", label: "firecrawl", run: () => firecrawlSearch(options, firecrawlKey, request, signal) });
		}
		if (options.preferred === "firecrawl") plan.reverse();

		const now = Date.now();
		const failures = [];
		for (const backend of plan) {
			const entry = this.#cooldowns.get(backend.name);
			const cooledDown = entry !== undefined && now < entry.at + entry.ms;
			// Skip a cooling backend only when another candidate remains; a
			// skipped backend is reported so an all-cooling failure explains
			// why nothing was attempted.
			if (cooledDown && plan.length > 1) {
				failures.push(`${backend.name} (in rate-limit cooldown, retry in ${Math.ceil((entry.at + entry.ms - now) / 1000)}s)`);
				continue;
			}
			try {
				const raw = await backend.run();
				return await this.#finalize(raw, options, { label: backend.label, startedAt, signal });
			} catch (error) {
				if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal?.reason ?? error);
				const rateLimited = error instanceof WebError && error.code === "WEB_RATE_LIMIT";
				if (rateLimited) {
					// Honor the backend's own retry window when it reports one
					// (rateLimitError already clamps it to `maxCooldownSec` and
					// falls back to `rateLimitCooldownSec`); otherwise use the
					// configured flat cooldown. A 0s duration disables the
					// cooldown entirely.
					const sec = typeof error.retryAfterSec === "number" && error.retryAfterSec > 0 ? error.retryAfterSec : options.rateLimitCooldownSec;
					this.#cooldowns.set(backend.name, { at: Date.now(), ms: sec * 1000 });
				}
				failures.push(`${backend.name}${rateLimited ? " (rate limited)" : ""}: ${String(error.message ?? error)}`);
			}
		}
		throw new WebError(
			`web_search: all backends failed — ${failures.join(" | ") || "no backend was usable"}`,
			"WEB_PROVIDER_ERROR"
		);
	}

	/**
	 * Apply the configured verification tier to a successful backend
	 * result, tag each source snippet, and prepend the provenance receipt
	 * to `content` (C-lite). Verification is purely local HTTP (no vendor
	 * quota, no LLM tokens); `verifyLevel: off` passes results through
	 * with only the receipt. An abort during verification propagates as
	 * `WEB_ABORTED` exactly like an abort mid-search.
	 */
	async #finalize(raw, options, { label, startedAt, signal }) {
		const sources = raw.sources;
		const verifyLevel = options.verifyLevel ?? "liveness";
		let statuses;
		let tier;
		if (verifyLevel !== "off" && sources.length > 0 && signal?.aborted !== true) {
			statuses = await checkLiveness(
				sources.map((source) => source.url),
				{ timeoutMs: options.livenessTimeoutMs, signal }
			);
			tier = "liveness";
			if (verifyLevel === "content" && signal?.aborted !== true) {
				statuses = await verifySources(sources, {
					bytes: options.contentCheckBytes,
					minContentBytes: options.contentCheckMinBytes,
					matchWords: options.contentCheckMatchWords,
					timeoutMs: options.contentCheckTimeoutMs,
					signal
				});
				tier = "content";
			}
		}
		if (signal?.aborted === true) throw searchAborted(signal?.reason);
		const marked =
			statuses === undefined
				? sources
				: sources.map((source) => {
						const entry = statuses.get(source.url);
						if (entry === undefined) return source;
						// Surface detail only where the status label alone does
						// not state it (network error reasons, L1 word-match
						// ratio).
						const detail =
							entry.status === "error" || entry.status === "changed" ? entry.detail : undefined;
						return { ...source, snippet: markSnippet(source.snippet ?? "", entry.status, detail) };
					});
		const receipt = buildReceipt(label, startedAt, sources.length, {
			truncated: raw.truncated,
			tier,
			statuses,
			freshness: options.freshness,
			ignoredFreshness: label === "exa-mcp"
		});
		return {
			...raw,
			sources: marked,
			content: raw.content !== undefined ? receipt + raw.content : receipt
		};
	}
}

/**
 * The multi-backend fetch provider (0.3.0, L2). Fetches one URL through
 * Firecrawl scrape first (cleaner markdown + richer metadata) with the
 * keyless Exa MCP `web_fetch_exa` as fallback; per-backend 429 cooldowns
 * work exactly like the search provider's. Shares its config with the
 * search provider; the seam's search and fetch registries are independent,
 * so both providers register under the same id.
 */
class MultiBackendFetchProvider {
	#ctx;
	#resolveOptions;
	/** backend name → `{ at: epoch ms of last 429, ms: cooldown duration }`. */
	#cooldowns = new Map();

	/**
	 * @param ctx - plugin context (credentials, launch environment).
	 * @param resolveOptions - thunk returning the options for the NEXT fetch.
	 */
	constructor(ctx, resolveOptions) {
		this.#ctx = ctx;
		this.#resolveOptions = resolveOptions;
	}

	/** Stable seam registry key (same id as the search provider). */
	get id() {
		return PROVIDER_ID;
	}

	/**
	 * Cheap local usability check: at least one fetch endpoint must be
	 * parseable. Both backends work keyless, so the provider is almost
	 * always usable; key problems surface per-fetch with actionable errors.
	 */
	available() {
		const options = this.#resolveOptions();
		return URL.canParse(options.firecrawlBaseUrl) || URL.canParse(options.exaMcpUrl);
	}

	/**
	 * Fetch one URL with failover. A non-2xx target page is a result, not
	 * an error, when a backend reports it; aborts always propagate
	 * immediately. When all backends fail, throws `WEB_PROVIDER_ERROR`
	 * with one line per failed backend.
	 */
	async fetch(request, signal) {
		throwIfAborted(signal);
		const options = this.#resolveOptions();
		const url = request.url;
		const maxChars = options.fetchMaxChars;
		const plan = [];
		const firecrawlKey = await resolveKey(this.#ctx, options, "firecrawl");
		if (firecrawlKey !== undefined || options.firecrawlKeyless === true) {
			plan.push({ name: "firecrawl", run: () => firecrawlScrape(options, firecrawlKey, url, maxChars, signal) });
		}
		plan.push({ name: "exa-mcp", run: () => exaMcpFetch(options, url, maxChars, signal) });

		const now = Date.now();
		const failures = [];
		for (const backend of plan) {
			const entry = this.#cooldowns.get(backend.name);
			const cooledDown = entry !== undefined && now < entry.at + entry.ms;
			// Skip a cooling backend only when another candidate remains.
			if (cooledDown && plan.length > 1) {
				failures.push(`${backend.name} (in rate-limit cooldown, retry in ${Math.ceil((entry.at + entry.ms - now) / 1000)}s)`);
				continue;
			}
			try {
				return await backend.run();
			} catch (error) {
				if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal?.reason ?? error);
				const rateLimited = error instanceof WebError && error.code === "WEB_RATE_LIMIT";
				if (rateLimited) {
					const sec =
						typeof error.retryAfterSec === "number" && error.retryAfterSec > 0
							? error.retryAfterSec
							: options.rateLimitCooldownSec;
					this.#cooldowns.set(backend.name, { at: Date.now(), ms: sec * 1000 });
				}
				failures.push(`${backend.name}${rateLimited ? " (rate limited)" : ""}: ${String(error.message ?? error)}`);
			}
		}
		throw new WebError(
			`web_fetch: all backends failed — ${failures.join(" | ") || "no backend was usable"}`,
			"WEB_PROVIDER_ERROR"
		);
	}
}

// ── Cordis plugin wiring ─────────────────────────────────────────────────────

/**
 * Register both providers with `ctx.web` and install the Settings section,
 * so `settings.yaml` (or the settings card) edits the same config both
 * providers serve — live, without restart.
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
	ctx.web.registerFetchProvider(new MultiBackendFetchProvider(ctx, () => current()));
}

export {
	PROVIDER_ID,
	SETTINGS_NAMESPACE,
	Config,
	MultiBackendSearchProvider,
	MultiBackendFetchProvider,
	apply,
	inject,
	name
};
