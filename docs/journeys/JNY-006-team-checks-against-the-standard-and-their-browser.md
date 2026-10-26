---
id: JNY-006
title: A team checks a page against the standard, and against the browser their tests run in
status: approved # by the Stage 2.5 review on 2026-10-26; operator confirms at PR review
persona: Accessibility tester at an agency that audits public-sector sites and runs Chrome-based checks in its build
related-specs: [SPEC-006]
created: 2026-10-26
---

# JNY-006: A team checks a page against the standard, and against the browser their tests run in

> A journey is the why. No implementation detail.

## Persona

Rui tests websites for an agency that audits public-sector services. Their reports cite the
published standards, so every finding has to rest on what the standard says, not on what one
browser happens to do. The agency's build also runs automated checks in headless Chrome, and
those checks compare the page with what Chrome exposes. Rui does not use a screen reader daily
and relies on the mirror to show what one is given.

## Trigger

An auditor at a client challenged one of Rui's findings: the mirror showed a pricing table as
plain text, because Chrome treats it as a layout table, and the auditor pointed out that the
standard says a table is a table. The same week, a developer on Rui's team asked why the mirror
and the Chrome-based check in the build disagreed about a button's name.

## Goal

To see by default what the standards say a screen reader is given, and, when needed, to see what
Chrome gives instead, with the differences named.

## Story

Rui runs the mirror on the pricing page. By default it shows the table as a table with its rows
and cells, as the standard says, and Rui can cite it. Rui then switches the mirror to match
Chrome and runs it again: the table is gone, read as plain text, which is what a screen reader on
Chrome gets. The mirror lists the places where the two readings differ and why, so Rui writes
both into the report: the markup is right by the standard, and Chrome's heuristic hides the table
from screen-reader users on Chrome. In the build, the team runs the mirror in Chrome mode next to
their Chrome-based checks, and the two agree, so a difference between them points at a real
problem rather than at the tools.

## Success criteria

- [ ] With no setting, the reading follows the W3C standards, and the documentation says which
      ones.
- [ ] One clearly named setting makes the reading match Chrome where Chrome differs.
- [ ] Each known difference between the two is listed, with what the standard says and what
      Chrome does.
- [ ] A team can tell from the output or the call which mode produced a reading.
- [ ] Markup where the standard and Chrome agree reads the same in both modes.
- [ ] A misspelt mode is reported, not silently treated as the default.

## Failure modes

- Rui cites a Chrome-mode reading in an audit as if it were the standard, or the reverse. The mode
  must be obvious.
- The list of differences is incomplete, so the two modes disagree in places nobody documented,
  and Rui loses trust in both.
- The Chrome mode is taken as a promise about other browsers. It describes Chrome only; Firefox
  and Safari may differ again.
- The standard is silent on something (a file upload field has no role in it). Rui needs to know
  when the reading rests on common practice rather than on the standard.

## Out of scope

- Matching Firefox or Safari. Later, once each can be checked the same way.
- Turning individual differences on and off one by one.
- Screen-reader phrasing. That belongs to the verbosity profiles.

## Open questions

- None that block a spec. Which of today's readings move from Chrome's behaviour to the standard
  is listed in the spec for the maintainer to confirm.
