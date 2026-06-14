---
name: sdlc-workflow
description: "Drive a feature from idea to merged code through the screen-reader-mirror SDLC. Use when starting a new feature with no journey/spec yet."
---

# SDLC Workflow (Copilot)

Mirror of [`.claude/skills/sdlc-workflow/SKILL.md`](../../../.claude/skills/sdlc-workflow/SKILL.md).
Canonical reference: [AGENTS.md](../../../AGENTS.md) §3 and [docs/sdlc/README.md](../../../docs/sdlc/README.md).

Walk the phases, delegating to the matching agent/prompt at each:

1. **Journey** — `/journey` (`journey-author`). Approve before continuing.
2. **Spec** — `/spec` (`spec-author`). Every AC must map to a test.
3. **2.5 Spec review** — `/spec-review`. Resolve every HIGH in the spec before code (non-trivial specs).
4. **Branch** from latest `main`: `feat/SPEC-XXX-<slug>`.
5. **Implement** — `/implement` (`implementer`). Core stays offline; reuse the a11y libs.
6. **Test** — `/test` (`test-author`). Golden fixtures; `pnpm verify` green.
7. **5.5 Self code review** — `@reviewer` on the branch diff. Resolve every HIGH before push.
8. **PR + hand-off** — changeset if needed; open a PR; **do not merge** — the maintainer reviews/merges.
9. **Log** — `/log` (`log-keeper`). The session isn't complete until the log exists.

Trivial fixes take the fast path (branch → fix → test → PR → one-line log). Match rigor to leverage.
