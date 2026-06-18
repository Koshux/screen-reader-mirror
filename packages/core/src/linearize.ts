import { computeAccessibleName } from "dom-accessibility-api";
import type { InterpretationNode, NodeFlags } from "./types";
import { isHiddenFromAT, type VisibilityOptions } from "./visibility";
import { resolveRole, takesNameFromContent, isWidget } from "./roles";

export type LinearizeOptions = VisibilityOptions;

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

// Form-control + image elements are leaves: they get a name from a label/alt (not their content),
// so we emit one node and don't descend.
const LEAF_TAGS = new Set(["img", "input", "textarea", "select", "hr"]);

// Roles with no announcement value of their own — emit nothing, just surface their content. (A
// `<p>` and a generic `<div>` both read as their text; the screen reader doesn't announce them.)
const TRANSPARENT_ROLES = new Set(["paragraph", "presentation", "none", "generic"]);

/**
 * Linearize a DOM subtree into the ordered sequence a screen reader would traverse (SPEC-001).
 *
 * Each element is one of three kinds:
 *  - **transparent** (no role, or a silent structural role) — emits nothing, recurses so its text
 *    and descendants surface.
 *  - **leaf** — a name-from-content role (button/link/heading…) or a form control / image: emits one
 *    node whose `name` consumes its content, and does **not** recurse (the no-double-read rule).
 *  - **container** — a landmark/list/table/etc.: emits a node *and* recurses (its descendants are
 *    separate content read within it).
 *
 * Elements hidden from assistive tech are skipped along with their subtree.
 */
export function linearize(root: Element, options: LinearizeOptions = {}): InterpretationNode[] {
  const out: InterpretationNode[] = [];
  emitElement(root, out, options);
  return out;
}

function emitElement(el: Element, out: InterpretationNode[], options: LinearizeOptions): void {
  if (isHiddenFromAT(el, options)) return; // skip element AND its subtree

  const tag = el.tagName.toLowerCase();
  const role = resolveRole(el);

  // Decorative image (alt="") — excluded from the reading order entirely.
  if (role === "presentation" && tag === "img") return;

  // Transparent: surface descendant content, no node of our own.
  if (role === null || TRANSPARENT_ROLES.has(role)) {
    walkChildren(el, out, options);
    return;
  }

  // Leaf: name-from-content role, or a form control / image.
  if (takesNameFromContent(role) || LEAF_TAGS.has(tag)) {
    out.push(buildNode(el, role, tag));
    return;
  }

  // Container: emit the node, then read its descendants.
  out.push(buildNode(el, role, tag));
  walkChildren(el, out, options);
}

function walkChildren(node: Node, out: InterpretationNode[], options: LinearizeOptions): void {
  node.childNodes.forEach((child) => {
    if (child.nodeType === TEXT_NODE) {
      const text = collapseWhitespace(child.textContent ?? "");
      if (text) out.push({ role: "text", name: text });
      return;
    }
    if (child.nodeType === ELEMENT_NODE) emitElement(child as Element, out, options);
  });
}

function buildNode(el: Element, role: string, tag: string): InterpretationNode {
  const name = safeName(el);
  const node: InterpretationNode = { role, name, ref: { tag } };
  const level = headingLevel(el, role);
  if (level !== undefined) node.level = level;
  const flags = computeFlags(el, role, tag, name);
  if (flags) node.flags = flags;
  return node;
}

function safeName(el: Element): string {
  try {
    return collapseWhitespace(computeAccessibleName(el));
  } catch {
    return ""; // never let a name-computation hiccup drop the node
  }
}

function headingLevel(el: Element, role: string): number | undefined {
  if (role !== "heading") return undefined;
  const tagMatch = /^h([1-6])$/.exec(el.tagName.toLowerCase());
  if (tagMatch) return Number(tagMatch[1]);
  const ariaLevel = Number(el.getAttribute("aria-level"));
  return Number.isInteger(ariaLevel) && ariaLevel >= 1 ? ariaLevel : undefined;
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
