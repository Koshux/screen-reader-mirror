---
id: SPEC-007
title: Names read once, spaced as Chrome spaces them, and Chrome's anchor links
status: spec-reviewed # draft | spec-reviewed | in-progress | done | superseded
journeys: [JNY-007]
target: core
created: 2026-10-28
---

# SPEC-007: Names read once, spaced as Chrome spaces them, and Chrome's anchor links

> **Self-review applied (2026-10-28, Stage 2.5).** Reviewed against `main` at b84cc86.
> Corrections folded in:
> 1. HIGH: the row 12 link would have been unnamed. `dom-accessibility-api` decides name from
>    content by its own role mapping, under which an `<a>` without `href` is generic:
>    `computeAccessibleName(<a onclick>Click me</a>)` gives "" (checked in happy-dom), and its
>    `computeTextAlternative` is not exported. AC-4 now names such a link from what the walk reads
>    inside it, as row 7 already names a `term`, using a separate walk with no heuristics, and only
>    when it has no author name.
> 2. MEDIUM: the name scope must not reach into a shadow tree. The library names a host from its
>    light children only (upstream eps1lon/dom-accessibility-api#768), so shadow text never joined
>    the name. The scope now records its root node, and only a container in the same tree joins.
> 3. LOW: whether a nested container's text "joined the name" is decided by the same role test the
>    row 4 hook uses, not read back from the computed name. Checked on every probe case.
> 4. LOW: AC-4's test gains an anchor with `aria-label` and one holding an image.
> 5. Reuse confirmed: `hasAuthorLabel`, `contributesToAncestorName`, `isChildrenPresentational`,
>    `nameStyle` (roles.ts), the row 7 naming pattern (linearize.ts). No library offers
>    Chrome's spacing or anchor rules. No API change, no network.

> Follow-up 2 of `docs/logs/2026-10-27-spec-005-implementation.md`: three fidelity items in one
> spec, since all three touch name and role computation.

## 1. Summary

Three changes for JNY-007, each checked against the W3C texts and Chrome's tree on 2026-10-28.

1. **A list or `<details>` inside a button is read twice**: once in the button's name, then again
   as text after it, because each emitted container starts a fresh text context (SPEC-001 §3).
   WAI-ARIA 1.2 §5.2.9 gives `button` and seven other roles presentational children and warns
   that exposing them means "some information may be read twice". The fix applies in both modes
   (operator decision, 2026-10-28): inside such a role, text that joined its name is not read
   again at any depth. The nested nodes stay, as SPEC-001 decided.
2. **Inline name spacing.** The recorded difference turned out to be two things. First, a
   happy-dom artefact: happy-dom gives inline elements no computed `display`, so
   `dom-accessibility-api` puts a space around them, and the tests read "Save now" where Chrome,
   and the engine running in Chrome, read "Savenow". That is pinned, not changed. Second, a real
   Chrome rule: Chrome puts a space around a child that is an atomic inline, a control, or named
   by an attribute ("Logo Home"), and the library does not ("LogoHome"). AccName 1.2 has no
   spacing rule, so the default keeps the library's. Chrome mode follows Chrome: new SPEC-006
   inventory row 13.
3. **Chrome exposes `<a>` with no `href` as a link when it has a mouse-button handler**, new
   SPEC-006 inventory row 12. The default stays HTML-AAM (no role). In Chrome mode the anchor is
   a link, and `clickable-not-button` no longer fires on it there.

## 2. Acceptance criteria

- **AC-1** (item 1, both modes) An element is a **name scope** when its role has presentational
  children in WAI-ARIA 1.2 and takes its name from content (button, tab, option, checkbox, radio,
  switch, menuitemcheckbox, menuitemradio), and it has no non-empty `aria-label` and no
  `aria-labelledby`. Inside a name scope, a nested emitted container whose content joined the
  scope's name does not start a fresh text context: its text is not read again. Nested nodes
  (list, listitem, group, a nested button, an image, a link) are still emitted. The probe's
  `<button>Open <span role="list"><span role="listitem">menu</span></span></button>` reads
  button "Open menu", list, listitem, with no `text "menu"`, in both modes.
- **AC-2** (item 1) Content that did not join the name is still read. A nested element with an
  author name (`aria-label`, `aria-labelledby`) reads its own text in both modes
  (`<span role="region" aria-label="read">unread</span>` still reads "unread"). In Chrome mode,
  a nested role Chrome leaves out of a name from content (row 4: status, group other than
  `<details>`, note, alert, table, landmark, ...) still reads its text. In the default, where
  AccName 1.2 keeps every descendant's text, it does not.
- **AC-3** (item 1) Nothing changes outside a name scope. A list inside a table cell, a link, or
  a heading still reads its item text (cell, link, and heading do not have presentational
  children), and a button with an author name keeps today's reading.
- **AC-4** (item 3, row 12) In Chrome mode an HTML or SVG `<a>` with no `href` (and, for SVG,
  no `xlink:href`) that has an `onclick`, `onmousedown`, or `onmouseup` attribute is a `link`.
  Chromium's rule (`ax_node_object.cc`, `NativeRoleIgnoringAria`) is any click, mousedown,
  mouseup, or DOMActivate listener; the engine sees the attributes only. With no `browser`, it
  has no role (HTML-AAM: an `a` without `href` maps to `generic`). In both modes an explicit
  role wins, and `onkeydown` or `tabindex` alone does not make a link (Chrome agrees). The link
  is named as Chrome names it: its author name when it has one, otherwise from its content
  ("Click me"; an image inside gives its `alt`), and its text is not read again after it.
- **AC-5** (item 3) `interpret()` in Chrome mode reports no `clickable-not-button` on such an
  anchor. In the default it still does, with the same signals as today.
- **AC-6** (item 2, row 13) In Chrome mode, inside a name built from content, a child is
  separated from its neighbours by a space when it is an atomic inline (`img`, `svg`, `input`,
  `select`, `textarea`, `button`, `canvas`, `object`, `embed`, `iframe`, `video`, `audio`,
  `meter`, `progress`, or a computed display of `inline-block`, `inline-flex`, `inline-grid`, or
  `inline-table`), a control (a widget role), or named by an attribute (non-empty `alt`,
  `aria-label`, `aria-labelledby`, or a `title` on an element with no text), as Chromium's
  `ShouldInsertSpaceBetweenObjectsIfNeeded` does. `<a href><img alt="Logo">Home</a>` is
  "Logo Home" in Chrome mode and "LogoHome" in the default, when both run in a browser. Plain
  inline elements join with no space in both modes ("Savenow").
- **AC-7** (item 2) The happy-dom artefact is pinned: in happy-dom (`display` empty for inline
  elements), plain inline elements are spaced ("Save now") in both modes. The test says so and
  gives Chrome's value. A probe case that sets `display: inline` in author CSS shows the browser
  result in the unit tests. The existing text-run pin (Chrome's tree reads "Sameline" between two
  inline-block spans; the engine keeps "Same line") is unchanged.
- **AC-8** (oracle) `pnpm ax:compare` in Chrome mode: `fidelity-followups.html` goes from 4
  differing lines to 1 (the "Sameline" oracle limit), `mismatches.html` from 2 to 0, the four
  real pages stay at 0, and the new probe cases match Chrome apart from any line listed in the
  log with its reason. Both goldens per real page are regenerated only if the change is intended,
  and every golden diff is listed in the log.
- **AC-9** (docs) The SPEC-006 inventory gains rows 12 and 13 through a backfill note, the
  README's mode table gains both rows, the README's "not read twice" paragraph and SPEC-001 §3
  state the name-scope rule (SPEC-001 through a backfill note), and the `BrowserRules` fields
  carry the row numbers.

## 3. Design

### Evidence (2026-10-28)

- **WAI-ARIA 1.2 §5.2.9 Presentational Children** (and the ARIA 1.3 editor's draft): "User
  agents SHOULD NOT expose descendants of this element through the platform accessibility API.
  If user agents do not hide the descendant nodes, some information may be read twice." The
  roles with it that take a name from content are button, checkbox, menuitemcheckbox,
  menuitemradio, option, radio, switch, and tab (the spec's role tables, and `aria-query` 5.3).
  Link, heading, and cell do not have it.
- **Chrome** keeps a button's descendants in its tree (`button > list > listitem > StaticText`),
  as SPEC-001 noted when it chose to keep them as nodes. The oracle counts their text as already
  read in the button's name, which is how the two double reads showed as differing lines.
- **AccName 1.2** (Working Draft, 21 October 2026, and the editor's draft): "Name From Each
  Child ... Append the result to the accumulated text", with no spacing rule. A note says the WG
  is still deciding whether to join with or without spaces by CSS display (AccName #225).
  `dom-accessibility-api` adds a space around a child whose display is not `inline`.
- **Chromium** `ShouldInsertSpaceBetweenObjectsIfNeeded` (`ax_node_object.cc`) adds a space when
  the two sides are in different block flows, either is an atomic inline, either took its name
  from an attribute (alt, aria-label, title, value, placeholder, related element, caption), or
  either is a control. In Chrome: "Logo Home", "Go arrow now", "Heart Like" (an empty
  `<span role="img" aria-label>`), "Gear Settings" (an empty `<i aria-label>`), "Pick Red colour"
  (a select in a button), but "Savenow", "Boldtext", "Price2".
- **Chromium** `NativeRoleIgnoringAria`: an `<a>` or `<svg:a>` is a link "if it has an href or a
  click event listener", where the listener types are click, mousedown, mouseup, and DOMActivate
  (`event_util.cc`, `MouseButtonEventTypes`). In Chrome: `onclick`, `onmousedown`, `onmouseup`,
  and a script listener all give a link; `onkeydown`, `tabindex`, and a bare `<a>` do not; an
  explicit `role="button"` wins.

### Item 1: the name scope

In `emitByRole`'s container branch today, a container walks its children with
`textConsumed = consumesText`, its own rule. The walk gains a stack of open name scopes, each
the root node (document or shadow root) of its element:

```ts
const opensScope = consumesText && isChildrenPresentational(role) && !hasAuthorLabel(el);
const scope = walk.nameScopes.at(-1);
const keepsConsumed =
  textConsumed && scope !== undefined && el.getRootNode() === scope && contentJoinsAncestorName(el, role, ctx);
if (opensScope) walk.nameScopes.push(el.getRootNode());
walkChildren(el, walk, consumesText || keepsConsumed);
if (opensScope) walk.nameScopes.pop();
```

The same-root test keeps the walk in step with the library, which names a host from its light
children and never enters its shadow root (upstream #768): a container inside the host's shadow
tree did not join the name, so it starts fresh, as today.

`contentJoinsAncestorName(el, role, ctx)` (roles.ts) is true when the element has no author
label (`hasAuthorLabel`, now exported) and, when `ctx.rules.nameFromContentExclusions` is on,
`contributesToAncestorName` holds: the same test the Chrome name hook uses for row 4, so the walk
and the name agree on what joined the name. Transparent elements and live regions already pass
`textConsumed` through. Leaves are unaffected. An `aria-label` on the button keeps today's
reading: its own text is suppressed as now, and nested containers start fresh as now.

This is not a new inventory row: it is the same in both modes except where row 4 already
differs.

### Item 2: spacing (row 13, Chrome only)

`nameStyle` (roles.ts) is the style hook through which the engine already changes what the
library sees for `<br>` and row 4. With a new rule `spaceAroundAtomicAndNamedChildren`, it
returns the real style with `display` read as `inline-block` for a child Chrome spaces (AC-6),
unless the real display is `none` or the element is reported hidden. The library then adds the
space itself; the name is still computed by `dom-accessibility-api`. The hook does not touch the
root of the computation. In the default the hook is unchanged.

The test DOM gives every inline element an empty display, so in happy-dom the library already
spaces everything and row 13 is invisible there. The unit fixture for AC-6 and AC-7 sets
`display: inline` in the probe's style block on the case's inline elements, so happy-dom reports
what a browser reports.

### Item 3: the anchor (row 12, Chrome only)

`implicitRole` and `svgRole` (roles.ts) gain the rule `anchorWithClickHandlerIsLink`: an `a`
without `href` (or SVG `xlink:href`) with `onclick`, `onmousedown`, or `onmouseup` is a `link`.
One helper, `isHandlerLink(el, ctx)`, is the single test, used by both role functions and by
the name.

The name: `dom-accessibility-api` gives "" for it (its own role mapping has no link there, and
its text-alternative function is not exported). When `accessibleName` returns "" and the anchor
has no author label, `buildNode` names it from a separate walk of its children (a fresh `Walk`
with no heuristics, sharing only the options and role context, output discarded): the names of
the nodes read inside, joined with spaces and collapsed, as row 7 names a `term`. The real walk
then treats the link as any link (text consumed). Hidden content, slots, and shadow trees follow
the walk's own rules there.

Nothing else changes: `clickSignals` already returns nothing for an element with a role, so
AC-5 follows. `isFocusable` is unchanged (Chrome does not make such an anchor focusable).

### Public API / data shapes

No change. `BrowserRules` is internal; `browser` keeps its one value. Under ADR-0004 every change
here is interpretation, so the changeset is a `patch`: the default output changes only for text
inside a name scope, and the Chrome mode output for rows 12 and 13.

## 4. File-level changes

| File | Change |
|---|---|
| `packages/core/src/browser.ts` | rows 12 and 13: `anchorWithClickHandlerIsLink`, `spaceAroundAtomicAndNamedChildren` |
| `packages/core/src/roles.ts` | export `hasAuthorLabel`; `contentJoinsAncestorName`; `isHandlerLink` (row 12) in `implicitRole` and `svgRole`; row 13 in `nameStyle` |
| `packages/core/src/linearize.ts` | `nameScopes` on the walk; the container branch; the row 12 name in `buildNode`; doc comment on the no-double-read rule |
| `packages/core/test/shadow-dom.test.ts`, `fixtures/probes/web-components.html` | the scope and a shadow tree (AC-1) |
| `packages/core/test/fixtures/probes/fidelity-followups.html` | cases `name-scope`, `name-spacing`, `name-spacing-test-dom`, `anchor-click` |
| `packages/core/test/fidelity-followups.test.ts` | updated `name-from-content` pin; AC-1 to AC-3, AC-6, AC-7 |
| `packages/core/test/browser-modes.test.ts` | rows 12 and 13 in both modes; AC-3 sweep lists the new row cases |
| `packages/core/test/mismatches.test.ts` | `click` case per mode (AC-5) |
| `packages/core/README.md` | rows 12 and 13 in the mode table; the name-scope rule |
| `docs/specs/SPEC-006-browser-matching.md`, `docs/specs/SPEC-001-core-linearize-foundation.md` | backfill notes |
| `.changeset/*.md` | `patch` |

## 5. Edge cases

- **Shadow DOM / slots:** a nested container joins a scope only in the scope's own tree
  (§3). Slotted light children are in the host's tree and join, as the library reads them; the
  host's shadow content does not (upstream eps1lon/dom-accessibility-api#768), so the
  `host-name` pin is unchanged. A button inside a shadow root with all its content there is
  one tree and is scoped as usual.
- **Frames:** an `<iframe>` inside a button is its own document node; the frame's content starts
  a fresh walk (`emitElement(doc.body, walk, false)`), unchanged.
- **`aria-hidden` / `display:none`:** skipped before any of this. Row 13 never reveals: a hidden
  element keeps its hidden style in the hook.
- **Empty `alt=""` vs missing `alt`:** an `alt=""` image is not named by an attribute, but it is
  an atomic inline, so Chrome mode puts a space around it ("Go now" for `Go<img alt="">now`, as
  Chrome gives). A missing-alt image inside a button is still a node with `missingAlt`.
- **Circular `aria-labelledby`:** the hook does not follow references; the library's cycle
  handling is untouched.
- **Live regions:** a live region inside a name scope whose text joined the name is a node with
  no text after it, as SPEC-004 AC-12 already reads one inside a button. In Chrome mode a
  `status` inside a button is left out of the name (row 4), so its text is still read.
- **Verbosity profiles:** independent.
- **Nested name scopes:** `<button>` inside `<details>` inside a button: the summary's own text is
  consumed by its own name; the outer scope's counter is only ever raised and lowered in pairs.

## 6. Privacy check (mandatory)

No network. The anchor rule reads attributes already in the DOM; it does not inspect event
listeners. The oracle runs locally. No content is recorded beyond the existing goldens.

## 7. Task breakdown

Branch `feat/SPEC-007-name-fidelity` from `main` at b84cc86.

- [ ] `browser.ts`: rows 12 and 13.
- [ ] `roles.ts`: `hasAuthorLabel` export, `contentJoinsAncestorName`, row 12, row 13 hook.
- [ ] `linearize.ts`: name scopes.
- [ ] Probe cases in `fidelity-followups.html`, one `data-case` each.
- [ ] Tests: `fidelity-followups.test.ts`, `browser-modes.test.ts`, `mismatches.test.ts`; update
      the pins that change and list them in the log.
- [ ] Oracle in Chrome mode on `fidelity-followups.html`, `mismatches.html`, and the four real
      pages, before and after; goldens only if intended, every diff listed.
- [ ] README, SPEC-001 and SPEC-006 backfills, `patch` changeset, `pnpm verify`, log.

## 8. Test plan

| AC | Test | Layer | File |
|---|---|---|---|
| AC-1 | `name-from-content` pin updated (both double reads gone); `name-scope` case in both modes: list, details, nested button, missing-alt image, link inside a button, tab, option | fixture | `test/fidelity-followups.test.ts`, `fixtures/probes/fidelity-followups.html` |
| AC-2 | `name-scope`: an `aria-label` region inside a button reads its text in both modes; a status and a group inside a button read their text in Chrome mode only | fixture | same, and `test/browser-modes.test.ts` (row 4 test) |
| AC-3 | existing `linearize.test.ts` list-in-a-cell test unchanged; `name-scope`: list in a link and in a heading read item text; an `aria-label` button with a list inside reads as today | fixture | `src/linearize.test.ts`, `test/fidelity-followups.test.ts` |
| AC-4 | `anchor-click`: onclick, onmousedown, onmouseup, SVG `a`, explicit role, `onkeydown`, `tabindex`, bare `a`, an `aria-label` anchor, an anchor holding an image, in both modes, with names | fixture | `test/browser-modes.test.ts` |
| AC-1 (shadow) | a list inside a button's shadow tree still reads its text; slotted light content inside the button does not | fixture | `test/shadow-dom.test.ts`, `fixtures/probes/web-components.html` |
| AC-5 | `click` case in `mismatches.html`: the anchor's mark in the default only | fixture | `test/mismatches.test.ts` |
| AC-6 | `name-spacing` (author `display: inline`): img alt, aria-label span, svg, select, `alt=""`, plain inline, in both modes | fixture | `test/browser-modes.test.ts` |
| AC-7 | `name-spacing-test-dom` (no author display): plain inline spaced in happy-dom, with Chrome's value in the comment; `text-runs` pin unchanged | fixture | `test/fidelity-followups.test.ts` |
| AC-8 | `pnpm ax:compare` in Chrome mode, before and after, numbers in the log; `real-pages.test.ts` green on both goldens | oracle + fixture | `scripts/ax-compare.mjs`, `test/real-pages.test.ts` |
| AC-9 | README, SPEC-001, SPEC-006 text | review | docs |

## 9. Risks & rollback

- **Risk: hiding words a user hears.** Only text that joined the scope's name is suppressed, and
  only inside roles whose descendants WAI-ARIA says should not be exposed at all. Rollback: drop
  the counter; the walk is as before.
- **Risk: row 13 drifts on real pages.** The four real pages are at 0 differing lines today and
  are checked after. Rollback: set the rule to `false` in the Chrome rules.
- **Risk: script-added listeners.** Chrome makes a link from a listener the engine cannot see.
  Pinned in the README and the test; the same limit SPEC-005 states for `clickable-not-button`.

## 10. Non-goals

- Hiding a button's descendant nodes (the strict reading of §5.2.9). The operator chose to keep
  them, so a missing-alt image inside a button stays visible.
- Double reads inside a link or heading (`<a>Go <span role="note">new</span></a>` reads "new"
  again in the default). Neither role has presentational children, so §5.2.9 does not apply;
  a separate question if wanted.
- Chrome's exposure of `<canvas>` and `<object>` with an `aria-label` as nodes, and Chrome
  keeping label text for a checkbox whose label holds a text field (seen in the probe). Recorded
  in the log, not changed here.
- Detecting script-added event listeners.
