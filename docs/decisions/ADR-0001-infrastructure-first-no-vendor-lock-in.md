---
id: ADR-0001
title: Infrastructure-first, client-side-only, no vendor lock-in
status: accepted
date: 2026-06-14
---

# ADR-0001 — Infrastructure-first, client-side-only, no vendor lock-in

## Status

accepted

## Context

The tool must be usable inside the European Commission and other regulated organisations **with
no licence, GDPR, procurement, or data-residency concerns**, and must be reachable globally so it
can be shared (e.g. on Reddit / Hacker News) and adopted with zero friction. The original
research established hard constraints: no `.exe` installs, no external data transmission, no paid
tooling, must work without assistive technology installed.

These constraints are not features bolted on later — they shape the entire architecture. So we
decide them first ("infrastructure-first") and let them constrain everything downstream.

## Decision

1. **The `core` engine is client-side only and makes no network calls.** Page content — including
   authenticated/internal pages — is analysed in the browser/process and never transmitted. No
   telemetry, analytics, or "phone home", anywhere, ever (not even opt-in-by-default).
2. **No vendor lock-in.** Public npm registry, standard web-platform and Node APIs, permissively
   licensed (MIT/Apache/BSD/ISC) dependencies only. No required SaaS, API key, or account to use
   the tool. It builds and runs offline after install, on any OS.
3. **Distribution stays frictionless and plural:** npm + CDN (jsDelivr/unpkg) first, then a
   browser extension, a `npx` CLI, and a hosted demo — so there is always a zero-install path.
4. **Enforcement is layered, not trust-based:** ESLint forbids network primitives in `core`; a
   Claude hook (`block-no-telemetry`) blocks them at authoring time; code review is the backstop.

## Alternatives considered

- **Hosted SaaS that fetches/analyses pages server-side** — rejected: page content would leave the
  machine (GDPR/regulated blocker), introduces vendor lock-in and running cost, and can't reach
  authenticated internal pages.
- **A desktop app / native install** — rejected: violates the "no `.exe` install / no procurement"
  constraint.
- **Depending on a real screen reader (NVDA/JAWS) under the hood** — rejected: requires installs
  and licences; we compute from the accessibility tree instead.

## Consequences

- **Good:** safe for regulated/EU use by construction; globally reachable; free; no running
  infrastructure to fund or secure; the privacy story is a headline selling point.
- **Bad / cost:** fidelity is "what the AX tree says" + verbosity heuristics, not a byte-for-byte
  capture of a specific screen reader (mitigated by verbosity profiles and, where a host can reach
  it, the browser's real AX tree). Some conveniences (shareable cloud reports, cross-device sync)
  are deliberately off the table for `core`.
- **Follow-ups:** the constraint is encoded in [`.claude/rules/infrastructure.md`](../../.claude/rules/infrastructure.md),
  the ESLint config, the no-telemetry hook, and `SECURITY.md`.
