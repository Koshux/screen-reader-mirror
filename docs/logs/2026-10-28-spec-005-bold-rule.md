---
date: 2026-10-28
spec: SPEC-005
branch: docs/supersede-board-tasks
status: complete
---

# Log: SPEC-005 bold rule tightened after a `<br>`

## What changed & why

PR #66 (SPEC-005) merged with two choices open. The operator answered them on 2026-10-28 and
asked for the change to go into PR #67:

1. **The "Due" false alarm: fix it.** In Chrome mode, the component demo's
   `<strong>Due</strong><br>18 Dec` fired `looks-like-heading` (`font-weight`), because "18 Dec"
   is twice as long as "Due". The bold-only rule (AC-8) now needs the longer text to start in a
   new block. When the line is ended by a `<br>` and the next text is in the same block, the rule
   does not fire. The size rules (AC-6, AC-7) are unchanged and still fire there.
2. **The dist size guard at 64 KiB: accepted.** No change.

Code: the walk records each text run ended by a `<br>` (`MismatchWalk.brEnded`), and
`finishMismatches` gives the bold rule no next run after one. `linearize()` output is unchanged.

Known cost: a bold-only line over its paragraph split by a `<br>` (`<b>Opening hours</b><br>
Monday to Friday, 9 to 5`) is no longer flagged. A larger font still is.

Docs: SPEC-005 AC-8, the backfill notes (points 2 and 4 marked resolved), and the test plan row.
A `patch` changeset: a threshold change under ADR-0004.

## Tests

- New probe case `heading-bold-br` (a bold "Due" over "18 December" after a `<br>`), asserted
  quiet in both modes in the AC-8 test. It fails without the fix.
- `test/mismatches.test.ts` and `test/real-pages.test.ts`: 39 passed. One cold first run had a
  single failure that did not reproduce in four later runs (the cold run took 23 s against about
  2 s), most likely a timeout.
- `pnpm ax:compare` on the component demo: 0 differing lines in Chrome mode, and its mismatches
  in Chrome mode are now the one clickable card. On the probe page: the same 2 known differing
  lines (Chrome's `link` for `<a onclick>`), every other heading case still fires, `heading-bold-br`
  does not.
- `pnpm verify` green: 183 passed, 4 expected-fail pins unchanged.

## Self code review

Stage 5.5 on the change, 2026-10-28. Small diff (one set, two lines in the walk, one condition).
Checked: a `<br>` with nothing pending marks no run, so a line ended by a block and then a `<br>`
keeps the rule; a frame or shadow tree uses the same walk; nothing new leaves the machine. No
findings.

## State at end of session

On `docs/supersede-board-tasks` (PR #67) with `main` merged in after #66. Awaiting the operator.
