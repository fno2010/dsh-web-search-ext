// tsdown build recipe for the spike client bundle (module body only).
// The final `client/client.js` (window.__ModuleLoader__.load wrapper) is
// produced by scripts/wrap-client.mjs from the CJS body emitted here.
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/client/index.js"],
  format: ["cjs"],
  outDir: "client-build",
  dts: false,
  sourcemap: true,
  external: [
    "react",
    "react/jsx-runtime",
    "@deepseek-ai/cordis",
    "@deepseek-ai/dsh-client-ui-primitives",
    "@deepseek-ai/dsh-client-ui-slots"
  ]
});
