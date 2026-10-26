---
date: 2026-10-26
spec: SPEC-006
branch: docs/SPEC-006-browser-matching
status: complete
---

# Log: ADR-0005, JNY-006, and SPEC-006, W3C first with a Chrome option

## What changed & why

Docs only; no code. The operator decided in the review of PR #60: "W3C spec first, always.
However we should provide the functionality to toggle or change spec to match different tools for
interoperability and integration." This records the decision and specifies the option.

- **ADR-0005** writes the decision down: the W3C specifications decide the default (HTML-AAM over
  ARIA in HTML where they differ, since HTML-AAM is written for user agents); where they give no
  ARIA role, the common platform mapping is used and documented; matching a browser is the option
  `browser: "chrome"`; every difference is pinned.
- **JNY-006**: an agency tester who must cite standards in audits and whose build runs Chrome-based
  checks.
- **SPEC-006**: the inventory of every place the engine and Chrome differ (nine rows), the option,
  a `BrowserRules` object built once per call and passed with the role context, two goldens per
  real page, and the oracle in Chrome mode.

Sources read for the inventory: HTML-AAM (table, tbody, tr, td, th, form, summary, section, aside,
input types, iframe, and 4.1 for field names), ARIA in HTML (header, footer), AccName 1.2
(recursive name from content), SVG-AAM 1.0 (`svg` maps to `graphics-document`), and Chromium's
`ax_object.cc` and `ax_node_object.cc` (`SupportsNameFromContents`, the term and row special
cases, the landmark disallowed-ancestor lists, `DecideRoleFromSiblings`).

Five defaults change when SPEC-006 is implemented: layout tables become tables, `tbody` becomes a
`rowgroup`, rows are named from their content, checkbox and radio label text is read, and an
`svg` root is a `graphics-document`. The Chrome mode keeps today's reading for those and adds the
three differences PR #60 pinned plus Chrome's `term` naming.

## Tests

None to run. Dash check on the three documents: none.

## Self code review

Stage 2.5 spec review, recorded in the spec header: one HIGH (two Chrome-based defaults missing
from the inventory: toggle label text and the `svg` root role), one MEDIUM (AC-4 strengthened to 0
differing lines in Chrome mode on the real pages, and a person's review of the new default
goldens), one LOW (the scope-less `<th>` rule to compare with HTML's auto-scope algorithm). All
folded in.

## State at end of session

Branch `docs/SPEC-006-browser-matching` pushed; docs PR open, awaiting the operator. PR #60
(fidelity follow-ups, spec-first) is green and awaiting the operator; SPEC-006 is implemented
after it merges.

## Hand-off notes

1. Operator: review PR #60, then this docs PR. Confirm in particular rows 8 and 9 of the
   inventory: following the specifications brings back a double read for checkbox labels and
   makes SVG content readable.
2. Order: SPEC-006 before SPEC-005's implementation is suggested, since it changes the default
   reading SPEC-005's heuristics run on; either order works, and AC-7 covers the option on
   `interpret()` whichever lands second.
3. Agent: when implementing, take the Chrome name and label rules from commit e6aebab (branch
   `fix/fidelity-followups`); SPEC-006 §3 describes them in full in case that commit does not
   survive the merge.
