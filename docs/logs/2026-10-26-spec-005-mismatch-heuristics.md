---
date: 2026-10-26
spec: SPEC-005
branch: docs/SPEC-005-mismatch-heuristics
status: complete
---

# Log: JNY-005 and SPEC-005, visual-versus-semantic mismatch heuristics (#11)

## What changed & why

Journey and spec for #11, the first item of Phase B. Docs only; no code. Stage 2.5 review
applied in the spec header, status `spec-reviewed`. Branched from `main` at 4fb46de (PR #57
merged). PR #58 (Version Packages, 0.3.0) was still open and was left alone.

The spec settles:

- **Where findings live.** A new `interpret(root, options)` returns `{ nodes, mismatches }`;
  `linearize()` does not change. Flags on nodes were weighed and rejected: three of the four
  heuristics point at elements that produce no node (a styled span, a div grid, a clickable div
  are all transparent), and a grid covers many nodes. A separate `findMismatches()` was rejected
  because its indices would point into another call's list. The rule written down: a flag is a
  fact about one node, a mismatch compares the page with the tree and carries its signals.
- **The four heuristics,** each with signal, threshold, reason, false positives, and false
  negatives: looks like a heading (size or weight against the parent, modelled on axe-core's
  `p-as-heading` margins); looks like a table (Chrome's own data-table test from
  `isLayoutTable`, applied to a grid of divs); clickable, not a button or link (`onclick`-family
  attributes, `tabindex` 0 or more, a pointer cursor not inherited); field without a label.
- **What cannot be seen:** listeners added by script, and React's root-level handlers. Stated in
  the spec, the journey's failure modes, and pinned as a test case.
- **Computed style:** how tests supply it (author CSS in px in the probe page, the
  `getComputedStyle` option, or the real browser through `pnpm ax:compare`).

### Grounding

Chrome probe through `scripts/ax-tree.mjs` (flattened and `--raw`) and `pnpm ax:compare`,
recorded as a table in SPEC-005 §3. Probe 1 agreed 40/40 nodes with 0 differences, so the engine
already reads every fake construct as Chrome does. Facts that shaped the design:

- A CSS `display: table` grid is Chrome's `LayoutTable`, even with bordered cells; the same
  bordered 2x2 as `<table>` is a data table.
- Chrome promotes a `<span>` with an `onclick` or `onmousedown` attribute, a script listener,
  or any `tabindex` from ignored to `generic`, still with no role. A pointer cursor alone changes
  nothing. The DevTools protocol has no clickable property.
- Name sources for fields match the engine: placeholder, title, label, `aria-label`; text next
  to a field is never used.

happy-dom 21.0.4 checked with a scratch script: it computes author CSS in px, inheritance, and
border widths, but applies no browser defaults (`<strong>` is not bold, `<h2>` is 16px), resolves
`2em` to 64px on a 16px parent (wrong), and leaves `grid-template-columns` as written.

axe-core thresholds were read from its repository (`p-as-heading` margins and length ratios;
`label-title-only` selector) and are cited as prior art. axe-core is not a dependency: MPL-2.0,
large for the CDN bundle, and it checks rules rather than reading the page as a screen reader.

## Tests

None to run; docs only. Dash, ellipsis, and banned-word check on both documents: none.

## Self code review

Stage 2.5 spec review, recorded in the spec header:

- HIGH, fixed: the click heuristic took any non-widget role. `isWidget` is false for composites,
  `tabpanel`, `dialog`, headings, and landmarks, so the ARIA Authoring Practices'
  `tabpanel tabindex="0"` and composites using `aria-activedescendant` would have been flagged.
  Candidates are now elements with no role of their own, and `img`.
- HIGH, fixed: AC-5 asked for one style read per element while `isHiddenFromAT` reads style on
  its own. `interpret` now shares a per-call cache with visibility.
- MEDIUM, fixed: the bold rule's look-ahead; reporting a nested chain once; AC-16 scoped to
  happy-dom with the Chrome results going to the log; the empty-label signal.
- LOW, noted: `at` for inline elements, role-list wording, a stale comment in `roles.ts`, bundle
  cost, the design brief's sample having no CSS.

## State at end of session

Branch `docs/SPEC-005-mismatch-heuristics` pushed; docs PR open referencing #11 (not closing it),
awaiting the operator. PR #58 (0.3.0) still open, untouched.

## Hand-off notes

1. Operator: review the docs PR. Two choices to confirm: `interpret()` as a second entry point
   rather than flags on nodes, and the starting thresholds, which tuning can change later as a
   patch under ADR-0004 point 3.
2. Agent: implement on `feat/SPEC-005-mismatch-heuristics` from `main` after the PR merges. The
   scratch probe pages from this session are reproduced by the cases in SPEC-005 §3; build
   `test/fixtures/probes/mismatches.html` from them, CSS in px, the `<style>` and `<script>`
   outside every case root.
3. Design gate: the hosts' designs need the `Mismatch` shape and the four labels in §3. The
   design brief's §6 shows nodes only, and its sample has no CSS, so its "Recent" row would carry
   no mark. Updating the brief is the operator's call.
4. Found while probing, not acted on (for the operator to decide whether to file):
   - An empty associated `<label>` with a placeholder: Chrome gives no name, the engine gives the
     placeholder.
   - Flex items are laid out as blocks, but the engine breaks text runs by tag, so flex cells run
     together ("PlanPrice"), as the oracle's joined Chrome text does too.
   - `isLayoutTable` reads style from the window, not from the `getComputedStyle` option.
5. Still open from earlier sessions, unchanged: Chrome leaves status, note, log, or group content
   out of an enclosing button's name (SPEC-004 note 5); the manual Firefox check of the five
   live-region points; Chrome's `sectionheader`; the possible upstream issue for
   `dom-accessibility-api` and shadow hosts; the old em dashes in `packages/core/README.md`;
   issues #6 and #22 still open on GitHub.
