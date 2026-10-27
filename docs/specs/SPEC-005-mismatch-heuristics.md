---
id: SPEC-005
title: Visual-versus-semantic mismatch heuristics
status: implemented # feat/SPEC-005-mismatch-heuristics
journeys: [JNY-005]
target: core
created: 2026-10-26
---

# SPEC-005: Visual-versus-semantic mismatch heuristics

> Issue #11. A mismatch is a place where the page looks like one thing and a screen reader is
> told another: text styled as a heading that is plain text, a grid of divs styled as a table,
> an element that looks clickable and has no button or link role, a form field with no label.
> These are guesses from how the page looks. Each heuristic below states the signal it reads,
> the threshold, why, and when it is wrong.

> **Self-review applied (2026-10-26, Stage 2.5).** Reviewed against `main` at 4fb46de. Corrections
> folded in:
> 1. HIGH: the click heuristic took any element whose role is not a widget. In `roles.ts`,
>    `isWidget` is false for composites (`toolbar`, `tablist`, `menu`, `radiogroup`, `grid`) and
>    for `tabpanel`, `dialog`, `application`, headings, and landmarks. A `tabpanel` with
>    `tabindex="0"` is the ARIA Authoring Practices pattern, and a composite using
>    `aria-activedescendant` needs `tabindex="0"`, so both would have been flagged. The heuristic
>    now applies only to elements with no role of their own (none, generic, paragraph,
>    presentation) and to `img` (AC-12, AC-13).
> 2. HIGH: AC-5 required one style read per element, but `isHiddenFromAT` reads style on its
>    own, so the test could not pass. `interpret` now wraps the style source in a per-call cache
>    that visibility and the heuristics share; `linearize` keeps today's path (AC-5, §3 Walk).
> 3. MEDIUM: the bold rule (AC-8) looked ahead to "the next text" without saying how its style is
>    known. The walk now records the style of the element that holds each text run, and the rule
>    reads the next node, which must be a text run.
> 4. MEDIUM: a chain such as `div > span` carries the same line twice. A heading mismatch is
>    reported once, on the outermost element of the chain (AC-9).
> 5. MEDIUM: AC-16 holds under happy-dom, which applies no browser default styles. In Chrome the
>    real pages may show more (a bold `<strong>` line, for example); those are recorded in the
>    log as right or false alarms, not asserted (AC-16, AC-17).
> 6. MEDIUM: an empty `<label>` gives the engine the placeholder as a name where Chrome gives an
>    empty one, so the mismatch reports `placeholder` where Chrome would suggest `no-name`. The
>    signal follows the engine's name; fixing the divergence is a follow-up (AC-15, §10).
> 7. LOW: `at` for an inline element reworded, since its text can share a run that starts before
>    it; role lists now name `presentation` and "no role"; the stale "see #11" comment in
>    `roles.ts` is fixed with the refactor; `mismatch.ts` is in the bundle for `linearize`-only
>    consumers too, a small cost accepted; the design brief's sample has no CSS, so its "Recent"
>    row is marked only once the sample carries a style (hand-off, not this spec).
> 8. Reuse confirmed: `isLayoutTable`, `hasBorder`, and `safeStyle` in `roles.ts`;
>    `labelledControl`; the `getComputedStyle` option in `visibility.ts`; `loadCase` in
>    `test/probes.ts`. Nothing in `dom-accessibility-api` or `aria-query` computes these
>    heuristics; axe-core does in part and is not a dependency (§10).

> **Backfill (2026-10-26, from the fidelity follow-ups PR).** Facts that changed after review:
> 1. Text runs now end by computed display, so flex and grid items are separate runs. The probe
>    row "PlanPrice" in §3 records the engine as it was; it now reads "Plan", "Price".
> 2. `isLayoutTable` now reads style through the `getComputedStyle` option, and `safeStyle` is
>    gone; the presentation helper this spec extracts takes that style source (§3, heuristic 2).
> 3. The operator decided the engine follows the W3C specifications first. An empty `<label>`
>    with a placeholder is named by the placeholder, as HTML-AAM 4.1 says, and that stays: it is
>    not a follow-up to fix. Chrome gives it no name; matching Chrome is a separate option.
> 4. happy-dom 21.0.4 does give `<style>` and `<script>` `display: none`, so the walk would not
>    read their text. §3 is corrected; keeping them outside the case roots is still tidy.

> **Backfill (2026-10-27, from SPEC-006).** SPEC-006 shipped (0.4.0) after this spec was reviewed.
> What changes here:
> 1. **The option.** `interpret(root, options)` takes `browser` as `linearize` does (SPEC-006
>    AC-7): `interpret(root, { browser: "chrome" }).nodes` equals `linearize(root, { browser:
>    "chrome" })`, and a value other than `"chrome"` throws the same `RangeError`. AC-1 holds in
>    both modes, on every probe case and every real page, and both goldens per page
>    (`<name>.expected.json`, `<name>.chrome.json`) stay byte-identical.
> 2. **One mode for everything.** Every role-based condition in §3 (no role of its own, inside a
>    name-from-content role, contains or sits inside a widget, a form field by role) reads the
>    role the engine resolved in the chosen mode, through the call's one `RoleContext`. So a
>    mismatch can differ by mode where the reading does: a `<td onclick>` in a table Chrome reads
>    as layout has no role in Chrome mode and is a candidate there (AC-12), and is a `cell` in
>    the default; text in such a table's cells is plain text in Chrome mode and can look like a
>    heading (AC-6 to AC-8), while in the default it is in the cell's name. The one exception is
>    point 4.
> 3. **`RoleContext`.** `roles.ts` passes one `RoleContext` (`parentOf`, `styleOf`, `rules`,
>    `grids`) in place of the positional `parentOf`/`styleOf` the review saw. The presentation
>    helper extracted from `isLayoutTable` (borders on half the cells, tinted cells) takes the
>    cells, the container, and a `StyleOf`; `isLayoutTable` passes `ctx.styleOf`, the heuristic
>    passes the same. The per-call style cache of AC-5 is that `ctx.styleOf`: `interpret` builds
>    one cached source and gives it to both `ctx.styleOf` and the walk's `getComputedStyle`, so
>    visibility, the layout-table rule, the label check, and the heuristics share one read per
>    element. The name library reads style from the element's own window through its own hook,
>    as in `linearize`; that path is outside the given style source and outside AC-5's count.
> 4. **Layout tables (operator, 2026-10-27).** In Chrome mode a `<table>` that is not a data table
>    by Chrome's rules has no role (SPEC-006 row 1). `looks-like-table` does not fire on it, in
>    either mode: it is a real table element, and the heuristic is about markup that is not a
>    table. AC-11's "inside a `table`" means a `<table>` element whatever its role, or an element
>    with the role `table`, `grid`, or `treegrid`.
> 5. **AC-15 by mode.** The signal follows the engine's name in the chosen mode. A field with an
>    empty `<label>` and a placeholder reports `placeholder` by default (HTML-AAM 4.1) and
>    `no-name` in Chrome mode, which gives it no name (SPEC-006 row 5).
> 6. **Row 8, label text.** By default the text of a `<label>` for a checkbox or radio is also a
>    text run after or before the control; in Chrome mode it is not in the reading order. Two
>    effects:
>    - AC-14: such a run could sit just before an unlabelled text field (`<label><input
>      type=checkbox> Same address</label><input type=text>`) and be taken for its nearby text,
>      in the default only. That text belongs to the other control, so `nearby-text` does not
>      count a run whose text comes from inside a `<label>` that labels another control
>      (`labelledControl` finds one, and it is not this field). A `<label>` that labels nothing
>      (no `for`, a `for` that resolves to no element, nothing labelable inside) still counts: it
>      is the visual label a screen reader never ties to the field, the case `nearby-text` is
>      for. Then the signal is the same in both modes. A field that row 8 touches has a label
>      with text, so it never fires AC-14 at all.
>    - AC-8: the bold rule reads the next node, which must be a text run. A bold line followed by
>      `<label for>` text and then its checkbox fires in the default, where that text is a run,
>      and not in Chrome mode, where the next node is the checkbox. This is kept as a mode
>      difference rather than worked around: the rule reads the reading order, and the label
>      text in AC-9's exclusions is never itself the bold line. It is pinned by a fixture.
> 7. **AC-16 per mode.** The default goldens changed (layout tables are tables, `tbody` rowgroups,
>    named rows, toggle label text read as text). Re-derived from the fixtures: the clickable
>    `div`s hold no widget and sit in no table; the "Vehicle registration" field follows the tel
>    field's node, not a text run, so it gets no `nearby-text`; every other field has a label
>    with text; the layout table holds no click attribute; and under happy-dom no style-based
>    signal fires. So the four mismatches of AC-16 are the same in both modes, and the test
>    checks both. Their `at` and `end` differ by mode, since the default reading has more nodes.
>
> **Delta review applied (2026-10-27, Stage 2.5, backfilled ACs only).** Against `main` at
> 34e5ba8. Checked in code: `RoleContext`, `StyleOf`, `resolveStyle`, `labelledControl`, and
> `isLayoutTable(table, styleOf)` exist as named; `linearize` builds `ctx.styleOf` from
> `resolveStyle(el, options)`, so one cached `getComputedStyle` reaches visibility, the layout
> rule, and `labelHasText` (point 3); the service-form goldens put `textbox "Phone number"`
> right before "Vehicle registration" in both modes (point 7).
> 1. HIGH, fixed: point 6 first excluded every run from inside a `<label>` from `nearby-text`.
>    That would have hidden the commonest real case, `<label>Email</label><input>` with no `for`.
>    Now only a label that labels another control is excluded (point 6, AC-14, test plan).
> 2. LOW: §3 "Reuse" says `isLayoutTable` calls the helper "with the element's own window"; since
>    SPEC-006 it passes `ctx.styleOf` (point 3 supersedes). The stale "see #11" comment named in
>    §7 is already gone from `roles.ts`.
> 3. LOW: the heading heuristic's "inside an element whose name comes from its content" is read
>    by ancestry, so text that Chrome mode's row 4 reads again inside a button (a status) is
>    still excluded, in both modes.
> 4. Privacy: unchanged. A mismatch carries a tag, indices, and signal identifiers; the option
>    selects bundled rules. No network.

> **Backfill (2026-10-27, from the implementation).** What the code and the Chrome runs showed:
> 1. A live region with no role of its own is a node before its text (SPEC-004), so its heading
>    line is the run after that node; the mismatch covers the run only (§5, `heading-live`).
> 2. The bold rule (AC-8) gives a false alarm on a label over its value split by a `<br>` in one
>    block, when the value is at least twice as long: the component demo's `<strong>Due</strong>
>    <br>18 Dec`, in Chrome mode only, where the layout table's cells have no role. Recorded in
>    the log; tightening the rule (the next run must start in a new block) is left to the
>    operator as a threshold change.
> 3. Chrome exposes an `<a>` with an `onclick` attribute and no `href` as a link. Chrome mode
>    reads it as plain text, as the default does, so `clickable-not-button` fires on it in both
>    modes. That is a new SPEC-006 inventory difference, not part of this spec; it is listed as
>    a follow-up and is the probe page's 2 differing lines in Chrome mode.
> 4. The dist smoke test's size guard went from 32 KiB to 64 KiB: the engine's own unminified
>    bundle is about 48 KiB now. A bundled dependency would still be far larger.

## 1. Summary

The engine shows what a screen reader is told. It does not yet show where that differs from what
a sighted person sees, which is the promise in the README. This spec adds four heuristics and a
place for their results. A new function, `interpret(root, options)`, returns the reading order
that `linearize()` returns today, unchanged, together with a list of mismatches. Each mismatch
names its kind, the range of the reading order it covers, the element it was found on, and the
signals that fired. `linearize()` does not change. The heuristics read attributes and computed
style through the existing `getComputedStyle` option, reuse Chrome's layout-table rules already in
`roles.ts`, and were grounded in a Chrome probe on 2026-10-26 (§3). Chrome's tree has no
mismatch heuristics, so the probe confirms the semantic side of each case, not the guess.

## 2. Acceptance criteria

### The output

- **AC-1** `interpret(root, options)` returns `{ nodes, mismatches }`. `nodes` deep-equals
  `linearize(root, options)` for the same root and options, in the default and in
  `browser: "chrome"`, on every probe case and every real-page fixture. `linearize()` output is
  unchanged: both goldens of each of the four real pages are byte-identical (SPEC-006 backfill,
  point 1).
- **AC-2** Each mismatch has `kind`, `at`, `end`, `ref`, and `signals` (§3, data shapes). `at`
  is the index in `nodes` of the first node that holds any of the element's content, which for an
  inline element can be a text run that starts before it; `end` is one past the last such node.
  When the element produced no node, `at` equals `end` and is the index where its content would
  have been. `ref` has the shape of a node's `ref`, with `shadow` and `frame` as in SPEC-003.
  `signals` lists the signals that fired, in the order given in §3.
- **AC-3** `mismatches` is ordered by `at`, then outer element before inner. A mismatch of kind
  `looks-like-heading` is never reported inside an element that carries another mismatch.
- **AC-4** Elements hidden from assistive technology, and everything inside them, produce no
  mismatch. Content in an open shadow tree or a same-origin frame is checked like any other, with
  the composed parent as its parent. A cross-origin frame is not read.
- **AC-5** Every style value is read through `options.getComputedStyle` when it is given, and
  from the element's own window otherwise. In `interpret`, visibility and the heuristics share a
  per-call cache, so the style source is called at most once per element. When the style of an
  element cannot be read, no style-based signal fires for it: a heuristic does not guess without
  data. (Visibility keeps failing open, as today.) `linearize` reads style as it does today.

### Looks like a heading

- **AC-6** An element whose text is one whole line of the reading order (§3) fires
  `looks-like-heading` with signal `font-size` when its text is at least 1.25 times the font size
  of its parent.
- **AC-7** It fires with signals `font-size` and `font-weight` when its text is at least 1.1
  times the parent's font size and bold where the parent's is not.
- **AC-8** It fires with signal `font-weight` when its text is bold where the parent's is not,
  it does not end with `.` or `:`, and the next node in the reading order is a text run that is
  not bold and is at least twice as long.
- **AC-9** It does not fire: on an element with a role of its own (anything but no role,
  generic, none, presentation, or paragraph); inside an element whose name comes from its content
  (a heading, link, button, cell); inside a `label`, `legend`, `caption`, `figcaption`, `dt`, or
  `summary`; when the text is longer than 80 characters or has no letter; when the element's text
  spans more than one line; or when its size and weight match its parent's. When several nested
  elements carry the same line, it is reported once, on the outermost.

### Looks like a table

- **AC-10** An element with no role, or a role of generic, none, or presentation, fires
  `looks-like-table` when its visible
  children form a grid (§3) of at least 2 rows and 2 columns of text cells, and either it has 20
  rows or more (signal `rows`), or at least half the cells have a border (`cell-borders`), or a
  cell's background differs from the element's (`cell-backgrounds`), or every cell in the first
  row is bold and no cell in the other rows is (`header-row`). The layout signal comes first:
  `grid-layout`, `row-layout`, or `table-layout`.
- **AC-11** It does not fire: for one row or one column; when a cell holds anything with a role
  other than link, or no text; below 20 rows with none of the presentation signals; on an element
  with a role of its own (table, grid, list, and so on); on or inside a `<table>` element, in
  either mode, including one Chrome mode reads as layout; or inside an element with the role
  `table`, `grid`, or `treegrid`. Only the outermost grid is reported (SPEC-006 backfill,
  point 4).

### Clickable, not a button or link

- **AC-12** An element with no role of its own (no role, generic, none, presentation, or
  paragraph), or with the role `img`, fires `clickable-not-button` for any of: an
  `onclick`, `onmousedown`, `onmouseup`, `onpointerdown`, or `onpointerup` attribute (signal
  `click-attribute`); a `tabindex` of 0 or more (`tabindex`); a computed `cursor: pointer` that
  its parent does not have (`cursor-pointer`). All signals that fired are listed.
- **AC-13** It does not fire: on an element with any other role, widget or not (button, link,
  `role="button"`, a `tabpanel` or `toolbar` with `tabindex="0"`, a heading, a landmark); on `label`, `summary`, `option`, `iframe`, `video`, `audio`, `body`, or `html`; on
  an element that contains a widget or sits inside one; for `tabindex="-1"`; for `tabindex` 0 or
  more on an element that scrolls (computed `overflow` of `auto` or `scroll`) when no other
  signal fired; for a pointer cursor inherited from its parent; or for a click listener added by
  a script, which cannot be read (pinned).

### Field without a label

- **AC-14** A form field (§3) with no label fires `field-without-label`, with the signal that
  says what it is named by instead: `no-name`, `title`, or `placeholder`. When the text run just
  before it (just after it, for a checkbox, radio, or switch) is 60 characters or fewer and comes
  from the field's parent or a sibling of the field, and not from inside a `<label>` that labels
  another control, `nearby-text` is added (SPEC-006 backfill, point 6).
- **AC-15** It does not fire for a field with a `<label>` that has text (by `for`, scoped to the
  field's root as `labelledControl` does, or by wrapping it), a non-empty `aria-label`, or an
  `aria-labelledby` that resolves to text. It fires for an empty `aria-label`, an empty `<label>`,
  and an `aria-labelledby` that points at nothing. Buttons and hidden inputs are not fields. The
  signal follows the engine's name in the chosen mode, so a field with an empty `<label>` and a
  placeholder reports `placeholder` by default, as HTML-AAM names it, and `no-name` in Chrome
  mode (SPEC-006 backfill, point 5).

### Real pages and the real browser

- **AC-16** On the real-page fixtures, `interpret` reports exactly: issue tracker, the avatar
  `div` with `onclick` (`clickable-not-button`, `click-attribute`); component demo, the card
  `div` with `onclick` (same); service form, the "Vehicle registration" field
  (`field-without-label`, `placeholder`) and the "Continue" `div` with `onclick`
  (`clickable-not-button`, `click-attribute`); reference article, none. The same four in both
  modes, with `at` and `end` per mode (SPEC-006 backfill, point 7). This holds under happy-dom:
  the fixtures carry no stylesheet and happy-dom applies no browser defaults, so no style-based
  signal fires.
- **AC-17** The probe page and the four real pages, run through `pnpm ax:compare`, show the
  engine's mismatches beside the comparison. The cases that only a real browser can compute (§3,
  computed style) fire on the probe page. Every mismatch on the real pages in Chrome, including
  any that browser default styles add beyond AC-16, is recorded in the implementation log as
  right or a false alarm.

## 3. Design

### What Chrome exposes (probe, 2026-10-26)

Read with `Accessibility.getFullAXTree` through `scripts/ax-tree.mjs` (flattened and `--raw`) in
headless Chrome, and compared with the engine through `pnpm ax:compare`. Probe 1 (headings,
grids, clickable divs, fields) agreed line for line: 40 Chrome nodes, 40 engine nodes, 0
differences. So the engine already reads each case as Chrome does, and the heuristics add
information without changing the reading order.

| Markup | Chrome | Engine today |
|---|---|---|
| `<div>` at 24px bold, then a paragraph | `generic`, text | text "Delivery options" |
| `<p><strong>Payment details</strong></p>` | `paragraph` > `strong`, text | text |
| `<div role="heading" aria-level="2">` (control) | `heading` level 2 | `heading` level 2 |
| CSS grid of 9 divs, 3 columns, bordered cells | `generic` with 9 `generic` children | 9 text runs |
| 3 flex rows of 2 spans | `generic` rows, spans ignored | "PlanPrice", "Basic5 euro", "Pro9 euro" |
| `display: table` divs, 2x2, bordered cells | `LayoutTable`, `LayoutTableRow`, `LayoutTableCell` | 4 text runs |
| the same 2x2, bordered, as `<table>` | `table`, `row`, `cell` | `table`, `row`, `cell` |
| `role="table"` divs with `columnheader` (control) | `table`, `row`, `columnheader`, `cell` | same |
| `<div onclick>` | `generic`, no clickable property | text |
| `<div>` with a click listener added by script | `generic` | text |
| `<div style="cursor:pointer">` | `generic` | text |
| `<div tabindex="0">` | `generic`, focusable | text |
| `<span onclick>`, `<span onmousedown>`, span with a script listener, span with `tabindex` 0 or -1 | `generic`: promoted from ignored | text |
| `<span style="cursor:pointer">` | ignored, text only | text |
| `<div onclick>` holding `<a href>` | `generic` > `link` | `link`, text |
| `<div role="button" tabindex="0">` (control) | `button` | `button` |
| `<p>Email</p>` then an `<input>` | `textbox` "", no name source | `textbox` "", `unnamed` |
| `<input placeholder>` only | `textbox` named from `placeholder` | same name |
| `<input title>` only | `textbox` named from `title` | same name |
| `<label for>`, wrapping `<label>`, `aria-label` | named from the label or attribute | same |
| `<span>Country</span><select>` | `combobox` "" | `combobox` "", `unnamed` |
| checkbox, then text "Remember me" | `checkbox` "" | `checkbox` "", `unnamed`, then text |
| `aria-labelledby` to a missing id, with a placeholder | `textbox` named from placeholder | same |
| empty `<label for>`, with a placeholder | `textbox` "" | `textbox` "Empty label" (differs) |

What this settles:

- Each fake construct is what it looks like to a screen reader: plain text, `generic` blocks, no
  role. CSS `display: table` gives Chrome's `LayoutTable`, never a data table, even with the
  borders that make Chrome call the same `<table>` a data table. So a grid of divs has no table
  semantics however it is laid out.
- Chrome notices click handlers, from attributes or from scripts, and `tabindex`: it promotes a
  `<span>` with one from ignored to `generic`. It still gives no role, and the DevTools protocol
  has no clickable property, so a screen reader is not told the element can be pressed. A
  pointer cursor alone changes nothing in Chrome.
- Text next to a field is never used as its name. A placeholder and a title are.
- Probe 2's two differences are not about this spec: the oracle joins Chrome's text pieces around
  the promoted spans without the spaces between them, and an empty `<label>` gives Chrome an empty
  name where the engine falls back to the placeholder. The engine follows HTML-AAM there
  (backfill 3).
- The flex rows ran their cells together ("PlanPrice"), in Chrome's text and the engine's. Flex
  items are laid out as blocks, but the engine broke text runs by tag. Fixed since: runs now end
  by computed display (backfill 1).

The probe pages become `packages/core/test/fixtures/probes/mismatches.html` (§4).

### Where the findings live

Three options were weighed. This is public API, so the choice and its cost are stated.

| Option | For | Against |
|---|---|---|
| Flags on `InterpretationNode`, like `unnamed` and `missingAlt` | One list. Hosts already render flags. | Three of the four heuristics point at elements that produce no node: a styled `<span>`, a grid of `<div>`s, and a clickable `<div>` are transparent. They would have to become nodes, which changes the reading order the engine matches against Chrome. A grid spans many nodes, and a flag sits on one. The signals behind a guess would need a field per heuristic in `NodeFlags`. |
| A separate `findMismatches(root)` | `linearize()` is untouched. | A second walk. Its indices point into a list from another call, and drift if the page changes between the two calls. Hidden content and the composed tree are handled twice. |
| **`interpret(root)` returning both** (recommended) | One walk, so the indices always match. `linearize()` is untouched. A finding can cover a range, or point at a place with no node. Facts and guesses stay apart. | A second entry point to document. Hosts place a finding by index rather than reading it off a node. |

The recommendation is `interpret()`. The line between the two is: a **flag** is a fact about one
node read straight from markup (no name, no `alt`, unreachable); a **mismatch** compares what the
page shows with what the tree says, may cover several nodes or none, and carries the signals it
rests on. The existing flags stay where they are. `unnamed` and `field-without-label` overlap on
a field with no name at all: the flag says the field has no name, the mismatch says it has no
label and what it is named by instead. Both are kept, because a host showing only flags still
sees the empty field.

How the hosts and #10 build on it: the verbosity profiles phrase `nodes` and never read
`mismatches`, since no screen reader announces a guess. A host renders `nodes[at..end)` as usual
and puts the mismatch label beside that range. The labels follow the design brief's rule that a
label names the problem: "Looks like a heading", "Looks like a table", "Clickable but not a
button", "No label".

### Data shapes

```ts
// new, additive (a minor under ADR-0004); linearize() and InterpretationNode do not change
export function interpret(root: Element, options?: LinearizeOptions): Interpretation;

export interface Interpretation {
  /** The reading order: exactly what linearize(root, options) returns. */
  nodes: InterpretationNode[];
  /** Places where the page looks like one thing and the tree says another. Guesses. */
  mismatches: Mismatch[];
}

export interface Mismatch {
  kind: "looks-like-heading" | "looks-like-table" | "clickable-not-button" | "field-without-label";
  /** Index in nodes of the first node at or after the start of the element. */
  at: number;
  /** One past the last node holding the element's content; equal to at when there is none. */
  end: number;
  /** The element the mismatch was found on, in the shape of a node's ref. */
  ref: NonNullable<InterpretationNode["ref"]>;
  /** The signals that fired, as stable identifiers, in the order this spec lists them. */
  signals: MismatchSignal[];
}

export type MismatchSignal =
  | "font-size" | "font-weight"                                        // looks-like-heading
  | "grid-layout" | "row-layout" | "table-layout"
  | "rows" | "cell-borders" | "cell-backgrounds" | "header-row"        // looks-like-table
  | "click-attribute" | "tabindex" | "cursor-pointer"                  // clickable-not-button
  | "no-name" | "title" | "placeholder" | "nearby-text";               // field-without-label
```

Signals are identifiers, not sentences: the host phrases them, and no page text is copied into a
mismatch. `Interpretation`, `Mismatch`, and `MismatchSignal` are exported with the other types.
ADR-0004 lists the contract as the fields of `InterpretationNode` and `NodeFlags`; this spec adds
`Interpretation` and `Mismatch` to that list, and states that adding a kind or a signal value is
a minor, so consumers must ignore values they do not know. Which mismatches fire for a given
markup is interpretation (ADR-0004 point 3): tuning a threshold is a patch with a changelog line.

### Walk

`interpret` and `linearize` share the existing walk. A flag on the walk state turns the
heuristics on; `linearize` leaves it off, so its output and cost are unchanged. The heuristics
run as the walk enters each element, after `isHiddenFromAT`, so hidden content and the composed
tree are handled once, in one place (AC-4). `at` is `walk.out.length` on entry; `end` is
`walk.out.length` on exit, plus one when a text run holding the element's text is still pending.

Style: `interpret` wraps the style source (`options.getComputedStyle`, or the element's own
window when none is given, so a frame keeps its own) in a cache for the call and passes the
wrapped function to the walk as `options.getComputedStyle`. `isHiddenFromAT` and the heuristics
then share one read per element, although the heuristics also read a parent's and a child's
style (AC-5). A read that throws is cached as unreadable. `linearize` does not wrap, so its path
is the one it has today.

The walk records, for each text run it emits, the style of the element that holds the run's
first text. The bold rule (AC-8) reads the next node and that record. Mismatches decided on
entry (table, click, field) are known before their content is walked; a heading mismatch is
decided once its line and the next node are known, and is dropped when it falls inside the range
of a mismatch of another kind (AC-3).

### Heuristic 1: looks like a heading

**Signal.** The size and weight of the element's text against its parent's. The element must
carry its own whole line of text: one text run in the reading order holds its text and nothing
else, so the block ends a run on both sides, or, for an inline element such as the design
brief's `<span class="h2">Recent</span>`, its neighbours do. The text's style is read from the
element, or from the innermost element of a single-child chain that holds all of it, so
`<p><strong>Payment details</strong></p>` reads the `strong`'s weight and compares it with the
`p`'s parent. The mismatch is reported once, on the outermost element of the chain, here the `p`.

**Threshold.** Font size at least 1.25 times the parent's; or at least 1.1 times and bold where
the parent is not; or bold where the parent is not, not ending in `.` or `:`, and followed by
text that is not bold and at least twice as long. Bold means a computed weight of 600 or more
(`bold` counts as 700, `normal` as 400). The text is 1 to 80 characters and has a letter.

**Why.** A heading is the largest or boldest short line in its context, and a section starts
after it. The rules follow axe-core's `p-as-heading` check, which compares a paragraph with the
next one and fires on a weight difference of 150 with italics or a size ratio of 1.15, on a size
ratio of 1.4 alone, and on length ratios of 1 and 0.5. Two changes: the comparison is with the
parent, because the brief's example is a lone span with no following paragraph; and bold alone
counts only when longer plain text follows, which is the pattern of a styled heading over its
section. Italic is not used: italics mark emphasis more often than headings.

**False positives, plainly.** A large price, a statistic with a unit ("12 euro", "3 open"), a
pull quote under 80 characters, a bold lead-in sentence that does not end with a full stop, and a
logo set in text. Each is shown with its signals so the developer can dismiss it.

**False negatives.** A heading styled no larger than its parent (a hero block at 32px holding a
32px title). A heading made by colour, capitals, or spacing alone. Text inside a link, button, or
table cell, which the walk treats as part of that control's name.

### Heuristic 2: looks like a table

**Signal.** The element's visible children laid out in rows and columns, holding short text,
with the presentation Chrome looks for in a data table. Three layouts count:

- `grid-layout`: computed `display` of `grid` or `inline-grid`. Columns are the tracks in the
  computed `grid-template-columns`: a resolved list in a browser (`"120px 120px 120px"`), or
  `repeat(n, tracks)` with an integer `n`. An `auto-fill` or `auto-fit` value that is not resolved
  cannot be counted and does not fire. Rows are the children divided by the columns, rounded up.
- `row-layout`: at least 2 visible children (rows), each with computed `display` of `flex`,
  `inline-flex`, `grid`, or `table-row`, each with the same number, at least 2, of visible
  children (cells).
- `table-layout`: computed `display: table` with `table-row` children, counted as rows of cells.
  This is the case Chrome exposes as `LayoutTable`.

A text cell holds text and no element with a role other than `link`.

**Threshold.** At least 2 rows and 2 columns, then Chrome's own test for a data table,
reused from `isLayoutTable` in `roles.ts`: 20 rows or more, or borders on at least half the
cells, or a cell background that differs from the container's. One signal is added that Chrome
does not have: a header row, every first-row cell bold and no other cell bold.

**Why.** The question a developer needs answered is "if this were a `<table>`, would a screen
reader be given a table?" Chrome's layout-table rules are the browser's answer for real tables,
already in the engine and checked against Chrome's tree. Applying the same bar to a grid of divs
keeps the two consistent: the bordered 2x2 grid in the probe is a data table as `<table>` and
plain `generic` blocks as divs. The text-cell rule keeps out card grids, whose cells hold
headings, images, and buttons.

**Reuse.** The presentation part of `isLayoutTable` (borders on half the cells, tinted cells)
moves into a helper that takes the cells, the container, and a style source. `isLayoutTable`
calls it with the element's own window, as today, so table roles do not change; the heuristic
calls it with the walk's style helper. `hasBorder` and the background test are reused as they are.

**False positives, plainly.** A bordered grid of short tags or keywords; a form laid out as label
and value columns with borders; a pricing grid that is better as a list. **False negatives.** A
plain, unbordered grid under 20 rows (the flex rows in the probe); a grid whose cells hold
buttons; a grid made with absolute positioning or floats; a `role="list"` grid, which has a role
of its own.

### Heuristic 3: clickable, not a button or link

**Candidates.** Only elements with no role of their own (no role, generic, none, presentation,
or paragraph) and `img`. An element with any other role has told the screen reader what it is,
even when that role is not a widget: `isWidget` is false for `tabpanel`, `toolbar`, `tablist`,
`menu`, `grid`, `dialog`, headings, and landmarks, and the ARIA Authoring Practices put
`tabindex="0"` on a `tabpanel` and on a composite that uses `aria-activedescendant`.

**Signal.** Three things the page can show, on a candidate:

- `click-attribute`: an `onclick`, `onmousedown`, `onmouseup`, `onpointerdown`, or `onpointerup`
  attribute. Chrome treats the same attributes as making a `<span>` worth exposing.
- `tabindex`: a `tabindex` of 0 or more, which puts the element in the tab order. Chrome makes
  it focusable and still gives it no role, so a keyboard user lands on something a screen reader
  cannot name as a control.
- `cursor-pointer`: a computed `cursor` of `pointer` that the parent's computed cursor is not.
  The cursor is inherited, so only the outermost element of a pointer area counts.

**What the engine cannot see.** A listener added with `addEventListener`, or by setting the
`onclick` property in a script, is not in the DOM a page can read. React attaches its handlers at
the root, so a React `onClick` leaves no attribute and no listener on the element. In those cases
only `tabindex` and `cursor-pointer` remain, and an element with neither carries no mark. The
probe shows Chrome does see such listeners, so a host with DevTools access (the extension's
debugger mode, #20) could add them through `DOMDebugger.getEventListeners`; core cannot, and the
README and the mismatch documentation say so.

**Threshold.** Any one signal fires; all that fired are listed, so a developer can weigh one weak
signal against three. Not counted: `tabindex="-1"`, which is used to move focus by script; and
`tabindex` alone on an element whose computed `overflow` is `auto` or `scroll`, because a
scrolling region should be focusable so keyboard users can scroll it.

**Exclusions.** Any role outside the candidates, links included. `label` (clicking it is the native way to reach
its control), `summary`, `option`, `iframe`, `video`, `audio`, `body`, `html`. An element that
contains a widget, such as a card with a real link inside, which a keyboard user can still reach.
An element inside a widget, whose pointer cursor comes from the control.

**Why.** Each signal is something the author did to make the element act like a control, and
none of them gives it a role. A screen reader reads it as text, and with no role it is not in the
list of buttons or links a screen reader user browses.

**False positives, plainly.** A pointer cursor on a tooltip trigger, a draggable item, or a
sortable column header that is wired up correctly elsewhere; an `onclick` used only for
analytics on an element with no interactive purpose; a `tabindex="0"` region that is meant to be
read, not pressed. **False negatives.** Everything above under "cannot see".

### Heuristic 4: field without a label

**Signal.** A form field is an `input` that is not `hidden`, `button`, `submit`, `reset`,
`image`, or `file`; a `select`; a `textarea`; or an element with the role `textbox`,
`searchbox`, `combobox`, `listbox`, `spinbutton`, `slider`, `checkbox`, `radio`, or `switch`. It
has a label when an associated `<label>` has text, `aria-label` has text after trimming, or
`aria-labelledby` resolves to at least one element and the name it gives is not empty. With none
of these it fires, with the source of the name it does have: `no-name`, `title` (the name is the
`title`), or `placeholder` (the name is the placeholder). `nearby-text` is added when the text
run just before the field, or just after it for a checkbox, radio, or switch, is 60 characters or
fewer and comes from the field's parent or a sibling element.

**Why.** A placeholder disappears as the user types, and a title is shown only on hover, so
neither is a visible label (WCAG 3.3.2), even though a screen reader reads them. Text next to a
field that is not connected to it is the visual label a sighted user sees and a screen reader
never hears with the field. axe-core's `label` and `label-title-only` rules check the first part;
`nearby-text` is the part that compares the page with the tree.

**Reuse.** The `for` lookup is `labelledControl`'s, scoped to the field's root. The name and its
source come from the node the walk has already built, so `accessibleName` is not called again.
The placeholder fallback in `buildNode` decides `placeholder`.

**False positives, plainly.** A search field whose only label is a nearby search button (it has
no label, and the mark is fair, but many sites accept it); `nearby-text` on a sentence that ends
just before an unrelated field. **False negatives.** A field labelled by an `aria-label` that does
not match the visible text, which is a different check (label in name) and out of scope.

### Computed style: what tests can supply

The heading and table heuristics need font size, weight, display, grid tracks, borders, and
backgrounds; the click heuristic needs cursor and overflow. What happy-dom 21.0.4, the unit-test
DOM, computes was checked on 2026-10-26:

| Property | happy-dom 21.0.4 | Chrome |
|---|---|---|
| `font-size`, `font-weight` from an inline style or a `<style>` rule, in px | computed | computed |
| `font-size` in `em` | wrong: `2em` on a 16px parent gave 64px | computed |
| browser defaults (`<strong>` bold, `<h2>` size, `display` of `span`, `td`) | not applied: normal, 16px, empty | applied |
| `font-weight` | as written, `bold` or `700` | a number |
| `cursor` | computed and inherited | computed and inherited |
| `display` from author CSS | computed | computed |
| `grid-template-columns` | as written, `repeat(3,1fr)` | resolved, `120px 120px 120px` |
| border widths | computed per side | computed per side |
| unset `background-color` | empty string | `rgba(0, 0, 0, 0)` |

So the tests supply style in three ways:

1. **Author CSS in the probe page,** in px, in one `<style>` block outside every `data-case`
   root, which happy-dom applies when `loadCase` sets the page. The same CSS applies in Chrome.
   The `<style>` and the probe's one `<script>` stay outside the case roots, so each case holds
   only the markup under test. (happy-dom gives both `display: none`, so the walk would skip them
   anyway; corrected in the backfill.)
2. **The `getComputedStyle` option,** for what happy-dom does not compute: a test wraps the real
   function and overrides chosen properties, for example `fontWeight: "700"` on a `strong`, as
   the visibility tests already do.
3. **The real browser only,** through `pnpm ax:compare` on the probe page (AC-17): browser
   defaults (a bare `<strong>` or `<b>` as the bold line), `em` and `rem` sizes, resolved
   `auto-fill` grid tracks, and a click listener added by script (which must not fire).

### Oracle

`scripts/ax-compare.mjs` runs `srm.interpret` instead of `srm.linearize` in the page, compares
`nodes` exactly as today, and prints the engine's mismatches after the diff, one line each: kind,
the `at` and `end` range, the tag, and the signals. Chrome has nothing to compare them with, so
they are information for a person, not a pass or fail.

## 4. File-level changes

| File | Change |
|---|---|
| `packages/core/src/mismatch.ts` | new: the four heuristics, the style helper, the signal order |
| `packages/core/src/linearize.ts` | `interpret()`; a heuristics flag and the `at`/`end` bookkeeping on the walk; `linearize()` unchanged |
| `packages/core/src/roles.ts` | the presentation part of `isLayoutTable` moved into a shared helper that takes a style source |
| `packages/core/src/types.ts` | `Interpretation`, `Mismatch`, `MismatchSignal` |
| `packages/core/src/index.ts` | export `interpret` and the three types |
| `packages/core/test/fixtures/probes/mismatches.html` | the probe cases, one `data-case` per AC group, CSS in px |
| `packages/core/test/mismatches.test.ts` | one fixture per AC, loaded with `loadCase` |
| `packages/core/test/real-pages.test.ts` | `interpret` on the four pages: `nodes` equal the goldens; mismatches as AC-16 |
| `scripts/ax-compare.mjs` | run `interpret`; print mismatches |
| `docs/decisions/ADR-0004-versioning-policy-1-0.md` | add `Interpretation` and `Mismatch` to the contract; new kinds and signals are minors |
| `packages/core/README.md` | `interpret`, each heuristic's signal and false positives, what cannot be seen |
| `.changeset/*.md` | `minor` |

## 5. Edge cases

- **Shadow DOM / slots:** the heuristics run in the composed walk. A parent's style is the
  composed parent's, so a slotted span compares with the element around its slot. A `ref` inside
  a shadow tree carries `shadow` (AC-4).
- **Cross-origin iframes:** not read, as SPEC-003. A same-origin frame is checked with its own
  window's computed style, and its mismatches carry `ref.frame`.
- **`aria-hidden` / `display:none`:** no mismatch on hidden content (AC-4). Visually hidden text
  (`sr-only`) is in the tree and is checked; at 1px it never looks like a heading.
- **Empty `alt=""` vs missing `alt`:** unchanged. A clickable `div` holding only an image with no
  `alt` gets both the `missingAlt` flag on the image and `clickable-not-button` on the `div`, with
  `at` and `end` around the image node.
- **Circular `aria-labelledby`:** the field heuristic reads the name the node already has, so it
  adds no traversal of its own.
- **Live regions:** a live region is a node, so a styled live region's text is still one line
  and can look like a heading. That is correct: a status message styled as a heading is a
  mismatch worth seeing.
- **Verbosity profiles:** profiles phrase nodes and never read mismatches (§3).
- **`display: contents`:** a wrapper with `display: contents` inside a grid hides the real grid
  items one level down. Not handled; a false negative.

## 6. Privacy check (mandatory)

No network. The heuristics read attributes and computed style from the page in hand, through the
same option that visibility uses. A mismatch holds a tag, indices, and signal identifiers, never
page text or a URL. Nothing is stored. `core` stays client-side and offline.

## 7. Task breakdown

Branch `feat/SPEC-005-mismatch-heuristics` from `main` after this spec merges.

- [x] `types.ts`, `index.ts`: `Interpretation`, `Mismatch`, `MismatchSignal`, `interpret`.
- [x] `linearize.ts`: `interpret()`, the heuristics flag, `at`/`end`, the cached style helper.
- [x] `roles.ts`: move the presentation test out of `isLayoutTable` into a shared helper; table
      roles unchanged (the existing tests and goldens prove it). Fix the stale "see #11" comment
      in the `table` case, since `isLayoutTable` already reads borders and backgrounds.
- [x] `mismatch.ts`: the four heuristics, in the order of §3.
- [x] Probe page and `mismatches.test.ts`, one fixture per AC; real-page mismatches (AC-16).
- [x] Oracle: `interpret` in `ax-compare.mjs`, mismatches printed; run the probe page and the
      four real pages; record every mismatch as right or a false alarm in the log (AC-17).
- [x] ADR-0004 amendment, README, `minor` changeset, `pnpm verify` green, log.

## 8. Test plan

| AC | Test | Layer | File |
|---|---|---|---|
| AC-1 | `interpret(...).nodes` equals `linearize(...)` in both modes on every probe case and real page (SPEC-006 AC-7); both goldens unchanged; `browser: "firefox"` throws | fixture | `packages/core/test/mismatches.test.ts`, `real-pages.test.ts` |
| AC-2 | `at`, `end`, `ref`, and `signals` for a heading line, a 3x3 grid, an empty clickable `div` (`at` equals `end`), and a shadow and frame case | fixture | `mismatches.test.ts` |
| AC-3 | a clickable `div` with large text gives one mismatch, not two; a fake heading inside a grid's header row is not reported; order by `at` | fixture | same |
| AC-4 | each heuristic's firing case inside `aria-hidden`, `display:none`, a hidden ancestor: none; inside an open shadow root and a `srcdoc` frame: reported with `shadow` and `frame` | fixture | same |
| AC-5 | an injected `getComputedStyle` decides a heading case both ways; a style source that throws gives no style-based mismatch and no error; in `interpret` a counting style source is called at most once per element; `linearize` with the same source behaves as today | unit | same |
| AC-6 | 24px `div` in a 16px parent; 20px span between blocks (the brief's "Recent") | fixture | same |
| AC-7 | 18px bold in a 16px normal parent | fixture | same |
| AC-8 | bold paragraph over a longer plain one; the same ending in `:`; the same followed by shorter text; a bold line before `<label for>` text and its checkbox fires by default, not in Chrome mode | fixture + option | same |
| AC-9 | real heading; large text in a link, a button, a `label`, a `legend`; 81 characters; "12" alone; two lines; same style as parent; `div > span` chain reported once, on the `div` | fixture | same |
| AC-10 | CSS grid 3x3 with borders; flex rows with a tinted cell; `display: table` with borders; 20 plain rows; bold header row | fixture + option | same |
| AC-11 | 1 row; 1 column; card grid with headings and images; 3 plain rows; `role="list"` grid; a grid inside a `<table>` cell; nested grids report the outer one; a bordered layout `<table>` in Chrome mode: none | fixture | same |
| AC-12 | `onclick`, `onmousedown`, `tabindex="0"`, pointer cursor, and all three on one `div`; `<a onclick>` with no `href`; `<img onclick>` | fixture | same |
| AC-13 | `<button>`, `<a href>`, `role="button"`; `role="tabpanel" tabindex="0"`; `role="toolbar" tabindex="0" aria-activedescendant`; `<h2 tabindex="0">`; `label` with a pointer cursor; card with a link inside; span inside a pointer `div`; `tabindex="-1"`; scrolling `div` with `tabindex="0"`; listener-only `div` (pinned: no mark); `<td onclick>` in a layout table: fires in Chrome mode only | fixture | same |
| AC-14 | no name; title only; placeholder only; `<p>Email</p>` before a field (`nearby-text`); checkbox then "Remember me"; a toggle's label text just before a field is not `nearby-text`, in both modes; `<label>Email</label>` with no `for` before a field gives `nearby-text` | fixture | same |
| AC-15 | `label for`, wrapping label, `aria-label`, `aria-labelledby`: none; empty `aria-label`, empty `<label>`, missing `aria-labelledby` target: fires; submit and hidden inputs: none; empty `<label>` with a placeholder gives `placeholder` by default and `no-name` in Chrome mode | fixture | same |
| AC-16 | the four real pages give exactly the four mismatches listed, in both modes | fixture | `real-pages.test.ts` |
| AC-17 | probe page in Chrome with real styles: bare `<strong>` line and `em` sizes fire, listener-only `div` does not; the four real pages in Chrome, each mismatch judged; results in the log | oracle | `fixtures/probes/mismatches.html`, `scripts/ax-compare.mjs` |

## 9. Risks & rollback

- **Risk: noise.** Too many false alarms and developers ignore the marks. The thresholds start
  strict, every mismatch shows its signals, and the implementation log records each mismatch on
  the real pages as right or wrong. Tuning is a patch (ADR-0004 point 3).
- **Risk: false confidence.** "No mark" read as "fine". The README and the `Mismatch`
  documentation state that these are guesses and list what cannot be seen, script listeners
  first.
- **Risk: cost.** The heuristics read computed style for more elements than visibility does.
  They run only in `interpret`, and style is cached per element for the call.
- **Risk: test DOM drift.** happy-dom's style support changes between versions. The tests that
  depend on it use px values only, and the browser-only cases live in the oracle.
- **Rollback:** `interpret` and the types are additive; removing them leaves `linearize()` as it
  is today. The `isLayoutTable` refactor is covered by the existing table tests and goldens.

## 10. Non-goals

- A full audit or rule engine. axe-core covers rules; it is not a dependency, because it is
  MPL-2.0, large for a CDN bundle, and checks rules rather than reading the page as a screen
  reader does. Its thresholds are cited as prior art (§3) and nothing is copied from its code.
- Reading event listeners. Core cannot; a DevTools host can (#20).
- Label in name (WCAG 2.5.3), colour, contrast, focus order, focus visibility.
- Geometry: no `getBoundingClientRect`. Alignment is read from layout properties, so the tests run
  without a layout engine.
- Phrasing (#10) and how hosts lay out the marks (the design gate).
- The follow-ups found while probing are settled (backfill): flex items now end a text run,
  `isLayoutTable` reads style through the option, and an empty `<label>` keeps the HTML-AAM name.
