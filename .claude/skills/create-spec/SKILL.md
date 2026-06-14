---
name: create-spec
description: "Author a SPEC-XXX technical spec from one or more approved journeys. Produces acceptance criteria, file-level changes, public-API/data shapes, edge cases, a task list, and a test plan where every acceptance criterion maps to a test. Use after a journey is approved and before implementation."
argument-hint: "Which JNY-XXX journey(s) should this spec cover?"
---

# Create Spec (SDLC Stage 2)

Produce a single `docs/specs/SPEC-XXX-<slug>.md` derived from approved journeys.

## Procedure
1. Read [AGENTS.md](../../../AGENTS.md) and the referenced journeys under `docs/journeys/`. If
   the user didn't name them, list `docs/journeys/` and ask which to cover.
2. Read [docs/specs/_TEMPLATE.md](../../../docs/specs/_TEMPLATE.md) and use **every** section
   (use `n/a` rather than deleting one).
3. Read the relevant rules: [accessibility](../../rules/accessibility.md),
   [infrastructure](../../rules/infrastructure.md), [testing](../../rules/testing.md).
4. Pick the next free `SPEC-XXX` by listing `docs/specs/`.
5. Draft end-to-end:
   - **Acceptance criteria** are observable and testable (`AC-1`, `AC-2`, …).
   - **Public API / data shapes** — if this changes `core`'s exported surface, show the
     before/after types. A shape change needs an ADR and (at release) a semver bump.
   - **Task breakdown** — small, independently-committable steps the implementer ticks.
   - **Test plan** — every AC maps to a specific test (prefer golden HTML fixtures). No AC
     untested.
   - **Risks & rollback** and **Non-goals** are mandatory.
   - **Privacy check** — confirm the change keeps `core` client-side/offline (or, for a host
     target, document the explicit, user-initiated network use).
6. Patch each referenced journey's `related-specs:` array with the new ID.
7. End with: `Next: run the spec-review skill on SPEC-XXX before implementing.`

## Output
The spec path, the list of AC IDs, and a one-line "ready for spec review" verdict (or the
blocking open questions).
