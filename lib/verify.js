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
 * Blocks non-http(s) schemes, and any target that can reach the local
 * machine or a private network: loopback (127/8, ::1, IPv4-mapped
 * variants), private ranges (10/8, 172.16/12, 192.168/16, fc00::/7),
 * link-local (169.254/16, fe80::/10), "this network" (0/8, ::),
 * multicast/reserved (224/4+, ff00::/8), and CGNAT (100.64/10).
 *
 * Address forms are handled in the canonical shape the WHATWG URL parser
 * produces: IPv4 hosts are dotted quads (decimal/octal/hex spellings are
 * normalized by the parser before we see them), and IPv6 hosts arrive
 * BRACKETED (`[::1]`), which this function strips before classifying.
 * Any address it cannot confidently classify as public is refused
 * (fail closed).
 *
 * NOTE: this is a STATIC guard. Hostnames that resolve to private
 * addresses via DNS (e.g. `127.0.0.1.nip.io`) are not detected; the
 * mitigation is that we only ever fetch URLs that arrived as backend
 * search results, and the guard re-runs on every redirect hop.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isSafeUrl(url) {
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		return false;
	}
	if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
	// Normalize: lowercase, strip one trailing dot (FQDN form "localhost.").
	let hostname = parsed.hostname.toLowerCase();
	if (hostname.endsWith(".")) hostname = hostname.slice(0, -1);
	// Named loopback variants.
	if (hostname === "localhost" || hostname.endsWith(".localhost")) return false;
	// IPv6 arrives bracketed; strip and classify.
	if (hostname.startsWith("[") && hostname.endsWith("]")) {
		return !isUnsafeIpv6(hostname.slice(1, -1));
	}
	// IPv4 dotted-quad (the parser already canonicalized all spellings).
	if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
		return !isUnsafeIpv4(hostname);
	}
	return true;
}

/** Ranges we refuse to fetch: IPv4. Malformed input fails closed. */
function isUnsafeIpv4(hostname) {
	const parts = hostname.split(".").map((part) => Number(part));
	if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part > 255)) return true;
	const [a, b] = parts;
	if (a === 0) return true; // 0.0.0.0/8 "this network"
	if (a === 10) return true; // 10.0.0.0/8 private
	if (a === 127) return true; // 127.0.0.0/8 loopback (whole /8, not just .0.0.1)
	if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
	if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
	if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
	if (a >= 224) return true; // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved
	if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
	return false;
}

/** Ranges we refuse to fetch: IPv6. `address` is bare (brackets stripped). */
function isUnsafeIpv6(address) {
	const lower = address.toLowerCase();
	if (lower === "::" || lower === "::1") return true;
	// IPv4-mapped with dotted-quad tail: ::ffff:a.b.c.d
	const dotted = lower.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
	if (dotted !== null) return isUnsafeIpv4(dotted[1]);
	// General expansion to 8 hextets (covers ::ffff:HHHH:HHHH and
	// fully-spelled forms like 0:0:0:0:0:0:0:1).
	const hextets = expandIpv6(lower);
	if (hextets === null) return true; // not a canonical form — fail closed
	const h = hextets;
	// Unspecified (all zero) or loopback in any spelling.
	const nonZero = h.filter((v) => v !== 0);
	if (nonZero.length === 0) return true;
	if (nonZero.length === 1 && nonZero[0] === 1 && h[7] === 1) return true;
	// fc00::/7 unique-local; fe80::/10 link-local; ff00::/8 multicast.
	if ((h[0] & 0xfe00) === 0xfc00) return true; // fc00::/7
	if ((h[0] & 0xfc00) === 0xfc00) return true; // fe80::/10
	if ((h[0] & 0xff00) === 0xff00) return true;
	// IPv4-mapped: 0:0:0:0:0:ffff:a:b → classify the embedded v4 address.
	if (h[0] === 0 && h[1] === 0 && h[2] === 0 && h[3] === 0 && h[4] === 0 && h[5] === 0xffff) {
		return isUnsafeIpv4(`${h[6] >>> 8}.${h[6] & 0xff}.${h[7] >>> 8}.${h[7] & 0xff}`);
	}
	return false;
}

/**
 * Expand a bare IPv6 address into 8 numeric hextets, or null when it is not
 * a canonical 8-hextet form (e.g. an embedded dotted-quad tail, which the
 * caller special-cases first).
 */
function expandIpv6(address) {
	const halves = address.split("::");
	if (halves.length > 2) return null;
	const head = halves[0] === "" ? [] : halves[0].split(":");
	const tail = halves.length === 2 ? (halves[1] === "" ? [] : halves[1].split(":")) : [];
	const middle = 8 - head.length - tail.length;
	if (middle < 0) return null;
	const parts = [...head, ...Array(middle).fill("0"), ...tail];
	if (parts.length !== 8) return null;
	if (!parts.every((part) => /^[0-9a-f]{1,4}$/.test(part))) return null;
	return parts.map((part) => Number.parseInt(part, 16));
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
		const onAbort = () => controller.abort();
		signal?.addEventListener("abort", onAbort, { once: true });
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
			signal?.removeEventListener("abort", onAbort);
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
			status =
				outcome.error === "timeout"
					? "timeout"
					: outcome.error === "aborted"
						? "aborted"
						: outcome.error === "unsafe_url"
							? "unsafe"
							: "error";
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
 * @returns {Promise<Map<string, {status: "consistent"|"changed"|"unverified"|"blocked"|"error"|"timeout"|"unsafe"|"aborted", detail?: string}>>}
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
			// Nothing to compare against; the page is live but its content was
			// NOT verified. Labeled separately so it never inflates the
			// "[verified]" count in the receipt.
			results.set(source.url, { status: "unverified", detail: "no_snippet_to_check" });
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
	// The redirect phase had its own timeoutMs budget; the body read gets a
	// second one, so one URL can never stall longer than 2 × timeoutMs.
	const deadline = Date.now() + timeoutMs;
	try {
		const reader = outcome.body?.getReader?.();
		if (reader === undefined) {
			// No readable stream (e.g. mocked responses): race text() against
			// the deadline so a slow server is still bounded.
			const text = await new Promise((resolve, reject) => {
				const timer = setTimeout(() => {
					outcome.controller?.abort();
					reject(new Error("timeout"));
				}, Math.max(0, deadline - Date.now()));
				outcome.response.text().then(
					(value) => {
						clearTimeout(timer);
						resolve(value);
					},
					(err) => {
						clearTimeout(timer);
						reject(err);
					}
				);
			});
			return { text: text.slice(0, bytes), length: Math.min(Buffer.byteLength(text, "utf8"), bytes) };
		}
		const decoder = new TextDecoder();
		let text = "";
		let bytesRead = 0;
		while (true) {
			if (Date.now() > deadline) {
				reader.cancel().catch(() => {});
				outcome.controller?.abort();
				return { error: "timeout" };
			}
			const { done, value } = await reader.read();
			if (done) break;
			bytesRead += value.byteLength;
			if (bytesRead > bytes) {
				reader.cancel().catch(() => {});
				break;
			}
			text += decoder.decode(value, { stream: true });
		}
		text += decoder.decode();
		return { text: text.slice(0, bytes), length: Math.min(bytesRead, bytes) };
	} catch (error) {
		outcome.body?.cancel?.().catch(() => {});
		if (outcome.controller?.signal.aborted && !signal?.aborted) return { error: "timeout" };
		if (signal?.aborted) return { error: "aborted" };
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
		const onAbort = () => controller.abort();
		signal?.addEventListener("abort", onAbort, { once: true });
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
			// The request-phase timer is done, but the caller may still need
			// to abort a long body download: hand over the controller.
			return { response, body: response.body, closed: false, controller };
		} catch (error) {
			if (controller.signal.aborted && !signal?.aborted) return { error: "timeout" };
			if (signal?.aborted) return { error: "aborted" };
			return { error: String(error?.cause?.code ?? error?.message ?? error) };
		} finally {
			clearTimeout(timer);
			signal?.removeEventListener("abort", onAbort);
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
 *                          L1: consistent|changed|unverified|…
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
	// L1: page fetched fine but there was no snippet to compare against —
	// the content itself was NOT checked. Kept distinct so it never
	// masquerades as "[verified]".
	unverified: "[unverified]",
	not_found: "[dead 404]",
	blocked: "[blocked]",
	forbidden: "[blocked]",
	unsafe: "[blocked]",
	unsafe_url: "[blocked]",
	timeout: "[timeout]",
	error: "[unreachable]",
	aborted: "[skipped]"
};
