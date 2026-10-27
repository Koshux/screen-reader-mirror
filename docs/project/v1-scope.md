# 1.0 scope: definition of done

> Decided by the operator on 2026-10-26. Supersedes the three-week timeline in
> [launch-plan.md](./launch-plan.md). Versioning rules are in ADR-0004.

## The decision

1.0.0 is the launch release. Nothing is posted to Hacker News, newsletters, or communities before
every capability below is implemented, fixture-tested, and reviewed through the SDLC. The package
stays on 0.x until launch day; the launch PR carries a `major` changeset that takes it to 1.0.0.

## What 1.0 contains

Every row is a ticket that follows the full lifecycle: journey, spec, spec review, implementation,
tests, code review, operator review, log. Hosts with a user interface also pass the design gate
described in [../design/README.md](../design/README.md) before implementation starts.

### Phase A: engine fidelity (the tree must be right before anything is built on it)

| Item | Ticket | Notes |
|---|---|---|
| Eight known fidelity gaps: details and summary, select options, caption and legend double-read, adjacent text runs, scope-less th, unnamed inline svg, li under a non-list role, upstream AccName limits | new issue | From `docs/logs/2026-09-07-spec-001-pr33-review-fixes.md`. One issue, one PR. |
| Golden fixtures from real pages, compared against Chrome's accessibility tree | #6 | A GitHub issue page, an MDN article, a gov.uk form, a component-library demo. |
| Shadow DOM and slot reprojection | #21 | Open roots only; closed roots are invisible by design and are reported as such. |
| Live regions | #23 | Represent `aria-live`, `role=status`, `role=alert` on the node; announcement timing is host-specific. |
| Same-origin iframes | #22 | Each frame is its own subtree, marked on the node. Cross-origin frames are unreachable from page context and belong to #20. |

### Phase B: engine value (the promises in the README)

| Item | Ticket | Notes |
|---|---|---|
| Visual-versus-semantic mismatch heuristics | #11 | At minimum: text that looks like a heading but is not one, a grid of divs that looks like a table, a clickable div that is not a button or link, a form field with no label. Each heuristic documents its signal and its false-positive behaviour. |
| Verbosity profiles | #10 | Pluggable NVDA, JAWS, and VoiceOver phrasing on top of the raw interpretation, plus a neutral default. Never hard-coded in the linearizer. |

### Phase C: hosts (how people use it)

| Item | Ticket | Notes |
|---|---|---|
| Demo page and bookmarklet on GitHub Pages | #9 | Design gate first. Static, no backend, no analytics. The link a Show HN points at. |
| Browser extension, Manifest V3 | #7 | SPEC-002 exists and needs its spec review. Design gate first. Chrome Web Store review time is on the critical path. |
| Real accessibility tree in the extension via the debugger API | #20 | Opt-in, because it shows the browser's debugging banner. The highest-fidelity oracle. |
| CLI, `npx screen-reader-mirror <url>` | #8 | Playwright or CDP host, fully offline, JSON and text output. The output format is part of the design gate. |

### Phase D: extras

| Item | Ticket | Notes |
|---|---|---|
| PDF tag-tree mode | #24 | pdf.js. Its own spec and its own entry point so the core bundle stays small. |
| VS Code extension | #25 | Consumes the core engine and the CLI. |

These two are in scope by the operator's decision. They are last, and they could be split into a
1.1 without changing the launch, if the operator later chooses.

### Phase E: launch

| Item | Ticket | Notes |
|---|---|---|
| README rewritten against what exists, with the hero recording, limitations, and the comparison table | README PR | Removes every claim the code does not back. |
| README quickstart verified against the published package and both CDNs in a real browser | #19 | |
| Private beta with screen-reader users and accessibility practitioners | launch plan | Every confirmed divergence becomes a fixture before launch. |
| Versioning policy published, `major` changeset, 1.0.0 | ADR-0004 | |
| Show HN and the channel sequence | launch plan | |

## Order and dependencies

A before B: the heuristics reason about the tree, so the tree must be right first. A and B before
C: the hosts render real engine output and their designs need the final node shape, including the
mismatch flags and the verbosity phrasing. D after C: the PDF mode reuses the host rendering, and
the VS Code extension reuses the CLI. E last, with the README and #19 able to start during C.

Design handoffs for C can start as soon as the node shape from B is specified, which means the
operator's design work runs in parallel with the engineering of A and B.

## Estimate

Measured against the pace of 2026-10-26, where small infrastructure items closed at several per
day and SPEC-001's engine work took three sessions including review:

| Phase | Sessions | Calendar |
|---|---|---|
| A | 6 to 8 | 2 weeks |
| B | 5 to 7 | 2 weeks |
| C | 8 to 10 plus design time and store review | 3 to 4 weeks |
| D | 5 to 7 | 2 weeks |
| E | 3 to 4 plus the beta week | 2 weeks |

Roughly 11 to 12 weeks end to end if the phases are worked in order, less where design and
engineering overlap. The estimate is a planning figure, not a commitment, and is revised at the
end of each phase.

## Done means

- Every ticket above is closed through a merged PR with its log.
- Every acceptance criterion in every spec has a passing golden fixture.
- Real-page fixtures agree with Chrome's accessibility tree in Chrome mode (`browser: "chrome"`,
  ADR-0005), and each known divergence is pinned with a failing-by-design test and a linked
  issue. The default reading follows the W3C specifications and has its own reviewed goldens.
- The README describes only what the code does.
- Each host passes its design acceptance checklist and the accessibility requirements in the
  design brief, verified with a screen reader by a person, not only by tooling.
- `pnpm verify` is green, the package publishes through trusted publishing with provenance, and
  the version is 1.0.0.
