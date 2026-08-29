# AGENTS.md

Instructions for AI coding agents working in this repository. Keep changes in this file high-signal.

## What this is

A DSH (DeepSeek Harness) plugin: multi-backend `web_search` **and** `web_fetch` providers for the built-in web tools — Exa (keyed REST or key-free anonymous hosted MCP) and Firecrawl (v2 search + scrape API, keyed or keyless) — with automatic failover, per-backend 429 cooldowns, result verification (L0 liveness / L1 content) and a provenance receipt. npm package: `@fno2010/dsh-web-search-ext`. Two halves: the host provider (`lib/index.js` + `lib/verify.js`) and a web client half (the Settings → Plugins card: `src/client/`, built to `client/client.js`).

## Commands

- `npm test` — full suite: **Part A** mocked failover/mapping/verification/fetch scenarios (deterministic, no network; the scenario count is asserted inside the suite — do not restate the number in docs) + **Part B** live keyless smoke tests (skipped when `CI` is set), then the host-wiring tests: `test/composition.test.mjs` composes the shipped `cordis.patch.yml` through the harness's own `applyEntryPatches` against the pinned base rows **and the web-app profile layer** (dsh-base/dsh-web-app 0.1.1-rc.2) and asserts the REAL composed state — web seam pinned to us for search + fetch, provider row enabled, and `tool-web` disabled in the web profile (the honest expected state; the model-facing `web_fetch` does NOT come from the patch); and `test/tool-registration.test.mjs` runs the real `applyWebFetchTool` through our `registerWebFetchToolIfAbsent` against the `ToolRuntime` registry contract and asserts the tool gets registered, dedupes against an existing `web_fetch`, and routes execution through `ctx.web.fetch`; finally `test/toolview.test.mjs` unit-tests the pure client card model (`src/client/model.js`, no React): marker→badge mapping, provenance/receipt extraction, the safe-href policy, running/error/stopped states, and the non-web fallback.
- Host half: no build step. Plain ESM, Node >= 22, one runtime dependency (`@deepseek-ai/schemastery`).
- Client half: `npm run build:client` (tsdown + `scripts/wrap-client.mjs`) — **the built `client/client.js` is committed and must be rebuilt + committed with every `src/client/` change** (CI rebuilds and fails on drift; the npm publish job never builds).
- No formatter, no linter. For tight loops use `CI=true npm test` (Part A only): Part B hits shared anonymous rate limits.

## Layout

- `lib/index.js` — host half: `Config` schema, `resolveKey()`, the per-backend search + fetch functions, the ordered `plan` inside `search()`/`fetch()`, failover + cooldown, result-verification wiring + provenance receipt, `registerWebFetchToolIfAbsent()` (registers the stock `web_fetch` tool at apply time when the preset layer left it unregistered — the preset layer ships `fetch: false` everywhere and `dsh web` disables the profile-layer `tool-web` row), the Cordis module export, and the `installSettingsSection` call.
- `lib/verify.js` — local result verification: SSRF-safe URL guard, L0 liveness probes (manual redirect-following, HEAD with GET fallback), L1 snippet word-match content check, and the snippet status markers. Pure local HTTP; no vendor quota.
- `src/client/` — client half source: `index.js` (the settings card), `locales.js` (EN/ZH), `card.module.css` (1:1 mirror of the host PluginCard/fields design tokens).
- `client/client.js` — **committed** client bundle (`window.__ModuleLoader__.load` × 2, one per entry id; CSS inlined in the host's `data-plugin-css` pattern). Never edit by hand; rebuild via `npm run build:client`.
- `tsdown.config.js`, `scripts/wrap-client.mjs` — the build recipe.
- `cordis.patch.yml` — bundle patch that wires the provider into the web seam (`web.searchProvider` + `web.fetchProvider`: `web-search-ext`). Deliberately contains **no** `tool-web` row: the model-facing tool is registered at apply time by the plugin instead (see `lib/index.js`), because a profile-layer row cannot reach the tool under `dsh web`.
- `test/failover.test.mjs` — assert-based suite (hand-rolled `ok()` counter, no `node:test`; Part A + Part B).
- `test/composition.test.mjs` — host-wiring composition test (real `applyEntryPatches`, real shipped patch, base + web-app layer fixtures pinned to the harness version; asserts the real composed state, disabled rows included).
- `test/tool-registration.test.mjs` — proves `registerWebFetchToolIfAbsent` registers the stock `web_fetch` (real `applyWebFetchTool`), dedupes when already present, and routes execution through `ctx.web.fetch`.
- `test/toolview.test.mjs` — pure-model unit tests for the web_search toolview card (`src/client/model.js`): marker→badge tones, receipt/provenance extraction (incl. multi-query `### <query>` merge), safe-href policy, running/error/stopped states, non-web fallback. Scenario count is asserted in-test (sentinel), not in docs.
- `docs/settings-ui-plan.md` — the client-half implementation plan (extension points, wire APIs, harness churn notes; re-check its evidence greps after a harness bump).
- `.github/workflows/ci.yml` — merge gate (push to main + every PR; includes the bundle-drift check). `.github/workflows/publish.yml` — tag-driven npm publish via trusted publishing (OIDC; no token in repo; also runs the drift check).
- Docs: `README.md` (EN, canonical) + `README.zh.md` (ZH) — keep both in sync; `CONTRIBUTING.md` (human process); `CHANGELOG.md`.

## Invariants (do not "fix" these)

- Internal identifiers are deliberately **unscoped** and decoupled from the scoped npm name: provider id `web-search-ext`, module export name `dsh-web-search-ext`, settings namespace `web-search-ext`, `USER_AGENT` prefix. Only the registry name is scoped (`@fno2010/dsh-web-search-ext`).
- The `name` field of the `web-search-ext` row in `cordis.patch.yml` is the **scoped registry name** — it is the loader's import specifier, and `dsh plugin add` installs the dependency under that key. An unscoped specifier cannot resolve on a fresh host (boot fails with `Cannot find package`); do not "simplify" it to the unscoped module-export name.
- The client bundle registers under **both** entry ids — the unscoped link-install key `dsh-web-search-ext` and the scoped npm key `@fno2010/dsh-web-search-ext` (the loader's row id is the profile dependency key, which differs by install form; `register()` rejects only *duplicate* ids, so both coexist — see `scripts/wrap-client.mjs`). Don't "simplify" this to one id: it would break one install form's card.
- `USER_AGENT` in `lib/index.js` carries the package version — bump it together with `version`.
- API keys never leave their own backend: only in the `authorization` header of that backend's requests, never in bodies, never cross-backend, never in error messages.

## Conventions

- Conventional Commits: `feat`, `fix`, `docs`, `test`, `ci`, `chore`, `refactor`; imperative subject.
- **PRs are opened for an atomic goal, not for a release.** One PR = one bounded, independently reviewable goal: resolve an issue, add a feature, or fix a bug. A version number is a ship-time grouping label (bump + CHANGELOG + tag + publish), never a PR boundary — a release is assembled from many atomic-goal PRs plus one final release-chore PR (the version-bump + CHANGELOG PR; see Releasing). Track each release with an umbrella issue and one subissue per atomic goal.
- **Squash merges carry one Conventional subject + a hand-written body.** The merge commit's title is the PR's single Conventional-Commit subject (GitHub's automatic `(#N)` suffix is fine); the body is hand-written (what changed and why). Never use GitHub's default "full commit history" bullet body — intermediate commits are working state, not shippable history.
- Branches: `feat/…`, `fix/…`, `docs/…`, … All changes go through a PR. `main` is branch-protected: PR required, `test` check green and up to date, no direct pushes, no force pushes — the rules apply to the owner too.
- **Never merge unreviewed.** Merge gate: (1) `test` check green; (2) a review pass by a fresh review agent (separate context, adversarial: correctness, test coverage of the diff, no secrets, docs/CHANGELOG in sync, conventions) — or the human maintainer for user-facing changes; (3) fix findings and re-review if needed. Then merge.
- New backend or behaviour change ships with a mocked failover/mapping scenario in `test/failover.test.mjs`; a client-card change ships with a pure-model scenario in `test/toolview.test.mjs` (the client model is React-free and runs under node). No scenario, no merge.
- **User-facing capabilities are accepted on the user's path, not on the provider API.** The model reaches a provider only through a registered tool: model → tool (dsh-tool-web) → web seam (provider pin) → provider. Provider-level unit tests prove the last hop only. A change that affects host wiring (the bundle patch, tool availability, provider selection) additionally ships with a composition scenario in `test/composition.test.mjs` **and** a tool-registration scenario in `test/tool-registration.test.mjs` when tool registration is involved, and the release-time live-host smoke below is mandatory before tagging.
- **Assert the real composed state, not the wished-for one.** Composition fixtures must include every layer the host actually composes (for `dsh web`: the web-app profile layer, which disables the profile-layer `tool-web` row) and CI assertions must hold against the state the host really produces (e.g. `tool-web` is `disabled: true` in the web profile). A green CI that the live host contradicts is a false green — fix the test, not the expectation.
- Never put API keys or secrets in the diff.

## Releasing

1. **Live-host smoke (mandatory, before any tag).** On a real host running this checkout (restart it after the last change; a link install needs no install step): `web_search` returns our receipt line (`web-search-ext: <backend> · …s · N results`); `web_fetch` returns content or a structured provider error — never `unknown tool` (the plugin registers the stock tool at apply time, so this must work on a default fresh profile); `dsh web --dump-config` shows the `web` row pinned to `web-search-ext` for both providers and the `tool-web` row `disabled: true` under the web profile (expected — web-app owns that row; the model-facing tool comes from the plugin, not the patch). The `e2e-host` CI job proves composition against a fresh harness; this smoke proves the live network path on the user's own host.
2. Bump `version` in `package.json` + `CHANGELOG.md` entry, in one PR. (If the PR touched `src/client/`, the rebuilt `client/client.js` must be committed in it too — CI enforces the drift check.)
3. On the merged commit: `git tag vX.Y.Z && git push origin vX.Y.Z`. `publish.yml` runs the test gate then `npm publish --provenance` (idempotent: already-published versions skip with a notice).
4. `gh release create vX.Y.Z` with notes mirroring the changelog (if the tag is missing, this command creates it at main HEAD — footgun documented in CONTRIBUTING.md).
5. **Tag pushes run the workflow file *at the tagged commit*, not main's.** Merge pipeline changes before cutting the tag.
- `peerDependencies` prerelease ranges do not automatically cover a *new* prerelease line (e.g. `^0.1.0-rc.6` excludes `0.2.0-rc.1`). When the harness moves to a new prerelease line, add a `||` branch to the affected range (details in CONTRIBUTING.md), or installs break with `ERESOLVE`.
