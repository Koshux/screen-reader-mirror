# Governance

This project is small and deliberately structured so that a second contributor can join,
do well-defined work, and ship it safely through review. This document defines **who can do
what**, and is the human-readable companion to the machine-enforced rules in
[`.github/CODEOWNERS`](./.github/CODEOWNERS) and branch protection.

## Roles

### Maintainer (project owner)

Currently: **James Lanzon** ([@Koshux](https://github.com/Koshux)).

The maintainer:

- Owns the roadmap, the SDLC, and the GitHub Project board.
- Is the sole **code owner** (see `.github/CODEOWNERS`) — every PR requires their review.
- Is the only person who **merges to `main`**.
- May self-approve and merge their own PRs (branch protection allows the maintainer to
  satisfy the review requirement on their own branches). This keeps the maintainer fast
  while still routing everything through a PR.
- Triages issues, assigns tasks, and cuts releases.

### Contributor

Anyone else, including the founding collaborator.

A contributor:

- Works on a **task from the board** (or an issue they opened and got assigned).
- Works on a **feature branch**, never directly on `main`.
- Opens a **pull request**, which is **blocked until the maintainer reviews and approves it**.
- **Cannot self-approve or merge.** Branch protection requires a review from a code owner,
  and contributors are not code owners.
- Is credited in the changelog and release notes.

## The merge rule (the heart of task 5)

> **No code reaches `main` without a PR. Contributor PRs require the maintainer's approving
> review before they can be merged. The maintainer may approve and merge their own PRs.**

This is enforced by, in combination:

1. **Branch protection on `main`** — no direct pushes; PR required; ≥1 approving review
   required; stale approvals dismissed on new commits; required status checks (CI) must pass.
2. **`CODEOWNERS`** — the maintainer owns `*`, so "require review from Code Owners" routes
   every PR to them.
3. **CI** — `typecheck`, `lint`, `test`, and `build` must be green before merge.

The exact `gh` commands to apply this are in
[`scripts/setup-github.sh`](./scripts/setup-github.sh).

## Decision-making

- **Technical decisions** of consequence are recorded as ADRs in
  [`docs/decisions/`](./docs/decisions/). Disagreement is resolved by the maintainer after
  discussion on the PR or issue.
- **Scope** is governed by the journey + spec for each feature. If a contributor sees
  adjacent work, they surface it as a new issue/task rather than expanding a PR's scope
  (see [`.claude/rules/effort-discipline.md`](./.claude/rules/effort-discipline.md)).

## Becoming a maintainer

Sustained, high-quality contribution can lead to an invitation to co-maintain (added to
`CODEOWNERS` and given merge rights). This is at the current maintainer's discretion.
