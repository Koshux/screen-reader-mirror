# Documentation guide book — working outline

STATUS: the docs are now multi-page. Docs.dc.html is the overview; one page per chapter: Docs - Install / Reading the output / Testing with NVDA / CI / Settings / API / CLI / Divergences / Privacy / Contributing, plus Site map.dc.html. Shared shell: docs.css (classes), SiteHeader.dc.html, SiteFooter.dc.html, DocsNav.dc.html (prop active). Add a page: copy any Docs - *.dc.html, set DocsNav active, add to DocsNav GROUPS and Site map.

Page: Docs.dc.html (shell exists; chapters are stubs with bullet outlines). Same header/footer/theme as Getting started, About, Compared. Sidebar on 900px+, chapter dropdown below.

Status pills: "Draft" = outline only, "Outlined" = structure + partial prose, "Written" = done. Update the pill when a chapter changes state.

## Chapters and anchors
1. #overview — what it is / is not; one engine, many hosts; links About, Compared
2. #install — package, bookmarklet, extension, install it yourself, CLI (full detail; Getting started keeps step one only)
3. #concepts — reading order, role/name, flags, hidden content, shadow DOM & frames, live regions, Source/Profile/Mode/Capture
4. #output — four views; flags table (unnamed, missingAlt, unreachable)
5. #surfaces — demo, bookmarklet, extension, CLI; links Surfaces.dc.html
6. #testing — Source, Profile, Mode, Capture; bridge; alignment; divergence report; links Testing.dc.html. Sub-section: capture per install (d1 bookmarklet, d2 package capture()/compare(), d3 extension settings, d4 CLI interactive --headed). DOM walk + NVDA is the primary pairing.
7. #ci — WRITTEN: two gates, unit test, snapshots (--update, --mask), report JSON, login/wait/pages flags, exit codes, what CI cannot do, full workflow
#guides — index of every built page, storyboard, component and design-system file (after #ci in the page)
8. #api — linearize, InterpretationNode, LinearizeOptions, future speak(nodes, profile)
9. #cli — mirror <url|file>, --check, --capture bridge, listen
10. #divergences — living list; DOM vs AX; profile gaps; how to report
11. #privacy — no network; local storage per host; bridge scope; extension permissions
12. #contributing — monorepo, specs/ADRs, fixtures, roadmap, MIT

## Testing storyboard: C0 setup steps (ELI5)
1 Install NVDA + open Speech Viewer · 2 Install Node · 3 `npx screen-reader-mirror listen` (--port) · 4 open mirror, enter pair code · 5 press ↓/H/Tab, read match/differs/extra. Side cards: Mac VoiceOver, no bridge, two computers (export session, import as log). Reuse for Docs #install and #testing.

## Sources of truth (repo Koshux/screen-reader-mirror)
- docs/architecture/overview.md — hosts and core responsibilities
- packages/core/README.md — install, quickstart, API, guarantees
- packages/core/src/types.ts — InterpretationNode contract
- docs/specs/SPEC-001, 003, 004 — behaviour per feature
- docs/project/board.md — roadmap

## Proposals not yet in the repo (mark as such until decided)
- Bridge: `npx screen-reader-mirror listen`, ws://localhost:7331, pair code
- CLI flags: --source, --profile, --mode, --capture, --check, --fail-on, --snapshot, --update
- Profiles API: speak(nodes, profile)
- Capture API: capture.connect({pair}), bridge.on("utterance"), compare(nodes, utterance) → {row, verdict: match|differs|extra}
- CLI --headed interactive capture session, report mirror-session-<date>.json
- Exit codes 0/1/2
- CLI flags from #ci: --mask, --storage-state, --cookie, --wait-for, --wait, --pages, --report
- Report JSON shape (page, engine, browser, source, nodes, diff, flags, verdict, reasons)

## Voice
Plain, matter-of-fact, short sentences. Say what the tool does and does not do. "Not a screen reader" appears once per chapter where relevant, never more. No marketing.

## Links in
- Getting started: header "Docs" link; Reading the output closes with links to #testing, #ci, #api
- Footers: "Learn" column lists Documentation (added on Docs; add to the other pages when touching them)
