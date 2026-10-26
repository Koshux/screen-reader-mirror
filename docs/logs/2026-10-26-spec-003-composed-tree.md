---
date: 2026-10-26
spec: SPEC-003
branch: docs/SPEC-003-composed-tree
status: complete
---

# Log: JNY-003 and SPEC-003, composed-tree traversal (shadow DOM, slots, frames)

## What changed & why

Journey and spec for #21 and #22, treated as one problem: the engine walks the page source, a
screen reader reads the tree the browser composes. Docs only; no code. Stage 2.5 review applied
in the spec header, status `spec-reviewed`. PR #53.

The design was grounded in a Chrome probe through the oracle from #6 before writing. What Chrome
exposes, recorded here because the spec summarises it:

- Open shadow roots: the flattened composed tree. Shadow content in order; a light child appears
  under its slot (a slotted span inside a shadow `<h3>` makes the heading's name); unslotted light
  children are absent; the host and the `<slot>` elements are ignored.
- Closed roots: their content is in Chrome's tree, because the tree is built from rendering, but
  page script cannot see it. Hence `LinearizeOptions.getShadowRoot` for hosts that can.
- Nested roots compose recursively in flattened order.
- Frames: an `Iframe` node named from `title`; `Accessibility.getFullAXTree` does not descend
  into frames by default, so the oracle needs `Page.getFrameTree` and a per-frame call.
- Live regions: `role=status` is a status node; a plain `aria-live` div has no role, liveness is
  a property; `<output>` is a status role the engine does not map yet. All for SPEC-004 (#23).

Verified empirically in the test DOM: `attachShadow`, `assignedNodes({ flatten: true })`, closed
roots reading as `null`, `srcdoc` frames with `contentDocument`, computed style on shadow
elements; `Element.assignedSlot` is not available and declarative shadow DOM is not parsed, so
traversal goes slot-first and unit fixtures build roots in code. The name library computes
through slots and resolves `aria-labelledby` inside a shadow root.

## Tests

None to run. Dash check on both documents: none.

## Self code review

Stage 2.5 spec review, recorded in the spec: two HIGHs (unmerged dependency on PR #52; AC-7
wrong about unloaded frames), two MEDIUMs (ID lookups scoped to `getRootNode()`; probe page
placement), two LOWs. All folded in.

## State at end of session

PR #52 (oracle and #6 fixes) and PR #53 (this spec) open, both awaiting the operator. Local
test runner repaired: the corrupt `node_modules` was set aside as `node_modules.corrupt`
(rename succeeded only after closing VS Code) and reinstalled fresh.

## Hand-off notes

1. Operator: merge #52, then #53. Delete `node_modules.corrupt` after a disk check when convenient.
2. Agent: implement SPEC-003 on a branch from `main` once both are in; every shadow and frame
   fixture is also run through `pnpm ax:compare` during implementation.
3. Then SPEC-004 for #23 (live regions), using the probe facts above.
