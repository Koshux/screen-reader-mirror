import type { Interpretation, InterpretationNode, LiveRegion, Mismatch, MismatchSignal, NodeFlags } from "./types";
import { isHiddenFromAT, firstSummaryOf, resolveStyle, type VisibilityOptions } from "./visibility";
import { liveRegionOf } from "./live";
import { rulesFor, type BrowserMode } from "./browser";
import {
  resolveRole,
  accessibleName,
  takesNameFromContent,
  isChildrenPresentational,
  isNameProhibited,
  isWidget,
  hasAuthorName,
  hasOnlyEmptyLabels,
  isImplicitSvgRoot,
  labelledControl,
  rowInGrid,
  composedParent,
  type RoleContext,
} from "./roles";
import {
  clickSignals,
  fieldSignal,
  hasNoRoleOfItsOwn,
  headingSignals,
  isField,
  orderSignals,
  tableSignals,
  HEADING_EXCLUDED_TAGS,
  TOGGLE_ROLES,
} from "./mismatch";

export interface LinearizeOptions extends VisibilityOptions {
  /**
   * Supply a shadow root the DOM hides (a closed root), for hosts that can reach one. Defaults to
   * `el.shadowRoot`, which is null for a closed root, so closed content is not seen. SPEC-003 AC-9.
   */
  getShadowRoot?: (host: Element) => ShadowRoot | null | undefined;
  /**
   * Read the page as this browser does where it differs from the W3C specifications. Omitted,
   * the reading follows the specifications (ADR-0005). Only "chrome" is accepted today; any other
   * value throws a `RangeError`. SPEC-006.
   */
  browser?: BrowserMode;
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
// the way a browser lays it out. The computed display decides when it is known (see endsLine);
// the tags are the fallback when it is not.
const BLOCK_TAGS = new Set([
  "address", "article", "aside", "blockquote", "body", "caption", "dd", "details", "dialog",
  "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3",
  "h4", "h5", "h6", "header", "hr", "legend", "li", "main", "nav", "ol", "optgroup", "option",
  "p", "pre", "section", "select", "summary", "table", "tbody", "td", "textarea", "tfoot", "th",
  "thead", "tr", "ul",
]);

// Computed display values that put an element on its own line, as the innerText algorithm and
// screen readers in browse mode treat them. Inline-level values (inline, inline-block,
// inline-flex, contents, ...) do not.
const BLOCK_DISPLAYS = new Set([
  "block", "flow-root", "list-item", "flex", "grid", "table", "table-caption", "table-row",
  "table-cell", "table-row-group", "table-header-group", "table-footer-group",
]);
// A child of one of these is a flex or grid item, which CSS lays out as a block.
const BLOCKIFYING_DISPLAYS = new Set(["flex", "inline-flex", "grid", "inline-grid"]);

// SVG <title>/<desc>/<metadata> are name/description metadata (SVG-AAM), never rendered text. The
// other tags are never rendered directly, so SVG-AAM creates no object for them or their content.
const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_SKIPPED_TAGS = new Set([
  "title", "desc", "metadata", "defs", "clippath", "mask", "pattern", "symbol", "marker",
  "lineargradient", "radialgradient", "filter", "script", "style",
]);
const SVG_TEMPLATE_TAGS = new Set(["defs", "symbol"]);

/**
 * State threaded through one traversal: the output, the options, the text run in progress, the
 * number of frames met so far, the index of the frame being walked (undefined at the top), the
 * composed parent of each element met, and the role context the rules read (SPEC-006 AC-5): its
 * `parentOf` answers from `parents`.
 */
interface Walk {
  out: InterpretationNode[];
  options: LinearizeOptions;
  pending: string;
  frames: number;
  frame: number | undefined;
  parents: WeakMap<Element, Element>;
  ctx: RoleContext;
  /** Present only in `interpret()`: the mismatch heuristics run and keep their state here. */
  mm?: MismatchWalk;
}

type Ref = NonNullable<InterpretationNode["ref"]>;

/**
 * Bookkeeping for the mismatch heuristics (SPEC-005 §3, Walk). Text is counted in pieces: `text`
 * goes up by one for every non-blank piece added to a run, so comparing counts tells whether an
 * element added text, and whether a run holds only an element's text.
 */
interface MismatchWalk {
  found: Array<{ seq: number; mismatch: Mismatch }>;
  /** Elements entered so far: orders an outer element before an inner one at the same index. */
  seq: number;
  text: number;
  /** The value of `text` for the pending run's first piece, and the element holding it. */
  runStart: number;
  holder: Element | null;
  /** Each emitted text run by index: its first and last piece, and the element holding its first. */
  runs: Map<number, { start: number; end: number; holder: Element | null }>;
  /** Text runs ended by a `<br>`: the next run is in the same block, so the bold rule skips it. */
  brEnded: Set<number>;
  /** Heading candidates whose text is the pending run, if nothing is added before it ends. */
  deferred: Array<{ el: Element; seq: number; ref: Ref; text: number }>;
  /** Heading candidates whose text is exactly the run at `index`, innermost first. */
  lines: Array<{ index: number; el: Element; seq: number; ref: Ref }>;
  fields: Array<{ index: number; el: Element; seq: number; ref: Ref; signal: MismatchSignal; toggle: boolean }>;
  /** Open ancestors that rule out a heading: named from content, a label or caption, a mismatch. */
  noHeading: number;
  /** Open `<table>` elements, table, grid, and treegrid roles, and fake tables already found. */
  inTable: number;
  /** Open widgets. */
  inWidget: number;
}

/** What `enterElement` records for `leaveElement`. */
interface Entry {
  el: Element;
  seq: number;
  ref: Ref;
  /** `walk.out.length`, whether a run was pending, and the text count, on entry. */
  len: number;
  pendingBefore: boolean;
  text: number;
  marks: Array<{ kind: Mismatch["kind"]; signals: MismatchSignal[] }>;
  heading: boolean;
  /** A live region with no role of its own: its node comes first, then its text (SPEC-004). */
  liveNode: boolean;
  counted: { noHeading: boolean; inTable: boolean; inWidget: boolean };
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
  return walkTree(root, options, false).out;
}

/**
 * The reading order `linearize()` returns, with the visual-versus-semantic mismatches found on
 * the same walk (SPEC-005): text that looks like a heading, a grid of elements that looks like a
 * table, an element that looks clickable with no button or link role, a field with no label.
 * Mismatches are guesses from markup and computed style; each carries the signals it rests on.
 * Takes the same options, `browser` included, and `nodes` equals `linearize(root, options)`.
 *
 * Style is read through `options.getComputedStyle` when given, else from each element's own
 * window, once per element for the call: visibility, the table rules, and the heuristics share
 * the cache.
 */
export function interpret(root: Element, options: LinearizeOptions = {}): Interpretation {
  const styles = new Map<Element, CSSStyleDeclaration | null>();
  const getComputedStyle = (el: Element): CSSStyleDeclaration | null => {
    if (!styles.has(el)) styles.set(el, resolveStyle(el, options));
    return styles.get(el) ?? null;
  };
  const walk = walkTree(root, { ...options, getComputedStyle }, true);
  return { nodes: walk.out, mismatches: finishMismatches(walk) };
}

function walkTree(root: Element, options: LinearizeOptions, heuristics: boolean): Walk {
  const rules = rulesFor(options.browser);
  const parents = new WeakMap<Element, Element>();
  const ctx: RoleContext = {
    parentOf: (el) => parents.get(el) ?? composedParent(el),
    styleOf: (el) => resolveStyle(el, options),
    rules,
    grids: new WeakMap(),
  };
  const walk: Walk = { out: [], options, pending: "", frames: 0, frame: undefined, parents, ctx };
  if (heuristics) {
    walk.mm = {
      found: [], seq: 0, text: 0, runStart: 0, holder: null, runs: new Map(), brEnded: new Set(), deferred: [], lines: [],
      fields: [], noHeading: 0, inTable: 0, inWidget: 0,
    };
  }
  emitElement(root, walk, false);
  flushText(walk);
  return walk;
}

function emitElement(el: Element, walk: Walk, textConsumed: boolean): void {
  if (isHiddenFromAT(el, walk.options)) return; // skip element AND its subtree

  const tag = el.tagName.toLowerCase();
  if (el.namespaceURI === SVG_NS && SVG_SKIPPED_TAGS.has(tag)) {
    // Chrome (row 11) reads the text inside defs and symbol as content.
    if (!(walk.ctx.rules.svgTemplateTextRead && SVG_TEMPLATE_TAGS.has(tag))) return;
    walkChildren(el, walk, textConsumed);
    return;
  }
  if (tag === "br") {
    const before = walk.out.length;
    flushText(walk); // a line break ends the current text run
    if (walk.mm && walk.out.length > before) walk.mm.brEnded.add(walk.out.length - 1);
    return;
  }
  if (tag === "slot") {
    // A slot is `display: contents`: it emits nothing and does not end a text run.
    walkChildren(el, walk, textConsumed);
    return;
  }

  const role = resolveRole(el, walk.ctx);
  const live = liveRegionOf(el, role);

  if (tag === "iframe" && role !== null) {
    emitFrame(el, role, walk, live);
    return;
  }

  const entry = walk.mm ? enterElement(el, tag, role, live, walk) : undefined;
  emitByRole(el, tag, role, live, walk, textConsumed);
  if (entry) leaveElement(entry, walk);
}

function emitByRole(
  el: Element,
  tag: string,
  role: string | null,
  live: LiveRegion | undefined,
  walk: Walk,
  textConsumed: boolean,
): void {
  // Decorative image (alt=""): excluded from the reading order entirely.
  if (role === "presentation" && tag === "img") return;

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
    const block = endsLine(el, tag, walk);
    if (block) flushText(walk);
    // A label's text is read as text, after or before the control it names: no W3C text removes
    // it. Chrome (row 8) drops the text of a label for a checkbox or radio from its tree and
    // reads it only as the control's name.
    const hideLabel = walk.ctx.rules.hideToggleLabelText && tag === "label" && labelsToggle(el);
    walkChildren(el, walk, textConsumed || hideLabel);
    if (block) flushText(walk);
    return;
  }

  flushText(walk);
  const node = buildNode(el, role, tag, walk, live);
  walk.out.push(node);
  if (walk.mm) noteField(el, tag, role, node, walk);

  const consumesText = takesNameFromContent(role, walk.ctx.rules);

  // Leaf: nothing below is exposed.
  if (isLeaf(tag, role) || (isChildrenPresentational(role) && !consumesText)) return;

  // Container: fresh text context, suppressed only if this node's own name came from content.
  const start = walk.out.length;
  walkChildren(el, walk, consumesText);
  flushText(walk);
  const rules = walk.ctx.rules;
  // Chrome (row 9): an svg root with nothing readable inside is an image.
  if (rules.svgImageWhenNoContent && isImplicitSvgRoot(el, role) && walk.out.length === start) node.role = "img";
  // Chrome (row 7) names a term from its content and still reads that content. The name is the
  // text read inside it, which is what Chrome's name from content gives for the usual `<dt>`. A
  // term inside an ancestor named from content reads no text of its own, so it stays unnamed.
  if (rules.termNamedFromContent && role === "term" && node.name === "") {
    node.name = collapseWhitespace(walk.out.slice(start).map((n) => n.name).join(" "));
  }
}

/**
 * True when a transparent element starts a new line: its computed display is block-level, or it
 * is a flex or grid item. When the display cannot be read (or a test DOM leaves it empty), the
 * tag decides, as before.
 */
function endsLine(el: Element, tag: string, walk: Walk): boolean {
  // An SVG text element is a block of text (SVG-AAM maps it like a paragraph); Chrome gives it
  // display block, a test DOM may not.
  if (el.namespaceURI === SVG_NS && tag === "text") return true;
  const display = walk.ctx.styleOf(el)?.display ?? "";
  if (display === "contents") return false;
  if (BLOCK_DISPLAYS.has(display)) return true;
  if (BLOCKIFYING_DISPLAYS.has(layoutParentDisplay(el, walk))) return true;
  return display ? false : BLOCK_TAGS.has(tag);
}

/** The display of the element's layout parent: the composed parent, skipping `display: contents`. */
function layoutParentDisplay(el: Element, walk: Walk): string {
  for (let p = walk.ctx.parentOf(el); p; p = walk.ctx.parentOf(p)) {
    const display = walk.ctx.styleOf(p)?.display ?? "";
    if (display !== "contents") return display;
  }
  return "";
}

/**
 * A frame is a `document` node named from the iframe, then the frame document's content. The
 * node and everything inside carry the frame's index; a frame the page cannot read (cross-origin)
 * is flagged `unreachable` and has nothing inside. A frame that has not loaded yet has an empty
 * document and reads as an empty frame. The frame's URL is never recorded.
 */
function emitFrame(iframe: Element, role: string, walk: Walk, live: LiveRegion | undefined): void {
  flushText(walk);
  const outer = walk.frame;
  walk.frame = ++walk.frames;
  const node = buildNode(iframe, role, "iframe", walk, live);
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
  const parent = el.tagName.toLowerCase() === "slot" ? walk.ctx.parentOf(el) : el;
  for (const child of composedChildren(el, walk.options)) {
    if (child.nodeType === TEXT_NODE) {
      if (!textConsumed) appendText(walk, child.textContent ?? "", el);
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
  if (walk.mm) noteRun(walk.mm, walk.out.length - 1);
}

/** Add a piece of text to the pending run; `holder` is the element whose child it is. */
function appendText(walk: Walk, text: string, holder: Element): void {
  const mm = walk.mm;
  if (mm && /\S/.test(text)) {
    if (!/\S/.test(walk.pending)) {
      mm.runStart = mm.text + 1;
      mm.holder = holder;
    }
    mm.text++;
  }
  walk.pending += text;
}

/** True when the element's root is a shadow root rather than a document. */
function inShadowTree(el: Element): boolean {
  const root = el.getRootNode();
  return root.nodeType === DOCUMENT_FRAGMENT_NODE && "host" in root;
}

function buildNode(el: Element, role: string, tag: string, walk: Walk, live?: LiveRegion): InterpretationNode {
  // ARIA prohibits naming some roles (caption, paragraph, ...): the node carries no name and its
  // text reads as content instead. In Chrome mode a table row outside a grid is named by its
  // author or not at all (row 3). A form field with no other name source takes its title, then
  // (a text field) its placeholder, as HTML-AAM 4.1 says; the name library stops at an associated
  // label even when it is empty. Chrome (row 5) leaves a field whose labels are all empty unnamed.
  const { ctx } = walk;
  const authorOnlyRow = role === "row" && ctx.rules.rowNamedByAuthorOnly && !hasAuthorName(el) && !rowInGrid(el, ctx);
  let name = isNameProhibited(role) || authorOnlyRow ? "" : accessibleName(el, ctx);
  const field = isFormField(el, tag);
  if (field && ctx.rules.emptyLabelHasNoName && hasOnlyEmptyLabels(el, ctx)) {
    name = "";
  } else {
    if (name === "" && field) name = collapseWhitespace(el.getAttribute("title") ?? "");
    if (name === "" && (tag === "input" || tag === "textarea")) {
      name = collapseWhitespace(el.getAttribute("placeholder") ?? "");
    }
  }
  // HTML-AAM still names a table from its obsolete summary attribute, and so does Chrome.
  if (name === "" && tag === "table") name = collapseWhitespace(el.getAttribute("summary") ?? "");
  // SVG-AAM 7.1 names any SVG element from its first title child; the name library does this for
  // the svg element only. Chrome agrees.
  if (name === "" && el.namespaceURI === SVG_NS) name = svgTitle(el);
  const node: InterpretationNode = { role, name, ref: refOf(el, tag, walk) };
  const level = headingLevel(el, role);
  if (level !== undefined) node.level = level;
  const flags = computeFlags(el, role, tag, name);
  if (flags) node.flags = flags;
  if (live) node.live = live;
  return node;
}

/** A pointer back to an element: its tag, and whether it sits in a shadow tree or a frame. */
function refOf(el: Element, tag: string, walk: Walk): Ref {
  const ref: Ref = { tag };
  if (inShadowTree(el)) ref.shadow = true;
  if (walk.frame !== undefined) ref.frame = walk.frame;
  return ref;
}

/** The text of an SVG element's first `title` child, collapsed, or "". */
function svgTitle(el: Element): string {
  for (const child of Array.from(el.children)) {
    if (child.namespaceURI === SVG_NS && child.tagName.toLowerCase() === "title") {
      return collapseWhitespace(child.textContent ?? "");
    }
  }
  return "";
}

/** An input that is not a button or hidden, a select, or a textarea. */
function isFormField(el: Element, tag: string): boolean {
  if (tag === "select" || tag === "textarea") return true;
  if (tag !== "input") return false;
  const type = (el.getAttribute("type") ?? "text").toLowerCase();
  return !["hidden", "button", "submit", "reset", "image"].includes(type);
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

// ---- Mismatch heuristics on the walk (SPEC-005) -------------------------------------------

/**
 * On entering an element: decide the mismatches known before its content is walked (table,
 * click), whether it may carry a heading line, and open the ancestor counters its role sets.
 */
function enterElement(el: Element, tag: string, role: string | null, live: LiveRegion | undefined, walk: Walk): Entry {
  const mm = walk.mm!;
  const { ctx } = walk;
  const entry: Entry = {
    el,
    seq: ++mm.seq,
    ref: refOf(el, tag, walk),
    len: walk.out.length,
    pendingBefore: /\S/.test(walk.pending),
    text: mm.text,
    marks: [],
    heading: false,
    liveNode: hasNoRoleOfItsOwn(role) && !!live,
    counted: { noHeading: false, inTable: false, inWidget: false },
  };
  // A <table> is a real table in either mode, even one Chrome mode reads as layout (SPEC-005
  // backfill from SPEC-006, point 4); a paragraph has a role that a grid container never has.
  const tableCandidate = (role === null || role === "generic" || role === "none" || role === "presentation") && tag !== "table";
  if (tableCandidate && mm.inTable === 0) {
    const signals = tableSignals(el, ctx, (e) => visibleChildren(e, walk));
    if (signals.length > 0) entry.marks.push({ kind: "looks-like-table", signals });
  }
  if (mm.inWidget === 0) {
    const signals = clickSignals(el, tag, role, ctx);
    if (signals.length > 0) entry.marks.push({ kind: "clickable-not-button", signals });
  }
  const isTable = tag === "table" || role === "table" || role === "grid" || role === "treegrid";
  entry.counted.inTable = isTable || entry.marks.some((m) => m.kind === "looks-like-table");
  entry.counted.inWidget = isWidget(role);
  entry.counted.noHeading =
    (role !== null && !hasNoRoleOfItsOwn(role) && takesNameFromContent(role, ctx.rules)) ||
    HEADING_EXCLUDED_TAGS.has(tag) ||
    entry.marks.length > 0;
  if (entry.counted.inTable) mm.inTable++;
  if (entry.counted.inWidget) mm.inWidget++;
  if (entry.counted.noHeading) mm.noHeading++;
  // A live region with no role of its own still carries its line: a status message styled as a
  // heading is a mismatch worth seeing (SPEC-005 §5).
  entry.heading = hasNoRoleOfItsOwn(role) && mm.noHeading === 0;
  return entry;
}

/**
 * On leaving an element: its range in the reading order (AC-2), its mismatches, and whether its
 * text is exactly one run. `at` skips a run flushed at the element's edge that holds only text
 * from before it; `end` counts a pending run that holds some of the element's text.
 */
function leaveElement(entry: Entry, walk: Walk): void {
  const mm = walk.mm!;
  let at = entry.len;
  const first = mm.runs.get(entry.len);
  if (entry.pendingBefore && first && first.end === entry.text) at++;
  const pendingOwn = /\S/.test(walk.pending) && (walk.out.length > entry.len || mm.text > entry.text);
  const end = Math.max(at, walk.out.length + (pendingOwn ? 1 : 0));
  for (const { kind, signals } of entry.marks) {
    mm.found.push({ seq: entry.seq, mismatch: { kind, at, end, ref: entry.ref, signals } });
  }
  // The line is the element's only text run; a live region's own node comes before it.
  const line = entry.liveNode ? at + 1 : at;
  if (entry.heading && end - line === 1) {
    if (line < walk.out.length) {
      const run = mm.runs.get(line);
      if (run && run.start > entry.text && run.end === mm.text) {
        mm.lines.push({ index: line, el: entry.el, seq: entry.seq, ref: entry.ref });
      }
    } else if (mm.runStart > entry.text) {
      mm.deferred.push({ el: entry.el, seq: entry.seq, ref: entry.ref, text: mm.text });
    }
  }
  if (entry.counted.inTable) mm.inTable--;
  if (entry.counted.inWidget) mm.inWidget--;
  if (entry.counted.noHeading) mm.noHeading--;
}

/** Record an emitted run, and settle the heading candidates waiting on it. */
function noteRun(mm: MismatchWalk, index: number): void {
  mm.runs.set(index, { start: mm.runStart, end: mm.text, holder: mm.holder });
  for (const c of mm.deferred) {
    if (c.text === mm.text) mm.lines.push({ index, el: c.el, seq: c.seq, ref: c.ref });
  }
  mm.deferred = [];
}

/** A field node just emitted: record it when it has no label (AC-14, AC-15). */
function noteField(el: Element, tag: string, role: string, node: InterpretationNode, walk: Walk): void {
  if (!isField(el, tag, role)) return;
  const signal = fieldSignal(el, node.name, walk.ctx);
  if (!signal) return;
  const mm = walk.mm!;
  mm.fields.push({
    index: walk.out.length - 1,
    el,
    seq: mm.seq,
    ref: node.ref ?? { tag },
    signal,
    toggle: TOGGLE_ROLES.has(role),
  });
}

/** The element children a screen reader sees under an element, hidden ones left out. */
function visibleChildren(el: Element, walk: Walk): Element[] {
  return composedChildren(el, walk.options).filter(
    (c): c is Element => c.nodeType === ELEMENT_NODE && !isHiddenFromAT(c as Element, walk.options),
  );
}

/**
 * After the walk: decide the heading lines, which need the next node (AC-8), add `nearby-text`
 * to the fields, and order everything by `at`, outer element first (AC-3).
 */
function finishMismatches(walk: Walk): Mismatch[] {
  const mm = walk.mm!;
  const { ctx, out } = walk;
  const byIndex = new Map<number, Array<MismatchWalk["lines"][number]>>();
  for (const line of mm.lines) byIndex.set(line.index, [...(byIndex.get(line.index) ?? []), line]);
  for (const [index, chain] of byIndex) {
    // The innermost element of the chain holds the text's style; the outermost is reported.
    const inner = chain[0]!;
    const outer = chain[chain.length - 1]!;
    const parent = ctx.parentOf(outer.el);
    // The bold rule wants the next text in a new block, not after a `<br>` (SPEC-005 AC-8).
    const nextRun = out[index + 1]?.role === "text" && !mm.brEnded.has(index) ? mm.runs.get(index + 1) : undefined;
    const next = nextRun
      ? { text: out[index + 1]!.name, style: nextRun.holder ? ctx.styleOf(nextRun.holder) : null }
      : undefined;
    const signals = headingSignals(out[index]!.name, ctx.styleOf(inner.el), parent ? ctx.styleOf(parent) : null, next);
    if (signals.length > 0) {
      mm.found.push({ seq: outer.seq, mismatch: { kind: "looks-like-heading", at: index, end: index + 1, ref: outer.ref, signals } });
    }
  }
  for (const field of mm.fields) {
    const signals: MismatchSignal[] = [field.signal];
    if (hasNearbyText(field, walk)) signals.push("nearby-text");
    mm.found.push({
      seq: field.seq,
      mismatch: { kind: "field-without-label", at: field.index, end: field.index + 1, ref: field.ref, signals },
    });
  }
  return mm.found
    .sort((a, b) => a.mismatch.at - b.mismatch.at || a.seq - b.seq)
    .map(({ mismatch }) => ({ ...mismatch, signals: orderSignals(mismatch.signals) }));
}

/**
 * The text run just before the field (just after a checkbox, radio, or switch) is 60 characters
 * or fewer and comes from the field's parent or a sibling, and not from a `<label>` that labels
 * another control (AC-14; SPEC-005 backfill from SPEC-006, point 6).
 */
function hasNearbyText(field: MismatchWalk["fields"][number], walk: Walk): boolean {
  const index = field.toggle ? field.index + 1 : field.index - 1;
  const node = walk.out[index];
  if (!node || node.role !== "text" || node.name.length > 60) return false;
  const holder = walk.mm!.runs.get(index)?.holder;
  const parent = walk.ctx.parentOf(field.el);
  if (!holder || !parent) return false;
  for (let e: Element | null = holder; e; e = walk.ctx.parentOf(e)) {
    if (e.tagName.toLowerCase() === "label") {
      const control = labelledControl(e);
      if (control && control !== field.el) return false;
    }
    if (e === parent) return true;
  }
  return false;
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
