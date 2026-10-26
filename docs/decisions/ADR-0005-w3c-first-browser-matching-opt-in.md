---
id: ADR-0005
title: The W3C specifications decide the default; matching a browser is an option
status: proposed
date: 2026-10-26
---

# ADR-0005: The W3C specifications decide the default; matching a browser is an option

## Status

proposed (the maintainer marks `accepted`). The decision itself was made by the maintainer on
2026-10-26 in the review of PR #60; this record writes it down.

## Context

The engine was calibrated against Chrome's accessibility tree, the only oracle that can run
locally (`pnpm ax:compare`). Where Chrome and the W3C texts disagreed, several early choices took
Chrome's side: tables Chrome treats as layout are not tables, `tbody` is not exposed, a row is
named only by its author. PR #60 at first did the same for two more cases, and the maintainer
decided against it: the W3C specifications come first, always, and matching a particular tool is
to be offered for interoperability and integration.

The project serves regulated users who audit against standards, and ADR-0001 rules out lock-in
to one vendor. A default that tracks one browser ties the reading to that browser's choices and
leaves no stable reference when browsers disagree. Integrators who run the mirror next to
Chrome-based tools still need output that lines up with Chrome.

## Decision

1. **The default follows the W3C specifications:** AccName 1.2, HTML-AAM, WAI-ARIA 1.2, and ARIA
   in HTML, with the ARIA 1.3 roles where HTML-AAM maps to them (`sectionheader`,
   `sectionfooter`). Where two W3C documents differ, HTML-AAM, which is written for user agents,
   wins over ARIA in HTML, which is written for authors.
2. **Where the specifications give no ARIA role** (`input type=file`, `password`, `date`, the
   first `summary`, `iframe`), the engine uses the role every platform mapping exposes (button,
   textbox, button, document) and documents it. Both modes behave the same there.
3. **Matching a browser is an explicit option,** `browser: "chrome"` (SPEC-006). It applies each
   known Chrome difference, read from Chromium's source and checked against its tree. Other
   browsers can be added as values later.
4. **Every difference is pinned:** a test states the W3C result, and the Chrome result beside it.
5. The real-page comparison with Chrome runs in Chrome mode; the default output has its own
   goldens.

## Alternatives considered

- **Chrome by default, the specifications as an option.** Rejected by the maintainer: it makes
  one vendor the reference, and a reading that changes when Chrome changes cannot be cited in an
  audit.
- **The specifications only, no option.** Rejected: teams that compare the mirror with Chrome's
  own tree, Playwright's accessibility snapshot, or other Chrome-based tools would see noise they
  cannot turn off.
- **A table of individual switches,** one per difference. Rejected for now: a long list of flags
  is hard to explain and to test in combination. One named browser value keeps each mode
  coherent; single switches can be added later if a real need appears.

## Consequences

- **Good:** the default output can be cited against a published standard; browser behaviour is
  visible as named, tested differences rather than mixed into the default.
- **Bad / cost:** the default reading changes for layout tables, `tbody`, row names, checkbox
  and radio label text, and `svg` roots, so every real-page golden changes once, and the hosts
  must say which mode they show. Two goldens per real page.
- **Follow-ups:** SPEC-006 (the option and the inventory); `docs/project/v1-scope.md` "Done
  means" reads "agree with Chrome in Chrome mode"; a Firefox mode once a Firefox oracle exists.
