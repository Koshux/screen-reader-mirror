---
name: code-review
description: "SDLC Stage 5.5 — findings-first review of the branch diff BEFORE push. Reviews for correctness bugs, accessibility-computation mistakes, reuse/duplication, test coverage of every acceptance criterion, and any network/telemetry creeping into core. Resolve every HIGH before opening a PR."
argument-hint: "optional extra focus areas"
---

# Code Review (Stage 5.5)

Self-review of `git diff origin/main...HEAD` before push. The goal is that the human operator
review (Stage 6) finds design/UX observations, not avoidable code bugs.

## When this runs
- **Mandatory** before every push of a feature branch. A push without a recorded pass is a
  process error. **Skip rule:** trivial single-line/doc-only changes.

## How to run
1. `git diff origin/main...HEAD` (and read the changed files in full for context).
2. Re-read the spec's acceptance criteria and the rules relevant to the diff
   ([accessibility](../../rules/accessibility.md), [infrastructure](../../rules/infrastructure.md),
   [testing](../../rules/testing.md), [distribution](../../rules/distribution.md)).
3. Produce findings, ordered HIGH → LOW.

## What to look for
- **Correctness:** logic bugs, off-by-one in reading order, mishandled edge cases (shadow DOM,
  iframes, `aria-hidden`, empty vs missing `alt`, circular `aria-labelledby`).
- **Accessibility accuracy:** is the accessible-name/role computation actually spec-compliant?
  Did we hand-roll something `dom-accessibility-api`/`aria-query` already does correctly?
- **Privacy:** any `fetch`/`XMLHttpRequest`/`WebSocket`/`sendBeacon`/telemetry added to core
  (or undocumented network use in a host target) = automatic HIGH.
- **Tests:** does every acceptance criterion have a passing test? Are there golden fixtures for
  new behaviour? Any AC untested = HIGH.
- **Reuse / simplification:** duplication of existing helpers, needlessly broad changes,
  dead code, public-API surface bloat.
- **Release hygiene:** changeset present for published-code changes; `exports`/`sideEffects`
  and CDN-consumability intact; semver bump matches the change.

## Resolution
- **HIGH:** fix on the same branch before push, or file a follow-up task and note it. No push
  with an open HIGH.
- **MEDIUM/LOW:** fix when cheap; otherwise record in the log under "Known follow-ups".
- Record the pass in the implementation log under `## Self code review` (date + key fixes).

## Output
```
# Code Review — <branch>
## HIGH / ## MEDIUM / ## LOW
### N. <title>   [file.ts](path#Lline)
<what's wrong, why it matters, the fix>
## Verdict — ready to push: yes / no (+ blocking HIGHs)
```

Extra focus areas (optional):

$ARGUMENTS
