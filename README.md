<!-- markdownlint-disable MD033 MD041 -->
<div align="center">

# 🪞 screen-reader-mirror

**See what a screen reader actually interprets from your UI — without being a screen-reader user.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![npm](https://img.shields.io/badge/npm-screen--reader--mirror-cb3837.svg)](https://www.npmjs.com/package/screen-reader-mirror)
[![Status](https://img.shields.io/badge/status-pre--alpha-orange.svg)](./docs/project/roadmap.md)

</div>

---

## The problem

Developers build visually beautiful UIs but have no fast, frictionless way to see what a
screen reader *interprets* from the underlying HTML/DOM. The semantic structure — what
assistive-technology users actually experience — is invisible to sighted developers:

- Tables built as `<div>` + CSS Grid — visually correct, semantically flat text.
- Headings that *look* like headings but are `<span class="h2">` — the screen reader skips them.
- Interactive elements with no accessible name — announced as a bare "button".
- PDFs that render as tables but have no `<table>` tags in the tag tree.

There is a real gap in the accessibility market: **a zero-install, client-side way for a
non-blind developer to test what a blind user would hear.** That is what this project fills.

## What it does

`screen-reader-mirror` computes the browser's accessibility tree and renders a **linearized,
screen-reader-style interpretation** of a page — side-by-side with the visual view — and
**highlights mismatches** between what a page looks like and what it means.

It ships as a layered set of targets, all built on one shared engine:

| Target | Audience | Status |
|---|---|---|
| **`screen-reader-mirror`** (npm + CDN) | Developers, CI, tooling authors | 🚧 first milestone |
| **Browser extension** (Chrome/Edge, MV3) | Any developer, works on authenticated/internal pages | 🗺️ planned |
| **CLI** (`npx screen-reader-mirror <url>`) | CI/CD, dev workflows | 🗺️ planned |
| **Hosted demo** (paste HTML / public URL) | Anyone, zero install | 🗺️ planned |

## Install

```bash
npm install screen-reader-mirror
# or
pnpm add screen-reader-mirror
```

Or use it straight from a CDN — no build step, globally available, no account required:

```html
<script type="module">
  import { linearize } from "https://cdn.jsdelivr.net/npm/screen-reader-mirror/+esm";
  // or: https://unpkg.com/screen-reader-mirror
  const view = linearize(document.body);
  console.log(view);
</script>
```

> **Pre-alpha.** The public API is being shaped through the SDLC in [`docs/specs/`](./docs/specs/).
> The first published release will be cut once `SPEC-001` lands. Watch the
> [roadmap](./docs/project/roadmap.md).

## Why it's safe for regulated and EU environments

This was designed to be usable inside the European Commission and other regulated settings
with **no licence, GDPR, or procurement concerns** ([ADR-0001](./docs/decisions/ADR-0001-infrastructure-first-no-vendor-lock-in.md)):

- **Client-side only.** The core engine never makes a network call. Page content never
  leaves the machine. (Enforced in `lint` and a Claude hook, not just promised.)
- **No vendor lock-in.** Pure TypeScript, standard web APIs, public npm registry, MIT
  licence. No SaaS account, no API key, no telemetry, no required server.
- **Zero install option.** Use it from a CDN or as a browser extension — nothing to
  procure or approve.
- **Globally accessible & free.** Open source under MIT; distributed via npm + CDN so it is
  reachable anywhere.

## Project & contribution model

This project is run with an explicit SDLC and a public task board so a contributor can pick
up well-defined work and ship it through review — not ad-hoc.

- **How we work:** [`docs/sdlc/README.md`](./docs/sdlc/README.md) — Journey → Spec → Review →
  Implement → Test → Self-review → PR → Operator review → Merge.
- **Pick up a task:** [`docs/project/tasks.md`](./docs/project/tasks.md) and the GitHub Project board.
- **Contributing:** [`CONTRIBUTING.md`](./CONTRIBUTING.md) — branch naming, PR rules, changesets.
- **Who can merge:** [`GOVERNANCE.md`](./GOVERNANCE.md) — contributors' PRs require maintainer
  review; only the maintainer merges to `main`.
- **AI agents:** [`AGENTS.md`](./AGENTS.md) is the single operating manual for both
  GitHub Copilot and Claude Code.

## License

[MIT](./LICENSE) © 2026 James Lanzon and contributors.
