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
import css from "./card.module.css";

const NS = "web-search-ext";
const EXA_REF = "EXA_API_KEY";
const FC_REF = "FIRECRAWL_API_KEY";
const NUMERIC = ["numResults", "maxSnippetChars", "rateLimitCooldownSec"];
const FIELDS = ["preferred", ...NUMERIC, "firecrawlKeyless"];

// Module-level injection: services this client plugin needs, by name.
const inject = ["slots", "locale", "connection", "settingsScope", "remote"];

const NO_KEY_STATE = { configured: false, writable: true, source: "" };

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

function WebSearchExtCard(props) {
  const { t, scope, api, remote } = props;
  // Collapsed by default, like the built-in plugin cards and the
  // third-party mirror shipped by dsh-market.
  const [open, setOpen] = useState(false);
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
      : null
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

  // Plugins → configurable tab: one keyed card per settings namespace.
  ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
    name: "settings.plugin.item",
    key: NS,
    locale: NS,
    inject: () => ({ t, scope, api, remote })
  }, WebSearchExtCard));
}

export { apply, inject };
export const name = "web-search-ext";
