# Security & Privacy Policy

## Privacy stance (read this first)

`screen-reader-mirror`'s **core engine is client-side only and makes no network calls.**
Page content — including anything on an authenticated or internal page — is analysed in
the browser/process and **never transmitted anywhere**. There is no telemetry, no analytics,
no "phone home", and no required server. This is a deliberate design constraint so the tool
is safe to use in regulated and EU environments without GDPR or data-residency concerns
(see [ADR-0001](./docs/decisions/ADR-0001-infrastructure-first-no-vendor-lock-in.md)).

The constraint is enforced, not just promised:

- ESLint forbids `fetch`/`XMLHttpRequest` in `packages/core`.
- A Claude Code hook (`.claude/hooks/block-no-telemetry.cjs`) flags any new network/telemetry
  primitive introduced into the client-side code.

The optional **hosted demo** and **CLI** targets may process a URL you give them; their
privacy behaviour is documented separately in their own package READMEs and must never
default to retaining user content.

## Supported versions

While the project is pre-1.0, only the latest published version receives security fixes.

## Reporting a vulnerability

**Please do not open a public issue for security or privacy vulnerabilities.**

Instead, use GitHub's private reporting:
**Security → Advisories → "Report a vulnerability"** on the repository, or email the
maintainer at **lanzonprojects@gmail.com** with `[security]` in the subject.

Include: affected target/version, a description, reproduction steps, and impact. We aim to
acknowledge within **5 business days** and to agree a disclosure timeline with you. We
credit reporters in the advisory unless you prefer to remain anonymous.
