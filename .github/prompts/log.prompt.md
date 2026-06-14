---
description: "SDLC Stage 7 — write the implementation log under docs/logs/. The session is not complete without it."
mode: agent
---

You are at **Stage 7**: the implementation log.

1. Read [docs/logs/_TEMPLATE.md](../../docs/logs/_TEMPLATE.md).
2. Ground the summary in `git diff --stat origin/main...HEAD` / `git status` — don't invent.
3. Write `docs/logs/<YYYY-MM-DD>-<slug>.md` filling every section: what changed & why, the
   spec/branch, test results, the `## Self code review` pass, **State at end of session**, and
   **Hand-off notes** (the key recovery field).
4. Record honestly — if tests failed or a step was skipped, say so.

Prefer delegating to the `log-keeper` agent. Return the log path and a two-line state summary.
