---
date: 2026-10-26
spec: SPEC-004
branch: feat/SPEC-004-live-regions
status: complete
---

# Log: SPEC-004 implementation, live regions (#23)

## What changed & why

Implements SPEC-004 on a branch from `main` after PR #55 merged (0.2.0 released with SPEC-003).

- `live.ts` (new): `liveRegionOf(el, role)`. The valid `aria-live` and `aria-relevant` tokens
  come from `aria-query`'s `aria` map. The implicit `aria-live` and `aria-atomic` per role come
  from its role props. Nothing is re-derived. An invalid token is ignored, so the role's implicit
  value applies (AC-3). `relevant` is in the fixed order additions, removals, text, with `all`
  expanded and `["additions", "text"]` as the default.
- `linearize.ts`: a live region whose role is transparent (none, `generic`, `paragraph`, or a
  presentation role) is emitted as a node with role `role ?? "generic"`, empty or not. Its
  children are walked with the incoming text context, so inside a heading, link, or button its
  text is not read again (AC-12). `buildNode` sets `live` for any role, frames included.
- `roles.ts`: `<output>` maps to `status`.
- `types.ts`, `index.ts`: `LiveRegion`, `InterpretationNode.live`, and the type export.
- `scripts/ax-tree.mjs` keeps `live`, `atomic`, `relevant`, and `busy`. `scripts/ax-compare.mjs`
  no longer treats a live region as transparent, prints the live values on both sides, maps
  Chrome's `LabelText` to `generic`, normalises `relevant` the way the engine does, and ends a
  text run when it leaves any emitted node.
- Probe page `test/fixtures/probes/live-regions.html`, loaded case by case with `loadCase`.
- README section on live regions, stating that `live` describes the set-up, not the timing.
  `minor` changeset.
- Spec backfilled with five implementation notes; status `implemented`.

## Tests

- `pnpm verify`: typecheck, lint, build, and vitest all green. 96 passed and 4 expected-fail
  pins (unchanged), 9 files.
- New: `test/live-regions.test.ts`, 13 tests. AC-1 to AC-12 each have at least one test, plus
  the inline-region case from §3.
- Chrome oracle, `pnpm ax:compare`:
  - `probes/live-regions.html`: 84 Chrome nodes, 83 engine nodes, 5 differing lines, all
    expected: the invalid-token cases (`bogus` on a div and on a status, `" ASSERTIVE "`),
    which Chrome passes through and the engine treats as WAI-ARIA asks.
  - Real pages: issue tracker 91/91, 0; component demo 72/72, 0; service form 77/77, 4 (the
    `term` pin); reference article 99/98, 7 (the `term` and `sectionfooter` pins). Same as
    before, with the live values now compared on the two region nodes.
  - SPEC-003 probes unchanged: web components 31/31, 4; frames 18/18, 0; cross-origin 4/3, 1.
- AC-11: component-demo and service-form goldens regenerated with `--write-expected`. The diff
  is 8 added lines each, the `live` field on the status message and the error summary, and
  nothing else. The other two goldens are untouched.

## Self code review

Stage 5.5 on `git diff origin/main...HEAD`, 2026-10-26.

- HIGH: none.
- MEDIUM, fixed: an `<iframe aria-live>` lost its `live` field, because the frame path returned
  before it was computed. Chrome shows it as a live region. Fixed, with a probe case.
- LOW, fixed: a live `<label>` is `LabelText` in Chrome and showed as a role difference. The
  oracle now maps it to `generic`. The engine reads the label text on its own as well as the
  checkbox name, which matches Chrome, and a test pins it.
- LOW, checked: the oracle's new rule for ending a text run left every real page and SPEC-003
  probe with the counts recorded before.
- LOW, recorded: Chrome leaves the content of a `status`, `note`, `log`, or `group` out of an
  enclosing button's name; the engine includes it, then reads it again. This happens with or
  without a live region and was already there before this branch.
- Privacy: no network. `live.ts` reads attributes and the data bundled with `aria-query`.

## State at end of session

Branch `feat/SPEC-004-live-regions` pushed; PR open for #23, awaiting the operator.

## Hand-off notes

1. Operator: review the PR. The design choice from the spec log still stands: a live region
   inside a sentence breaks the text line (`Total:`, region, `12`, `items`), as Chrome's tree
   does.
2. Known follow-ups, for the operator to decide whether to file:
   - Name-from-content through a non-name-from-content role (Review LOW above, spec note 5).
     It touches the name computation, so it needs a spec and possibly an upstream issue for
     `dom-accessibility-api`.
   - From the SPEC-003 session, still open: Chrome's `sectionheader` for a header inside
     sectioning content; the host-name upstream limit; the old em dashes in
     `packages/core/README.md` (Phase E rewrite).
