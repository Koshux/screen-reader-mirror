# screen-reader-mirror

> See what a screen reader interprets from your UI — zero install, client-side, no data leaves the
> machine.

The shared engine behind [screen-reader-mirror](https://github.com/Koshux/screen-reader-mirror).
`linearize(element)` walks a DOM subtree and returns the **reading order a screen reader would
traverse**: each node's WAI-ARIA role and accessible name, with assistive-tech-hidden content
removed and the common encoding mistakes flagged (a styled `<span>` that only *looks* like a
heading, a button with no name, an image with no `alt`). A sighted developer can see the
screen-reader view without a screen reader installed.

## Install

```bash
npm install screen-reader-mirror
# or
pnpm add screen-reader-mirror
```

Or straight from a CDN — ESM, no build step, no account:

```html
<script type="module">
  import { linearize } from "https://cdn.jsdelivr.net/npm/screen-reader-mirror/+esm";
  // or: https://unpkg.com/screen-reader-mirror?module
  console.table(linearize(document.body));
</script>
```

## Quickstart

```html
<main>
  <h1>Orders</h1>
  <p>3 open, 1 overdue</p>
  <span class="h2">Recent</span>
  <button><svg aria-hidden="true"></svg></button>
  <img src="chart.png">
  <a href="/orders/42">Details</a>
</main>
```

```ts
import { linearize } from "screen-reader-mirror";

const nodes = linearize(document.querySelector("main")!);
```

`nodes` is plain, serialisable data — one entry per thing a screen reader would land on, in order:

```jsonc
[
  { "role": "main",    "name": "",                 "ref": { "tag": "main" } },
  { "role": "heading", "name": "Orders",           "ref": { "tag": "h1" }, "level": 1 },
  { "role": "text",    "name": "3 open, 1 overdue" },
  { "role": "text",    "name": "Recent" },                         // ← styled span: NOT a heading
  { "role": "button",  "name": "",  "ref": { "tag": "button" }, "flags": { "unnamed": true } },
  { "role": "img",     "name": "",  "ref": { "tag": "img" },    "flags": { "missingAlt": true } },
  { "role": "link",    "name": "Details",          "ref": { "tag": "a" } }
]
```

Reading it:

- **`role`** is the computed WAI-ARIA role (explicit `role` wins; otherwise the *conditional*
  implicit role — `<a>` is a `link` only with `href`, `<li>` is a `listitem` only inside a list,
  an unnamed `<section>` is not a landmark). Bare text runs are `"text"`.
- **`name`** is the accessible name per AccName 1.2. An element whose name comes from its content
  (heading, link, cell…) carries that text in `name`; it is not read twice. Nested elements
  (the link inside a heading, the image inside a button) are still emitted after their parent.
- **`level`** is the heading level (`<h1>`–`<h6>`, or `aria-level`; `role="heading"` defaults to 2).
- **`flags.unnamed`** — an interactive control with no accessible name.
  **`flags.missingAlt`** — an `<img>` with no `alt` attribute at all (`alt=""` is treated as
  decorative and omitted, as a screen reader would).
- Content hidden from assistive tech (`aria-hidden="true"`, `hidden`, `display:none`,
  `visibility:hidden`) is excluded along with its subtree.

## API

```ts
function linearize(root: Element, options?: LinearizeOptions): InterpretationNode[];

interface InterpretationNode {
  role: string;                 // computed ARIA role, or "text"
  name: string;                 // accessible name (may be "")
  level?: number;               // headings only
  flags?: { unnamed?: boolean; missingAlt?: boolean };
  ref?: { tag: string };        // serialisable pointer — never a live node
}

interface LinearizeOptions {
  /** Override the computed-style source (for jsdom/happy-dom or non-browser hosts). */
  getComputedStyle?: (el: Element) => CSSStyleDeclaration | null | undefined;
}
```

Reading order follows **DOM order**, as screen readers do — CSS reordering (`flex`/`grid` `order`,
positioning) is intentionally not reflected. Shadow DOM, iframes, live regions and per-screen-reader
phrasing (NVDA / JAWS / VoiceOver verbosity) are tracked follow-ups on the
[roadmap](https://github.com/Koshux/screen-reader-mirror/blob/main/docs/project/board.md).

## Guarantees

- **No network calls — ever.** The engine is pure computation over the `Element` you pass in,
  enforced by lint and a commit-time hook. Safe for regulated, EU and internal pages.
- **Tree-shakeable ESM**, `sideEffects: false`, TypeScript types included. Two runtime
  dependencies, both permissively licensed: [`dom-accessibility-api`](https://github.com/eps1lon/dom-accessibility-api)
  (MIT, the AccName implementation Testing Library trusts) and
  [`aria-query`](https://github.com/A11yance/aria-query) (Apache-2.0, the WAI-ARIA role data).
- **MIT licensed**, public npm registry only, no account or API key.

## Status

`0.1.x` implements [SPEC-001](https://github.com/Koshux/screen-reader-mirror/blob/main/docs/specs/SPEC-001-core-linearize-foundation.md)
(reading order, roles, names, levels, flags, hidden-content exclusion) with a golden HTML fixture
per behaviour. The pure-JS role/name computation is the portable path; hosts that can reach a real
browser accessibility tree (the upcoming extension) will use it as the higher-fidelity oracle.

## License

[MIT](https://github.com/Koshux/screen-reader-mirror/blob/main/LICENSE)
