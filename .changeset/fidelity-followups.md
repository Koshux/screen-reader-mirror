---
"screen-reader-mirror": patch
---

Agree with Chrome in four more places. A name built from content leaves out the content of a status, group, note, alert, table, or landmark inside it, which is then read once on its own. A form field whose associated labels are all empty has no name, as in Chrome, instead of falling back to its title or placeholder. A header or footer inside main or sectioning content is a `sectionheader` or `sectionfooter`, and a sectioning root such as a blockquote or figure no longer changes that scope. Text runs end where the computed display starts a new line, so flex and grid items are read separately. The layout-table rules now read style through the `getComputedStyle` option.
