# Distribution & Release Rules

The tool's reach is the point — developers must be able to get it via npm, CDN, an extension,
or a CLI with zero friction. Releases are automated and traceable.

## Versioning & release (changesets)

- Any PR that changes **published** code (`packages/core`) includes a **changeset**
  (`pnpm changeset`) — pick the package, the semver bump, and a one-line user-facing summary.
- Releases are cut by the `release` workflow from accumulated changesets: it versions, writes
  the changelog, tags, and publishes to npm with **provenance** (`.npmrc` sets it).
- Semver discipline: a change to the public `core` API shape is at least `minor`; a breaking
  change is `major` and needs an ADR.
- The **extension** and **web** packages are not published to npm (they're in `ignore` in
  `.changeset/config.json`); they ship via the Chrome Web Store and GitHub Pages respectively.

## CDN

- `core` must stay consumable with no build step from jsDelivr/unpkg:
  `import { … } from "https://cdn.jsdelivr.net/npm/screen-reader-mirror/+esm"`.
- Ship a proper `exports` map (ESM + types; CJS only if needed) and keep a tree-shakeable,
  side-effect-free build (`"sideEffects": false`).

## Supply-chain hygiene

- Publishing requires green CI and a clean `pnpm verify`. Never publish from a dirty tree.
- Provenance + npm 2FA on the maintainer account. No publish tokens in the repo; release runs
  use a scoped CI secret (`NPM_TOKEN`) configured in GitHub, never committed.
- Keep the runtime dependency surface minimal — each dep is a procurement and security surface
  for regulated users.

## Who publishes

- **Agents never publish.** Cutting a release and creating remote resources is an operator
  action. Agents prepare changesets and open PRs; the maintainer runs the release.
