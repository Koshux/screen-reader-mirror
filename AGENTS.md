# screen-reader-mirror — Agent Operating Manual

This file is the **single source of truth** for AI coding agents working in this repo. It is
read natively by **GitHub Copilot** (`AGENTS.md` is supported as workspace instructions) and
**Claude Code** (which reads `AGENTS.md`/`CLAUDE.md` from the project root). Do **not** fork
this into a divergent `copilot-instructions.md` or `CLAUDE.md` — those files exist only as
thin pointers back here, plus tool-specific layout notes.

> **Project:** `screen-reader-mirror` — a zero-install, client-side tool that shows what a
> screen reader interprets from a UI, side-by-side with the visual view, and highlights
> semantic mismatches. Distributed as an npm package + CDN bundle first, then a browser
> extension, CLI, and hosted demo. See [README.md](README.md) and
> [docs/project/roadmap.md](docs/project/roadmap.md).

---

## 1. Hard rules (do not break)

1. **Client-side only; no data leaves the machine.** The `core` engine must never make a
   network request (`fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, image-pixel beacons,
   third-party SDKs). This is the GDPR/regulated-sector guarantee. It is enforced by ESLint
   and a Claude hook — do not work around either. See
   [ADR-0001](docs/decisions/ADR-0001-infrastructure-first-no-vendor-lock-in.md).
2. **No vendor lock-in, no telemetry.** No required SaaS, API keys, accounts, analytics, or
   private registries. Public npm registry + standard web platform APIs only.
3. **Every meaningful change goes through the SDLC** in §3 — journey + spec + log. No
   "drive-by" features. (Trivial fixes have an explicit fast path — see
   [effort-discipline](.claude/rules/effort-discipline.md).)
4. **Agents never merge to `main`.** Agents branch, implement, test, self-review, and open a
   PR. A human (the maintainer) reviews and merges. See [GOVERNANCE.md](GOVERNANCE.md).
5. **Tests are required** for any new engine behaviour. Each acceptance criterion in a spec
   maps to at least one test. See §5.
6. **Never delete files in [docs/logs/](docs/logs/)** — they are the audit trail and the only
   cross-session recovery mechanism.
7. **Accessibility correctness is the product.** Follow [AccName 1.2](https://www.w3.org/TR/accname-1.2/)
   and WAI-ARIA; prefer the battle-tested `dom-accessibility-api` and `aria-query` over
   re-deriving algorithms. A subtly wrong accessible-name computation is a defect, not a nit.
8. **This is a Windows-first dev environment.** Author cross-platform code and scripts. Do not
   assume WSL or a POSIX-only toolchain. (Unlike some sibling repos, PowerShell is fine here.)

---

## 2. Project structure

```
packages/
  core/         # @ the npm package `screen-reader-mirror` — the shared, client-side
                #   AX-tree + linearization engine. No network, no DOM-host assumptions
                #   beyond a standard `Node`/`Element`. Published to npm + CDN.
  extension/    # Chrome/Edge MV3 extension (planned) — thin UI over core
  cli/          # `npx screen-reader-mirror <url>` (planned) — Playwright/CDP host over core
  web/          # Hosted demo (planned) — paste HTML / public URL
docs/
  sdlc/         # The playbook (how we work)
  journeys/     # JNY-XXX — the "why" (user journeys)
  specs/        # SPEC-XXX — the "what" (technical specs + acceptance criteria + test plan)
  logs/         # YYYY-MM-DD-* — the "what was done" (audit trail, never deleted)
  decisions/    # ADR-XXXX — architecture decision records
  architecture/ # System overview & deeper design notes
  project/      # roadmap, board, and the fully-defined task backlog
.claude/        # Claude Code: settings, rules, hooks, skills, subagents
.github/        # Copilot instructions/prompts/agents/skills + repo machinery (CI, templates, CODEOWNERS)
scripts/        # One-off operator scripts (e.g. GitHub project setup)
```

---

## 3. The SDLC

Every spec-backed feature follows this lifecycle. Full reference:
[docs/sdlc/README.md](docs/sdlc/README.md). Match rigor to leverage
([effort-discipline](.claude/rules/effort-discipline.md)) — trivial doc/typo/one-line fixes
take the fast path (small PR, no journey/spec).

```
┌─────────┐  ┌──────┐  ┌─────────────┐  ┌────────┐  ┌───────────┐  ┌──────┐  ┌─────────────┐  ┌────┐  ┌──────────────┐  ┌───────┐
│ Journey │→ │ Spec │→ │ Spec review │→ │ Branch │→ │ Implement │→ │ Test │→ │ Self-review │→ │ PR │→ │ Operator rev │→ │ Merge │
└─────────┘  └──────┘  └────(2.5)─────┘  └─from──┘  └───────────┘  └──────┘  └───(5.5)─────┘  └────┘  └──────────────┘  └───────┘
  /journey    /spec     spec-review skill   main      (default)     /test    code-review skill        (human only)        + /log
```

| Stage | Output | Owner |
|---|---|---|
| 1. Journey | `docs/journeys/JNY-XXX-*.md` | journey-author |
| 2. Spec | `docs/specs/SPEC-XXX-*.md` | spec-author |
| 2.5. Spec review (mandatory, non-trivial) | review notes folded into the spec | spec-review skill |
| 3. Branch from `main` | `feat/SPEC-XXX-<slug>` | implementer |
| 4. Implement | code under `packages/**` | implementer |
| 5. Test | tests under `packages/**`, all green | test-author |
| 5.5. Self code review (mandatory, before push) | findings resolved on the branch | code-review skill |
| 6. Operator review | PR approved | **human maintainer only** |
| 7. Merge + Log | `docs/logs/YYYY-MM-DD-*.md` | maintainer + log-keeper |

**SDLC integrity:** never skip or reorder stages; code-before-spec is not allowed (except the
trivial fast path). Always branch from latest `main`, never from another feature branch.
Never commit directly to `main`. The two review gates (2.5 before code, 5.5 before push) exist
so the human operator review finds design/behaviour issues, not avoidable bugs.

IDs are the next free number: `JNY-001`, `SPEC-001`, `ADR-0001`. The log at the end of a
session is mandatory — it is how the next agent (or human) recovers context.

---

## 4. Build & run

| Task | Command |
|---|---|
| Install | `corepack enable && pnpm install` |
| Type-check | `pnpm typecheck` |
| Lint | `pnpm lint` (`pnpm lint:fix` to autofix) |
| Unit tests | `pnpm test` (watch: `pnpm test:watch`) |
| Coverage | `pnpm test:coverage` |
| Build all packages | `pnpm build` |
| Full gate (CI parity) | `pnpm verify` |
| Add a changeset | `pnpm changeset` |

Run `pnpm verify` before declaring a task complete or opening a PR. There is **no** dev
server, Docker, or database — this is a client-side library.

---

## 5. Testing strategy

| Layer | Tool | Use for |
|---|---|---|
| Unit | Vitest (node) | Pure engine functions: role/name computation, linearization, mismatch heuristics |
| DOM / component | Vitest + jsdom (or `@happy-dom`) | Engine against real DOM fixtures |
| Golden fixtures | HTML-in / linearized-out snapshots | Regression-proofing real-world markup patterns |
| Extension/web e2e | Playwright (later targets) | Real browser; the extension and hosted demo |

Every acceptance criterion in a spec maps to at least one test. Prefer **golden HTML
fixtures** (a snippet of markup → the expected linearized interpretation) — they document
intent and catch regressions. Use Chrome DevTools / Playwright for *exploratory* debugging
only, never as a substitute for a committed test.

---

## 6. Code conventions

- **TypeScript, `strict`.** Small, pure, well-named functions. `useXxx`-style is not relevant
  here — this is a library, not an app.
- **Core stays host-agnostic and offline.** `packages/core` may touch a passed-in `Element`/
  `Node` but must not assume a browser global, must not make network calls, and must not
  depend on a specific framework.
- **Reuse, don't re-derive.** Accessible-name/role computation → `dom-accessibility-api` +
  `aria-query`. PDF tags → `pdf.js`. Only hand-roll where no maintained library exists (the
  linearization/reading-order and mismatch heuristics are genuinely new — those are ours).
- **Public API is a contract.** Export a small, documented surface from `packages/core`.
  Breaking changes require a `major` changeset and an ADR if the shape changes meaningfully.
- **No copy/strings hard-coded for announcements** without a verbosity-profile abstraction —
  NVDA/JAWS/VoiceOver phrasing differs and must be pluggable (see roadmap Phase 2).

---

## 7. Agent behaviour expectations

- **Read before you write.** Open the relevant spec under [docs/specs/](docs/specs/) before
  editing code.
- **One task, one log.** Append a log under [docs/logs/](docs/logs/) at the end of every
  working session — even abandoned attempts. A Claude hook enforces this when there are
  uncommitted changes.
- **Use the specialist subagents** for their domain ([.claude/agents/](.claude/agents/) /
  [.github/agents/](.github/agents/)). Prefer the `sdlc-workflow` skill when starting a new
  feature from scratch.
- **Don't tangent.** Solve the actual request; surface adjacent work as a new task rather than
  expanding scope ([effort-discipline](.claude/rules/effort-discipline.md)).
- **Confirm before destructive or outward-facing ops** (deleting files, `git reset`,
  force-push, history rewrite, publishing, creating remote resources).
- **Never merge to `main`.** Open a PR and hand off to the maintainer.

---

## 8. Dual-tool setup (Copilot + Claude Code)

Both tools share this manual and the SDLC. Their layouts mirror each other:

| Concern | Claude Code | GitHub Copilot |
|---|---|---|
| Operating manual | `AGENTS.md` (+ `CLAUDE.md` pointer) | `AGENTS.md` (+ `.github/copilot-instructions.md` pointer) |
| Operational rules | `.claude/rules/*.md` | folded into `.github/instructions/*.md` |
| File-scoped guidance | (via rules) | `.github/instructions/*.instructions.md` (auto-loaded by glob) |
| Slash workflows | `.claude/skills/*/SKILL.md` | `.github/prompts/*.prompt.md` + `.github/skills/*` |
| Subagents | `.claude/agents/*.md` | `.github/agents/*.agent.md` |
| Enforcement | `.claude/hooks/*.cjs` + `.claude/settings.json` | `.github/hooks/` (policy JSON) |

Keep the mirrored files aligned: if you change a rule's substance, update both sides.

---

## 9. Pointers

- SDLC playbook → [docs/sdlc/README.md](docs/sdlc/README.md)
- Roadmap → [docs/project/roadmap.md](docs/project/roadmap.md) · Task backlog → [docs/project/tasks.md](docs/project/tasks.md)
- Architecture → [docs/architecture/overview.md](docs/architecture/overview.md)
- Templates → [journey](docs/journeys/_TEMPLATE.md) · [spec](docs/specs/_TEMPLATE.md) · [log](docs/logs/_TEMPLATE.md) · [ADR](docs/decisions/_TEMPLATE.md)
- Core rules → [core-workflow](.claude/rules/00-core-workflow.md) · [effort-discipline](.claude/rules/effort-discipline.md) · [infrastructure](.claude/rules/infrastructure.md) · [accessibility](.claude/rules/accessibility.md) · [testing](.claude/rules/testing.md)
- Governance & merge rules → [GOVERNANCE.md](GOVERNANCE.md) · Contributing → [CONTRIBUTING.md](CONTRIBUTING.md)
