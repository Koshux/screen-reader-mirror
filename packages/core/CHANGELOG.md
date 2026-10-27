# screen-reader-mirror

## 0.4.0

### Minor Changes

- 7763508: The default reading now follows the W3C specifications (AccName 1.2, HTML-AAM, WAI-ARIA 1.2, ARIA in HTML, SVG-AAM 1.0), and a new option, `browser: "chrome"`, reads the page as Chrome does where the two differ (SPEC-006, ADR-0005). Any other `browser` value throws a `RangeError`. What changes in the default, and stays as before with `browser: "chrome"`:
  
  - A table Chrome takes for layout is now a `table` with rows and cells.
  - `<tbody>` is now a `rowgroup`.
  - A table row is now named from its content.
  - The text of a label for a checkbox or radio is now read as text as well as the control's name.
  - An `<svg>` root is now a `graphics-document` whose content is read; Chrome mode makes one with nothing readable inside an `img`, and now also gives an unnamed one with only shapes an empty `img` node, as Chrome does.
  - A `<th>` without `scope` now follows HTML's table model and can be a plain `cell`.
  - Text inside an SVG `<defs>` or `<symbol>` is not read; Chrome mode reads it.
  
  In both modes: an SVG shape, `g`, `use`, or `image` named by a `title` child or ARIA is now a node (`graphics-symbol`, `group`, `graphics-object`, `img`), SVG `<text>` is read as its own line, and a `<br>` separates the words on either side of it in a name. Chrome mode also names a `<dt>` from its content and applies the three Chrome differences the fidelity follow-ups pinned: names from content leave out the text of a status, group, table, or landmark; an empty associated label gives no name; and `role="region"` does not scope a header or footer.

## 0.3.1

### Patch Changes

- 0f814e5: A header or footer inside main or sectioning content is now a `sectionheader` or `sectionfooter`, as HTML-AAM maps it, and a sectioning root such as a blockquote or figure no longer changes the scope of a header, footer, or aside. Text runs end where the computed display starts a new line, so flex and grid items are read separately. A form field whose associated label is empty is named by its title, then its placeholder, as HTML-AAM says. The layout-table rules read style through the `getComputedStyle` option.

## 0.3.0

### Minor Changes

- 4fb46de: Show live regions: every node that is a live region carries a `live` field with its politeness, whether it is atomic, the relevant changes, and whether it is busy. A live region with no role of its own now appears as a `generic` node, even when empty, and `<output>` has the role `status`. The `LiveRegion` type is exported.

## 0.2.0

### Minor Changes

- 4315d50: Read the composed tree: open shadow roots, slots, and same-origin frames are now in the reading order, nodes are marked with `ref.shadow` and `ref.frame`, cross-origin frames appear as a `document` node flagged `unreachable`, and a new `getShadowRoot` option lets a host supply closed shadow roots.

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
