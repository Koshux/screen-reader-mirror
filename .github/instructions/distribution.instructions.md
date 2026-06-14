---
applyTo: "**/package.json"
---

# Distribution & release rules (auto-loaded for manifests)

Canonical: [`.claude/rules/distribution.md`](../../.claude/rules/distribution.md).

- Any change to **published** code (`packages/core`) needs a **changeset** (`pnpm changeset`).
- `core` must stay CDN-consumable with no build step: ship a proper `exports` map (ESM + types),
  keep `"sideEffects": false`.
- Keep the runtime dependency surface minimal and MIT-compatible — each dep is a procurement and
  supply-chain surface for regulated users. Note a new dep's license in the PR.
- Semver: an API-shape change is ≥ `minor`; a breaking change is `major` + an ADR.
- The extension and web app are **not** published to npm (they're in `ignore` in
  `.changeset/config.json`).
