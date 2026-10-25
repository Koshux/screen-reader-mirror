---
date: 2026-10-26
spec: n/a # dependency chore (fast path)
branch: dependabot/npm_and_yarn/dev-dependencies-9d37eb4001
status: complete
---

# Log — 2026-10-26 — resolve Dependabot PR #37 (dev-dependencies group)

## What changed & why

PR #37 (opened 2026-07-19) bumped eight dev dependencies in one grouped PR and had been failing
CI and conflicting with `main` since #33 rewrote `pnpm-lock.yaml`. Operator asked for the conflicts
to be solved. Merged `main` into the PR branch and regenerated the lockfile with the pinned
`pnpm@9.12.0` (the version CI uses).

- **TypeScript held at `^5.9.3`, not 7.0.2.** `tsc` itself typechecks the repo fine on 7, but the
  toolchain does not: `typescript-eslint` (latest 8.72, peer `<6.1`) refuses to load — "does not
  support TS 7.0" — and tsup's DTS bundler (`rollup-plugin-dts`) crashes on TS 7's changed API
  (`useCaseSensitiveFileNames`). Added a Dependabot `ignore` for TypeScript **major** updates with
  the reason in a comment, so next week's grouped PR does not reintroduce it.
- **`typescript` declared as a devDependency of `packages/core`.** With `auto-install-peers=true`
  and no hoisting, pnpm resolved tsup's undeclared `typescript` peer to the *latest* (7.0.2)
  regardless of the root pin. Declaring it binds tsup to 5.9.
- **`vite ^8.3.5` declared at the root.** vitest 4 requires vite ≥6 but pnpm kept resolving its
  peer to 5.4.21 even on a fresh lockfile; declaring vite is the standard fix and vitest's own
  guidance.
- **ESLint 10:** its `recommended` set now includes `no-useless-assignment`, which flagged the
  `let raw = ""` / `let payload = {}` initialisers in the three Claude hooks (they are always
  overwritten or the function returns). Dropped the initialisers.
- Remaining bumps as Dependabot proposed: `@changesets/cli` 2.31.1, `@eslint/js` 10, `eslint`
  10, `happy-dom` 20.11+, `typescript-eslint` 8.64+, `vitest` + `@vitest/coverage-v8` 4.

No published code changed, so no changeset (the pending `linearize-engine` changeset from #33 is
untouched).

## Tests

`pnpm verify` green with the new toolchain: typecheck (TS 5.9.3), eslint 10.13, vitest 4.1.12 —
47 tests, 44 passed + 3 expected-fail pins. `pnpm build` green incl. DTS. `changeset status` ok.

## Self code review

Trivial dependency chore; Stage 5.5 not required. Changes are confined to manifests, the
lockfile, three one-line hook edits and a Dependabot ignore rule.

## State at end of session

PR #37 rebased onto `main` (via merge commit), conflicts resolved, pushed to the Dependabot
branch. Note: Dependabot stops rebasing a PR once a human pushes to it; further bumps arrive as
new PRs.

## Hand-off notes

1. Operator: review and merge #37 (approval counts — Dependabot is the author).
2. Revisit the TypeScript major ignore when `typescript-eslint` and `tsup`/`rollup-plugin-dts`
   support TS 7; remove the ignore block in `.github/dependabot.yml`.
3. Then continue the pipeline: #12 → #5 → #6 → #19 → first release (needs `NPM_TOKEN`).
