---
date: 2026-10-26
spec: SPEC-001 # fidelity follow-ups, as with fix/SPEC-001-fidelity-gaps
branch: fix/fidelity-followups
status: complete
---

# Log: fidelity follow-ups from the SPEC-003, SPEC-004, and SPEC-005 probes

## What changed & why

The operator asked for every open follow-up to be fixed. Each engine change was checked against
Chrome's accessibility tree, and the three rules that differ from the W3C texts were read from
Chromium's source (`ax_object.cc`, `ax_node_object.cc`) rather than guessed from probes.

Engine (`packages/core`), each with cases in `test/fixtures/probes/fidelity-followups.html`:

- **Names from content.** Chrome keeps a descendant's content in a name built from content only
  for name-from-content roles, no role, and a short list (generic, paragraph, region, list,
  listitem, definition, term, math, caption, and the text-level roles; a group only as
  `<details>` or `<address>`): Chromium `SupportsNameFromContents(recursive=true)`. Everything
  else (status, alert, log, note, timer, marquee, group, article, figure, blockquote, table,
  landmarks, composites, sectionheader) adds only its author name. AccName 1.2 step 2H keeps all
  content, and so does `dom-accessibility-api`. The rule is applied through the library's own
  `getComputedStyle` hook, which reports such a descendant as hidden; nothing is hand-rolled. It
  is not applied inside `aria-labelledby`, where Chrome keeps all content. Result:
  `<button>Save <span role="status">3</span></button>` is a button "Save" and "3" is read once.
  The same rule applies to a label's content.
- **Empty labels.** A field whose associated labels are all empty has no name in Chrome: no
  title, no placeholder. HTML-AAM 4.1.1 falls back to both. The mirror follows Chrome, which is
  what a screen reader on Chrome gets, and the field is now flagged `unnamed`. An empty
  `aria-label` or an `aria-labelledby` to an empty element still falls back, in both.
- **Section headers.** A header or footer inside main or sectioning content is the ARIA 1.3
  `sectionheader` or `sectionfooter`, as HTML-AAM maps it and Chrome exposes it. Chromium scopes by
  the ancestor roles article, complementary, main, navigation, and section; sectioning roots
  (blockquote, details, dialog, fieldset, figure, td) and `role="region"` do not scope header,
  footer, or aside. The engine scoped by sectioning roots and region before, which was wrong in
  both directions. Explicit `role="sectionheader"` and `"sectionfooter"` are accepted, since
  aria-query 5.x does not know them.
- **Text runs by display.** A transparent element ends a text run when its computed display is
  block-level or it is a flex or grid item; when the display cannot be read, the tag decides as
  before. Flex rows no longer run their cells together ("PlanPrice"). The basis is the innerText
  algorithm, which uses the same used display.
- **Layout tables** read style through the `getComputedStyle` option (`resolveRole` takes a style
  source; the default is the element's own window, as before).

Oracle (`scripts/`): `ax-tree.mjs` records each node's computed display from one
`DOMSnapshot.captureSnapshot` call. `ax-compare.mjs` ends runs by display, reads text again inside
a role Chrome leaves out of a name, and keeps the space between inline elements, which it dropped
before.

GitHub: #6 closed (done by #52) and #22 closed (done by #54; cross-origin content is #20), each
with a comment. The `dom-accessibility-api` shadow-host limit is already reported upstream as
eps1lon/dom-accessibility-api#768 (open since 2021), so nothing new was filed; the pinned test now
cites it.

## Tests

- `pnpm verify`: typecheck, lint, build, vitest all green. 104 passed and 4 expected-fail pins
  (unchanged), 10 files.
- New: `test/fidelity-followups.test.ts`, 8 tests. Changed: the header-scoping test in
  `linearize.test.ts` (Chrome-verified expectations); the reference-article golden, regenerated
  with `--write-expected`, gains one `sectionfooter` node and nothing else.
- Chrome oracle, `pnpm ax:compare`:
  - `probes/fidelity-followups.html`: 91 Chrome nodes, 93 engine nodes, 4 differing lines, both
    the pinned double read below.
  - Real pages: component demo 0, issue tracker 0, service form 4 (term pin), reference article
    6 (term pin; the sectionfooter pin is gone, it was 7).
  - Earlier probes unchanged: web components 4, frames 0, cross-origin 1, live regions 5.

## Self code review

Stage 5.5 on `git diff origin/main...HEAD`, 2026-10-26.

- HIGH: none.
- Backed out during the work: a walk change that kept text consumed through a list inside a
  button. It overturned the SPEC-001 rule that each emitted container starts a fresh text
  context, which a test pins for a list inside a table cell, and the name fix does not need it.
- LOW, recorded: a status-type descendant with only a `title` and no content. Chrome adds the
  title to the ancestor's name; the engine adds nothing, because the library does not use a title
  inside a content name.
- LOW, recorded: the name rule resolves the role of each descendant during a content name; the
  library caches style per call and the real pages show no cost.
- LOW, fixed: the `ax-tree.mjs` header now mentions the display field.
- Privacy: no network in core. The new CDP call is in the local oracle script only.

## State at end of session

Branch `fix/fidelity-followups` pushed; PR open, awaiting the operator. PR #59 (SPEC-005 docs)
was ready to merge, CI green after the branch update.

## Hand-off notes

1. Operator: review the PR. Two choices to confirm:
   - Chrome over the W3C text where they differ (empty labels: HTML-AAM 4.1.1; names from
     content: AccName 1.2 step 2H). The reason: a screen reader on Chrome gets Chrome's name,
     and the stricter result shows the worse case. Firefox has not been checked.
   - The pinned double read: a list or `<details>` inside a button is read in the button's name
     and again as content, because of SPEC-001's fresh text context per container. Chrome counts
     it in the name only. Changing it would also change a list inside a table cell, which a test
     pins on purpose.
2. Agent, when implementing SPEC-005: backfill the spec first. §3 says happy-dom gives `<style>`
   and `<script>` no `display: none`; it does give them `none`. AC-15's note that an empty label
   reports `placeholder` is now `no-name`. The "PlanPrice" observation and two of the three §10
   follow-ups are fixed here; the empty-label one too.
3. Still open, not engineering: the manual Firefox check of the five live-region points, now with
   the two Chrome-over-spec choices above added to it.
