/**
 * Local result-verification utilities (B1, 0.3.0).
 *
 * Two tiers, both purely local (no vendor API quota, no LLM tokens):
 *
 *   L0 — `checkLiveness(urls)`: HEAD every returned source URL concurrently
 *        and classify it as alive / not_found / blocked / error / timeout.
 *        Marks are added to each source; no result is ever dropped.
 *
 *   L1 — `verifySources(sources)`: GET the first N KB of each source URL and
 *        check whether the snippet's leading words still appear in the live
 *        page (content-consistency check). Experimental; disabled by default.
 *
 * SSRF guards: only http/https URLs, no loopback / private / link-local
 * targets, and every redirect hop is re-validated before following it
 * (redirects are followed manually, not by the fetch engine).
 *
 * @module dsh-web-search-ext/verify
 */

/** Hard cap on redirect hops we are willing to follow. */
const MAX_REDIRECTS = 3;

/** User agent for verification requests (attribution + politeness). */
const VERIFY_USER_AGENT = "dsh-web-search-ext/0.3.0 (+verification)";

/**
 * Check whether a URL is safe to fetch from this process (SSRF guard).
 * Blocks non-http(s) schemes, loopback, private, and link-local targets.
 * @param {string} url
 * @returns {boolean}
 */
export function isSafeUrl(url) {
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
		const hostname = parsed.hostname;
		if (
			hostname === "localhost" ||
			hostname === "0.0.0.0" ||
			hostname === "127.0.0.1" ||
			hostname === "::" ||
			hostname === "::1"
		) {
			return false;
		}
		// IPv4 private / reserved ranges.
		if (/^10\./.test(hostname)) return false;
		if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname)) return false;
		if (/^192\.168\./.test(hostname)) return false;
		if (/^169\.254\./.test(hostname)) return false; // link-local
		if (/^0\./.test(hostname)) return false;
		// IPv6 loopback / unique-local / link-local.
		if (hostname.startsWith("fe80:") || hostname.startsWith("fc") || hostname.startsWith("fd")) {
			return false;
		}
		return true;
	} catch {
		return false;
	}
}

/**
 * Run one HTTP request with manual redirect following; every hop's target
 * must pass `isSafeUrl`. Returns the final status + headers without reading
 * the body (for liveness checks).
 *
 * @param {string} url
 * @param {"GET"|"HEAD"} method
 * @param {object} opts
 * @param {number} [opts.timeoutMs=3000]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{status: number} | {error: string}>}
 */
async function statusRequest(url, method, { timeoutMs = 3000, signal } = {}) {
	let current = url;
	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		if (!isSafeUrl(current)) return { error: "unsafe_url" };
		if (signal?.aborted === true) return { error: "aborted" };

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		if (signal) {
			const onAbort = () => controller.abort();
			signal.addEventListener("abort", onAbort, { once: true });
		}
		try {
			const response = await fetch(current, {
				method,
				redirect: "manual",
				signal: controller.signal,
				headers: {
					"user-agent": VERIFY_USER_AGENT,
					accept: "text/html,application/xhtml+xml"
				}
			});
			// Redirect? Re-validate the Location and continue.
			if (response.status >= 300 && response.status < 400) {
				const location = response.headers.get("location");
				response.body?.cancel?.().catch(() => {});
				if (!location) return { error: `bad_redirect_${response.status}` };
				current = new URL(location, current).toString();
				continue;
			}
			response.body?.cancel?.().catch(() => {});
			return { status: response.status };
		} catch (error) {
			if (controller.signal.aborted && !signal?.aborted) {
				return { error: "timeout" };
			}
			if (signal?.aborted) return { error: "aborted" };
			return { error: String(error?.cause?.code ?? error?.message ?? error) };
		} finally {
			clearTimeout(timer);
		}
	}
	return { error: "too_many_redirects" };
}

/**
 * L0: check every URL's liveness concurrently.
 *
 * HEAD is preferred; when a server rejects HEAD (405/501) the check retries
 * once with GET (body discarded immediately).
 *
 * @param {string[]} urls
 * @param {object} [opts]
 * @param {number} [opts.timeoutMs=3000] - Per-request timeout.
 * @param {AbortSignal} [opts.signal] - Overall search deadline.
 * @returns {Promise<Map<string, {status: "alive"|"not_found"|"blocked"|"error"|"timeout"|"unsafe"|"aborted", detail?: number|string}>>}
 */
export async function checkLiveness(urls, { timeoutMs = 3000, signal } = {}) {
	const results = new Map();
	const jobs = urls.map(async (url) => {
		const outcome = await statusRequest(url, "HEAD", { timeoutMs, signal });
		let status;
		if (outcome.error !== undefined) {
			status = outcome.error === "timeout" ? "timeout" : outcome.error === "aborted" ? "aborted" : "error";
			results.set(url, { status, detail: outcome.error });
			return;
		}
		// Some servers reject HEAD; fall back to GET once.
		if (outcome.status === 405 || outcome.status === 501) {
			const retry = await statusRequest(url, "GET", { timeoutMs, signal });
			if (retry.error !== undefined) {
				results.set(url, {
					status:
						retry.error === "timeout" ? "timeout" : retry.error === "aborted" ? "aborted" : "error",
					detail: retry.error
				});
				return;
			}
			applyStatus(results, url, retry.status);
			return;
		}
		applyStatus(results, url, outcome.status);
	});
	await Promise.allSettled(jobs);
	return results;
}

/** Map an HTTP status code to a liveness classification. */
function applyStatus(results, url, status) {
	if (status >= 200 && status < 400) {
		results.set(url, { status: "alive", detail: status });
	} else if (status === 404 || status === 410) {
		results.set(url, { status: "not_found", detail: status });
	} else if (status === 401 || status === 403) {
		results.set(url, { status: "blocked", detail: status });
	} else {
		results.set(url, { status: "error", detail: status });
	}
}

/**
 * L1: fetch each source's live content (first N KB) and check whether the
 * leading words of the original snippet still appear in it.
 *
 * @param {Array<{url: string, snippet?: string}>} sources
 * @param {object} [opts]
 * @param {number} [opts.bytes=10240] - Max bytes to read per URL.
 * @param {number} [opts.minContentBytes=200] - Below this the page is treated as a bot-block / empty shell.
 * @param {number} [opts.matchWords=5] - Leading snippet words that must appear in the page.
 * @param {number} [opts.timeoutMs=3000]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<Map<string, {status: "consistent"|"changed"|"blocked"|"error"|"timeout"|"unsafe"|"aborted", detail?: string}>>}
 */
export async function verifySources(sources, opts = {}) {
	const { bytes = 10_240, minContentBytes = 200, matchWords = 5, timeoutMs = 3000, signal } = opts;
	const results = new Map();
	const jobs = sources.map(async (source) => {
		if (!isSafeUrl(source.url)) {
			results.set(source.url, { status: "unsafe" });
			return;
		}
		const page = await fetchPageText(source.url, { bytes, timeoutMs, signal });
		if (page.error !== undefined) {
			results.set(source.url, { status: classifyError(page.error), detail: page.error });
			return;
		}
		if (page.length < minContentBytes) {
			results.set(source.url, { status: "blocked", detail: "content_below_min_bytes" });
			return;
		}
		if (!source.snippet || source.snippet.trim().length < 10) {
			// Nothing to compare against; page is simply live.
			results.set(source.url, { status: "consistent", detail: "no_snippet_to_check" });
			return;
		}
		const haystack = normalizeForMatch(page.text);
		const words = source.snippet.toLowerCase().replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean);
		const needles = words.slice(0, matchWords);
		const hits = needles.filter((word) => haystack.includes(word)).length;
		const status = hits >= Math.max(1, Math.ceil(needles.length * 0.6)) ? "consistent" : "changed";
		results.set(source.url, { status, detail: `${hits}/${needles.length} words` });
	});
	await Promise.allSettled(jobs);
	return results;
}

/**
 * GET a URL and return its text body truncated to `bytes`.
 * @returns {Promise<{length: number} & ({error?: string} | {error?: never, text: string})>}
 */
async function fetchPageText(url, { bytes, timeoutMs, signal } = {}) {
	const outcome = await manualRedirects(url, { timeoutMs, signal });
	if (outcome.error !== undefined) return { error: outcome.error };
	try {
		const reader = outcome.body?.getReader?.();
		if (reader === undefined) {
			const text = await outcome.response.text();
			return { text: text.slice(0, bytes), length: Math.min(text.length, bytes) };
		}
		let text = "";
		let bytesRead = 0;
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			bytesRead += value.byteLength;
			if (bytesRead > bytes) {
				reader.cancel().catch(() => {});
				break;
			}
			text += Buffer.from(value).toString("utf8");
		}
		return { text: text.slice(0, bytes), length: text.length };
	} catch (error) {
		outcome.body?.cancel?.().catch(() => {});
		return { error: String(error?.message ?? error) };
	} finally {
		if (!outcome.closed) {
			outcome.body?.cancel?.().catch(() => {});
			outcome.closed = true;
		}
	}
}

/** Like statusRequest but returns the open response for body reading. */
async function manualRedirects(url, { timeoutMs, signal }) {
	let current = url;
	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		if (!isSafeUrl(current)) return { error: "unsafe_url" };
		if (signal?.aborted === true) return { error: "aborted" };
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		signal?.addEventListener("abort", () => controller.abort(), { once: true });
		try {
			const response = await fetch(current, {
				method: "GET",
				redirect: "manual",
				signal: controller.signal,
				headers: {
					"user-agent": VERIFY_USER_AGENT,
					accept: "text/html,application/xhtml+xml,text/plain"
				}
			});
			if (response.status >= 300 && response.status < 400) {
				const location = response.headers.get("location");
				response.body?.cancel?.().catch(() => {});
				if (!location) return { error: `bad_redirect_${response.status}` };
				current = new URL(location, current).toString();
				continue;
			}
			if (response.status === 404 || response.status === 410) return { error: "not_found" };
			if (response.status === 401 || response.status === 403) return { error: "forbidden" };
			if (response.status >= 400) return { error: `http_${response.status}` };
			clearTimeout(timer);
			return { response, body: response.body, closed: false };
		} catch (error) {
			if (controller.signal.aborted && !signal?.aborted) return { error: "timeout" };
			if (signal?.aborted) return { error: "aborted" };
			return { error: String(error?.cause?.code ?? error?.message ?? error) };
		} finally {
			clearTimeout(timer);
		}
	}
	return { error: "too_many_redirects" };
}

/** Map a raw error string to a public status label. */
function classifyError(error) {
	switch (error) {
		case "timeout":
		case "not_found":
		case "forbidden":
		case "unsafe_url":
			return error;
		case "aborted":
			return "aborted";
		default:
			return "error";
	}
}

/**
 * Normalize text for loose snippet matching: lowercase, strip tags and
 * HTML entities, collapse whitespace.
 */
function normalizeForMatch(text) {
	return text
		.toLowerCase()
		.replace(/<[^>]+>/g, " ")
		.replace(/&[a-z]+;/gi, " ")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Prefix a source snippet with its verification marker.
 *
 * @param {string} snippet - Original snippet (may be empty).
 * @param {string} status - L0: alive|not_found|blocked|error|timeout|unsafe|aborted;
 *                          L1: consistent|changed|…
 * @returns {string}
 */
export function markSnippet(snippet, status, detail) {
	const prefix = MARKERS[status];
	if (prefix === undefined) return snippet;
	const base = snippet.trim();
	return `${prefix}${detail ? ` (${detail})` : ""}${base ? ` ${base}` : ""}`;
}

/** Marker per verification status. */
const MARKERS = {
	alive: "[alive]",
	consistent: "[verified]",
	changed: "[verified·changed]",
	not_found: "[dead 404]",
	blocked: "[blocked]",
	forbidden: "[blocked]",
	unsafe: "[blocked]",
	unsafe_url: "[blocked]",
	timeout: "[timeout]",
	error: "[unreachable]",
	aborted: "[skipped]"
};
