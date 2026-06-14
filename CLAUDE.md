# Claude Code — screen-reader-mirror

The operating manual for this repo is [`AGENTS.md`](AGENTS.md) at the root. Claude Code reads
`AGENTS.md` natively, so it is **not** duplicated here. This file only records the
Claude-specific layout and a few defaults.

## Start here

1. Read [`AGENTS.md`](AGENTS.md) — hard rules, SDLC, conventions.
2. For the task's domain, read the relevant rule in [`.claude/rules/`](.claude/rules/).
3. For a new feature from scratch, prefer the `sdlc-workflow` skill.

## Claude-specific layout

- `.claude/rules/*.md` — concise, Claude-native operational rules (the layer Copilot keeps in
  `.github/instructions/`). Substance must stay aligned across both.
- `.claude/skills/*/SKILL.md` — reusable workflows (`sdlc-workflow`, `create-spec`,
  `spec-review`, `code-review`, `security-review`).
- `.claude/agents/*.md` — project subagents (journey-author, spec-author, implementer,
  test-author, reviewer, log-keeper, repo-explorer).
- `.claude/hooks/*.cjs` — always-on enforcement (implementation log, no-telemetry guard,
  selective-test reminder).
- `.claude/settings.json` — shared settings/permissions. Machine-local overrides go in
  `.claude/settings.local.json` (git-ignored).

## Defaults

- Hooks are always-on enforcement.
- `sdlc-workflow`, `spec-review`, and `security-review` are intentional workflows — invoke
  them deliberately. `code-review` may be selected autonomously when a task is clearly
  review-oriented. Specialist subagents may be delegated to when the request matches their
  description.
- **Agents do not merge to `main`** and do not create remote GitHub resources without explicit
  operator approval.
