# Changelog

All notable changes to this repository are documented here. Per-package, published
changelogs are generated from [changesets](./.changeset/) at release time; this top-level
file records repository- and process-level milestones.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Project bootstrap: pnpm-workspaces monorepo, TypeScript, Vitest, ESLint flat config.
- AI operating manual (`AGENTS.md`) shared by Claude Code and GitHub Copilot, synthesised
  from prior projects: a clean SDLC spine + enforcement rules, hooks, and review gates.
- SDLC documentation and templates (journey / spec / log / ADR) under `docs/`.
- Governance, contribution, security/privacy, and code-of-conduct policies.
- GitHub project machinery: issue/PR templates, CODEOWNERS, labels, branch-protection setup
  script, and CI / release / Pages workflows.
- `packages/core` scaffold — the client-side accessibility-tree linearization engine.
