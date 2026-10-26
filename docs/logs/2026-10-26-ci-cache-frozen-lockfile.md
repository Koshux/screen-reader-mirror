---
date: 2026-10-26
spec: n/a # infra chore (#12, fast path)
branch: chore/12-ci-cache-frozen-lockfile
status: complete
---

# Log — 2026-10-26 — CI: pnpm cache + frozen lockfile (#12)

## What changed & why

Issue #12: the lockfile has been committed since the scaffold, but CI still installed without it
as the source of truth and without a store cache. All three workflows (`ci`, `release`,
`deploy-pages`) now pass `cache: pnpm` to `actions/setup-node` (keyed on `pnpm-lock.yaml`) and run
`pnpm install --frozen-lockfile`, so a PR whose manifest drifts from the lockfile fails fast
instead of silently re-resolving — a supply-chain guarantee that matters most in `release`
(distribution.md: never publish from a dirty tree). The issue named `ci.yml`; the other two
workflows got the identical two-line change for consistency.

## Tests

- All three workflow files parse as YAML; `setup-node` carries `cache: pnpm` and the install step
  is `pnpm install --frozen-lockfile` in each (checked programmatically).
- `pnpm install --frozen-lockfile` with the pinned `pnpm@9.12.0` passes locally against the
  current lockfile ("Lockfile is up to date").
- The real proof is PR #40's own `verify` run on the changed `ci.yml`.

## Self code review

Trivial infra change; Stage 5.5 not required.

## State at end of session

Branch pushed, PR #40 opened for operator review. Closes #12 on merge. (This log landed in a
second commit: a failed YAML-validator invocation short-circuited the first commit's chain.)

## Hand-off notes

1. Operator: merge PR #40 when its `verify` run is green (it exercises the new install step).
2. Next in M1: #5 (CDN consumability proof + README quickstart), then #6, #19, first release.
