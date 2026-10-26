---
date: 2026-10-26
spec: SPEC-001 # fidelity follow-ups, as with fix/SPEC-001-fidelity-gaps
branch: fix/fidelity-followups
status: complete
---

# Log: fidelity follow-ups from the SPEC-003, SPEC-004, and SPEC-005 probes

## What changed & why

The operator asked for every open follow-up to be fixed. Each case was checked against Chrome's
accessibility tree, and where Chrome and the W3C texts differ, the rule was read from Chromium's
source (`ax_object.cc`, `ax_node_object.cc`) and from the specifications themselves.

The first push followed Chrome where it differs from the specifications. The operator then
decided: **the W3C specifications first, always**, with a separate option later to match a given
tool for interoperability. The second push applies that decision. What the PR does now:

- **Section headers.** A header or footer inside main or sectioning content is the ARIA 1.3
  `sectionheader` or `sectionfooter`, as HTML-AAM maps it. Scoping follows ARIA in HTML: the
  elements article, aside, main, nav, and section and the roles article, complementary, main,
  navigation, and region scope; sectioning roots (blockquote, details, dialog, fieldset, figure,
  td) are not in that list and no longer scope, which the engine got wrong before. Chrome agrees
  except for `role="region"`, which it does not treat as scoping (pinned). Explicit
  `role="sectionheader"` and `"sectionfooter"` are accepted, since aria-query 5.x does not know
  them.
- **Text runs by display.** A transparent element ends a text run when its computed display is
  block-level or it is a flex or grid item, the same used display the innerText algorithm uses.
  When the display cannot be read, the tag decides as before. Flex rows no longer run their cells
  together ("PlanPrice").
- **Empty labels, HTML-AAM 4.1.** When the associated label gives an empty name, a field falls back
  to its title, then (a text field) its placeholder. `dom-accessibility-api` stops at the empty
  label, so the title step was missing; the placeholder step was already there.
- **Layout tables** read style through the `getComputedStyle` option (`resolveRole` takes a style
  source; the default is the element's own window, as before).

Pinned as differences from Chrome, engine unchanged (spec first):

- **Names from content.** AccName 1.2's recursive step takes every descendant's text, so
  `<button>Save <span role="status">3</span></button>` is "Save 3". Chrome leaves out the content
  of roles that do not count toward an ancestor's name (status, alert, log, note, group, table,
  figure, blockquote, landmarks; Chromium `SupportsNameFromContents(recursive=true)`) and gives
  "Save". The same holds for a label's content.
- **Empty labels.** Chrome gives a field with an empty associated label no name at all.
- **Region scope.** Chrome keeps a header inside `role="region"` a banner.

The Chrome-matching implementation of both is in commit e6aebab on this branch, for the option
that will expose it.

Oracle (`scripts/`): `ax-tree.mjs` records each node's computed display from one
`DOMSnapshot.captureSnapshot` call. `ax-compare.mjs` ends runs by display, reads text again inside
a role Chrome leaves out of a name, and keeps the space between inline elements. One limit found:
Chrome's tree drops the whitespace between two inline-block elements, so the oracle reads
"Sameline" where the page shows "Same line".

SPEC-005 backfilled (it merged as #59 during this work): the flex-run and layout-table follow-ups
are fixed, the empty-label name stays with HTML-AAM, and §3's claim that happy-dom gives
`<style>` no `display: none` was wrong.

GitHub: #6 closed (done by #52) and #22 closed (done by #54; cross-origin content is #20), each
with a comment. The `dom-accessibility-api` shadow-host limit is already reported upstream as
eps1lon/dom-accessibility-api#768 (open since 2021), so nothing new was filed; the pinned test now
cites it.

## Tests

- `pnpm verify`: typecheck, lint, build, vitest all green. 104 passed and 4 expected-fail pins
  (unchanged), 10 files.
- New: `test/fidelity-followups.test.ts`, 8 tests, with Chrome's value written beside each pinned
  difference. Changed: the header-scoping test in `linearize.test.ts`; the reference-article
  golden, regenerated with `--write-expected`, gains one `sectionfooter` node and nothing else.
- Chrome oracle, `pnpm ax:compare`:
  - `probes/fidelity-followups.html`: 91 Chrome nodes, 93 engine nodes, 28 differing lines, all
    pinned: the AccName names (6 pairs), the HTML-AAM label fallbacks (6 pairs), the region
    scope, the two double reads, and the inline-block space.
  - Real pages: component demo 0, issue tracker 0, service form 4 (term pin), reference article
    6 (term pin; the sectionfooter pin is gone, it was 7).
  - Earlier probes unchanged: web components 4, frames 0, cross-origin 1, live regions 5.

## Self code review

Stage 5.5 on `git diff origin/main...HEAD`, 2026-10-26, run on the first push and again after
the spec-first change.

- HIGH: none.
- Backed out: a walk change that kept text consumed through a list inside a button. It overturned
  SPEC-001's fresh text context per container, which a test pins for a list in a table cell.
- After the spec-first change, the name code is identical to `main`, so the earlier LOWs about
  the Chrome name hook no longer apply.
- LOW, fixed: the `ax-tree.mjs` header now mentions the display field.
- Privacy: no network in core. The new CDP call is in the local oracle script only.

## State at end of session

Branch `fix/fidelity-followups` updated with `main` (after #59) and pushed; PR #60 awaiting the
operator.

## Hand-off notes

1. Operator: review PR #60.
2. Next, per the operator's decision: a journey and spec for an option that matches a given tool
   (Chrome first) where it differs from the specifications. Inputs: the two pins above, commit
   e6aebab, and every place the engine already follows Chrome by default (the layout-table rules,
   rows named by the author only, every form exposed, toggle label text, and others). Each needs
   a decision: spec by default, Chrome behind the option.
3. Agent, when implementing SPEC-005: the backfill block in the spec lists what changed.
4. Still open, not engineering: the manual Firefox check of the five live-region points.
