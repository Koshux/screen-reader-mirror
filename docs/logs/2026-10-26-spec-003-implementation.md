---
date: 2026-10-26
spec: SPEC-003
branch: feat/SPEC-003-composed-tree
status: complete
---

# Log: SPEC-003 implementation, composed-tree traversal (shadow DOM, slots, frames)

## What changed & why

Implements SPEC-003 (#21, #22) on a branch from `main` after PR #53 merged.

- `linearize.ts`: the walk follows the composed tree. `composedChildren()` returns a host's
  shadow children (through `options.getShadowRoot` first, then `el.shadowRoot`), a slot's
  assigned nodes or its fallback, or plain children. Slots emit nothing and do not end a text
  run. An `<iframe>` emits a `document` node named from the iframe, then its body; frames are
  numbered in reading order and every node inside carries `ref.frame`. A frame whose
  `contentDocument` is null or throws is flagged `unreachable`. Nodes in a shadow tree carry
  `ref.shadow`. The walk records each element's composed parent.
- `roles.ts`: `iframe` maps to `document`. `resolveRole` takes a parent lookup, used by the `li`
  rule and the header/footer/aside scope walk. `labelledControl` resolves `for` within the
  label's own root.
- `types.ts`: `ref.shadow`, `ref.frame`, `flags.unreachable`. `LinearizeOptions.getShadowRoot` in
  `linearize.ts`.
- `scripts/ax-tree.mjs`: frame descent. Each frame owner's child frame is read with its own
  `getFullAXTree({ frameId })` and spliced under the iframe node; a frame not readable from the
  session is marked `unreachable`. `ax-compare.mjs` maps Chrome's `Iframe` to `document`.
- Probe pages under `packages/core/test/fixtures/probes/` hold every case once. The unit tests
  load a case by `data-case` and attach the declarative roots in code; Chrome loads the same page.
- README section on web components and frames; `minor` changeset.

What the Chrome oracle found during implementation, beyond the spec:

- An `<li>` slotted into a shadow `<ul>` is a listitem in Chrome; the engine called it generic
  because it read the light parent (the host). Fixed with the composed parent.
- A `<header>` at the top of a shadow root inside an `<article>` is scoped to the article in
  Chrome; the engine called it a banner because its parent chain stopped at the shadow root.
  Fixed the same way.
- A `role="button"` host is named "Mute audio" by Chrome and "audio" by the engine, because the
  name library does not walk a host's shadow root. Pinned as an upstream limit.

Spec backfilled with seven implementation notes; status `implemented`.

## Tests

- `pnpm verify`: typecheck, lint, build, and vitest all green. 83 passed and 4 expected-fail pins
  (the three from SPEC-001 plus the host-name pin), 8 files.
- New: `test/shadow-dom.test.ts` (11 tests), `test/frames.test.ts` (8 tests). Every AC from AC-1 to
  AC-10 has at least one.
- Chrome oracle, `pnpm ax:compare`:
  - `probes/web-components.html`: 31/31 nodes, 4 differing lines, both expected: the host-name
    pin, and the closed root (AC-9, Chrome sees closed content, page script does not).
  - `probes/frames.html`: 18/18, 0 differing lines.
  - `probes/frames-cross-origin.html`: 4/3, 1 line, expected (AC-7): a `data:` frame is
    unreadable from the page, while Chrome's tree has its content.
  - Real pages unchanged from the #6 log: issue tracker 91/91, 0; component demo 72/72, 0; service
    form 77/77, 4 (the `term` pin); reference article 99/98, 7 (the `term` and `sectionfooter`
    pins). Golden files untouched.
- Confirmed the descent is needed: the top-frame `getFullAXTree` contains no frame content.
- The test DOM refuses to load `about:blank`, so the not-yet-loaded frame test builds the frame
  detached and supplies an empty document, the way a browser does.

## Self code review

Stage 5.5 on `git diff origin/main...HEAD`, 2026-10-26.

- HIGH: none.
- MEDIUM, fixed: AC-2's conditional implicit role on a host had no fixture. Added an `<article>`
  host with a shadow root; Chrome agrees.
- LOW, fixed: the oracle skipped out-of-process frames silently; they are now marked
  `unreachable`. The first version of that check also matched `<html>` elements, which CDP tags
  with a `frameId`; it now matches frame owners only.
- LOW, recorded: an explicit role on an `<iframe>` keeps the frame descent with that role, which
  is untested against Chrome. A `<summary>` slotted into a shadow `<details>` is not handled.
  Neither is common.
- Privacy: no network in core. The engine reads only documents the browser already loaded, the
  output never holds a URL (tested), and cross-origin content is never read.
- Performance: slots are walked once, unflattened, so there is no extra walk per slot.

## State at end of session

Branch `feat/SPEC-003-composed-tree` pushed; PR #54 open, CI pending, awaiting the operator.

## Hand-off notes

1. Operator: review and merge PR #54.
2. Known follow-ups, for the operator to decide whether to file:
   - Chrome reports `sectionheader` for a `<header>` inside sectioning content (light DOM too);
     the engine reports nothing. Pre-existing, ARIA 1.3 role.
   - Host named from shadow content: an upstream limit in `dom-accessibility-api`, possibly
     worth an upstream issue.
   - The em dashes still in `packages/core/README.md` predate this branch; the Phase E README
     rewrite removes them.
3. Agent: SPEC-004 for #23 (live regions), using the probe facts in
   `2026-10-26-spec-003-composed-tree.md`.
