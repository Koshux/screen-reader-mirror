# screen-reader-mirror

> See what a screen reader interprets from your UI — zero install, client-side, no data leaves the
> machine.

The shared engine behind [screen-reader-mirror](https://github.com/Koshux/screen-reader-mirror).
It computes the accessibility tree and the **linearized reading order** a screen reader would
traverse, so a sighted developer can spot semantic mistakes (skipped headings, unnamed controls,
images missing `alt`, "tables" with no table semantics) without a screen reader installed.

## Install

```bash
npm install screen-reader-mirror
```

Or from a CDN, no build step:

```html
<script type="module">
  import { linearize } from "https://cdn.jsdelivr.net/npm/screen-reader-mirror/+esm";
  console.log(linearize(document.body));
</script>
```

## Usage

```ts
import { linearize, implicitRole } from "screen-reader-mirror";

const nodes = linearize(document.querySelector("main")!);
// → ordered InterpretationNode[]: role + accessible name in reading order
```

## Status

**Pre-alpha (M1 scaffold).** `implicitRole` is real; `linearize` is a placeholder until
[SPEC-001](https://github.com/Koshux/screen-reader-mirror/blob/main/docs/specs/SPEC-001-core-linearize-foundation.md)
is implemented. Follow the [roadmap](https://github.com/Koshux/screen-reader-mirror/blob/main/docs/project/roadmap.md).

## Guarantees

- **No network calls.** This package never transmits anything (enforced by lint + a commit-time
  hook). Safe for regulated/EU/internal pages.
- **MIT licensed**, no vendor lock-in, tree-shakeable ESM.

## License

[MIT](https://github.com/Koshux/screen-reader-mirror/blob/main/LICENSE)
