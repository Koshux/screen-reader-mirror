---
applyTo: "packages/core/**/*.ts"
---

# Core engine rules (auto-loaded for `packages/core`)

Canonical: [`.claude/rules/infrastructure.md`](../../.claude/rules/infrastructure.md) +
[`accessibility.md`](../../.claude/rules/accessibility.md).

- **No network, ever.** No `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`,
  remote `import()`, or third-party SDK. ESLint + a hook enforce this. If you think core needs
  the network, you're in the wrong package — that belongs in `cli`/`web`.
- **Host-agnostic & offline.** Operate on a passed-in `Element`/`Node`. Don't assume a browser
  global or a framework. Must build and run offline after install.
- **Reuse, don't re-derive.** Accessible name/role → `dom-accessibility-api` + `aria-query`.
  Hand-roll only the genuinely-new parts (linearization, verbosity profiles, mismatch heuristics).
- **Small, documented public API.** Export a coherent surface. Keep it tree-shakeable
  (`"sideEffects": false`) and CDN-consumable (ESM). An API-shape change needs an ADR + a
  semver-appropriate changeset.
