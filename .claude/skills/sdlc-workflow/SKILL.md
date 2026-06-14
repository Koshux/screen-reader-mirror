---
name: sdlc-workflow
description: "Drive a feature from idea to merged code through the screen-reader-mirror SDLC: journey → spec → spec-review → implement → test → self-review → PR → log. Use when the user says 'I want to add/change/build X' and there is no existing journey or spec yet. Walks every phase using the docs/ templates and the specialist subagents."
argument-hint: "Describe the feature or change you want to make"
---

# SDLC Workflow

End-to-end orchestration of the SDLC defined in [AGENTS.md](../../../AGENTS.md) §3 and
[docs/sdlc/README.md](../../../docs/sdlc/README.md).

## When to use
- Starting a new feature or significant change.
- The user has an *intent* but no journey/spec yet.
- Resuming work where logs show a previous session stopped mid-phase.

## When NOT to use
- Trivial fixes (typo, comment, one-line bug, doc edit) — take the fast path: branch, fix,
  test, PR, one-line log. See [effort-discipline](../../rules/effort-discipline.md).

## Procedure

### 0. Bootstrap
1. Read [AGENTS.md](../../../AGENTS.md) and [docs/sdlc/README.md](../../../docs/sdlc/README.md).
2. Create one todo per phase below.

### 1. Journey
- Delegate to the `journey-author` subagent (or run `/journey`).
- Confirm the journey is `status: approved`. If not approved, stop and ask the operator.

### 2. Spec
- Delegate to the `spec-author` subagent (or run `/spec`).
- Confirm every acceptance criterion has a row in the test plan. If not, loop back.

### 2.5. Spec review (mandatory for non-trivial specs)
- Run the `spec-review` skill on the journey + spec **against the live codebase**.
- Resolve every HIGH finding in the spec before any code. Record the pass in the spec header.

### 3. Branch
- `git fetch origin && git checkout main && git pull && git checkout -b feat/SPEC-XXX-<slug>`.
  Always from latest `main`.

### 4. Implement
- Delegate to the `implementer` subagent. Track progress via the spec's task checkboxes.
- Respect the hard rules: core stays client-side/offline; reuse `dom-accessibility-api` /
  `aria-query` rather than re-deriving.

### 5. Test
- Delegate to the `test-author` subagent (or run `/test`).
- Prefer golden HTML fixtures. Run `pnpm typecheck && pnpm test` (scoped). Do not advance until green.

### 5.5. Self code review (mandatory before push)
- Run the `code-review` skill on `git diff origin/main...HEAD`.
- Resolve every HIGH on the same branch (or file a follow-up task). Record under
  `## Self code review` in the log.

### 6. PR + hand-off
- Add a changeset if published code changed (`pnpm changeset`).
- Open a PR with the template. **Do not merge.** Hand off to the maintainer for operator review.

### 7. Log
- Delegate to the `log-keeper` subagent (or run `/log`). The session is not complete until the
  log exists under `docs/logs/`.

## Output
Return: journey ID + path, spec ID + path (all checkboxes ticked), the two review verdicts,
test summary, changeset status, the branch name, and the log path. Suggested PR title:
`<type>(<scope>): <summary> (SPEC-XXX)`.

## Recovery
If a previous session stopped mid-phase, open the most recent file in `docs/logs/`, read its
**State at end of session** and **Hand-off notes**, then resume from the phase containing the
next unchecked task.
