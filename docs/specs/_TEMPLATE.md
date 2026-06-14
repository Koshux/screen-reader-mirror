---
id: SPEC-XXX
title: <short title>
status: draft # draft | spec-reviewed | in-progress | done | superseded
journeys: [JNY-XXX]
target: core # core | extension | cli | web | repo
created: YYYY-MM-DD
---

# SPEC-XXX — <title>

> A spec is the **what** and the contract the implementer and tests share. Use every section;
> write `n/a` rather than deleting one.

<!-- Filled by the spec-review skill at Stage 2.5:
> **Self-review applied (YYYY-MM-DD).** <key corrections made during spec review.>
-->

## 1. Summary

One paragraph: what we're building and for which journey(s).

## 2. Acceptance criteria

Observable, testable. Each gets an ID and is referenced by the test plan.

- **AC-1** — …
- **AC-2** — …

## 3. Design

How it works. For `core`, describe the algorithm/data flow. Cite the spec(s) you implement
(AccName / WAI-ARIA) and the libraries you reuse rather than re-derive.

### Public API / data shapes (if `core` surface changes)

```ts
// before → after types. An API-shape change needs an ADR + a semver-appropriate changeset.
```

## 4. File-level changes

| File | Change |
|---|---|
| `packages/core/src/…` | … |

## 5. Edge cases

Which of these apply, and how each is handled: shadow DOM / slots, cross-origin iframes,
`aria-hidden` / `display:none`, empty `alt=""` vs missing `alt`, circular `aria-labelledby`,
live regions, verbosity-profile differences.

## 6. Privacy check (mandatory)

Confirm the change keeps `core` client-side and offline. If a host target (cli/web) needs the
network, state exactly what, that it's user-initiated, and that no content is retained.

## 7. Task breakdown

Small, independently-committable steps the implementer ticks.

- [ ] …
- [ ] …

## 8. Test plan

Every acceptance criterion maps to at least one test. Prefer golden HTML fixtures.

| AC | Test | Layer | File |
|---|---|---|---|
| AC-1 | … | unit / fixture / e2e | `packages/…/…test.ts` |

## 9. Risks & rollback

What could go wrong, and how we back it out.

## 10. Non-goals

Explicitly out of scope for this spec.
