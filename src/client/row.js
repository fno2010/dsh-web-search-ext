// The web_search toolview row (C1).
//
// Registered into the keyed `tool.call.toolview` slot under key "web_search"
// — a key the shipped composition already covers, so this is a takeover of
// the host's built-in web row, not a side-by-side add-on. It renders the
// host's own sources (block.resultView, projected by dsh-tool-web from our
// seam result) and adds what the generic web card cannot:
//
//   - the provenance receipt line(s), one per sub-query when the host merged
//     multiple queries (`### <query>` answer sections) — claimed only when a
//     line really is our receipt (`web-search-ext:` prefix), so a non-pinned
//     provider never gets our label on its data;
//   - per-source verification badges (our verify.js markers, parsed from the
//     snippet prefix; absent when verifyLevel is off or the provider is not
//     ours);
//   - the truncation notice (the wire's structured `truncated` flag, which
//     carries the G5 numResults-cap case);
//   - source URLs are clickable only when they are public http(s) links
//     (mirrors the host's SafeLink policy; anything else renders as inert
//     text — the wire only guarantees a string).
//
// A result without a structured `web` search view (generic view, host error
// path, older host) degrades to the raw result text instead of throwing —
// failure is always visible, never silent.

import { createElement as h, useState } from "react";
import {
  DisclosureRow,
  IconGlobeOutline14,
  IconInspectOutline12,
  StateDot
} from "@deepseek-ai/dsh-client-ui-primitives";
import { webSearchCardModel, isSafeHref } from "./model.js";
import css from "./row.module.css";

/** Title fallback when a source ships no title (usually keyless paths). */
function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** State substitution for the collapsed leading slot (host ToolRow contract). */
function leadingFor(state) {
  switch (state) {
    case "error":
      return h(StateDot, { state: "error" });
    case "stopped":
      return h(StateDot, { state: "warning" });
    default:
      return h(IconGlobeOutline14, { size: 14 });
  }
}

/** Visually hidden run-state label for the colour-only lifecycle cues. */
function stateStatus(state, t) {
  switch (state) {
    case "running":
      return t("row.running");
    case "error":
      return t("row.failed");
    case "stopped":
      return t("row.stopped");
    default:
      return null;
  }
}

function firstLine(text) {
  const nl = text.indexOf("\n");
  return nl === -1 ? text : text.slice(0, nl);
}

/**
 * Render one `web_search` call: host row chrome (DisclosureRow, same tokens
 * as the built-in web row) + our card body (provenance, badges, sources,
 * truncation notice, optional vendor answer text).
 * @param {object} props - the keyed toolview payload plus our locale seat.
 */
export function WebSearchRow({ block, inspect, t }) {
  const model = webSearchCardModel(block);
  const [expanded, setExpanded] = useState(false);
  const hasBody =
    model.state === "ok"
      ? model.provenance.length > 0 ||
        model.sources.length > 0 ||
        model.truncated === true ||
        model.answer !== null ||
        model.text !== null
      : model.text !== null;
  // An ok search that produced nothing still opens to an explicit empty
  // note instead of a bare, non-expandable row.
  const empty = model.state === "ok" && !hasBody;
  const expandable = hasBody || empty;
  const open = expanded && expandable;
  const status = stateStatus(model.state, t);
  const summary =
    model.state === "error" && model.text !== null
      ? firstLine(model.text)
      : model.title !== ""
        ? model.title
        : t("row.title");
  const summaryClass =
    model.state === "error" ? `${css.summary} ${css.errorSummary}` : css.summary;

  return h(
    "div",
    { className: css.root, "data-tool": "web-search-ext", "data-state": model.state },
    status !== null
      ? h("span", { className: css.visuallyHidden }, status)
      : null,
    h(
      DisclosureRow,
      {
        rowClassName: css.row,
        leadingClassName: css.leading,
        titleClassName: css.title,
        chevronClassName: css.chevron,
        icon: leadingFor(model.state),
        title: t("row.title"),
        open,
        expandable,
        expandOnRowClick: true,
        keepContentWhenOpen: true,
        onToggle: () => setExpanded((value) => !value),
        collapsedContent: [
          h("span", { key: "sep", className: css.sep, "aria-hidden": true }),
          h("span", { key: "summary", className: summaryClass }, summary)
        ]
      },
      h(
        "div",
        { className: css.bodyWrap },
        h(
          "div",
          { className: css.card },
          model.provenance.length > 0
            ? h(
                "div",
                { className: css.provenance },
                model.provenance.map((entry, i) =>
                  h(
                    "div",
                    { key: i, className: css.provenanceEntry },
                    entry.query !== null
                      ? h("div", { className: css.provenanceQuery }, entry.query)
                      : null,
                    h("div", { className: css.provenanceLine }, entry.receipt)
                  )
                )
              )
            : null,
          empty ? h("div", { className: css.emptyNote }, t("row.noResults")) : null,
          model.sources.length > 0
            ? h(
                "ul",
                { className: css.sources },
                model.sources.map((source, i) =>
                  h(
                    "li",
                    { key: `${source.url}:${i}`, className: css.source },
                    h(
                      "div",
                      { className: css.sourceHead },
                      h("span", { className: css.sourceIndex, "aria-hidden": true }, String(i + 1)),
                      source.badge !== null
                        ? h(
                            "span",
                            {
                              className: `${css.badge} ${css[`badge_${source.badge.tone}`]}`
                            },
                            source.badge.detail !== null
                              ? `${source.badge.label} · ${source.badge.detail}`
                              : source.badge.label
                          )
                        : null,
                      isSafeHref(source.url)
                        ? h(
                            "a",
                            {
                              className: css.sourceTitle,
                              href: source.url,
                              target: "_blank",
                              rel: "noopener noreferrer"
                            },
                            source.title !== null ? source.title : hostnameOf(source.url)
                          )
                        : h(
                            "span",
                            { className: css.sourceTitle, "aria-disabled": "true" },
                            source.title !== null ? source.title : source.url
                          )
                    ),
                    source.snippet !== ""
                      ? h("div", { className: css.sourceSnippet }, source.snippet)
                      : null,
                    h(
                      "div",
                      { className: css.sourceMeta },
                      [source.url, source.publishedAt].filter((part) => part !== null && part !== "").join(" · ")
                    )
                  )
                )
              )
            : null,
          model.truncated === true
            ? h(
                "div",
                { className: css.truncatedNote },
                t("row.truncated", { count: model.sources.length })
              )
            : null,
          model.answer !== null
            ? h("div", { className: css.answerText }, model.answer)
            : null,
          model.text !== null
            ? h(
                "div",
                {
                  className: model.state === "error" ? `${css.genericText} ${css.errorText}` : css.genericText
                },
                model.text
              )
            : null
        ),
        inspect !== undefined
          ? h(
              "button",
              { type: "button", className: css.inspectButton, onClick: inspect },
              [h(IconInspectOutline12, {}), t("row.inspect")]
            )
          : null
      )
    )
  );
}
