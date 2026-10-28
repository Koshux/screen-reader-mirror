---
date: 2026-10-28
spec: n/a # doc-only fast path; checks SPEC-004 by hand
branch: docs/firefox-live-region-checklist
status: complete
---

# Log: Firefox live-region checklist

## What changed & why

`docs/manual-checks/firefox-live-regions.md` and its companion page
`firefox-live-regions.html`: a by-hand check of five live-region points in Firefox with NVDA,
the last open follow-up of the SPEC-005 log. The five points were never listed in the repo (the
logs say only "the five live-region points"). The operator approved this reconstruction from
SPEC-004 and JNY-004 on 2026-10-28: invalid `aria-live` tokens, nested regions, a region inside a
sentence, `role="alert"` with `aria-live="polite"`, and `aria-atomic` with `aria-relevant`.

Each point gives the engine's reading (checked against `live.ts` and the SPEC-004 tests), what
WAI-ARIA expects, and blanks for what Firefox exposes and what NVDA speaks. The page is static,
uses no network, and changes each region three seconds after a button press.

## Tests

Doc-only. Not run against the engine; the page was not opened in Firefox by the agent, as the
check needs the operator with a screen reader.

## Self code review

Trivial doc-only change, Stage 5.5 not required.

## State at end of session

Branch `docs/firefox-live-region-checklist` from `main` at b84cc86, pushed; PR open.

## Hand-off notes

1. Operator: run the checklist and fill in the results; a log records them.
2. A point where the engine's reading misleads becomes an issue; phrasing goes to #10.
