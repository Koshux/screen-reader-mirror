---
id: JNY-005
title: A developer finds the parts of a page that look like one thing and are told as another
status: approved # by the Stage 2.5 review on 2026-10-26; operator confirms at PR review
persona: Sighted front-end developer maintaining pages built from styled divs, no screen reader installed
related-specs: [SPEC-005]
created: 2026-10-26
---

# JNY-005: A developer finds the parts of a page that look like one thing and are told as another

> A journey is the why. No implementation detail.

## Persona

Noor maintains the booking pages of a regional council. The pages were built years ago from a
component kit that styles plain blocks of text to look like headings, tables, and buttons. Noor
has never used a screen reader and cannot install one on their work laptop. The pages hold
residents' details, so nothing from them may leave the machine.

## Trigger

A resident who uses a screen reader wrote in. On the opening-hours page they heard a stream of
words, "Day Hours Monday 9 to 5 Tuesday 9 to 5", with no way to tell which hours belong to which
day. On the booking page they could not find the sections, and the "Book" tile did nothing when
they pressed Enter. Noor can see a tidy table, clear section titles, and a button on screen, and
has no way to tell what a screen reader is told about any of them.

## Goal

To find, before the next resident does, each place where the page looks like a heading, a
table, a button, or a labelled field, and a screen reader is not told so.

## Story

Noor runs the mirror on the booking page. The reading order shows "Choose a date" as plain text,
and beside it a mark: looks like a heading. The mark says why: the text is larger and bolder
than the text around it. The opening-hours grid is marked as looking like a table, because it is
laid out in rows and columns with borders round the cells. The "Book" tile is marked as clickable
but not a button, because it has a click handler written on it and nothing tells a screen reader
it can be pressed. The name field is marked as having no label: the word "Name" sits just before
it, but the two are not connected, so a screen reader hears an empty text field.

Noor turns the section titles into headings, the grid into a table, the tile into a button, and
connects the label, then runs the mirror again. The marks are gone. One mark remains on a large
price, "12 euro", which looks like a heading only because it is set in large type. Noor can see
the reason given, judges it to be fine, and moves on. The mirror says plainly that these marks
are guesses from how the page looks, and that it cannot see a click handler added by a script,
so a clickable element without a mark is not proof that it works.

## Success criteria

- [ ] Each of the four cases, text that looks like a heading, a grid that looks like a table, an
      element that looks clickable but is not a button or link, and a form field with no label,
      is marked at its place in the reading order.
- [ ] Each mark says what it is in plain words and which signals it rests on, so Noor can judge
      a false alarm without reading the rules.
- [ ] A mark covers all of the reading order that belongs to it: a whole grid, not one cell.
- [ ] Markup that is already right carries no mark: a real heading, a real table, a real button
      or link, a field with a label.
- [ ] Content hidden from a screen reader carries no mark.
- [ ] The reading order itself is the same with or without the marks.
- [ ] The mirror says that the marks are guesses, and names what it cannot see.

## Failure modes

- False confidence from silence. A click handler added by a script cannot be read from the page,
  so a clickable element that shows no other sign of it carries no mark. Noor must not take "no
  mark" to mean "works with a keyboard and a screen reader".
- Noise. If large prices, bold lead-ins, and card grids are marked too often, Noor stops reading
  the marks. Each heuristic says when it can be wrong, so Noor can tell a false alarm quickly.
- A guess shown as a fact. A mark that reads as a rule failure would send Noor to fix things
  that are fine, or to argue with an auditor about a heuristic.
- Different results in different places. The marks for headings and tables depend on the page's
  styles. Run where styles are missing or only partly computed, fewer marks appear, and Noor
  needs to know why.
- Blame. A mark that says "you forgot" rather than naming the problem.

## Out of scope

- Fixing the markup. The mirror shows; Noor changes the code.
- A full accessibility audit or a conformance score. Other tools check rules; this shows where
  what a page looks like and what it says part ways.
- Colour, contrast, focus order, and whether a visible label matches the accessible name.
- Saying the words a screen reader would use. That belongs to the verbosity profiles.
- Watching the page as it changes.

## Open questions

- None that block a spec. The thresholds are a starting point, to be checked against real pages
  during implementation and recorded with their false alarms.
