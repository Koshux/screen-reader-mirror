# Accessibility Correctness Rules

Accessibility correctness **is** the product. A subtly wrong accessible-name or role
computation is a defect, not a nit. When the spec and a real screen reader disagree, the screen
reader (and the W3C spec) win — and we write a golden fixture capturing it.

## Source of truth

- **Accessible name & description:** [AccName 1.2](https://www.w3.org/TR/accname-1.2/). Do not
  hand-roll the traversal (aria-labelledby chains, hidden-subtree handling, `alt=""` vs no
  `alt`, label/title/placeholder fallthrough). Use **`dom-accessibility-api`** — it's the
  implementation Testing Library trusts.
- **Roles & ARIA semantics:** [WAI-ARIA](https://www.w3.org/TR/wai-aria-1.2/) +
  [ARIA in HTML](https://www.w3.org/TR/html-aria/). Use **`aria-query`** for role definitions,
  required/supported states, and implicit-role mapping.
- **The real browser tree** (when a target can reach it): Chrome's
  `Accessibility.getFullAXTree` via CDP, or `getComputedRole()`/`getComputedLabel()`. Treat
  these as the highest-fidelity oracle; the pure-JS computation is the portable fallback.

## What is genuinely ours (and needs the most test rigor)

- **Linearization / reading order** — turning the AX tree into the sequence a screen reader
  would traverse. No existing library renders this; it's the heart of the tool.
- **Verbosity profiles** — NVDA / JAWS / VoiceOver announce the same node differently ("heading
  level 2, Foo" vs "Foo, heading, level 2"; link before vs after). Phrasing must be a pluggable
  profile, never hard-coded into the linearizer.
- **Visual-vs-semantic mismatch heuristics** — e.g. "looks like a table (CSS grid, aligned
  cells) but has no table semantics". These are heuristics: document the rule, cite the signal,
  and make false-positive behaviour explicit.

## Edge cases that must be handled (and fixture-tested)

- `aria-hidden` subtrees and `display:none` / `visibility:hidden` excluded from the name and
  the reading order.
- Shadow DOM (open roots) and `<slot>` reprojection.
- `<iframe>` / cross-origin frames (each frame is its own subtree where reachable).
- Empty `alt=""` (intentionally decorative) vs missing `alt` (a defect to flag).
- Circular `aria-labelledby` references (must terminate).
- Live regions (`aria-live`) — represented, even if announcement timing is target-specific.

## Practice

- Every behaviour ships with a **golden HTML fixture**: a markup snippet in, the expected
  linearized interpretation out. This documents intent and pins regressions.
- When unsure how a real screen reader behaves, say so in the spec and verify against an actual
  AX tree / SR rather than guessing.
