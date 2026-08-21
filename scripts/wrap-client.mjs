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
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const id = process.argv[2] || "dsh-web-search-ext";
const bodyPath = join(here, "..", "client-build", "index.cjs");
const outPath = join(here, "..", "client", "client.js");

const body = readFileSync(bodyPath, "utf8");
const out = [
  `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
  "",
  "\tvar module = { exports: {} };",
  "\tvar exports = module.exports;",
  // NOTE: the tsdown CJS body defines exports[Symbol.toStringTag] itself —
  // do NOT repeat it here (the second defineProperty on the same
  // non-configurable property throws and kills the factory at load time).
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
