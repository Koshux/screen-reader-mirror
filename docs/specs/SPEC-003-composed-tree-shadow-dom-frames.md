---
id: SPEC-003
title: Composed-tree traversal, shadow DOM, slots, and frames
status: spec-reviewed
journeys: [JNY-003]
target: core
created: 2026-10-26
---

# SPEC-003: Composed-tree traversal, shadow DOM, slots, and frames

> Issues #21 and #22. The engine reads the page source today; a screen reader reads the tree the
> browser composes from shadow roots, slots, and frame documents. This spec makes the engine walk
> that composed tree, and makes every boundary it cannot cross visible instead of silent.

<!-- Filled by the spec-review skill at Stage 2.5:
> **Self-review applied (YYYY-MM-DD).** <key corrections made during spec review.>
-->

> **Self-review applied (2026-10-26, Stage 2.5).** Reviewed against the live engine and checked
> empirically in the test DOM. Corrections folded in:
> 1. The spec builds on PR #52 (the Chrome oracle scripts and the `labelledControl` helper), which
>    was unmerged at review time. Implementation branches from `main` after #52 lands (§7).
> 2. AC-7 wrongly treated a not-yet-loaded same-origin frame as unreachable. A frame before load
>    exposes an empty `about:blank` document, which is reachable; only cross-origin frames are
>    unreachable (§2, §5).
> 3. ID references must resolve within the element's own tree. The name library already does this
>    for `aria-labelledby` (verified), but the engine's own `labelledControl` helper looks up `for`
>    on the document and must use `getRootNode()` instead (§3, §4).
> 4. The oracle probe page cannot live under `fixtures/pages`, where the golden-page test picks up
>    every file; it goes under `fixtures/probes` (§7, §8).
> 5. Verified, not assumed: the name library computes a shadow heading's name through its slot
>    from the assigned content, and names an `<iframe>` from `aria-label` then `title` (§3).
> 6. The `document` node carries its own frame index as well, so "frame n starts here" and
>    "inside frame n" read the same field (§3). Cross-origin frames are simulated in tests by
>    making `contentDocument` throw (§8). The output never includes a frame's URL (§6).

## 1. Summary

`linearize()` currently walks `childNodes`, so a web component's shadow content is never seen
and its light children are read whether or not they are slotted. It also stops at an `<iframe>`,
so frame content is dropped without a trace. Chrome's accessibility tree, checked with the oracle
from #6, exposes the flattened composed tree: shadow content in order, light children at their
slot's position, unslotted children absent, hosts and slot elements ignored. For frames it exposes
a named boundary node per frame. This spec changes the traversal to compose shadow trees and
slots, descends into frame documents the page can reach, represents every frame as a `document`
node, marks nodes that came from a shadow tree or a frame, and gives hosts that can reach closed
shadow roots (the extension) a way to pass them in.

## 2. Acceptance criteria

- **AC-1** Content inside an element's open shadow root appears in the reading order at the
  host's position, in composed order. The host's light children are not read directly.
- **AC-2** A `<slot>` reads the nodes assigned to it, flattened through nested slots, at the
  slot's position. A slot with nothing assigned reads its own fallback content. Slot elements
  and hosts emit no node of their own, unless the host has a role (an explicit `role` or a
  conditional implicit one), in which case it is a container like any other element.
- **AC-3** Light children that are not assigned to any slot do not appear.
- **AC-4** Shadow roots nest: a host inside a shadow tree composes recursively, and the output
  order matches Chrome's accessibility tree for the same markup.
- **AC-5** Every node whose element lives in a shadow tree, at any depth, carries
  `ref.shadow: true`.
- **AC-6** An `<iframe>` whose document the page can read (same origin) produces a `document`
  node named from the iframe (its accessible name, which HTML-AAM takes from `aria-label`, then
  `title`), followed by the content of the frame's body in reading order. The `document` node and
  every node inside the frame carry `ref.frame` with the 1-based index of the frame in reading
  order, so a renderer can show where the frame starts and ends. Frames nest. A same-origin frame
  that has not finished loading reads as an empty document; the caller re-runs after load.
- **AC-7** An `<iframe>` whose document cannot be read (cross-origin: `contentDocument` is null
  or throws) produces the same `document` node with `flags.unreachable: true` and no content. It
  is never dropped.
- **AC-8** Visibility rules apply inside shadow trees and frames: `aria-hidden`, `hidden`,
  `display:none`, and `visibility:hidden` on a shadow element, a slotted element, a slot, or a
  frame element hide the subtree as they do in the light tree. A hidden slot hides the nodes
  assigned to it.
- **AC-9** A closed shadow root cannot be seen from page script, so by default the host is read as
  if it had no shadow root (its light children are read as written) and the README documents the
  limit. A caller can supply `options.getShadowRoot(host)`; when it returns a root, closed
  content is composed exactly like open content. The browser extension uses this with the
  browser's API for closed roots.
- **AC-10** The no-double-read rule holds across boundaries: a slotted element inside a shadow
  heading is consumed into the heading's name; text runs merge across a slot the same way they
  merge across inline elements.

## 3. Design

### Composed children

The traversal replaces `childNodes` with a `composedChildren(el, options)` function:

1. If the element has a shadow root, through `options.getShadowRoot?.(el) ?? el.shadowRoot`,
   its composed children are the shadow root's `childNodes`. The light children are not visited
   here; they are reached only through slots.
2. If the element is a `<slot>`, its composed children are `slot.assignedNodes({ flatten: true })`
   when that list is not empty, otherwise the slot's own `childNodes` (fallback content). The
   slot itself is transparent, so it emits nothing and does not end a text run (a slot is
   `display: contents`).
3. Otherwise, its composed children are its `childNodes`.

This is the flattened-tree algorithm the HTML standard defines for rendering, and it is what
Chrome's accessibility tree showed in the #6 oracle probe: `x-card > #shadow > h3 > slot > span`
reads as heading then slotted text, the shadow paragraph and button follow, and an unslotted
light paragraph is absent. Slot assignment comes from the slot side because `assignedNodes()` is
supported everywhere the engine runs, while `Element.assignedSlot` is not available in the test
DOM.

The element kinds from SPEC-001 are unchanged. A host is resolved like any element: a custom
element with no `role` is generic, so it is transparent; a host with `role="button"` is a
container with its composed children beneath it. `ref.shadow` is set on a node when the element's
root node is a shadow root: `el.getRootNode()` is not the document and has a `host`.

Names across the boundary are the library's job and were verified in the test DOM on
2026-10-26: `computeAccessibleName` on a shadow `<h3><slot>` returns the slotted text, not the
slot's fallback, because the library walks `assignedNodes()`; `aria-labelledby` on a shadow
element resolves against the shadow root, as the ID scoping rules require; `aria-labelledby`
cannot cross a boundary, and that is correct. The engine's own helpers must follow the same
scoping: `labelledControl` resolves a label's `for` with `getRootNode()` (a `ShadowRoot` or
`Document`, both of which have `getElementById`), and any future ID lookup does the same.
`closest()` and `querySelectorAll()` do not cross shadow boundaries, so the table heuristics stay
within their own tree, which is also correct.

### Frames

When the traversal meets an `<iframe>` that is not hidden:

1. Compute the frame's accessible name from the iframe element with `computeAccessibleName`,
   which follows HTML-AAM (`aria-label`, then `title`, then nothing).
2. Try `iframe.contentDocument`. Reading it can throw for a cross-origin frame; the engine
   treats a throw and `null` the same way.
3. If the document and its `body` are available: emit `{ role: "document", name, ref: { tag:
   "iframe", frame: n } }` where `n` is the incremented frame counter, and walk `body` with the
   same options. Nodes emitted inside carry `ref.frame: n`; a frame inside a frame gets the next
   counter and its nodes carry that value, so the marker always names the innermost frame. A
   frame that has not loaded yet has an empty `about:blank` body and reads as an empty document.
4. Otherwise: emit the same node with `flags.unreachable: true` and do not descend.

`document` is the ARIA role of the embedded document. Chrome exposes an `Iframe` node named from
the title; NVDA announces "frame" on entry and "out of frame" on exit; the verbosity profiles
(#10) phrase this from the `document` node and the `ref.frame` marker. The frame counter is per
`linearize()` call. The output never records a frame's URL. `<frame>`, `<object>`, and `<embed>`
are not frames for this spec.

Visibility inside a frame uses the frame document's own window, which `isHiddenFromAT` already
does through `el.ownerDocument.defaultView`.

### Closed shadow roots

`el.shadowRoot` is `null` for a closed root and for no root, and nothing in the DOM distinguishes
them. By default the engine reads the light children, which is what the DOM presents, and the
README states that closed roots are not seen. `LinearizeOptions.getShadowRoot` lets a host that
can see closed roots supply them; the extension will pass the browser's closed-root accessor. No
heuristic guesses at closed roots, because a wrong guess is worse than a documented limit.

### Oracle

`scripts/ax-tree.mjs` already pierces open and closed shadow roots when it reads tag names.
`Accessibility.getFullAXTree` returns only the top frame; the script gains frame descent
(`Page.getFrameTree`, then `getFullAXTree({ frameId })` for each same-process child frame,
spliced under the frame's node) so AC-6 can be verified against Chrome. Declarative shadow DOM
(`<template shadowrootmode>`) is used in the Chrome probes; unit fixtures attach roots in code,
because neither browsers nor the test DOM parse declarative roots from `innerHTML`.

### Public API / data shapes

```ts
// before
export interface LinearizeOptions {
  getComputedStyle?: (el: Element) => CSSStyleDeclaration | null | undefined;
}
export interface InterpretationNode {
  role: string; name: string; level?: number; flags?: NodeFlags; ref?: { tag: string };
}
export interface NodeFlags { unnamed?: boolean; missingAlt?: boolean }

// after (all additions; a minor bump under ADR-0004)
export interface LinearizeOptions {
  getComputedStyle?: (el: Element) => CSSStyleDeclaration | null | undefined;
  /** Supply a shadow root the DOM hides (closed roots). Defaults to `el.shadowRoot`. */
  getShadowRoot?: (host: Element) => ShadowRoot | null | undefined;
}
export interface InterpretationNode {
  role: string; name: string; level?: number; flags?: NodeFlags;
  ref?: {
    tag: string;
    /** The element lives inside a shadow tree. */
    shadow?: true;
    /** The element lives inside the n-th frame met in reading order (1-based). */
    frame?: number;
  };
}
export interface NodeFlags {
  unnamed?: boolean;
  missingAlt?: boolean;
  /** A frame whose content cannot be read from here (cross-origin or not loaded). */
  unreachable?: boolean;
}
```

## 4. File-level changes

| File | Change |
|---|---|
| `packages/core/src/linearize.ts` | `composedChildren()`; slot and host handling in `walkChildren`; frame handling in `emitElement`; `ref.shadow` and `ref.frame` in `buildNode`; frame counter on the walk state |
| `packages/core/src/types.ts` | `ref.shadow`, `ref.frame`, `flags.unreachable`, `LinearizeOptions.getShadowRoot` |
| `packages/core/src/roles.ts` | `iframe` resolves to `document`; `labelledControl` resolves `for` within `getRootNode()` |
| `packages/core/src/shadow-dom.test.ts` | fixtures for AC-1 to AC-5, AC-8 to AC-10 |
| `packages/core/src/frames.test.ts` | fixtures for AC-6 to AC-8 |
| `scripts/ax-tree.mjs` | frame descent for the oracle |
| `packages/core/README.md` | composed tree, frames, closed-root limit, the new option |
| `.changeset/*.md` | `minor` |

## 5. Edge cases

- **Shadow DOM / slots:** the whole spec. Also: a slot assigned a text node (bare light text)
  joins the current text run; a slot assigned another host composes recursively; a slot inside a
  name-from-content element is consumed; `aria-labelledby` cannot reference across a shadow
  boundary (IDs are scoped to a tree), and the name library already behaves that way.
- **Cross-origin iframes:** `document` node with `flags.unreachable`, never dropped.
- **`aria-hidden` / `display:none`:** applied to hosts, shadow elements, slotted elements, slots,
  and frames alike; a hidden slot hides its assigned nodes; a hidden iframe emits nothing.
- **Empty `alt=""` vs missing `alt`, circular `aria-labelledby`:** unchanged.
- **Live regions:** unchanged here; SPEC-004 (#23).
- **Verbosity profiles:** the `document` node and the markers are the inputs the profiles need to
  say "frame" and "out of frame"; no phrasing here.
- **Frames that load later:** a same-origin frame met before it has loaded has an empty
  `about:blank` document and reads as an empty `document` node; the caller re-runs after load,
  as the extension does on its Re-run control (JNY-002). Only a cross-origin frame is unreachable.
- **`about:blank` and empty frames:** a reachable frame with an empty body is a `document` node
  with nothing after it.

## 6. Privacy check (mandatory)

No network. Frame documents are read from the DOM the browser has already loaded; the engine
never fetches a frame's URL, and the output never contains one (`ref` holds the tag and the frame
index only). Cross-origin content is not read at all. `core` stays client-side and offline; the
ESLint guard and the hook are unchanged.

## 7. Task breakdown

Branch from `main` after PR #52 has merged: the oracle scripts and `labelledControl` come from it.

- [ ] `types.ts`: the three additive fields and the option.
- [ ] `linearize.ts`: `composedChildren()`, slot fallback, host handling, `ref.shadow`.
- [ ] `linearize.ts`: frame handling, `ref.frame`, `flags.unreachable`; `roles.ts`: `iframe`, and
      `labelledControl` scoped to `getRootNode()`.
- [ ] `shadow-dom.test.ts` and `frames.test.ts`: one fixture per AC, including a nested case
      checked line for line against the Chrome oracle.
- [ ] `scripts/ax-tree.mjs`: frame descent; a declarative-shadow-DOM probe page under
      `packages/core/test/fixtures/probes/` for the oracle. Not under `fixtures/pages`, where the
      golden-page test would pick it up, and the test DOM cannot parse declarative roots.
- [ ] README: composed tree, frames, closed-root limit, `getShadowRoot`.
- [ ] `minor` changeset; `pnpm verify` green; log.

## 8. Test plan

| AC | Test | Layer | File |
|---|---|---|---|
| AC-1 | host with open root: shadow content at host position, light children not read directly | fixture | `packages/core/src/shadow-dom.test.ts` |
| AC-2 | named slot, default slot, fallback content, slot and host emit nothing; host with `role` is a container | fixture | `…/shadow-dom.test.ts` |
| AC-3 | unslotted light child absent | fixture | `…/shadow-dom.test.ts` |
| AC-4 | nested hosts; the probe page compared to Chrome with `pnpm ax:compare` | fixture + oracle | `…/shadow-dom.test.ts`, `fixtures/probes/web-components.html` |
| AC-5 | `ref.shadow` on every shadow-tree node and on no light node | fixture | `…/shadow-dom.test.ts` |
| AC-6 | `srcdoc` frame: `document` node named from `title`, content follows, `ref.frame` on the document node and inner nodes, nested frame increments; frame with `aria-label` and `title` takes `aria-label` | fixture | `packages/core/src/frames.test.ts` |
| AC-7 | frame whose `contentDocument` is null or throws (simulated by overriding the property, since the test DOM has no cross-origin frames): `document` node with `flags.unreachable`, nothing inside | fixture | `…/frames.test.ts` |
| AC-8 | `aria-hidden` on a shadow element, `hidden` on a slotted element, `display:none` on a slot and on an iframe | fixture | both files |
| AC-9 | closed root: light children read by default; with `getShadowRoot` the closed content is composed | fixture | `…/shadow-dom.test.ts` |
| AC-10 | slotted span inside a shadow heading consumed into the name; text run across a slot | fixture | `…/shadow-dom.test.ts` |

## 9. Risks & rollback

- **Risk:** component libraries that move light children around with script instead of slots
  would read differently from the composed tree. The oracle decides; pins are documented.
- **Risk:** `assignedNodes({ flatten: true })` on a very large page costs a walk per slot. Slots
  are few relative to nodes; measured on the component-demo fixture before merge.
- **Risk:** the test DOM's slot assignment differs from browsers in a corner. Every shadow fixture
  is also run through the Chrome oracle during implementation.
- **Rollback:** the fields and the option are additive; reverting the traversal change restores
  the light-tree behaviour with no API break.

## 10. Non-goals

- Reading cross-origin frame content. That is the extension's real-tree path (#20).
- Detecting closed shadow roots without help. Documented limit plus the option.
- Live regions (#23), verbosity phrasing for frame boundaries (#10), flagging unslotted content
  or untitled frames as mistakes (#11).
- `<object>`, `<embed>`, `<portal>`, `<frameset>`.
