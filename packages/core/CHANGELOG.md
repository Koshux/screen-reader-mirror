# screen-reader-mirror

## 0.1.2

### Patch Changes

- a5d0372: Fidelity: bare text is emitted as runs (inline formatting no longer splits a line); details and summary are a group and a button with closed content hidden; list-box selects expose their options and optgroups; scope-less th follows the browser row-header heuristic; caption is a caption node and names its table; a focusable unnamed svg stays in the tree.
- 5acab5a: Fidelity against Chrome: thead and tfoot are row groups and tbody is not exposed; rows are named by the author only; borderless header-less tables with one row or column, or no cell borders, are treated as layout; every form is exposed as a form; dt, dd, and blockquote get their roles; a placeholder names a field as a last resort; label text for checkboxes and radios is read only as the control name; progress and meter are leaves.

## 0.1.1

### Patch Changes

- 3e756ce: Discoverability: richer npm keywords (screen reader, accessibility testing, reading order, accessible name, NVDA / JAWS / VoiceOver, …) and a clearer package description. No code change.

## 0.1.0

### Minor Changes

- 494bb7c: First real `linearize(root, options?)`: the screen-reader reading order of a DOM subtree — depth-first, with WAI-ARIA roles (conditional implicit roles, multi-token `role` fallbacks), AccName 1.2 accessible names, heading levels, assistive-tech-hidden subtrees pruned, and `unnamed` / `missingAlt` flags. Nested elements inside links, headings and table cells stay in the reading order.
