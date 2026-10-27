# Handoff: screen-reader-mirror website and documentation

## Overview
The public site for **screen-reader-mirror**, an open-source (MIT) screen reader simulator: paste HTML or point it at a page and get the flat reading order a screen reader speaks, beside the rendered page. The site covers four user journeys (hosted demo, bookmarklet, browser extension, CLI) and the docs that support them: install, reading the output, testing against NVDA, CI, settings, API, CLI, known divergences, privacy, contributing, and a site map.

Source repo: `Koshux/screen-reader-mirror` (branch `main`). Product facts in the docs come from `docs/architecture/overview.md`, `packages/core/README.md`, `packages/core/src/types.ts`, `docs/specs/SPEC-00x`. Anything the docs mark **Proposed** (bridge, `capture()` API, most CLI flags) was not yet in the repo when written; verify against the current code and drop the pill where it has landed.

## About the design files
Everything under `design-reference/` is a **design reference built in HTML** (Design Component `.dc.html` files plus a shared stylesheet). They show the intended look, copy, structure and behavior. They are **not production code to ship**. Recreate them in the target codebase's existing environment and patterns (a static-site generator or docs framework is the natural fit for the docs; the demo page needs the real `linearize()` engine wired to the Code pane). If no site environment exists yet, choose the simplest stack that outputs static HTML with no runtime webfont and no third-party scripts, since the privacy promise ("nothing on this page is sent anywhere") is part of the design.

Open any `.dc.html` in a browser from inside `design-reference/` (they load `docs.css`, `support.js` and each other relatively). `Site map.dc.html` links every page.

## Fidelity
**High-fidelity.** Colors, type scale, spacing, radii, states and copy are final. Recreate pixel-for-pixel using the tokens below. Copy is final: keep text verbatim, including the "You should see / If not" step pattern and the scope lines ("Not a screen reader…", "Nothing on this page is sent anywhere").

Two things are intentionally not final:
- Screenshots / GIFs for the ELI5 steps on Install, Testing with NVDA and Reading the output are not supplied; placeholders are absent on purpose. Capture them from the real build.
- Older pages (landing `Demo page - Concept`, About, Compared, Getting started) still carry their own inline header/footer. Build them on the shared SiteHeader / SiteFooter described below.

## Site structure
Shared shell, used by every docs page:
- **SiteHeader** (`SiteHeader.dc.html`): brand mark "sr" (24px box, 1.5px `--link` border, radius 6, ui-monospace 10px 600) + "screen-reader-mirror" (17px 600) linking to the landing; right side: Getting started · Docs · About (`.lnk`, 44px min height, 15px), theme toggle (ghost button, sun/moon Lucide 16px 1.75 stroke, `aria-label` "Switch to light/dark theme"), "Open the demo" (primary outlined button). Under 640px the links collapse into a `<details>` hamburger menu (18px menu icon) with a dropdown: Getting started, Docs, About, Compared, Open the demo, theme switch. Header: flex, 10px 28px padding (10px 16px mobile), 1px `--border` bottom rule.
- **SiteFooter** (`SiteFooter.dc.html`): four columns (brand + one line, then link columns incl. a "Learn" column listing Documentation); compacts to brand row + three columns at ≤1000px; ≤640px hides the brand paragraph and version, 12.5px links.
- **DocsNav** (`DocsNav.dc.html`): sticky left sidebar, 240px, top 16px, 40px top padding, 14px type. Four groups with uppercase 11px .1em labels: Start (Overview, Install, Reading the output) · Use (Testing with NVDA, Continuous integration, Settings) · Reference (API, CLI, Divergences) · Project (Privacy, Contributing, Site map). Items 36px min height, 0 10px padding, radius 8, `--muted`; hover `--text` on `--surface`; current: `--link` text on `--accent-soft`, 600, `aria-current="page"`. Below 900px the sidebar is replaced by a `<select class="sel">` ("Documentation pages") that navigates on change.
- **Page frame**: `.hero` (44px 28px 8px; kicker "Docs · Page name" 13px uppercase .1em in `--link`; h1 clamp(30px,4.2cqw,52px) 700 -0.03em lh 1.05 max 20ch; lead `--muted` clamp(16px,1.3cqw,18px) max 60ch) → `.wrap` grid `240px minmax(0,1fr)`, 48px gap, 0 28px 48px padding → `<main>` of `.ch` sections (40px 0 padding, 1px top rule except the first, 16px gap, max 72ch; `.wide` removes the cap) → prev/next `.pn` row. 16px gutters under 640px.
- **Theme**: dark by default (`.t-coral`), light by OS (`.t-auto`) or explicit (`.t-coral-light`). The toggle flips the class and persists the choice; each page's logic class owns `themeClass`, `isLightNow`, `themeBtnLabel`, `toggleTheme` and passes them to SiteHeader.

## Pages
Each page: name · purpose · sections (ids are the in-page anchors used by cross-links).

1. **Docs** (`Docs.dc.html`) — overview and index. What it is / is not; one engine, many hosts; card grid (`.cards`, auto-fill minmax(240px,1fr)) linking each chapter with a status pill.
2. **Install** — five install methods in full. `#choose` (4-column `.tbl.c4`: Install · Best for · Sees · Takes), `#bookmarklet`, `#package`, `#extension`, `#sideload`, `#cli`. Each has numbered `.steps`, "When it does not run" callouts (CSP, browser pages, frames), Versions/pins, Permissions, Remove it.
3. **Reading the output** — row anatomy (name then muted role phrase), the four views (Spoken, Preview, Nodes, JSON), flags table, the 18 error/empty states as `.state` cards (title + sample `.msg`). Closes with links to Testing, CI, API.
4. **Testing with NVDA** — ELI5 setup: 1 Install NVDA + Speech Viewer · 2 Install Node · 3 `npx screen-reader-mirror listen` · 4 open mirror, enter pair code · 5 press ↓/H/Tab, read match/differs/extra. Capture controls strip (`.strip` with `.pill` Source/Profile/Mode/Capture; `.pill.live` when connected), log panel (`.pnl`, `.rows`, `.row.cur` highlighted), divergence report. Side cards: Mac VoiceOver, no bridge, two computers. Bridge marked Proposed.
5. **Continuous integration** — two gates, unit test snapshot, `--update` / `--mask`, report JSON shape, login/wait/pages flags, exit codes 0/1/2, what CI cannot do, full workflow YAML in `<pre>`.
6. **Settings** — each toggle with its effect and default (panel position, flagged only, theme, animations, profile, mode, capture, storage per host).
7. **API** — `linearize(root, options)`, `InterpretationNode` fields (role, name, level, flags, live, ref), `LinearizeOptions`, future `speak(nodes, profile)` (Proposed).
8. **CLI** — `mirror <url|file>`, `--check`, `--capture`, `listen`, flag table; flags not in repo marked Proposed.
9. **Divergences** — living list of DOM-walk vs accessibility-tree vs NVDA differences, profile gaps, how to report (issue template fields).
10. **Privacy** — no network, local storage per host, bridge scope (localhost only), extension permissions and why.
11. **Contributing** — monorepo layout, specs/ADRs, fixtures, roadmap, MIT.
12. **Site map** — journeys (demo, bookmarklet, extension, CLI) mapped to pages and storyboard frames; index of every page.

Also included for context (not docs-shell pages yet): landing `Demo page - Concept`, `Getting started`, `About`, `Compared`, and the storyboards `Surfaces` (bookmarklet + extension) and `Testing` (Source → Profile → Mode → Capture), plus reusable `MirrorPanel`, `HostPage`, `MirrorView`, `NodeList`.

## Components (docs.css class layer)
All values below are in `design-reference/docs.css`; copy them exactly.
- **Buttons** `.b`: 40px min height, 0 14px, 1px `--border-strong`, radius 8, transparent, 14px, gap 8; hover `--surface`. `.b-p` primary: `--link` border and text, 600, hover `--accent-soft`. `.b-g` ghost: transparent border, `--link` text, 0 8px, hover `--accent-soft`. No filled buttons on the site (the demo's Run button is the one exception, see tokens.md).
- **Select** `.sel`: 40px, 1px `--border-strong`, radius 8, `--bg`, custom chevron (12px, right 10px), native appearance off.
- **Kicker** `.kicker`: 12px uppercase .08em 600 `--muted`; `.pg` variant 13px .1em `--link`.
- **h2**: clamp(22px,2.4cqw,28px) 600 -0.015em lh 1.15. **h3**: 17px 600, 12px top margin. **h4** (in steps): 16px 600. Body 16/1.5; lists 1.2em indent, 6px gap.
- **Status pill** `.st`: 24px, 0 9px, 999 radius, 12px 600, 1px `--border-strong`, `--muted`. `.ok` = "Written" (`--ok-bg`/`--ok-text`), `.wip` = "Proposed"/"Outlined" (`--flag-bg`/`--flag-text`).
- **Code** `<pre>`: 14px 16px padding, 1px `--border`, radius 10, `--surface`, 13px/1.6 ui-monospace, pre-wrap; `<b>` inside = `--link` 500 (comments / highlights). Inline code `.mono`.
- **Table** `.tbl`: CSS grid, 1px `--border` frame, radius 10, 14px; header cells `.h` 12px uppercase .08em 600 `--muted` on `--surface`; cells 10px 14px with 1px top rules; `.k` mono 13px. `.c3` = 1fr 1.6fr 1fr, `.c4` = 1.1fr 1.6fr .8fr .9fr. Under 900px `.c4` drops to two columns (3rd/4th hidden); under 640px `.c3` drops its 3rd column.
- **Steps** `.steps`: list, each `li` grid `32px minmax(0,1fr)`, 14px gap, 18px 0 padding, 1px top rules + bottom rule on last. Number `.n`: 28px circle, `--link` fill, `--bg` text 13px 700. Body gap 8px; `.see` 14px `--muted` with `<b>` in `--text` ("You should see", "If not"). Single column under 640px. Selectors target direct children only so nested lists keep normal bullets.
- **Callout** `.callout`: 12px 14px, 1px dashed `--border-strong`, radius 10, 14px. `.warn`: `--flag-text` border, `--flag-bg`, `--flag-text`. `.live`: `--live` border.
- **Flag** `.flag`: 999 pill, 1px 8px, `--flag-bg`/`--flag-text`, 11.5px 500, nowrap; `.ok` green pair; `.mute` `--surface-2`/`--muted`.
- **Cards** `.cards` grid auto-fill minmax(240px,1fr) 12px gap; `.card` 14px 16px, 1px `--border`, radius 10, `--surface`; `.t` 600, `.d` 14px `--muted`; link cards hover border `--link`.
- **Prev/next** `.pn`: space-between row, 24px top padding, 1px top rule; each link stacks 12px `--muted` label over page name, 44px min height, hover name `--link`.
- **Mock panel** `.pnl` (used on Testing with NVDA / Reading the output): 1px `--border`, radius 10, 13px; `.pnl-hd` 8px 12px on `--surface-2`, 12px `--muted`; `.strip` wraps `.lbl` (11px uppercase) + `.pill` (26px, 0 9px, 999, 12px `--muted`; `.on` = `--accent-soft` / `--link` 600; `.live` = `--live`); `.rows`/`.row` grid `1fr auto`, 4px 6px, radius 6, `.cur` = `--accent-soft`, `.r` role in `--muted`.
- **State card** `.state`: 14px, 1px `--border`, radius 10, `--surface`; `.t` 600; `.msg` 10px 12px, radius 8, `--bg`, 1px `--border`, 13px `--muted`.

## Interactions & behavior
- Theme toggle: flips `.t-coral` ↔ `.t-coral-light`; `.t-auto` follows `prefers-color-scheme`. Persist the choice (localStorage) and apply before first paint to avoid a flash.
- Docs sidebar: current page highlighted; sticky at 16px. Mobile select navigates on `change`.
- Header hamburger (≤640px): native `<details>`; dropdown absolutely positioned 12px inset, radius 10, 1px `--border-strong`, shadow 0 8px 24px rgba(0,0,0,.25).
- Hover: `--surface` on outlined controls, `--accent-soft` on primary/ghost; links turn `--link`.
- Focus: `:focus-visible` 2px solid `--focus`, offset 2px, on everything. Never the browser default ring.
- Copy buttons (demo, Getting started): flip to the green ok pair with "Copied" for 1.8s.
- Motion: only the landing hero (parallax + ±1px idle sway). `prefers-reduced-motion` disables all transitions/animations; an in-page Animations switch adds `.motion-off`.
- Anchors: every section has an id and `scroll-margin-top: 24px`; cross-page links use `Page#section`.
- Hit targets: 44px on links/nav, 40px controls, 36px sidebar rows (desktop only).

## Responsive breakpoints
Container queries on `.srm` (treat as viewport breakpoints in production):
- ≤1000px: footer 3 columns, 24px gaps.
- ≤900px: sidebar hidden, select shown; wrap single column; sections 32px 0; `.c4` tables two columns.
- ≤640px: 16px gutters; header collapses to hamburger; hero 32px top; steps single column; `.c3` tables two columns; footer compact.
Verified at 320, 768 and 1280+.

## State management
Per page: `theme` (dark | light | auto) only. DocsNav takes `active` (page id). SiteHeader takes `isLight`, `themeLabel`, `onToggle`. No data fetching anywhere on the docs; the demo page needs `linearize()` run client-side on the Code pane's HTML.

## Design tokens
Dark (`.t-coral`, default): bg #15181c · surface #1d2126 · surface-2 #252a31 · text #e6e9ee · muted #aeb5c0 · border #2d333b · border-strong #4e5663 · link/focus #ff9b85 · accent-soft #3a2622 · flag-bg #3b3410 · flag-text #efe08a · ok-bg #1f4d35 · ok-text #c3ead2 · live #7fd1b9.
Light (`.t-coral-light`): bg #f7f8fa · surface #eef0f3 · surface-2 #e3e6ea · text #171a1f · muted #4a505a · border #d5d9df · border-strong #99a0ab · link/focus #9a2e17 · accent-soft #fde4dc · flag-bg #fff1b8 · flag-text #5a4a00 · ok-bg #d6f0e0 · ok-text #0d4a2b · live #1f7a60.
Text pairs meet 7:1 (see `handoff/tokens/tokens.json` for recorded ratios).

Type: `system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, sans-serif`; mono `ui-monospace, Menlo, Consolas, monospace`. No webfont, by design. Scale: body 16/1.5 · UI 14 · small 13 · code 13 · kicker 12 · nav group 11 · h1 clamp(30,4.2cqw,52) · h2 clamp(22,2.4cqw,28) · h3 17 · h4 16.
Spacing: 4-based; gutters 28 / 16; section padding 40 (32 mobile); hero 44 top; grid gap 48; card/step gaps 6–16.
Radii: 6 (mark, rows) · 8 (controls, nav items) · 10 (code, tables, cards, callouts) · 999 (pills).
Shadows: only on floating menus/toasts: 0 8px 24px rgba(0,0,0,.25).
Borders: 1px; `--border-strong` on controls.

The three bound design systems (Nocturne, Modernist, Industry) were explored early (`Launch mockups`, `Demo page - Industry/Modernist`) and superseded; the slate-and-coral tokens above are the shipped direction.

## Assets
- `assets/mark.svg` — the "sr" brand mark (the only logo; no wordmark).
- Icons: Lucide, 1.75 stroke, 14–18px, inlined as SVG (sun, moon, menu, speaker, triangle-alert, code, eye, ear, bookmark, package, grid, copy, check, waves). No icon font.
- No photography. Screenshots/GIFs for the step guides are still to be captured from the real build.

## Files
- `design-reference/docs.css` — the docs class layer and both theme palettes (the source of truth for every value above).
- `design-reference/SiteHeader.dc.html`, `SiteFooter.dc.html`, `DocsNav.dc.html` — shared shell.
- `design-reference/Docs*.dc.html`, `Site map.dc.html` — the twelve docs pages.
- `design-reference/Demo page - Concept.dc.html`, `Getting started.dc.html`, `About.dc.html`, `Compared.dc.html` — the rest of the site.
- `design-reference/Surfaces.dc.html`, `Testing.dc.html`, `MirrorPanel.dc.html`, `HostPage.dc.html`, `MirrorView.dc.html`, `NodeList.dc.html` — panel/extension storyboards and reusable parts.
- `design-reference/styles.css`, `tokens/*.css`, `guidelines/*.html`, `components/core/*` — the earlier brand system (tokens, specimens, React core components with `.d.ts` and prompt notes).
- `design-reference/readme.md`, `SKILL.md` — brand and content rules (speech first, numbered sequences, full-stop headlines).
- `design-reference/docs/outline.md` — chapter outline, sources of truth and the Proposed list.
- `design-reference/handoff/` — earlier token export (`tokens.json`, `tokens.md`), shared copy and demo-page notes.
- `support.js`, `browser-window.jsx` — runtime for opening the `.dc.html` references locally; not for production.
