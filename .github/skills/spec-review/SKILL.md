---
name: spec-review
description: "SDLC Stage 2.5 — review a journey + SPEC against the live codebase before implementation. Correctness/reuse lens + privacy/data-exfiltration threat-model + gap analysis; resolve every HIGH in the spec."
---

# Spec Review (Stage 2.5, Copilot)

Mirror of [`.claude/skills/spec-review/SKILL.md`](../../../.claude/skills/spec-review/SKILL.md) —
follow it verbatim. Summary of the lenses (run all against the **live codebase**, not the spec text alone):

1. **Infrastructure & reuse** — every referenced file/export exists; we extend rather than
   duplicate (esp. don't re-derive name/role logic `dom-accessibility-api`/`aria-query` provide).
2. **Correctness/completeness** — design bugs, missing tests, unhandled a11y edge cases.
3. **Privacy threat-model** — nothing in `core` moves page content off-machine; host-target
   network use is explicit + documented; any telemetry = HIGH.
4. **Gap analysis** — template complete, SDLC fields present, commonly-missed checklist.
5. **Resolution** — fix every HIGH in the spec before implementation; record the pass in the spec header.

Verdict: implementation-ready yes/no (+ blocking HIGHs). Match depth to leverage.
