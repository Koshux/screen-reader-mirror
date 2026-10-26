# Design brief: screen-reader-mirror

> Paste this whole document into Claude Design, then ask for one surface at a time, in light and
> dark. The constraints in sections 3 to 5 are not preferences. A design that breaks one is sent
> back. Section 7 says what to deliver and section 8 is how we judge it.

## 1. What this is

screen-reader-mirror shows a developer what a screen reader gets from their page: the reading
order, with each item's role and accessible name, and the mistakes a sighted person cannot see,
such as a heading that is only a styled span, a button with no name, or an image with no alt.
It runs entirely on the user's machine. Nothing is sent anywhere, ever.

The interface is a mirror. The page's own content is the content of the interface. Our job is to
present that content so clearly that the mistakes are obvious and nothing competes with them.

## 2. Who it is for

- **Priya**, a front-end developer with no screen reader installed, checking a public form
  before it reaches a real user. She wants to paste markup and see the problem in seconds.
- **Marc**, a developer on an internal, logged-in application behind a VPN. He opens the
  extension on the live page and must be certain nothing leaves his machine.
- **A screen-reader user** who verifies the mirror against what their screen reader actually says
  and reports where the two disagree. This person uses our interface with NVDA, JAWS, or
  VoiceOver and a keyboard. If the interface fails them, the project has failed its own test.

The tool serves disabled people through the developers who build for them. The interface is not
about us, not about the brand, and not about how clever the engine is.

## 3. Principles

1. **Content first.** The list of nodes is the interface. Chrome around it earns its place or is
   removed.
2. **Truthful.** A flag means "worth checking", not "wrong". The interface never shows scores,
   grades, percentages, or pass and fail verdicts. We are a mirror, not a linter.
3. **Quiet.** No decoration, no gradients, no illustration, no animation that is not a direct
   response to the user's action. Calm surfaces, strong contrast, generous spacing.
4. **Fast to read.** A developer should find the first flagged item within two seconds of the
   results appearing.
5. **Private, and visibly so.** Each surface states, once and plainly, that nothing leaves the
   machine. Not as a badge or a selling point. As a fact.
6. **Respectful.** No inspiration language, no "empowering", no hero imagery of disability. Plain
   words about what the tool does.
7. **One system.** The three surfaces share tokens, components, and copy. A user who learns one
   knows the others.

## 4. Accessibility of the interface itself

These are requirements. They apply to every surface and every state.

- WCAG 2.2 level AA throughout. Text contrast at AAA (7:1) wherever the type is below 24 px.
- Every function is reachable and operable by keyboard alone. Focus order follows reading order.
- Focus is always visible: a 2 px ring with a 2 px offset, or a stronger equivalent, on every
  interactive element, in both themes.
- Pointer targets at least 44 by 44 CSS pixels.
- Meaning is never carried by colour alone. Flags have an icon and a text label as well as a
  colour.
- Honour `prefers-reduced-motion`, `prefers-contrast`, and `prefers-color-scheme`. Reduced
  motion means no motion.
- The layout reflows at 320 px wide and at 400 percent zoom with no horizontal scrolling.
- Text spacing can be increased by the user without clipping: 1.5 line height, doubled paragraph
  spacing, 0.12 em letter spacing, 0.16 em word spacing.
- The panel or page has a heading structure and landmarks: a main region for the results, a
  region for the controls, and a status area.
- Results completing, errors, and copy-to-clipboard confirmations are announced through a polite
  live region. The announcement is short: "Done. 42 items, 3 flagged."
- The results are a real list with list semantics. Each item exposes its role, name, and flags as
  text, so a screen reader reads a row the same way a sighted person scans it.
- Focus moves to the results region when results appear, and back to the trigger when a panel
  closes. No focus traps outside a genuine dialog, and no dialogs unless there is no other way.
- Error messages say what happened and what to do next, in that order.
- Type uses the system font stack. If a web font is proposed it must be self-hosted; the
  interface may not fetch anything from a third party at runtime.

## 5. Content and tone rules

The interface uses plain words and short sentences. These rules are checked line by line.

- Sentence case for everything, including buttons and headings.
- No exclamation marks. No em dashes. No ellipses in copy.
- No words from this list: powerful, seamless, effortless, delightful, supercharge, unlock,
  elevate, empower, revolutionary, intelligent, smart, magic, AI.
- No emoji in the interface.
- Buttons are verbs: Run, Copy JSON, Copy as text, Clear, Close, Re-run.
- Numbers as digits. Counts stated plainly: "42 items, 3 flagged."
- A flag's label names the problem, not the rule: "No accessible name", "Missing alt",
  "Looks like a heading", "Looks like a table".
- Never address the user as "you" in a way that assigns blame. "This button has no accessible
  name" rather than "You forgot to label this button".
- The privacy statement, verbatim: "Nothing on this page is sent anywhere. The analysis runs in
  your browser."
- Empty state tells the user what to do, in one line: "Paste HTML above and choose Run."

Examples of what to write and what to avoid:

| Write | Avoid |
|---|---|
| Run | Analyze now! |
| 42 items, 3 flagged | 42 nodes detected with 3 critical issues |
| No accessible name | Unnamed interactive widget detected |
| Looks like a heading | Semantic heading mismatch |
| Could not read this page. The site blocks scripts from other origins. Use the extension instead. | Oops! Something went wrong. |
| Nothing on this page is sent anywhere. | Your privacy is our top priority. |

## 6. The data every surface renders

The engine returns a flat, ordered list. Each item is one of these:

```json
{ "role": "heading", "name": "Orders", "level": 1, "ref": { "tag": "h1" } }
{ "role": "text", "name": "3 open, 1 overdue" }
{ "role": "button", "name": "", "ref": { "tag": "button" }, "flags": { "unnamed": true } }
{ "role": "img", "name": "", "ref": { "tag": "img" }, "flags": { "missingAlt": true } }
{ "role": "link", "name": "Details", "ref": { "tag": "a" } }
```

- `role` is what the thing is to a screen reader: heading, link, button, text, list, listitem,
  table, row, cell, textbox, checkbox, img, navigation, main, and so on. Bare text runs are
  `text`.
- `name` is what is announced for it. It can be empty, and an empty name on a control is the
  single most common mistake.
- `level` exists only for headings.
- `flags` lists conditions worth checking. Today: `unnamed` and `missingAlt`. Coming before
  1.0: `looksLikeHeading`, `looksLikeTable`, `clickableNotControl`, `fieldWithoutLabel`, and a
  per-item spoken phrasing for the NVDA, JAWS, and VoiceOver profiles. Design the row so flags
  can be added without redesign.
- Items inside a shadow root, an iframe, or a live region will carry a marker saying so.

The list is intentionally flat because reading order is flat. Do not indent by DOM depth; that
would imply structure a screen reader user does not get. Landmarks and headings may be given a
subtle visual rhythm so a scanning eye finds the sections, but the row anatomy stays the same for
every item.

### Row anatomy

Every row shows, in this order: a position number, the role (with the level for headings), the
accessible name, and the flags. Empty names are shown as a visible placeholder in the name slot,
"no name", so the absence is as visible as a presence. Long names wrap; they are never truncated
without a way to see the whole value.

## 7. The surfaces

### 7.1 Demo page (GitHub Pages)

Purpose: the first thing a stranger tries. Also the page a Show HN post links to.

Layout, top to bottom on narrow screens and side by side from 1024 px:

- A short heading and one sentence saying what the page does, then the privacy statement.
- Input: a textarea for HTML, a row of three or four sample snippets as buttons (a form, a card
  grid, a fake table, a navigation menu) that fill the textarea, and the Run button. Keyboard
  shortcut to run from inside the textarea, announced in the label.
- Output: the results list. Above it, the count and flag summary. Controls: Copy JSON, Copy as
  text, a filter to show only flagged items, and later a verbosity profile selector.
- Optional preview: the pasted HTML rendered in a sandboxed frame beside the list. Hovering or
  focusing a row outlines the matching element in the preview, and the reverse. This is the
  "mirror" made literal and is the one piece of interaction worth investing in.
- Below: the bookmarklet section (see 7.2) and the install snippets for npm and the CDN.
- Footer: repository link, license, the privacy statement repeated in full, no analytics notice.

States: empty, results, results with zero flags, large input (thousands of items; the list must
stay usable), input that is not HTML (we still run; nothing errors).

### 7.2 Bookmarklet

Purpose: run the mirror on any page the user is already looking at, with nothing installed.

On the demo page the bookmarklet is offered two ways, because dragging is not available to
keyboard users: a draggable link with instructions, and a "Copy bookmarklet code" button with
instructions for adding a bookmark by hand.

When activated it opens a panel on the host page. The panel is isolated from the host page's
styles and scripts. It contains the same results list and controls as the demo page, a Close
button, and a Re-run button. Hovering or focusing a row outlines the matching element on the host
page. Escape closes the panel and returns focus to where it was. The panel never covers the whole
page on wide screens; on narrow screens it is a bottom sheet with a visible handle and a Close
button.

If the host page blocks the script from loading, the user sees one plain message with the next
step: "Could not load on this page. The site blocks scripts from other origins. Use the extension
instead."

### 7.3 Browser extension (Chrome and Edge, side panel)

Purpose: the same mirror on live, logged-in, JavaScript-rendered pages, in the user's own browser
session, with no page content leaving the machine. The functional requirements are in SPEC-002.

- Clicking the toolbar icon opens a side panel. The panel has the results list, the count and
  flag summary, Re-run, Copy JSON, Copy as text, the flagged-only filter, and the privacy
  statement.
- Row hover and focus outline the element in the page, and the reverse.
- A restricted-page state when the browser does not allow reading the page, saying so plainly.
- An options surface with only what is needed: the verbosity profile, and later the opt-in for
  the real accessibility tree with the browser's warning explained in advance.
- Toolbar icon: a mirror glyph that reads at 16 px, monochrome-friendly, works on light and dark
  toolbars, delivered at 16, 32, 48, and 128 px.

### 7.4 Command-line output

Purpose: the same mirror in a terminal and in CI.

- A text layout for the list that reads well at 80 columns: position, role and level, name,
  flags. Flags marked with a symbol and a word, never a colour alone.
- A summary line first: "42 items, 3 flagged."
- Colour is optional and off when `NO_COLOR` is set or output is not a terminal.
- A JSON mode that prints the raw list for other tools.

## 8. Deliverables, per surface

1. Tokens: colour (light and dark, with contrast ratios recorded), type scale, spacing, radii,
   focus ring, border, elevation if any. Delivered as `tokens.json` and explained in `tokens.md`.
2. Components with every applicable state and their keyboard behaviour: node row, flag badge,
   count summary, button, textarea, sample-snippet buttons, filter toggle, select, status
   message, panel frame with header and Close, bottom sheet, empty state, error state, toolbar
   icon, favicon.
3. Screens for every state in section 7, light and dark, at 320, 768, and 1280 px wide.
4. The copy deck: every string, following section 5.
5. Accessibility annotations: focus order, heading and landmark structure, live-region
   announcements, what a screen reader reads for each row.
6. A short notes file with the reasoning and the trade-offs you made.

Export formats: PNG and SVG for screens, SVG for icons, JSON for tokens, Markdown for everything
else. Put them in the folders described in [README.md](./README.md).

## 9. How the design is judged

Each item is yes or no. One no sends the surface back.

- [ ] Every function works with a keyboard alone, and focus is visible everywhere.
- [ ] Every colour pair for text and controls meets the contrast rule in section 4, in both
      themes, with the ratios written down.
- [ ] No meaning is carried by colour alone.
- [ ] The layout works at 320 px and at 400 percent zoom with no horizontal scrolling.
- [ ] Reduced motion means no motion.
- [ ] The results are a real list; each row reads correctly to a screen reader.
- [ ] Results, errors, and confirmations are announced.
- [ ] Focus moves to results when they appear and returns to the trigger on close.
- [ ] The copy follows every rule in section 5, including the banned-word list and the absence
      of em dashes, exclamation marks, and emoji.
- [ ] The privacy statement appears once per surface, verbatim.
- [ ] No scores, grades, or verdicts anywhere.
- [ ] No third-party fetches at runtime: fonts, icons, and scripts are local.
- [ ] The three surfaces share the same tokens, components, and copy.
- [ ] Every screen in the handoff has alt text and accessibility notes.

## Appendix: sample input for designing with real data

```html
<main>
  <h1>Orders</h1>
  <p>3 open, 1 overdue</p>
  <span class="h2">Recent</span>
  <button><svg aria-hidden="true"></svg></button>
  <img src="chart.png">
  <a href="/orders/42">Details</a>
</main>
```

Produces, in order: main; heading level 1 "Orders"; text "3 open, 1 overdue"; text "Recent";
button with no name, flagged; image with no name, flagged missing alt; link "Details". The span
"Recent" is the trap: it looks like a heading on screen and is plain text to a screen reader.
That row is what the whole interface exists to make obvious.
