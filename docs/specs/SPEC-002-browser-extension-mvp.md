---
id: SPEC-002
title: Browser extension MVP — live screen-reader view in a side panel
status: draft
journeys: [JNY-002]
target: extension
created: 2026-06-15
---

# SPEC-002 — Browser extension MVP

> **Draft — not yet implementation-ready.** This spec needs its **Stage 2.5 spec-review**
> ([the skill](../../.claude/skills/spec-review/SKILL.md)) before any code, and its
> **implementation is blocked by the core engine** ([#4](https://github.com/Koshux/screen-reader-mirror/issues/4) /
> [SPEC-001](SPEC-001-core-linearize-foundation.md)) — it consumes `linearize()`. The journey, the
> shape below, and the test plan can be refined now; treat the API touchpoints as provisional until
> SPEC-001 lands. Tracks GitHub issue [#7](https://github.com/Koshux/screen-reader-mirror/issues/7) (M3).

## 1. Summary

A Chrome/Edge **Manifest V3** extension that, for [JNY-002](../journeys/JNY-002-developer-checks-a-live-authenticated-page.md),
shows the **linearized screen-reader interpretation of the live page** in a side panel — computed
**in the browser** from the active tab's current DOM using the `screen-reader-mirror` core engine.
It works on authenticated/internal, JavaScript-rendered pages, and sends **nothing** off the
machine. This is the first *host* target; it is a thin adapter over the engine, not a re-implementation.

## 2. Acceptance criteria

- **AC-1** — Clicking the extension action opens a **side panel** beside the active tab.
- **AC-2** — On open (and on an explicit "Re-run" control), the panel shows the **ordered
  interpretation** of the active tab's **current, live DOM** — role + accessible name in reading
  order — by running core `linearize()` on the page.
- **AC-3** — It works on **authenticated / internal** pages (it runs in the user's existing tab and
  session; no URL fetch, no cookies handled by us).
- **AC-4** — It reflects **JavaScript-rendered** content: re-running after the page changes (e.g. an
  accordion expanded) updates the interpretation.
- **AC-5** — The same mistake signals as the library are surfaced: an interactive element with no
  accessible name, an `<img>` with missing `alt`, and content hidden from assistive tech is omitted
  (inherited from core).
- **AC-6** — **No network access.** The extension makes no requests; page content never leaves the
  machine. The manifest requests **least privilege** (no broad host permissions beyond what reading
  the active tab on demand requires; no `debugger` permission in the MVP).
- **AC-7** — A clear empty/permission state when the panel can't read the page (e.g. a restricted
  browser page like the Web Store), rather than a silent failure.

## 3. Design

Manifest V3 extension with three parts:

1. **Side Panel** (`chrome.sidePanel`) — the UI. Renders the interpretation list (and, later, the
   side-by-side visual/semantic view). Plain TS + minimal DOM; no heavy framework for the MVP.
2. **Content script** — injected into the active tab **on demand** (via `chrome.scripting.executeScript`
   triggered by the user, so we avoid broad always-on host permissions). It has direct access to the
   live DOM, calls `linearize(document.body)` from the bundled core, and returns the serialisable
   `InterpretationNode[]` to the panel via messaging.
3. **Service worker** (background) — wires the action click to opening the panel and brokers messages.

The core engine is bundled in (workspace dependency `screen-reader-mirror`). Because `linearize`
returns plain serialisable data (no live node refs — see SPEC-001), it crosses the content-script →
panel boundary cleanly. **Real-AX-tree fidelity via `chrome.debugger`** is explicitly a follow-up
([#20](https://github.com/Koshux/screen-reader-mirror/issues/20)); the MVP uses the portable engine
so there is no "debugging your browser" banner.

### Permissions (least privilege)

`sidePanel`, `scripting`, and `activeTab` (grants temporary access to the current tab only when the
user invokes the extension). **No** `<all_urls>` host permission, **no** `debugger`, **no**
`tabs`-content access beyond the active tab on user action.

## 4. File-level changes

| File | Change |
|---|---|
| `packages/extension/manifest.json` | MV3 manifest: action, side_panel, service_worker, `activeTab`+`scripting` |
| `packages/extension/src/panel/*` | side-panel UI: render `InterpretationNode[]`, "Re-run" control, empty states |
| `packages/extension/src/content/extract.ts` | injected: `linearize(document.body)` → message back |
| `packages/extension/src/background.ts` | open panel on action click; message broker |
| `packages/extension/package.json` | build (e.g. vite/CRX) + `screen-reader-mirror` workspace dep |

## 5. Edge cases

- **Applies now:** restricted pages where content scripts can't run (AC-7 empty state);
  re-run after DOM changes (AC-4); pages with no meaningful semantics (show an honest "flat" result).
- **Deferred (own tickets):** embedded sub-pages / iframes ([#22](https://github.com/Koshux/screen-reader-mirror/issues/22)),
  custom-component internals / shadow DOM ([#21](https://github.com/Koshux/screen-reader-mirror/issues/21)),
  live-region change announcements ([#23](https://github.com/Koshux/screen-reader-mirror/issues/23)),
  real-AX-tree path ([#20](https://github.com/Koshux/screen-reader-mirror/issues/20)), verbosity
  profiles (M2).

## 6. Privacy check (mandatory)

The extension performs **no** network I/O and bundles only the offline core engine. Page content is
read in-browser and rendered locally; nothing is transmitted, logged remotely, or persisted off the
machine. Least-privilege manifest (`activeTab`, no broad host permissions, no `debugger`). This is
the JNY-002 guarantee and is the whole point of the extension form factor. ✅

## 7. Task breakdown

- [ ] Extension build setup (manifest MV3, bundler, `screen-reader-mirror` workspace dep).
- [ ] Service worker: open side panel on action click.
- [ ] Content script `extract.ts`: run `linearize`, return serialisable result.
- [ ] Side panel UI: render the interpretation list + "Re-run" + empty/permission states.
- [ ] Surface the core mistake flags (unnamed control, missing alt) visibly.
- [ ] Manifest least-privilege review; load-unpacked manual check on a real authenticated page.
- [ ] Playwright (or Chrome-launch) e2e on a local fixture page; unit-test the extract/serialise glue.

## 8. Test plan

| AC | Test | Layer | File |
|---|---|---|---|
| AC-1 | action opens the side panel | e2e (loaded extension) | `packages/extension/e2e/panel.spec.ts` |
| AC-2 | panel lists the interpretation of a fixture page in order | e2e | `…/panel.spec.ts` |
| AC-4 | re-run after DOM mutation updates the list | e2e | `…/rerun.spec.ts` |
| AC-5 | unnamed button + missing-alt surfaced; hidden omitted | unit + e2e | `…/extract.test.ts` |
| AC-6 | no network requests during a run; manifest has no broad host perms | e2e/manifest assertion | `…/privacy.spec.ts` |
| AC-7 | restricted page → clear empty state | e2e | `…/restricted.spec.ts` |

(Operator does the final real-browser sign-off on an authenticated page at PR time — agents don't
self-certify UI.)

## 9. Risks & rollback

- **Risk:** MV3 side-panel/scripting APIs differ subtly across Chrome/Edge versions. *Mitigation:*
  target current stable Chrome first; feature-detect; document the minimum version. **Rollback:** the
  extension is a separate, unpublished package — disable/remove it without affecting the library.
- **Risk:** the engine's fidelity gaps (shadow DOM/iframes) mislead on complex apps. *Mitigation:*
  show an explicit "not yet traversed" note for those; they're tracked tickets.

## 10. Non-goals

- `chrome.debugger` real-AX-tree path (#20), iframe/shadow traversal (#21/#22), live-region
  announcements (#23), verbosity profiles (M2), the side-by-side *visual* render (follow-up), and
  Web Store publishing (a release task, not the MVP).
