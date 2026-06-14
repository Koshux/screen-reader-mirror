---
description: "SDLC Stage 4 — implement a spec-reviewed SPEC-XXX on a feature branch. Never merges to main."
mode: agent
---

You are starting **Stage 4**: implementation.

1. Confirm `SPEC-XXX` has a recorded **Stage 2.5 spec-review** pass. If not, stop and run `/spec-review`.
2. Branch from latest `main`: `git fetch origin && git checkout main && git pull && git checkout -b feat/SPEC-XXX-<slug>`.
3. Work the spec's task list in order. Keep changes minimal and focused.
4. Respect the hard rules: **core stays client-side/offline**; reuse `dom-accessibility-api` /
   `aria-query` rather than re-deriving; keep the public API small and tree-shakeable.
5. Run `pnpm typecheck` frequently; scope tests to what changed; add a changeset if published
   code changed.

Prefer delegating to the `implementer` agent. **Do not merge to `main`.** End with:
`Next: /test, then /code-review (Stage 5.5) before opening a PR.`
