// Wraps the tsdown CJS body into the exact client-bundle shape the DSH web
// shell expects (verified against installed third-party bundles, e.g.
// dshmarket/client/client.js):
//
//   window.__ModuleLoader__.load({ id: "<ENTRY NAME>", factory: (require) => {
//     var module = { exports: {} };
//     var exports = module.exports;
//     ...CJS module body...
//     return module.exports;
//   }
//
// The entry id must match how the profile's Loader entry is named (for the
// live link: install that is the profile dependency key "dsh-web-search-ext";
// see docs/settings-ui-plan.md, Open question #1 — the scoped npm install
// path may need a different id).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const id = process.argv[2] || "dsh-web-search-ext";
const bodyPath = join(here, "..", "client-build", "index.cjs");
const outPath = join(here, "..", "client", "client.js");

const body = readFileSync(bodyPath, "utf8");

// Inline the emitted CSS with the exact pattern the host's own client
// bundles use (verified against dsh-client-ui-settings-plugins and
// dshmarket bundles): a <style> tag keyed by data-plugin-css so the module
// body's side effects include its own stylesheet. tsdown extracts the CSS
// to a sibling asset; the browser-side loader never loads it, so it has to
// travel inside the bundle.
const cssPath = join(here, "..", "client-build", "style.css");
const cssBlock = existsSync(cssPath)
  ? [
      'const css$0 = ' + JSON.stringify(readFileSync(cssPath, "utf8")) + ";",
      'const tagId$0 = "@fno2010/dsh-web-search-ext/card.module.css";',
      'if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$0) + "]") === null) {',
      '\tconst tag = document.createElement("style");',
      '\ttag.dataset.plugin = "@fno2010/dsh-web-search-ext";',
      '\ttag.dataset.pluginCss = tagId$0;',
      '\ttag.textContent = css$0;',
      '\tdocument.head.appendChild(tag);',
      "}",
      ""
    ].join("\n")
  : "";

const out = [
  `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
  "",
  "\tvar module = { exports: {} };",
  "\tvar exports = module.exports;",
  // NOTE: the tsdown CJS body defines exports[Symbol.toStringTag] itself —
  // do NOT repeat it here (the second defineProperty on the same
  // non-configurable property throws and kills the factory at load time).
  cssBlock,
  body,
  "\treturn module.exports;",
  "}",
  "});",
  "",
  "//# sourceMappingURL=client.js.map",
  ""
].join("\n");

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out);
console.log(`wrote ${outPath} (id=${id}, ${out.length} bytes)`);
