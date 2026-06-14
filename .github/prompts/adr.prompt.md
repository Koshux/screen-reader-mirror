---
description: "Record an Architecture Decision Record (ADR-XXXX) for a consequential, hard-to-reverse technical decision."
mode: agent
---

You are recording an **ADR**.

1. Read [docs/decisions/_TEMPLATE.md](../../docs/decisions/_TEMPLATE.md) and skim existing ADRs
   in `docs/decisions/` for the next free `ADR-XXXX` number and prior context.
2. Capture: **Context** (the forces), **Decision** (what we chose), **Alternatives considered**
   (and why rejected), **Consequences** (good and bad), and **Status** (proposed/accepted).
3. Keep it short and honest — an ADR explains *why* so future contributors don't relitigate it.
4. Write `docs/decisions/ADR-XXXX-<slug>.md` with `status: proposed` (the maintainer accepts it).

Use ADRs for: public `core` API shape changes, a new runtime dependency of consequence, a new
distribution channel, or anything touching the client-side/no-lock-in guarantees.
