# Contributing

Thanks for improving the plugin! This file covers development, conventions, adding backends, and the release process.

## Development

- Node.js >= 22, no build step. Install deps with `npm install` (a lockfile-less dev is fine; the package publishes only `lib/`).
- Run the suite: `npm test`
  - **Part A** — 10 mocked failover/mapping scenarios (deterministic, no network).
  - **Part B** — 3 live keyless smoke calls (Exa anonymous MCP, Firecrawl keyless, dual plan). Skipped automatically when `CI` is set (`CI=true npm test` = Part A only). Part B hits shared anonymous rate limits — don't run it in a tight loop.

## Conventions

- **Branches**: `feat/…`, `fix/…`, `docs/…`, `test/…`, `ci/…`, `chore/…`.
- **Commits**: Conventional Commits prefixes (`feat`, `fix`, `docs`, `test`, `ci`, `chore`, `refactor`) with an imperative subject.
- **All changes go through a pull request** — `main` is branch-protected: a PR is required, the `test` CI check must pass (and be up to date), direct pushes and force pushes are disabled, and the rules apply to the repo owner too.
- **Test baseline**: any new backend or behaviour change ships with a mocked failover/mapping scenario in `test/failover.test.mjs`. No scenario, no merge.
- No API keys or secrets in the diff, ever.

## Review

CI green is a **necessary, not sufficient**, merge condition. Every PR gets a review pass before merge:

- **Default**: a fresh review agent (separate context) reviews the diff adversarially — correctness, test coverage of the change itself, no secrets, docs/CHANGELOG in sync, conventions respected. Findings are fixed, then the PR is re-reviewed.
- **User-facing changes** (new backend, config surface, README claims): the human maintainer reviews — or is handed the agent's review summary for sign-off.
- Only after the review pass does the PR get merged.

## Adding another backend (e.g. SearXNG)

The provider is deliberately small and uniform; a backend is:

1. one `async function <name>Search(options, apiKey?, request, signal)` that returns `{ sources, truncated: false }` and throws `WebError` (`WEB_RATE_LIMIT` for 429, `WEB_PROVIDER_ERROR` otherwise, aborts as `WEB_ABORTED`);
2. one entry pushed onto `plan` in `search()` when its availability condition holds (key present, or keyless mode allowed);
3. its config fields in the `Config` schema and key resolution in `resolveKey()`.

No other code changes: failover, cooldown, abort handling, and snippet bounding all apply automatically. A self-hosted [SearXNG](https://docs.searxng.org/) instance (JSON API) is the natural next candidate — no key, no rate limit of your own, fully local.

Afterwards update the READMEs (backend table, defaults table) and the `CHANGELOG.md` entry.

## Releasing

Releases are tag-driven; the workflow publishes via **trusted publishing** (OIDC — no token stored in the repo).

1. Bump `version` in `package.json` and add the `CHANGELOG.md` entry — in one PR, merged through the normal flow.
2. Tag the merged commit and push: `git tag vX.Y.Z && git push origin vX.Y.Z`.
   The `publish` workflow runs the test gate, then `npm publish --provenance` (SLSA provenance attestation is attached automatically). The publish job is idempotent: if the version already exists on the registry, it skips with a notice instead of failing.
3. Backfill a GitHub Release with notes: `gh release create vX.Y.Z --title "vX.Y.Z" --notes "…"` (mirrors the CHANGELOG entry). Note: `gh release create` creates and pushes a missing tag — if the version was never tagged, the tag lands at the current main HEAD, which may declare a *different* version than the tag name implies.
- **Tag pushes run the workflow file *at the tagged commit*, not main's.** Merge any pipeline change to main first; only tags cut after that merge use the new pipeline. (The v0.1.0 backfill tag is the example: it pointed at a commit predating the idempotent guard, so its run failed on a guaranteed E409.)
4. Keep the attribution label in sync: `USER_AGENT` in `lib/index.js` carries the package version.

Versioning: `0.x` — the settings surface may still gain fields; breaking changes allowed but noted in the changelog. `1.0.0` — the `Config` field surface is frozen; only additive changes thereafter.

## Maintenance notes

- **`peerDependencies` prerelease ranges** (important): semver `^0.1.0-rc.6` covers `0.1.0` final but **does not cover a new prerelease line** (e.g. a future `0.2.0-rc.1`). When the harness moves to a new prerelease line, add a prerelease branch to each affected range, e.g. `">=0.1.0-rc.6 <0.2.0 || >=0.2.0-rc.1 <0.2.0"` — otherwise installs against the new harness fail with `ERESOLVE`.
- **Dependency / action updates**: Dependabot opens weekly PRs for npm and GitHub Actions. Review, run the suite, merge — nothing else needed.
- **Baseline verifications** (2026-08-17, live keyless): Exa anonymous MCP returned structured `Title:/URL:/Highlights:` results without credentials; Exa REST without a key answered HTTP 402 (`X402_PAYMENT_REQUIRED`), which is treated as "no key", not an error; Firecrawl v2 without a key returned `data.web[]` (the v1 `data[]` envelope is also handled).
