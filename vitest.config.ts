import { defineConfig } from "vitest/config";

// Root config — discovers *.test.ts across every package. Individual packages can add
// their own vitest.config.ts (e.g. the extension/web targets need a jsdom environment).
export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["packages/*/src/**"],
    },
  },
});
