---
id: JNY-004
title: A developer checks that status messages and errors will be announced
status: approved # by the Stage 2.5 review on 2026-10-26; operator confirms at PR review
persona: Sighted front-end developer building a checkout flow, no screen reader installed
related-specs: [SPEC-004]
created: 2026-10-26
---

# JNY-004: A developer checks that status messages and errors will be announced

> A journey is the why. No implementation detail.

## Persona

Sam builds the checkout flow for a public-sector payments service. The flow shows messages that
appear without a page load: "Saved", a basket total that updates, an error when a card is
declined, and a countdown before the session times out. Sam has never used a screen reader and
cannot install one on a locked-down work laptop. Their accessibility audit is in two weeks, and
nothing from the service may leave the machine.

## Trigger

A tester using a screen reader reported that after pressing Pay, nothing was said when the card
was declined, while the "Saved" message on the address step was read out twice. Sam can see both
messages on screen and has no way to tell what a screen reader is told about them.

## Goal

To see which parts of the page are set up to be announced when they change, how urgently, and
whether the whole message or only the changed part would be read, before the change happens.

## Story

Sam runs the mirror on the checkout page. The basket total shows up marked as a polite
announcement area, read in full when it changes. The address step shows two areas marked for
announcement, one inside the other, which explains the double read. The card error has no mark
at all: it is a plain message added to the page, so a screen reader is never told about it.
Sam marks the error area as urgent, runs the mirror again, and sees it marked. The countdown is
marked as an area that is not announced, which matches the intent. The mirror says plainly that
it shows how each area is set up, not when or whether a screen reader will speak, because that
depends on the screen reader and on how the page changes. Sam fixed both problems without a
screen reader and without the page leaving the laptop.

## Success criteria

- [ ] Every area set up to be announced appears in the reading order, marked, with how urgently
      it is announced.
- [ ] An area that is set up but currently empty still appears, because the area has to exist
      before its message arrives for the message to be announced.
- [ ] Sam can tell whether the whole area or only the changed part would be read.
- [ ] Sam can tell when an area is marked as busy, so its updates are held back.
- [ ] When one area sits inside another, both appear, one after the other, so a double
      announcement can be traced.
- [ ] A message with no announcement set up has no mark, so the absence is visible.
- [ ] The mirror says that it shows the set-up, not the timing or the exact words.

## Failure modes

- The mirror implies that a marked area will definitely be spoken, giving Sam false confidence;
  screen readers differ, and a message inserted at the same moment as its area is often missed.
- An area hidden from assistive technology is shown as if it would be announced.
- An area that announces nothing (marked "off", or a countdown) is shown as if it announces.
- An empty area is dropped, so Sam cannot see that it is ready before its message arrives.

## Out of scope

- Watching the page and reporting each announcement as it happens. That is a host feature for
  later, built on this.
- Saying the exact words a given screen reader would use. That belongs to the verbosity profiles.
- Flagging a message that should have been announced but is not set up. The mirror shows the
  absence; naming it as a mistake is the job of the mismatch heuristics.

## Open questions

- None that block a spec. Whether an announcement area inside a sentence should break the line
  in the reading order is a design choice for the spec, verified against the browser.
