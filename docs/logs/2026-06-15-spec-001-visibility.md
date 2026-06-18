---
date: 2026-06-15
spec: SPEC-001
branch: feat/SPEC-001-visibility
status: complete
---

# Log — 2026-06-15 — SPEC-001 AT-visibility predicate (#2)

## What changed & why

Implements board issue #2 (SPEC-001 AC-3): `packages/core/src/visibility.ts` exporting
`isHiddenFromAT(el, options?)` — the predicate the linearizer (#4) uses to skip elements excluded
from the accessibility tree.

- Conditions: `aria-hidden="true"`, the `hidden` attribute (except `hidden="until-found"`, which
  stays in the tree), `display:none`, `visibility:hidden`/`collapse`.
- **Host-agnostic & defensive** per the SPEC-001 §3/§5 spec-review notes: computed style comes from
  the element's own `ownerDocument.defaultView` (never a global `window`); if style can't be
  computed (detached node, throwing impl) it fails **open** (treats the element as visible) so we
  never wrongly drop content. A `getComputedStyle` override makes it fully testable/host-pluggable.
- Added **`happy-dom`** (MIT, dev-only) as the DOM test environment — also sets up DOM testing for
  #4/#6. Tests use `// @vitest-environment happy-dom`.

Kept internal: `isHiddenFromAT` is **not** exported from `index.ts` (the public API stays
`linearize` + types per SPEC-001); #4 imports it internally.

## Tests

`pnpm typecheck` ✅, `pnpm lint` ✅, `pnpm test` ✅ (10 tests: 7 new in `visibility.test.ts` + 3
existing). The 7 cases cover each condition, `aria-hidden="false"`/`hidden="until-found"` negatives,
the injected `getComputedStyle` (host-agnostic), and fail-open-on-throw. Confirmed happy-dom
resolves inline `display`/`visibility` via the real default path (not just the injected stub).

## Self code review

Stage 5.5 pass on the diff vs `main`. No HIGH findings.
- Correctness: all four AC-3 conditions; `aria-hidden` early-wins; until-found handled; visibility
  early-return. The `visibility:hidden` descendant-override case is documented as a deferred
  refinement (SPEC-001 non-goals).
- Privacy: no network; `getComputedStyle` is a DOM read.
- Reuse: no library exposes a standalone AT-visibility predicate for traversal pruning (this is
  ours, small, well-tested); not reinventing `dom-accessibility-api` (which hides internally for
  *name* computation only).
- **Decisions (not findings):** `happy-dom` is dev-only (no published/CDN impact); predicate kept
  internal; no changeset (no published API change — the first-API changeset lands with exports #5).

## State at end of session

On `feat/SPEC-001-visibility`; PR opened for operator review. `main` unchanged until merge.
Independent of #3 (PR #31) — different files, either can merge first.

## Hand-off notes

1. **Review & merge** (or ask me to merge as admin).
2. **#4 (`linearize`) is the next critical-path step** once #2 + #3 are merged: it imports
   `isHiddenFromAT` (skip + don't recurse on hidden), implements the conditional role resolution,
   removes the stub `IMPLICIT_ROLES`/`implicitRole`, and applies the name-vs-text no-double-read rule.
3. Local-dev reminder still applies: `pnpm install --force` after the folder rename (broken symlinks).
