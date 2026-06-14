// Flat config (ESLint 9). Intentionally lean: TypeScript correctness + a guardrail
// against accidental network calls in the client-side core (see .claude/rules/infrastructure.md).
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**", "**/*.tsbuildinfo"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
  {
    // Node CommonJS scripts: the Claude enforcement hooks. They use require/process by design.
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "writable",
        exports: "writable",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },
  {
    // The core engine must stay client-side and offline. Flag any sign of a network
    // client sneaking in. Targets that legitimately need the network (cli, web server)
    // override this in their own config.
    files: ["packages/core/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "core must not make network calls — it runs fully client-side (see ADR-0001)." },
        { name: "XMLHttpRequest", message: "core must not make network calls — it runs fully client-side (see ADR-0001)." },
      ],
    },
  },
);
