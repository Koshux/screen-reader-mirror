---
"screen-reader-mirror": minor
---

First real `linearize(root, options?)`: the screen-reader reading order of a DOM subtree — depth-first, with WAI-ARIA roles (conditional implicit roles, multi-token `role` fallbacks), AccName 1.2 accessible names, heading levels, assistive-tech-hidden subtrees pruned, and `unnamed` / `missingAlt` flags. Nested elements inside links, headings and table cells stay in the reading order.
