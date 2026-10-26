---
date: 2026-10-26
spec: n/a # release infra (fast path)
branch: chore/release-trusted-publishing
status: complete
---

# Log — 2026-10-26 — Release via npm trusted publishing (OIDC), no token

## What changed & why

The release workflow was gated on an `NPM_TOKEN` secret and would have handed it to `npm publish`
as a bypass-2FA granular access token. npm is retiring those: since Aug 2026 they cannot change
account/package settings, and direct publishing via them ends Jan 2027. npm's replacement is
**trusted publishing**: GitHub Actions proves its identity to npm over OIDC and gets a
single-run credential; nothing is stored, nothing expires, provenance is automatic.

`release.yml` now:
- has **no `NPM_TOKEN` guard or env**. The changesets step always runs; while changesets are
  pending it only opens/updates the Version Packages PR (needs `GITHUB_TOKEN` only);
- runs on **Node 24** so the bundled npm is >= 11.5.1 (trusted-publishing minimum). pnpm 9
  delegates `pnpm publish` to that npm CLI, which performs the OIDC exchange. CI/test stay on 20;
- keeps `id-token: write` (already there) and `registry-url` (as in npm's reference workflow);
- drops the pnpm store cache for the release job only: npm's guidance is never to reuse a
  dependency cache in a release build (CI keeps its cache from #12).

**Bootstrap caveat (documented in the workflow):** npm cannot configure a trusted publisher for a
package that does not exist yet (npm/cli#8544, open). So 0.1.0 is published once from the
operator's machine with 2FA, the trusted publisher is then added on npmjs.com (owner `Koshux`,
repo `screen-reader-mirror`, workflow `release.yml`, no environment), and the workflow takes over.
The publish run for 0.1.0 fails once; re-running it after the manual publish is green because
`changeset publish` skips versions already on the registry and only tags.

## Tests

- YAML parses; programmatic check: permissions include `id-token: write`, Node 24, no cache on
  the release job, no `NPM_TOKEN` reference anywhere.
- `pnpm verify` unaffected (no code change). The real test is the first OIDC release (0.1.1 or
  later); if pnpm-via-npm misbehaves under OIDC the fallback is `pnpm pack && npm publish *.tgz`.

## Self code review

Trivial infra change; Stage 5.5 not required. Checked against npm's trusted-publishing docs and
reference workflow (2026-10-26).

## State at end of session

PR opened for operator review. On merge, the next push to `main` opens the Version Packages PR.

## Hand-off notes

1. Operator: merge this PR, then merge the Version Packages PR it produces (its publish step
   fails once, expected).
2. Operator: `npm login` (2FA in the browser), then from `packages/core` on `main`:
   `npm publish --access public --provenance=false` (provenance only exists inside CI).
3. Operator: npmjs.com > package > Settings > Trusted publishing > GitHub Actions
   (`Koshux` / `screen-reader-mirror` / `release.yml` / environment blank); then Publishing
   access > "Require two-factor authentication and disallow tokens". First CI publish must
   happen within 2 days of adding the publisher.
4. Re-run the failed release job (tags + GitHub Release). Then #19.
