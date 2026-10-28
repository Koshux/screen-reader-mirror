# Manual check: live regions in Firefox with NVDA

SPEC-004 describes how a live region is set up. It leaves five points it could not check against
a real screen reader. This checklist is for checking them by hand, in Firefox with NVDA. The
engine's own reading is given beside each point, so a difference is easy to spot. Record what
you observe; do not edit the expected values to match.

Companion page: [`firefox-live-regions.html`](firefox-live-regions.html). It is a local file
with no network access. Each button changes its region three seconds after you press it.

## Set-up

1. Record the versions: Windows, Firefox, NVDA (NVDA menu, Help, About).
2. Open NVDA's Speech Viewer (NVDA menu, Tools, Speech Viewer). It shows every phrase NVDA
   speaks, so you can copy the exact words into the results.
3. Open `firefox-live-regions.html` from disk in Firefox (File, Open File).
4. For what Firefox exposes, open the Accessibility Inspector (F12, then the Accessibility tab),
   select the region, and read its object attributes: `live`, `container-live`, `atomic`,
   `container-atomic`, `relevant`.
5. To compare polite and assertive, start NVDA reading the long paragraph at the bottom with say
   all (NVDA+Down Arrow), then press the button with the mouse. Polite should wait until NVDA
   stops speaking; assertive may cut in.

Press each button once, wait for the change, and reload the page between points.

## 1. Invalid `aria-live` tokens

`<div aria-live="bogus">` and `<div aria-live=" ASSERTIVE ">`.

- WAI-ARIA: an invalid token is treated as the default, so `bogus` is not a live region.
- Engine: `bogus` has no `live` field; `" ASSERTIVE "` is trimmed and lower-cased to
  `assertive`.
- Chrome: passes both values through as written.

- [ ] Firefox exposes for `bogus`: ______
- [ ] NVDA speaks after "Change the bogus region": ______ (expected: nothing)
- [ ] Firefox exposes for `" ASSERTIVE "`: ______
- [ ] NVDA speaks after "Change the upper-case region": ______ (polite or assertive?)

## 2. Nested regions

An outer `aria-live="polite" aria-atomic="true"` around an inner
`aria-live="assertive" aria-atomic="false"`; the inner text changes.

- Engine: each region carries its own `live` field and the engine does not decide which one
  applies (SPEC-004 AC-9). This point is what that decision would rest on.

- [ ] Firefox `container-live` on the changed text: ______
- [ ] NVDA speaks: ______ (only "Inner assertive changed.", or the whole outer region?)
- [ ] With say all running: interrupted, or waited? ______

## 3. A region inside a sentence

`<p>Total: <span aria-live="polite">12</span> items in the basket.</p>`

- Engine: text "Total:", a `generic` live node, text "12", text "items in the basket." (SPEC-004
  §3, a deliberate trade-off; Chrome's tree has the same node).

- [ ] Browse mode, Down Arrow onto the line: NVDA reads it as one line, or in pieces? ______
- [ ] After "Change the total", NVDA speaks: ______ (expected: "13" only)

## 4. `role="alert"` with `aria-live="polite"`

The page has the polite alert and a plain `role="alert"` for comparison. Both start empty.

- Engine: the explicit `aria-live="polite"` wins over the role's implicit `assertive`
  (SPEC-004 AC-3). The plain alert is `assertive`, `atomic: true`.

- [ ] Firefox `live` for the polite alert: ______; for the plain alert: ______
- [ ] With say all running, polite alert: interrupted, or waited? ______
- [ ] With say all running, plain alert: interrupted, or waited? ______

## 5. `aria-atomic` and `aria-relevant`

Two counts that change from 2 to 3, one in an `aria-atomic="true"` region and one in an
`aria-atomic="false"` region. Two lists that each lose their last item, one with
`aria-relevant="additions"` and one with `aria-relevant="all"`.

- Engine: `atomic` and `relevant` exactly as written (`relevant` defaults to
  `["additions", "text"]`).
- Expected by WAI-ARIA: the atomic region reads in full ("Cart: 3 items."); the other reads only
  the change ("3"). A removal is announced only where `relevant` includes removals. Screen-reader
  support for removals is known to be uneven, so record what happens rather than assume.

- [ ] Atomic count, NVDA speaks: ______
- [ ] Non-atomic count, NVDA speaks: ______
- [ ] Removal with `relevant: additions`, NVDA speaks: ______ (expected: nothing)
- [ ] Removal with `relevant: all`, NVDA speaks: ______

## Results

| Date | Windows | Firefox | NVDA | Checked by |
|---|---|---|---|---|
| | | | | |

Notes:

-

When the results are in, record them in a log under `docs/logs/`. Any point where the engine's
reading misleads a developer becomes a follow-up issue. Phrasing differences (one line or
several, the words NVDA uses) belong to the verbosity profiles (#10), not the engine.
