// Client module for dsh-web-search-ext (see docs/settings-ui-plan.md).
//
// Registers a card into Settings → Plugins → configurable via the keyed
// `settings.plugin.item` slot (key = settings namespace "web-search-ext"):
// five settings fields (settings.mutate via the derived settings scope) and
// two API-key inputs (credentials.set; blank keeps the stored key).
//
// The card chrome is a 1:1 mirror of the host's PluginCard / fields-module
// design language (same tokens, same layout, host chevron icon, tsdown CSS
// module injection) so it reads as part of the plugin configuration page.
//
// Verified live (spike, 2026-08-21): namespace snapshot shape is
// { status, value, base, user, revision, writable, mode }; `value` is the
// effective merged value (schema defaults included).
//
// Key auto-discovery: credentials.describe reports per ref
// { configured, source: "env" | "file" | .env fallback, writable }
// (dsh-credentials-local). Refs supplied by the live process environment
// are read-only — the shadowing rule rejects writes an env value would
// shadow — and the card renders them disabled up front.

import { createElement as h, useState, useEffect, useRef } from "react";
import { IconChevronDownOutline14, IconLoadingOutline16 } from "@deepseek-ai/dsh-client-ui-primitives";
import { en, zh } from "./locales.js";
import { WebSearchRow } from "./row.js";
import { HEALTH_ROUTE, PROBE_ROUTE, parseHealth, formatDuration, ageOf } from "./health.js";
import { COMMAND_PRIMARY, COMMAND_FALLBACK, commandOptions } from "./command.js";
import { VERIFY_LEVELS, effectiveVerifyLevel } from "./settings-model.js";
import css from "./card.module.css";

const NS = "web-search-ext";
const EXA_REF = "EXA_API_KEY";
const FC_REF = "FIRECRAWL_API_KEY";
const NUMERIC = ["numResults", "maxSnippetChars", "rateLimitCooldownSec"];
const FIELDS = ["preferred", "verifyLevel", ...NUMERIC, "firecrawlKeyless"];

// Module-level injection: services this client plugin needs, by name.
const inject = ["slots", "locale", "connection", "settingsScope", "remote", "commandUi"];

const NO_KEY_STATE = { configured: false, writable: true, source: "" };

// C3: where the /search-engine command ended up (set during apply, read by
// the card's hint line): primary name, fallback name, or unavailable.
let commandRegistration = { name: null, fallback: false, unavailable: true };

/** Defensively read whatever shape the derived scope exposes. */
function readScope(scope) {
  try {
    if (scope && typeof scope.getSnapshot === "function") return scope.getSnapshot();
    if (scope && typeof scope.snapshot === "function") return scope.snapshot();
    if (scope && typeof scope === "object") return scope;
  } catch (err) {
    return { __error: String((err && err.message) || err) };
  }
  return null;
}

function effectiveValue(snap, field) {
  return snap && snap.value ? snap.value[field] : undefined;
}

function initialDraft(snap) {
  return {
    preferred: effectiveValue(snap, "preferred"),
    // C6: normalize before display — an unset or hand-edited value shows
    // the host schema's default tier instead of a dead select option, and
    // save() then writes a schema-valid value (or skips an unchanged one).
    verifyLevel: effectiveVerifyLevel(effectiveValue(snap, "verifyLevel")),
    numResults: effectiveValue(snap, "numResults"),
    maxSnippetChars: effectiveValue(snap, "maxSnippetChars"),
    rateLimitCooldownSec: effectiveValue(snap, "rateLimitCooldownSec"),
    firecrawlKeyless: effectiveValue(snap, "firecrawlKeyless")
  };
}

/**
 * Per-ref credentials state. describe({refs}) returns, per ref, which layer
 * supplies the key and whether that layer accepts writes; a missing/failed
 * response degrades to "unconfigured but writable" (the safe default: the
 * input stays editable and a failed write reports itself on save).
 */
function keyStateFrom(res) {
  const c = (res && res.credentials) || {};
  const one = (ref) => {
    const d = c[ref];
    if (!d || typeof d !== "object") return { ...NO_KEY_STATE };
    return { configured: !!d.configured, writable: d.writable !== false, source: d.source || "" };
  };
  return { exa: one(EXA_REF), fc: one(FC_REF) };
}

/** C3: settings-pane hint line — which slash-command name materialized (or none). */
function commandLineText(t) {
  if (commandRegistration.name === null) return t("cmd.lineUnavail");
  if (commandRegistration.fallback) {
    return t("cmd.lineFallback", { name: COMMAND_FALLBACK, primary: COMMAND_PRIMARY });
  }
  return t("cmd.line", { name: COMMAND_PRIMARY });
}

function WebSearchExtCard(props) {
  const { t, scope, api, remote } = props;
  // Collapsed by default, like the built-in plugin cards and the
  // third-party mirror shipped by dsh-market.
  const [open, setOpen] = useState(false);
  // Settings/Health tabs (C2); the settings form is the default pane.
  const [tab, setTab] = useState("settings");
  const [snap, setSnap] = useState(null);
  const [draft, setDraft] = useState(null);
  const [keyDraft, setKeyDraft] = useState({ exa: "", fc: "" });
  const [keyState, setKeyState] = useState(() => keyStateFrom(null));
  const [status, setStatus] = useState({ kind: "idle", msg: "" });
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);

  function markDirty(value) {
    dirtyRef.current = value;
    setDirty(value);
  }

  // Read the live namespace + key badges once on mount, and keep the
  // snapshot current after that (the derived scope folds its own writes —
  // and other surfaces' writes — back into the mirror it mirrors).
  useEffect(() => {
    const s = readScope(scope);
    setSnap(s);
    setDraft(initialDraft(s));
    let off = null;
    try {
      off = scope.subscribe(() => {
        const next = readScope(scope);
        setSnap(next);
        if (!dirtyRef.current) setDraft(initialDraft(next));
      });
    } catch (err) {
      off = null;
    }
    Promise.resolve()
      .then(() => api.credentials.describe({ refs: [EXA_REF, FC_REF] }))
      .then((res) => setKeyState(keyStateFrom(res)))
      .catch(() => {});
    return () => {
      if (typeof off === "function") {
        try {
          off();
        } catch (err) {}
      }
    };
  }, [scope, api]);

  // Re-read key badges when they change on another surface.
  useEffect(() => {
    let off = null;
    try {
      const r = remote && remote.$on
        ? remote.$on("credentials/reference-updated", (ref) => {
            if (ref !== EXA_REF && ref !== FC_REF) return;
            Promise.resolve()
              .then(() => api.credentials.describe({ refs: [ref] }))
              .then((res) => {
                const d = ((res && res.credentials) || {})[ref];
                setKeyState((prev) => {
                  const st = d && typeof d === "object"
                    ? { configured: !!d.configured, writable: d.writable !== false, source: d.source || "" }
                    : { ...NO_KEY_STATE };
                  return ref === EXA_REF ? { ...prev, exa: st } : { ...prev, fc: st };
                });
              })
              .catch(() => {});
          })
        : null;
      off = typeof r === "function" ? r : null;
    } catch (err) {
      off = null;
    }
    return () => {
      if (off) {
        try {
          off();
        } catch (err) {}
      }
    };
  }, [remote, api]);

  function setField(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
    markDirty(true);
  }

  function setKey(kind, value) {
    setKeyDraft((k) => ({ ...k, [kind]: value }));
    markDirty(true);
  }

  async function save() {
    setStatus({ kind: "saving", msg: "" });
    try {
      for (const field of FIELDS) {
        const value = draft[field];
        if (value === undefined) continue;
        const base = effectiveValue(snap, field);
        if (NUMERIC.includes(field)) {
          // Inputs deliver strings; the snapshot holds numbers. An empty
          // input reverts the field to its layer default instead of
          // writing 0 (which the schema rejects for min(1) fields).
          if (value === "") {
            await scope.unset(field);
            continue;
          }
          const n = Number(value);
          if (!Number.isFinite(n)) throw new Error(`${field}: not a number`);
          if (n === base) continue; // no effective change — don't pin the user layer
          await scope.set(field, n);
        } else {
          if (value === base) continue; // unchanged
          await scope.set(field, value);
        }
      }
      if (keyDraft.exa.trim() && keyState.exa.writable !== false) await api.credentials.set({ ref: EXA_REF, value: keyDraft.exa.trim() });
      if (keyDraft.fc.trim() && keyState.fc.writable !== false) await api.credentials.set({ ref: FC_REF, value: keyDraft.fc.trim() });
      const c = await Promise.resolve()
        .then(() => api.credentials.describe({ refs: [EXA_REF, FC_REF] }))
        .catch(() => null);
      if (c && c.credentials) setKeyState(keyStateFrom(c));
      markDirty(false);
      setStatus({ kind: "saved", msg: "" });
    } catch (err) {
      setStatus({ kind: "error", msg: String((err && err.message) || err) });
    }
  }

  function discard() {
    setDraft(initialDraft(snap));
    setKeyDraft({ exa: "", fc: "" });
    setStatus({ kind: "idle", msg: "" });
    markDirty(false);
  }

  const saving = status.kind === "saving";
  const busy = dirty || saving;
  // Read-only settings mode: the snapshot says so; the form offers nothing
  // the host would reject field by field.
  const ro = snap === null ? false : snap.writable === false;

  function keyField(labelKey, ref, value, onChange, state) {
    const st = state && typeof state === "object" ? state : NO_KEY_STATE;
    // Env-supplied refs are read-only (shadowing rule): the host rejects
    // writes that the live process environment would shadow, so render the
    // input disabled up front — exactly what describe().writable is for.
    const readOnly = st.configured && !st.writable;
    return h("div", { className: css.field },
      h("div", { className: css.head },
        h("label", { className: css.label }, t(labelKey)),
        h("span", { className: css.badges },
          h("span", { className: st.configured ? css.badge : css.badgeMuted }, t(st.configured ? "keySet" : "keyUnset")))
      ),
      h("input", {
        className: css.input,
        type: "password",
        autoComplete: "off",
        disabled: ro || readOnly,
        placeholder: readOnly ? `${ref} · ${st.source || "env"}` : (st.configured ? "" : ref),
        value: value,
        onChange: (e) => onChange(e.target.value)
      }),
      h("p", { className: css.hint }, t(readOnly ? "keyReadOnlyHint" : "keyHint"))
    );
  }

  function textField(labelKey, field, type, min) {
    return h("div", { className: css.field },
      h("div", { className: css.head },
        h("label", { className: css.label }, t(labelKey))
      ),
      h("input", {
        className: css.input,
        type: type,
        min: min,
        disabled: ro,
        value: draft ? String(draft[field] == null ? "" : draft[field]) : "",
        onChange: (e) => setField(field, e.target.value)
      })
    );
  }

  return h("div", { className: `${css.card}${open ? ` ${css.cardOpen}` : ""}` },
    h("button", {
      type: "button",
      className: css.header,
      "aria-expanded": open,
      onClick: () => setOpen((o) => !o)
    },
      h("div", { className: css.headText },
        h("div", { className: css.name }, t("title")),
        h("div", { className: css.description }, t("description"))
      ),
      dirty && !saving
        ? h("span", { className: css.pending }, t("pending"))
        : null,
      h("span", { className: open ? `${css.chevron} ${css.chevronOpen}` : css.chevron },
        h(IconChevronDownOutline14, { size: 14 }))
    ),
    open
      ? h("div", { className: css.body },
          h("div", { className: css.tabs, role: "tablist" },
            h("button", {
              type: "button",
              role: "tab",
              id: "dsw-websearch-tab-settings",
              "aria-controls": "dsw-websearch-panel-settings",
              className: tab === "settings" ? `${css.tab} ${css.tabActive}` : css.tab,
              "aria-selected": tab === "settings",
              onClick: () => setTab("settings")
            }, t("health.settings")),
            h("button", {
              type: "button",
              role: "tab",
              id: "dsw-websearch-tab-health",
              "aria-controls": "dsw-websearch-panel-health",
              className: tab === "health" ? `${css.tab} ${css.tabActive}` : css.tab,
              "aria-selected": tab === "health",
              onClick: () => setTab("health")
            }, t("health.tab"))
          ),
          tab === "settings"
            ? h("div", {
                className: css.settingsPane,
                role: "tabpanel",
                id: "dsw-websearch-panel-settings"
              },
                h("p", { className: css.hint }, commandLineText(t)),
                h("div", { className: css.field },
                  h("div", { className: css.head },
                    h("label", { className: css.label }, t("preferred"))
                  ),
                  h("select", {
                    className: css.input,
                    disabled: ro,
                    value: String(draft?.preferred ?? "exa"),
                    onChange: (e) => setField("preferred", e.target.value)
                  },
                    h("option", { value: "exa" }, "exa"),
                    h("option", { value: "firecrawl" }, "firecrawl"))
                ),
                // C6: verification tier. The host resolves it per call
                // (installSettingsSection hot-swaps the config source on
                // every write), so a saved change applies from the next
                // web_search onward — no restart.
                h("div", { className: css.field },
                  h("div", { className: css.head },
                    h("label", { className: css.label }, t("verifyLevel"))
                  ),
                  h("select", {
                    className: css.input,
                    disabled: ro,
                    value: effectiveVerifyLevel(draft?.verifyLevel),
                    onChange: (e) => setField("verifyLevel", e.target.value)
                  },
                    ...VERIFY_LEVELS.map((level) => h("option", { value: level }, level))),
                  h("p", { className: css.hint }, t("verifyLevelHint"))
                ),
                textField("numResults", "numResults", "number", "1"),
                textField("maxSnippetChars", "maxSnippetChars", "number", "1"),
                textField("cooldown", "rateLimitCooldownSec", "number", "0"),
                h("div", { className: css.field },
                  h("div", { className: css.head },
                    h("label", { className: css.label }, t("keyless")),
                    h("input", {
                      type: "checkbox",
                      className: css.check,
                      disabled: ro,
                      checked: draft ? !!draft.firecrawlKeyless : true,
                      onChange: (e) => setField("firecrawlKeyless", e.target.checked)
                    })
                  )
                ),
                keyField("exaKey", EXA_REF, keyDraft.exa, (v) => setKey("exa", v), keyState.exa),
                keyField("firecrawlKey", FC_REF, keyDraft.fc, (v) => setKey("fc", v), keyState.fc),
                h("div", { className: css.footer },
                  status.kind === "error"
                    ? h("p", { className: css.failed }, t("error"), " ", status.msg)
                    : status.kind === "saved"
                      ? h("p", { className: css.hint, style: { flex: 1, margin: 0 } }, t("saved"))
                      : null,
                  h("button", {
                    type: "button",
                    className: css.discard,
                    disabled: !busy || saving || ro,
                    onClick: discard
                  }, t("discard")),
                  h("button", {
                    type: "button",
                    className: css.save,
                    disabled: !busy || saving || ro,
                    onClick: () => save()
                  }, saving ? h("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 } },
                    h("span", { className: css.spin }, h(IconLoadingOutline16, { size: 16 })),
                    t("saving")) : t("save"))
                )
              )
            : h(HealthTab, { t, panelId: "dsw-websearch-panel-health" })
        )
      : null
  );
}

// G3: fire the connectivity probe at most once per card session — on the
// first Health-tab open that still has no stored result (the "first
// install" moment). The host itself never probes at apply time, so this
// card is the only thing that reaches the vendors.
let autoProbeFired = false;

/**
 * Health tab (C2 + G3): fetches the session telemetry from the host's
 * same-origin GET /web-search-ext/health route on mount and on refresh,
 * and shows the connectivity probe result (POST /web-search-ext/probe on
 * first open / on "Test now"). A fetch/parse failure surfaces as an
 * explicit unavailable line with a retry — the tab never renders a
 * silently empty state.
 */
function HealthTab({ t, panelId }) {
  const [state, setState] = useState({ phase: "loading", data: null, error: "" });
  const [reload, setReload] = useState(0);
  const [probe, setProbe] = useState({ testing: false, error: "" });

  // G3: unmount flag for runProbe — a probe that outlives the tab must not
  // set state on an unmounted component (same discipline as the GET
  // effect's `cancelled`).
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: "loading", data: null, error: "" });
    fetch(HEALTH_ROUTE, { headers: { accept: "application/json" } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((payload) => {
        if (cancelled) return;
        const model = parseHealth(payload);
        if (model === null) throw new Error("unparsable payload");
        setState({ phase: "ready", data: model, error: "" });
        // G3: on first install the Health tab opens with no stored probe —
        // fire it once per card session so the user sees real status.
        if (model.probe === null && !autoProbeFired) {
          autoProbeFired = true;
          runProbe();
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ phase: "error", data: null, error: String((err && err.message) || err) });
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  function refreshButton() {
    return h("button", {
      type: "button",
      className: css.discard,
      onClick: () => setReload((n) => n + 1)
    }, t("health.refresh"));
  }

  // G3: run a live connectivity probe (POST /web-search-ext/probe) and
  // merge the result into the displayed payload. A failure never goes
  // silent: the reason lands on its own line and the last good data stays
  // in place, so the "Test now" button doubles as the retry.
  function runProbe() {
    setProbe((p) => ({ ...p, testing: true, error: "" }));
    fetch(PROBE_ROUTE, { method: "POST", headers: { accept: "application/json" } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((payload) => {
        if (!live.current) return;
        const model = parseHealth(payload);
        if (model === null) throw new Error("unparsable payload");
        setState((s) => (s.phase === "error" ? { phase: "ready", data: model, error: "" } : { ...s, data: model }));
        setProbe({ testing: false, error: "" });
      })
      .catch((err) => {
        if (!live.current) return;
        setProbe({ testing: false, error: String((err && err.message) || err) });
      });
  }

  function testButton() {
    return h("button", {
      type: "button",
      className: css.discard,
      disabled: probe.testing,
      onClick: () => runProbe()
    }, probe.testing ? t("health.connectivity.testing") : t("health.connectivity.test"));
  }

  function section(title, headExtra, ...rows) {
    return h("div", { className: css.healthSection },
      h("div", { className: css.healthSectionHead },
        h("div", { className: css.healthSectionTitle }, title),
        headExtra
      ),
      ...rows);
  }

  function row(label, value) {
    return h("div", { className: css.healthRow },
      h("div", { className: css.healthLabel }, label),
      h("div", { className: css.healthValue }, value));
  }

  function valueRow(value) {
    return h("div", { className: css.healthRow },
      h("div", { className: css.healthValue }, value));
  }

  if (state.phase === "loading") {
    return h("div", { className: css.health, role: "tabpanel", id: panelId },
      h("p", { className: css.hint }, t("health.loading")));
  }

  if (state.phase === "error") {
    return h("div", { className: css.health, role: "tabpanel", id: panelId },
      h("p", { className: css.failed }, t("health.error"), " ", state.error),
      h("div", { className: css.healthSectionHead }, refreshButton()));
  }

  const data = state.data;
  const now = Date.now();
  const searchRows = data.backends.filter((b) => b.provider === "search");
  const fetchRows = data.backends.filter((b) => b.provider === "fetch");
  const cooled = data.backends.filter((b) => b.cooldownRemainingMs > 0);

  function backendLine(b) {
    const counts = `${b.ok} ${t("health.ok")} · ${b.failed} ${t("health.failed")}`;
    if (b.lastCallAt === null) return `${counts} · ${t("health.never")}`;
    const age = ageOf(b.lastCallAt, now);
    const stateWord = b.lastOk ? t("health.ok") : t("health.failed");
    const ms = b.lastCallMs === null ? "" : ` · ${b.lastCallMs}ms`;
    return `${counts} · ${t("health.last")} ${age} ${stateWord}${ms}`;
  }

  function backendSection(provider, rows) {
    if (rows.length === 0) return null;
    return section(provider, null, ...rows.map((b) => row(b.label, backendLine(b))));
  }

  const sessionLine = [
    `${t("health.uptime")} ${formatDuration(data.uptimeMs)}`,
    t("health.searches", { count: data.searchCalls }),
    t("health.fetches", { count: data.fetchCalls }),
    ...(data.resultsReturned === null ? [] : [t("health.results", { count: data.resultsReturned })])
  ].join(" · ");

  const cooldownRows = cooled.length === 0
    ? [valueRow(t("health.none"))]
    : cooled.map((b) => row(b.label, t("health.remaining", { count: Math.ceil(b.cooldownRemainingMs / 1000) })));

  // G3 connectivity: per-backend probe outcomes (closed detail codes,
  // translated via the `probe.*` keys). Shown first — on first install it
  // answers "does anything reach the vendors at all" before any session
  // counters exist.
  const probeData = data.probe;
  function probeLine(b) {
    const glyph = b.status === "ok" ? "✓" : b.status === "disabled" ? "−" : "✗";
    return `${glyph} ${t(`probe.${b.detail}`)}${b.status === "disabled" ? "" : ` · ${b.ms}ms`}`;
  }
  const probeRows = probeData === null
    ? [valueRow(probe.testing ? t("health.connectivity.testing") : t("health.connectivity.none"))]
    : [
        valueRow(t("health.connectivity.last", { age: ageOf(probeData.at, now) })),
        ...probeData.backends.map((b) => row(b.label, probeLine(b)))
      ];

  return h("div", { className: css.health, role: "tabpanel", id: panelId },
    section(t("health.connectivity"), testButton(), ...probeRows),
    probe.error !== ""
      ? h("p", { className: css.failed }, t("health.connectivity.error"), " ", probe.error)
      : null,
    section(t("health.session"), refreshButton(), valueRow(sessionLine)),
    data.backends.length === 0
      ? h("p", { className: css.hint }, t("health.noActivity"))
      : null,
    backendSection("search", searchRows),
    backendSection("fetch", fetchRows),
    section(t("health.cooldowns"), null, ...cooldownRows)
  );
}

function apply(ctx) {
  // i18n: one dictionary namespace, EN + ZH (lookup chain: ns → common → en → key).
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), "web-search-ext: dictionaries");
  const t = ctx.locale.bind(NS);

  // Settings: derived scope bound to our namespace (no extra wire read).
  const scope = ctx.settingsScope.bind({ namespace: NS });

  // Wire APIs + forwarded events, surfaced to the card through the slot.
  const api = ctx.get("connection").api;
  const remote = ctx.get("remote");

  // C3: /search-engine command (client contribution; the host's popupSelect
  // shell owns the UI). All three actions run on client capabilities only —
  // preferred switch (bound settings scope), status (GET health +
  // credentials.describe), connectivity test (POST probe route) — and the
  // callbacks capture THIS root ctx, because the popup passes a session
  // projection that carries only a sessionId.
  //
  // Collision handling (known surface: host built-ins agent/execute/images/
  // line/list, other plugins' commands): the contribution registry rejects
  // a duplicate name at register time, so register the primary name and, on
  // throw, fall back to the secondary; the card's hint line surfaces which
  // name materialized (or that none did) — failure never silent.
  if (ctx.commandUi && typeof ctx.commandUi.register === "function") {
    const value = () => {
      const snap = readScope(scope);
      return snap && snap.value && typeof snap.value === "object" ? snap.value : {};
    };
    const contribution = {
      name: COMMAND_PRIMARY,
      description: t("cmd.description"),
      available: () => true,
      ui: {
        kind: "popupSelect",
        options: async (_session, signal) => {
          const [healthPayload, keyRes] = await Promise.all([
            fetch(HEALTH_ROUTE, { headers: { accept: "application/json" }, signal })
              .then((res) => (res.ok ? res.json() : null))
              .catch(() => null),
            Promise.resolve()
              .then(() => api.credentials.describe({ refs: [EXA_REF, FC_REF] }))
              .catch(() => null)
          ]);
          const v = value();
          return commandOptions({
            t,
            preferred: typeof v.preferred === "string" ? v.preferred : "exa",
            exaKey: keyStateFrom(keyRes).exa,
            fcKey: keyStateFrom(keyRes).fc,
            fcKeyless: v.firecrawlKeyless !== false,
            health: parseHealth(healthPayload)
          });
        },
        onSelect: async (option) => {
          if (option.id === "exa" || option.id === "firecrawl") {
            if (value().preferred === option.id) return; // already active
            await scope.set("preferred", option.id);
            return;
          }
          if (option.id === "test") {
            const res = await fetch(PROBE_ROUTE, { method: "POST", headers: { accept: "application/json" } });
            if (!res.ok) throw new Error(t("cmd.testFailed", { status: res.status }));
          }
        }
      }
    };
    try {
      ctx.effect(
        () => ctx.commandUi.register(contribution),
        "web-search-ext: /search-engine command"
      );
      commandRegistration = { name: COMMAND_PRIMARY, fallback: false, unavailable: false };
    } catch {
      try {
        ctx.effect(
          () => ctx.commandUi.register({ ...contribution, name: COMMAND_FALLBACK }),
          "web-search-ext: /web-search-engine command (fallback)"
        );
        commandRegistration = { name: COMMAND_FALLBACK, fallback: true, unavailable: false };
      } catch {
        commandRegistration = { name: null, fallback: false, unavailable: true };
      }
    }
  } else {
    commandRegistration = { name: null, fallback: false, unavailable: true };
  }

  // Plugins → configurable tab: one keyed card per settings namespace.
  ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
    name: "settings.plugin.item",
    key: NS,
    locale: NS,
    inject: () => ({ t, scope, api, remote })
  }, WebSearchExtCard));

  // web_search toolview card (C1): shadow the host's built-in web row for
  // the `web_search` tool. Keyed slots resolve by (key, priority): the host
  // `web-toolview` plugin already registers key "web_search" at the default
  // priority 0, and a second entry for the same key at the same priority is
  // a hard registry error ("register at a different priority to shadow it
  // (lowest renders)"). Entries sort by ascending priority and the FIRST
  // entry per key renders, so registering at an explicit priority -1
  // shadows the host entry instead of colliding with it. Our card renders
  // the same structured sources plus the provenance receipt and per-source
  // verification badges, and degrades to the raw result text whenever the
  // view is not a structured web card.
  ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
    name: "tool.call.toolview",
    key: "web_search",
    priority: -1,
    locale: NS
  }, WebSearchRow));
}

export { apply, inject };
export const name = "web-search-ext";
