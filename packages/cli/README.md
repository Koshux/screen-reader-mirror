# @screen-reader-mirror/cli (planned — M4)

A command-line host: `npx screen-reader-mirror <url>` loads a page with Playwright/CDP, feeds its
DOM/AX tree to the [core engine](../core/), and emits an HTML report of the screen-reader
interpretation. Fully offline (after the first browser download), CI-integrable, and able to reach
local/authenticated pages.

Placeholder. Defined in the [roadmap](../../docs/project/roadmap.md) (M4); needs a journey + spec
(task T40). When published, it will be a public npm package with a `bin`.
