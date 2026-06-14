# Roadmap

The shape of the work, in milestones. This is the "why now / in what order" companion to the
[task backlog](tasks.md). Order reflects the decision to ship the **developer-facing core first**
(npm + CDN), then widen reach.

## M0 — Foundation ✅ (this scaffold)

Monorepo, TypeScript, lint/test, the SDLC + AI agent setup, governance, CI/release/Pages
workflows, and the founding journey/spec. Outcome: a contributor can clone, `pnpm install`, and
pick up a defined task.

## M1 — Core engine on npm + CDN  ⬅️ first shippable

The `screen-reader-mirror` library: `linearize(element)` → ordered screen-reader interpretation
(role + accessible name, reading order, AT-hidden exclusion, the obvious-mistake flags).

- Driven by [SPEC-001](../specs/SPEC-001-core-linearize-foundation.md) (needs its Stage-2.5 review).
- **Definition of done:** published to npm with provenance; importable from jsDelivr/unpkg with no
  build step; every acceptance criterion covered by a golden fixture; README quickstart works.
- **This is the Reddit / Hacker News moment** — "a zero-install, client-side way to see what a
  screen reader reads, as an npm package".

## M2 — Fidelity: verbosity profiles + mismatch detection

- Pluggable NVDA / JAWS / VoiceOver announcement phrasing on top of the raw interpretation.
- Visual-vs-semantic mismatch heuristics ("looks like a table, isn't one"; styled-span headings;
  unnamed controls) surfaced as first-class findings.
- Each is high-leverage → full spec-review + code-review rigor.

## M3 — Browser extension (MV3)

Zero-install, works on authenticated/internal pages (the EC use case). Live DOM incl.
JS-rendered content; side-panel UI over `core`; optional `chrome.debugger` real AX tree. Ships via
the Chrome Web Store and as a sideloadable build.

## M4 — CLI + hosted demo

- `npx screen-reader-mirror <url>` — Playwright/CDP host for CI and local pages; fully offline.
- Hosted demo on GitHub Pages — paste HTML / public URL; the shareable front door. Activates the
  `deploy-pages` workflow.

## Later / exploratory

- Shadow DOM + cross-origin iframe traversal in `core`.
- Live-region (`aria-live`) representation.
- PDF tag-tree mode (pdf.js) — visual rendering vs. tag tree, flag untagged tables / missing alt.
- VS Code extension consuming `core`.

---

Milestones are sequential in priority but the monorepo lets work proceed in parallel where a
contributor has a defined task. Nothing here is committed scope until it has an approved journey +
spec — the roadmap sets direction, the SDLC sets contracts.
