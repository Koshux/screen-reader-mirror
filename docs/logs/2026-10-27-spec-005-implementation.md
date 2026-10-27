---
date: 2026-10-27
spec: SPEC-005
branch: feat/SPEC-005-mismatch-heuristics
status: complete
---

# Log: SPEC-005, visual-versus-semantic mismatch heuristics

## Decisions taken at the start (operator, 2026-10-27)

1. The NVDA bridge stays in 1.0 scope (Phase C of `docs/project/v1-scope.md`, as PR #65 lists it).
2. No new GitHub issues yet (design intake, documentation site, NVDA bridge). Drafts are in the
   hand-off notes below.
3. The 22 merged remote branches were deleted, `fix/fidelity-followups` among them. Each pointed
   at the head of a merged PR. `main` and `changeset-release/main` remain.
4. `looks-like-table` does not fire on a `<table>` that Chrome mode reads as layout, nor inside
   it, in either mode: it is a real table element.

PR #65 had already been merged when the session started (main at 34e5ba8).

## What changed & why

Spec first (commit 8c41a42): SPEC-005 was reviewed before SPEC-006 existed, so it gained a
"from SPEC-006" backfill block: `interpret` takes `browser`; every role-based condition reads the
role in the chosen mode through the one `RoleContext`; the style cache is `ctx.styleOf`; the
layout-table decision above; AC-15's signal by mode; row 8's effect on AC-8 and AC-14; AC-16
re-derived per mode. A delta Stage 2.5 review of the backfilled ACs found one HIGH, in my own
backfill: excluding every `<label>` run from `nearby-text` would have hidden the commonest real
case, `<label>Email</label><input>` with no `for`. Now only a label that labels another control
is excluded.

Code:

- `packages/core/src/mismatch.ts` (new): the four heuristics as functions of one element: heading
  signals (size and weight against the parent, the bold rule with the next run), table signals
  (grid, flex or grid rows, `display: table`; text cells; rows, borders, tints, header row), click
  signals (attributes, `tabindex`, a pointer cursor the parent lacks; scrolling and
  contains-a-widget exclusions), and the field signal (read from the name the walk built).
- `packages/core/src/linearize.ts`: `interpret(root, options)` wraps the style source in a
  per-call cache and runs the existing walk with the heuristics on. `linearize()` is now
  `walkTree(..., false).out`, unchanged in output. The walk tracks text in pieces so that, on
  leaving an element, it knows its `[at, end)` range and whether its text is exactly one run;
  heading lines are settled after the walk, since the bold rule needs the next node.
- `roles.ts`: `cellPresentation()` taken out of `isLayoutTable` and shared; `hasLabelWithText()`.
- `types.ts`, `index.ts`: `Interpretation`, `Mismatch`, `MismatchSignal`, `interpret`.
- `scripts/ax-compare.mjs`: runs `srm.interpret` and prints the mode's mismatches after the diff.
- ADR-0004: `Interpretation` and `Mismatch` join the contract; new kinds and signals are minors;
  threshold tuning is a patch. README: a "Mismatches" section with each signal, its false alarms,
  and what cannot be seen. `minor` changeset.
- `test/dist-smoke.test.ts`: the export list gains `interpret`; the size guard goes from 32 KiB to
  64 KiB (the bundle is 47.7 KiB unminified; esbuild already strips comments). Its purpose,
  catching a bundled dependency, still holds. Flagged here because it is a guard.

## Tests

- `pnpm verify`: typecheck, lint, build, vitest green. 183 passed and 4 expected-fail pins
  (unchanged), 12 files.
- New `test/mismatches.test.ts` (one or more fixtures per AC, from
  `test/fixtures/probes/mismatches.html`): AC-1 `interpret(...).nodes` equals `linearize` on every
  case of every probe page in both modes (over 100 cases), and the `RangeError`; AC-2 ranges,
  including an empty element (`at` equals `end`) and an inline element whose run starts before
  it; AC-3 one mismatch per chain, nested grids, large header cells of a fake table; AC-4 hidden,
  shadow, and `srcdoc` frame; AC-5 an injected style deciding a heading both ways, a counting
  source called at most once per element, a throwing source; AC-6 to AC-15 each in both modes,
  with the three mode differences pinned (a bold line before `<label for>` text, a `<td onclick>`
  in a layout table, an empty label with a placeholder).
- `test/real-pages.test.ts`: in both modes, `interpret` gives the golden nodes and exactly the
  AC-16 mismatches. Both goldens per page are unchanged.

### Chrome oracle (AC-17), `pnpm ax:compare`, both modes

Comparison with Chrome's tree in Chrome mode: issue tracker 0, service form 0, reference
article 0, component demo 0 differing lines (unchanged). Probe page `mismatches.html`: 2
differing lines, Chrome's `link` for `<a onclick>` with no `href` (follow-up 1).

Every mismatch on the real pages, judged:

| Page | Mode | Mismatch | Verdict |
|---|---|---|---|
| issue tracker | both | `clickable-not-button` on `div.avatar` (`onclick`), covering an `img` with no `alt` | Right: a menu trigger a screen reader hears as an unnamed image, not a button |
| service form | both | `field-without-label` on "Vehicle registration" (`placeholder`) | Right: the placeholder is the only label and disappears as the user types |
| service form | both | `clickable-not-button` on `div.button` "Continue" (`onclick`) | Right: the form's main action reads as plain text |
| component demo | both | `clickable-not-button` on the first `div.card` (`onclick`) | Right: the card is clickable as a whole and has no role; the next cards use a link or `role="button"` |
| component demo | Chrome only | `looks-like-heading` on `<strong>Due</strong>` (`font-weight`) | False alarm: a label over its value (`<br>18 Dec`) in a layout table. "Due" is 3 characters and "18 Dec" 6, exactly the bold rule's "twice as long". The default reads the cell as a `cell` named from content, so no run exists there |
| reference article | both | none | Right: nothing on the page fits a heuristic |

Browser default styles add no other mismatch on the real pages beyond the "Due" false alarm.

Probe page in Chrome: every case fires as in the unit tests. The browser-only cases fire with
real styles: a bare `<strong>` line (`font-weight`), a `1.5em` line (`font-size`), and an
`auto-fill` grid narrowed to two tracks (`grid-layout`, `cell-borders`); the `div` with only a
script listener gets no mark, as pinned. (The first run showed the `auto-fill` grid not firing:
its 4 cells fit one row in a wide viewport, which is correct; the case was narrowed so it shows
resolved tracks.)

## Self code review

Stage 5.5 on `git diff origin/main...HEAD`, 2026-10-27.

- HIGH: none.
- MEDIUM, fixed: AC-3's "a fake heading inside a grid's header row is not reported" had no
  fixture that would fail without the rule; added `table-big-header` (24px bold header cells).
- MEDIUM, fixed: §5 says a styled live region with no role of its own can look like a heading;
  the walk ruled out live regions, because their node precedes their text run. The line is now
  the run after the node (`heading-live`; Chrome agrees).
- LOW, kept: `containsWidget` looks at light DOM descendants only, so a card whose only link is in
  its own shadow tree would still be marked.
- LOW, kept: the name library reads style from the element's window through its own hook, as in
  `linearize`, outside the cache and outside AC-5's count (stated in the spec backfill).
- Privacy: no network in core. A mismatch holds a tag, indices, and signal identifiers, never page
  text. The oracle script runs locally.

## State at end of session

Branch `feat/SPEC-005-mismatch-heuristics` from `main` at 34e5ba8, pushed; PR open, awaiting the
operator. No GitHub issues filed.

## Hand-off notes

1. Operator: review the PR. Two choices to confirm:
   - The "Due" false alarm (above). A tightening that removes it without losing the probe's
     cases: the bold rule's next run must start in a new block, not after a `<br>` in the same
     block. A threshold change, so a patch under ADR-0004; not made here.
   - The dist size guard raised to 64 KiB.
   Both answered on 2026-10-28 after the merge: the bold rule was tightened and the guard
   accepted. See `2026-10-28-spec-005-bold-rule.md`.
2. Follow-ups, scheduled by the operator on 2026-10-27 (all four known ones), in this order:
   1. The old em dashes in `packages/core/README.md`: doc-only, after this PR merges (it edits
      the same README).
   2. One engine spec for the fidelity items, since they touch name and role computation (full
      SDLC): the list or `<details>` inside a button read twice; inline-element name spacing
      between Chrome and happy-dom (probe first); and the new Chrome difference found here,
      `<a onclick>` with no `href` exposed as a link (a SPEC-006 inventory row; Chrome mode
      should match, and then `clickable-not-button` would not fire on it there).
   3. The manual Firefox check of the five live-region points: needs the operator at Firefox with
      a screen reader; the agent writes the checklist.
   - `docs/project/board.md` and `tasks.md`: marked superseded by v1-scope.md (operator's choice),
     in a separate doc PR.
3. Draft issues, to file on the operator's go-ahead (v1-scope Phase C):
   - **Design intake:** check the site handoff against the design gate's six requirements, update
     the API, output, and settings pages for `interpret()`, mismatches, and the `browser` mode,
     and split the handoff into one spec per surface.
   - **Documentation site:** the twelve docs pages from the handoff, every fact checked against
     the code when built, "Proposed" pills dropped only as features land.
   - **NVDA bridge:** `npx screen-reader-mirror listen`, a pair code, NVDA's speech captured beside
     the mirror and compared row by row, a divergence report. Needs its own journey, spec, and
     threat model; localhost only, user-started, never retaining content. Builds on #8 and #10.
