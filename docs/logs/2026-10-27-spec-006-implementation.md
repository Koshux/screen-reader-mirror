---
date: 2026-10-27
spec: SPEC-006
branch: feat/SPEC-006-browser-matching
status: complete
---

# Log: SPEC-006, W3C specifications by default and a Chrome mode

## What changed & why

ADR-0005: the default reading follows the W3C specifications, and matching Chrome is an option.
This implements SPEC-006.

- `packages/core/src/browser.ts`: `BrowserRules`, one field per inventory row, and `rulesFor()`,
  which returns the W3C rules when `browser` is left out, the Chrome rules for `"chrome"`, and
  throws a `RangeError` for anything else.
- `LinearizeOptions.browser?: "chrome"`. The rules are built once per call and travel in one
  `RoleContext` (`parentOf`, `styleOf`, `rules`, and a per-call table-grid cache) through role
  resolution, names, and the walk. `resolveRole(el, ctx)` replaces the positional
  `parentOf`/`styleOf` arguments; it is internal.
- Rows 4 and 5 come back from commit e6aebab behind the rules: the name-from-content exclusions
  through `dom-accessibility-api`'s style hook, and the empty-label rule. Row 4's list gains
  `graphics-document` (Chrome's `SvgRoot`) and SVG groups, which Chromium's
  `SupportsNameFromContents` also counts.

What the probes changed in the spec (backfilled in SPEC-006, header block):

1. **Row 9 was wrong in both columns.** SVG-AAM 5.2.55 maps every `svg` to `graphics-document`
   with no condition, so an unnamed `svg` is an empty `graphics-document` by default, not left
   out. Chrome is not "image, children not read": an `svg` root with an element child is
   `SvgRoot` with its content read, it becomes `image` only when nothing inside is readable, and
   an unnamed one with no element children is left out. Read from `ax_object.cc` and
   `ax_node_object.cc` and checked against Chrome's tree.
2. **Row 10 added**, scope-less `<th>`. HTML's table model (column header when no data cell
   shares its rows, row header when none shares its columns, otherwise HTML-AAM 3.5.134's `cell`)
   differs from Chromium's `DecideRoleFromSiblings`. The engine's earlier rule ("first cell of a
   row with data cells") matched neither. Both are now implemented, one per mode.
3. **Row 11 added.** Chrome reads text inside SVG `defs` and `symbol`; SVG-AAM 4.1.1 says
   nothing there is exposed.
4. **Both modes:** named SVG shapes, `g`, `use`, and `image` are nodes (SVG-AAM 4.1.2; Chrome
   agrees), SVG `<text>` is its own line, an SVG element is named from its `title` child (the name
   library does this only for `svg`), and a `<br>` separates the words on either side of it in a
   name. The last one surfaced because row 1 made the component demo's layout table a table: in
   Chrome the library read `<strong>Owner</strong><br>priya` as "Ownerpriya", because Chrome
   reports `<br>` as inline and the library adds spaces only around non-inline elements, while
   happy-dom gave "Owner priya". The `<br>` now reads as a block through the library's own hook.
5. Row 3's Chrome column: Chrome names a row from content inside a grid or treegrid; the Chrome
   mode applies that.

Oracle: `scripts/ax-compare.mjs` runs Chrome mode by default, `--w3c` for the default, and
`--write-expected` writes `<name>.expected.json` (default) and `<name>.chrome.json` (Chrome mode).
`SvgRoot` maps to `graphics-document`.

Docs: README section "W3C specifications by default, Chrome as an option" with the eleven
differences and a note that hosts should show the mode; `docs/project/v1-scope.md` "Done means";
a `minor` changeset listing the default changes.

## Tests

- `pnpm verify`: typecheck, lint, build, vitest green. 153 passed and 4 expected-fail pins
  (unchanged), 11 files.
- New `test/browser-modes.test.ts`: AC-1 (default, `"chrome"`, and a `RangeError` for
  `"firefox"`, `"Chrome"`, `""`, `null`, `1`), each of the eleven rows in both modes (AC-2), every
  SPEC-003, SPEC-004, and fidelity probe case equal in both modes apart from the inventory cases
  (AC-3, 29 cases), and a table in a shadow root and in a frame following the mode (AC-5). Probe
  page `test/fixtures/probes/browser-modes.html`.
- Changed: table, label, and svg tests in `linearize.test.ts`, `shadow-dom.test.ts`, and
  `fidelity-followups.test.ts` now state their mode; most assert both.
- Before the default changed, the whole suite was run with the Chrome rules as the default: the
  only failures were rows 4 to 7, 9, and 10, so Chrome mode keeps today's reading everywhere else.
- Chrome oracle, `pnpm ax:compare`, Chrome mode:
  - Real pages: component demo 0, issue tracker 0, reference article 0, service form 0 (the
    `term` pins are gone). AC-4.
  - `probes/browser-modes.html`: 0.
  - Earlier probes: fidelity follow-ups 4 (was 28; left: the list and `<details>` read twice
    inside a button, and the inline-block space, both known), web components 4, frames 0,
    cross-origin 1, live regions 5 (all unchanged, all pinned before).
- The Chrome goldens equal the old goldens apart from the five `term` names.

## Default goldens: diff for a person to review (AC-4)

Chrome no longer vouches for `<name>.expected.json`, so the operator reviews this diff. Every
change is on an inventory row:

- **component demo** (72 to 76 nodes): the "Status" layout table is a table, with a rowgroup,
  two rows named "Owner priya Due 18 Dec" and "Progress 40 Priority Priority", and cells (row 1);
  the metrics table gains its `tbody` rowgroup and row names (rows 2, 3); the "Autosave" switch's
  label text is read as text after it (row 8).
- **issue tracker** (91 to 95): the three checklist labels are read as text after their
  checkboxes (row 8); the token table gains its `tbody` rowgroup and row names (rows 2, 3).
- **reference article** (99 to 105): the units table gains its `tbody` rowgroup and row names;
  the "Browser support" layout table is a table with three named rows (rows 1 to 3).
- **service form** (77 to 81): the "Weekdays", "Weekends", "Yes", and "No" label texts are read
  after their controls (row 8).

Review status: **awaiting the operator**. Not reviewed by a person yet.

## Self code review

Stage 5.5 on `git diff origin/main...HEAD`, 2026-10-27.

- HIGH: none. MEDIUM: none.
- Added coverage after a probe: an icon `svg` inside a button and a heading (Chrome mode matches
  Chrome; the default gives `graphics-document`).
- LOW, fixed: the Chrome empty-label check read hidden label content without the caller's
  `getComputedStyle` option; it now uses the context's style source. LOW, fixed: the comment on
  the `term` name says a term inside an ancestor named from content stays unnamed.
- LOW, kept: `BrowserMode` is not exported from the package index; the option's type appears
  inline in the declarations.
- Privacy: no network in core. The new CDP use is in the local oracle script only.

## State at end of session

Branch `feat/SPEC-006-browser-matching` from `main` at f988e53, pushed; PR open, awaiting the
operator. PR #62 (Version Packages, 0.3.1) was merged by the operator afterwards; `main` was
merged into this branch to bring it up to date (no conflicts; the release only touched the
version, the CHANGELOG, and the consumed `fidelity-followups` changeset).

## Hand-off notes

1. Operator: review the default-golden diff above and confirm two choices that follow the texts
   but read differently from today:
   - Row 9: an icon `svg` that is not `aria-hidden` adds an empty `graphics-document` node in the
     default reading (SVG-AAM maps every `svg` root). The alternative, leaving an unnamed `svg`
     with nothing readable out of the default, is a one-line change in `svgRole`, but it is not
     what SVG-AAM says.
   - Row 10: an empty corner `<td>` makes every scope-less header in that table a plain `cell` by
     default, as HTML's table model says. An empty `<th>` corner keeps them headers.
2. Next: SPEC-005. Its backfill block lists what changed since review; AC-7 of SPEC-006 adds the
   option to `interpret()`. SPEC-005's table heuristic uses Chrome's data-table test as a
   threshold whatever the mode, and `isLayoutTable` is still in `roles.ts` for it.
3. The remote branch `fix/fidelity-followups` (commit e6aebab) can be deleted once this merges;
   its rules are now behind `browser: "chrome"`.
4. Follow-ups, not acted on: the `<br>` finding suggests the name library may also differ between
   Chrome and happy-dom around inline elements that have no browser default style in happy-dom;
   the Firefox checks; hosts must show which mode they display (design gate).
