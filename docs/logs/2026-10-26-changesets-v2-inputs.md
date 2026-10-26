---
date: 2026-10-26
spec: n/a # release infra fix (fast path)
branch: fix/changesets-action-v2-inputs
status: complete
---

# Log — 2026-10-26 — release: changesets/action v2 input names

## What changed & why

The first un-gated run of the release workflow (after #42) failed immediately:
`changesets/action@v2` renamed its inputs (`version` → `version-script`, `publish` →
`publish-script`) and reads the GitHub token only from the `github-token` input, never from a
`GITHUB_TOKEN` env var. Dependabot had bumped the action from v1 to v2 (#38) while the step was
still gated off by the old `NPM_TOKEN` guard, so nothing exercised it until now.

- `release.yml`: `version-script` / `publish-script` / `github-token` (explicit, same default).
- `.gitignore`: `*.tgz`, because the manual bootstrap publish uses `pnpm pack` and the tarball
  must not be committed. The stray `screen-reader-mirror-0.0.0.tgz` in `packages/core` was
  removed (it was 0.0.0 because the Version Packages PR has not merged yet).

## Tests

YAML parses; programmatic check of the changesets step shows exactly `version-script`,
`publish-script`, `github-token` and no env block. The real test is the release run on `main`
after merge: it must open the Version Packages PR.

## Self code review

Trivial infra fix; Stage 5.5 not required.

## State at end of session

PR opened. The release pipeline on `main` is red until this merges.

## Hand-off notes

1. Operator: merge this PR → release run opens "Version Packages" (0.0.0 → 0.1.0) → merge that
   (its publish step fails once; expected) → manual 0.1.0 publish from `main` (`pnpm pack` then
   `npm publish <tgz> --access public --provenance=false`) → add trusted publisher on npmjs.com →
   re-run the failed release job.
2. npm account for the package: `determina11y`.
