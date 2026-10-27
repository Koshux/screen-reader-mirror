---
"screen-reader-mirror": minor
---

New `interpret(root, options)`: the same reading order as `linearize()`, plus visual-versus-semantic mismatches (text that looks like a heading, elements that look like a table, an element that looks clickable with no button or link role, a field with no label), each with the signals it rests on. `linearize()` output does not change.
