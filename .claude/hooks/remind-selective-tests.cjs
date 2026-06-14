#!/usr/bin/env node
/**
 * PreToolUse(Bash) reminder — non-blocking.
 *
 * Encourages scoping test runs to what changed (see .claude/rules/testing.md / effort-discipline.md).
 * This never blocks; it just nudges. Exit 0 always; stderr is surfaced in the transcript.
 */
const fs = require("fs");

function main() {
  let raw = "";
  try {
    raw = fs.readFileSync(0, "utf8").trim();
  } catch {
    return;
  }
  if (!raw) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  const cmd = (payload.tool_input && payload.tool_input.command) || "";
  if (!cmd) return;

  // Broad/expensive runs worth a second thought. A filtered run (a path, -t, or a project
  // filter) is fine and gets no reminder.
  const broad =
    /\b(vitest|pnpm\s+test|npm\s+test|pnpm\s+-r\s+test|test:coverage)\b/.test(cmd) &&
    !/(--\s|-t\b|--testNamePattern|--project\b|\.test\.|\.spec\.|--filter\b|packages\/)/.test(cmd);

  if (broad) {
    process.stderr.write(
      "Reminder: prefer scoping tests to what changed (a file path or `-t <name>`) over a full/" +
        "coverage run. `pnpm typecheck` is cheap; full suites are not. (See .claude/rules/testing.md.)\n"
    );
  }
}

main();
