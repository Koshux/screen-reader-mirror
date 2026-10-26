---
"screen-reader-mirror": minor
---

Read the composed tree: open shadow roots, slots, and same-origin frames are now in the reading order, nodes are marked with `ref.shadow` and `ref.frame`, cross-origin frames appear as a `document` node flagged `unreachable`, and a new `getShadowRoot` option lets a host supply closed shadow roots.
