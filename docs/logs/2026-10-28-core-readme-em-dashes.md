---
date: 2026-10-28
spec: n/a
branch: docs/core-readme-em-dashes
status: complete
---

# Log: em dashes removed from the core README

## What changed & why

Follow-up 1 from the SPEC-005 log, scheduled by the operator on 2026-10-27 to run after #66
merged (both edited `packages/core/README.md`). The seven em dashes in the core README are
replaced with a colon, a comma, or brackets, following the standing "no em dashes" rule. No
meaning changed.

## Tests

Doc-only. No code changed, so no tests were run.

## Self code review

Trivial doc-only change, Stage 5.5 not required.

## State at end of session

Branch `docs/core-readme-em-dashes` from `main` at 521b414 (0.5.0). No changeset: the README is
not code, so npm shows the new text with the next release.

## Hand-off notes

1. Next scheduled follow-up: one engine spec for list or details content read twice inside a
   button, inline name spacing, and Chrome's `link` for `<a onclick>` with no `href`.
