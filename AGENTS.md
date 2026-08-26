# AGENTS.md

Instructions for AI coding agents working in this repository. Keep changes in this file high-signal.

## What this is

A DSH (DeepSeek Harness) plugin: multi-backend `web_search` **and** `web_fetch` providers for the built-in web tools — Exa (keyed REST or key-free anonymous hosted MCP) and Firecrawl (v2 search + scrape API, keyed or keyless) — with automatic failover, per-backend 429 cooldowns, result verification (L0 liveness / L1 content) and a provenance receipt. npm package: `@fno2010/dsh-web-search-ext`. Two halves: the host provider (`lib/index.js` + `lib/verify.js`) and a web client half (the Settings → Plugins card: `src/client/`, built to `client/client.js`).

## Commands

- `npm test` — full suite. **Part A**: 25 mocked failover/mapping/verification/fetch scenarios (no network). **Part B**: 3 live keyless smoke tests, skipped when `CI` is set.
- Host half: no build step. Plain ESM, Node >= 22, one runtime dependency (`@deepseek-ai/schemastery`).
- Client half: `npm run build:client` (tsdown + `scripts/wrap-client.mjs`) — **the built `client/client.js` is committed and must be rebuilt + committed with every `src/client/` change** (CI rebuilds and fails on drift; the npm publish job never builds).
- No formatter, no linter. For tight loops use `CI=true npm test` (Part A only): Part B hits shared anonymous rate limits.

## Layout

- `lib/index.js` — host half: `Config` schema, `resolveKey()`, the per-backend search + fetch functions, the ordered `plan` inside `search()`/`fetch()`, failover + cooldown, result-verification wiring + provenance receipt, the Cordis module export, and the `installSettingsSection` call.
- `lib/verify.js` — local result verification: SSRF-safe URL guard, L0 liveness probes (manual redirect-following, HEAD with GET fallback), L1 snippet word-match content check, and the snippet status markers. Pure local HTTP; no vendor quota.
- `src/client/` — client half source: `index.js` (the settings card), `locales.js` (EN/ZH), `card.module.css` (1:1 mirror of the host PluginCard/fields design tokens).
- `client/client.js` — **committed** client bundle (`window.__ModuleLoader__.load` × 2, one per entry id; CSS inlined in the host's `data-plugin-css` pattern). Never edit by hand; rebuild via `npm run build:client`.
- `tsdown.config.js`, `scripts/wrap-client.mjs` — the build recipe.
- `cordis.patch.yml` — bundle patch that wires the provider into `web_search` and `web_fetch` (`web.searchProvider` + `web.fetchProvider`: `web-search-ext`).
- `test/failover.test.mjs` — `node:test` suite (Part A + Part B).
- `docs/settings-ui-plan.md` — the client-half implementation plan (extension points, wire APIs, harness churn notes; re-check its evidence greps after a harness bump).
- `.github/workflows/ci.yml` — merge gate (push to main + every PR; includes the bundle-drift check). `.github/workflows/publish.yml` — tag-driven npm publish via trusted publishing (OIDC; no token in repo; also runs the drift check).
- Docs: `README.md` (EN, canonical) + `README.zh.md` (ZH) — keep both in sync; `CONTRIBUTING.md` (human process); `CHANGELOG.md`.

## Invariants (do not "fix" these)

- Internal identifiers are deliberately **unscoped** and decoupled from the scoped npm name: provider id `web-search-ext`, module export name `dsh-web-search-ext`, settings namespace `web-search-ext`, `USER_AGENT` prefix. Only the registry name is scoped (`@fno2010/dsh-web-search-ext`).
- The client bundle registers under **both** entry ids — the unscoped link-install key `dsh-web-search-ext` and the scoped npm key `@fno2010/dsh-web-search-ext` (the loader's row id is the profile dependency key, which differs by install form; `register()` rejects only *duplicate* ids, so both coexist — see `scripts/wrap-client.mjs`). Don't "simplify" this to one id: it would break one install form's card.
- `USER_AGENT` in `lib/index.js` carries the package version — bump it together with `version`.
- API keys never leave their own backend: only in the `authorization` header of that backend's requests, never in bodies, never cross-backend, never in error messages.

## Conventions

- Conventional Commits: `feat`, `fix`, `docs`, `test`, `ci`, `chore`, `refactor`; imperative subject.
- Branches: `feat/…`, `fix/…`, `docs/…`, … All changes go through a PR. `main` is branch-protected: PR required, `test` check green and up to date, no direct pushes, no force pushes — the rules apply to the owner too.
- **Never merge unreviewed.** Merge gate: (1) `test` check green; (2) a review pass by a fresh review agent (separate context, adversarial: correctness, test coverage of the diff, no secrets, docs/CHANGELOG in sync, conventions) — or the human maintainer for user-facing changes; (3) fix findings and re-review if needed. Then merge.
- New backend or behaviour change ships with a mocked failover/mapping scenario in `test/failover.test.mjs`. No scenario, no merge.
- Never put API keys or secrets in the diff.

## Releasing

1. Bump `version` in `package.json` + `CHANGELOG.md` entry, in one PR. (If the PR touched `src/client/`, the rebuilt `client/client.js` must be committed in it too — CI enforces the drift check.)
2. On the merged commit: `git tag vX.Y.Z && git push origin vX.Y.Z`. `publish.yml` runs the test gate then `npm publish --provenance` (idempotent: already-published versions skip with a notice).
3. `gh release create vX.Y.Z` with notes mirroring the changelog (if the tag is missing, this command creates it at main HEAD — footgun documented in CONTRIBUTING.md).
4. **Tag pushes run the workflow file *at the tagged commit*, not main's.** Merge pipeline changes before cutting the tag.
- `peerDependencies` prerelease ranges do not automatically cover a *new* prerelease line (e.g. `^0.1.0-rc.6` excludes `0.2.0-rc.1`). When the harness moves to a new prerelease line, add a `||` branch to the affected range (details in CONTRIBUTING.md), or installs break with `ERESOLVE`.
