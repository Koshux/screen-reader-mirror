---
id: JNY-007
title: A developer trusts the names the mirror reads, word for word
status: draft # operator confirms at PR review
persona: Front-end developer on a design-system team who compares the mirror with Chrome-based checks in their build
related-specs: [SPEC-007]
created: 2026-10-28
---

# JNY-007: A developer trusts the names the mirror reads, word for word

> A journey is the why. No implementation detail.

## Persona

Amara builds the shared components for a design system used by several public-sector teams.
They do not use a screen reader day to day. They read the mirror's output line by line to check
that a component says what it should, and their build runs the mirror next to Chrome-based
accessibility checks, so they also compare the two when something looks off.

## Trigger

Three small things in one week. A menu button with its options marked up inside it read "Open
menu", and then "menu" again as text. Amara could not tell whether a screen-reader user really
hears the word twice or whether the mirror was wrong. Then a logo link read "LogoHome" in the
mirror's Chrome mode while Chrome's own check said "Logo Home". Last, an old `<a>` with a click
handler and no address was flagged as "clickable, not a button" in the mirror's Chrome mode,
while the Chrome check in the build showed it as a link.

## Goal

To read each control's name once, spelled the way it is announced, and to see Chrome's reading
when the mirror is asked to match Chrome, so a difference between the two points at the page
rather than at the tools.

## Story

Amara runs the mirror on the menu button again. It reads the button, "Open menu", once. The list
inside it is still shown as structure under the button, so Amara can still see that the list
is there, but its words are not read a second time, because they are already the button's name.
A list inside a table cell still reads its items, as before.

In Chrome mode the logo link now reads "Logo Home", as Chrome gives it, and the anchor with a
click handler is a link, so the "clickable" warning no longer fires on it there. With no setting,
the mirror keeps following the standards: the anchor is plain text and is flagged, and the
documentation says why the two modes differ. When Amara runs the tests on their own machine and
sees a space Chrome would not add, the documentation explains that the test environment, not the
mirror, adds it.

## Success criteria

- [ ] A control whose content is its name reads that content once, whatever structure is inside
      it.
- [ ] Content that is not part of the control's name (labelled separately, or left out by Chrome
      in Chrome mode) is still read.
- [ ] Content inside a table cell, heading, or link reads as it did before.
- [ ] In Chrome mode, names are spaced as Chrome spaces them, and an anchor that Chrome exposes
      as a link is a link.
- [ ] With no setting, the reading still follows the standards, and each new difference from
      Chrome is listed with what the standard says and what Chrome does.
- [ ] A known difference that comes from a test environment rather than a browser is written
      down, so it is not mistaken for a mirror bug.

## Failure modes

- The mirror hides words a screen-reader user does hear, and Amara misses a real problem.
- Chrome mode is right for these cases but drifts on real pages that agreed with Chrome before.
- Amara reads a spacing quirk of the test environment as a fault in their component.
- The default quietly starts following Chrome where the standards say otherwise.

## Out of scope

- Phrasing of the announcement (verbosity profiles).
- Seeing click handlers that a script adds without touching the markup: the page's markup is
  all the mirror reads.
- Firefox and Safari readings.

## Open questions

- None that block a spec. The maintainer chose on 2026-10-28 to fix the double read in both
  modes and to keep the inner structure visible.
