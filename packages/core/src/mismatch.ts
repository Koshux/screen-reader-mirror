/**
 * Visual-versus-semantic mismatch heuristics (SPEC-005). Each one compares what the page shows
 * (markup and computed style) with what the tree says, and returns the signals that fired. These
 * are guesses: each heuristic's signal, threshold, and false positives are documented in the spec
 * and the README. The walk in `linearize.ts` decides where each one runs and where its result
 * sits in the reading order; the functions here only read the element in front of them.
 *
 * Every style value comes through `ctx.styleOf`, which in `interpret()` is a per-call cache over
 * the caller's `getComputedStyle` option (AC-5). A style that cannot be read fires no style-based
 * signal. Every role comes from `resolveRole` in the chosen browser mode.
 */
import type { MismatchSignal } from "./types";
import { isHiddenFromAT } from "./visibility";
import { resolveRole, isWidget, hasLabelWithText, cellPresentation, type RoleContext } from "./roles";

/** The order signals are listed in, as SPEC-005 §3 gives them. */
const SIGNAL_ORDER: readonly MismatchSignal[] = [
  "font-size", "font-weight",
  "grid-layout", "row-layout", "table-layout",
  "rows", "cell-borders", "cell-backgrounds", "header-row",
  "click-attribute", "tabindex", "cursor-pointer",
  "no-name", "title", "placeholder", "nearby-text",
];

export function orderSignals(signals: readonly MismatchSignal[]): MismatchSignal[] {
  return SIGNAL_ORDER.filter((s) => signals.includes(s));
}

// Roles that are not a role of the element's own: it reads as its content.
const NO_OWN_ROLES = new Set(["generic", "none", "presentation", "paragraph"]);

/** True for no role, generic, none, presentation, or paragraph. */
export function hasNoRoleOfItsOwn(role: string | null): boolean {
  return role === null || NO_OWN_ROLES.has(role);
}

// ---- Heuristic 1: looks like a heading -----------------------------------------------------

/** Elements whose text is a label or caption for something else: never a fake heading (AC-9). */
export const HEADING_EXCLUDED_TAGS = new Set(["label", "legend", "caption", "figcaption", "dt", "summary"]);

/**
 * The heading signals for one whole line of text: its style (from the innermost element of the
 * chain that holds it), its parent's style, and the next node when that is a text run (AC-6 to
 * AC-9). The thresholds follow axe-core's p-as-heading as prior art, compared with the parent.
 */
export function headingSignals(
  text: string,
  style: CSSStyleDeclaration | null,
  parentStyle: CSSStyleDeclaration | null,
  next: { text: string; style: CSSStyleDeclaration | null } | undefined,
): MismatchSignal[] {
  if (text.length > 80 || !/\p{L}/u.test(text)) return [];
  if (!style || !parentStyle) return [];
  const ratio = px(style.fontSize) / px(parentStyle.fontSize);
  const boldOverPlain = isBold(style) && !isBold(parentStyle);
  if (ratio >= 1.25) return boldOverPlain ? ["font-size", "font-weight"] : ["font-size"];
  if (ratio >= 1.1 && boldOverPlain) return ["font-size", "font-weight"];
  if (
    boldOverPlain &&
    !/[.:]$/.test(text) &&
    next?.style &&
    !isBold(next.style) &&
    next.text.length >= 2 * text.length
  ) {
    return ["font-weight"];
  }
  return [];
}

function px(value: string | undefined): number {
  const match = /^\s*([\d.]+)px\s*$/.exec(value ?? "");
  return match ? parseFloat(match[1]!) : NaN;
}

/** A computed weight of 600 or more; `bold` counts as 700 and `normal` (or unset) as 400. */
function isBold(style: CSSStyleDeclaration): boolean {
  const weight = (style.fontWeight ?? "").trim().toLowerCase();
  if (weight === "bold" || weight === "bolder") return true;
  const n = Number(weight);
  return weight !== "" && Number.isFinite(n) && n >= 600;
}

// ---- Heuristic 2: looks like a table -------------------------------------------------------

const ROW_DISPLAYS = new Set(["flex", "inline-flex", "grid", "table-row"]);

/**
 * The table signals for an element with no role of its own (AC-10, AC-11): its visible children
 * laid out as a grid of at least 2 by 2 text cells, with 20 rows or more or the presentation
 * Chrome looks for in a data table, or a bold header row. The layout signal comes first. Empty
 * when the layout, the cells, or the presentation does not qualify.
 */
export function tableSignals(
  el: Element,
  ctx: RoleContext,
  childrenOf: (el: Element) => Element[],
): MismatchSignal[] {
  const style = ctx.styleOf(el);
  if (!style) return [];
  const grid = layoutOf(el, style, ctx, childrenOf);
  if (!grid) return [];
  const { layout, rows } = grid;
  const cols = Math.max(0, ...rows.map((r) => r.length));
  if (rows.length < 2 || cols < 2) return [];
  const cells = rows.flat();
  if (!cells.every((cell) => isTextCell(cell, ctx))) return [];
  const signals: MismatchSignal[] = [];
  if (rows.length >= 20) signals.push("rows");
  const { bordered, tinted } = cellPresentation(cells, el, ctx.styleOf);
  if (bordered * 2 >= cells.length) signals.push("cell-borders");
  if (tinted > 0) signals.push("cell-backgrounds");
  if (hasHeaderRow(rows, ctx)) signals.push("header-row");
  return signals.length > 0 ? [layout, ...signals] : [];
}

function layoutOf(
  el: Element,
  style: CSSStyleDeclaration,
  ctx: RoleContext,
  childrenOf: (el: Element) => Element[],
): { layout: MismatchSignal; rows: Element[][] } | null {
  const display = style.display ?? "";
  if (display === "grid" || display === "inline-grid") {
    const cols = trackCount(style.gridTemplateColumns ?? "");
    if (!(cols >= 2)) return null;
    const children = childrenOf(el);
    const rows: Element[][] = [];
    for (let i = 0; i < children.length; i += cols) rows.push(children.slice(i, i + cols));
    return { layout: "grid-layout", rows };
  }
  if (display === "table" || display === "inline-table") {
    const rows = childrenOf(el)
      .filter((child) => ctx.styleOf(child)?.display === "table-row")
      .map((row) => childrenOf(row));
    return { layout: "table-layout", rows };
  }
  const children = childrenOf(el);
  if (children.length < 2) return null;
  if (!children.every((child) => ROW_DISPLAYS.has(ctx.styleOf(child)?.display ?? ""))) return null;
  const rows = children.map((row) => childrenOf(row));
  if (!rows.every((row) => row.length === rows[0]!.length)) return null;
  return { layout: "row-layout", rows };
}

/**
 * The number of column tracks in a computed `grid-template-columns`: a resolved list
 * ("120px 120px 120px"), or `repeat(n, tracks)` with an integer n. NaN when it cannot be counted,
 * as with an unresolved `auto-fill` or `auto-fit`. Line names (`[a]`) are not tracks.
 */
function trackCount(value: string): number {
  let count = 0;
  for (const token of topLevelTokens(value.trim())) {
    if (token.startsWith("[")) continue;
    const repeat = /^repeat\((.*)\)$/i.exec(token);
    if (!repeat) {
      if (token !== "none") count++;
      continue;
    }
    const inner = repeat[1]!;
    const comma = inner.indexOf(",");
    const n = Number(inner.slice(0, comma).trim());
    if (comma < 0 || !Number.isInteger(n) || n < 1) return NaN;
    count += n * trackCount(inner.slice(comma + 1));
  }
  return count;
}

/** Split on whitespace outside parentheses and brackets. */
function topLevelTokens(value: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (current) tokens.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current) tokens.push(current);
  return tokens;
}

/** A cell that holds text and no element with a role other than link (AC-10, AC-11). */
function isTextCell(cell: Element, ctx: RoleContext): boolean {
  if ((cell.textContent ?? "").trim() === "") return false;
  for (const el of [cell, ...Array.from(cell.querySelectorAll("*"))]) {
    const role = resolveRole(el, ctx);
    if (!hasNoRoleOfItsOwn(role) && role !== "link") return false;
  }
  return true;
}

/** Every cell of the first row bold, and no cell of the other rows. */
function hasHeaderRow(rows: Element[][], ctx: RoleContext): boolean {
  const bold = (cell: Element): boolean | null => {
    const style = ctx.styleOf(cell);
    return style ? isBold(style) : null;
  };
  const [head, ...rest] = rows;
  return !!head && head.every((c) => bold(c) === true) && rest.every((row) => row.every((c) => bold(c) === false));
}

// ---- Heuristic 3: clickable, not a button or link ------------------------------------------

const CLICK_ATTRIBUTES = ["onclick", "onmousedown", "onmouseup", "onpointerdown", "onpointerup"];
// Elements that are clickable by design without being a button (AC-13).
const CLICK_EXCLUDED_TAGS = new Set(["label", "summary", "option", "iframe", "video", "audio", "body", "html"]);

/**
 * The click signals for an element with no role of its own or the role `img` (AC-12, AC-13): a
 * click attribute, a `tabindex` of 0 or more, a pointer cursor its parent does not have. Empty
 * when the element is excluded, when `tabindex` is the only signal on a scrolling element, or
 * when it contains a widget. The caller rules out elements inside a widget.
 */
export function clickSignals(el: Element, tag: string, role: string | null, ctx: RoleContext): MismatchSignal[] {
  if (!(hasNoRoleOfItsOwn(role) || role === "img") || CLICK_EXCLUDED_TAGS.has(tag)) return [];
  const signals: MismatchSignal[] = [];
  if (CLICK_ATTRIBUTES.some((a) => el.hasAttribute(a))) signals.push("click-attribute");
  const tabindex = el.getAttribute("tabindex");
  if (tabindex !== null && /^\s*\+?\d+\s*$/.test(tabindex)) signals.push("tabindex");
  const style = ctx.styleOf(el);
  if (style?.cursor === "pointer") {
    const parent = ctx.parentOf(el);
    const parentStyle = parent ? ctx.styleOf(parent) : null;
    if (parentStyle && parentStyle.cursor !== "pointer") signals.push("cursor-pointer");
  }
  if (signals.length === 1 && signals[0] === "tabindex" && style && scrolls(style)) return [];
  if (signals.length > 0 && containsWidget(el, ctx)) return [];
  return signals;
}

function scrolls(style: CSSStyleDeclaration): boolean {
  return [style.overflow, style.overflowX, style.overflowY].some((v) => /\b(auto|scroll)\b/.test(v ?? ""));
}

/** A widget inside the element, which a keyboard user can reach instead (AC-13). */
function containsWidget(el: Element, ctx: RoleContext): boolean {
  return Array.from(el.querySelectorAll("*")).some(
    (d) => isWidget(resolveRole(d, ctx)) && !isHiddenFromAT(d, { getComputedStyle: ctx.styleOf }),
  );
}

// ---- Heuristic 4: field without a label ----------------------------------------------------

const FIELD_ROLES = new Set([
  "textbox", "searchbox", "combobox", "listbox", "spinbutton", "slider", "checkbox", "radio", "switch",
]);
const NOT_FIELD_INPUTS = new Set(["hidden", "button", "submit", "reset", "image", "file"]);
/** Fields whose visual label sits after them. */
export const TOGGLE_ROLES = new Set(["checkbox", "radio", "switch"]);

/** A form field as SPEC-005 §3 defines it. */
export function isField(el: Element, tag: string, role: string | null): boolean {
  if (tag === "input") return !NOT_FIELD_INPUTS.has((el.getAttribute("type") ?? "text").trim().toLowerCase());
  if (tag === "select" || tag === "textarea") return true;
  return role !== null && FIELD_ROLES.has(role);
}

/**
 * For a field with no label (AC-14, AC-15), what names it instead: `no-name`, `title`, or
 * `placeholder`, read from the name the walk already computed in the chosen mode. Null when the
 * field has a label: an associated `<label>` with text, a non-empty `aria-label`, or an
 * `aria-labelledby` that resolves to text. Also null when the name has another source (a
 * `role="checkbox"` named from its content), which is not a missing label.
 */
export function fieldSignal(el: Element, name: string, ctx: RoleContext): MismatchSignal | null {
  if ((el.getAttribute("aria-label") ?? "").trim() !== "") return null;
  if (labelledbyHasText(el) || hasLabelWithText(el, ctx)) return null;
  if (name === "") return "no-name";
  if (name === collapse(el.getAttribute("title") ?? "")) return "title";
  if (name === collapse(el.getAttribute("placeholder") ?? "")) return "placeholder";
  return null;
}

/**
 * True when `aria-labelledby` points at an element in the field's tree that has text or an
 * `aria-label`. A presence check, not a name: the name itself comes from the name library.
 */
function labelledbyHasText(el: Element): boolean {
  const root = el.getRootNode() as Partial<Pick<Document, "getElementById">>;
  if (typeof root.getElementById !== "function") return false;
  const ids = (el.getAttribute("aria-labelledby") ?? "").trim().split(/\s+/).filter(Boolean);
  return ids.some((id) => {
    const target = root.getElementById!(id);
    return !!target && ((target.textContent ?? "").trim() !== "" || (target.getAttribute("aria-label") ?? "").trim() !== "");
  });
}

function collapse(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
