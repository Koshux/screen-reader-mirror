---
id: SPEC-001
title: Core linearization foundation — linearize(element) → ordered interpretation
status: draft
journeys: [JNY-001]
target: core
created: 2026-06-14
---

# SPEC-001 — Core linearization foundation

> **Draft.** This spec is the founding contract for `packages/core`. It still needs a Stage-2.5
> spec-review pass against the (currently scaffold-only) codebase before implementation — that
> review is itself a good first task (see the board). Treat the API below as a strong proposal,
> not yet frozen.

## 1. Summary

Deliver the first slice of the `core` engine for [JNY-001](../journeys/JNY-001-developer-sees-screen-reader-interpretation.md):
a pure, client-side `linearize(root)` that walks a DOM subtree and returns the ordered sequence a
screen reader would traverse — each item with its computed **role** and **accessible name** — with
AT-hidden content excluded. This is the foundation every later feature (verbosity profiles,
mismatch detection, the hosts) builds on.

## 2. Acceptance criteria

- **AC-1** — `linearize(root: Element)` returns an ordered array of interpretation nodes in
  depth-first document order (the screen-reader reading order for static content).
- **AC-2** — Each node includes a `role` computed per WAI-ARIA (explicit `role` wins over implicit;
  via `aria-query`) and an `name` (accessible name per AccName 1.2; via `dom-accessibility-api`).
- **AC-3** — Subtrees excluded from the accessibility tree are omitted: `aria-hidden="true"`,
  `display:none`, `visibility:hidden`, and `hidden`.
- **AC-4** — A heading carries its `level` (1–6, from `<h1>`–`<h6>` or `aria-level`); a styled
  `<span>` that is not a heading is **not** reported as one (it surfaces as text) — making the
  "looks like a heading but isn't" mistake visible.
- **AC-5** — An interactive element with no accessible name is reported with an explicit
  empty-name marker (e.g. `name: ""` + `flags.unnamed: true`), not silently blank.
- **AC-6** — `<img>` with **missing** `alt` is flagged (`flags.missingAlt: true`); `<img alt="">`
  (intentionally decorative) is omitted from the reading order, not flagged.
- **AC-7** — The public API is exported from the package root, is ESM, side-effect-free, and
  usable from a CDN with no build step. No network calls anywhere in `core`.

## 3. Design

Depth-first traversal of `root`. For each element: determine AT visibility (skip + don't recurse if
hidden); compute role (`aria-query` implicit-role map + explicit `role`); compute accessible name
(`dom-accessibility-api`'s `computeAccessibleName`); emit a node. Text nodes that are not covered
by an element's accessible name surface as `text` nodes so reading order is complete. Shadow DOM,
iframes, and live regions are **out of scope for SPEC-001** (tracked as follow-ups) but the node
model must not preclude them.

### Public API / data shapes

```ts
export interface InterpretationNode {
  role: string;              // computed ARIA role, or "text" for bare text runs
  name: string;              // accessible name (may be "")
  level?: number;            // headings: 1–6
  flags?: {
    unnamed?: boolean;       // interactive element with no accessible name
    missingAlt?: boolean;    // <img> with no alt attribute at all
  };
  // source pointer kept minimal & serialisable; no live node refs leak into output
  ref?: { tag: string };
}

export function linearize(root: Element): InterpretationNode[];
```

A future `LinearizeOptions` (verbosity profile, include-hidden, shadow/iframe traversal) will be
an optional second argument — additive, non-breaking.

## 4. File-level changes

| File | Change |
|---|---|
| `packages/core/src/types.ts` | `InterpretationNode` + supporting types |
| `packages/core/src/linearize.ts` | the traversal + node emission |
| `packages/core/src/visibility.ts` | AT-visibility predicate (aria-hidden/display/visibility/hidden) |
| `packages/core/src/index.ts` | export `linearize`, types (replace the placeholder) |
| `packages/core/package.json` | add `dom-accessibility-api`, `aria-query` deps |

## 5. Edge cases

- **Applies now:** `aria-hidden`/`display:none`/`hidden` exclusion (AC-3); empty `alt=""` vs
  missing `alt` (AC-6); unnamed interactive controls (AC-5); `aria-level` on headings.
- **Deferred (own specs):** shadow DOM + slots, cross-origin iframes, live regions, circular
  `aria-labelledby` (note: `dom-accessibility-api` already terminates these — add a fixture to
  confirm), verbosity-profile phrasing.

## 6. Privacy check (mandatory)

`core` performs **no** network I/O — pure in-process computation over a passed-in `Element`. This
is enforced by ESLint (`no-restricted-globals`) and the `block-no-telemetry` hook. ✅

## 7. Task breakdown

- [ ] Add `dom-accessibility-api` + `aria-query` deps (note licences in the PR — both MIT).
- [ ] `visibility.ts`: AT-visibility predicate + fixtures.
- [ ] `types.ts`: `InterpretationNode`.
- [ ] `linearize.ts`: depth-first traversal, role + name, level, flags.
- [ ] Wire exports in `index.ts`; confirm ESM + `sideEffects:false` + CDN build.
- [ ] Golden HTML fixtures for each AC.
- [ ] `pnpm verify` green; add a `minor` changeset (first real API).

## 8. Test plan

| AC | Test | Layer | File |
|---|---|---|---|
| AC-1 | reading order of a nested document | fixture | `packages/core/src/linearize.test.ts` |
| AC-2 | role + name for button/link/heading/img | fixture | `…/linearize.test.ts` |
| AC-3 | aria-hidden / display:none subtree omitted | fixture | `…/visibility.test.ts` |
| AC-4 | `<span class="h2">` ≠ heading; `<h2>`/`aria-level` = heading w/ level | fixture | `…/linearize.test.ts` |
| AC-5 | icon-only `<button>` → `unnamed:true` | fixture | `…/linearize.test.ts` |
| AC-6 | missing `alt` flagged; `alt=""` omitted | fixture | `…/linearize.test.ts` |
| AC-7 | package exports ESM; no network globals referenced | unit/lint | CI `lint` + `build` |

## 9. Risks & rollback

- **Risk:** the pure-JS computation diverges from a real browser AX tree on tricky markup.
  *Mitigation:* lean on `dom-accessibility-api`; capture divergences as fixtures; hosts that can
  reach the real AX tree will later be the higher-fidelity path. **Rollback:** the API is additive
  and pre-1.0; revert the package, no consumers depend on it yet.

## 10. Non-goals

- Verbosity profiles (NVDA/JAWS/VO phrasing), mismatch heuristics, shadow DOM/iframe traversal,
  live regions, and any host (extension/cli/web) — each is its own later spec.
