---
id: ADR-0002
title: MIT license
status: accepted
date: 2026-06-14
---

# ADR-0002 — MIT license

## Status

accepted

## Context

The project must be free and globally usable with no licence concerns — including inside the
European Commission — and we want maximum adoption when it's shared publicly (Reddit / Hacker
News / npm). The licence choice signals how freely others (including EC teams and other OSS
projects) can use and build on it.

## Decision

License the project under **MIT**.

## Alternatives considered

- **EUPL-1.2** — the European Union's own licence, OSI-approved and GDPR-aware; the strongest
  "EC-native" signal. Rejected as the default because its (weak) copyleft and lower familiarity on
  npm/HN add friction for the broad, permissive adoption we want. MIT is freely usable by EC teams
  regardless.
- **Apache-2.0** — permissive with an explicit patent grant. Reasonable, but heavier boilerplate
  and no patent concern here justifies the extra ceremony over MIT.

## Consequences

- **Good:** lowest-friction, universally trusted, freely usable by anyone including the EC; best
  for adoption; trivially compatible with the permissive deps we rely on.
- **Bad / cost:** no copyleft, so derivatives may be closed — an acceptable trade for reach. No
  explicit patent grant (low risk for this kind of tool).
- **Follow-ups:** every runtime dependency must be MIT-compatible; new deps note their licence in
  the PR (see [`.claude/rules/distribution.md`](../../.claude/rules/distribution.md)).
