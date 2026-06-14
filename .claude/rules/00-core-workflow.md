# Core Workflow Rules

- Treat [`AGENTS.md`](../../AGENTS.md) and `docs/sdlc/README.md` as canonical. Keep these rule
  files concise and directive — link to canonical docs instead of duplicating policy.
- Prefer minimal, focused changes over broad refactors. Match rigor to leverage
  (see [`effort-discipline.md`](effort-discipline.md)).
- Run only the checks relevant to the task. `pnpm typecheck` is cheap; a full test/coverage
  run is not — scope tests to what changed.
- Do not assume success. Verify with targeted tests and by reading the actual output.
- Never revert unrelated user changes.
- **Author cross-platform.** This is a Windows-first environment; PowerShell is fine. Don't
  hard-code POSIX-only paths or assume WSL. Scripts that must run in CI should be Node or
  portable shell.
- If a task touches accessibility computation, read [`accessibility.md`](accessibility.md)
  first. If it touches publishing/distribution, read [`distribution.md`](distribution.md).

## Feature SDLC (the lifecycle)

Every spec-backed feature follows this — **do not skip or reorder**. Full reference in
`docs/sdlc/README.md`.

1. **Journey** — capture the user's "why" in `docs/journeys/JNY-XXX-*.md`.
2. **Spec** — the contract in `docs/specs/SPEC-XXX-*.md`: acceptance criteria, file changes,
   task list, test plan (every AC mapped to a test).
3. **2.5 Spec review** — run the `spec-review` skill on the journey + spec *before* coding:
   verify it extends existing code rather than duplicating it, threat-model the design,
   gap-analyse, and resolve every HIGH in the spec. Non-skippable except trivial doc-only specs.
4. **Branch** — `git fetch origin && git checkout main && git pull && git checkout -b feat/SPEC-XXX-<slug>`.
   Always from latest `main`; never from another feature branch.
5. **Implement** — code only after steps 1–4, on the active branch.
6. **Test** — unit + DOM/fixture tests; all green; coverage where it matters.
7. **5.5 Self code review** — run the `code-review` skill on `git diff origin/main...HEAD`
   before push. Resolve every HIGH on the same branch (or file a follow-up task). Record the
   pass in the implementation log under `## Self code review`. Non-skippable except trivial
   single-line/doc-only changes.
8. **Operator review** — open a PR; the **human maintainer** reviews and merges. Agents never
   merge to `main`.
9. **Log + backfill** — write `docs/logs/YYYY-MM-DD-*.md`; backfill the journey/spec if
   implementation clarified anything.

### Integrity rules

- Code before spec is not allowed (except the trivial fast path in `effort-discipline.md`).
- Never commit directly to `main`; never push `--force`.
- The implementation log lives on the feature branch, not `main`.
- The two review gates (2.5 before code, 5.5 before push) exist so the human review at stage 8
  finds design issues, not avoidable bugs. A spec or push without its recorded review pass is
  a process error.

**Why this matters:** branching from `main` and merging only via operator review keeps history
linear and every feature independently reviewable. Skipping stages breaks traceability and
makes rollback harder.
