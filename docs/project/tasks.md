# Task Backlog

The single, human-readable backlog. Each task is small enough to ship in one PR and has an
**outcome** + **acceptance criteria** so a contributor (or an agent) can pick it up without
guessing. `scripts/setup-github.sh issues` seeds the **M1** tasks here as GitHub issues and adds
them to the Project board; keep this doc and the board roughly in sync.

> **How to take a task:** comment to claim it (or assign yourself), branch from `main`
> (`<type>/SPEC-XXX-<slug>`), follow [the SDLC](../sdlc/README.md), open a PR. The maintainer
> reviews and merges — contributors don't self-merge ([GOVERNANCE.md](../../GOVERNANCE.md)).

Legend — **Size:** XS (<1h) · S (½ day) · M (1–2 days) · L (split me). **🟢 good first issue.**

---

## Board columns (Project board)

`Backlog → Todo (ready) → In progress → In review (PR open) → Done`

A task is **ready** when it has acceptance criteria and any prerequisite spec is approved &
spec-reviewed. `needs: spec` / `needs: spec-review` tasks sit in Backlog until that's done.

---

## M1 — Core engine (npm + CDN)

These implement [SPEC-001](../specs/SPEC-001-core-linearize-foundation.md). Do them in order;
T1 first.

### T1 — Stage 2.5 spec-review of SPEC-001  · S · 🟢 · `needs: spec-review`
- **Outcome:** SPEC-001 is verified against the (scaffold) codebase and marked implementation-ready.
- **AC:** run the `spec-review` skill on SPEC-001 + JNY-001; every HIGH resolved in the spec;
  the API shape in §3 confirmed or amended; a "Self-review applied" note added to the spec header.

### T2 — AT-visibility predicate (`visibility.ts`)  · S · 🟢 · `area: core`
- **Outcome:** a tested predicate deciding whether a node is in the accessibility tree.
- **AC:** excludes `aria-hidden="true"`, `display:none`, `visibility:hidden`, `hidden`; recurses
  correctly into visible descendants; golden fixtures cover each case (SPEC-001 AC-3).

### T3 — `InterpretationNode` types (`types.ts`)  · XS · 🟢 · `area: core`
- **Outcome:** the serialisable node model from SPEC-001 §3.
- **AC:** `role`, `name`, optional `level`, `flags.unnamed`, `flags.missingAlt`; no live DOM node
  references leak into the output type; exported for consumers.

### T4 — `linearize()` traversal  · M · `area: core`
- **Outcome:** `linearize(root)` returns the ordered interpretation.
- **AC:** depth-first reading order (AC-1); role via `aria-query`, name via `dom-accessibility-api`
  (AC-2); heading `level` incl. `aria-level`, styled `<span>` ≠ heading (AC-4); unnamed
  interactive → `flags.unnamed` (AC-5); missing `alt` flagged, `alt=""` omitted (AC-6).

### T5 — Exports + ESM/CDN build (tsup)  · S · `area: core` `area: infra`
- **Outcome:** the package is importable from npm and a CDN with no build step.
- **AC:** `linearize` + types exported from `index.ts`; `exports` map (ESM + types);
  `sideEffects:false`; `tsup` build produces a working ESM bundle; a `minor` changeset added.

### T6 — Golden fixtures for every AC  · M · `area: core` `area: a11y-fidelity`
- **Outcome:** SPEC-001's test plan is fully green.
- **AC:** one focused fixture per phenomenon (AC-1…AC-6); `pnpm test` green; meaningful assertions
  (not snapshots-of-bugs); a circular-`aria-labelledby` fixture confirms termination.

### T7 — Commit lockfile + enable CI cache  · XS · 🟢 · `area: infra`
- **Outcome:** reproducible installs and faster CI.
- **AC:** `pnpm install` run and `pnpm-lock.yaml` committed; `cache: pnpm` enabled in `ci.yml`;
  `pnpm install` switched to `--frozen-lockfile` in CI.

### T8 — README quickstart verified  · XS · `docs`
- **Outcome:** the npm + CDN snippets in `README.md` actually run against the published `core`.
- **AC:** both the `import` and the `<script type=module>` CDN examples produce a sensible
  interpretation; README updated with a real example output.

**M1 done when:** SPEC-001 ACs all green, `core` published to npm (provenance), CDN import works,
and `README` quickstart is verified. → cut the announcement.

---

## M2 — Fidelity (each `needs: spec`, high-leverage)

- **T20 — Journey + spec: verbosity profiles** (`area: a11y-fidelity`) — NVDA/JAWS/VoiceOver
  phrasing as a pluggable profile over the raw interpretation. AC: profiles change announcement
  order/wording without touching the linearizer; fixtures per profile.
- **T21 — Journey + spec: mismatch heuristics** (`area: a11y-fidelity`) — detect "visual table
  without table semantics", styled-span headings, unnamed controls as first-class findings. AC:
  each heuristic documents its signal + false-positive behaviour; fixtures both ways.

## M3 — Browser extension (MV3) (`needs: spec`)

- **T30 — Journey + spec: extension MVP** (`area: extension`) — side-panel UI over `core` on the
  live DOM, incl. authenticated/internal pages and JS-rendered content; least-privilege manifest.
- **T31 — Real AX tree via `chrome.debugger`** (`area: extension`) — optional higher-fidelity path
  using CDP `Accessibility.getFullAXTree`; graceful fallback to the pure-JS core path.

## M4 — CLI + hosted demo (`needs: spec`)

- **T40 — Journey + spec: `npx` CLI** (`area: cli`) — Playwright/CDP host feeding `core`; offline;
  CI-friendly; outputs an HTML report.
- **T41 — Journey + spec: hosted demo** (`area: web`) — GitHub-Pages app running `core` in-browser
  on pasted HTML / a public URL; activates `deploy-pages.yml`.

## Later / exploratory (`needs: spec`)

- **T50** Shadow DOM + slot traversal in `core`.
- **T51** Cross-origin iframe subtrees.
- **T52** Live-region (`aria-live`) representation.
- **T53** PDF tag-tree mode (pdf.js): visual vs. tag tree; flag untagged tables / missing alt.
- **T54** VS Code extension consuming `core`.

---

## Cross-cutting / "good first issue" entry points

- T1, T2, T3, T7 above are friendly first tasks.
- **Docs:** improve a `_TEMPLATE.md`, add an example, tighten a rule — fast-path, no spec needed.
- **Fixtures:** contribute a real-world markup pattern + its expected interpretation as a golden
  fixture (`area: a11y-fidelity`) — high value, low barrier.
