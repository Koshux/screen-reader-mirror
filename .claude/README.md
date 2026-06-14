# `.claude/` — Claude Code configuration

This directory configures Claude Code for the repo. The canonical operating manual is
[`../AGENTS.md`](../AGENTS.md); everything here is the Claude-native layer that points back to
it.

| Path | What it is |
|---|---|
| `settings.json` | Permissions + always-on enforcement hooks (shared, committed). |
| `settings.local.json` | Machine-local overrides (git-ignored; create as needed). |
| `rules/` | Concise operational rules, loaded as context. Mirror of `.github/instructions/`. |
| `hooks/` | Node scripts that enforce policy (log discipline, no-telemetry, test scope). |
| `skills/` | Reusable slash-invocable workflows (`/sdlc-workflow`, `/spec-review`, …). |
| `agents/` | Specialist subagents the main thread can delegate to. |

Keep `rules/` and `.github/instructions/` aligned in substance — Claude reads the former,
Copilot the latter.
