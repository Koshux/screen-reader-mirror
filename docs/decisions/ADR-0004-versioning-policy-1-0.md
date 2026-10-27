---
id: ADR-0004
title: Versioning policy and the 1.0.0 launch release
status: proposed
date: 2026-10-26
---

# ADR-0004: Versioning policy and the 1.0.0 launch release

## Status

proposed (the maintainer marks `accepted`)

## Context

The package is published as 0.1.x. On a 0.x version a caret range pins the minor, so a consumer
on `^0.1.1` never receives 0.2.0 without editing their manifest, and lockfiles stay where they
are. The operator has hit this before and does not want users to meet it at launch.

Semantic versioning turns 1.0.0 into a promise: the public API only breaks on a major version.
That promise is cheap here because the surface is small (one function, two types, one options
object), but it has to be stated precisely, because the engine's *output* for a given markup will
keep changing as fidelity improves, and consumers who snapshot that output would otherwise read
every improvement as a break.

The distribution rules already require a major bump for breaking changes and an ADR for majors.

## Decision

1. **1.0.0 is the launch release.** The package stays on 0.x until the launch PR, which carries a
   `major` changeset. The version people see on launch day is the version they install.

2. **What semver covers: the API shape.**
   - The exported names, function signatures, and option names.
   - The fields of `InterpretationNode` and `NodeFlags`, and their types.
   - The fields of `Interpretation` and `Mismatch` from `interpret()`, and their types
     (SPEC-005, added 2026-10-27).
   - Adding an export, an option, a field, or a flag is a **minor**. So is adding a mismatch
     `kind` or a `MismatchSignal` value, so a consumer must ignore values it does not know.
   - Removing or renaming any of those, or changing a type, is a **major**, preceded by at least
     one minor that marks it deprecated with a documented replacement.

3. **What semver does not cover: the interpretation.** The reading order, roles, names, levels,
   and flags produced for a given markup follow the W3C specifications and the golden fixtures.
   Which mismatches fire for a given markup is interpretation too: tuning a heuristic's threshold
   is a patch with a changelog line.
   Making them more faithful to what a real screen reader gets is a **patch**, even when it
   changes output. Consumers who need a stable reading for a specific markup should pin an exact
   version and own a fixture for it.

4. **Verbosity profiles** are opt-in. Adding a profile or changing the phrasing of an existing
   profile is a minor. The neutral default profile's phrasing changes are patches.

5. **Hosts** (extension, CLI, demo, VS Code) version independently of the core package where
   they are published separately, and state which core version they bundle.

6. Changesets enforce the mechanics: every PR that changes published code declares its bump, and
   the release pipeline publishes through trusted publishing with provenance.

## Alternatives considered

- **Stay on 0.x after launch.** Rejected: caret pinning punishes every early adopter, and 0.x
  reads as "not ready" on a launch post.
- **Publish 1.0.0 now, before the 1.0 scope is built.** Rejected: the mismatch flags, verbosity
  profiles, and shadow DOM work may still need a shape change to the node model; making that
  change under a 1.x promise would force a 2.0 within weeks.
- **Treat interpretation changes as breaking.** Rejected: fidelity fixes would become majors, the
  version would be meaningless within a quarter, and consumers would be trained to ignore it.

## Consequences

- **Good:** consumers get patches and minors automatically with a caret range; the API promise is
  explicit and small; fidelity can improve continuously.
- **Bad / cost:** snapshot-style consumers must pin; the node model must be finalised across the
  1.0 scope before launch, which is a real design constraint on #10, #11, #21, #22, and #23.
- **Follow-ups:** publish this policy in the README under "Versioning"; add the policy check to
  the Stage 5.5 review list for any change to `types.ts`; accept this ADR when the operator
  approves the 1.0 scope document.
