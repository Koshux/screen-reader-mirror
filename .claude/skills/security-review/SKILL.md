---
name: security-review
description: "Threat-oriented review focused on this project's core promise: nothing leaves the machine. Audits for data exfiltration, telemetry, unsafe DOM/HTML handling (XSS in the rendered interpretation view), supply-chain risk in dependencies, and unsafe defaults. Use before a release, when adding a dependency or a host target, or when asked for a security review."
argument-hint: "what to review (a diff, a dependency, a target)"
---

# Security & Privacy Review

This project's headline security property is **privacy**: page content — including
authenticated/internal pages — must never leave the user's machine. Treat any violation as the
top severity.

## Focus areas (findings-first, HIGH → LOW)

### 1. Data exfiltration / telemetry (the core promise)
- Any network primitive (`fetch`, `XHR`, `WebSocket`, `sendBeacon`, remote `import()`, image
  beacon) or third-party SDK reachable from `core` = **CRITICAL**.
- For host targets (cli/web): is every network call explicit and user-initiated? Is user/page
  content ever logged, cached, or sent anywhere it shouldn't be? Any analytics = HIGH.

### 2. Unsafe DOM / HTML handling
- The tool renders an *interpretation* of arbitrary, possibly hostile page HTML. Ensure the
  rendered view **escapes** untrusted text and never injects it as live HTML (`innerHTML` with
  page-derived strings, unsanitised `dangerouslySetInnerHTML`, etc.) — that would be a
  self-inflicted XSS in the extension/web target.
- Confirm no untrusted content is `eval`'d or used to build selectors/regex unsafely.

### 3. Supply chain
- New dependency: is it maintained, permissively licensed (MIT/Apache/BSD/ISC), and minimal?
  Does it pull a large transitive tree or any network-at-runtime behaviour? Note license + risk.
- Publishing uses provenance + 2FA; no tokens committed (`NPM_TOKEN` is a CI secret only).

### 4. Unsafe defaults & permissions
- Extension manifest: request the **least** permissions needed; justify `debugger`/host
  permissions; no broad `<all_urls>` without cause.
- No feature defaults to sending data, even opt-in-by-default.

## Resolution
- Fix CRITICAL/HIGH before the change ships. Record requirements as ACs or follow-up tasks.

## Output
```
# Security Review — <target>
## CRITICAL / ## HIGH / ## MEDIUM / ## LOW
### N. <title>   [file](path)
<the risk, the impact, the fix>
## Verdict — safe to ship: yes / no (+ blockers)
```

Target under review:

$ARGUMENTS
