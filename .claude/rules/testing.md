# Testing Rules

- **Every acceptance criterion maps to at least one test.** A spec is not done until its test
  plan is green.
- **Prefer golden HTML fixtures** for engine behaviour: an input markup snippet and the
  expected linearized/annotated output. They document intent and catch regressions better than
  ad-hoc assertions. Keep fixtures small and focused on one phenomenon.
- **Scope test runs to the change.** `pnpm typecheck` is cheap and always worth running.
  `pnpm test` is fast for unit tests; reserve `pnpm test:coverage` and Playwright e2e for when
  they're warranted. Don't speculatively run everything.
- **Unit-test pure functions directly** (role/name computation wrappers, linearization,
  heuristics). Use **jsdom/happy-dom** when a real `Element` tree is needed; use Playwright
  only for the extension/web targets in a real browser.
- **A failing test from a setup problem is not a code bug.** If deps aren't installed or the
  Node version is wrong, fix setup first — never edit product code to paper over it.
- **Don't loop.** If the same test keeps failing the same way, re-derive the root cause and
  try a different angle, or surface the blocker (see [`effort-discipline.md`](effort-discipline.md)).
- For UI targets, browser/visual verification is the **operator's** sign-off at PR time; agents
  do not self-certify UI in lieu of the human review.
