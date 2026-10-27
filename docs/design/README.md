# Design: how the handoff works

The operator produces the visual and interaction design for every user-facing surface in Claude
Design, using [BRIEF.md](./BRIEF.md) as the prompt and the source of constraints. The exported
results are dropped into this folder. A spec for a surface references the accepted design, and
implementation does not start until the design passes the acceptance checklist in the brief.

This exists because the people this tool serves are disabled people, through the developers who
build for them. A surface that is hard to use with a keyboard or a screen reader would contradict
the whole project. The design gate is where that is checked first.

## Folder layout

```
docs/design/
  README.md                 this file
  BRIEF.md                  the brief, pasted into Claude Design one surface at a time
  handoff/
    tokens/
      tokens.json           colours, type scale, spacing, radii, focus ring, for light and dark
      tokens.md             what each token is for, in words
    shared/
      icon/                 app icon and favicon as SVG, plus PNG at 16, 32, 48, 128
      components/           one markdown file per component: anatomy, states, keyboard, naming
      copy.md               the copy deck: every string, grouped by surface
    demo-page/
      screens/              PNG and SVG exports, light and dark, at 320, 768, 1280 wide
      notes.md              rationale, accessibility annotations, alt text for every screen
    bookmarklet/
      screens/
      notes.md
    extension/
      screens/
      notes.md
    cli/
      output.md             text layouts for the terminal, with and without colour
```

Create only the folders you have content for. Empty folders are not committed.

## Naming

- Files and folders in kebab-case.
- Screens as `NN-state-breakpoint-theme.png`, for example `01-empty-320-light.png`,
  `02-results-1280-dark.png`, with the SVG next to it when one exists.
- Components as `component-name.md`, for example `node-row.md`, `flag-badge.md`.
- Every screen has an entry in the surface's `notes.md` with a one-sentence alt text and the
  keyboard and screen-reader notes for that state. The docs must be accessible too.

## What a handoff must contain before a spec can reference it

1. `tokens/tokens.json` with light and dark values, and contrast ratios recorded for every text
   and interactive colour pair.
2. Every component in the surface, with default, hover, focus, active, disabled, and error states
   where they apply, and the keyboard behaviour written down.
3. Every state of every screen: empty, loading if it exists, results, no results, error, and the
   permission or restricted state for the extension.
4. The copy deck for the surface, following the content rules in the brief.
5. The surface's `notes.md` with the accessibility annotations: focus order, live-region
   announcements, heading structure, landmark structure.
6. The acceptance checklist from the brief, filled in.

## Received handoffs

### Site, docs, and surfaces (2026-10-27)

[`design_handoff_screen_reader_mirror_site/`](./design_handoff_screen_reader_mirror_site/README.md)
is a Claude Design export covering the public website, the twelve docs pages, the install paths,
the bookmarklet and extension storyboards, and the NVDA testing flow. It keeps the export's own
layout instead of the `handoff/` tree above: its `README.md` is the entry point, and
`design-reference/` holds `.dc.html` references (open them from inside that folder),
`docs.css` as the source of every value, and an earlier token export under
`design-reference/handoff/`. The `.dc.html` files load React from unpkg to render locally; that is
for viewing only, and nothing ships from them.

It is built out in Phase C of [../project/v1-scope.md](../project/v1-scope.md), after the engine
work. The design intake checks it against the six requirements above before any spec references
it. What it has and what it still needs, as received:

1. Tokens with light and dark values: present (`design-reference/handoff/tokens/tokens.json`,
   `docs.css`), with 7:1 text pairs stated. The intake confirms every interactive pair is
   recorded too.
2. Components and states: in `docs.css` and `design-reference/components/core/`; keyboard
   behaviour is written for some components, not all.
3. Every state of every screen: HTML references, not PNG exports; the 18 error and empty states
   are on "Reading the output". The extension's permission and restricted states need checking.
4. Copy deck: `design-reference/handoff/shared/copy.md` plus final copy in the pages.
5. `notes.md` with accessibility annotations: only for the demo page so far.
6. The brief's acceptance checklist, filled in: not included yet.

The handoff also marks what was not in the repo when it was drawn (the NVDA bridge, the capture
API, most CLI flags) as Proposed. Those need their own journeys and specs.

## How implementers use it

Tokens become CSS custom properties. Components are plain HTML and TypeScript, no framework,
matching SPEC-002's decision for the extension. Screens are the reference, not the source of
truth: when a screen and the accessibility requirements in the brief disagree, the brief wins and
the screen is revised. Any deviation during implementation is noted in the implementation log and
mirrored back into `notes.md`.

## Revisions

Designs change. Keep the previous export when a screen is replaced, suffixed with the date it was
superseded, until the implementation that used it has shipped. Record what changed and why at the
top of the surface's `notes.md`.
