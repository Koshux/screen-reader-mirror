---
date: 2026-10-26
spec: SPEC-004
branch: docs/SPEC-004-live-regions
status: complete
---

# Log: JNY-004 and SPEC-004, live regions (#23)

## What changed & why

Journey and spec for #23. Docs only; no code. Stage 2.5 review applied in the spec header,
status `spec-reviewed`.

The design was grounded in a Chrome probe before writing, recorded as a table in SPEC-004 §3.
The facts that shaped it:

- A role-less `aria-live` element is an exposed `generic` node carrying `live`, `atomic`, and
  `relevant`, even when empty. The engine treats such an element as transparent today, so the
  region is invisible. The spec makes it a node.
- `status` and `<output>` are polite and atomic, `alert` is assertive and atomic, `log` is
  polite. `timer`, `marquee`, and anything with `aria-live="off"` (including a `status`) carry no
  live values.
- `aria-busy` shows as `busy`. Nested regions each carry their own value.
- Chrome passes an invalid `aria-live` token through as written. The spec follows WAI-ARIA, which
  treats it as the default, and pins the difference.

`aria-query` already has the implicit live values per role and the valid token lists, so the
spec reuses it rather than adding a table.

## Tests

None to run. Dash check on both documents: none.

## Self code review

Stage 2.5 spec review, recorded in the spec: two HIGHs (AC-11 wrongly claimed the real-page
goldens stay identical, when two of them contain live regions; a role-less live region inside a
heading, link, or button would read its text twice, now AC-12), one MEDIUM (the journey asked for
nesting the flat output cannot show; reworded), two LOWs (an unverified "ignored" in the probe
table; an unverified claim about screen readers and invalid tokens). All folded in.

## State at end of session

PR #54 (SPEC-003 implementation) and the PR for this branch are open, both awaiting the operator.

## Hand-off notes

1. Operator: review #54 first, then this spec PR. SPEC-004 builds on #54's walk and oracle.
2. Agent: implement SPEC-004 on a branch from `main` once both have merged. Regenerate the
   component-demo and service-form goldens with `--write-expected` and check the diff is only the
   `live` field.
3. One open design choice for the operator to confirm at review: a live region inside a sentence
   breaks the text line in the reading order (SPEC-004 §3). The alternative leaves the region
   invisible.
