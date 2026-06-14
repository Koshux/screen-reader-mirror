---
date: YYYY-MM-DD
spec: SPEC-XXX # or n/a for fast-path/trivial
branch: feat/SPEC-XXX-<slug>
status: in-progress # in-progress | complete | abandoned
---

# Log — YYYY-MM-DD — <slug>

> The log is the **what was done**, and the only cross-session recovery mechanism. Never delete
> a log. Record honestly — failed and abandoned attempts are valuable.

## What changed & why

A few sentences grounded in the actual diff (`git diff --stat origin/main...HEAD`).

## Tests

What was run and the result. If anything failed or was skipped, say so explicitly.

## Self code review

Result of the Stage 5.5 `code-review` pass: HIGH findings and how each was resolved (or the
follow-up task filed). "Trivial change, Stage 5.5 not required" is acceptable for fast-path work.

## State at end of session

Where things stand right now — what works, what doesn't, what's half-done.

## Hand-off notes

**The most important field.** What the next person/agent should do next, in order. Any blocker,
any decision pending the operator, any gotcha.
