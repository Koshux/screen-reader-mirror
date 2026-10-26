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

## Web components and frames

The engine reads the tree the browser composes, not the page source:

- **Open shadow roots** are read at the host's position. A `<slot>` reads what is assigned to it,
  or its fallback content when nothing is. Light children that are not assigned to a slot are not
  read, because the browser does not render them. Nodes from a shadow tree carry
  `ref.shadow: true`.
- **Closed shadow roots** cannot be seen from page script. By default the host's light children
  are read as written, which may differ from what a screen reader hears. A host that can reach
  closed roots passes them in with `options.getShadowRoot`.
- **Same-origin frames** are a `document` node named from the iframe (`aria-label`, then
  `title`), followed by the frame's content. The node and everything inside carry `ref.frame`,
  the frame's 1-based index in reading order, so you can tell where a frame starts and ends. Text
  runs inside a frame carry `ref: { tag: "#text", frame }` for the same reason. A frame that has
  not loaded yet reads as an empty document; run again after it loads.
- **Cross-origin frames** cannot be read from the page. They appear as a `document` node with
  `flags.unreachable: true` and nothing inside. The frame's URL is never recorded.

## Live regions

A live region tells a screen reader to announce changes to part of the page. Every node that is
one carries a `live` field: how urgently a change is announced (`politeness`), whether the whole
region or only the changed part is read (`atomic`), which changes count (`relevant`), and
whether updates are held (`busy`). The values come from `aria-live`, `aria-atomic`,
`aria-relevant`, and `aria-busy`, or from the role: `alert` is assertive, `status` (and
`<output>`) and `log` are polite.

A live region with no role of its own, such as `<div aria-live="polite">`, appears as a
`generic` node, even when it is empty, so you can check that it exists before its message
arrives. An element with no `live` field is not set up to be announced.

The engine reads the page at one moment. `live` shows how a region is set up, not when or
whether a screen reader will speak: that depends on the screen reader and on how the page
changes. A common failure is inserting the region together with its message, which is often
not announced at all.

## W3C specifications by default, Chrome as an option

By default the reading follows the W3C specifications: AccName 1.2, HTML-AAM, WAI-ARIA 1.2,
ARIA in HTML, and SVG-AAM 1.0. Where HTML-AAM and ARIA in HTML differ, HTML-AAM wins, since it
is written for browsers. Browsers do not always follow these texts, so the default reading can
differ from what a screen reader on a given browser is given.

`linearize(root, { browser: "chrome" })` reads the page as Chrome does where the two are known
to differ. Each difference was read from Chromium's source and checked against Chrome's tree on
2026-10-26:

| Markup | Default (W3C) | `browser: "chrome"` |
|---|---|---|
| A table with no header cells, caption, or sections that Chrome takes for layout | `table`, `row`, `cell` | no table roles, content only |
| `<tbody>` | `rowgroup` | not exposed |
| A table row | named from its content | named by its author only, except in a grid |
| A name from content over a status, alert, note, group, table, landmark, and similar | includes their text | leaves their text out |
| A field whose associated label is empty | its title, then its placeholder | no name |
| `<header>` or `<footer>` inside `role="region"` | `sectionheader`, `sectionfooter` | `banner`, `contentinfo` |
| `<dt>` (`term`) | no name | named from its content |
| The text of a label for a checkbox or radio | read as text, and as the control's name | read only as the control's name |
| An `<svg>` with nothing readable inside | `graphics-document` | `img`; left out when it is unnamed and empty |
| A `<th>` without `scope` | HTML's table model; can be a plain `cell` | decided from the cells beside it |
| Text inside an SVG `<defs>` or `<symbol>` | not read | read |

Only `"chrome"` is accepted today; any other value throws a `RangeError`. The engine never
detects the browser it runs in: running in Chrome does not change the default. Markup outside
this table reads the same in both modes. Where the specifications give no ARIA role (`<input
type=file>`, `password`, the date and time types, the first `<summary>`, `<iframe>`), both modes
use the role every platform exposes: button, textbox, textbox, button, and document.

A tool that shows this output should say which mode it shows.

## API

```ts
function linearize(root: Element, options?: LinearizeOptions): InterpretationNode[];

interface InterpretationNode {
  role: string;                 // computed ARIA role, or "text"
  name: string;                 // accessible name (may be "")
  level?: number;               // headings only
  flags?: { unnamed?: boolean; missingAlt?: boolean; unreachable?: boolean };
  live?: {                      // live regions only
    politeness: "polite" | "assertive";
    atomic: boolean;
    relevant: Array<"additions" | "removals" | "text">;
    busy?: true;
  };
  ref?: {                       // serialisable pointer, never a live node
    tag: string;
    shadow?: true;              // the element is in a shadow tree
    frame?: number;             // inside the n-th frame met in reading order
  };
}

interface LinearizeOptions {
  /** Override the computed-style source (for jsdom/happy-dom or non-browser hosts). */
  getComputedStyle?: (el: Element) => CSSStyleDeclaration | null | undefined;
  /** Supply a closed shadow root the DOM hides. Defaults to `el.shadowRoot`. */
  getShadowRoot?: (host: Element) => ShadowRoot | null | undefined;
  /** Read the page as Chrome does where it differs from the W3C specifications. */
  browser?: "chrome";
}
```

Reading order follows **DOM order** in the composed tree, as screen readers do. CSS reordering
(`flex`/`grid` `order`, positioning) is intentionally not reflected. Per-screen-reader phrasing
(NVDA, JAWS, and VoiceOver verbosity) is a tracked follow-up on the
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

`0.x` implements [SPEC-001](https://github.com/Koshux/screen-reader-mirror/blob/main/docs/specs/SPEC-001-core-linearize-foundation.md)
(reading order, roles, names, levels, flags, hidden-content exclusion),
[SPEC-003](https://github.com/Koshux/screen-reader-mirror/blob/main/docs/specs/SPEC-003-composed-tree-shadow-dom-frames.md)
(shadow DOM, slots, and frames),
[SPEC-004](https://github.com/Koshux/screen-reader-mirror/blob/main/docs/specs/SPEC-004-live-regions.md)
(live regions), and
[SPEC-006](https://github.com/Koshux/screen-reader-mirror/blob/main/docs/specs/SPEC-006-browser-matching.md)
(the W3C default and the Chrome mode), with a golden HTML fixture per behaviour. The pure-JS role/name computation is the portable path; hosts that can reach a real
browser accessibility tree (the upcoming extension) will use it as the higher-fidelity oracle.

## License

[MIT](https://github.com/Koshux/screen-reader-mirror/blob/main/LICENSE)
