---
date: 2026-09-07
spec: SPEC-001
branch: feat/SPEC-001-linearize
status: complete
---

# Log — 2026-09-07 — SPEC-001 PR #33 review fixes (#4)

Follow-up session on the open PR #33 (linearize engine). Trigger: the 7 Copilot review comments
on the PR were unanswered since 2026-06-18. An adversarial verification pass over them (two
independent verifiers per comment, each running scratch fixtures against the branch, plus a critic
looking for what the bot missed) confirmed 5 of 7, refuted 1, and found a worse defect the bot had
not seen: **every `<table>` lost its body.**

## What changed & why

**Engine — `packages/core/src/linearize.ts`, `roles.ts`**

- **Leaf rule rebuilt.** "Takes its name from content ⇒ leaf" conflated AccName step 2F with
  ARIA's *Children Presentational*, and `aria-query` 5.3.2 still marks `rowgroup` as
  name-from-content (ARIA 1.1), so `<tbody>` became an empty leaf and no row, cell or link inside
  any table was emitted. Now: leaf = host-language leaf (`<input>`/`<textarea>`/`<select>`/`<img>`/
  `<hr>`) or a children-presentational role *named by author only* (img, slider, separator,
  progressbar, meter…). Content widgets (button, tab, option, switch) descend like everything
  else, because browsers keep their descendants — so a missing-alt `<img>` inside a `<button>` is
  still flagged and a `role="button"` card no longer swallows its link.
- **No-double-read rule reworked to SPEC-001 §3 literally**: a name-from-content role suppresses
  bare *text* beneath it, but descendant *elements* still emit, and each emitted container starts
  a fresh text context (a list inside a table cell keeps its item text; a `rowgroup` never consumes
  text). A link inside a heading, a heading inside a block link, a button inside a link and a link
  inside a cell are all in the reading order now. (The 06-18 log called the nested-link case a
  SPEC-001 non-goal; §10 does not list it — it was a defect.)
- `rowgroup` overridden to name-from-author (ARIA 1.2).
- **`input[type=password]` → textbox** (was `null`, so the field vanished). Also `type=file` →
  button, datalist (`list` attribute) → combobox.
- **Unnamed `<section>` / `<form>` are generic** (were unconditional landmarks); named via AccName
  (`computeAccessibleName`, reused — not hand-rolled).
- **`<li>` is a `listitem` only under an element that resolves to `list`**; orphan `<li>` and
  `<li>` under `<ul role="presentation">` are generic.
- **Multi-token `role`**: first non-abstract token wins (ARIA 1.2); abstract roles skipped.
- **Presentation conflict resolution** (ARIA 1.2 §5.4.1): focusable or global-ARIA elements ignore
  `presentation`/`none` (incl. `<img alt="" aria-label>`); **presentation inheritance**: a layout
  table's rows/cells are generic unless they carry an explicit role.
- **Landmark scoping per ARIA in HTML**: `<header>`/`<footer>` are banner/contentinfo only when
  scoped to the body (not under `<main>`, sectioning content by tag *or role*, or a sectioning root
  such as `<dialog>`/`<figure>`/`<td>`); `<aside>` inside sectioning content is complementary only
  when named.
- `<th scope="row">` → rowheader; `<td>` in `role="grid"` → gridcell.
- **Inline `<svg>`** named by `<title>`/`aria-label` is an image; unnamed it is decorative — its
  `<title>`/`<desc>` were previously read out as body text.
- **Heading level**: `aria-level` wins over the tag on `<h1>`–`<h6>` (browsers honour it);
  `role="heading"` without `aria-level` → 2.
- **`unnamed` flag** no longer fires on table structure (`row`, `columnheader`, `gridcell`,
  `grid`…) or composite containers (`tablist`): an empty `<th>` corner cell was being reported as
  an unnamed control. `isWidget` now requires a pure widget lineage, plus the operable
  dual-inheritance roles (slider, spinbutton, tab, treeitem, listbox, tree).
- One `accessibleName()` helper (whitespace-collapsed, never throws) shared by both modules.

**Tests — `linearize.test.ts`**: 8 → 35 fixtures, one per behaviour above plus a nested-document
AC-1 fixture, the table fixture that would have caught the body drop, an AC-3 fixture for `hidden`
/ `visibility:hidden` through `linearize()`, a broad AC-5 fixture, and an implicit-role table
(header/footer scoping, input types, `<select multiple>`, `<area>`). Three `it.fails()` fixtures
pin *known upstream divergences* so they flip visibly when fixed: `dom-accessibility-api` reads
only the first `role` token and honours a literal `role="presentation"` when deciding
name-from-content (`<div role="foo button">Save</div>`, `<a href role="presentation">Link</a>`
get the right role but an empty name), and does not name a `<figure>` from its `<figcaption>`.

**Release** — `.changeset/linearize-engine.md` (`minor`; first real API). `pnpm changeset status`
passes. The 06-18 decision to defer the changeset to #5 contradicted `distribution.md`.

**Docs** — SPEC-001 backfilled: status `implemented`; AC-2/§3 no longer claim the implicit role
comes from `aria-query`'s `elementRoles` (curated conditional switch, recorded as an implementation
note); §3 clarifies text-vs-element consumption, the leaf rule and per-container text context; §3
API note that `LinearizeOptions` already exists (style-injection seam only); §4 lists `roles.ts`;
§7 ticked with the correct licence (aria-query is Apache-2.0, not MIT); §8 gains a row per fixture
group. `types.ts` documents `level` ≥ 1 via `aria-level`. Addendum on the 06-18 log.

## Tests

- `pnpm verify` (typecheck + eslint + vitest): **green — 47 tests** (35 in `linearize.test.ts`,
  3 of them `it.fails` by design).
- `pnpm build`: ESM + d.ts, deps externalised.
- `pnpm exec changeset status --since=origin/main`: one `minor` bump for `screen-reader-mirror`.
- Three exploratory probe runs (≈85 fixtures, not committed) across tables, labels,
  fieldset/legend, figure, details, dialog, nested lists, layout tables, tooltips, trees, SVG,
  grids, datalists; the committed fixtures are the subset that pins a decision.

## Self code review

Stage 5.5 was run as an adversarial workflow: four dimension finders (correctness with scratch
fixtures / ARIA + HTML-AAM standards / test coverage vs every AC and §8 row / privacy-reuse-release
hygiene), then a skeptical refuter per finding. Two runs stalled in the harness (tool calls left
unanswered after 20–30 min) and were stopped; the finders had completed, so their 30 raw findings
were triaged by hand, each reproduced with a scratch fixture before acting.

- **Privacy:** no network/telemetry in `core` (grep clean; ESLint `no-restricted-globals` on).
- **HIGH, fixed:** `unnamed` false positive on empty `<th>`/`<tr>`; list/paragraph text swallowed
  inside a name-from-content cell (sticky text suppression); missing-alt `<img>` inside a button
  invisible; `<svg><title>` read as body text; `aria-level` ignored on native headings.
- **MEDIUM, fixed:** header/footer/aside scoping (sectioning roots, landmark roles); `<td>` in a
  grid; datalist/file inputs; `aria-disabled` in the global-ARIA list; rowgroup override made
  observable (ARIA div-table fixture) and its comment corrected; `image img` fixture replaced by a
  token that can never become valid; AC-3 and AC-5 fixture gaps; duplicate AccName wrapper.
- **Refuted / not acted on:** `<li>` keyed on the parent's *role* rather than *element* — the spec
  and its test plan mandate the role-based check (the `<ul role="navigation"><li>` case is noted
  below).
- **Deferred as follow-ups** (see below): `<details>`/`<summary>` semantics, `<select multiple>`
  option children, figure/caption/legend double-read, adjacent text-run merging.

**Known follow-ups (not fixed here — candidates for one fidelity ticket):**
- `<details>`/`<summary>`: closed content is still emitted and `<summary>` has no role. Chromium
  exposes a disclosure button with expanded state and hides the closed body via internal
  `content-visibility`, which no `getComputedStyle` check sees. Needs verification against a real
  AX tree before choosing the role (`button` vs a host-specific disclosure role).
- `<select multiple>` / `size>1`: the listbox is a leaf, so its `<option>` children (which screen
  readers navigate) are not emitted.
- `<ul role="navigation"><li>`: the `<li>` is generic here (parent role ≠ list); browsers are
  inconsistent. Also `<div role="list"><li>` is a listitem per the spec, generic per HTML-AAM.
- Unnamed inline `<svg>` is treated as decorative (nothing emitted); Chromium may expose an
  unnamed `graphics-document`. Verify against the AX tree.
- Labelling elements are read once as the parent's name and once as text: `<caption>` (table
  name), `<legend>` (group name), `<label>` text next to its control. Faithful to the AX tree;
  collapsing them is a verbosity-profile decision (SPEC-001 non-goal).
- Adjacent bare text runs split by an inline element (`Loose <em>text</em> here`) come out as three
  `text` nodes; merging is a renderer/profile concern.
- Scope-less `<th>` is always `columnheader` (HTML-AAM's thead / first-cell heuristics not
  applied); `type=color/date/time` inputs approximate to textbox (HTML-AAM: no corresponding role).
- The three `it.fails` divergences above (upstream `dom-accessibility-api`).

## State at end of session

On `feat/SPEC-001-linearize`, pushed to PR #33. All Copilot comments answered on the PR. `main`
unchanged. AC-1..AC-6 implemented and fixture-tested; AC-7's CDN check remains #5.

## Hand-off notes

1. **Operator review of PR #33** — the human gate. Merge when satisfied (agents do not merge).
2. Then #5 (CDN consumability + README) → #6 (broader real-world golden fixtures — the probe
   fixtures above are a good seed) → #19 → first release. #12 (CI cache) is still open and
   independent; the lockfile is already committed.
3. File **one** follow-up issue for the "Known follow-ups" list above rather than eight.
4. Do not "fix" the `it.fails` fixtures by hand-rolling AccName — they flip when upstream does.
5. Harness note: multi-agent review workflows stalled twice this session on unanswered tool calls
   in verify phases; the finder phases completed. If it recurs, read `journal.jsonl` and triage
   by hand rather than re-running.
