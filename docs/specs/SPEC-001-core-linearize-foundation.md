---
id: SPEC-001
title: Core linearization foundation — linearize(element) → ordered interpretation
status: implemented # AC-1..AC-6 on feat/SPEC-001-linearize (PR #33); AC-7 CDN check tracked as #5
journeys: [JNY-001]
target: core
created: 2026-06-14
---

# SPEC-001 — Core linearization foundation

> **Self-review applied (2026-06-15 · Stage 2.5 · issue #1).** Reviewed against the live
> `packages/core` scaffold. HIGH findings folded in below:
> 1. Defined the **name-vs-text "no double-read" rule** so an element's accessible name and the
>    descendant text that produced it are never read twice (§3) — the correctness crux.
> 2. Clarified that **role resolution is ours to build**: `dom-accessibility-api` computes the
>    *name* only; `aria-query` gives role *definitions*; implicit roles are **conditional**
>    (`<a>` is a link only with `href`), with `getComputedRole()` as the oracle where reachable
>    (§3, AC-2). The scaffold's unconditional `IMPLICIT_ROLES` is replaced, not grown (§4).
> 3. Noted the `getComputedStyle`/jsdom caveat for CSS-hidden detection (§5).
>
> Verdict: **implementation-ready.** The public API shape below is now the contract.

## 1. Summary

Deliver the first slice of the `core` engine for [JNY-001](../journeys/JNY-001-developer-sees-screen-reader-interpretation.md):
a pure, client-side `linearize(root)` that walks a DOM subtree and returns the ordered sequence a
screen reader would traverse — each item with its computed **role** and **accessible name** — with
AT-hidden content excluded. This is the foundation every later feature (verbosity profiles,
mismatch detection, the hosts) builds on.

## 2. Acceptance criteria

- **AC-1** — `linearize(root: Element)` returns an ordered array of interpretation nodes in
  depth-first document order (the screen-reader reading order for static content).
- **AC-2** — Each node includes a `role` resolved per WAI-ARIA (explicit `role` wins — the first
  non-abstract token of the list; otherwise the **conditional** implicit role per HTML-AAM / ARIA
  in HTML — e.g. `<a>` without `href` is *not* a link, `<li>` outside a list and an unnamed
  `<section>` are generic) and a `name` (accessible name per AccName 1.2 via
  `dom-accessibility-api`). An element whose role takes its name from content does **not** also
  emit its descendant text (§3).
- **AC-3** — Subtrees excluded from the accessibility tree are omitted: `aria-hidden="true"`,
  `display:none`, `visibility:hidden`, and `hidden`.
- **AC-4** — A heading carries its `level` (1–6, from `<h1>`–`<h6>` or `aria-level`); a styled
  `<span>` that is not a heading is **not** reported as one (it surfaces as text) — making the
  "looks like a heading but isn't" mistake visible.
- **AC-5** — An interactive element (a widget role per `aria-query` — button, link, textbox,
  checkbox, …) with no accessible name is reported with an explicit empty-name marker (`name: ""`
  + `flags.unnamed: true`), not silently blank.
- **AC-6** — `<img>` with **missing** `alt` is flagged (`flags.missingAlt: true`); `<img alt="">`
  (intentionally decorative) is omitted from the reading order, not flagged.
- **AC-7** — The public API is exported from the package root, is ESM, side-effect-free, and
  usable from a CDN with no build step. No network calls anywhere in `core`.

## 3. Design

Depth-first traversal of `root` in document order. For each element: determine AT visibility (skip
the element **and its subtree** if hidden); resolve its role; compute its accessible name; emit a
node — consuming descendant text into the name where the role takes its name from content (see
below). Shadow DOM, iframes, and live regions are **out of scope for SPEC-001** (tracked
follow-ups) but the node model must not preclude them.

#### Role resolution (genuinely ours — do not under-scope)

`dom-accessibility-api` computes the **name only**, not the role. `aria-query` provides role
*definitions* and an `elementRoles` map, but an element's implicit role is **conditional**:
`<a>`/`<area>` are `link` only with an `href` (else generic); `<input>`'s role depends on `type`;
`<li>` is `listitem` only inside a list; `<header>`/`<footer>` are `banner`/`contentinfo` only when
not scoped to a sectioning element. Resolution: an explicit `role` attribute wins (the first
token naming a **non-abstract** role — later tokens are fallbacks, per ARIA 1.2); otherwise apply
the conditional implicit mapping. *Implementation note (backfilled 2026-09-07):* the implicit
mapping is a **curated conditional switch** in `roles.ts` written from HTML-AAM / ARIA in HTML,
not a lookup of `aria-query`'s `elementRoles` (whose constraint strings are not machine-evaluable);
`aria-query` supplies the role *definitions* (name-from-content, children-presentational, abstract,
widget), with ARIA 1.2 overriding its stale 1.1 entries (`rowgroup` is name-from-author). Where a host can reach it,
`Element.getComputedRole()` (Chrome/Edge) is the higher-fidelity oracle; the JS computation is the
portable fallback. The scaffold's unconditional `IMPLICIT_ROLES` map (`a → link`, …) is a
placeholder and is **replaced** by this resolution, not extended.

#### Name vs. text — the no-double-read rule (correctness-critical)

A screen reader reads an element's accessible **name** *instead of* re-reading the descendant text
that produced it. So an element whose role takes its **name from content** (button, link, heading,
cell… per AccName step 2F) **consumes** its descendant text into its `name`, and we do **not** also
emit `text` nodes for that subtree. Text under elements that do **not** get a name from content (a
`<p>`, a generic `<div>` of prose) surfaces as `text` node(s) so reading order stays complete.
Getting this rule right is what stops the output reading every label twice or dropping paragraph
text; it is the most fixture-tested part of the engine.

*Clarification (backfilled 2026-09-07, from PR #33 review):* the rule consumes descendant
**text**, not descendant **elements**. A link inside a heading, a heading inside a block link, or a
link inside a table cell is still emitted as its own node after the parent (browsers expose both).
The only elements that swallow their whole subtree are host-language leaves (`<input>`,
`<textarea>`, `<select>`, `<img>`, `<hr>`) and roles that are **Children Presentational** in
ARIA 1.2 *and* named by author only (img, slider, separator, progressbar, meter, …). Content
widgets that are children-presentational (button, tab, option, switch) still descend, because
browsers keep their descendants in the tree — a missing-alt `<img>` or a link inside a `<button>`
is exactly what the developer needs to see. "Takes its name from content" is *not* by itself a
reason to stop descending (that mistake dropped every table body and every nested link). Each
emitted container starts a fresh text context: text is suppressed only directly under a node whose
own name came from content, so a list inside a table cell keeps its item text.

### Public API / data shapes

```ts
export interface InterpretationNode {
  role: string;              // computed ARIA role, or "text" for bare text runs
  name: string;              // accessible name (may be "")
  level?: number;            // headings: 1–6
  flags?: {
    unnamed?: boolean;       // interactive element with no accessible name
    missingAlt?: boolean;    // <img> with no alt attribute at all
  };
  // source pointer kept minimal & serialisable; no live node refs leak into output
  ref?: { tag: string };
}

export function linearize(root: Element): InterpretationNode[];
```

`LinearizeOptions` is the optional second argument, `linearize(root, options?)`. *Backfilled
2026-09-07:* it exists since PR #33 and today carries only the computed-style injection seam
(`getComputedStyle?: (el) => CSSStyleDeclaration | null`, from `VisibilityOptions`) used by tests
and non-browser hosts. Verbosity profile, include-hidden and shadow/iframe traversal will be added
to it additively, non-breaking.

## 4. File-level changes

| File | Change |
|---|---|
| `packages/core/src/types.ts` | `InterpretationNode` + supporting types |
| `packages/core/src/linearize.ts` | the traversal + node emission |
| `packages/core/src/roles.ts` | role resolution: explicit-token processing, conditional implicit roles, presentation conflict/inheritance, name-from-content / children-presentational / widget predicates (backfilled 2026-09-07) |
| `packages/core/src/visibility.ts` | AT-visibility predicate (aria-hidden/display/visibility/hidden) |
| `packages/core/src/index.ts` | export `linearize` + types; **remove the stub `IMPLICIT_ROLES`/`implicitRole`** (replaced by the §3 role resolution) |
| `packages/core/package.json` | add `dom-accessibility-api`, `aria-query` deps |

## 5. Edge cases

- **Applies now:** `aria-hidden`/`display:none`/`hidden` exclusion (AC-3); empty `alt=""` vs
  missing `alt` (AC-6); unnamed interactive controls (AC-5); `aria-level` on headings.
- **Deferred (own specs):** shadow DOM + slots, cross-origin iframes, live regions, circular
  `aria-labelledby` (note: `dom-accessibility-api` already terminates these — add a fixture to
  confirm), verbosity-profile phrasing.
- **Test-environment caveat:** `display:none` / `visibility:hidden` detection needs
  `getComputedStyle`, which jsdom implements only partially (no layout). Visibility fixtures should
  use **inline styles** or `happy-dom`/a real browser; attribute hiding (`aria-hidden`, `hidden`)
  is reliable everywhere. The predicate must read computed style defensively.
- **Reading order = DOM order.** Screen readers traverse the DOM/AX order, not the *visual* order,
  so CSS reordering (flex/grid `order`, positioning) is intentionally not reflected — a known,
  accepted divergence for this engine.

## 6. Privacy check (mandatory)

`core` performs **no** network I/O — pure in-process computation over a passed-in `Element`. This
is enforced by ESLint (`no-restricted-globals`) and the `block-no-telemetry` hook. ✅

## 7. Task breakdown

- [x] Add `dom-accessibility-api` (MIT) + `aria-query` (Apache-2.0, MIT-compatible) deps — licences noted in PR #33.
- [x] `visibility.ts`: AT-visibility predicate + fixtures (#2, PR #32).
- [x] `types.ts`: `InterpretationNode` (#3, PR #31).
- [x] `linearize.ts`: depth-first traversal, role + name, level, flags (#4, PR #33).
- [x] Wire exports in `index.ts`; ESM build + `sideEffects:false` confirmed (PR #33). CDN consumability check → #5.
- [x] Golden HTML fixtures for each AC (PR #33; broader real-world coverage → #6).
- [x] `pnpm verify` green; `minor` changeset added (PR #33).

## 8. Test plan

| AC | Test | Layer | File |
|---|---|---|---|
| AC-1 | reading order of a nested document | fixture | `packages/core/src/linearize.test.ts` |
| AC-2 | role + name for button/link/heading/img | fixture | `…/linearize.test.ts` |
| AC-2 | name-from-content consumed **once**: button "Save" not double-read; `<p>` text surfaces as `text` | fixture | `…/linearize.test.ts` |
| AC-2 | `<a>` without `href` is generic (not `link`); `<a href>` is `link` | fixture | `…/linearize.test.ts` |
| AC-3 | aria-hidden / display:none subtree omitted | fixture | `…/visibility.test.ts` |
| AC-4 | `<span class="h2">` ≠ heading; `<h2>`/`aria-level` = heading w/ level | fixture | `…/linearize.test.ts` |
| AC-5 | icon-only `<button>` → `unnamed:true` | fixture | `…/linearize.test.ts` |
| AC-6 | missing `alt` flagged; `alt=""` omitted; `<img alt="" role="img">` exposed (explicit role wins) | fixture | `…/linearize.test.ts` |
| AC-7 | package exports ESM; no network globals referenced | unit/lint | CI `lint` + `build` |
| AC-1 | nested document: `nav > ul > li > a`, `main > section[aria-label] > h2 + p` | fixture | `…/linearize.test.ts` |
| AC-1/2 | table keeps its body: rowgroup → row → columnheader/cell → link | fixture | `…/linearize.test.ts` |
| AC-2 | nested elements inside link/heading emitted; their text not re-read | fixture | `…/linearize.test.ts` |
| AC-2 | children-presentational leaves: `role=img` on span/svg, `<select>` | fixture | `…/linearize.test.ts` |
| AC-2 | multi-token `role`: first non-abstract token; abstract ignored (+ pinned upstream name divergence) | fixture | `…/linearize.test.ts` |
| AC-2 | `<li>` listitem only inside a list / `role=list`; orphan or under `role=presentation` generic | fixture | `…/linearize.test.ts` |
| AC-2 | `input[type=password]` textbox; `type=hidden` absent | fixture | `…/linearize.test.ts` |
| AC-2 | `<section>` / `<form>` landmarks only when named | fixture | `…/linearize.test.ts` |
| AC-4 | `role=heading` without `aria-level` → level 2; `aria-level` overrides the tag on `<h1>`–`<h6>` | fixture | `…/linearize.test.ts` |
| AC-2 | presentation conflict resolution: focusable / global-ARIA element keeps its implicit role; `<img alt="" aria-label>` exposed | fixture | `…/linearize.test.ts` |
| AC-2 | layout table (`role=presentation`) hides rows/cells, keeps content; explicit role on an owned element wins | fixture | `…/linearize.test.ts` |
| AC-2 | `<th scope=row>` rowheader; `<td>` in `role=grid` gridcell | fixture | `…/linearize.test.ts` |
| AC-2 | header/footer scoping (body vs main / sectioning content / sectioning roots / landmark roles); `<aside>` named-only inside sectioning content | fixture | `…/linearize.test.ts` |
| AC-2 | input types by HTML-AAM (submit/file, range, number, search, datalist → combobox), `<select multiple>`, `<area href>` | fixture | `…/linearize.test.ts` |
| AC-2 | inline `<svg>` named by `<title>` is an image; unnamed is decorative, `<title>` never read as text | fixture | `…/linearize.test.ts` |
| AC-2 | text context resets per container: list inside a cell keeps item text; `rowgroup` does not consume text | fixture | `…/linearize.test.ts` |
| AC-3 | `hidden` and `visibility:hidden` subtrees omitted through `linearize()`; `hidden=until-found` kept | fixture | `…/linearize.test.ts` |
| AC-5 | unnamed link/textbox/checkbox/select/textarea/slider flagged; empty `<th>`/`<tr>`/tablist **not** flagged | fixture | `…/linearize.test.ts` |
| AC-6 | missing-alt `<img>` inside a `<button>` still flagged; `role=button` card keeps its nested link | fixture | `…/linearize.test.ts` |
| AC-2 | pinned upstream divergences (`it.fails`): multi-token role name, focusable-presentation name, `<figure>` name from `<figcaption>` | fixture | `…/linearize.test.ts` |

## 9. Risks & rollback

- **Risk:** the pure-JS computation diverges from a real browser AX tree on tricky markup.
  *Mitigation:* lean on `dom-accessibility-api`; capture divergences as fixtures; hosts that can
  reach the real AX tree will later be the higher-fidelity path. **Rollback:** the API is additive
  and pre-1.0; revert the package, no consumers depend on it yet.

## 10. Non-goals

- Verbosity profiles (NVDA/JAWS/VO phrasing), mismatch heuristics, shadow DOM/iframe traversal,
  live regions, and any host (extension/cli/web) — each is its own later spec.
