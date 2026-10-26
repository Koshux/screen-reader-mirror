import type { InterpretationNode, LiveRegion, NodeFlags } from "./types";
import { isHiddenFromAT, firstSummaryOf, type VisibilityOptions } from "./visibility";
import { liveRegionOf } from "./live";
import {
  resolveRole,
  accessibleName,
  takesNameFromContent,
  isChildrenPresentational,
  isNameProhibited,
  isWidget,
  hasAuthorName,
  labelledControl,
  composedParent,
  type ParentOf,
} from "./roles";

export interface LinearizeOptions extends VisibilityOptions {
  /**
   * Supply a shadow root the DOM hides (a closed root), for hosts that can reach one. Defaults to
   * `el.shadowRoot`, which is null for a closed root, so closed content is not seen. SPEC-003 AC-9.
   */
  getShadowRoot?: (host: Element) => ShadowRoot | null | undefined;
}

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const DOCUMENT_FRAGMENT_NODE = 11;

// Host-language leaves: form controls and images have no exposed DOM children (an <input> has none;
// a <textarea>'s text is its *value*), so they emit one node. A collapsed <select> is a leaf too
// (its options are its value); a list-box <select> is not, its options are navigable children.
const LEAF_TAGS = new Set(["img", "input", "textarea", "hr"]);

// Roles with no announcement value of their own: emit nothing, just surface their content. (A
// `<p>` and a generic `<div>` both read as their text; the screen reader doesn't announce them.)
const TRANSPARENT_ROLES = new Set(["paragraph", "presentation", "none", "generic"]);

// Elements that start a new line for a screen reader. Bare text inside one of them is a single
// run; text on either side of one is separate runs. Inline formatting (<em>, <span>, <code>, an
// <a> without href, ...) does not break a run, so "Loose <em>text</em> here" reads as one line,
// the way a browser lays it out.
const BLOCK_TAGS = new Set([
  "address", "article", "aside", "blockquote", "body", "caption", "dd", "details", "dialog",
  "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3",
  "h4", "h5", "h6", "header", "hr", "legend", "li", "main", "nav", "ol", "optgroup", "option",
  "p", "pre", "section", "select", "summary", "table", "tbody", "td", "textarea", "tfoot", "th",
  "thead", "tr", "ul",
]);

// SVG <title>/<desc>/<metadata> are name/description metadata (SVG-AAM), never rendered text.
const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_METADATA_TAGS = new Set(["title", "desc", "metadata"]);

/**
 * State threaded through one traversal: the output, the options, the text run in progress, the
 * number of frames met so far, the index of the frame being walked (undefined at the top), and
 * the composed parent of each element met, which role rules read through `parentOf`.
 */
interface Walk {
  out: InterpretationNode[];
  options: LinearizeOptions;
  pending: string;
  frames: number;
  frame: number | undefined;
  parents: WeakMap<Element, Element>;
  parentOf: ParentOf;
}

/**
 * Linearize a DOM subtree into the ordered sequence a screen reader would traverse (SPEC-001).
 *
 * Each element is one of three kinds:
 *  - **transparent** (no role, or a silent structural role): emits nothing, recurses so its text
 *    and descendants surface. A live region with such a role is emitted as a node instead
 *    (SPEC-004), and every live region carries a `live` field.
 *  - **leaf**: a form control / image, or a role whose children are presentational *and* whose
 *    name cannot come from content (img, slider, separator, progressbar, ...): emits one node and
 *    does **not** recurse, because nothing below it is exposed.
 *  - **container**: everything else (landmark, list, table, row, cell, link, heading, and also
 *    the content widgets button/tab/option/switch whose descendants browsers do keep in the tree):
 *    emits a node *and* recurses, so nested elements, the link inside a heading, the missing-alt
 *    image inside a button, the button inside a table cell, stay in the reading order.
 *
 * The **no-double-read rule** (SPEC-001 §3): a role that takes its name from content (heading,
 * link, cell, row, button, ...) has already consumed its descendant *text* into `name`, so bare
 * text runs inside it are not emitted again, but descendant *elements* with roles of their own
 * still are, and each emitted container starts a fresh text context.
 *
 * Bare text is emitted as **runs**: adjacent text and inline formatting merge into one `text`
 * node, and block-level elements, `<br>`, and emitted nodes end a run. Elements hidden from
 * assistive tech are skipped along with their subtree.
 *
 * The walk follows the **composed tree** (SPEC-003): a shadow host reads its shadow content, a
 * `<slot>` reads what is assigned to it, and unslotted light children are not read. An
 * `<iframe>` is a `document` node followed by its document's content when the page can read it,
 * or a `document` node flagged `unreachable` when it cannot.
 */
export function linearize(root: Element, options: LinearizeOptions = {}): InterpretationNode[] {
  const parents = new WeakMap<Element, Element>();
  const parentOf: ParentOf = (el) => parents.get(el) ?? composedParent(el);
  const walk: Walk = { out: [], options, pending: "", frames: 0, frame: undefined, parents, parentOf };
  emitElement(root, walk, false);
  flushText(walk);
  return walk.out;
}

function emitElement(el: Element, walk: Walk, textConsumed: boolean): void {
  if (isHiddenFromAT(el, walk.options)) return; // skip element AND its subtree

  const tag = el.tagName.toLowerCase();
  if (el.namespaceURI === SVG_NS && SVG_METADATA_TAGS.has(tag)) return;
  if (tag === "br") {
    flushText(walk); // a line break ends the current text run
    return;
  }
  if (tag === "slot") {
    // A slot is `display: contents`: it emits nothing and does not end a text run.
    walkChildren(el, walk, textConsumed);
    return;
  }

  const role = resolveRole(el, walk.parentOf);

  if (tag === "iframe" && role !== null) {
    emitFrame(el, role, walk);
    return;
  }

  // Decorative image (alt=""): excluded from the reading order entirely.
  if (role === "presentation" && tag === "img") return;

  const live = liveRegionOf(el, role);
  const transparent = role === null || TRANSPARENT_ROLES.has(role);

  // A live region with a transparent role is still a node, empty or not, so the developer sees it
  // before its message arrives (SPEC-004). Its own role never takes a name from content, so it
  // keeps the text context it was given: inside a heading, link, or button its text is already
  // in that name and is not read again (AC-12).
  if (transparent && live) {
    flushText(walk);
    walk.out.push(buildNode(el, role ?? "generic", tag, walk, live));
    walkChildren(el, walk, textConsumed);
    flushText(walk);
    return;
  }

  // Transparent: surface descendant content, no node of our own. A block-level element still
  // separates text runs.
  if (transparent) {
    const block = BLOCK_TAGS.has(tag);
    if (block) flushText(walk);
    // The text of a label for a checkbox or radio is read only as the control name (Chrome drops
    // it from the tree); the text of a label for a text field is read on its own as well.
    walkChildren(el, walk, textConsumed || (tag === "label" && labelsToggle(el)));
    if (block) flushText(walk);
    return;
  }

  flushText(walk);
  walk.out.push(buildNode(el, role, tag, walk, live));

  const consumesText = takesNameFromContent(role);

  // Leaf: nothing below is exposed.
  if (isLeaf(tag, role) || (isChildrenPresentational(role) && !consumesText)) return;

  // Container: fresh text context, suppressed only if this node's own name came from content.
  walkChildren(el, walk, consumesText);
  flushText(walk);
}

/**
 * A frame is a `document` node named from the iframe, then the frame document's content. The
 * node and everything inside carry the frame's index; a frame the page cannot read (cross-origin)
 * is flagged `unreachable` and has nothing inside. A frame that has not loaded yet has an empty
 * document and reads as an empty frame. The frame's URL is never recorded.
 */
function emitFrame(iframe: Element, role: string, walk: Walk): void {
  flushText(walk);
  const outer = walk.frame;
  walk.frame = ++walk.frames;
  const node = buildNode(iframe, role, "iframe", walk);
  const doc = frameDocument(iframe);
  if (!doc) node.flags = { ...node.flags, unreachable: true };
  walk.out.push(node);
  if (doc?.body) emitElement(doc.body, walk, false);
  flushText(walk);
  walk.frame = outer;
}

/** The frame's document, or null when the page cannot read it: cross-origin reads as null or throws. */
function frameDocument(iframe: Element): Document | null {
  try {
    return (iframe as Element & { contentDocument?: Document | null }).contentDocument ?? null;
  } catch {
    return null;
  }
}

function labelsToggle(label: Element): boolean {
  const control = labelledControl(label);
  if (!control || control.tagName.toLowerCase() !== "input") return false;
  const type = (control.getAttribute("type") ?? "text").toLowerCase();
  return type === "checkbox" || type === "radio";
}

function isLeaf(tag: string, role: string): boolean {
  return LEAF_TAGS.has(tag) || (tag === "select" && role === "combobox");
}

function walkChildren(el: Element, walk: Walk, textConsumed: boolean): void {
  // A closed <details> renders only its first <summary>; the rest is out of the tree.
  if (el.tagName.toLowerCase() === "details" && !el.hasAttribute("open")) {
    const summary = firstSummaryOf(el);
    if (summary) emitElement(summary, walk, textConsumed);
    return;
  }
  // A slot is not a parent in the accessibility tree: what it shows hangs off the slot's parent.
  const parent = el.tagName.toLowerCase() === "slot" ? walk.parentOf(el) : el;
  for (const child of composedChildren(el, walk.options)) {
    if (child.nodeType === TEXT_NODE) {
      if (!textConsumed) walk.pending += child.textContent ?? "";
      continue;
    }
    if (child.nodeType !== ELEMENT_NODE) continue;
    if (parent) walk.parents.set(child as Element, parent);
    emitElement(child as Element, walk, textConsumed);
  }
}

/**
 * The children a screen reader sees under an element, in the composed tree (SPEC-003 §3). A
 * shadow host shows its shadow root's children and never its light children directly; a slot
 * shows the nodes assigned to it, or its fallback content when nothing is assigned. Nested slots
 * are not flattened here: an assigned slot is walked as an element in its turn, so visibility is
 * checked at every level.
 */
function composedChildren(el: Element, options: LinearizeOptions): Node[] {
  const shadow = options.getShadowRoot?.(el) ?? el.shadowRoot;
  if (shadow) return Array.from(shadow.childNodes);
  if (el.tagName.toLowerCase() === "slot") {
    const slot = el as Element & { assignedNodes?: () => Node[] };
    const assigned = typeof slot.assignedNodes === "function" ? slot.assignedNodes() : [];
    if (assigned.length > 0) return assigned;
  }
  return Array.from(el.childNodes);
}

/**
 * End the current text run: emit it as one `text` node if it has any visible characters. Inside a
 * frame the run carries the frame's index, so a renderer can tell where the frame ends.
 */
function flushText(walk: Walk): void {
  const text = collapseWhitespace(walk.pending);
  walk.pending = "";
  if (!text) return;
  const node: InterpretationNode = { role: "text", name: text };
  if (walk.frame !== undefined) node.ref = { tag: "#text", frame: walk.frame };
  walk.out.push(node);
}

/** True when the element's root is a shadow root rather than a document. */
function inShadowTree(el: Element): boolean {
  const root = el.getRootNode();
  return root.nodeType === DOCUMENT_FRAGMENT_NODE && "host" in root;
}

function buildNode(el: Element, role: string, tag: string, walk: Walk, live?: LiveRegion): InterpretationNode {
  // ARIA prohibits naming some roles (caption, paragraph, ...): the node carries no name and its
  // text reads as content instead. A table row is named by the author or not at all. A text
  // field with no other name source takes its placeholder, as HTML-AAM and browsers do.
  let name = isNameProhibited(role) || (role === "row" && !hasAuthorName(el)) ? "" : accessibleName(el);
  if (name === "" && (tag === "input" || tag === "textarea")) {
    name = collapseWhitespace(el.getAttribute("placeholder") ?? "");
  }
  // HTML-AAM still names a table from its obsolete summary attribute, and so does Chrome.
  if (name === "" && tag === "table") name = collapseWhitespace(el.getAttribute("summary") ?? "");
  const ref: NonNullable<InterpretationNode["ref"]> = { tag };
  if (inShadowTree(el)) ref.shadow = true;
  if (walk.frame !== undefined) ref.frame = walk.frame;
  const node: InterpretationNode = { role, name, ref };
  const level = headingLevel(el, role);
  if (level !== undefined) node.level = level;
  const flags = computeFlags(el, role, tag, name);
  if (flags) node.flags = flags;
  if (live) node.live = live;
  return node;
}

function headingLevel(el: Element, role: string): number | undefined {
  if (role !== "heading") return undefined;
  // An author aria-level wins, on <h1>-<h6> too (browsers honour it over the tag).
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
