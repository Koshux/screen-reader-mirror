---
id: SPEC-006
title: The W3C specifications by default, and a browser option to match Chrome
status: implemented # feat/SPEC-006-browser-matching
journeys: [JNY-006]
target: core
created: 2026-10-26
---

# SPEC-006: The W3C specifications by default, and a browser option to match Chrome

> ADR-0005. The maintainer decided on 2026-10-26 that the engine follows the W3C specifications
> first, always, and that matching a tool is an option for interoperability and integration. This
> spec lists every place where the engine and Chrome part ways, sets the default to the
> specification in each, and adds `browser: "chrome"` to read the page as Chrome does.

> **Self-review applied (2026-10-26, Stage 2.5).** Reviewed against `main` at 6f1421b plus
> PR #60. Corrections folded in:
> 1. HIGH: the inventory missed two Chrome-based defaults. Row 8: label text for a checkbox or
>    radio is hidden "because Chrome drops it from the tree" (`linearize.ts`). Row 9: SVG-AAM 1.0
>    maps an `svg` root to `graphics-document`; the engine, like Chrome, uses an image.
>    `aria-query` 5.3 knows `graphics-document` (not children-presentational), so row 9 changes
>    what is walked, not only a role name; the implementation probes it first.
> 2. MEDIUM: AC-4 now asks for 0 differing lines in Chrome mode on the real pages (the `term`
>    rule was the last pin) and for a person's review of the default goldens' diff.
> 3. LOW: the scope-less `<th>` rule matches Chromium's `DecideRoleFromSiblings`; it is compared
>    with HTML's auto-scope algorithm during implementation (§3).
> 4. Reuse confirmed: `isLayoutTable`, the `rowgroup` and `row` overrides in `roles.ts`, the
>    `styleOf` parameter from PR #60, and the Chrome name and label rules in commit e6aebab. No
>    library offers browser modes; `dom-accessibility-api` follows AccName in both.

> **Backfill (2026-10-27, from the implementation).** Facts that changed once the probes ran:
> 1. Row 9 was wrong in both columns. SVG-AAM 1.0 (5.2.55) maps every `svg` element to
>    `graphics-document`, with no inclusion condition, so an unnamed `svg` does not stay out of
>    the default tree: it is an empty `graphics-document`. Chrome is not "an image, children not
>    read": an `svg` root with any element child is `SvgRoot` with its content read, and only one
>    with nothing readable inside becomes `image`; an unnamed one with no element children is left
>    out (Chromium `ax_object.cc`, `ax_node_object.cc`). The engine names Chrome's `SvgRoot`
>    `graphics-document` in both modes. For the maintainer: following the text means an icon
>    `svg` that is not `aria-hidden` adds an empty node in the default reading.
> 2. Row 10 added. HTML's table model (a column header when no data cell shares its rows, a row
>    header when none shares its columns, otherwise HTML-AAM's `cell`) differs from Chromium's
>    `DecideRoleFromSiblings`, and the engine's earlier rule matched neither. An empty corner
>    `<td>` makes every scope-less header in that table a `cell` under HTML's rule.
> 3. Row 11 added. Chrome reads text inside SVG `defs` and `symbol`; SVG-AAM 4.1.1 says nothing
>    there is exposed.
> 4. Same in both modes, not rows: SVG shapes, `g`, `use`, and `image` with a name are nodes
>    (SVG-AAM 4.1.2, Chrome agrees); SVG `<text>` is its own line; an SVG element is named from its
>    `title` child, which `dom-accessibility-api` does only for `svg`; a `<br>` separates words in
>    a name (the library joined them, because Chrome reports `<br>` as inline; this showed once
>    row 1 made the component demo's layout table a table).
> 5. Row 3's Chrome column: Chrome names a row from content inside a grid or treegrid, which the
>    Chrome mode applies.

> **Backfill (2026-10-28, from SPEC-007).** Two rows added, both checked in Chrome's tree and
> Chromium's source on 2026-10-28:
>
> | # | Case | W3C (default) | Chrome (`browser: "chrome"`) | Today's default |
> |---|---|---|---|---|
> | 12 | `<a>` (or SVG `a`) without `href` that has an `onclick`, `onmousedown`, or `onmouseup` attribute | no role: HTML-AAM maps it to `generic` | `link`, named from its content (Chromium `NativeRoleIgnoringAria`: an href or a click, mousedown, mouseup, or DOMActivate listener; the engine sees the attributes only) | W3C |
> | 13 | Spaces between the parts of a name from content | AccName 1.2 has none (AccName #225 open); `dom-accessibility-api`'s rule, a space around a child that is not `display: inline` | also a space around an atomic inline (not an `img` with `alt=""`), a control, or a child named by an attribute (Chromium `ShouldInsertSpaceBetweenObjectsIfNeeded`) | W3C |
>
> The double read of a list or `<details>` inside a button is not a row: SPEC-007 fixes it in
> both modes.

## 1. Summary

The engine was calibrated against Chrome, and in several places its default follows Chrome
rather than the specifications. This spec moves those defaults to the W3C texts (AccName 1.2,
HTML-AAM, WAI-ARIA 1.2, ARIA in HTML) and adds one option, `browser`, whose value `"chrome"`
applies Chrome's differences, each read from Chromium's source and checked against its tree on
2026-10-26. The default changes for layout tables, `tbody`, row names, toggle label text, and `svg` roots; the Chrome mode keeps
today's reading for those and adds the differences PR #60 pinned. Markup where the two agree reads
the same in both modes.

## 2. Acceptance criteria

- **AC-1** `LinearizeOptions` gains `browser?: "chrome"`. Omitted, the reading follows the W3C
  specifications as listed in §3. Any other value throws a `RangeError` that names the accepted
  values, so a misspelt mode is not taken for the default.
- **AC-2** Each row of the inventory in §3 has a fixture in both modes: the default gives the
  "W3C" column, `browser: "chrome"` gives the "Chrome" column.
- **AC-3** Markup outside the inventory reads the same in both modes: every probe page from
  SPEC-003, SPEC-004, and the fidelity follow-ups gives identical output in both modes except on
  inventory rows.
- **AC-4** Each real page has two goldens: `<name>.expected.json` (default) and
  `<name>.chrome.json` (Chrome mode). `pnpm ax:compare` runs the engine in Chrome mode and
  compares it with Chrome; `--write-expected` writes both goldens. In Chrome mode the four real
  pages show 0 differing lines: the only pins left today are the `term` rule (row 7). The default
  goldens change only on inventory rows, and a person reviews that diff, since Chrome no longer
  vouches for them; the review is recorded in the log.
- **AC-5** The option reaches every rule through one value built once per call; role resolution,
  names, and the walk read it from there (§3, design).
- **AC-6** The README states that the default follows the W3C specifications, names them, lists
  the Chrome differences, and says which mode a host shows. `docs/project/v1-scope.md` "Done means"
  says real pages agree with Chrome in Chrome mode.
- **AC-7** `interpret()` from SPEC-005 accepts the same option, whichever spec is implemented
  first.

## 3. Design

### Inventory: where the W3C texts and Chrome differ

Each row was checked in Chrome on 2026-10-26 (`scripts/ax-tree.mjs`, `pnpm ax:compare`) and,
where named, in Chromium's source (`third_party/blink/renderer/modules/accessibility/`).

| # | Case | W3C (default) | Chrome (`browser: "chrome"`) | Today's default |
|---|---|---|---|---|
| 1 | `<table>` with no header cells, caption, or sections and one row or one column, or 2 to 19 rows without borders or tinted cells | `table`, `row`, `cell`: HTML-AAM maps `table` to `table` and does not distinguish layout tables | layout table: no table roles, content only (`isLayoutTable`) | Chrome |
| 2 | `<tbody>` (the parser adds one to every table) | `rowgroup`: HTML-AAM | not exposed; rows hang off the table | Chrome |
| 3 | A row's name | from its content: WAI-ARIA 1.2 `row` is name from contents and author | author only; Chromium names rows from content only inside a grid | Chrome |
| 4 | A name from content over a descendant with a role that does not take its name from content (`<button>Save <span role="status">3</span></button>`) | "Save 3": AccName 1.2 recursive name from content | "Save": content of status, alert, log, note, timer, marquee, group (not `details` or `address`), article, figure, blockquote, table, landmarks, and composites left out; their author name kept (Chromium `SupportsNameFromContents(recursive=true)`) | W3C (PR #60) |
| 5 | A field whose associated label is empty | title, then placeholder: HTML-AAM 4.1 | no name | W3C (PR #60) |
| 6 | `header` or `footer` inside `role="region"` | `sectionheader`, `sectionfooter`: ARIA in HTML lists region | `banner`, `contentinfo` | W3C (PR #60) |
| 7 | A `term` (`<dt>`) | no name: WAI-ARIA 1.2 `term` is name from author | named from content: Chromium special-cases `term` | W3C |
| 8 | The text of a `<label>` for a checkbox or radio | read as text after the control: no W3C text removes it from the tree | not in the tree; read only as the control's name | Chrome |
| 9 | An `svg` root | `graphics-document`, a container whose content is read (SVG-AAM 1.0 5.2.55), named or not | `graphics-document` (Chrome's `SvgRoot`) when something inside is readable; `img` when nothing is; left out when unnamed with no element children (backfill 1) | neither |
| 10 | A `<th>` without `scope` | HTML's table model: column header, row header, or `cell` (HTML-AAM 3.5.134) | Chromium `DecideRoleFromSiblings` | neither (backfill 2) |
| 11 | Text inside SVG `defs` or `symbol` | not read: SVG-AAM 4.1.1 | read as text | W3C (backfill 3) |

Rows 8 and 9 were added by the Stage 2.5 review. Row 8 brings back a double read in the default
(the checkbox name, then the same words as text); that is what the specifications give, and the
maintainer confirms it at review. Row 9 changes more than a role: as `graphics-document` the `svg`
is walked, so SVG `<text>` content is read and named shapes become nodes under SVG-AAM's
inclusion rules. The implementation probes it before writing the rule; an unnamed, unfocusable
`svg` stays out of the tree in both modes, as today. (Superseded by backfill 1: neither SVG-AAM
nor Chrome leaves it out.)

Not differences, the same in both modes: `sectionheader` and `sectionfooter` inside main or
sectioning content, sectioning roots not scoping (HTML-AAM, ARIA in HTML, and Chrome agree since
PR #60); every `<form>` is a `form` (HTML-AAM maps it to `form` and leaves the landmark to
assistive technology); text runs by computed display; the presentation rules for `role=none`.

No W3C role exists for `input type=file`, `password`, `date` and the other date and time types,
the first `summary`, or `iframe`. The engine keeps the platform mapping it uses today (button,
textbox, textbox, button, document) in both modes and the README says so (ADR-0005 point 2).

To check during implementation, not yet a row: a `<th>` with no `scope` is a row header when it
starts a row that holds data cells, otherwise a column header. That matches Chromium's
`DecideRoleFromSiblings`; HTML's table model decides it with the auto-scope algorithm instead. The
implementation compares the two on the existing fixtures and adds a row if they differ. (Done:
they differ, and the engine's rule matched neither; row 10, backfill 2.)

Known Chrome behaviour this spec does not model, recorded so it is not mistaken for a gap:
Chrome passes an invalid `aria-live` token through as written (SPEC-004 keeps WAI-ARIA in both
modes, because `LiveRegion` holds only valid values); Chrome drops the whitespace between two
inline-block elements from its tree (an oracle limit, not a reading the engine should copy).

### The option

```ts
export interface LinearizeOptions extends VisibilityOptions {
  getShadowRoot?: (host: Element) => ShadowRoot | null | undefined;
  /**
   * Read the page as this browser does where it differs from the W3C specifications. Omitted,
   * the reading follows the specifications (ADR-0005). Only "chrome" is accepted today.
   */
  browser?: "chrome";
}
```

Additive: a minor under ADR-0004. The default output changes for rows 1 to 3, 8, and 9; that is
interpretation, but it moves every table on every page, so the changeset is a minor with the
five changes listed, not a patch.

### Rules, built once

`rulesFor(options.browser)` in a new `packages/core/src/browser.ts` returns a frozen object, one
field per inventory row:

```ts
interface BrowserRules {
  layoutTables: boolean;           // row 1
  hideTbody: boolean;              // row 2
  rowNamedByAuthorOnly: boolean;   // row 3
  nameFromContentExclusions: boolean; // row 4
  emptyLabelHasNoName: boolean;    // row 5
  regionScopesHeader: boolean;     // row 6 (true for W3C)
  termNamedFromContent: boolean;   // row 7
  hideToggleLabelText: boolean;    // row 8
  svgAsImage: boolean;             // row 9
}
```

It throws the `RangeError` of AC-1. Role resolution today takes `parentOf` and `styleOf` (PR #60);
those and the rules become one `RoleContext` argument, so a rule cannot be dropped on one call
path. `resolveRole` is internal, so this changes no public signature. `accessibleName` takes the
rules for rows 4 and 5.

Row 4's Chrome implementation reports an excluded descendant without an author name as hidden
through `dom-accessibility-api`'s own `getComputedStyle` hook, and is not applied inside an
`aria-labelledby` traversal, where Chrome keeps all content. It was written and checked against
Chrome on the `fix/fidelity-followups` branch (commit e6aebab) and reverted there for the
spec-first default; it returns here behind the rule. Row 5's checks associated labels with
`labels`, ignoring hidden children and treating any `alt`, `aria-label`, `aria-labelledby`, or
`title` inside the label as text.

### Oracle and goldens

`scripts/ax-compare.mjs` runs `srm.linearize(document.body, { browser: "chrome" })` by default and
`--w3c` to show the default reading against Chrome's tree (expected to differ on the inventory
rows). `--write-expected` writes both goldens. `real-pages.test.ts` checks both.

### Interaction with other specs

- SPEC-005 (mismatch heuristics): its table heuristic uses Chrome's data-table test as a threshold
  for "looks like a table", whatever the mode; that is a heuristic about appearance, not a role.
  AC-7 covers the option on `interpret()`.
- #10 (verbosity profiles): phrasing, not tree computation. A profile does not pick a browser;
  a host may pair them (an NVDA-on-Chrome view).
- Hosts: the design brief needs a visible mode label; that is for the design gate.

## 4. File-level changes

| File | Change |
|---|---|
| `packages/core/src/browser.ts` | new: `BrowserRules`, `rulesFor()` |
| `packages/core/src/roles.ts` | `RoleContext`; rows 1, 2, 3, 6, 7 read from the rules; row 4 and 5 helpers |
| `packages/core/src/linearize.ts` | build the rules once; pass the context; row 5 in `buildNode` |
| `packages/core/src/types.ts` or `linearize.ts` | `browser` option and its documentation |
| `packages/core/test/browser-modes.test.ts` | both modes for each inventory row; AC-1, AC-3 |
| `packages/core/test/fixtures/probes/browser-modes.html` | the inventory cases |
| `packages/core/src/linearize.test.ts` | table tests state their mode |
| `packages/core/test/real-pages.test.ts`, `fixtures/pages/*.chrome.json` | two goldens |
| `scripts/ax-compare.mjs` | Chrome mode by default, `--w3c`, both goldens |
| `packages/core/README.md`, `docs/project/v1-scope.md` | AC-6 |
| `.changeset/*.md` | `minor`, listing the five default changes |

## 5. Edge cases

- **Shadow DOM / slots, frames:** the rules ride on the same context through the composed walk
  and into frames.
- **Cross-origin iframes:** unchanged.
- **`aria-hidden` / `display:none`:** unchanged; row 4's hook only adds hidden reports, it never
  reveals.
- **Empty `alt` vs missing `alt`:** unchanged in both modes.
- **Circular `aria-labelledby`:** row 4 is off inside labelledby traversal, so the library's cycle
  handling is untouched.
- **Live regions:** unchanged; an invalid token follows WAI-ARIA in both modes (§3).
- **Verbosity profiles:** independent (§3).
- **Explicit `role="presentation"` on a table:** presentational in both modes; only the implicit
  layout heuristic is Chrome-only.

## 6. Privacy check (mandatory)

No network. The option selects rules bundled in the engine; nothing is fetched or detected. The
engine does not sniff the browser it runs in: Chrome mode is chosen by the caller, so running in
Chrome does not change the default.

## 7. Task breakdown

Branch `feat/SPEC-006-browser-matching` from `main` after PR #60 has merged.

- [x] `browser.ts`, the option type, the `RangeError`.
- [x] `RoleContext` in `roles.ts` and `linearize.ts`; rows 1, 2, 3, 6, 7, 8.
- [x] Rows 4 and 5 behind the rules (from commit e6aebab).
- [x] Row 9: probe SVG roots, `<text>`, and named shapes in Chrome, then the rule.
- [x] Compare the scope-less `<th>` rule with HTML's auto-scope algorithm; add a row if needed.
- [x] Probe page and `browser-modes.test.ts`; existing table tests state their mode.
- [x] Oracle: Chrome mode, `--w3c`, both goldens; regenerate and review the diffs (rows 1 to 3 in
      the default goldens only, plus rows 8 and 9).
- [x] README, v1-scope, `minor` changeset, `pnpm verify`, log.

## 8. Test plan

| AC | Test | Layer | File |
|---|---|---|---|
| AC-1 | default call, `browser: "chrome"`, and `browser: "firefox"` (throws `RangeError`) | unit | `packages/core/test/browser-modes.test.ts` |
| AC-2 | rows 1 to 9, each in both modes, from the probe page | fixture | same, `fixtures/probes/browser-modes.html` |
| AC-3 | every SPEC-003, SPEC-004, and fidelity probe case gives equal output in both modes outside the inventory rows | fixture | same |
| AC-4 | both goldens per real page; Chrome-mode comparison with Chrome at 0 differing lines; default-golden diff reviewed and logged | fixture + oracle | `real-pages.test.ts`, `scripts/ax-compare.mjs` |
| AC-5 | a table inside a shadow root and inside a frame follows the mode | fixture | `browser-modes.test.ts` |
| AC-6 | README and v1-scope text | review | docs |
| AC-7 | `interpret(root, { browser: "chrome" })` equals `linearize` in Chrome mode | fixture | `mismatches.test.ts` (with SPEC-005) |

## 9. Risks & rollback

- **Risk:** consumers on 0.x see every table change. The changeset lists the five changes and
  how to keep today's reading (`browser: "chrome"`).
- **Risk:** the inventory misses a difference. The oracle in Chrome mode on real pages is the
  check; a new difference becomes a new row and a new rule.
- **Risk:** Chrome changes. The Chrome column is dated and tied to the oracle run; a change is a
  patch to the Chrome rules.
- **Rollback:** the option is additive. Reverting the default to today's means setting rules 1 to 3, 8,
  and 9 to their Chrome values for the default.

## 10. Non-goals

- Firefox and Safari modes. They need their own oracle first.
- Per-rule switches (ADR-0005 alternatives).
- Detecting the browser the engine runs in.
- Phrasing (#10).
