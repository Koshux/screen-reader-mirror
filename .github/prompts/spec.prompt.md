---
description: "SDLC Stage 2 — turn approved journeys into a SPEC-XXX technical spec with acceptance criteria and a test plan."
mode: agent
---

You are starting **Stage 2**: a technical spec.

1. Read [AGENTS.md](../../AGENTS.md), the referenced journeys under `docs/journeys/`, and
   [docs/specs/_TEMPLATE.md](../../docs/specs/_TEMPLATE.md). If no journey was named, list
   `docs/journeys/` and ask which to cover.
2. Re-read the file-scoped rules in `.github/instructions/` relevant to the change.
3. Pick the next free `SPEC-XXX`. Use **every** template section (`n/a` if not applicable).
4. The **Test plan** maps each acceptance criterion to a specific test (prefer golden HTML
   fixtures). No AC untested. Include **Risks & rollback**, **Non-goals**, and the **Privacy
   check** (core stays offline). If the public `core` API changes, show before/after types and
   note the ADR + semver implication.
5. The **Task breakdown** is the implementer's checklist — each item independently committable.
6. Patch each referenced journey's `related-specs:` array.

Prefer delegating to the `spec-author` agent. End with:
`Next: run /spec-review (Stage 2.5) on SPEC-XXX before implementing.`
