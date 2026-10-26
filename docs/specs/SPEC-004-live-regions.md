---
id: SPEC-004
title: Live regions in the interpretation
status: spec-reviewed
journeys: [JNY-004]
target: core
created: 2026-10-26
---

# SPEC-004: Live regions in the interpretation

> Issue #23. A live region tells a screen reader to announce changes to part of the page. The
> engine reads the tree at one moment, so it cannot say when an announcement happens. It can say
> which parts of the page are set up to be announced, how urgently, and how much would be read.

> **Self-review applied (2026-10-26, Stage 2.5).** Reviewed against the engine on the SPEC-003
> branch (PR #54). Corrections folded in:
> 1. AC-11 claimed the real-page goldens stay byte-identical. Two of them contain live regions
>    (`role="status"` in the component demo, `role="alert"` in the service form), so they gain a
>    `live` field and nothing else. AC-11 now says that, and the goldens are regenerated with the
>    oracle (§7).
> 2. A role-less live region turned into a container would start a fresh text context, so inside
>    a heading, link, or button its text would be read twice: once in the parent's name and once
>    as text. New AC-12: such a region passes the incoming text context to its children (§3).
> 3. The journey asked for a region inside another to be "visible as such". A flat list shows
>    both regions in order but not the nesting. The journey now asks for what the output can show,
>    and the extent stays a non-goal.
> 4. The probe table no longer says `aria-live="off"` nodes are ignored; the probe showed only
>    that they carry no live properties. The claim about what screen readers do with an invalid
>    token is replaced by what WAI-ARIA says.
> 5. Reuse confirmed: `aria-query` has the implicit values and the token lists, and `aria-live`,
>    `aria-atomic`, `aria-busy`, and `aria-relevant` are already in the global-attribute list
>    that overrides `presentation` in `roles.ts`. `alertdialog` has no implicit live value.

## 1. Summary

Live regions are invisible in today's output. A `role="status"` node appears with no sign that
it announces, and a plain `<div aria-live="polite">` does not appear at all, because a role-less
`div` is transparent. This spec adds a `live` field to every node that is a live region, with
its politeness, whether it is atomic, what changes are relevant, and whether it is busy. It makes
a live region with no role of its own appear as a `generic` node, empty or not, so the developer
can see that it exists before its message arrives. It maps `<output>` to `status`. The values
follow WAI-ARIA 1.2, use `aria-query` for the implicit values per role, and were checked against
Chrome's accessibility tree on 2026-10-26 (§3).

## 2. Acceptance criteria

- **AC-1** An element with `aria-live="polite"` or `aria-live="assertive"` produces a node with
  `live.politeness` set to that value. When its role would otherwise be transparent (no role,
  `generic`, or `paragraph`), it is emitted as a node anyway: `role` is the resolved role, or
  `"generic"` when there is none, and its content follows it as for any container.
- **AC-2** A role with an implicit live value is a live region without `aria-live`: `alert` is
  assertive and atomic; `status` is polite and atomic; `log` is polite. `<output>` has the role
  `status`. `timer` and `marquee` have the implicit value `off` and carry no `live` field.
- **AC-3** An explicit `aria-live` wins over the role's implicit value. `aria-live="off"` removes
  `live` from the node; the role is unchanged. An `aria-live` value that is not a valid token is
  ignored, so the role's implicit value, if any, applies.
- **AC-4** `live.atomic` is `true` or `false`: an explicit `aria-atomic="true"` or `"false"`
  wins, otherwise the role's implicit value, otherwise `false`.
- **AC-5** `live.relevant` lists the changes that are announced, from `aria-relevant`: valid
  tokens in the fixed order additions, removals, text, with `all` expanded to all three. Invalid
  tokens are ignored. When the attribute is absent or has no valid token, the value is
  `["additions", "text"]`.
- **AC-6** `live.busy` is `true` when `aria-busy="true"`, and absent otherwise.
- **AC-7** An empty live region (no content) is still emitted, with its `live` field and nothing
  after it.
- **AC-8** A live region hidden from assistive technology (`aria-hidden`, `hidden`,
  `display:none`, `visibility:hidden`, or inside a hidden ancestor) emits nothing, as today.
- **AC-9** Nested live regions each carry their own `live` field. The engine does not resolve
  which one a screen reader would use for a change inside both.
- **AC-10** A live region inside a shadow tree or a same-origin frame is represented the same way,
  with the `ref.shadow` and `ref.frame` markers from SPEC-003.
- **AC-11** Nodes that are not live regions have no `live` field. Output for markup with no live
  region is unchanged. The two real-page goldens that contain a live region (the status message
  in the component demo, the error summary in the service form) differ only by the `live` field
  on that node.
- **AC-12** A live region with a transparent role inside an element whose name comes from its
  content (a heading, link, or button) does not read its text again: its text is part of the
  parent's name, so the region node is emitted and its text is not.

## 3. Design

### What Chrome exposes (probe, 2026-10-26)

Read with `Accessibility.getFullAXTree` through `scripts/ax-tree.mjs --raw`:

| Markup | Chrome role | live | atomic | relevant |
|---|---|---|---|---|
| `<div aria-live="polite">` | generic | polite | false | additions text |
| `<div aria-live="assertive" aria-atomic="true" aria-relevant="all">` | generic | assertive | true | all |
| `<div aria-live="off">` | generic | none | | |
| `role="status"` | status | polite | true | additions text |
| `role="alert"` | alert | assertive | true | additions text |
| `role="log"` | log | polite | false | additions text |
| `role="timer"`, `role="marquee"` | timer, marquee | none | | |
| `<output>` | status | polite | true | additions text |
| `role="status" aria-live="off"` | status | none | | |
| `aria-live="polite" aria-busy="true"` | generic | polite | false, busy | additions text |
| `<span aria-live="polite">` inside a `<p>` | generic | polite | false | additions text |
| empty `<div aria-live="polite">` | generic, not ignored | polite | false | additions text |
| `<div aria-live="bogus">` | generic | bogus | false | additions text |
| `<section aria-live="polite" aria-label="Updates">` | region | polite | false | additions text |

Nested regions each carry their own value. Chrome passes an invalid token through as written.
WAI-ARIA says a user agent treats an invalid token value as the default, which for `aria-live`
is `off` or the role's implicit value, so the engine follows ARIA (AC-3) and the difference is
pinned in the probe. How each screen reader handles Chrome's raw value is not known and is not
assumed here.

### Resolution

A new `liveRegionOf(el, role)` in `packages/core/src/live.ts` returns a `LiveRegion` or
`undefined`:

1. Politeness: the `aria-live` attribute, lower-cased and trimmed, if it is one of the valid
   tokens from `aria-query` (`assertive`, `off`, `polite`); otherwise the role's implicit
   `aria-live` from `aria-query`'s role props; otherwise none. `off` or none means not a live
   region: return `undefined`.
2. Atomic: `aria-atomic` if it is `"true"` or `"false"`, otherwise the role's implicit
   `aria-atomic`, otherwise `false`.
3. Relevant: split `aria-relevant` on whitespace, keep the valid tokens, expand `all`, return in
   the fixed order additions, removals, text; default `["additions", "text"]`.
4. Busy: `aria-busy="true"`, case-insensitive.

`aria-query` already carries these values (`alert`: assertive and atomic; `status`: polite and
atomic; `log`: polite; `timer`, `marquee`: none), so nothing is re-derived.

### Traversal

In `emitElement`, before the transparent branch: if the element is a live region and its role
is transparent, it becomes a container with role `role ?? "generic"`. Its name follows the
existing rules, which give `generic` and `paragraph` an empty name because ARIA prohibits naming
them. `buildNode` sets `node.live` for any role, so `status`, `alert`, `log`, and a named
`section` (region) carry it too.

Such a region keeps the text context it was given. Its own role never takes a name from content,
so as an ordinary container it would start a fresh context and re-read text that a heading, link,
or button above it already holds in its name. Instead its children are walked with the incoming
`textConsumed`, the same as the transparent path does today (AC-12).

A role-less live region becomes a node, so it ends a text run at its edges like any container:
`<p>Total: <span aria-live="polite">12</span> items</p>` reads as text "Total:", a `generic`
live node, text "12", text "items". This is a deliberate trade-off. Without a node the region is
invisible, which is the failure the journey describes, and Chrome exposes the same node with the
text inside it. Screen readers in browse mode may read the three on one line; that is phrasing,
and belongs to the verbosity profiles (#10).

`<output>` maps to `status` in `roles.ts`, as HTML-AAM specifies and Chrome shows.

Interaction with SPEC-003: live regions met in shadow trees and frames go through the same
`emitElement`, so they carry `ref.shadow` and `ref.frame` with no extra work. This spec builds on
the composed-tree walk and its oracle changes, so implementation branches from `main` after
PR #54 has merged.

### Oracle

`scripts/ax-tree.mjs` keeps the `live`, `atomic`, `relevant`, and `busy` properties on each
flattened node. `scripts/ax-compare.mjs` stops treating a `generic` node with a `live` property
as transparent, and prints the live values on both sides, so the comparison checks politeness,
atomic, and busy line for line. Chrome's `relevant` string (`"additions text"`, `"all"`) is
normalised to the engine's expanded list.

### Public API / data shapes

```ts
// before
export interface InterpretationNode {
  role: string; name: string; level?: number; flags?: NodeFlags;
  ref?: { tag: string; shadow?: true; frame?: number };
}

// after (additive; a minor bump under ADR-0004)
export interface InterpretationNode {
  role: string; name: string; level?: number; flags?: NodeFlags;
  /** Present only when the node is a live region. */
  live?: LiveRegion;
  ref?: { tag: string; shadow?: true; frame?: number };
}

export interface LiveRegion {
  /** How urgently a change is announced: aria-live, or the role's implicit value. */
  politeness: "polite" | "assertive";
  /** True when the whole region is read on a change, false when only the changed part is. */
  atomic: boolean;
  /** The changes that are announced, from aria-relevant, with "all" expanded. */
  relevant: Array<"additions" | "removals" | "text">;
  /** aria-busy="true": the region is being updated and announcements are held. */
  busy?: true;
}
```

`LiveRegion` is exported from the package entry with the other types.

## 4. File-level changes

| File | Change |
|---|---|
| `packages/core/src/live.ts` | new: `liveRegionOf(el, role)` |
| `packages/core/src/types.ts` | `LiveRegion`, `InterpretationNode.live` |
| `packages/core/src/linearize.ts` | live region with a transparent role becomes a container; `buildNode` sets `live` |
| `packages/core/src/roles.ts` | `output` maps to `status` |
| `packages/core/src/index.ts` | export `LiveRegion` |
| `packages/core/test/live-regions.test.ts` | one fixture per AC, loaded from the probe page |
| `packages/core/test/fixtures/probes/live-regions.html` | the cases, shared with the Chrome comparison |
| `scripts/ax-tree.mjs`, `scripts/ax-compare.mjs` | live properties kept and compared |
| `packages/core/README.md` | the `live` field, and the statement that it shows set-up, not timing |
| `.changeset/*.md` | `minor` |

## 5. Edge cases

- **Shadow DOM / slots:** a live region in a shadow tree, or a slotted element inside one, is
  handled by the composed walk (AC-10). A live region in a frame likewise.
- **Cross-origin iframes:** unreachable, as SPEC-003; nothing inside is read.
- **`aria-hidden` / `display:none`:** a hidden live region emits nothing (AC-8). A region hidden
  now and shown later is a timing question, out of scope.
- **Empty `alt=""` vs missing `alt`, circular `aria-labelledby`:** unchanged.
- **Live regions:** the whole spec. Also: `role="alert"` with `aria-live="polite"` is polite
  (AC-3); `aria-live` on a widget such as a button is allowed and carried; `role="presentation"`
  with `aria-live` keeps its implicit role, because `aria-live` is a global attribute and
  already overrides presentation in `resolveRole`. `alertdialog` has no implicit live value
  in WAI-ARIA 1.2 or `aria-query`, so it carries `live` only with an explicit `aria-live`.
- **Verbosity profiles:** "polite" and "assertive" are data. How a screen reader phrases a
  region, and whether it reads an inline region on one line, is for #10.

## 6. Privacy check (mandatory)

No network. The engine reads attributes and the role data bundled with `aria-query`. Nothing is
observed over time and nothing is stored. `core` stays client-side and offline.

## 7. Task breakdown

Branch from `main` after PR #54 has merged.

- [ ] `types.ts`, `index.ts`: `LiveRegion` and the `live` field.
- [ ] `live.ts`: `liveRegionOf()` using `aria-query` for valid tokens and implicit values.
- [ ] `linearize.ts`: live container rule and `live` in `buildNode`; `roles.ts`: `output`.
- [ ] Probe page and `live-regions.test.ts`, one fixture per AC.
- [ ] Oracle: live properties in `ax-tree.mjs` and the comparison in `ax-compare.mjs`; run every
      case through `pnpm ax:compare`. Regenerate the component-demo and service-form goldens with
      `--write-expected` and check that the diff is only the `live` field (AC-11).
- [ ] README; `minor` changeset; `pnpm verify` green; log.

## 8. Test plan

| AC | Test | Layer | File |
|---|---|---|---|
| AC-1 | polite and assertive divs emit `generic` nodes with `live`; a live `<p>` keeps role `paragraph` and is emitted | fixture | `packages/core/test/live-regions.test.ts` |
| AC-2 | `alert`, `status`, `log`, `<output>`, `timer`, `marquee`: values from the table in §3 | fixture | same |
| AC-3 | `status` with `aria-live="off"`: role status, no `live`; `alert` with `aria-live="polite"`: polite; invalid token on a div: no node; invalid token on `status`: polite | fixture | same |
| AC-4 | `aria-atomic` true, false, absent, and on `alert` set to false | fixture | same |
| AC-5 | `aria-relevant` absent, `all`, `removals`, `text additions`, and invalid tokens only | fixture | same |
| AC-6 | `aria-busy="true"` and `"false"` | fixture | same |
| AC-7 | empty polite div: one node, nothing after | fixture | same |
| AC-8 | `aria-hidden` region, `display:none` region, region inside a hidden ancestor | fixture | same |
| AC-9 | assertive region inside a polite region: both nodes carry their own value | fixture | same |
| AC-10 | `role="status"` in an open shadow root and in a `srcdoc` frame | fixture | same |
| AC-11 | the real-page golden test passes; the regenerated goldens differ from `main` only by `live` on the two region nodes; the probe compared with Chrome | fixture + oracle | `packages/core/test/real-pages.test.ts`, `fixtures/probes/live-regions.html` |
| AC-12 | `<button>Items <span aria-live="polite">3</span></button>` and the same inside a heading: the region node is emitted, "3" is not read as text | fixture | `packages/core/test/live-regions.test.ts` |

## 9. Risks & rollback

- **Risk:** developers read `live` as a promise that a screen reader will speak. The README and
  the field's documentation state that it describes set-up, not timing, and name the common
  failure (a region inserted together with its message).
- **Risk:** the inline-region line break (§3) reads worse than a screen reader would. The probe
  pins it, and the verbosity profiles can join the lines.
- **Risk:** `aria-query` 5.x carries ARIA 1.1 data in places. The values used here (implicit
  `aria-live` and `aria-atomic` for alert, status, log, timer, marquee) are the same in 1.1 and
  1.2, checked against Chrome.
- **Rollback:** the field is additive; removing it and the container rule restores today's
  output with no API break.

## 10. Non-goals

- Observing the page and reporting announcements as they happen. That needs a long-running host
  (the extension) and builds on this field.
- Deciding which of two nested regions a screen reader uses for a change.
- Simulating `aria-relevant="removals"`; the value is reported, nothing is diffed.
- Phrasing (#10) and flagging messages that are not set up to be announced (#11).
- Marking the extent of a live region on the nodes inside it. A flat list has no extent for any
  container today; a general depth field would solve it for all of them and is left to the hosts'
  needs.
