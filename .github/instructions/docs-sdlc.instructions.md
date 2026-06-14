---
applyTo: "docs/**/*.md"
---

# SDLC docs rules (auto-loaded for `docs/`)

Canonical: [`docs/sdlc/README.md`](../../docs/sdlc/README.md) and the templates.

- IDs are the next free number: journeys `JNY-XXX`, specs `SPEC-XXX`, ADRs `ADR-XXXX`. Logs are
  dated: `YYYY-MM-DD-<slug>.md`.
- Use the `_TEMPLATE.md` in each folder and keep **every** section (use `n/a`, don't delete).
- **Journeys** carry no implementation detail (no file/API/library names). **Specs** map every
  acceptance criterion to a test in the test plan, and include Risks & rollback, Non-goals, and
  the Privacy check.
- **Never delete files under `docs/logs/`** — they are the audit trail.
- Keep cross-references as relative markdown links so they stay clickable.
