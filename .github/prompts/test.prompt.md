---
description: "SDLC Stage 5 — write and run tests so every acceptance criterion is covered. Prefers golden HTML fixtures."
mode: agent
---

You are starting **Stage 5**: tests.

1. Read the spec's acceptance criteria and test plan.
2. For each AC, write the test the plan calls for. **Prefer golden HTML fixtures** (markup in →
   expected linearized interpretation out).
3. Cover the accessibility edge cases that apply (shadow DOM, iframes, `aria-hidden`,
   empty-vs-missing `alt`, circular `aria-labelledby`, live regions).
4. Run scoped tests until green, then `pnpm typecheck`. A setup failure (deps/Node) is not a
   code bug — fix setup first.

Prefer delegating to the `test-author` agent. End with the AC→test mapping and the pass/fail
summary. `Next: /code-review before push.`
