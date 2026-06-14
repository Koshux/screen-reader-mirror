<!--
Thanks for contributing! Contributor PRs are merged only after the maintainer's review
(see GOVERNANCE.md). Fill this in so review is fast.
-->

## What & why

<!-- One or two sentences. What does this change and why? -->

## Linked spec / issue

<!-- e.g. SPEC-001, JNY-001, or #123. Trivial fast-path change? Say "fast path" and skip the SDLC boxes. -->

- Spec/Journey:
- Closes:

## Type

- [ ] Feature (spec-backed)
- [ ] Fix
- [ ] Docs
- [ ] Chore / infra
- [ ] Refactor (no behaviour change)

## SDLC checklist

- [ ] Branched from latest `main` (not from another feature branch)
- [ ] (Non-trivial) Spec has a recorded **Stage 2.5 spec-review** pass
- [ ] (Non-trivial) Ran **Stage 5.5 self code-review**; every HIGH resolved on this branch
- [ ] `pnpm verify` is green (typecheck + lint + test)
- [ ] Every acceptance criterion has a passing test (golden fixtures where applicable)
- [ ] Added a **changeset** if published code changed (`pnpm changeset`)
- [ ] An implementation log exists under `docs/logs/`

## Privacy / no-lock-in self-check

- [ ] No network calls / telemetry added to `packages/core`
- [ ] Any new dependency is MIT-compatible (licence noted below)
- [ ] (Host targets only) any network use is explicit, user-initiated, and retains no content

<!-- New dependencies + licences: -->

## Test evidence

<!-- Paste the relevant test output, or describe how you verified. -->

## Notes for the reviewer

<!-- Anything you're unsure about, or want a second opinion on. -->
