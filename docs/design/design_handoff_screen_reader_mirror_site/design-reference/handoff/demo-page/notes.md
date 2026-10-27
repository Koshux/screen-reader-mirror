# Demo page notes

Source: Demo page.dc.html (fluid, props: theme, state, width, focusRow). Screens: Demo page screens.dc.html.

## Decisions

- All widths: the three steps are a stepper (one card at a time, tabs 1 Code, 2 Page, 3 Mirror with a short subtitle on wide screens). The earlier three-column layout was dropped for consistency across breakpoints. Originally: narrow layouts (container under 1000 px) became a stepper. A tab bar (1 Code, 2 Page, 3 Mirror) shows one step card at a time; each card carries Next and Back in its footer; Run jumps to Mirror. At 1000 px and wider all three cards show side by side and the stepper is hidden. The step tabs are a tablist; Next and Back are ordinary buttons so the flow works by keyboard.

- Revision 3 (2026-10-26): layout aligned to launch mockup 2a. Code pane gained HTML and CSS tabs, syntax colouring (a highlighted layer under a transparent textarea, so it stays a native textarea for assistive tech), an example picker (Blue Badge form, Orders, Card grid, Fake table, Navigation menu, Blank) and shortcuts: Tab/Shift+Tab indent, Enter keeps indent, Ctrl+/ toggles a comment, Alt+Up/Down moves a line, Ctrl+Enter runs. Editor CSS is injected into the sandboxed preview. Dark is now the default theme.

- Results have three views in a segmented control: Mirror (the page as a screen reader gets it, as a document: landmarks as small labels, headings at size, controls as outlined chips, images dashed), Nodes (the row list from section 6) and JSON. Both lists are real ordered lists; every row is focusable and outlines its element in the preview. The preview reports pointer position back so the mapping works both ways.
- Sections are banded: bookmarklet and install sit on the surface tone between two hairlines. Flat, no shadow.
- Palette: a low chroma blue-grey ground with one blurple accent in the dark theme, and its deep step in light. Ratios in tokens.json. Selected segment text on accent-soft is 6.6:1, so it is set bold at 14 px; flip to 16 px if the reviewer reads 7:1 as strict there.

- Three regions from 1024 px: Input, Results, Preview, as one grid that reflows to one column at 320 px. Nothing is fixed width, so 400 percent zoom behaves like 320 px.
- The results list is a real ordered list. Each row is one grid: position (aria-hidden, the list already numbers), role with level in mono, then name and flags wrapping together so a long name never pushes a flag off screen. No indentation by depth.
- Flags are a badge with a triangle icon and a label that names the problem. Colour is the third cue.
- Row 4, "Recent", is shown focused in the results screens with its element outlined in the preview. That is the mirror made literal and the only interaction worth investing in.
- One filled button, Run. Everything else is outlined so the primary action is unambiguous.
- The privacy statement appears once, in the footer (section 9: once per surface, verbatim). The top copy was dropped as redundant.
- Earlier Nocturne, Modernist and Industry explorations are superseded for this surface: web fonts and accent contrast fail sections 4 and 9.

## Heading and landmark structure

- header: mark, name, nav "Project links"
- h1 See what a screen reader gets from your HTML
- section "Input" (h2) · main "Results" (h2) · section "Preview" (h2)
- "Getting started" (h2) with Install (h3) then Bookmarklet (h3)
- footer

## Focus order

GitHub, npm, textarea, Form, Card grid, Fake table, Navigation menu, Run, Clear, Flagged only, Copy JSON, Copy as text, rows 1 to n, preview controls (sandboxed, inert by default), Mirror this page, Copy bookmarklet code, Copy (npm), Copy (CDN), footer links.

After Run, focus moves to the results list (tabindex -1 on the ol). Ctrl+Enter inside the textarea runs. Escape does nothing here; there is no dialog.

## Announcements (role=status, polite)

- Results: Done. 7 items, 2 flagged.
- Copy: Copied.
- Not HTML: still runs. Done. 1 item, 0 flagged.

## What a screen reader reads for a row

"List, 7 items. 1, main, no name." · "2, heading 1, Orders." · "5, button, no name, No accessible name." · "6, img, no name, Missing alt."

## Screens and alt text

- 01-empty-1280-light: demo page with an empty HTML box and the line "Paste HTML above and choose Run."
- 02-results-1280-light / -dark: three columns, HTML on the left, a 7 row reading order list in the middle with two flagged rows, the rendered page on the right with "Recent" outlined.
- 03-zero-flags-1280-dark: same page, summary "7 items, 0 flagged." and no badges.
- 04-not-html-768-dark: plain text input, result "1 item, 0 flagged." with one text row.
- 02-results-768-light: input and results side by side, preview below.
- 02-results-320-light: single column; rows wrap name and flags under the role.
- 01-empty-320-dark: single column empty state.

## Checklist (section 9)

Keyboard: yes. Contrast recorded: yes, tokens.json. Colour alone: no. 320 px and zoom: yes. Reduced motion: no motion exists. Real list: yes. Announced: yes. Focus to results and back: specified above. Copy rules: yes, copy.md. Privacy statement verbatim: yes (twice, see Decisions). Scores or verdicts: none. Third-party fetches: none. Shared tokens: tokens.json. Alt text: above.
