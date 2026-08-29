// C6: settings-card verifyLevel control — the pure, node-testable half of
// the card field. The host schema (lib/index.js) is the source of truth:
// `verifyLevel: z.union(["off", "liveness", "content"]).default("liveness")`.
// No React imports so the host-side test suite can exercise it under plain
// node, same as model.js / health.js / command.js.

/** The closed set of host-accepted verification tiers, in card display order. */
export const VERIFY_LEVELS = Object.freeze(["off", "liveness", "content"]);

/** The host schema's default tier (lib/index.js Config schema). */
export const VERIFY_LEVEL_DEFAULT = "liveness";

/**
 * The tier the settings-card select should display for a stored value:
 * one of the three schema tiers, or the schema default when the value is
 * unset or unrecognized. A hand-edited settings.yaml may hold anything;
 * the host would reject a write of an unrecognized tier, so the card
 * normalizes it to the default instead of echoing it back.
 * @param {unknown} stored - raw document value (undefined when unset).
 * @returns {"off" | "liveness" | "content"}
 */
export function effectiveVerifyLevel(stored) {
  return VERIFY_LEVELS.includes(stored) ? stored : VERIFY_LEVEL_DEFAULT;
}
