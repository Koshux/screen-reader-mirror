# Infrastructure Rules — client-side, no lock-in, GDPR-safe

These rules encode the project's reason for existing in a regulated/EU context. They are
non-negotiable. See [ADR-0001](../../docs/decisions/ADR-0001-infrastructure-first-no-vendor-lock-in.md).

## Client-side only (the GDPR guarantee)

- `packages/core` **must not** perform any network I/O: no `fetch`, `XMLHttpRequest`,
  `WebSocket`, `navigator.sendBeacon`, `new Image().src = remoteUrl` beacons, dynamic
  `import()` of a remote URL, or third-party SDK that phones home.
- No telemetry, analytics, crash reporting, A/B frameworks, or "anonymous usage stats" —
  anywhere, in any target, ever, even opt-in by default. If a future target genuinely needs
  network access (the CLI fetching a URL the user typed; the hosted demo), it is **explicit,
  user-initiated, documented in that package's README, and never retains content**.
- Enforcement is layered, not trust-based: ESLint (`no-restricted-globals` in core) +
  the `block-no-telemetry` Claude hook + code review. Do not disable or work around them — if
  a rule is genuinely wrong, change the rule in a PR with justification.

## No vendor lock-in

- Public npm registry only (`.npmrc` pins it). No private registry, no paid SaaS dependency,
  no required API key or account to use the tool.
- Standard web-platform and Node APIs first. Prefer maintained, permissively-licensed OSS
  (MIT/Apache/BSD/ISC) — avoid copyleft *runtime* deps that would complicate redistribution.
  `dom-accessibility-api`, `aria-query`, `pdf.js` are all fine.
- The tool must be runnable and buildable offline after install, on any OS, with no proprietary
  toolchain.

## Distribution must stay frictionless

- The primary artifact (`core`) ships to npm **and** is consumable from a CDN
  (jsDelivr/unpkg) with no build step — keep an ESM bundle that works via
  `import "https://cdn.jsdelivr.net/npm/screen-reader-mirror/+esm"`.
- Keep install weight low and dependency count small; every runtime dep is a supply-chain and
  procurement surface for a regulated user.
- See [`distribution.md`](distribution.md) for the publish mechanics.

## Licensing hygiene

- The project is MIT. Don't add a runtime dependency whose license is incompatible with MIT
  redistribution. When adding any dependency, note its license in the PR description.
