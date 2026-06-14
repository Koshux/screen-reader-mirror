---
name: spec-review
description: "SDLC Stage 2.5 — review a journey + SPEC against the live codebase BEFORE implementation. Runs a correctness/reuse lens, a privacy/data-exfiltration threat-model, and a gap analysis; resolves every HIGH in the spec. Use after a spec is written and before any code, or whenever asked to validate a spec/journey."
argument-hint: "SPEC-XXX (+ its journey)"
---

# Spec Review (Stage 2.5)

The **spec-artifact** mirror of Stage 5.5 (`code-review` reviews *code*; this reviews the
*journey + spec* before any code exists). Goal: catch design errors, reinvention of existing
code, and missing requirements **before** they cost implementation tokens and fix loops.

## When this runs
- **Mandatory** after a spec is written and **before** implementation. A spec reaching
  implementation with no Stage-2.5 pass is a process error.
- **Skip rule:** only a trivial doc-only spec is exempt — record "Trivial spec, Stage 2.5 not required."

## Inputs
- The `SPEC-XXX-*.md` and its journey.
- **The live codebase.** This review is worthless from spec text alone — open the files the
  spec names and grep for systems it might be reinventing.

## The lenses (run all; findings-first, ordered HIGH → LOW)

### 1. Infrastructure & reuse — "extend, don't duplicate"
- Every file/function/export the spec references must exist — open it and confirm. Flag invented
  or misnamed references.
- For each "new" thing the spec proposes (a computation, a traversal, a heuristic), grep for an
  existing one. Reuse/extend rather than add a parallel path. In particular: are we re-deriving
  accessible-name/role logic that `dom-accessibility-api` / `aria-query` already provide?
- Confirm the public `core` API surface stays small and coherent; flag API shape changes that
  need an ADR + semver consideration.

### 2. Correctness / completeness lens
- Bugs/regressions the design would introduce; missing tests in the Test Plan; edge cases from
  [accessibility.md](../../rules/accessibility.md) not handled (shadow DOM, iframes, `aria-hidden`,
  empty vs missing `alt`, circular `aria-labelledby`, live regions).

### 3. Privacy / data-exfiltration threat-model
- Does any part of the design move page content off the machine? `core` must not. For host
  targets (cli/web), is network use explicit, user-initiated, documented, and content-retaining
  = never? Any telemetry/analytics/3rd-party SDK is an automatic HIGH.
- Output requirements the implementation must satisfy (often new ACs).

### 4. Gap analysis
- **Template:** all spec sections present, accurate, cross-cited (ACs ↔ tasks ↔ test plan).
- **SDLC:** branch-from-main, no-merge, the test plan, the privacy check.
- **Commonly-missed checklist** (each addressed or consciously N/A):
  - [ ] Reinventing logic a library already provides (search proved reuse)
  - [ ] Shadow DOM / slot reprojection handled
  - [ ] Cross-origin iframe subtrees handled where reachable
  - [ ] `aria-hidden` / `display:none` excluded from name + reading order
  - [ ] Empty `alt=""` vs missing `alt` distinguished
  - [ ] Verbosity (NVDA/JAWS/VO) kept pluggable, not hard-coded
  - [ ] Golden HTML fixtures specified for each behaviour
  - [ ] Public API change → ADR + semver/changeset noted
  - [ ] No network/telemetry introduced into core
  - [ ] CDN-consumability (ESM, side-effect-free) preserved

### 5. Resolution
- **HIGH:** fix in the spec/journey before implementation, or split into a follow-up. A spec is
  not implementation-ready with an open HIGH.
- **MEDIUM:** fold in when cheap; else record under "Known follow-ups."
- **LOW:** note in the spec.
- Record the pass as a short block-quote under the spec header ("**Self-review applied (date).**
  …key corrections…").

## Output
```
# Spec Review — SPEC-XXX
## HIGH
### N. <title>   [file.ts](path#Lline)
<2–4 sentences: what's wrong vs the live code, why it matters, the fix>
## MEDIUM / ## LOW
## Privacy requirements (threat-model)   | ID | Concern | Requirement (often a new AC) |
## Gap analysis   — template / SDLC / commonly-missed: pass or the specific gap
## Verdict   — implementation-ready: yes / no (+ the blocking HIGHs)
```

## Anti-waste reminder
Be thorough on high-leverage specs (core API, name/role computation, anything touching data
egress); for a small low-leverage spec, run the lenses quickly and say so. Match depth to
leverage ([effort-discipline](../../rules/effort-discipline.md)).

Spec under review:

$ARGUMENTS
