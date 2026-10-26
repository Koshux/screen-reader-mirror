---
"screen-reader-mirror": patch
---

A header or footer inside main or sectioning content is now a `sectionheader` or `sectionfooter`, as HTML-AAM maps it, and a sectioning root such as a blockquote or figure no longer changes the scope of a header, footer, or aside. Text runs end where the computed display starts a new line, so flex and grid items are read separately. A form field whose associated label is empty is named by its title, then its placeholder, as HTML-AAM says. The layout-table rules read style through the `getComputedStyle` option.
