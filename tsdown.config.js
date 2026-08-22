// tsdown build recipe for the spike client bundle (module body only).
// The final `client/client.js` (window.__ModuleLoader__.load wrapper) is
// produced by scripts/wrap-client.mjs from the CJS body emitted here.
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/client/index.js"],
  format: ["cjs"],
  target: "esnext",
  outDir: "client-build",
  dts: false,
  sourcemap: false,
  css: {
    modules: {
      // No [hash] in the pattern: lightningcss hashes from the absolute
      // source path, so a hash would differ per machine and break the
      // committed-bundle drift check in CI. [name]__[local] is stable
      // everywhere and collision-safe (unique "card-module__" prefix).
      generateScopedName: "[name]__[local]"
    }
  },
  deps: {
    neverBundle: [
      "react",
      "react/jsx-runtime",
      "@deepseek-ai/cordis",
      "@deepseek-ai/dsh-client-ui-primitives",
      "@deepseek-ai/dsh-client-ui-slots"
    ]
  }
});
