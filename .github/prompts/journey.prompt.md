---
description: "SDLC Stage 1 — capture a user journey as docs/journeys/JNY-XXX-*.md. No implementation detail."
mode: agent
---

You are starting **Stage 1** of the SDLC: a user journey.

1. Read [AGENTS.md](../../AGENTS.md) and [docs/journeys/_TEMPLATE.md](../../docs/journeys/_TEMPLATE.md).
2. List `docs/journeys/` and pick the next free `JNY-XXX` ID.
3. Interview for persona, trigger, goal, success criteria, failure modes, and out-of-scope.
   Persona must be concrete (e.g. "a sighted dev shipping an EC form, never used a screen reader").
4. **No implementation detail** — no file/component/API/library names. That's the spec's job.
5. Write `docs/journeys/JNY-XXX-<slug>.md` with `status: draft`, `related-specs: []`.

Prefer delegating to the `journey-author` agent. End with:
`Next: get the journey approved, then run /spec.`
