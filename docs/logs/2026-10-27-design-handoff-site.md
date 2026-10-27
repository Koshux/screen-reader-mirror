---
date: 2026-10-27
spec: n/a
branch: docs/design-handoff-site
status: complete
---

# Log: 2026-10-27, the site design handoff and where it sits in the plan

## What changed & why

The operator dropped a Claude Design export into
`docs/design/design_handoff_screen_reader_mirror_site/`: the public website, the documentation
inside it, how to use each install path, the UI for the bookmarklet and the extension, and how
the tool works beside a screen reader, NVDA first. They asked for it to go on the task list, to
be built out in full after the main engine work.

- The handoff is committed as received (80 files, about 830 KB), not moved or renamed.
- `docs/project/v1-scope.md`, Phase C: renamed to "hosts, the public site, and the NVDA bridge";
  new rows for the design intake, the public website, the documentation site, and the NVDA
  bridge; order within C written down (intake, site shell and website and demo and bookmarklet,
  extension and CLI, NVDA bridge, docs finished last); estimate for C and the total revised.
- `docs/design/README.md`: a "Received handoffs" section saying where the export lives, that its
  `.dc.html` files load React from unpkg for viewing only, and how it stands against the six
  handoff requirements as received.

- `eslint.config.mjs`: `docs/design/**` is ignored. The export's `.js` and `.jsx` render the
  references in a browser and gave 93 lint errors (browser globals); they are not code that ships.

New tickets are written as "new issue, on the operator's go-ahead": no GitHub issues were created.

## Tests

`pnpm lint` failed with the handoff added (93 errors, all in the export's scripts) and passes
with the ignore. `pnpm typecheck` passes. No product code changed, so the tests were not run.

## Self code review

Doc-only change, Stage 5.5 not required. Read the handoff's `README.md`, `readme.md`,
`docs/outline.md`, and `SKILL.md`, and scanned for external URLs: only the CDN install examples,
`example` domains, the SVG namespace, and the unpkg React used to render the references locally.

## State at end of session

Branch `docs/design-handoff-site` from `main` at 7763508. PR open, awaiting the operator.
SPEC-005 is still next for engineering; its send-off prompt was given in the session.

## Hand-off notes

1. Operator: confirm the NVDA bridge is in 1.0 scope (it is listed in Phase C and adds to the
   estimate), and say when to file the new issues (design intake, docs site, NVDA bridge).
2. The design intake, when C starts: check the six handoff requirements (gaps listed in
   `docs/design/README.md`), update the API, output, and settings pages for `interpret()`,
   mismatches, and the `browser` mode, and split the handoff into one spec per surface.
3. `docs/project/board.md` and `tasks.md` predate the 1.0 scope and were not updated here.
