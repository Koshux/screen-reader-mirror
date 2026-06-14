# Contributing to screen-reader-mirror

Thanks for helping make accessibility testing easier for everyone. This project follows a
lightweight but real SDLC so that work is traceable and a contributor can pick up a
well-defined task and ship it through review. Please skim this before your first PR.

## TL;DR

1. Pick a task from the [board](./docs/project/tasks.md) (or open an issue and get it assigned).
2. Branch from `main`: `git checkout main && git pull && git checkout -b feat/<spec>-<short-name>`.
3. Make the change following the spec's acceptance criteria.
4. `pnpm verify` (typecheck + lint + test) must be green.
5. Add a changeset if you touched published code: `pnpm changeset`.
6. Open a PR using the template. **It will be merged only after the maintainer reviews it.**

## Prerequisites

- **Node ≥ 20** (`.nvmrc` pins the major). **pnpm 9** (`corepack enable` then `pnpm i`).
- That's it. No Docker, no database, no cloud account — this is a client-side TypeScript tool.

```bash
corepack enable
pnpm install
pnpm verify          # typecheck + lint + test, the same gate CI runs
```

## The SDLC (how a change flows)

Full playbook: [`docs/sdlc/README.md`](./docs/sdlc/README.md). In short:

```
Journey ─▶ Spec ─▶ Spec review ─▶ Branch ─▶ Implement ─▶ Test ─▶ Self-review ─▶ PR ─▶ Operator review ─▶ Merge ─▶ Log
```

- **Journeys** (`docs/journeys/JNY-XXX-*.md`) capture *why* a user needs something — no
  implementation detail.
- **Specs** (`docs/specs/SPEC-XXX-*.md`) capture *what* to build: acceptance criteria, file
  changes, a task list, and a test plan where every acceptance criterion maps to a test.
- **Logs** (`docs/logs/YYYY-MM-DD-*.md`) capture *what was done*, for cross-session recovery.

Small fixes (typos, comments, a one-line bug) skip straight to a PR — see
[`.claude/rules/effort-discipline.md`](./.claude/rules/effort-discipline.md). Match the
ceremony to the size of the change.

## Branch naming

`<type>/<spec-or-issue>-<short-slug>`, e.g. `feat/SPEC-001-linearize-core`,
`fix/142-accname-empty-alt`, `docs/board-tasks`. Types: `feat`, `fix`, `docs`, `chore`,
`test`, `refactor`.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`, e.g.
`feat(core): linearize headings in reading order (SPEC-001)`. Reference the spec/issue.

## Pull requests

- One logical change per PR. Keep it reviewable.
- Fill in the PR template (what/why, linked spec or issue, test evidence, changeset).
- CI (`typecheck`, `lint`, `test`, `build`) must pass.
- **Contributors:** your PR requires an approving review from the maintainer before it can be
  merged. You cannot self-merge — this is intentional (see [`GOVERNANCE.md`](./GOVERNANCE.md)).
- Address review feedback by pushing new commits (don't force-push over review history unless asked).

## Changesets (versioning & release)

If your change affects a **published** package (`packages/core`), add a changeset so the
release is versioned and shows up in the changelog:

```bash
pnpm changeset
```

Pick the package, the semver bump, and write a one-line user-facing summary. The extension
and hosted web app are not published to npm and don't need one.

## Code style

- TypeScript, `strict` mode. Prefer small, pure, well-named functions.
- The **core engine must never make a network call** — it runs fully client-side. ESLint
  enforces this; don't work around it.
- Accessibility correctness is the product. When in doubt, follow the
  [AccName 1.2](https://www.w3.org/TR/accname-1.2/) and WAI-ARIA specs, and lean on
  `dom-accessibility-api` / `aria-query` rather than re-deriving the algorithms.
- Run `pnpm lint:fix` before pushing.

## Reporting bugs / proposing features

Use the [issue templates](./.github/ISSUE_TEMPLATE/). For anything security- or
privacy-sensitive, see [`SECURITY.md`](./SECURITY.md) instead of opening a public issue.

By contributing, you agree your contributions are licensed under the project's
[MIT license](./LICENSE).
