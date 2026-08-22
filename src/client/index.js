// Client module for dsh-web-search-ext (see docs/settings-ui-plan.md).
//
// Registers a card into Settings → Plugins → configurable via the keyed
// `settings.plugin.item` slot (key = settings namespace "web-search-ext"):
// five settings fields (settings.mutate via the derived settings scope) and
// two API-key inputs (credentials.set; blank keeps the stored key).
//
// Verified live (spike, 2026-08-21): namespace snapshot shape is
// { status, value, base, user, revision, writable, mode }; `value` is the
// effective merged value.

import { createElement as h, useState, useEffect } from "react";
import { en, zh } from "./locales.js";
import { ensureStyle } from "./styles.js";

const NS = "web-search-ext";
const EXA_REF = "EXA_API_KEY";
const FC_REF = "FIRECRAWL_API_KEY";
const NUMERIC = ["numResults", "maxSnippetChars", "rateLimitCooldownSec"];
const FIELDS = ["preferred", ...NUMERIC, "firecrawlKeyless"];

// Module-level injection: services this client plugin needs, by name.
const inject = ["slots", "locale", "connection", "settingsScope", "remote"];

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

function initialDraft(snap) {
  const v = (snap && snap.value) || {};
  return {
    preferred: v.preferred,
    numResults: v.numResults,
    maxSnippetChars: v.maxSnippetChars,
    rateLimitCooldownSec: v.rateLimitCooldownSec,
    firecrawlKeyless: v.firecrawlKeyless
  };
}

function WebSearchExtCard(props) {
  const { t, scope, api, remote } = props;
  const [open, setOpen] = useState(true);
  const [snap, setSnap] = useState(null);
  const [draft, setDraft] = useState(null);
  const [keyDraft, setKeyDraft] = useState({ exa: "", fc: "" });
  const [keyState, setKeyState] = useState({ exa: false, fc: false });
  const [status, setStatus] = useState({ kind: "idle", msg: "" });
  const [dirty, setDirty] = useState(false);

  // Read the live namespace + key badges once on mount.
  useEffect(() => {
    const s = readScope(scope);
    setSnap(s);
    setDraft(initialDraft(s));
    Promise.resolve()
      .then(() => api.credentials.describe({ refs: [EXA_REF, FC_REF] }))
      .then((res) => {
        const c = (res && res.credentials) || {};
        setKeyState({
          exa: !!(c[EXA_REF] && c[EXA_REF].configured),
          fc: !!(c[FC_REF] && c[FC_REF].configured)
        });
      })
      .catch(() => {});
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
                const c = (res && res.credentials) || {};
                const configured = !!(c[ref] && c[ref].configured);
                setKeyState((prev) => (ref === EXA_REF ? { ...prev, exa: configured } : { ...prev, fc: configured }));
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
    setDirty(true);
  }

  async function save() {
    setStatus({ kind: "saving", msg: "" });
    try {
      for (const field of FIELDS) {
        const value = draft[field];
        const base = snap && snap.value ? snap.value[field] : undefined;
        if (value === undefined || value === base) continue; // unchanged
        let toWrite = value;
        if (NUMERIC.includes(field)) {
          toWrite = Number(value);
          if (!Number.isFinite(toWrite)) throw new Error(`${field}: not a number`);
        }
        if (toWrite === "") await scope.unset(field);
        else await scope.set(field, toWrite);
      }
      if (keyDraft.exa.trim()) await api.credentials.set({ ref: EXA_REF, value: keyDraft.exa.trim() });
      if (keyDraft.fc.trim()) await api.credentials.set({ ref: FC_REF, value: keyDraft.fc.trim() });
      const c = await Promise.resolve()
        .then(() => api.credentials.describe({ refs: [EXA_REF, FC_REF] }))
        .catch(() => null);
      if (c && c.credentials) {
        setKeyState({
          exa: !!(c.credentials[EXA_REF] && c.credentials[EXA_REF].configured),
          fc: !!(c.credentials[FC_REF] && c.credentials[FC_REF].configured)
        });
      }
      setStatus({ kind: "saved", msg: "" });
      setDirty(false);
    } catch (err) {
      setStatus({ kind: "error", msg: String((err && err.message) || err) });
    }
  }

  function discard() {
    setDraft(initialDraft(snap));
    setKeyDraft({ exa: "", fc: "" });
    setStatus({ kind: "idle", msg: "" });
    setDirty(false);
  }

  const saving = status.kind === "saving";

  return h("div", { className: `wsx-card${open ? " open" : ""}` },
    h("div", {
      className: "wsx-head",
      role: "button",
      "aria-expanded": open,
      onClick: () => setOpen((o) => !o)
    },
      h("div", { className: "wsx-titles" },
        h("div", { className: "wsx-title" }, t("title")),
        h("div", { className: "wsx-desc" }, t("description"))
      ),
      h("span", { className: "wsx-chevron" })
    ),
    open
      ? h("div", { className: "wsx-body" },
          h("div", { className: "wsx-field" },
            h("div", { className: "wsx-labelrow" }, h("label", { className: "wsx-label" }, t("preferred"))),
            h("select", {
              className: "wsx-select",
              value: String(draft ? draft.preferred : "exa"),
              onChange: (e) => setField("preferred", e.target.value)
            },
              h("option", { value: "exa" }, "exa"),
              h("option", { value: "firecrawl" }, "firecrawl"))
          ),
          h("div", { className: "wsx-field" },
            h("div", { className: "wsx-labelrow" }, h("label", { className: "wsx-label" }, t("numResults"))),
            h("input", {
              className: "wsx-input",
              type: "number",
              min: "1",
              value: draft ? String(draft.numResults) : "",
              onChange: (e) => setField("numResults", e.target.value)
            })
          ),
          h("div", { className: "wsx-field" },
            h("div", { className: "wsx-labelrow" }, h("label", { className: "wsx-label" }, t("maxSnippetChars"))),
            h("input", {
              className: "wsx-input",
              type: "number",
              min: "1",
              value: draft ? String(draft.maxSnippetChars) : "",
              onChange: (e) => setField("maxSnippetChars", e.target.value)
            })
          ),
          h("div", { className: "wsx-field" },
            h("div", { className: "wsx-labelrow" }, h("label", { className: "wsx-label" }, t("cooldown"))),
            h("input", {
              className: "wsx-input",
              type: "number",
              min: "0",
              value: draft ? String(draft.rateLimitCooldownSec) : "",
              onChange: (e) => setField("rateLimitCooldownSec", e.target.value)
            })
          ),
          h("div", { className: "wsx-field" },
            h("label", { className: "wsx-check" },
              h("input", {
                type: "checkbox",
                checked: draft ? !!draft.firecrawlKeyless : true,
                onChange: (e) => setField("firecrawlKeyless", e.target.checked)
              }),
              t("keyless"))
          ),
          h("div", { className: "wsx-field" },
            h("div", { className: "wsx-labelrow" },
              h("label", { className: "wsx-label" }, t("exaKey")),
              h("span", { className: `wsx-badge${keyState.exa ? " set" : ""}` }, t(keyState.exa ? "keySet" : "keyUnset"))
            ),
            h("input", {
              className: "wsx-input",
              type: "password",
              autoComplete: "off",
              placeholder: keyState.exa ? "" : EXA_REF,
              value: keyDraft.exa,
              onChange: (e) => setKeyDraft((k) => ({ ...k, exa: e.target.value }))
            }),
            h("div", { className: "wsx-hint" }, t("keyHint"))
          ),
          h("div", { className: "wsx-field" },
            h("div", { className: "wsx-labelrow" },
              h("label", { className: "wsx-label" }, t("firecrawlKey")),
              h("span", { className: `wsx-badge${keyState.fc ? " set" : ""}` }, t(keyState.fc ? "keySet" : "keyUnset"))
            ),
            h("input", {
              className: "wsx-input",
              type: "password",
              autoComplete: "off",
              placeholder: keyState.fc ? "" : FC_REF,
              value: keyDraft.fc,
              onChange: (e) => setKeyDraft((k) => ({ ...k, fc: e.target.value }))
            })
          ),
          h("div", { className: "wsx-footer" },
            h("span", { className: `wsx-status${status.kind === "error" ? " error" : ""}` },
              status.kind === "saving" ? t("saving")
                : status.kind === "saved" ? t("saved")
                  : status.kind === "error" ? h("span", null, t("error"), " ", status.msg)
                    : ""
            ),
            h("button", { className: "wsx-btn", disabled: saving || !dirty, onClick: discard }, t("discard")),
            h("button", { className: "wsx-btn primary", disabled: saving || !dirty, onClick: () => save() }, t("save"))
          )
        )
      : null
  );
}

function apply(ctx) {
  // Card CSS (theme-aware; injected once with the bundle's side effects).
  try {
    ensureStyle(globalThis.document);
  } catch (err) {}

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
export const name = () => "web-search-ext";
