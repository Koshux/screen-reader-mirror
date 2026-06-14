---
name: create-spec
description: "Author a SPEC-XXX technical spec from approved journeys: acceptance criteria, file changes, public-API shapes, task list, and a test plan mapping every AC to a test."
---

# Create Spec (Stage 2, Copilot)

Mirror of [`.claude/skills/create-spec/SKILL.md`](../../../.claude/skills/create-spec/SKILL.md).

1. Read [AGENTS.md](../../../AGENTS.md), the referenced journeys, and
   [docs/specs/_TEMPLATE.md](../../../docs/specs/_TEMPLATE.md).
2. Pick the next `SPEC-XXX`. Use every section. Acceptance criteria are observable/testable.
3. If the `core` public API changes, show before/after types (ADR + semver implication).
4. Task breakdown = small commits. Test plan = each AC → a test (prefer golden HTML fixtures).
5. Mandatory: Risks & rollback, Non-goals, Privacy check. Patch journeys' `related-specs:`.
6. End with: `Next: run /spec-review on SPEC-XXX before implementing.`
