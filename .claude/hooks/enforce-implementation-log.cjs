#!/usr/bin/env node
/**
 * Stop hook — enforces "one task, one log".
 *
 * If the working tree has changes but none of them is an implementation log under docs/logs/,
 * block the stop and ask for the log to be written. This is the only cross-session recovery
 * mechanism we have (see AGENTS.md §7).
 *
 * Exit 0 = allow stop. Exit 2 = block stop (stderr fed back to the model).
 */
const fs = require("fs");
const { execFileSync } = require("child_process");

function gitStatus(cwd) {
  try {
    return execFileSync("git", ["status", "--porcelain"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function changedPaths(status) {
  return status
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter(Boolean)
    .map((l) => {
      const raw = l.slice(3).trim();
      const renamed = raw.split(" -> ");
      return renamed[renamed.length - 1].replace(/^"|"$/g, "");
    });
}

function isLog(p) {
  const norm = p.replace(/\\/g, "/");
  return /(^|\/)docs\/logs\/.*\.md$/i.test(norm);
}

function main() {
  let raw = "";
  try {
    raw = fs.readFileSync(0, "utf8").trim();
  } catch {
    return;
  }

  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }

  // Avoid an infinite stop→continue→stop loop: if we already blocked once this turn, let it go.
  if (payload.stop_hook_active) return;

  const cwd = payload.cwd || process.cwd();
  const paths = changedPaths(gitStatus(cwd));
  if (paths.length === 0) return; // nothing changed → nothing to log

  if (paths.some(isLog)) return; // a log is among the changes → satisfied

  process.stderr.write(
    "Working-tree changes exist but no docs/logs/ entry is among them. Before finishing, add an " +
      "implementation log: docs/logs/<YYYY-MM-DD>-<slug>.md using docs/logs/_TEMPLATE.md (record " +
      "what changed, why, test results, and hand-off notes). It is the only cross-session recovery " +
      "mechanism. For a genuinely trivial change you may create a one-line log entry.\n"
  );
  process.exit(2);
}

main();
