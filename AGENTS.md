# AGENTS.md

Instructions for AI coding agents working in this repository. Keep changes in this file high-signal.

## What this is

A DSH (DeepSeek Harness) plugin: a multi-backend `web_search` provider for the built-in web search tool — Exa (keyed REST or key-free anonymous hosted MCP) and Firecrawl (v2 search API, keyed or keyless) — with automatic failover and per-backend 429 cooldowns. npm package: `@fno2010/dsh-web-search-ext`. The whole provider is one module: `lib/index.js`.

## Commands

- `npm test` — full suite. **Part A**: 10 mocked failover/mapping scenarios (no network). **Part B**: 3 live keyless smoke tests, skipped when `CI` is set.
- No build step, no formatter, no linter. Plain ESM, Node >= 22, one runtime dependency (`@deepseek-ai/schemastery`).
- For tight loops use `CI=true npm test` (Part A only): Part B hits shared anonymous rate limits.

## Layout

- `lib/index.js` — everything: `Config` schema, `resolveKey()`, the per-backend search functions, the ordered `plan` inside `search()`, failover + cooldown, and the Cordis module export.
- `cordis.patch.yml` — bundle patch that wires the provider into `web_search` (`web.searchProvider: web-search-ext`).
- `test/failover.test.mjs` — `node:test` suite (Part A + Part B).
- `.github/workflows/ci.yml` — merge gate (push to main + every PR). `.github/workflows/publish.yml` — tag-driven npm publish via trusted publishing (OIDC; no token in repo).
- Docs: `README.md` (EN, canonical) + `README.zh.md` (ZH) — keep both in sync; `CONTRIBUTING.md` (human process); `CHANGELOG.md`.

## Invariants (do not "fix" these)

- Internal identifiers are deliberately **unscoped** and decoupled from the scoped npm name: provider id `web-search-ext`, module export name `dsh-web-search-ext`, settings namespace `web-search-ext`, `USER_AGENT` prefix. Only the registry name is scoped (`@fno2010/dsh-web-search-ext`).
- `USER_AGENT` in `lib/index.js` carries the package version — bump it together with `version`.
- API keys never leave their own backend: only in the `authorization` header of that backend's requests, never in bodies, never cross-backend, never in error messages.

## Conventions

- Conventional Commits: `feat`, `fix`, `docs`, `test`, `ci`, `chore`, `refactor`; imperative subject.
- Branches: `feat/…`, `fix/…`, `docs/…`, … All changes go through a PR. `main` is branch-protected: PR required, `test` check green and up to date, no direct pushes, no force pushes — the rules apply to the owner too.
- **Never merge unreviewed.** Merge gate: (1) `test` check green; (2) a review pass by a fresh review agent (separate context, adversarial: correctness, test coverage of the diff, no secrets, docs/CHANGELOG in sync, conventions) — or the human maintainer for user-facing changes; (3) fix findings and re-review if needed. Then merge.
- New backend or behaviour change ships with a mocked failover/mapping scenario in `test/failover.test.mjs`. No scenario, no merge.
- Never put API keys or secrets in the diff.

## Releasing

1. Bump `version` in `package.json` + `CHANGELOG.md` entry, in one PR.
2. On the merged commit: `git tag vX.Y.Z && git push origin vX.Y.Z`. `publish.yml` runs the test gate then `npm publish --provenance` (idempotent: already-published versions skip with a notice).
3. `gh release create vX.Y.Z` with notes mirroring the changelog.
- **Tag pushes run the workflow file *at the tagged commit*, not main's.** Merge pipeline changes before cutting the tag.
- `peerDependencies` prerelease ranges do not automatically cover a *new* prerelease line (e.g. `^0.1.0-rc.6` excludes `0.2.0-rc.1`). When the harness moves to a new prerelease line, add a `||` branch to the affected range (details in CONTRIBUTING.md), or installs break with `ERESOLVE`.
