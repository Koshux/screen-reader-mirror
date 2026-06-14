---
id: ADR-0003
title: pnpm monorepo with a shared core engine
status: accepted
date: 2026-06-14
---

# ADR-0003 — pnpm monorepo with a shared core engine

## Status

accepted

## Context

The tool ships to several targets — an npm/CDN library, a browser extension, a CLI, and a hosted
demo — but the hard, correctness-critical logic (role/name computation, linearization, mismatch
heuristics) is identical across all of them. We need that logic written and tested once.

## Decision

A **pnpm-workspaces monorepo**. `packages/core` is the single, published, client-side engine;
every other target (`extension`, `cli`, `web`) is a thin adapter that depends on it. The first
shippable milestone is `core` on npm + CDN; the other targets follow.

## Alternatives considered

- **Separate repos per target** — rejected: the shared engine would be duplicated or pulled in as
  a version-skewed dependency; changes would need cross-repo coordination.
- **A single package that bundles everything** — rejected: forces extension/CLI/server concerns
  (and their heavier deps) onto every consumer of the library; breaks the "small, CDN-consumable
  core" goal.
- **npm/yarn workspaces** — viable; pnpm chosen for strict, fast, disk-efficient installs and
  honest package boundaries (matches a sibling project's proven setup).

## Consequences

- **Good:** write/test the engine once; ship the developer-facing library first; each target stays
  thin; releases are independent (changesets, with extension/web excluded from npm).
- **Bad / cost:** monorepo tooling overhead (workspace config, filtered builds); contributors need
  pnpm + corepack. Documented in `CONTRIBUTING.md`.
- **Follow-ups:** `core` stays host-agnostic, offline, and tree-shakeable (`sideEffects:false`) so
  it works from a CDN with no build step.
