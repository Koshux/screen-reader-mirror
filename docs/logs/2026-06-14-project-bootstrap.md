---
date: 2026-06-14
spec: n/a # project bootstrap (M0), pre-SDLC
branch: main
status: complete
---

# Log — 2026-06-14 — project bootstrap (M0)

## What changed & why

Stood up the `screen-reader-mirror` project from an empty directory. Synthesised the AI/SDLC
setup as the "best of both worlds" from two existing repos:

- **From Portfolio:** the unified `AGENTS.md` single-source-of-truth (one manual for Copilot +
  Claude Code), the clean Journey → Spec → Implement → Test → Log phase model with `docs/`
  templates + specialist subagents + the `sdlc-workflow` orchestrator skill, and the Pages deploy
  pattern.
- **From dam-jam:** the concise `.claude/rules/` layer, enforcement **hooks**, the two review
  **gates** (Stage 2.5 spec-review before code, Stage 5.5 code-review before push),
  `effort-discipline`, and the "agents never merge to `main`; operator reviews & merges" model —
  which maps directly onto the contributor-PR-gating requirement.

Then retargeted all of it to this project's reality (a client-side TS a11y toolkit, not a Nuxt
site or a Docker/Prisma monorepo): added an `infrastructure` rule + a `block-no-telemetry` hook
encoding the GDPR/client-side guarantee, an `accessibility` rule, and a `distribution` rule.
Dropped dam-jam's `block-powershell` hook (this is a Windows-first env; PowerShell is fine).

Scaffolded the pnpm-workspaces monorepo: `packages/core` (the published engine, real `implicitRole`
+ a placeholder `linearize` pending SPEC-001), and stubs for `extension`/`cli`/`web`. Added MIT
license, governance/contribution/security/CoC docs, GitHub machinery (CODEOWNERS, issue/PR
templates, labels, dependabot, CI/release/Pages workflows, branch-protection + board setup
script), the SDLC docs + templates, three founding ADRs, JNY-001, SPEC-001, the roadmap, and the
task backlog.

## Tests

`pnpm verify` run locally and green:

- `pnpm typecheck` — pass (core).
- `pnpm lint` — pass (0 errors; fixed a flat-config gap so the `.cjs` Node hooks lint cleanly).
- `pnpm test` — pass (3 tests in `packages/core`).
- `pnpm build` — pass (tsup → `dist/index.js` 565 B ESM + `index.d.ts`).

The three Claude hooks were smoke-tested directly (block-no-telemetry blocks a core `fetch`;
allows it in cli + in a core test fixture; the log hook correctly fires when changes lack a log).

## Self code review

n/a for the bootstrap scaffold itself (no spec). The first real Stage-5.5 pass happens on the
SPEC-001 implementation branch. Known follow-ups captured as board tasks (notably: commit the
pnpm lockfile + enable CI cache → T7).

## State at end of session

- Repo is `git init`'d and (this commit) committed locally on `main`. **Not pushed** — by design;
  the user chose "scaffold locally first".
- `npm` name `screen-reader-mirror` confirmed available.
- Toolchain validated end-to-end locally with Node 20 + pnpm 9.12.0.

## Hand-off notes (do this next)

1. **Review the scaffold**, especially `AGENTS.md`, `GOVERNANCE.md`, and `docs/sdlc/README.md`.
2. **Confirm the GitHub owner/handle** — everything assumes `Koshux/screen-reader-mirror`
   (inferred from the Portfolio remote). Change `OWNER`/`REPO` in `scripts/setup-github.sh` and the
   repo URLs if you want a different account/org.
3. **Publish when ready:** `gh auth login` (+ `gh auth refresh -s project`), then
   `scripts/setup-github.sh all` — creates the repo, pushes, applies labels + branch protection,
   creates the board, and seeds the M1 issues.
4. **Invite the collaborator** as a *non-admin* (Settings → Collaborators). Branch protection +
   CODEOWNERS then blocks their PRs on your review while letting you self-merge.
5. **First real work:** task T7 (commit lockfile, enable CI cache) and T1 (Stage-2.5 review of
   SPEC-001) — both good first issues.
