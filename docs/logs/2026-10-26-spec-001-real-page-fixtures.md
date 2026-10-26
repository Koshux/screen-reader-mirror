---
date: 2026-10-26
spec: SPEC-001
branch: test/SPEC-001-real-page-fixtures
status: complete
---

# Log: Phase A, #6, real-page fixtures against Chrome's accessibility tree

## What changed & why

Issue #6 reframed by the 1.0 scope: golden fixtures from realistic pages, compared against the
browser's real accessibility tree. No browser-automation dependency was added. Chrome and Edge are
on this machine and Node 22 has a native WebSocket, so two scripts drive Chrome through the
DevTools protocol directly:

- `scripts/ax-tree.mjs` launches a headless Chromium, opens a file, and returns the full
  accessibility tree flattened in reading order with roles, names, heading levels, DOM tags, and
  ignored nodes marked. It also exposes `openPage()` for other scripts.
- `scripts/ax-compare.mjs` wraps a body fragment in a document, reads Chrome's tree, injects a
  self-contained build of the engine into the same page, runs it on the same DOM, normalises both
  sides to one vocabulary, and prints a line diff. `--write-expected` saves the engine output as
  the golden file. The engine bundle comes from `scripts/ax-engine.tsup.config.ts`.
- `pnpm ax:compare <fragment>` and `pnpm ax:tree <file>` are the entry points.

Four fixture pages were written for this (original content, not copies of real sites): an issue
tracker page, a government-style service form, a reference article, and a component demo with
tabs, cards, disclosures, a dialog, live regions, and layout and data tables. The comparison went
from 84 differing lines to 11, and every remaining line is a documented pin.

Engine changes made because Chrome's tree showed the engine was wrong:

- `thead` and `tfoot` are row groups; `tbody` is not exposed at all.
- A table row is named by the author or not at all. Browsers do not name rows from their cells
  and screen readers never announce such a name.
- Layout-table heuristic, calibrated against Chrome on seven table shapes: a table with no
  header cells, caption, summary, head or foot section, or `border` attribute is not a table
  when it has one row or one column, or when fewer than half its cells have borders and none
  has its own background. Twenty rows or more is always data.
- Every `<form>` is exposed with role `form`, as Chrome does. Whether an unnamed form is listed
  as a landmark is a screen-reader policy and belongs to the verbosity profiles. This reverses
  the June decision, on the strength of the oracle.
- `dt` and `dd` are `term` and `definition`; `blockquote` is `blockquote`. All author-named.
- A text field with no other name source takes its placeholder, as HTML-AAM and Chrome do.
- The text of a label for a checkbox or radio is read only as the control's name. Chrome drops it
  from the tree for both wrapping and `for` labels. The text of a label for a text field is
  still read on its own as well.
- `progress` and `meter` are leaves named by the author.

Pinned divergences, with the reason:

- Chrome names a `term` from its content; ARIA 1.2 says author only. The engine follows ARIA; a
  screen reader reads the text once either way.
- Chrome exposes a scoped `<footer>` or `<header>` with the ARIA 1.3 roles `sectionfooter` and
  `sectionheader`. aria-query 5.3 does not know them. Revisit when it does.

Unit fixtures that asserted the old table shape were updated, and one fixture was added per new
behaviour. `packages/core/test/real-pages.test.ts` pins the four pages to their expected files
under happy-dom. SPEC-001 §3 and §8 are backfilled.

## Tests

Oracle: issue tracker 91/91 nodes, 0 differing lines; component demo 72/72, 0; service form 77/77,
4 lines (the `term` pin); reference article 99/98, 7 lines (the `term` and `sectionfooter` pins).

Typecheck and lint are green. **The vitest suite could not be run on this machine:** the
`happy-dom@21.0.4` directory in `node_modules/.pnpm` is corrupt at the filesystem level (its
`lib/event/events` folder cannot be listed), a forced reinstall aborted on it, and the operator
declined the deletion needed to repair it. The eleven new unit expectations were therefore
checked by running the same snippets through the engine inside Chrome, and CI, which installs
fresh, is the verifier for this PR. One known risk: the layout-table border check reads computed
styles, and happy-dom may expand the `border` shorthand differently from Chrome; the check reads
the longhands, the `borderWidth` shorthand, and the `border` string, and CI will say.

## Self code review

Stage 5.5, inline. Scripts: no dependencies, no network beyond the local DevTools port, temp
profiles removed, Chrome killed on every path. Engine: the layout heuristic only consults the
table's own rows (nested tables excluded), reads styles defensively, and defaults to layout when
styles are unavailable only after the markup rules have had their say; the label rule consults
the `for` target before the first labelable descendant; placeholder is a last resort after the
AccName result is empty. Every changed behaviour has a unit fixture and appears in a golden page.
No HIGH findings. Medium, carried as a follow-up: Chrome's full layout-table algorithm also
weighs alternating row backgrounds and cell counts; the engine implements the attribute rules,
the size rule, borders, and backgrounds, which matched all seven calibration shapes.

## State at end of session

PR open. Local vitest blocked by the corrupt install until the operator removes the broken
directory and reinstalls.

## Hand-off notes

1. Operator, to repair the local test runner, in PowerShell from the repo root:
   `Remove-Item -Recurse -Force node_modules\.pnpm\happy-dom@21.0.4` then
   `npx pnpm@9.12.0 install`. If the removal is refused, reboot first; the directory is locked.
2. Operator: review and merge; the release pipeline produces the next patch.
3. Agent next: #21 shadow DOM and slots, using the oracle (Chrome pierces open shadow roots in
   `DOM.getDocument`, so the comparison works unchanged).
4. The oracle can be run on any fragment: `pnpm ax:compare path/to/fragment.html`.
