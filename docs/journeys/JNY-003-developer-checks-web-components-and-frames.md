---
id: JNY-003
title: A developer checks a page built from web components and embedded frames
status: approved # by the Stage 2.5 review on 2026-10-26; operator confirms at PR review
persona: Sighted front-end developer on a design-system team, no screen reader installed
related-specs: [SPEC-003]
created: 2026-10-26
---

# JNY-003: A developer checks a page built from web components and embedded frames

> A journey is the why. No implementation detail.

## Persona

Dana maintains the component library behind an internal portal. The components are web
components: each renders its own markup inside a shadow root and places the page author's content
into named slots. The portal also embeds two frames: a same-origin help panel the team owns, and
a third-party survey widget nobody on the team can change. Dana has never used a screen reader
and cannot install one on the managed laptop. She can open the portal in her own browser and she
can paste component markup into a tool, but nothing may leave the machine.

## Trigger

A screen-reader user reported that the "card" component reads its content in a strange order and
that part of it never gets read at all. Dana looked at the page source and saw nothing wrong,
because the page source is not what the user gets: the browser composes the shadow markup and the
slotted content into one tree, and that composed tree is what the screen reader reads.

## Goal

To see the reading order the screen reader actually gets from a page built of web components and
frames: shadow content and slotted content in their real positions, content that never reaches
the user because it was never slotted, and where each embedded frame begins and ends.

## Story

Dana runs the mirror on the portal page. The card's own heading appears first, then the title she
passed in through a slot, then the body, exactly as the user described, and she sees that a
badge she placed inside the card without a slot attribute is simply absent, because the component
never renders it. She fixes the slot and the badge appears where it belongs. Further down, the
help panel frame shows up as a boundary with its title, then its headings and links, then the
page continues. The survey widget shows up as a boundary too, with its title and nothing inside,
and the mirror says why: the content lives on another origin and cannot be read from here. She
notices the survey frame has no title at all, so a screen-reader user would hear an unnamed frame,
and adds one. She did all of this without a screen reader and without the page leaving her laptop.

## Success criteria

- [ ] Content inside a component's shadow root appears in the reading order at the component's
      position, in the order the browser composes it.
- [ ] Content the page author placed in a slot appears where the component projects it, and
      fallback content appears only when nothing was placed in the slot.
- [ ] Content that was never slotted does not appear, matching what a screen-reader user gets.
- [ ] Each embedded frame appears as a boundary with its name, and a frame the tool can read is
      followed by its content in order.
- [ ] A frame the tool cannot read is still shown as a boundary, with a plain statement that its
      content is unreachable, never silently dropped.
- [ ] She can tell which items came from a shadow root or from inside a frame.

## Failure modes

- The mirror reads the page source instead of the composed tree and shows the badge in place,
  giving her false confidence that the component is fine.
- A component with a closed shadow root is read as if it had none, and nothing tells her that
  what she sees may be incomplete.
- Frame content is merged into the page with no boundary, so she cannot tell where the help
  panel starts, or a frame is dropped entirely because it could not be read.
- An unnamed frame passes unnoticed.

## Out of scope

- Simulating a specific screen reader's phrasing when entering and leaving a frame.
- Reading a cross-origin frame's content. That needs the browser's own accessibility tree and
  belongs to the extension.
- Live regions inside components or frames; they have their own journey.
- Flagging the unslotted badge or the untitled frame as a mistake. The mirror shows the absence;
  naming it as a mistake is the job of the mismatch heuristics.

## Open questions

- A closed shadow root is invisible to page scripts. Should the mirror say "a component here may
  have content this tool cannot see", and on what evidence? Decided in the spec: the library reads
  the light tree and documents the limit; a host that can reach closed roots passes them in.
