# @screen-reader-mirror/extension (planned — M3)

A zero-install Chrome/Edge **MV3** extension: a side panel that shows the linearized
screen-reader interpretation of the **live** page — including JS-rendered content and
authenticated/internal pages (the European Commission use case) — all client-side.

This is a placeholder. The target is defined in the [roadmap](../../docs/project/roadmap.md) (M3)
and tracked as `area: extension` tasks on the [board](../../docs/project/tasks.md). It needs a
journey + spec first (task T30). It is a thin adapter over [`screen-reader-mirror`](../core/)
(the core engine) and is **not** published to npm — it ships via the Chrome Web Store and as a
sideloadable build.

Privacy posture: like core, it transmits nothing. Where available it may use `chrome.debugger`
(CDP `Accessibility.getFullAXTree`) for the highest-fidelity tree, with a least-privilege manifest.
