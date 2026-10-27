---
date: 2026-10-27
spec: n/a
branch: docs/supersede-board-tasks
status: complete
---

# Log: board.md and tasks.md marked superseded

## What changed & why

The operator chose (2026-10-27) to mark `docs/project/board.md` and `docs/project/tasks.md`
superseded by `docs/project/v1-scope.md` rather than rewrite them. Each now opens with a note
saying so. The links that sent readers to them to pick up work now point to v1-scope.md and the
open issues: AGENTS.md, CONTRIBUTING.md, the root README (two links), docs/sdlc/README.md, and the
core and extension READMEs. Links between the old planning files themselves (roadmap, glossary,
launch plan) are left alone, as a record.

## Tests

Doc-only. No code changed, so no tests were run.

## Self code review

Trivial doc-only change, Stage 5.5 not required.

## State at end of session

Branch `docs/supersede-board-tasks` from `main` at 34e5ba8, pushed; PR open, awaiting the
operator. Independent of PR #66.

## Hand-off notes

1. Noticed, not changed: the root README's "Pre-release" note still says 0.1.0 is being cut, and
   `docs/project/roadmap.md` predates the 1.0 scope too. Both could get the same treatment.
