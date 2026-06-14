# Changesets

This folder holds [changesets](https://github.com/changesets/changesets) — small
markdown files describing version bumps. They power automated, traceable releases to
npm (and from there, jsDelivr/unpkg via CDN).

**Every PR that changes published code must include a changeset.** Run:

```bash
pnpm changeset
```

Pick the affected package(s) and a semver bump (patch / minor / major), write a one-line
human-readable summary, and commit the generated file. The release workflow consumes
these to bump versions, write the changelog, tag, and publish.

Packages listed under `ignore` in `config.json` (the extension and hosted web app) are
not published to npm and do not need changesets.
