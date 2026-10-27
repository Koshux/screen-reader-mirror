---
"screen-reader-mirror": minor
---

The default reading now follows the W3C specifications (AccName 1.2, HTML-AAM, WAI-ARIA 1.2, ARIA in HTML, SVG-AAM 1.0), and a new option, `browser: "chrome"`, reads the page as Chrome does where the two differ (SPEC-006, ADR-0005). Any other `browser` value throws a `RangeError`. What changes in the default, and stays as before with `browser: "chrome"`:

- A table Chrome takes for layout is now a `table` with rows and cells.
- `<tbody>` is now a `rowgroup`.
- A table row is now named from its content.
- The text of a label for a checkbox or radio is now read as text as well as the control's name.
- An `<svg>` root is now a `graphics-document` whose content is read; Chrome mode makes one with nothing readable inside an `img`, and now also gives an unnamed one with only shapes an empty `img` node, as Chrome does.
- A `<th>` without `scope` now follows HTML's table model and can be a plain `cell`.
- Text inside an SVG `<defs>` or `<symbol>` is not read; Chrome mode reads it.

In both modes: an SVG shape, `g`, `use`, or `image` named by a `title` child or ARIA is now a node (`graphics-symbol`, `group`, `graphics-object`, `img`), SVG `<text>` is read as its own line, and a `<br>` separates the words on either side of it in a name. Chrome mode also names a `<dt>` from its content and applies the three Chrome differences the fidelity follow-ups pinned: names from content leave out the text of a status, group, table, or landmark; an empty associated label gives no name; and `role="region"` does not scope a header or footer.
