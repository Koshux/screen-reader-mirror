---
date: 2026-10-26
spec: n/a # planning and design-process docs (fast path)
branch: docs/v1-scope-design-gate
status: complete
---

# Log: 1.0 scope, design gate, versioning policy

## What changed & why

The operator decided two things on 2026-10-26: the launch release is 1.0.0, and it ships only when
every capability in the engine and host roadmap is done. He also wants every user-facing surface
designed properly before implementation, with his own design work in Claude Design handed off
into the repo, and with a plain, humble, accessible voice throughout.

- `docs/project/v1-scope.md`: the definition of done for 1.0, as phases A to E (engine fidelity,
  engine value, hosts, extras, launch) with tickets, order, dependencies, and an estimate of 11 to
  12 weeks.
- `docs/design/README.md`: the design-handoff process and folder layout, what a handoff must
  contain, how implementers consume it, how revisions are kept.
- `docs/design/BRIEF.md`: the brief to paste into Claude Design. Product, users, principles,
  hard accessibility requirements for the interface itself, content and tone rules with a
  banned-word list, the node data model with row anatomy, the four surfaces (demo page,
  bookmarklet, extension side panel, CLI output), deliverables, and a yes-or-no acceptance
  checklist.
- `docs/decisions/ADR-0004-versioning-policy-1-0.md`: 1.0.0 as the launch release; semver covers
  the API shape, not the interpretation of a given markup.
- `docs/project/launch-plan.md`: a note that the scope decision supersedes its timeline.

New documents follow the operator's writing rules: no em dashes, no exclamation marks, no filler.

## Tests

Docs only. Checked the new files for em and en dashes.

## Self code review

Docs only; Stage 5.5 not required.

## State at end of session

PR opened. The next engineering work is Phase A of the scope: the fidelity-gaps issue and PR,
then #6, #21, #23, #22. The operator's design work on the demo page and bookmarklet can start from
the brief in parallel.

## Hand-off notes

1. Operator: review and merge; mark ADR-0004 accepted if the scope stands.
2. Operator: paste `docs/design/BRIEF.md` into Claude Design, one surface at a time, and drop the
   exports into `docs/design/handoff/` as described in `docs/design/README.md`.
3. Still pending a go-ahead: creating the fidelity issue, the Discussions categories, and the
   divergence-report template on GitHub.
4. Agent next: Phase A, starting with the fidelity gaps, then real-page fixtures.
