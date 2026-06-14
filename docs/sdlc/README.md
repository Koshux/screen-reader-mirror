# SDLC Playbook

This is how work flows in screen-reader-mirror — for humans and AI agents alike. The goal is
that anyone (including a brand-new contributor or a fresh agent session) can pick up a
well-defined task and ship it through review without skipping steps or guessing.

> One-line version: **Journey → Spec → Spec-review → Branch → Implement → Test → Self-review →
> PR → Operator review → Merge → Log.** Match the ceremony to the size of the change.

## The phases

| # | Phase | Output | Gate |
|---|---|---|---|
| 1 | **Journey** | `docs/journeys/JNY-XXX-*.md` — the *why* | approved by maintainer |
| 2 | **Spec** | `docs/specs/SPEC-XXX-*.md` — the *what* | every AC maps to a test |
| 2.5 | **Spec review** | review folded into the spec | every HIGH resolved (non-trivial) |
| 3 | **Branch** | `feat/SPEC-XXX-<slug>` off latest `main` | — |
| 4 | **Implement** | code under `packages/**` | spec task list ticked |
| 5 | **Test** | tests under `packages/**` | all green; AC coverage |
| 5.5 | **Self code review** | findings resolved on branch | every HIGH resolved (non-trivial) |
| 6 | **Operator review** | approved PR | **human maintainer only** |
| 7 | **Merge + Log** | merge + `docs/logs/YYYY-MM-DD-*.md` | log exists |

### Why two review gates?

- **Stage 2.5 (before code)** catches *design* errors — reinventing something a library already
  does, missing a privacy requirement, an unhandled a11y edge case — before they cost a
  wrong-shape implementation and repeated fix loops.
- **Stage 5.5 (before push)** catches *code* errors so the human review at Stage 6 is about
  judgement and UX, not avoidable bugs.

This mirrors the structure proven in sibling projects, retargeted to this project's reality
(client-side correctness + privacy instead of a server/database).

## The fast path (trivial changes)

Typos, comments, copy, a one-line bug, doc-only edits: skip the journey/spec. Branch, fix, test,
open a small PR, write a one-line log. Don't wrap a trivial change in full ceremony — see
[`.claude/rules/effort-discipline.md`](../../.claude/rules/effort-discipline.md).

## Roles & merge rights

- **Maintainer** ([@Koshux](https://github.com/Koshux)) reviews and merges everything; may
  self-approve their own PRs.
- **Contributors** work on a branch and open a PR that is **blocked until the maintainer
  approves**. No self-merge.

Full detail in [`GOVERNANCE.md`](../../GOVERNANCE.md) (enforced by branch protection + CODEOWNERS).

## Picking up work

1. Find a task on the [board](../project/tasks.md) (or open an issue and get it assigned).
2. Each board task points to (or asks you to create) a journey/spec. Start at the right phase.
3. Use the orchestrator: `/sdlc-workflow` (Claude) or the `sdlc-workflow` skill (Copilot).

## IDs & naming

- Journeys `JNY-XXX`, specs `SPEC-XXX`, ADRs `ADR-XXXX` — next free number.
- Logs are dated: `docs/logs/YYYY-MM-DD-<slug>.md`.
- Branches: `<type>/SPEC-XXX-<slug>` (or `<type>/<issue#>-<slug>` for non-spec work).
- Iteration specs (follow-on to an unmerged spec): `SPEC-XXX<letter>-<slug>` with header
  `Iteration of: SPEC-XXX`.

## Recovery (resuming mid-flight)

Open the most recent file in [`docs/logs/`](../logs/), read **State at end of session** and
**Hand-off notes**, and resume from the phase containing the next unchecked task.
