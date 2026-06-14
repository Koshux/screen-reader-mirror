---
id: JNY-001
title: A sighted developer sees what a screen reader would interpret from their page
status: approved
persona: Sighted front-end developer, no AT installed
related-specs: [SPEC-001]
created: 2026-06-14
---

# JNY-001 — A sighted developer sees what a screen reader would interpret from their page

## Persona

Priya is a front-end developer shipping a public application form for a European Commission
service. She cares about accessibility and is told the form must work with screen readers, but
she has never used one, has no NVDA/JAWS installed, can't install software on her work laptop, and
can't send the (pre-release, internal) page to any external service. She thinks in terms of the
DOM and the rendered UI, and the "what a blind user actually hears" layer is invisible to her.

## Trigger

She has just built a section of the form — headings, grouped fields, a summary that *looks* like
a table, a couple of icon-only buttons — and wants to sanity-check that it's semantically sound
before asking an actual AT user to test it (a slow, scarce resource).

## Goal

To **see**, quickly and locally, the linearized sequence a screen reader would traverse — the
roles and accessible names in reading order — so she can catch the obvious encoding mistakes
herself before they ever reach a real user.

## Story

Priya reaches for a tool that runs entirely on her machine. She points it at her markup (a DOM
element, a snippet, or — later — the live page via an extension). It gives her back an ordered,
readable list: "heading level 2: Personal details", "button: (no accessible name)",
"image: (missing alt)", "text: Date of birth"… She immediately notices that her "Summary"
section, which looks like a table, reads as a flat run of text with no row/column structure, and
that one of her icon buttons has no name. She fixes them, re-runs, and sees the interpretation
improve. She succeeded without installing anything, without a screen reader, and without any page
content leaving her laptop.

## Success criteria

- [ ] She can obtain a **linearized, ordered** interpretation of a piece of markup — the sequence
      and the role + accessible name of each thing a screen reader would encounter.
- [ ] Content that is hidden from assistive tech (e.g. `aria-hidden`, `display:none`) does **not**
      appear in the interpretation.
- [ ] Obvious encoding mistakes are visible to her: a heading that's really a styled `<span>`, an
      interactive control with **no accessible name**, an image with a **missing** `alt`.
- [ ] It runs **locally** with **nothing sent off her machine**, and needs no screen reader installed.

## Failure modes

- The interpretation is subtly **wrong** (e.g. computes the accessible name incorrectly), giving
  her false confidence — worse than no tool.
- It's so verbose or unordered that she can't see the forest for the trees.
- It requires an install, an account, or uploading the page — any of which makes her abandon it.

## Out of scope

- Simulating a *specific* screen reader's exact phrasing/verbosity (that's a later journey).
- Live page / browser-extension capture, the CLI, and the hosted demo (later targets — this
  journey is about the underlying capability, first delivered as the library).
- Automated pass/fail accessibility *scoring* — this is a mirror, not a linter.

## Open questions

- None blocking. Verbosity-profile fidelity and live-DOM capture are deferred to their own
  journeys.
