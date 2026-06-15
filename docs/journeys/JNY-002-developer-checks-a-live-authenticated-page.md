---
id: JNY-002
title: A developer checks the screen-reader view of a live, logged-in page they can't share
status: approved
persona: Sighted developer testing a live internal/authenticated web app
related-specs: [SPEC-002]
created: 2026-06-15
---

# JNY-002 — A developer checks the screen-reader view of a live, logged-in page they can't share

## Persona

Marc is a front-end developer on an internal European Commission web application. The pages he
needs to check are **behind a login and a VPN**, render their content with JavaScript after he
interacts with them (open a panel, expand a step), and **must not be sent to any external service**.
He cannot paste the page's HTML into anything — partly because it's sensitive, partly because the
meaningful content only exists *after* the app has run in a real browser session. He still has no
screen reader installed and isn't allowed to install one.

## Trigger

He's on the actual page in his browser — logged in, with the real data loaded — and wants to know,
right now, what a screen reader would make of *this* live state, not a static snippet of it.

## Goal

To open something **in the browser he's already using**, on the page he's already on, and see the
linearized screen-reader interpretation of the live page — so he can catch semantic mistakes on
real, authenticated, JavaScript-rendered content without sending anything off his machine.

## Story

Marc clicks the add-on's icon. A panel opens beside the page. It shows the ordered, screen-reader
view of exactly what's on screen — headings, links, buttons and their accessible names, in reading
order — computed from the live DOM right there in his browser. He expands an accordion on the page,
re-runs, and sees the newly revealed content appear in the interpretation. He spots that the panel's
"Close" control is an unlabeled icon (announced as just "button") and that a status message isn't
being picked up. He fixes them in his code, reloads, and confirms. Nothing he looked at ever left
his laptop, and he never installed a screen reader.

## Success criteria

- [ ] He can get the linearized interpretation of the **live, currently-rendered** page from within
      his browser, in one click, with no separate app or upload.
- [ ] It works on a page that required **login / VPN** to reach (the add-on runs in his session).
- [ ] It reflects **JavaScript-rendered** content and content revealed by interaction when he re-runs.
- [ ] **Nothing leaves his machine** — no page content is sent anywhere.
- [ ] The same kinds of mistakes JNY-001 surfaces (skipped headings, unnamed controls, missing
      `alt`) are visible here, on the live page.

## Failure modes

- It silently misses content that's inside embedded sub-pages or custom components (he wrongly
  concludes the page is fine).
- It asks for scary-looking permissions, or shows a "this extension is debugging your browser"
  banner, and he abandons it.
- The interpretation is wrong, giving false confidence (worse than nothing).

## Out of scope

- The exact word-for-word phrasing of a specific screen reader (that's the verbosity work, M2).
- Reaching into embedded sub-pages (iframes) and custom-component internals (shadow DOM) — later.
- The highest-fidelity "real browser accessibility tree" path — a follow-up ([#20](https://github.com/Koshux/screen-reader-mirror/issues/20)); the MVP uses the same engine as the library.

## Open questions

- None blocking. The MVP computes from the live DOM with the core engine; the real-AX-tree path and
  embedded-content traversal are tracked as their own tickets.
