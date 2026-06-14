# GitHub Copilot — screen-reader-mirror

The canonical operating manual is [`AGENTS.md`](../AGENTS.md) at the repo root, which Copilot
reads as workspace instructions. This file is a thin pointer plus the Copilot-specific layout.
**Do not** duplicate policy here — extend `AGENTS.md` and the file-scoped instructions instead.

## The five things to never get wrong

1. **Client-side only.** `packages/core` makes no network calls — ever. Page content never
   leaves the machine (the GDPR/regulated-sector guarantee). See [ADR-0001](../docs/decisions/ADR-0001-infrastructure-first-no-vendor-lock-in.md).
2. **No vendor lock-in / no telemetry.** Public npm registry, standard web APIs, MIT. No SaaS,
   keys, accounts, or analytics.
3. **SDLC, not ad-hoc.** Journey → Spec → Spec-review → Branch → Implement → Test → Self-review
   → PR → Operator review → Merge → Log. Trivial fixes take the fast path.
4. **Agents never merge to `main`.** Branch, PR, and hand off to the human maintainer.
5. **Accessibility correctness is the product.** Follow AccName 1.2 / WAI-ARIA; reuse
   `dom-accessibility-api` + `aria-query` rather than re-deriving.

## Copilot-specific layout

| Concern | Where |
|---|---|
| File-scoped rules (auto-loaded by glob) | `.github/instructions/*.instructions.md` |
| Slash workflows | `.github/prompts/*.prompt.md` (`/journey`, `/spec`, `/implement`, `/test`, `/log`, `/adr`) |
| Custom agents | `.github/agents/*.agent.md` |
| Bundled skills | `.github/skills/*/SKILL.md` |

## Copilot's role in the SDLC

Both Copilot and Claude Code share `AGENTS.md`. Use whichever tool you prefer for any stage; the
gates (Stage 2.5 spec-review before code, Stage 5.5 code-review before push) and the rule
"only the human maintainer merges to `main`" apply identically regardless of tool. When a stage
maps to a specialist, prefer the matching agent (`@spec-author`, `@reviewer`, …) or prompt.

Full detail: [`AGENTS.md`](../AGENTS.md) and the canonical rules in
[`.claude/rules/`](../.claude/rules/) (kept aligned with `.github/instructions/`).
