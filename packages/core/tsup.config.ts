import { defineConfig } from "tsup";

// Build the client-side engine as a clean, tree-shakeable ESM bundle with type declarations,
// so it works from npm and straight from a CDN (jsDelivr/unpkg) with no build step.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: "es2022",
});
