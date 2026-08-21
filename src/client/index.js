// Spike client module for dsh-web-search-ext (see docs/settings-ui-plan.md).
//
// Registers a read-only card into the Plugins → configurable tab via the
// keyed `settings.plugin.item` slot (key = settings namespace), reads the
// live `web-search-ext` namespace snapshot, and renders a few fields plus a
// diagnostic dump of the snapshot shape (the exact settingsScope API surface
// is confirmed against the harness at spike-verification time).

import { createElement as h } from "react";
import { en, zh } from "./locales.js";

const NS = "web-search-ext";

// Module-level injection: services this client plugin needs, by name.
const inject = ["slots", "locale", "connection", "settingsScope", "remote"];

/** Defensively read whatever shape the derived scope exposes. */
function readScope(scope) {
  try {
    if (scope && typeof scope.getSnapshot === "function") return scope.getSnapshot();
    if (scope && typeof scope.snapshot === "function") return scope.snapshot();
    if (scope && typeof scope === "object") return scope;
  } catch (err) {
    return { __error: String(err && err.message || err) };
  }
  return null;
}

function pick(snap, field) {
  if (!snap) return undefined;
  if (snap.value && typeof snap.value === "object" && field in snap.value) return snap.value[field];
  if (field in snap) return snap[field];
  if (snap.user && typeof snap.user === "object" && field in snap.user) return snap.user[field];
  return undefined;
}

function WebSearchExtSpikeCard(props) {
  const { t, scope } = props;
  const snap = readScope(scope);
  const keys =
    snap && typeof snap === "object" && !snap.__error ? Object.keys(snap) : [];
  return h("div", { "data-wsx-spike": "1" },
    h("h3", null, t("title")),
    h("p", null, t("hint")),
    h("dl", null,
      h("div", null, h("dt", null, "revision"), h("dd", null, String(pick(snap, "revision") ?? "?"))),
      h("div", null, h("dt", null, "preferred"), h("dd", null, String(pick(snap, "preferred") ?? "?"))),
      h("div", null, h("dt", null, "numResults"), h("dd", null, String(pick(snap, "numResults") ?? "?"))),
      h("div", null, h("dt", null, "snapshot keys"), h("dd", null, keys.join(", ") || "(none)"))
    )
  );
}

function apply(ctx) {
  // i18n: one dictionary namespace, EN + ZH (lookup chain: ns → common → en → key).
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), "web-search-ext: dictionaries");
  const t = ctx.locale.bind(NS);

  // Settings: derived scope bound to our namespace (no extra wire read).
  const scope = ctx.settingsScope.bind({ namespace: NS });

  // Plugins → configurable tab: one keyed card per settings namespace.
  ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
    name: "settings.plugin.item",
    key: NS,
    locale: NS,
    inject: () => ({ t, scope })
  }, WebSearchExtSpikeCard));
}

export { apply, inject };
export const name = () => "web-search-ext";
