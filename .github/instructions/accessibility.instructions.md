---
applyTo: "packages/**/*.ts"
---

# Accessibility correctness (auto-loaded for package source)

Canonical: [`.claude/rules/accessibility.md`](../../.claude/rules/accessibility.md).

- Accessible **name/description** → [AccName 1.2](https://www.w3.org/TR/accname-1.2/) via
  `dom-accessibility-api`. **Roles/states** → WAI-ARIA via `aria-query`. Do not hand-roll the
  traversal.
- The genuinely-ours parts (most test rigor): **linearization/reading order**, **verbosity
  profiles** (NVDA/JAWS/VO phrasing must be pluggable, never hard-coded), and **visual-vs-
  semantic mismatch heuristics**.
- Always handle and fixture-test: shadow DOM (open roots) + slots, cross-origin iframes (where
  reachable), `aria-hidden`/`display:none` exclusion, empty `alt=""` vs missing `alt`, circular
  `aria-labelledby`, live regions.
- A subtly wrong name/role computation is a **defect**, not a nit. When unsure how a real screen
  reader behaves, verify against an actual AX tree rather than guessing.
