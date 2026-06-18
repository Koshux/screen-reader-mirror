---
date: 2026-06-18
spec: SPEC-001
branch: feat/SPEC-001-linearize
status: complete
---

# Log — 2026-06-18 — SPEC-001 linearize engine (#4)

## What changed & why

The core of the engine (board issue #4): a real `linearize(root, options?)` that walks a DOM
subtree and returns the screen-reader reading order. Replaces the placeholder.

- **`packages/core/src/roles.ts`** — `resolveRole` (explicit `role` wins, validated against
  `aria-query`; otherwise a *conditional* implicit role: `<a>` is a link only with `href`,
  input-by-`type`, `<header>`/`<footer>` scoped to sectioning, etc.), plus `takesNameFromContent`
  and `isWidget` derived from `aria-query` role definitions. Curated to the elements we exercise
  today (broadening to full HTML-AAM + `getComputedRole()` oracle is a follow-up).
- **`packages/core/src/linearize.ts`** — the traversal. Each element is **transparent** (no/▢silent
  role → emit nothing, recurse so text surfaces), **leaf** (name-from-content role or form
  control/image → emit one node, don't recurse — the no-double-read rule), or **container**
  (landmark/list/table → emit and recurse). Names via `dom-accessibility-api`; heading `level` from
  `h1`–`h6`/`aria-level`; `flags.unnamed` for empty-named widgets; `flags.missingAlt` for `<img>`
  with no `alt`; `alt=""` omitted; hidden subtrees pruned via #2's `isHiddenFromAT`.
- **`index.ts`** — removed the stub `IMPLICIT_ROLES`/`implicitRole` + placeholder; exports
  `linearize`, `LinearizeOptions`, and the types. `roles`/`visibility` stay internal.
- **Deps:** `dom-accessibility-api` (MIT), `aria-query` (Apache-2.0, permissive/MIT-compatible),
  `@types/aria-query` (dev). tsup externalises them — the bundle is 6.47 KB and doesn't include them.

## Tests

`pnpm verify` ✅ and `pnpm build` ✅. 20 tests total; 8 new in `linearize.test.ts` (happy-dom) cover
AC-1 (reading order), AC-2 (role+name; no-double-read; `<a>` needs `href`), AC-3 (hidden subtrees),
AC-4 (styled span ≠ heading; `<h2>`/`aria-level`), AC-5 (unnamed control), AC-6 (missing alt /
decorative `alt=""`). `index.test.ts` trimmed to a public-surface smoke (the stub it tested is gone).

## Self code review

Stage 5.5 pass on the diff vs `main`. No HIGH findings.
- Correctness/privacy/reuse as above; no network; reuses the trusted libs for the hard parts.
- **Decisions (not findings):** changeset deferred to #5 (spec's task split; package still 0.0.0);
  modules kept internal; dep licences noted.
- **Known MVP limitations (documented in code):** (a) a nested interactive element inside a
  name-from-content role (link inside a heading) is consumed into the name; (b) the role resolver is
  a curated subset; (c) `visibility:hidden` prunes the subtree (descendant `visibility:visible`
  override deferred). All within SPEC-001 non-goals — candidates for a follow-up fidelity ticket.

## State at end of session

On `feat/SPEC-001-linearize`; PR opened for operator review. `main` unchanged until merge. With this,
SPEC-001 AC-1..AC-6 are implemented; AC-7 (exports/CDN/changeset) is #5.

## Hand-off notes

1. **Review & merge** (or ask me to merge as admin).
2. **Next:** #5 (confirm ESM/`sideEffects`/CDN build + add the first `minor` changeset) → #6 (golden
   fixtures for broader real-world coverage) → then M1 is publishable.
3. Consider filing a follow-up ticket for the nested-interactive-in-name-from-content refinement.
4. Local-dev reminder persists: `pnpm install --force` after the folder rename (symlinks).
