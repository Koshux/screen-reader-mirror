---
date: 2026-10-26
spec: SPEC-001
branch: fix/SPEC-001-fidelity-gaps
status: complete
---

# Log: Phase A, fidelity gaps from the 7 September review

## What changed & why

First engineering item of the 1.0 scope (docs/project/v1-scope.md, Phase A). The eight known
fidelity gaps recorded in `docs/logs/2026-09-07-spec-001-pr33-review-fixes.md` were each checked
against HTML-AAM and the installed libraries, then fixed, pinned, or deferred with a reason.

Fixed, each with a golden fixture:

- **Text runs.** Bare text was emitted one DOM text node at a time, so "Loose `<em>`text`</em>`
  here" became three rows. The linearizer now accumulates text across inline formatting and ends
  a run at block-level elements, `<br>`, and emitted nodes. One line in the browser is one row.
- **`<details>` and `<summary>`.** HTML-AAM maps details to `group` and the first summary to a
  platform disclosure button, which screen readers announce as a button. A closed details now
  hides everything except that summary (the browser hides it in its own shadow slot, so the
  computed-style check could not see it). Other summaries are generic.
- **List-box `<select>`.** `multiple` or `size` above 1 now exposes `option` children and
  `optgroup` as `group` named by its label, which is what the browser exposes and what a screen
  reader navigates. A collapsed select stays a leaf.
- **Scope-less `<th>`.** Browsers apply the HTML table-model heuristic: a header cell that starts
  a row containing data cells is a row header; every other header cell is a column header.
- **`<caption>`.** HTML-AAM maps it to the `caption` role. ARIA prohibits naming it, so the node
  has an empty name and its text reads as content; the table takes the caption as its name. A new
  `isNameProhibited` predicate (from aria-query) empties the name for any such role.
- **Unnamed inline `<svg>`.** Still decorative, but a focusable one, or one carrying a global ARIA
  attribute, stays in the tree as an image with an empty name instead of vanishing.

Pinned as decisions, not changed:

- `<li>` under `<ul role="navigation">` is generic. HTML-AAM makes `li` a listitem only when it
  is an accessibility child of an element exposed as a list, and a `ul` with `role=navigation`
  is not. Browsers differ; a fixture pins the choice and #6 revisits it against the real tree.
- The caption, legend, and label double-read is faithful to the tree. Collapsing it is a
  verbosity-profile decision (#10).

Deferred with a reason:

- Element states (expanded on the summary, selected on options, checked, disabled) are not in
  the node model. They are specified together with the verbosity profiles (#10), which need
  them anyway, so the node shape changes once.
- The three upstream AccName divergences remain `it.fails` pins.

`packages/core/src/visibility.ts` gained `isInsideClosedDetails` and `firstSummaryOf`. SPEC-001 §3
and §8 are backfilled. A patch changeset carries the change: fidelity improvements are patches
under ADR-0004.

## Tests

`pnpm verify` green: typecheck, eslint, build with declarations, vitest 5. 57 tests, 54 passing,
3 expected-fail pins. Seven new fixtures. One existing fixture updated because a multi-select in
it now correctly exposes its option.

## Self code review

Stage 5.5, inline. Checked: the text-run accumulator cannot leak text across a name-from-content
subtree (text is never appended while `textConsumed` is set) or across block boundaries (flushed
before and after every transparent block and before every emitted node); closed-details hiding
is applied both in the visibility predicate and in the walk, so direct text children of a closed
details are dropped too; the th heuristic only consults the cell's own row; no network globals;
every behaviour above has a fixture. No HIGH findings.

## State at end of session

PR open for operator review. On merge, Phase A continues with #6 (real-page fixtures against
Chrome's tree), then #21, #23, #22.

## Hand-off notes

1. Operator: review and merge; the release pipeline produces 0.1.2.
2. Agent next: #6. The real-page fixtures are also where the pinned `<li>` decision and the
   unnamed-svg choice get checked against Chrome.
3. States (expanded, selected, checked, disabled) are an explicit input to the #10 spec.
