---
"screen-reader-mirror": minor
---

Show live regions: every node that is a live region carries a `live` field with its politeness, whether it is atomic, the relevant changes, and whether it is busy. A live region with no role of its own now appears as a `generic` node, even when empty, and `<output>` has the role `status`. The `LiveRegion` type is exported.
