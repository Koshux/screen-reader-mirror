# Effort Discipline (Anti-Tangent / Anti-Scope-Creep)

> Spend effort where leverage is high; stay economical where it is low. Avoid burning tokens on
> extra reviews, refactors, and repeated fix loops when a direct answer or quick fix is enough.

## Match rigor to leverage

- **High-leverage** (full rigor — Stage 2.5 spec-review, Stage 5.5 code-review, threat-model,
  golden-fixture tests): the public `core` API surface, the accessible-name/role computation,
  the linearization/reading-order engine, the mismatch heuristics, anything that changes
  published behaviour, and anything that could leak data off-machine.
- **Low-leverage** (do the change, minimal ceremony): typos, comments, copy, a one-line/local
  fix, doc-only edits, renaming a local variable. **Do not** wrap these in a spec or a
  multi-file refactor.
- The Stage 2.5 / 5.5 gates apply to **spec and code artifacts**, not to every question.
  Answer a question as a question.

## Don't tangent

- Solve the **actual** request. Don't auto-launch adjacent reviews, refactors, or "while I'm
  here" cleanups.
- If you notice adjacent work worth doing, **surface it as a new task/issue** (one line) and
  let the operator decide — do not silently expand a PR's scope.
- Don't spawn sub-agents or run full coverage suites unless the task needs it or the operator
  asks.

## Quick-fix-first

- When a quick, obviously-correct fix exists, apply it directly. Reserve the heavy machinery
  (spec, multi-phase plan, deep review) for changes that genuinely warrant it.
- Prefer the smallest change that fits the current architecture. Call out when a request
  should be **split** rather than ballooned into one large change.

## Don't loop on the same problem

- **If the same fix fails twice with the same approach, stop.** Re-read the full failure,
  re-derive the root cause, and try a *fundamentally different* angle — or surface the blocker
  to the operator. Repeating near-identical edits is the most expensive failure mode.
- Distinguish a **setup failure** (deps not installed, wrong Node version) from a real bug
  before changing code.

## When in doubt

- A short clarifying question (or a stated assumption you proceed on) beats a long wrong
  tangent. Don't ask about things the code or sensible defaults already answer; do ask before a
  hard-to-reverse or scope-expanding move.
