---
date: 2026-10-26
spec: SPEC-001
branch: feat/SPEC-001-exports-cdn
status: complete
---

# Log — 2026-10-26 — SPEC-001 AC-7: exports, ESM/CDN build, README (#5)

## What changed & why

Issue #5 asked for: exports wired, ESM + `sideEffects:false` confirmed, a working CDN build, and
the `minor` changeset. The first and last already landed in PR #33 (`index.ts` exports
`linearize` + types; `.changeset/linearize-engine.md`). This PR adds the **proof** and the
**consumer-facing docs**; the post-publish CDN check is #19.

- **`packages/core/test/dist-smoke.test.ts`** — exercises the *built* package the way npm/CDN
  consumers get it: `package.json` is `type: module`, `sideEffects: false`, `exports` point at
  files that exist, `files` ships `dist` + README, and the only runtime deps are `aria-query` +
  `dom-accessibility-api`; the bundle is ESM, imports exactly those two specifiers (so jsDelivr's
  `+esm` can bundle them), contains no Node (`require`, `process`, `Buffer`) or network (`fetch`,
  `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `navigator`) globals, and stays under 32 KB (an
  accidentally bundled dep would be an order of magnitude larger); and `linearize()` imported from
  `dist/index.js` produces the same output as the source on a DOM. It throws a clear error if
  `dist/` is missing rather than passing vacuously.
- **Build before test:** root `verify` is now `typecheck && lint && build && test`, and the CI job
  runs Build before Test, because the smoke test needs the bundle.
- **`packages/core/README.md`** rewritten — it still described `linearize` as a placeholder and
  advertised a removed `implicitRole` export. Now: install (npm/pnpm/CDN), a quickstart with the
  *actual* engine output for a realistic snippet (captured from a run, not typed by hand), how to
  read roles/names/levels/flags, the API shape, scope and deferrals, guarantees (no network,
  deps + licences), status. Root README's pre-alpha note updated (SPEC-001 has landed; 0.1.0 pending).
- **Verified, not changed:** `pnpm pack` of `packages/core` ships `dist/index.js`, `index.js.map`,
  `index.d.ts`, `package.json`, `README.md` and — pulled in automatically by pnpm from the
  workspace root — `LICENSE`. The ESM bundle is 10.1 KB with deps externalised.
- **SPEC-001 backfill:** §7 task line and §8 AC-7 row now point at the dist smoke fixture.

No new changeset: the published-code change is the README (shipped in the package), covered by
the pending `minor` changeset for the first release.

## Tests

`pnpm verify` green: typecheck · eslint 10 · build (ESM + DTS) · vitest 4 — 5 files, 50 tests
(47 passed, 3 expected-fail pins). The three new dist tests pass; the root `tsconfig` also
typechecks the test file.

## Self code review

Low-leverage change (tests + docs + CI step order; no engine code). Inline Stage 5.5 pass:
- The smoke test cannot false-pass: missing `dist` throws; the import-specifier check uses the
  bundle text, not `package.json`; the size budget guards against silent dep bundling.
- README claims cross-checked against `index.ts`/`types.ts` and the fixture suite (example output
  is a verbatim run; `alt=""` omission, `role=heading` default level, nested-element emission).
- No network globals introduced anywhere; `dist` cleanliness is now asserted, not assumed.
- CI step reorder touches a different hunk of `ci.yml` than PR #40 (cache/frozen-lockfile); if #40
  merges first this PR needs "Update branch" (strict status checks), no manual conflict expected.

## State at end of session

Branch pushed, PR opened for operator review. Closes #5 on merge.

## Hand-off notes

1. Operator: merge PR #40 (#12) and this PR; order does not matter beyond an "Update branch".
2. **Add the `NPM_TOKEN` repo secret.** The next push to `main` then opens the "Version Packages"
   PR (0.0.0 → 0.1.0); merging it publishes with provenance.
3. #19 after publish: load `https://cdn.jsdelivr.net/npm/screen-reader-mirror/+esm` and
   `https://unpkg.com/screen-reader-mirror?module` in a real browser against the README quickstart.
4. #6 (broader golden fixtures) is independent and can start any time.
