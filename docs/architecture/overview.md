# Architecture Overview

> Status: living document. The detailed engine design is specified per-feature under
> [`docs/specs/`](../specs/); this is the map.

## Shape: one engine, many hosts

```
                      ┌───────────────────────────────────────────────┐
                      │            packages/core  (npm + CDN)          │
                      │  client-side, offline, host-agnostic engine    │
                      │  ┌─────────────┐ ┌──────────────┐ ┌─────────┐  │
   DOM / AX tree ───▶ │  │ name & role │ │ linearization│ │ mismatch│  │ ──▶ interpretation
   (Element/Node)     │  │ (a11y libs) │ │ reading order│ │heuristic│  │     model + view data
                      │  └─────────────┘ └──────────────┘ └─────────┘  │
                      │            verbosity profiles (NVDA/JAWS/VO)    │
                      └───────────────────────────────────────────────┘
                              ▲              ▲             ▲          ▲
                  ┌───────────┘     ┌────────┘      ┌──────┘    ┌─────┘
            packages/extension  packages/cli   packages/web   (your app)
            MV3, live DOM +     npx + CDP/      paste HTML /   import from
            chrome.debugger     Playwright      public URL     npm or CDN
```

The **core engine** is the only place semantics are computed. Every host is a thin adapter that
(a) obtains a DOM/AX tree from somewhere and (b) renders core's interpretation model. This keeps
the hard, correctness-critical logic in one tested, reusable place — and lets us ship the
developer-facing npm/CDN target first.

## Core responsibilities

1. **Role & accessible-name computation** — reuse `dom-accessibility-api` (AccName 1.2) and
   `aria-query`. The highest-fidelity source, when a host can reach it, is the browser's real AX
   tree (Chrome CDP `Accessibility.getFullAXTree`, `getComputedRole/Label`); the pure-JS path is
   the portable fallback.
2. **Linearization / reading order** — the sequence a screen reader traverses. *Genuinely ours;
   no library does this.*
3. **Verbosity profiles** — pluggable NVDA/JAWS/VoiceOver announcement phrasing on top of the
   raw tree.
4. **Visual-vs-semantic mismatch heuristics** — e.g. "looks like a table, isn't one". Heuristic,
   documented, false-positive behaviour explicit.

Core makes **no network calls** and assumes no framework. See
[ADR-0001](../decisions/ADR-0001-infrastructure-first-no-vendor-lock-in.md).

## Hosts (in roadmap order)

- **npm + CDN (core)** — first milestone. Developers `import` it; CI uses it.
- **Browser extension (MV3)** — zero-install; sees the live, JS-rendered DOM including
  authenticated/internal pages; can use `chrome.debugger` for the real AX tree.
- **CLI** (`npx screen-reader-mirror <url>`) — Playwright/CDP host for CI and local pages.
- **Hosted demo** — paste HTML / public URL; the shareable, zero-install front door.

## Key decisions

- [ADR-0001](../decisions/ADR-0001-infrastructure-first-no-vendor-lock-in.md) — infrastructure-first,
  client-side-only, no vendor lock-in.
- [ADR-0002](../decisions/ADR-0002-license-mit.md) — MIT license.
- [ADR-0003](../decisions/ADR-0003-monorepo-shared-core.md) — pnpm monorepo with a shared core.
