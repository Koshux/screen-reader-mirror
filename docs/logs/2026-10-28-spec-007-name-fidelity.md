---
date: 2026-10-28
spec: SPEC-007
branch: feat/SPEC-007-name-fidelity
status: complete
---

# Log: SPEC-007, names read once, Chrome name spacing, and Chrome's anchor links

## Decisions taken at the start (operator, 2026-10-28)

1. The double read of a list or `<details>` inside a button is fixed in both modes, keeping the
   nodes inside (not the strict "children are not exposed" reading, which would drop the
   missing-alt image inside a button that SPEC-001 pins).
2. The three draft issues from the SPEC-005 log were filed: #70 design intake, #71 documentation
   site (blocked by #70), #72 NVDA bridge (blocked by #8, #10), all under M4 with
   `needs: spec`. `docs/project/v1-scope.md` now cites them in place of "new issue, on the
   operator's go-ahead".

## Evidence gathered before the spec

- WAI-ARIA 1.2 §5.2.9 (and the ARIA 1.3 editor's draft): descendants of a role with
  presentational children "SHOULD NOT" be exposed; "If user agents do not hide the descendant
  nodes, some information may be read twice." Roles with it and name from content: button,
  checkbox, menuitemcheckbox, menuitemradio, option, radio, switch, tab. Link, heading, and cell
  do not have it (checked in the spec's role tables and in `aria-query`), so the lead in the
  hand-off was half right: it covers the button cases, not link or heading.
- Chrome keeps a button's descendants in its tree; the oracle counts their text as already read.
- Inline spacing: happy-dom returns `display: ""` for `span`, `b`, `sup`, and
  `dom-accessibility-api` (accessible-name-and-description.js, line 281) puts a space around any
  child whose display is not `inline`. The engine running in Chrome already gives "Savenow",
  "Boldtext", "Price2", as Chrome does. A test-DOM artefact, pinned.
- But a real Chrome difference showed up in the same probe: Chrome spaces a child that is an
  atomic inline, a control, or named by an attribute (Chromium
  `ShouldInsertSpaceBetweenObjectsIfNeeded`), so "Logo Home" against the engine's "LogoHome".
  AccName 1.2 (Working Draft 21 October 2026) has no spacing rule; AccName #225 is open. Row 13,
  Chrome mode only.
- Anchors: Chromium `NativeRoleIgnoringAria` makes `<a>` or `<svg:a>` a link with an href or a
  click, mousedown, mouseup, or DOMActivate listener (`event_util.cc`). Chrome agreed on every
  probe: onclick, onmousedown, onmouseup, and a script listener give a link; onkeydown, tabindex,
  and a bare `<a>` do not; `role="button"` wins. Row 12.

## What changed & why

- `browser.ts`: rows 12 and 13 (`anchorWithClickHandlerIsLink`,
  `spaceAroundAtomicAndNamedChildren`), on in Chrome mode only.
- `roles.ts`: `isHandlerLink` used by `implicitRole` and `svgRole`; `hasAuthorLabel` exported;
  `contentJoinsAncestorName` (the row 4 test the name hook already uses, so the walk and the name
  agree); row 13 in `nameStyle`, which reports a child Chrome spaces as `inline-block` so the
  library adds the space itself. An `img` with `alt=""` is not spaced: Chrome leaves it out of
  the tree (the spec's first draft guessed otherwise; corrected from the oracle and noted in
  the spec).
- `linearize.ts`: a stack of name scopes on the walk. A role with presentational children named
  from its content, with no author label, opens one; inside it, a nested container in the same
  tree whose content joined the name keeps the text consumed. The row 12 link is named from a
  separate walk of its children, since the library maps that element to generic and gives "".
- Probe cases (one `data-case` each): `name-scope`, `name-spacing`, `name-spacing-test-dom`,
  `anchor-click` in `fidelity-followups.html`; `scope-shadow` in `web-components.html`.
- README: the name-scope rule, rows 12 and 13, the script-listener limit, and the test-DOM
  spacing note. SPEC-001 and SPEC-006 backfilled. `patch` changeset.

Semver, under ADR-0004: **patch**. No API shape changes (`BrowserRules` is internal, `browser`
keeps its one value); every change is interpretation, and the default changes only for text
inside a name scope.

## Pinned expectations that changed

- `fidelity-followups.test.ts`, `name-from-content` (default): `text "3"`, `text "to all"`,
  `text "menu"`, and `text "details"` are no longer read after the buttons. The link's and the
  heading's (`text "new"`, `text "1 failed"`) are unchanged.
- `browser-modes.test.ts`, row 4 (Chrome mode): `text "menu"` and `text "details"` gone; the
  status and group text after "Save" and "Send" stay, since Chrome leaves them out of the name.
- `mismatches.test.ts`, `click`: was one expectation for both modes; the `<a onclick>` mark now
  fires in the default only.
- `browser-modes.test.ts`, AC-3 sweep: `name-scope`, `name-spacing`, and `anchor-click` are listed
  as inventory cases.

## Tests

- `pnpm verify`: typecheck, lint, build, vitest green. 190 passed and 4 expected-fail pins
  (unchanged), 12 files (was 183 passed).
- New: name scopes in both modes (`fidelity-followups.test.ts`), the test-DOM spacing pin (AC-7),
  rows 12 and 13 in both modes (`browser-modes.test.ts`), the scope and a shadow tree
  (`shadow-dom.test.ts`).

### Chrome oracle, `pnpm ax:compare`, Chrome mode

| Page | Before | After |
|---|---|---|
| `probes/fidelity-followups.html` | 4 | 5 (2 on the existing cases) |
| `probes/mismatches.html` | 2 | 0 |
| `probes/web-components.html` | 4 | 7 |
| issue tracker, service form, reference article, component demo | 0 each | 0 each |

The lines left, each explained:

- `fidelity-followups.html`, existing cases: `-text Sameline / +text Same line`, the known oracle
  limit (Chrome's tree drops the whitespace between two inline-block spans). Both double reads
  are gone.
- `fidelity-followups.html`, new cases: `text x`, `text item`, `text entry`. These are the AC-3
  cases kept on purpose: a list inside an `aria-label` button, inside a link, and inside a
  heading still read their text (SPEC-001's fresh text context). The oracle counts all text under
  a name-from-content ancestor as read.
- `web-components.html`, new `scope-shadow` case (3 lines on its own): the host is named "light"
  where Chrome says "inner light" (upstream eps1lon/dom-accessibility-api#768, already pinned as
  `host-name`), and so the shadow list's "inner", not in the engine's name, is read.

Goldens: `--write-expected` was run for the four real pages; both goldens per page came out
byte-identical, so no golden changed.

## Self code review

Stage 5.5 on `git diff origin/main...HEAD`, 2026-10-28.

- HIGH: none.
- MEDIUM considered, downgraded to LOW and kept: inside a scope, a transparent element with an
  author label (`<span aria-label="search">`) passes the consumed text through, so a list under
  it does not read its items, though the library's name used the label instead. Reading that text
  would also make `<button><span aria-label="Close">×</span></button>` read "×" after the
  button, which neither Chrome nor a screen reader does. Today's behaviour, kept.
- LOW, fixed: the row 12 name ignored `xlink:href` on an SVG `a`.
- LOW, fixed: `pnpm verify` caught a strict-optional typing error in the inner walk.
- LOW, kept: row 13 calls `resolveRole` per child during a Chrome-mode name, as row 4 does.
- Privacy: no network in core. Row 12 reads attributes only and never inspects listeners.

## State at end of session

Branch `feat/SPEC-007-name-fidelity` from `main` at b84cc86, pushed; PR open, awaiting the
operator.

## Hand-off notes

1. Operator: review the PR. Choices to confirm:
   - Text under a labelled transparent element inside a button stays unread (above).
   - A list inside an `aria-label` button still reads its items (SPEC-007 keeps today's reading
     there; WAI-ARIA §5.2.9 would hide them, and so does the oracle).
2. Follow-ups found while probing, not changed here:
   - `dom-accessibility-api` skips a descendant's `title` in a name from content
     (`<a><i title="Bell"></i>Alerts</a>` is "Alerts"); AccName 1.2's Tooltip step would give
     "Bell Alerts". Upstream question first.
   - Chrome exposes `<canvas>` and `<object>` with an `aria-label` as nodes; the engine does not.
   - Chrome keeps a label's text when the label for a checkbox holds a text field (row 8 edge).
   - Double reads inside a link or heading in the default (`note`, `alert` content). No
     presentational-children basis; a separate question.
3. Next in the operator's order: the manual Firefox check of the five live-region points (the
   agent writes the checklist).
