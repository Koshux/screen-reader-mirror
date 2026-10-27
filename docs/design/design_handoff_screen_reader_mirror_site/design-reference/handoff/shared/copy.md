# Copy deck

Checked against section 5: sentence case, no exclamation marks, no em dashes, no ellipses, no banned words, no emoji, digits for numbers.

## Shared

- Product name: screen-reader-mirror
- Privacy statement (verbatim): Nothing on this page is sent anywhere. The analysis runs in your browser.
- Disclaimer: Not a screen reader. There is no substitute for testing with real screen readers and real users.
- Count summary: {n} items, {m} flagged.  (singular: 1 item, 0 flagged.)
- Announcement on results: Done. {n} items, {m} flagged.
- Announcement on copy: Copied.
- Name placeholder: no name
- Flags: No accessible name · Missing alt · Looks like a heading · Looks like a table · Clickable, not a control · Field without label
- Buttons: Run · Clear · Re-run · Copy JSON · Copy as text · Copy · Close
- Filter: Flagged only

## Demo page

- Title (h1, 5 words): See what screen readers hear
- Subtitle: Screen reader simulator for developers. Paste HTML, see the reading order.
- Document title: Screen reader simulator for developers | screen-reader-mirror
- Meta description: Free, open source screen reader simulator. Paste HTML and see the reading order, roles, accessible names and missing labels a screen reader gets. Runs in the browser, nothing is sent anywhere.
- Note: "simulator" is the term developers search for. The disclaimer "Not a screen reader" stays in the footer so the claim is honest.
- Lead: Paste HTML and choose Run. The list shows the reading order, with each item's role, accessible name, and anything worth checking.
- Header links: GitHub · npm
- Lead: Paste HTML and CSS. The middle pane shows the page. The right pane shows the reading order a screen reader gets, with the accessibility mistakes a sighted person cannot see.
- Pane labels (numbered steps with icons code, eye, ear): 1 Code · 2 Page · 3 Mirror
- Lead: Paste HTML and CSS. Page is what a sighted person sees. Mirror is the reading order a screen reader gets, with the accessibility mistakes a sighted person cannot see.
- Preview helper: Rendered from Code. Point at an element to find its row in Mirror.
- Guide section "Why this exists": The gap · What it does · What to do with it · Where it comes from (text in Demo page.dc.html)
- Comparison section "Compared with other tools": real screen readers, linters, devtools tree, simulators inside checkers, Virtual Screen Reader, Fangs and Site Unseen. Claims are factual; no superlatives.
- Header links: GitHub · npm · Report a divergence
- Code tabs: HTML · CSS. Example picker: Blue Badge form · Orders page · Card grid · Fake table · Navigation menu · Blank
- Editor labels: HTML. Ctrl+Enter runs. · CSS. Ctrl+Enter runs.
- Shortcuts (disclosure button "Shortcuts"): Ctrl+Enter or Ctrl+S run · Tab/Shift+Tab and Ctrl+]/[ indent · Ctrl+/ comment · Alt+Up/Down move line · Shift+Alt+Up/Down copy line · Ctrl+D duplicate · Ctrl+Shift+K delete line · Ctrl+L select line · Home smart · auto close pairs · Enter keeps indent · Ctrl+Z/Y undo redo
- About page (About.dc.html): Why this exists · How the mirror works · Compared with other tools, with a tool strip that opens one detail panel at a time (what it does, what it does not, beside the mirror). The demo page links to it with three cards.
- Preview helper: Rendered from the HTML and CSS on the left. Point at an element to find its row.
- Empty state: Paste HTML on the left and choose Run.
- Footer: © 2026 James Lanzon · GitHub repository · MIT license · 0.2, static pages. No analytics, no cookies.
- Bookmarklet lead: Run the mirror on any page without installing anything.
- Bookmarklet link: Mirror this page
- Bookmarklet drag helper: Drag this link to the bookmarks bar.
- Bookmarklet copy button: Copy bookmarklet code
- Bookmarklet copy helper: Or add a bookmark by hand and paste the code as its address.
- Install snippets: npm install screen-reader-mirror · import { linearize } from "https://cdn.jsdelivr.net/npm/screen-reader-mirror@0.2/+esm"
- Copy button labels (accessible): Copy npm command · Copy CDN import
- Footer: GitHub repository · MIT license · No analytics, no cookies. · then the privacy statement, then the disclaimer.

## Bookmarklet (for 7.2)

- Load failure: Could not load on this page. The site blocks scripts from other origins. Use the extension instead.

## Who it is for (About page and demo index)

- Developers and QA · Agencies and outsourced teams · Companies with legal duties (ADA, Section 508, European Accessibility Act, WCAG 2.2 AA) · Accessibility specialists
- Why, retitled: Speech is hard to picture as HTML. A speech viewer in NVDA or JAWS prints what is spoken. Mapping those words back to the markup takes an expert.
- Compliance wording is deliberately modest: "a check developers can run themselves, every day, not a substitute for an audit." No claims of conformance.

## Demo page pitch (replaces the index rows)

- H2: Read speech as HTML
- Body: A linter passes the page. A screen reader log is a wall of words. The mirror puts the reading order next to the markup, so any developer can see what a blind user gets, fix it, and run again. For dev teams, agencies and public bodies working to ADA, Section 508, the European Accessibility Act and WCAG 2.2.
- Links: Who it is for and how it works (About) · Compared with linters and screen readers (Compared)

## Install quick start

- Label: Quick start. Three lines, in the browser or in a test.
- Code: import { linearize } from "screen-reader-mirror"; · const items = linearize(document.body); // role, name, level, flags, in reading order · console.table(items.filter(i => i.flags)); // the rows worth checking
