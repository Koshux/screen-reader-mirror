#!/usr/bin/env node
/**
 * Compare the engine's reading order with Chrome's accessibility tree, on the same DOM, in the
 * same headless Chrome. The fidelity oracle for #6.
 *
 * Usage:  node scripts/ax-compare.mjs packages/core/test/fixtures/pages/<name>.html [--w3c] [--write-expected]
 * Needs:  a local Chrome, Chromium, or Edge (or CHROME_PATH). Builds the engine bundle itself.
 *
 * The fixture is a body fragment. It is wrapped in a document, loaded in Chrome, and then:
 *  1. Chrome's accessibility tree is read through the DevTools protocol;
 *  2. the engine is injected into the page and run on document.body, in Chrome mode
 *     (`browser: "chrome"`, SPEC-006) unless --w3c asks for the default reading, which follows
 *     the W3C specifications and so differs from Chrome on the SPEC-006 inventory rows.
 * Both sides are normalised to (role, name, level, live values) in the same vocabulary and shown
 * as a line diff. The diff is information for a human, not a pass/fail: every differing line is an engine
 * bug, a pinned divergence with a reason, or a known gap in the normalisation below.
 *
 * The engine runs as `srm.interpret` (SPEC-005), and its visual-versus-semantic mismatches for the
 * same mode are printed after the diff, one line each: kind, the [at, end) range, the tag, the
 * signals, and the text the range covers. Chrome has no such heuristics, so they are information
 * for a person to judge as right or a false alarm, never compared.
 *
 * --write-expected saves the engine's full output in both modes next to the fixture:
 * <name>.expected.json (default) and <name>.chrome.json (Chrome mode), the golden files the
 * vitest suite checks against. Only the Chrome golden is vouched for by this comparison; the
 * default one needs a person's review of its diff.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { openPage } from "./ax-tree.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const writeExpected = args.includes("--write-expected");
const w3c = args.includes("--w3c");
if (!file) {
  console.error("usage: node scripts/ax-compare.mjs <fragment.html> [--w3c] [--write-expected]");
  process.exit(2);
}
const fragmentPath = resolve(file);
const fragment = readFileSync(fragmentPath, "utf8");
const name = basename(file, ".html");

// Chrome roles that are containers with no announcement of their own: skip the node, keep its
// children. Mirrors the engine's "transparent" kind.
const TRANSPARENT = new Set([
  "RootWebArea", "generic", "paragraph", "none", "presentation", "LabelText", "emphasis", "strong",
  "code", "time", "mark", "Abbr", "superscript", "subscript", "deletion", "insertion", "Figcaption",
  "Legend", "Pre", "DescriptionList", "LayoutTable", "LayoutTableRow", "LayoutTableCell",
]);
// Chrome nodes that are never announced as content.
const DROP = new Set(["ListMarker", "InlineTextBox"]);
// Chrome vocabulary to the engine's.
// LabelText is transparent unless it is a live region; ARIA has no label role, so it is generic.
// SvgRoot is Chrome's svg root with readable content; SVG-AAM maps every svg root to
// graphics-document, and the engine uses that name in both modes.
const ROLE_MAP = {
  image: "img", DisclosureTriangle: "button", StaticText: "text", Iframe: "document", LabelText: "generic",
  SvgRoot: "graphics-document",
};
// Roles whose name comes from content: Chrome still lists their text children, the engine does not.
const NAME_FROM_CONTENT = new Set([
  "heading", "link", "button", "cell", "gridcell", "columnheader", "rowheader", "option", "tab",
  "menuitem", "treeitem", "switch", "checkbox", "radio", "tooltip", "menuitemcheckbox", "menuitemradio",
]);
// Roles whose Chrome subtree is a value or a hidden popup, never content a screen reader reads
// in sequence: skip everything below them.
const LEAF_ROLES = new Set(["textbox", "searchbox", "combobox", "spinbutton", "slider", "progressbar", "meter", "img"]);
// Roles whose content Chrome counts toward an ancestor's name besides the name-from-content roles
// (Chromium SupportsNameFromContents, recursive). Text inside any other emitted role, such as a
// status inside a button, is not in that name and is read on its own.
const CONTRIBUTES = new Set([
  "generic", "none", "paragraph", "region", "list", "listitem", "definition", "term", "math",
  "caption", "emphasis", "strong", "code", "deletion", "insertion", "subscript", "superscript", "time",
  "graphics-document",
]);
// SVG elements whose group role still counts toward an ancestor's name in Chrome.
const SVG_GROUP_TAGS = new Set(["g", "tspan", "textpath", "foreignobject", "svg"]);
// Same rule as the engine for ending a text run: Chrome's computed display (which already
// blockifies flex and grid items), or the tag when the node has no layout.
const BLOCK_DISPLAYS = new Set([
  "block", "flow-root", "list-item", "flex", "grid", "table", "table-caption", "table-row",
  "table-cell", "table-row-group", "table-header-group", "table-footer-group",
]);
const BLOCK_TAGS = new Set([
  "address", "article", "aside", "blockquote", "body", "caption", "dd", "details", "dialog",
  "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3",
  "h4", "h5", "h6", "header", "hr", "legend", "li", "main", "nav", "ol", "optgroup", "option",
  "p", "pre", "section", "select", "summary", "table", "tbody", "td", "textarea", "tfoot", "th",
  "thead", "tr", "ul",
]);

const bundle = process.env.SRM_ENGINE_BUNDLE ?? buildBundle();
const engineSource = readFileSync(bundle, "utf8");

const pageDir = mkdtempSync(join(tmpdir(), "srm-fx-"));
const pagePath = join(pageDir, `${name}.html`);
writeFileSync(
  pagePath,
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${name}</title></head><body>\n${fragment}\n</body></html>`,
);

let chromeRaw;
let inW3c;
let inChrome;
const page = await openPage(pagePath);
try {
  chromeRaw = await page.axTree();
  await page.evaluate(engineSource);
  inW3c = JSON.parse(await page.evaluate("JSON.stringify(srm.interpret(document.body))"));
  inChrome = JSON.parse(await page.evaluate('JSON.stringify(srm.interpret(document.body, { browser: "chrome" }))'));
} finally {
  await page.close();
  rmSync(pageDir, { recursive: true, force: true });
}
const ours = (w3c ? inW3c : inChrome).nodes;
const mismatches = (w3c ? inW3c : inChrome).mismatches;

if (writeExpected) {
  for (const [suffix, { nodes: output }] of [["expected", inW3c], ["chrome", inChrome]]) {
    const target = join(dirname(fragmentPath), `${name}.${suffix}.json`);
    writeFileSync(target, JSON.stringify(output, null, 2) + "\n");
    console.log(`wrote ${target} (${output.length} nodes)`);
  }
}

const chrome = normaliseChrome(chromeRaw);
const engine = ours.map((n) => ({ role: n.role, name: n.name, level: n.level, live: n.live }));

const dir = mkdtempSync(join(tmpdir(), "srm-cmp-"));
const a = join(dir, `${name}.chrome.txt`);
const b = join(dir, `${name}.engine.txt`);
writeFileSync(a, chrome.map(line).join("\n") + "\n");
writeFileSync(b, engine.map(line).join("\n") + "\n");
const diff = spawnSync("git", ["diff", "--no-index", "--no-color", "-U1", a, b], { encoding: "utf8" });
const body = (diff.stdout ?? "").split("\n").slice(4).join("\n").trim();
const changed = body.split("\n").filter((l) => /^[+-]/.test(l)).length;
const mode = w3c ? "default (W3C)" : "Chrome mode";
console.log(`${name}: chrome ${chrome.length} nodes, engine in ${mode} ${engine.length} nodes, ${changed} differing lines`);
if (body) console.log(body);
rmSync(dir, { recursive: true, force: true });
console.log(`mismatches in ${mode}: ${mismatches.length}`);
for (const m of mismatches) {
  const covered = ours.slice(m.at, m.end).map((n) => `${n.role} "${n.name}"`).join(", ");
  const where = m.ref.frame ? ` frame ${m.ref.frame}` : m.ref.shadow ? " shadow" : "";
  console.log(`  ${m.kind} [${m.at}, ${m.end}) <${m.ref.tag}>${where} ${m.signals.join(" ")}${covered ? ` :: ${covered}` : ""}`);
}

/** True when Chrome counts this emitted node's content toward its ancestor's name. */
function contributes(n, role) {
  if (n.name && n.name.trim()) return false; // an author name stands in for the content
  if (role === "group") return n.tag === "details" || n.tag === "address" || SVG_GROUP_TAGS.has(n.tag);
  return CONTRIBUTES.has(role);
}

/** True when a transparent Chrome node starts a new line, by its computed display or its tag. */
function endsLine(n) {
  if (n.display === "contents") return false;
  if (n.display) return BLOCK_DISPLAYS.has(n.display);
  return BLOCK_TAGS.has(n.tag);
}

function line(n) {
  return `${n.role}${n.level ? " " + n.level : ""} | ${n.name}${n.live ? " | " + liveLine(n.live) : ""}`;
}

/** The live values in one comparable string: politeness, atomic, busy, relevant. */
function liveLine(live) {
  return `live ${live.politeness}${live.atomic ? " atomic" : ""}${live.busy ? " busy" : ""} relevant ${live.relevant.join(" ")}`;
}

/**
 * Chrome's live properties in the engine's shape, or undefined when the node is not a live
 * region (Chrome omits `live` for `off`). The politeness is kept as Chrome reports it, so an
 * invalid token, which Chrome passes through and the engine ignores, shows as a difference.
 * `relevant` is expanded the way the engine does it: valid tokens in a fixed order, `all` as all
 * three, the default when none is valid.
 */
function chromeLive(n) {
  if (n.live === undefined || n.live === "off") return undefined;
  const order = ["additions", "removals", "text"];
  const tokens = new Set(String(n.relevant ?? "").trim().toLowerCase().split(/\s+/));
  let relevant = order.filter((t) => tokens.has("all") || tokens.has(t));
  if (relevant.length === 0) relevant = ["additions", "text"];
  const live = { politeness: n.live, atomic: n.atomic === true, relevant };
  if (n.busy) live.busy = true;
  return live;
}

function buildBundle() {
  const out = mkdtempSync(join(tmpdir(), "srm-engine-"));
  const config = resolve("scripts/ax-engine.tsup.config.ts");
  const r = spawnSync("pnpm", ["exec", "tsup", "--config", config], {
    cwd: resolve("packages/core"),
    env: { ...process.env, SRM_IIFE_OUT: out },
    shell: true,
    encoding: "utf8",
  });
  if (r.status !== 0) throw new Error("engine bundle build failed:\n" + r.stdout + r.stderr);
  return join(out, "srm.global.js");
}

function normaliseChrome(nodes) {
  const out = [];
  let skipDepth = Infinity; // everything below a leaf-like role is value or popup, not content
  // StaticText below a name-from-content node is its name, not content, until a role that Chrome
  // leaves out of that name starts reading again. Each entry: the depth it opened at, and whether
  // text below it is skipped.
  const textSkip = [];
  const skippingText = () => textSkip.length > 0 && textSkip[textSkip.length - 1].skip;
  const blockDepths = []; // open transparent block elements; leaving one ends the text run
  const endRun = () => {
    const prev = out[out.length - 1];
    if (prev && prev.role === "text") prev.merge = false;
  };
  for (const n of nodes) {
    if (n.depth <= skipDepth) skipDepth = Infinity;
    while (textSkip.length && textSkip[textSkip.length - 1].depth >= n.depth) textSkip.pop();
    while (blockDepths.length && blockDepths[blockDepths.length - 1] >= n.depth) {
      blockDepths.pop();
      endRun();
    }
    if (n.depth > skipDepth) continue;
    if (n.role === "LineBreak") {
      endRun();
      continue;
    }
    if (DROP.has(n.role)) continue;
    const live = chromeLive(n);
    // A live region is a node even when its role is transparent, as in the engine (SPEC-004).
    if (n.ignored || (TRANSPARENT.has(n.role) && !live)) {
      if (endsLine(n)) {
        endRun();
        blockDepths.push(n.depth);
      }
      continue;
    }
    const role = ROLE_MAP[n.role] ?? n.role;
    if (role === "text") {
      if (skippingText()) continue;
      const prev = out[out.length - 1];
      // A whitespace-only piece between inline elements is the space a reader sees: keep it in
      // an open run, drop it anywhere else.
      if (!n.name.trim()) {
        if (prev && prev.role === "text" && prev.merge) prev.raw += " ";
        continue;
      }
      // Merge raw, so the spacing Chrome preserves at segment edges ("tokens" + ".") is kept.
      if (prev && prev.role === "text" && prev.merge) prev.raw += n.name;
      else out.push({ role: "text", raw: n.name, merge: true });
      continue;
    }
    endRun();
    out.push({ role, name: n.name.replace(/\s+/g, " ").trim(), level: n.level, live });
    // Leaving an emitted node ends the text run, as the engine flushes at a container's edge.
    blockDepths.push(n.depth);
    // A link inside a heading keeps skipping; a status inside a button reads its text again, and
    // so does a role with its own author name, whose content is not in the ancestor's name.
    if (NAME_FROM_CONTENT.has(role)) textSkip.push({ depth: n.depth, skip: true });
    else if (skippingText() && !contributes(n, role)) textSkip.push({ depth: n.depth, skip: false });
    if (LEAF_ROLES.has(role)) skipDepth = Math.min(skipDepth, n.depth);
  }
  return out.map(({ merge: _merge, raw, ...rest }) =>
    raw !== undefined ? { ...rest, name: raw.replace(/\s+/g, " ").trim() } : rest,
  );
}
