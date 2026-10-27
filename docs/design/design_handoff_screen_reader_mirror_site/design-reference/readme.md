# screen-reader-mirror design system

The visual and content system behind **screen-reader-mirror**, a screen reader simulator developers can read: paste HTML, get the flat reading order a screen reader speaks, beside the rendered page. Open source, MIT, runs in the browser. This system covers the website (landing, Getting started, About, Compared), the bookmarklet panel, the browser-extension popup and side panel, and future documentation.

Sources: built in this project from the pages `Demo page - Concept.dc.html`, `Getting started.dc.html`, `About.dc.html`, `Compared.dc.html`, `Surfaces.dc.html`, the reusable `MirrorPanel.dc.html` / `HostPage.dc.html`, and `handoff/tokens/tokens.json`. No external Figma or repository.

## Who it speaks to
Developers and QA first, then agencies, companies with ADA / Section 508 / European Accessibility Act / WCAG 2.2 duties, and accessibility specialists who need something to hand a team.

## Content fundamentals
- Plain, short, matter of fact. Second person ("Paste HTML. Get the reading order."). No exclamation marks, no emoji, no marketing adjectives.
- Headlines are sentences and end with a full stop: "See what screen readers hear." "Run it on your own pages." "Try it on a sample page."
- Kicker above every section in uppercase: "Getting started", "Live demo", "Surface A".
- Everything that is a sequence is numbered: panes 1 Code · 2 Page · 3 Mirror; paths 1 Bookmarklet · 2 Package · 3 Browser extension; guide steps; sub-steps as "3b".
- Honest scope lines appear verbatim: "Not a screen reader. There is no substitute for testing with real screen readers and real users." "Nothing on this page is sent anywhere."
- The product never claims more than it does: a flag "means worth checking", "not a score, not a verdict".
- The sample page is always called "the sample", and copy says explicitly that it is not this site.
- UI labels are one word where possible: Spoken, Preview, Nodes, JSON; Run; Copy / Copied; Flagged only.

## The one rule: speech first
The Spoken view shows only what a screen reader says: the accessible name, then the role phrase muted ("Apply for a Blue Badge, heading level 1"; "button"; "badge.png, image"). Anything the mirror itself wants to add is a **Note**: dashed border, flag colours, italic, warning glyph, prefixed for assistive tech with "Note, not spoken:". Never put "no name", icons or flags inside the spoken text. See `guidelines/speech.html` and `components/core/SpokenRow.jsx`.

## Visual foundations
- **Colour.** Slate ground, coral accent. Dark by default, light by OS preference (`.theme-auto`) or `.theme-light`. Text pairs meet 7:1. One accent only; the yellow flag pair is reserved for Notes; green appears only as the 1.8s "Copied" state. A graphite-and-ochre fallback theme (`.theme-ochre`) is kept from exploration. Host pages (the thing being mirrored) stay white with their own styling; the mirror draws a coral outline (`--host-outline`) on the highlighted element.
- **Type.** System UI stack on purpose (the tool renders other people's pages and must not bring a webfont); mono is ui-monospace. Bold, tight display type (700, -0.035em, line-height .98) at clamp(40px, 6.2vw, 84px) on the landing; inner-page h1 clamp(34px, 5vw, 64px); section h2 clamp(30px, 4vw, 48px). Body 16/1.5, UI 14, small 13, code 13, editor 12.5. Leads are muted and capped at 56–60ch.
- **Spacing.** 4-based scale; 28px page gutter, 16px under 640px. Sections open with 44–48px top padding. Ruled lists (1px `--border` top rules) instead of card grids.
- **Shape.** Radii 6 (marks) / 8 (controls) / 12 (panes) / 14 (hero figure); pills only for the note legend, toasts and the minimised panel. Borders are 1px; strong borders on controls. Shadows only on floating things (menus, toasts, panels over a host page).
- **Backgrounds.** Flat. Alternating sections use `--surface` with top and bottom rules. The only glow is the radial coral wash behind the hero illustration. No gradients elsewhere, no imagery; the hero is a line illustration drawn from tokens.
- **Motion.** Scroll-driven parallax on the hero (CSS variable `--sy` set per frame), a sub-pixel idle sway on the hero's floating rows (0.5–0.8s, ±1px, GPU transforms, paused when off screen), Copy buttons flip to green for 1.8s. Everything respects `prefers-reduced-motion` and the in-page Animations switch (`.motion-off`).
- **States.** Hover: `--surface` on outlined controls, `--accent-soft` on primary/ghost. Focus: 2px `--focus` ring, offset 2 (inset in segmented controls). Selected segment: `--accent-soft` ground, accent text, 600. Disabled: 45% opacity. Minimum hit target 44px on touch surfaces; controls 40px, compact 32px.
- **Layout.** Landing: hero → Live demo (1 Code collapsed rail, 2 Page, 3 Mirror) → Getting started → pitch + Learn more → footer. Three panes side by side from 1201px with the Code editor collapsed into a rail; Page and Mirror stacked and both visible below 1024px with Code as a collapsed bar above (never hidden behind a step). Inner pages: intro, sticky section nav with brand + page name (wraps, never clips; dropdown on narrow), 5/7 text/visual sections that go single column under 1100px, four-column footer that compacts to three link columns on mobile.

## Iconography
Lucide-style stroke icons, 1.75 stroke, 14–16px inline. Recurring glyphs: speaker (spoken), triangle warning (note), code brackets (Code), eye (Page), ear (Mirror), bookmark (bookmarklet), package (npm), grid (extension), copy and check, sun/moon (theme), waves (animations). No emoji, no icon font. The only brand mark is the mono "sr" in a 1.5px accent box (`assets/mark.svg`, `.srm-mark`); there is no wordmark, the name is set in the body face at 600.

## Index
- `styles.css` — entry; imports `tokens/colors.css`, `tokens/typography.css`, `tokens/spacing.css`, `tokens/components.css` (the `srm-` class layer).
- `guidelines/` — specimen cards: colours (dark, light, semantic), type (display, body), spacing, radii, speech-first, numbering, brand.
- `components/core/` — Button, CopyButton, Segmented, Switch, SpokenRow, Note, StepBadge, SectionHeader, Toast (each `.jsx` + `.d.ts` + `.prompt.md`), with `core.card.html`.
- `assets/mark.svg` — the brand mark.
- Reference screens (Design Components, same tokens inline): `Demo page - Concept.dc.html` (landing), `Getting started.dc.html`, `About.dc.html`, `Compared.dc.html`, `Surfaces.dc.html` (bookmarklet and extension storyboard), `MirrorPanel.dc.html`, `HostPage.dc.html`.
- `handoff/` — earlier token export and notes.
- `SKILL.md` — agent skill wrapper.

## Intentional additions
- `Toast` covers both the bookmarklet confirmation and the minimised pill; no separate Pill component.
- `SectionHeader` encodes the kicker / headline / lead block used on every page section.
