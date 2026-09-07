import type { InterpretationNode, NodeFlags } from "./types";
import { isHiddenFromAT, type VisibilityOptions } from "./visibility";
import {
  resolveRole,
  accessibleName,
  takesNameFromContent,
  isChildrenPresentational,
  isWidget,
} from "./roles";

export type LinearizeOptions = VisibilityOptions;

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

// Host-language leaves: form controls and images have no exposed DOM children (an <input> has none;
// a <select>'s options and a <textarea>'s text are its *value*), so they emit one node.
const LEAF_TAGS = new Set(["img", "input", "textarea", "select", "hr"]);

// Roles with no announcement value of their own — emit nothing, just surface their content. (A
// `<p>` and a generic `<div>` both read as their text; the screen reader doesn't announce them.)
const TRANSPARENT_ROLES = new Set(["paragraph", "presentation", "none", "generic"]);

// SVG <title>/<desc>/<metadata> are name/description metadata (SVG-AAM), never rendered text.
const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_METADATA_TAGS = new Set(["title", "desc", "metadata"]);

/**
 * Linearize a DOM subtree into the ordered sequence a screen reader would traverse (SPEC-001).
 *
 * Each element is one of three kinds:
 *  - **transparent** (no role, or a silent structural role) — emits nothing, recurses so its text
 *    and descendants surface.
 *  - **leaf** — a form control / image, or a role whose children are presentational *and* whose
 *    name cannot come from content (img, slider, separator, progressbar, …): emits one node and
 *    does **not** recurse, because nothing below it is exposed.
 *  - **container** — everything else (landmark, list, table, row, cell, link, heading, and also
 *    the content widgets button/tab/option/switch whose descendants browsers do keep in the tree):
 *    emits a node *and* recurses, so nested elements — the link inside a heading, the missing-alt
 *    image inside a button, the button inside a table cell — stay in the reading order.
 *
 * The **no-double-read rule** (SPEC-001 §3): a role that takes its name from content (heading,
 * link, cell, row, button, …) has already consumed its descendant *text* into `name`, so bare
 * text runs inside it are not emitted again — but descendant *elements* with roles of their own
 * still are, and each emitted container starts a fresh text context: an author-named container
 * (list, listitem, group, landmark) nested in a consumed subtree surfaces its own text.
 * Elements hidden from assistive tech are skipped along with their subtree.
 */
export function linearize(root: Element, options: LinearizeOptions = {}): InterpretationNode[] {
  const out: InterpretationNode[] = [];
  emitElement(root, out, options, false);
  return out;
}

function emitElement(
  el: Element,
  out: InterpretationNode[],
  options: LinearizeOptions,
  textConsumed: boolean,
): void {
  if (isHiddenFromAT(el, options)) return; // skip element AND its subtree

  const tag = el.tagName.toLowerCase();
  if (el.namespaceURI === SVG_NS && SVG_METADATA_TAGS.has(tag)) return;

  const role = resolveRole(el);

  // Decorative image (alt="") — excluded from the reading order entirely.
  if (role === "presentation" && tag === "img") return;

  // Transparent: surface descendant content, no node of our own.
  if (role === null || TRANSPARENT_ROLES.has(role)) {
    walkChildren(el, out, options, textConsumed);
    return;
  }

  out.push(buildNode(el, role, tag));

  const consumesText = takesNameFromContent(role);

  // Leaf: nothing below is exposed.
  if (LEAF_TAGS.has(tag) || (isChildrenPresentational(role) && !consumesText)) return;

  // Container: fresh text context — suppressed only if this node's own name came from content.
  walkChildren(el, out, options, consumesText);
}

function walkChildren(
  node: Node,
  out: InterpretationNode[],
  options: LinearizeOptions,
  textConsumed: boolean,
): void {
  node.childNodes.forEach((child) => {
    if (child.nodeType === TEXT_NODE) {
      if (textConsumed) return;
      const text = collapseWhitespace(child.textContent ?? "");
      if (text) out.push({ role: "text", name: text });
      return;
    }
    if (child.nodeType === ELEMENT_NODE) emitElement(child as Element, out, options, textConsumed);
  });
}

function buildNode(el: Element, role: string, tag: string): InterpretationNode {
  const name = accessibleName(el);
  const node: InterpretationNode = { role, name, ref: { tag } };
  const level = headingLevel(el, role);
  if (level !== undefined) node.level = level;
  const flags = computeFlags(el, role, tag, name);
  if (flags) node.flags = flags;
  return node;
}

function headingLevel(el: Element, role: string): number | undefined {
  if (role !== "heading") return undefined;
  // An author `aria-level` wins, on <h1>–<h6> too (browsers honour it over the tag).
  const ariaLevel = Number(el.getAttribute("aria-level"));
  if (Number.isInteger(ariaLevel) && ariaLevel >= 1) return ariaLevel;
  const tagMatch = /^h([1-6])$/.exec(el.tagName.toLowerCase());
  return tagMatch ? Number(tagMatch[1]) : 2; // WAI-ARIA 1.2: implicit aria-level of a heading is 2
}

function computeFlags(el: Element, role: string, tag: string, name: string): NodeFlags | undefined {
  const flags: NodeFlags = {};
  if (isWidget(role) && name === "") flags.unnamed = true; // interactive control, no name (AC-5)
  if (tag === "img" && !el.hasAttribute("alt")) flags.missingAlt = true; // missing alt (AC-6)
  return Object.keys(flags).length > 0 ? flags : undefined;
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
