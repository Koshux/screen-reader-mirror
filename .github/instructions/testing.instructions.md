---
applyTo: "**/*.{test,spec}.ts"
---

# Testing rules (auto-loaded for test files)

Canonical: [`.claude/rules/testing.md`](../../.claude/rules/testing.md).

- **Every acceptance criterion maps to at least one test.**
- **Prefer golden HTML fixtures**: a small markup snippet in, the expected linearized/annotated
  output out. Keep each fixture focused on one phenomenon.
- Vitest (node) for pure functions; jsdom/happy-dom when a real `Element` tree is needed;
  Playwright only for the extension/web targets.
- Cover the accessibility edge cases (shadow DOM, iframes, `aria-hidden`, empty-vs-missing `alt`,
  circular `aria-labelledby`, live regions).
- Scope runs to the change. A setup failure (deps/Node) is not a code bug — fix setup first.
