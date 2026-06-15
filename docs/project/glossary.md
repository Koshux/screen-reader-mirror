# Glossary (plain English)

A friendly translation of the jargon used across this project — for anyone (including a
non-technical contributor or stakeholder) reading the roadmap, board, or issues.

## What the tool is about

- **Screen reader** — software a blind or low-vision person uses that reads a web page aloud
  (e.g. NVDA, JAWS, VoiceOver). It doesn't "see" the page; it reads the underlying code's meaning.
- **Accessibility (a11y)** — whether a page actually works for people using assistive tech like
  screen readers. ("a11y" = "a", then 11 letters, then "y".)
- **Accessible name** — the label a screen reader announces for something, e.g. a button's name.
  If a button has no accessible name, the screen reader just says "button" with no clue what it does.
- **Role** — *what kind of thing* an element is to a screen reader: a heading, a link, a button, a
  list, etc. A `<div>` styled to *look* like a button has no button role, so the screen reader
  doesn't treat it as one — that's the kind of mistake this tool catches.
- **Reading order / "linearize"** — a screen reader goes through a page as one long sequence,
  top to bottom. "Linearize" means turning the page into that flat, ordered list of what gets
  announced. This is the heart of the tool.
- **Semantic mismatch** — when a page *looks* like one thing but *means* another to a screen
  reader. Classic example: a layout that looks like a table but has no table structure, so a screen
  reader reads it as a meaningless run of text.
- **Verbosity** — how chatty a screen reader is, and the exact wording it uses. NVDA, JAWS, and
  VoiceOver each phrase the same thing differently ("heading level 2, Foo" vs "Foo, heading,
  level 2"). M2 makes our output match each one.

## How it's built and shipped

- **Library / package** — a reusable piece of code other developers drop into their own project.
  Ours is the "interpreter library" — the engine, with no buttons or screens of its own.
- **npm** — the standard place developers download JavaScript packages from (`npm install ...`).
  Publishing here is how developers get our tool.
- **CDN** — a "content delivery network": a web link you can load code from directly in a page,
  with no install step (e.g. jsDelivr, unpkg). A second, even-easier way to use the tool.
- **CLI** — "command-line tool": something you run by typing a command in a terminal, handy for
  developers' automated checks.
- **Browser extension (MV3)** — a Chrome/Edge add-on. "MV3" (Manifest V3) is just the current
  format Chrome requires for extensions — an internal detail.
- **Monorepo** — one code repository that holds several related pieces (the engine, the extension,
  the CLI, the website) instead of separate repos.
- **CI** — "continuous integration": the automated checks (type-check, lint, tests, build) that run
  on every change to catch problems before they merge.
- **Changeset / release** — a small note attached to a change describing the version bump; it drives
  the automated publish to npm.

## Technical bits you may see in issues

- **DOM** — the live, in-memory structure of a web page that the browser builds from the HTML.
- **AX tree / accessibility tree** — a parallel structure the browser builds *specifically* for
  assistive tech; it's literally what a screen reader reads from. The most accurate source of truth
  when we can reach it.
- **ARIA** — extra HTML attributes (like `role=`, `aria-label=`) developers use to tell assistive
  tech what something is. Often misused, which is what we help spot.
- **AccName** — the official W3C rules for computing an element's accessible name. We follow them
  exactly (via a trusted library) rather than guessing.
- **Shadow DOM / web components** — a way to build reusable custom elements with their internals
  "encapsulated". Common in modern UIs; an advanced case for us (Later milestone).
- **iframe** — a page embedded inside another page. Each is its own little document (Later milestone).
- **Live region (`aria-live`)** — a part of a page that updates dynamically (e.g. a "saved!"
  message) and is announced when it changes.
- **Golden fixture** — a test that pairs a small snippet of HTML with the exact expected output, so
  we can prove behaviour and catch regressions.

See also: [roadmap](roadmap.md) · [board & dependencies](board.md) · [how we work](../sdlc/README.md).
