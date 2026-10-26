# Launch plan: Show HN and the accessibility community

> Owner: James (operator). Status: draft, 2026-10-26. Companion to [board.md](./board.md).
> Purpose: get real screen-reader users and accessibility developers to try `screen-reader-mirror`,
> report divergences, and turn those into golden fixtures. Not a growth-hacking plan.

## 0. Where we are

| Fact | State on 2026-10-26 |
|---|---|
| npm | `screen-reader-mirror@0.1.0` live (manual bootstrap publish, no provenance). 0.1.1 via trusted publishing pending (PR #45) and will carry the provenance badge. A `0.0.0-stage` placeholder exists; deprecate it. |
| Try-it surface | **None.** npm install or a CDN import only. No demo page, no bookmarklet, no extension, no CLI. |
| Repo signals | 0 stars, no git tag or GitHub Release for 0.1.0, README still says "pre-alpha", no screenshot/GIF. GitHub topics added 2026-10-26. Issue templates, CONTRIBUTING, Discussions exist. |
| Discoverability | npm's search index had not picked the package up yet (normal within hours of a first publish). Keywords decide *matching*; downloads decide *ranking*, so generic queries like "screen reader" will not rank for months. The exact name and long-tail phrases are the realistic targets. |
| Fidelity | SPEC-001 engine: static reading order, roles, names, levels, flags. 47 tests. Eight known fidelity gaps listed in `docs/logs/2026-09-07-spec-001-pr33-review-fixes.md`. Shadow DOM, iframes, live regions, NVDA/JAWS/VoiceOver phrasing not done. |

### The neighbours (know them cold before posting)

| Tool | What it is | How we differ |
|---|---|---|
| `@guidepup/virtual-screen-reader` | Screen-reader **simulator for unit tests**: scripts navigation over a DOM and logs spoken phrases. WPT-tested, mature, MIT. | We are not a test driver. We are a **developer-facing mirror**: the reading order with the *mistakes flagged* (styled span that is not a heading, unnamed control, missing alt), zero install on any page, plain JSON meant for a side-by-side view. Guidepup is the better choice for automated assertions today; say so. |
| Playwright `ariaSnapshot` / `aria-snapshot` | YAML dump of the accessibility tree, mostly for snapshot tests. | Same tree, different purpose: we add mistake flags, need no Playwright runtime, and run from a bookmarklet on a live page. |
| Chrome DevTools accessibility pane | The real AX tree, node by node. | Tree, not reading order; nothing is flagged; nothing can be pasted into a bug report or CI. We treat the real tree as the oracle and will use it directly in the extension (#20). |
| axe / Accessibility Insights | Rule-based audits (violations). | Complementary. They tell you what is *wrong by rule*; we show *what a user gets*, which catches things no rule covers. |

The wedge in one sentence: **a sighted developer gets, in ten seconds and without sending the page anywhere, the reading order a screen-reader user gets, with the invisible mistakes made visible.**

## 1. What we say, and what we must not say

Say:

- "See what a screen reader interprets from your UI." The reading order, roles, accessible names, heading levels, and the common mistakes flagged.
- Zero install (CDN import, bookmarklet, demo page). Client-side only. **No data leaves the machine, no telemetry, ever**, enforced by lint and a commit hook. Safe for internal, regulated, and EU pages. The European Accessibility Act has applied since June 2025; teams need a dev-loop tool that does not ship DOMs to a SaaS.
- MIT. Built on `dom-accessibility-api` (the AccName implementation Testing Library trusts) and `aria-query`. Every behaviour is a golden fixture.

Do not say:

- "Exactly what NVDA says." Verbosity profiles are not built. We show the accessibility tree in reading order, the way a screen reader walks it.
- "Replaces screen-reader testing." Lead with the opposite: there is no substitute for testing with real screen readers and real users. The accessibility community will check for this sentence, and guidepup's README sets the same tone.
- "Beta" or "pre-alpha" at launch. Say "0.2, static pages, roadmap below".

## 2. Readiness gate (post only when every row is green)

Show HN's own rule: it must be something people can **try**, without signup. An npm install does not meet the bar for a ten-second impression. Gate:

| # | Gate | Why | Tracked |
|---|---|---|---|
| G1 | **Try-it in ten seconds**: a bookmarklet (drag to the bookmarks bar, click on any page, a panel shows the reading order with flags) and a paste-HTML page on GitHub Pages. Static, no backend, no analytics (say so on the page; it is a feature). The page imports the engine from the built package so it works even if a CDN lags. The bookmarklet falls back to a clear message on strict-CSP sites. | The demo *is* the Show HN link. | #9 (journey + spec first, scoped to this MVP) |
| G2 | **README hero**: a 20-second GIF or two-pane screenshot (page on the left, mirror output with flags on the right), the bookmarklet, the 30-second quickstart, an honest "Not yet" section, the neighbours table above, badges for npm version, CI, provenance, license. Drop "pre-alpha". | HN readers skim the README before commenting. | #19 + README PR |
| G3 | **Trust signals**: 0.1.1 published through trusted publishing with the provenance badge; git tags and GitHub Releases with changelogs; `0.0.0-stage` deprecated; a "Divergence report" issue template; Discussions categories (Divergence reports, Ideas, Show and tell); two or three `good first issue`s. | "Who maintains this?" is the first question on HN. | PR #45, release hygiene |
| G4 | **Fidelity floor**: file the eight known gaps as one issue; fix the ones a commenter would hit in the first minute (`<details>`/`<summary>`, `<select multiple>` options); add #6 fixtures from real pages (a GitHub issue page, an MDN article, a gov.uk form) and compare them against Chrome's accessibility tree. Commenters *will* open DevTools and diff. | Avoid the "it got my own page wrong" top comment. | #6, fidelity issue |
| G5 | **Private beta**: five to ten accessibility practitioners, including at least two daily screen-reader users, try it for a week via the web-a11y Slack and the Mastodon #a11y community. Every divergence becomes a fixture before launch. | Catches wording and fidelity problems with the people who matter most. | Discussions |
| G6 | **Capacity**: six to eight hours free on launch day to reply, and triage time the following week. Patch releases are one merged PR away. | A Show HN with an absent author dies. | calendar |

## 3. Timeline (three weeks, adjust to capacity)

**Week 1, infrastructure and content.** Merge #45 (0.1.1 with provenance). Tag and release 0.1.0 and 0.1.1. Deprecate the placeholder. File the fidelity issue. Finish #19 once the CDN caches settle. README rewrite with GIF. Divergence template and Discussions categories. Write and spec-review JNY-003/SPEC-003 (demo page + bookmarklet, the #9 MVP).

**Week 2, build and beta.** Implement SPEC-003, deploy to GitHub Pages, ship the bookmarklet. Real-page fixtures (#6). Private beta. Fix the top divergences. Release 0.2.0.

**Week 3, launch.** Tuesday, Wednesday, or Thursday. Post between 13:30 and 15:30 UTC (8:30 to 10:30 in the US Eastern morning, when HN traffic and voting are highest). Avoid US holidays and the week of a giant tech event.

## 4. The Show HN post

**Title** (80 characters max, no exclamation marks, no marketing words; HN turns em-dashes into en-dashes):

> Show HN: See what a screen reader interprets from your UI (no install, client-side)

Alternative if the name should carry: `Show HN: Screen-reader-mirror – the reading order a screen reader gets from your page`.

**URL**: the demo page, with the bookmarklet and the repository link on it. Not the README.

**First comment** (post it within a minute of submitting; HN reads it as the "text"):

> I built this because, as a sighted developer, I had no fast way to see what a blind user gets from my markup. Tools tell you what is *wrong by rule*; nothing shows you what the page *is* to a screen reader.
>
> What it does: walks the DOM the way a screen reader does and gives you the reading order with each node's role, accessible name, and heading level, then flags the mistakes you cannot see: a `<span class="h2">` that is not a heading, a button with no name, an image with no alt. Try the bookmarklet on any page, or paste HTML on the demo page.
>
> How: names come from dom-accessibility-api (the AccName implementation Testing Library uses), role definitions from aria-query, and the conditional implicit-role rules from HTML-AAM are implemented and fixture-tested. Nothing leaves your machine: no network calls, no telemetry, enforced by lint and a commit hook. I work in a context where shipping DOMs to a SaaS is a non-starter, and I suspect many of you do too.
>
> What it is not: a screen reader. It shows the accessibility tree in reading order, not NVDA's or VoiceOver's phrasing (verbosity profiles are on the roadmap), and it does static pages today: no shadow DOM, iframes, or live regions yet. There is no substitute for testing with real screen readers and real users; this is the ten-second inner loop before that.
>
> How it differs: guidepup's virtual-screen-reader is a simulator for unit-test assertions and is more mature as a test driver. Playwright's ariaSnapshot dumps the tree for snapshot tests. This is the developer-facing mirror with mistake flags, zero install, and a plain JSON model built for a side-by-side view. A browser extension that reads Chrome's real accessibility tree is next.
>
> What I would love from you: paste a snippet where your screen reader and this tool disagree. Every confirmed divergence becomes a golden fixture. Repo and divergence template: (link).

**Prepared answers.** Draft these before launch day, two or three sentences each, and keep them in a scratch file:

1. "Why not the DevTools accessibility pane?" Tree versus reading order; nothing flagged; cannot be shared or automated; we treat the real tree as the oracle.
2. "guidepup does this." Different job: assertions versus a mirror; recommend it for tests; our flags and zero-install surface are the difference.
3. "Playwright aria snapshots do this." Same tree, no flags, needs Playwright; ours runs from a bookmarklet on a live page.
4. "A simulation is misleading; use a real screen reader." Agree, and say so; explain the fixture discipline and the CDP real-tree roadmap.
5. "Shadow DOM / web components?" Not yet; issue link.
6. "Verbosity differs between NVDA, JAWS, VoiceOver." Yes; profiles are pluggable by design; issue link.
7. "Why no analytics on the demo?" The whole point; explain the GDPR stance.
8. "Will it become a SaaS?" No; MIT, client-side, no account. Hosts are thin UIs over the same engine.
9. "PDF?" Roadmap (#24).
10. "It got my page wrong." Thank them, ask for the snippet, file the issue live, link it in the reply.

**Conduct.** Never ask anyone to upvote or comment; HN detects voting rings and buries the post. Reply within minutes for the first two hours. Thank critics, never argue, and file every actionable critique as an issue during the thread with a "tracked: #NN" reply. If the post gets fewer than ten points in two hours, do not resubmit the same day. HN runs a second-chance pool; after acting on the feedback, an email to hn@ycombinator.com asking for a second look is acceptable, and one repost weeks later after real changes is fine.

## 5. Channel sequence, launch week

Each channel gets a tailored two-line message and the demo link; accessibility channels get the "no substitute for real screen readers" line up front.

| When | Channel | Note |
|---|---|---|
| Day 0, 13:30 UTC | Show HN + first comment | Everything above. |
| Day 0 | Mastodon (#a11y #accessibility #webdev), Bluesky | The fediverse accessibility community is the most engaged one; expect blunt, valuable feedback. |
| Day 0 | LinkedIn | The European Accessibility Act angle for EU teams. |
| Day 1 | web-a11y Slack, r/accessibility | Read each community's self-promotion rules; frame as "feedback wanted from screen-reader users". |
| Day 1 | dev.to article "How I built a screen-reader mirror" | The narrative version for the non-HN audience; cross-link. |
| Day 2 to 3 | Newsletter submissions: A11y Weekly, Frontend Focus, JavaScript Weekly, Accessibility Weekly, Smashing | Each has a submit form or tips address; one paragraph plus the link. |
| Saturday | r/webdev Showoff Saturday, r/javascript showoff | Only on the allowed days. |
| Later | Product Hunt (after the extension), meetup lightning talks, podcast pitches (JS Party, A11y Rules) | Second wave, once the extension ships. |

## 6. Feedback loops without telemetry

- **Divergence report** issue template: markup snippet, screen reader + browser + versions, what it announced, what the mirror output, expected. Label `divergence`. Public promise: every confirmed divergence becomes a golden fixture. This is the fidelity engine.
- Discussions categories: Divergence reports, Ideas, Show and tell.
- Measure with: npm downloads (npm-stat.com), jsDelivr hits (`data.jsdelivr.com/v1/stats/packages/npm/screen-reader-mirror`), GitHub Insights > Traffic (referrers show HN and Reddit), stars, issues and discussions, HN points. The demo page has no analytics, and says so.
- Launch-week triage: acknowledge within 24 hours; patch releases through the pipeline as fixes land.

## 7. Success criteria (write them down before posting)

- Reaches the /show front page for a few hours, or the main front page.
- 100 or more stars and 1,000 or more npm downloads in week one.
- Ten or more divergence reports in week one. That is success, not failure.
- Three or more outside contributions (PRs, fixtures, or confirmed reports with snippets).
- No top-voted "you overclaim" comment. The README's limitations match reality.

## 8. Risks

| Risk | Mitigation |
|---|---|
| "Misleading simulation" critique from accessibility experts | The wording in section 1, the fixture discipline, the real-tree roadmap, and inviting the critique. |
| "Playwright or guidepup already do this" | The neighbours table; concede what they do better. |
| Strict CSP blocks the bookmarklet | Paste page works everywhere; extension next. |
| npm search invisibility | Irrelevant on launch day: traffic arrives via links. Keywords PR and direct URLs everywhere. |
| Solo maintainer overload | Fixed triage hours; the contributor helps triage; batch via Discussions. |
| Name confusion ("mirror" reads as screen mirroring) | The tagline next to the name everywhere. |

## 9. Immediate actions

Operator: merge #45; create the tag and release for 0.1.0; deprecate `0.0.0-stage`; pick a launch week; recruit beta testers; record the hero GIF once the demo exists.

Agent: #19 CDN verification; fidelity issue; divergence template and Discussions categories (needs approval to create); README rewrite PR; JNY-003/SPEC-003 drafts for the demo page and bookmarklet; real-page fixtures (#6); then the demo implementation after spec review.

## Appendix: bookmarklet prototype

Untested on strict-CSP sites; the SPEC-003 version adds a styled panel.

```js
javascript:(async()=>{try{const{linearize}=await import('https://cdn.jsdelivr.net/npm/screen-reader-mirror@0.1/+esm');const n=linearize(document.body);const w=window.open('','srm','width=560,height=760');const esc=s=>s.replace(/[<&]/g,c=>c==='<'?'&lt;':'&amp;');w.document.write('<pre style="font:13px/1.4 monospace;white-space:pre-wrap">'+n.map(x=>(x.flags?'! ':'  ')+x.role+(x.level?' '+x.level:'')+': '+esc(x.name)+(x.flags?'   '+JSON.stringify(x.flags):'')).join('\n')+'</pre>');}catch(e){alert('screen-reader-mirror could not load here (strict CSP?): '+e.message);}})()
```
