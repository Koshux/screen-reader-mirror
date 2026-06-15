---
date: 2026-06-15
spec: SPEC-001
branch: feat/SPEC-001-node-types
status: complete
---

# Log — 2026-06-15 — SPEC-001 node types (#3)

## What changed & why

First real implementation slice of SPEC-001 (board issue #3): finalised the public node contract
in `packages/core/src/types.ts`.

- Extracted `NodeFlags` as a named, exported type (was an inline `flags?: { … }`), for DX and so
  consumers can name it; exported it from `index.ts`.
- Aligned all doc comments with the **spec-reviewed** SPEC-001 §3: the conditional role-resolution
  note (`<a>` is a link only with `href`), the "no double-read" rule, and AC ties (AC-5/AC-6).
- Added `packages/core/src/types.test.ts` — a data-only contract test (element node with level, a
  `role:"text"` run, both flags, and a **JSON round-trip** proving the model is plain serialisable
  data with no live node references, which is the whole design intent).

Scope kept tight: did **not** remove the stub `IMPLICIT_ROLES`/`implicitRole` (SPEC-001 assigns that
to the role-resolution work, #4) and did **not** touch `linearize`.

## Tests

`pnpm typecheck` ✅, `pnpm lint` ✅, `pnpm test` ✅ (7 tests: 4 new in `types.test.ts` + 3 existing).

**Setup issue found & fixed (not a code bug):** after the project folder was renamed
`screen-reader-visualiser` → `screen-reader-mirror`, every pnpm symlink in `node_modules` still
pointed at the **old** absolute path (e.g. `…/screen-reader-visualiser/node_modules/.pnpm/vitest@…`),
so `vitest`/`typescript` failed to resolve. Fixed with `pnpm install --force` (regenerates links at
the new path). See hand-off — this likely recurs for the maintainer's local checkout.

## Self code review

Stage 5.5 pass on the working-tree diff vs `main`. No HIGH findings.
- Correctness/privacy: types + data test only; no behaviour change, no network, no live refs.
- Tests: node contract covered; serialisability asserted.
- Reuse: `NodeFlags` extraction removes inline duplication; stub role map left for #4 (in scope).
- **Decision (not a finding):** no changeset — SPEC-001's task breakdown bundles the single "first
  real API" minor changeset with the exports task (#5); the package is unpublished (0.0.0). Add it
  there, not here.

## State at end of session

Implemented on `feat/SPEC-001-node-types`; PR opened for operator review (not self-merged — first
real code change, maintainer's review gate). `main` unchanged until merge.

## Hand-off notes

1. **Review & merge the PR** (or ask me to merge as admin). It's docs+types+test only.
2. **Local-dev gotcha for the maintainer:** your local `node_modules` symlinks are broken by the
   folder rename too — run `pnpm install --force` once before working locally. (CI is unaffected; it
   installs fresh.) Consider moving the repo out of the OneDrive-backed `Documents` folder to avoid
   recurring symlink issues.
3. **Next on the critical path:** #2 (AT-visibility predicate) — also unblocked and good-first —
   then #4 (`linearize`) once #2 + #3 are merged. #4 should remove the stub `implicitRole` and
   implement conditional role resolution per the spec-reviewed §3.
