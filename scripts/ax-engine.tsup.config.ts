// Self-contained browser bundle of the engine, used only by the Chrome oracle scripts
// (scripts/ax-compare.mjs). Dependencies are bundled in so it can be injected into a page as one
// script. Not published. Run from packages/core: `pnpm exec tsup --config ../../scripts/ax-engine.tsup.config.ts`.
// A plain object on purpose: this file sits outside the workspace packages, so it cannot import tsup.
export default {
  entry: { srm: "src/index.ts" },
  format: ["iife"],
  globalName: "srm",
  platform: "browser",
  target: "es2022",
  noExternal: [/.*/],
  minify: false,
  sourcemap: false,
  dts: false,
  clean: false,
  outDir: process.env.SRM_IIFE_OUT ?? "../../.cache/ax-engine",
};
