#!/usr/bin/env node
/**
 * PreToolUse(Write|Edit) guard.
 *
 * The `core` engine is the GDPR/regulated-sector guarantee: it must never make a network call
 * (see .claude/rules/infrastructure.md). This hook blocks Write/Edit operations that would
 * introduce a network/telemetry primitive into packages/core source. ESLint is the backstop in
 * CI; this catches it at authoring time with a clearer message.
 *
 * Exit 0 = allow. Exit 2 = block (stderr is shown to the model).
 */
const FORBIDDEN = [
  { re: /\bfetch\s*\(/, name: "fetch()" },
  { re: /\bXMLHttpRequest\b/, name: "XMLHttpRequest" },
  { re: /\bnavigator\s*\.\s*sendBeacon\b/, name: "navigator.sendBeacon" },
  { re: /\bnew\s+WebSocket\b/, name: "WebSocket" },
  { re: /\bnew\s+EventSource\b/, name: "EventSource" },
  { re: /\bimport\s*\(\s*['"`]https?:\/\//, name: "remote dynamic import()" },
];

function isGuardedCoreSource(filePath) {
  if (!filePath) return false;
  const p = filePath.replace(/\\/g, "/");
  if (!p.includes("packages/core/")) return false;
  if (!/\.(ts|tsx|js|mjs|cjs)$/.test(p)) return false;
  // Don't scan tests/fixtures — input markup legitimately contains these tokens as page content.
  if (/\.(test|spec)\./.test(p)) return false;
  if (/(^|\/)(__fixtures__|fixtures|__tests__)\//.test(p)) return false;
  return true;
}

function main() {
  let raw = "";
  try {
    raw = require("fs").readFileSync(0, "utf8").trim();
  } catch {
    return; // no stdin → nothing to check
  }
  if (!raw) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  const input = payload.tool_input || {};
  const filePath = input.file_path;
  if (!isGuardedCoreSource(filePath)) return;

  // Write supplies `content`; Edit supplies `new_string`.
  const text = input.content ?? input.new_string ?? "";
  const hit = FORBIDDEN.find((f) => f.re.test(text));
  if (!hit) return;

  process.stderr.write(
    `Blocked: this edit adds \`${hit.name}\` to packages/core, which must stay client-side and ` +
      `make no network calls (the GDPR/no-vendor-lock-in guarantee — see ` +
      `.claude/rules/infrastructure.md and ADR-0001).\n` +
      `If a network call is genuinely needed, it belongs in a host target (cli/web), not core. ` +
      `If this is a false positive (e.g. a string literal), move it to a fixture/test file.\n`
  );
  process.exit(2);
}

main();
