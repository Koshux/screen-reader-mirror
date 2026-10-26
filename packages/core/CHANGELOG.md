# screen-reader-mirror

## 0.1.1

### Patch Changes

- 3e756ce: Discoverability: richer npm keywords (screen reader, accessibility testing, reading order, accessible name, NVDA / JAWS / VoiceOver, …) and a clearer package description. No code change.

## 0.1.0

### Minor Changes

- 494bb7c: First real `linearize(root, options?)`: the screen-reader reading order of a DOM subtree — depth-first, with WAI-ARIA roles (conditional implicit roles, multi-token `role` fallbacks), AccName 1.2 accessible names, heading levels, assistive-tech-hidden subtrees pruned, and `unnamed` / `missingAlt` flags. Nested elements inside links, headings and table cells stay in the reading order.
