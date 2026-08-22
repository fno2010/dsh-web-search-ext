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
// The entry id must match how the profile's Loader entry is named, and that
// name is the profile dependency key — which differs by install form:
//
//   - npm install (`dsh plugin add @fno2010/dsh-web-search-ext`) keys the
//     dependency by the scoped package name;
//   - a local link: install keys it by whatever the author named it (this
//     repo's live profile uses the unscoped "dsh-web-search-ext").
//
// The loader's register() rejects a DUPLICATE registration of one id but
// happily keeps several different ids (factories is a plain Map; arrive()
// only requires the row's id to be present), so the bundle registers under
// every known entry name. A profile materializes exactly one of them.
// Pass extra ids as arguments to override the default set.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["dsh-web-search-ext", "@fno2010/dsh-web-search-ext"];
const bodyPath = join(here, "..", "client-build", "index.cjs");
const outPath = join(here, "..", "client", "client.js");

const body = readFileSync(bodyPath, "utf8");

// Inline the emitted CSS with the exact pattern the host's own client
// bundles use (verified against dsh-client-ui-settings-plugins and
// dshmarket bundles): a <style> tag keyed by data-plugin-css so the module
// body's side effects include its own stylesheet. tsdown extracts the CSS
// to a sibling asset; the browser-side loader never loads it, so it has to
// travel inside the bundle. Constant names are package-unique so they can
// never collide with a future tsdown/@tsdown/css output convention.
//
// `data-plugin` carries THIS block's entry id (not a fixed package name):
// dsh-client-hmr's removeOwnedStyles() deletes `<style data-plugin>` tags
// by exact match against the reloaded row's id — a fixed attribute would
// leave the stale stylesheet behind on link: profiles and the
// data-plugin-css dedupe would then refuse to re-inject the new CSS.
const cssPath = join(here, "..", "client-build", "style.css");
const cssBlockFor = (id) =>
  existsSync(cssPath)
    ? [
        'const wsxCss = ' + JSON.stringify(readFileSync(cssPath, "utf8")) + ";",
        'const wsxTagId = "@fno2010/dsh-web-search-ext/card.module.css";',
        'if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(wsxTagId) + "]") === null) {',
        '\tconst tag = document.createElement("style");',
        `\ttag.dataset.plugin = ${JSON.stringify(id)};`,
        '\ttag.dataset.pluginCss = wsxTagId;',
        '\ttag.textContent = wsxCss;',
        '\tdocument.head.appendChild(tag);',
        "}",
        ""
      ].join("\n")
    : "";

// One factory body, registered under each known entry id. (The loader
// de-dupes per id and materializes at most one row per profile, so the
// unmaterialized registration costs one idle closure.) Each load is
// wrapped to tolerate the loader's duplicate-registration error: HMR
// re-executes this script after invalidating ONLY the reloaded row's id,
// so the other (never-materialized here) id is still registered and its
// re-registration throws. Swallowing exactly that error keeps HMR
// working on both install forms; the stale idle factory can't
// materialize anyway, and everything else still throws.
const factoryBodyFor = (id) =>
  [
    "\tvar module = { exports: {} };",
    "\tvar exports = module.exports;",
    // NOTE: the tsdown CJS body defines exports[Symbol.toStringTag] itself —
    // do NOT repeat it here (the second defineProperty on the same
    // non-configurable property throws and kills the factory at load time).
    cssBlockFor(id),
    body,
    "\treturn module.exports;"
  ].join("\n");

const loads = ids
  .map(
    (id) =>
      `try {\nwindow.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {\n${factoryBodyFor(id)}\n}\n});\n} catch (wsxErr) {\nif (!String((wsxErr && wsxErr.message) || wsxErr).includes("duplicate factory registration")) throw wsxErr;\n}`
  )
  .join("\n\n");

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, loads + "\n");
console.log(`wrote ${outPath} (ids=${JSON.stringify(ids)}, ${loads.length} bytes)`);
