# Settings UI Plan — `dsh-web-search-ext` client-side Settings card

Status: researched plan (no feature code written). All claims cite installed
harness artifacts (`@deepseek-ai/dsh` 0.1.1-rc.2 under
`node_modules/@deepseek-ai/`) unless noted; the live web profile at
`~/.dsh/profiles/web` is cited where it disambiguates.

**Spike verified live (2026-08-21, branch feat/settings-ui-spike):** the
read-only card rendered in Settings → Plugins → configurable via the keyed
`settings.plugin.item` slot; EN/ZH dictionaries applied; the live namespace
snapshot was read. Answers to the open questions:

- **Snapshot shape** (from the card's own diagnostic dump):
  `{ status, value, base, user, revision, writable, mode }` — `value` is the
  effective merged value, `revision` fences writes (0 when the user layer is
  empty), `writable`/`mode`/`base`/`user` as expected from the layered model.
- **Entry `id`**: `"dsh-web-search-ext"` (the profile dependency key of the
  `link:` install) loads and dispatches correctly. The scoped npm install
  path remains to be verified once the feature ships (users who install via
  `@fno2010/dsh-web-search-ext` get a different dependency key).
- **Third-party namespace i18n**: `locale.register("web-search-ext", {en, zh})`
  accepted and resolved without any registry change.
- **Official card chrome** (for the full card): the built-in cards are
  expandable — `PluginCard` CSS module (`card`, `chevron`, `body`,
  `description`, `footer`…), field rows from a `fields` CSS module
  (`field`, `label`, `input`, `hint`, `badge`…), `clsx` class composition,
  `aria-expanded` + a `Chevron`; the WebSearch key field uses i18n keys
  `webSearchApiKey` / `webSearchApiKeyHint` / `webSearchApiKeySet` /
  `webSearchApiKeyUnset` (configured/unset badge states). Card CSS is
  injected by the bundle itself.

## Verdict

**Viable.** The harness ships a documented, extension-point-grade path for
exactly this: a plugin whose host half already registers a settings namespace
(the `web-search-ext` section, done today via `installSettingsSection`) ships a
browser half by declaring `dsh.client` in `package.json` plus an
`exports["./client"]` bundle that registers a card into the `settings.plugin.item`
slot under its own namespace — the same path two third-party plugins
(`dshmarket`, `dsh-better-sidebar`, both installed in this profile) use today,
and the path `@deepseek-ai/dsh-client-ui-settings-plugins` documents as its
"Extension point" for "plugins distributed outside this repository."

## Architecture

### 1. What already exists (no change needed)

- Host half: `lib/index.js` registers the `web-search-ext` settings namespace
  (`installSettingsSection(ctx, "web-search-ext", Config, …)`), so
  `settings.describe` already serves this namespace with its serialized
  schema, redacted values, `secrets` slot list, and revision. No host-side
  registration for the UI is required or possible — the browser card pairs
  with the namespace by key.
- Profile: `~/.dsh/profiles/web/package.json` already depends on
  `dsh-web-search-ext` (link: this checkout) and lists it in
  `dsh.profile.bundles`; the web profile's `client-modules` node half scans
  enabled Loader entries and picks up any package that declares `dsh.client`
  automatically — there is no web-app roster edit, no allowlist, no host
  registration step.

### 2. `package.json` additions

```jsonc
{
  "exports": {
    ".": "./lib/index.js",
    "./cordis.patch.yml": "./cordis.patch.yml",
    "./package.json": "./package.json",
    "./client": "./client/client.js"          // NEW: the built browser bundle
  },
  "files": [ "lib", "client", "cordis.patch.yml", "…existing…" ],  // + "client"
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {                               // NEW
      "platform": "web",
      "inject": [                             // entry-level plugin deps (activation
        "@deepseek-ai/dsh-client-runtime",    // order in the shell's client Loader):
        "@deepseek-ai/dsh-client-locale",     //   slots service, locale service,
        "@deepseek-ai/dsh-client-connection", //   api client (connection.api),
        "@deepseek-ai/dsh-client-ui-settings",//   settingsScope + settingsSchema,
        "@deepseek-ai/dsh-api-remotes"        //   ctx.remote ($on forwarded events)
      ]
      // "external" is optional and left out: every official and third-party
      // client package in the installed tree relies on entry-level inject for
      // ordering, not module-level external lists.
    }
  }
}
```

Manifest mechanics (confirmed in `dsh-client-modules/lib/index.js`):
`platform` must be the string `"web"`; `inject`/`external` are optional
string arrays; an optional `immediately: boolean` prefetches the bundle at
boot (not needed here). Declaring `dsh.client` without `exports["./client"]`
fails activation loudly. **The manifest is cached per entry and never
expires — adding/changing the `dsh.client` block or `exports` requires a
harness restart; only bundle *content* changes propagate via HMR.**

### 3. Client entry file layout

```
dsh-web-search-ext/
  client/
    client.js          # BUILT artifact (do not hand-edit): lazy-CJS factory bundle
  src/client/          # source (plain JS is fine — no TS requirement is imposed on us)
    index.js           # entry: registers the card, see skeleton below
    locales.js         # { en, zh } dictionaries
    (optional) form.js # staging/revision-fencing model for the card
  tsdown.config.js     # build recipe (devDependency: tsdown; see "Dev loop")
```

The built bundle must have the exact shape every installed client bundle has
(`dshmarket/client/client.js:2`, `dsh-better-sidebar/lib/client.js:1-3`,
`@deepseek-ai/dsh-client-ui-settings-models/lib/client.js:1-3`):

```js
window.__ModuleLoader__.load({
  id: "<ENTRY NAME>",                    // ← the profile dependency name "dsh-web-search-ext",
                                         //   NOT the scoped npm name (see Open questions #2)
  factory: (require) => { /* CJS module body; return module.exports */ }
});
```

Externals allowed to `require` from the bundle: seed words
(`react`, `react/jsx-runtime`, `react-dom`, `react-dom/client`,
`@deepseek-ai/cordis`, `@deepseek-ai/dsh-client-ui-primitives`,
`@deepseek-ai/dsh-client-ui-slots`) and graph-row packages
(`@deepseek-ai/dsh-client-runtime/client` if we use
`createSnapshotStore`); everything else is inlined.

### 4. Registration: ids, slots, component contract

Recommended home for the card: **Plugins → "Plugin configuration" tab**, via
the `settings.plugin.item` keyed slot (keyed by settings namespace). That is
the documented extension point; the official `WebSearchCard` for
`web-search-deepseek` is the direct analogue. (A full standalone nav page via
`settings.section` — what `dshmarket` does for "Market" — is the alternative
if we outgrow a card; a `settings.general.item` row is for a single setting
and is too small for five fields + two keys.)

Chain of slot declarations the card depends on (all in the web roster):
`ui-sidebar` → `sidebar.settings`; `ui-settings-general` registers
`SettingsRoot` there and declares the `settings.*` slots;
`ui-settings-plugins` registers the `plugins` section (`settings.section`,
order 15) declaring `settings.plugins.tab`, and its `configurable` tab
declaring the keyed `settings.plugin.item` slot. A card registered under
`settings.plugin.item` with `key: "web-search-ext"` is dispatched when — and
only when — the Host serves that namespace (it does).

Services the client module injects (module-level `inject` export):
`["slots", "locale", "connection", "settingsScope", "remote"]`.

Skeleton (the built bundle's factory body; ~35 lines, no full implementation):

```js
// src/client/index.js — shape of the built factory body
import { h } from "react";                 // externals: react seed words,
import { en, zh } from "./locales.js";     //       primitives seed word

const NS = "web-search-ext";               // settings namespace + i18n namespace
const inject = ["slots", "locale", "connection", "settingsScope", "remote"];

function WebSearchExtCard(props) {
  const { t, scope, api } = props;         // slot `inject` face spread flat into props
  const snap = scope.getSnapshot();        // { status, value, base, user, revision, writable }
  // …local React state for staged drafts (preferred, numResults, …) + two key fields…
  // save: staged settings fields → scope.set(field, value) / scope.unset(field)
  //        (revision fencing + recovery are owned by the scope; one field per write)
  // keys:  staged non-blank key  → api.credentials.set({ ref, value })   // EXA_API_KEY /
  //       staged blank key      → write nothing, keep the stored key     // FIRECRAWL_API_KEY
  // key badge: api.credentials.describe({ refs: [ref] }) → { configured, writable }
  return h("div", { className: "wsx-card" }, /* title + fields + save/discard, t() copy */);
}

function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), "web-search-ext: dictionaries");
  const t = ctx.locale.bind(NS);
  const scope = ctx.settingsScope.bind({ namespace: NS });   // derived scope, no extra wire read
  const api = ctx.get("connection").api;
  ctx.effect(() => ctx.remote.$on("credentials/reference-updated", (ref) => {
    if (ref === "EXA_API_KEY" || ref === "FIRECRAWL_API_KEY") reReadKeyBadges();
  }), "web-search-ext: credential invalidations");
  ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
    name: "settings.plugin.item",
    key: NS,                        // keyed slot: the settings namespace this card edits
    locale: NS,                     // lets the shell resolve our copy for the tab's labels
    inject: () => ({ t, scope, api })
  }, WebSearchExtCard));
}

module.exports = { apply, inject };      // cordis client-plugin shape (see settings-models client.js:2805-2807)
```

Wire calls used by the card (all via `connection.api`, the shared RPC client):

| Call | Shape | Used for |
|---|---|---|
| (reads) `ctx.settingsScope` mirror | derived from the ONE browser-side `settings.describe` | schema, redacted values, `user`/`base` layers, `secrets: [{path, set}]`, `revision` |
| `scope.set(field, value)` / `scope.unset(field)` | one field per write, fenced by namespace `revision` (`settings.mutate` `{op:'set'\|'unset', path:[field]}` under the hood) | saving `preferred`, `numResults`, `maxSnippetChars`, `rateLimitCooldownSec`, `firecrawlKeyless`, `*ApiKeyEnv`, `*ApiUrl`, `firecrawlBaseUrl` |
| `api.credentials.describe({ refs: ["EXA_API_KEY","FIRECRAWL_API_KEY"] })` | → `{ credentials: { [ref]: { configured, source?, writable } } }` — never values | the two key "configured" badges |
| `api.credentials.set({ ref, value })` | value crosses the wire in exactly one direction | entering the two API keys (blank draft writes nothing) |
| `ctx.remote.$on("credentials/reference-updated", fn)` | forwarded-host event (allowlisted in `dsh-api-remotes`) | re-reading badges after the key changes from another surface (e.g. Models page) |

i18n: one dictionary namespace (`web-search-ext`) registered with both
`en` and `zh` (`ctx.locale.register(NS, { en, zh })`); lookup chain is
`ns → common → en → key`. The card is registered with `locale: NS` and its
copy comes from `t()` — matching the settings shell's "ownerless copy" model
(the shell carries zero copy; every registrant supplies its own).

### 5. Dev loop

- Build the bundle with `tsdown --watch` in the plugin checkout (add
  `tsdown` as a devDependency plus a small config that emits
  `client/client.js` in the factory format above, with the seed-word
  externals). The profile link-install means the harness stat-polls exactly
  this file.
- `dsh-client-hmr` (always mounted by the web bundle) detects the rewrite,
  re-hashes, pushes a `rebuilt` frame over `GET /plugins/events`, and the
  browser reloads just this plugin (invalidate → prefetch → fiber swap →
  `entry.refresh()`). No builder→host channel needed; no harness changes.
- Restart the `dsh web` process only when the `dsh.client` manifest or
  `exports` map changes (manifest cache never expires) or on first
  install.

## Evidence (spot-checked against installed artifacts, 2026-08-21)

- **Host half already serves the namespace**: `lib/index.js:38` imports
  `installSettingsSection` from `@deepseek-ai/dsh-settings`; `lib/index.js:542`
  calls `installSettingsSection(ctx, SETTINGS_NAMESPACE, Config, config, {…})`
  with `SETTINGS_NAMESPACE = "web-search-ext"`. No host-side UI registration
  exists or is needed.
- **Manifest mechanics**: `dsh-client-modules/lib/index.js` handles the
  `dsh.client` manifest fields `platform`, `inject`, `external`,
  `immediately` (all four identifiers present in the loader bundle). Its
  README: the Node half "scans enabled Loader entries for web `dsh.client`
  packages, resolves each `exports[\"./client\"]`… and serves each bundle with
  its source map under `/plugins`"; "a plugin bundle IS its package's client
  half"; the manifest "is cached per entry and never expires".
- **Production proof (third-party path)**: the live web profile
  (`~/.dsh/profiles/web/package.json`) depends on `dshmarket`, and its
  `package.json` carries exactly the planned shape:
  `"dsh": { "bundle": {"patch": "./cordis.patch.yml"}, "client": {"platform":
  "web", "inject": [dsh-client-connection, dsh-client-runtime,
  dsh-client-locale, dsh-client-ui-settings, dsh-client-ui-theme] } }` with
  `exports` keys `['.', './client', './cordis.patch.yml', './package.json']`.
  `dsh-better-sidebar` and `dsh-cost-meter` are in the same profile.
- **Slot chain**: `dsh-client-ui-settings-plugins/lib/client.js` declares
  `settings.section` (the `plugins` section), `settings.plugins.tab`, and the
  keyed `settings.plugin.item` slot; registration pattern visible in the
  bundle: `settings.plugin.item", {}, { entryKey: ns })`.
- **Official analogue**: `WebSearchCard` +
  `web-search-card-controller` exist in `dsh-client-ui-settings-plugins`
  (`lib/client.js` + `lib/types/client/WebSearchCard.d.ts` + README) — the
  settings card for the built-in `web-search-deepseek` provider.
- **Wire APIs in use**: `settings-models/lib/client.js` invokes
  `settings.mutate` (5×), `credentials.set` (4×), `credentials.describe`
  (3×); `settings.describe` is consumed by `dsh-client-connection/lib/client.js`
  (10×) and `dsh-client-ui-settings/lib/client.js` (5×) — the shared snapshot
  the plan's `settingsScope` derives from.
- **i18n**: `dsh-client-locale` README: "typed `register(ns, {zh, en})` checked
  against `LocaleNamespaceMap`, `bind(ns)`→`TranslateNS<ns>`; lookup chain ns →
  common → en → key"; slots install via `ctx.slots.installLocale`; the
  framework-injected `t` seat is standard.
- **Forwarded events**: `credentials/reference-updated` appears in
  `dsh-api-remotes/lib/index.js` (allowlisted host→browser event).
- **HMR + build tool**: `dsh-client-hmr` README: "The node half detects
  rebuilds with one interval that stat-polls each graph bundle…; **any tsdown
  watch process producing the bundle therefore triggers HMR with no
  builder→host channel**"; reload = invalidate → prefetch → fiber swap →
  `entry.refresh()`; React state inside the reloaded plugin is lost by design.
  `tsdown` is referenced in `dsh-client-ui-settings-models/package.json` and
  `dsh-client-modules/package.json`.

## C1 toolview card — evidence (spot-checked against installed artifacts, 2026-08-29)

Data path for the `web_search` toolview card (`src/client/row.js` + `model.js`):

- **Slot contract**: `dsh-client-ui-tool/lib/types/client/contract/slots.d.ts` —
  keyed slot `tool.call.toolview`, `scope: 'session'`, owner payload
  `ToolCallOwnerProps { callId, toolName, block, cwd?, home?, openFile, inspect? }`
  + locale seat (`t`). "A key the shipped composition already covers is
  replaced, not shared" → `key: 'web_search'` takes over the built-in WebRow.
  Registration reference: `dsh-client-ui-skill/lib/client.js`
  (`ctx.locale.register(NS, {zh, en})` + `ctx.slots.inject("tool.call.toolview",
  () => ctx.slots.register({ name, key, locale: NS }, Component))`); its
  `dsh.client` manifest injects `dsh-client-ui-tool` — we now do the same.
- **Data source is the structured `resultView`, not parsed text**: the host's
  `dsh-tool-web/lib/index.js` `execute()` returns
  `{ content?, sources: projectSource(...), truncated }` and
  `output.presentationMeta` = `searchMetaFromValue(value)` →
  `{ sources (byte-projected to url/title?/snippet?/publishedAt?), truncated,
  answer: value.content }`; `presentResult` builds
  `{ card: "web", kind: "search", title: queries.join(", "), sources,
  truncated, answer? }` → client `ToolResultNode.resultView`. So our provider's
  `content` (receipt line first, then optional vendor text) arrives as
  `resultView.answer`, and our verify.js marker prefixes survive inside
  `resultView.sources[].snippet`. `resultView` is `null` while the call runs
  (`RunningToolCall` carries only `argsRaw`/`time`), so the running state is
  derived from `argsRaw` alone (relevant to #17 C5: no running content exists
  on the wire yet).
- **Provider-agnostic degradation**: our card owns all `web_search` calls
  (keyed takeover), so it must handle a non-pinned provider too: provenance is
  only claimed when the first `answer` line starts with `web-search-ext:`
  (our receipt prefix); badges only from our closed-list marker grammar
  (`[alive]`, `[verified]`, `[verified·changed]`, `[unverified]`, `[dead 404]`,
  `[blocked]`, `[timeout]`, `[unreachable]`, `[skipped]` + optional `(detail)`,
  exactly what `lib/verify.js` MARKERS emits); a view that is not a `web`
  `search` card degrades to the raw content text. Never throws, never
  mislabels.
- **Chrome**: host primitive `DisclosureRow` + `StateDot`/
  `IconGlobeOutline14`/`IconInspectOutline12` from
  `@deepseek-ai/dsh-client-ui-primitives` (resolved by the host module loader
  at runtime; already in the tsdown `neverBundle` list — the same module our
  settings card imports icons from). Row CSS mirrors the host ToolRow tokens
  (`--dsw-alias-state-success/warn/error-primary` badge tones, sweep animation,
  24px row) verified present in the installed
  `dsh-web-frontend/dist` theme.
- **Model is pure** (`src/client/model.js`, no React/CSS imports) and unit
  tested in `test/toolview.test.mjs` (deterministic, no network).
- **Answer body renders through the host's `MarkdownText` primitive**
  (`model.answer`, i.e. `resultView.answer` minus our claimed receipts/
  headers). Verified in the installed web-frontend dist export map:
  `MarkdownText` sits in the same `@deepseek-ai/dsh-client-ui-primitives`
  module our row already imports (alongside `DisclosureRow`/`StateDot`, in
  the tsdown `neverBundle` list), and the built-in `WebSearchBlock` it
  replaces renders this same wire `answer` through it (`jsx(MarkdownText,
  { text: answer })` — the only call site). Its contract disables raw HTML,
  relative links, and unsafe protocols, so it is the safer renderer, not a
  risk. The non-web degraded path (`model.text`) stays plain pre-wrap — that
  is the host's generic tool-result treatment, and error text must never be
  re-interpreted as markdown.

## C4 per-result drill-down — design evidence (2026-08-29)

Wire constraint that shapes the whole feature (verified in installed
`dsh-tool-web/lib/index.js`): `projectSource` projects a seam source to
exactly `{ url, title?, snippet?, publishedAt? }` and `isWebSource` accepts
only those string fields — no structured per-source field (backend,
verification) can survive to `resultView`. Therefore:

- **Serving backend is receipt-derived, not per-source.** One `web_search`
  call is answered by exactly one backend (failover is per-call, not
  per-result; lib/index.js `plan`), so `model.backends` is the deduplicated
  union of `receiptBackend()` labels parsed from claimed receipt lines
  (`web-search-ext: <label> · …`; real labels `exa-rest` / `exa-mcp` /
  `firecrawl`). A multi-backend merge (429 failover mid-flight across
  sub-queries) cannot attribute a source to a section — the host's
  `mergeSearchResults` round-robins the source arrays with URL dedup and no
  section markers — so the drill-down shows the honest union plus a
  "(merged across sub-queries)" note. No receipt (non-pinned provider) → no
  backend line at all.
- **Freshness is the wire's `publishedAt`** (vendor-supplied; rendered as
  "unknown" when absent).
- **Verification state re-surfaces the C1 badge** (marker label + optional
  detail such as "8/9 words" or "fetch failed"); "not verified" when the
  snippet carries no marker (verifyLevel off, or non-pinned provider).
- **Interaction is client-side only**: clicking a source head (role="button",
  keyboard Enter/Space; the title anchor stops propagation so opening the
  link does not toggle) expands a per-source detail block; one expanded at a
  time. No wire, host, or provider changes — the whole feature is
  `src/client/` + scenarios in `test/toolview.test.mjs` (backend parsing,
  dedupe/union, multi-backend merge, non-pinned empty backends; scenario
  count asserted in-test only, not in docs).

## Open questions / risks

1. **Bundle entry `id` vs install method — RESOLVED (pre-release review).**
   The loader's graph-row id is the profile dependency key, and
   `dsh plugin add` writes the *npm package name* (scoped) as that key, so
   a hard-coded unscoped id would never materialize for npm-installed users.
   `dsh-client-modules` `register()` rejects only a **duplicate** registration
   of one id (different ids coexist in the `factories` Map; `arrive(row)` only
   requires the row's id to be present), so `scripts/wrap-client.mjs` emits
   two `window.__ModuleLoader__.load` calls — one per install form's key
   (`dsh-web-search-ext` link key, `@fno2010/dsh-web-search-ext` npm key).
   Verified live: the link-install profile materializes the unscoped row;
   the npm-install path is covered by the second registration (verified
   against the loader's boot/registration semantics; same factory body,
   the unmaterialized registration costs one idle closure).
   **HMR caveat** (both handled in the wrap script): the HMR driver
   invalidates and re-executes only the reloaded row's id — so (a) the
   other id's re-registration throws the loader's duplicate error on
   every dev-loop rebuild; each emitted `load` swallows exactly that
   message and rethrows everything else, and (b) `removeOwnedStyles(id)`
   deletes `<style data-plugin>` tags by exact match on the row id, so
   the emitted `data-plugin` attribute carries each block's own id or the
   stale stylesheet would survive the swap on link: profiles.
2. **`LocaleNamespaceMap` typing.** `locale.register` is "checked against
   `LocaleNamespaceMap`" — a typed namespace registry. Confirm whether a
   third-party namespace registers at runtime without a type-level entry, or
   whether the check is permissive for unknown namespaces (the bundle is JS,
   so this is a runtime concern; verify in the spike).
3. **Harness churn**: installed harness is `0.1.1-rc.2`; the client plugin API
   is still evolving. Re-run this plan's evidence grep-set after each harness
   bump before relying on it.
4. **Coarse reload**: HMR loses in-card React state by design (no
   react-refresh-grade preservation). Acceptable for a settings card; just
   don't design long-lived unsaved drafts around the reload boundary.
5. **Manifest cache never expires**: adding the `dsh.client` block /
   `exports["./client"]` requires restarting the `dsh web` process; only
   bundle *content* changes are HMR-hot.

## Spike plan (minimal, ~1 day)

Goal: prove the load path — a third-party client bundle from this repo shows a
card in Settings → Plugins → configurable, reading the real
`web-search-ext` namespace.

1. **Scaffold**: `src/client/index.js` + `src/client/locales.js` (EN+ZH, 5–8
   strings), `tsdown.config.js` (external: react/jsx-runtime,
   `@deepseek-ai/cordis`, `@deepseek-ai/dsh-client-ui-primitives`,
   `@deepseek-ai/dsh-client-ui-slots`; emit factory-format
   `client/client.js`).
2. **Card (read-only first)**: register dictionary; `settingsScope.bind({
   namespace: "web-search-ext" })`; register one `settings.plugin.item` with
   `key: "web-search-ext"`; render the namespace `revision` + `preferred` +
   `numResults` values from the snapshot. No writes yet.
3. **Manifest**: add `exports["./client"]`, `files += "client"`,
   `dsh.client {platform: "web", inject: [dsh-client-runtime,
   dsh-client-locale, dsh-client-connection, dsh-client-ui-settings,
   dsh-api-remotes]}`.
4. **Verify in a web instance**:
   - Success = Settings → Plugins shows a "web-search-ext" card under the
     configurable tab displaying the current `preferred`/`numResults`;
     changing `preferred` in `settings.yaml` and re-opening the card shows the
     new value (proves the real namespace snapshot, not hardcoded copy).
   - Answer open question #1: inspect the served bundle graph (`/plugins`) and
     the loader status projection for the entry name; if the id must equal
     the profile dependency key, adjust the build to emit the right id for
     the scoped-npm install path and re-verify.
5. **Second iteration (same spike or the card PR)**: add the two key inputs
   (`credentials.set` / `credentials.describe` badges) + `scope.set` writes
   for one field, EN/ZH switch check.
6. **Ship**: fold `docs/settings-ui-plan.md` into the feature PR; update the
   READMEs' "Keys" section to name the UI entry point; `0.2.0` release.
