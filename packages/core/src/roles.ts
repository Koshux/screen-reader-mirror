import { roles } from "aria-query";
import { computeAccessibleName } from "dom-accessibility-api";
import { firstSummaryOf, isHiddenFromAT, resolveStyle } from "./visibility";
import { rulesFor, type BrowserRules } from "./browser";

/**
 * Role resolution for the interpretation (SPEC-001 §3).
 *
 * `dom-accessibility-api` computes the *name*, not the role. `aria-query` gives role *definitions*
 * (used here for the name-from-content, children-presentational, abstract and widget
 * determinations), but the implicit role of an HTML element is **conditional** — so the tag→role
 * mapping below applies those conditions (e.g. `<a>` is a link only with `href`, `<li>` is a
 * `listitem` only inside a list, `<section>` is a `region` only when named, `<header>` is a
 * `banner` only when scoped to the body) rather than a naive lookup. This is a **curated** resolver
 * covering the elements the engine exercises today; broadening it to the full HTML-AAM mapping
 * (and using `Element.getComputedRole()` as a host oracle) is a tracked follow-up.
 */

type RoleDef = {
  abstract?: boolean;
  childrenPresentational?: boolean;
  nameFrom?: readonly string[];
  superClass?: ReadonlyArray<readonly string[]>;
};
const roleMap = roles as unknown as { get(key: string): RoleDef | undefined };

/**
 * Where `aria-query` (5.x) still carries ARIA 1.1 data, ARIA 1.2 wins. `rowgroup` is
 * "Name From: author" in ARIA 1.2; with the 1.1 value, bare text directly inside a
 * `role="rowgroup"` container would be wrongly suppressed as "already in the name".
 */
const NAME_FROM_CONTENT_OVERRIDES: Readonly<Record<string, boolean>> = { rowgroup: false };

const PRESENTATIONAL = new Set(["presentation", "none"]);

/**
 * How role rules find an element's parent. The linearizer passes the parent it met in the
 * composed tree, so a slotted `<li>` sees the shadow `<ul>` around its slot (SPEC-003).
 */
export type ParentOf = (el: Element) => Element | null;

/**
 * How role rules read computed style (the layout-table rules). The linearizer passes one that
 * honours its `getComputedStyle` option; the default reads the element's own window.
 */
export type StyleOf = (el: Element) => CSSStyleDeclaration | null;

const ownStyle: StyleOf = (el) => resolveStyle(el, {});

/**
 * What role and name rules read, built once per call (SPEC-006 AC-5): the composed parent, the
 * style source, and the browser rules. One value, so no rule can be dropped on one call path.
 * `grids` caches the table model per table for the length of one call.
 */
export interface RoleContext {
  parentOf: ParentOf;
  styleOf: StyleOf;
  rules: BrowserRules;
  grids?: WeakMap<Element, TableGrid>;
}

/** The context when nothing better is known: the DOM parent, the element's own window, W3C rules. */
export const defaultContext: RoleContext = { parentOf: composedParent, styleOf: ownStyle, rules: rulesFor(undefined) };

const SVG_NS = "http://www.w3.org/2000/svg";

// ARIA 1.3 roles that Chrome exposes and aria-query 5.x does not know yet.
const ARIA_1_3_ROLES = new Set(["sectionheader", "sectionfooter"]);

/**
 * The parent in the composed tree when nothing better is known: the parent element, or the host
 * for a node at the top of a shadow root. A slotted element's slot is not known here.
 */
export function composedParent(el: Element): Element | null {
  if (el.parentElement) return el.parentElement;
  const root = el.getRootNode() as Node & { host?: Element };
  return root !== el && root.host ? root.host : null;
}

/**
 * Resolve an element's role: explicit `role` wins; else the conditional implicit role; else null
 * (generic / no role).
 *
 * WAI-ARIA 1.2 role-attribute processing: the value is a space-separated list of fallback tokens
 * and the user agent uses the **first token that names a non-abstract role** — so `role="foo
 * button"` is a button, and an abstract role like `role="widget"` is ignored.
 */
export function resolveRole(el: Element, ctx: RoleContext = defaultContext): string | null {
  const explicit = el.getAttribute("role");
  if (explicit) {
    for (const token of explicit.trim().toLowerCase().split(/\s+/)) {
      if (ARIA_1_3_ROLES.has(token)) return token;
      const def = roleMap.get(token);
      if (!def || def.abstract) continue;
      // ARIA 1.2 presentation-role conflict resolution: a focusable element, or one carrying a
      // global ARIA attribute, ignores `presentation`/`none` and keeps its implicit role.
      if (PRESENTATIONAL.has(token) && presentationIsOverridden(el)) return implicitRole(el, ctx);
      return token;
    }
  }
  return implicitRole(el, ctx);
}

function implicitRole(el: Element, ctx: RoleContext): string | null {
  const tag = el.tagName.toLowerCase();
  if (el.namespaceURI === SVG_NS) return svgRole(el, tag, ctx);
  switch (tag) {
    case "a":
    case "area":
      return el.hasAttribute("href") ? "link" : null; // generic without href
    case "button":
      return "button";
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return "heading";
    case "nav":
      return "navigation";
    case "main":
      return "main";
    case "header":
      // HTML-AAM: banner when scoped to the body; inside main or sectioning content it is the
      // ARIA 1.3 sectionheader, which Chrome exposes. A sectioning root (dialog, figure, td, ...)
      // does not change the scope.
      return scopeOf(el, ctx) === "body" ? "banner" : "sectionheader";
    case "footer":
      return scopeOf(el, ctx) === "body" ? "contentinfo" : "sectionfooter";
    case "aside":
      // ARIA in HTML: complementary when scoped to body or main; inside sectioning content or a
      // sectioning root only when it has an accessible name, else generic.
      return scopeOf(el, ctx) !== "sectioning" || hasAccessibleName(el, ctx) ? "complementary" : null;
    case "ul":
    case "ol":
    case "menu":
      return "list";
    case "details":
      return "group"; // HTML-AAM
    case "summary": {
      // HTML-AAM: only the first <summary> of a <details> is the disclosure control; platforms expose
      // it as a button (with an expanded state), which is what screen readers announce. Any other
      // <summary> is generic.
      const parent = el.parentElement;
      if (!parent || parent.tagName.toLowerCase() !== "details") return null;
      return firstSummaryOf(parent) === el ? "button" : null;
    }
    case "caption":
      return "caption"; // HTML-AAM; ARIA 1.2 prohibits naming it, its text reads as content
    case "option":
      return "option"; // reached only inside a list box (a collapsed <select> is a leaf)
    case "optgroup":
      return "group"; // HTML-AAM; named by its label attribute
    case "li": {
      // HTML-AAM / ARIA in HTML: `listitem` only as the child of an element exposed as a list
      // (`<ul>`/`<ol>`/`<menu>` or `role="list"`); an orphan `<li>` is generic. Going through
      // `resolveRole` on the parent also honours `<ul role="presentation">` (ARIA presentation
      // inheritance for required owned elements). The parent is the composed one: an `<li>`
      // slotted into a shadow `<ul>` is a listitem, as Chrome reports.
      const parent = ctx.parentOf(el);
      return parent && resolveRole(parent, ctx) === "list" ? "listitem" : null;
    }
    case "p":
      return "paragraph";
    case "img":
      // alt="" = decorative (presentation) — unless focusable / global ARIA re-exposes it.
      return el.getAttribute("alt") === "" && !presentationIsOverridden(el) ? "presentation" : "img";
    case "input":
      return inputRole(el);
    case "textarea":
      return "textbox";
    case "select":
      return el.hasAttribute("multiple") || numericSize(el) > 1 ? "listbox" : "combobox";
    case "table":
      // HTML-AAM maps every table to `table`. Chrome treats a table that is not a data table by
      // its rules (isLayoutTable) as layout, with no table roles (row 1).
      return ctx.rules.layoutTables && isLayoutTable(el, ctx.styleOf) ? null : "table";
    case "thead":
    case "tfoot":
      return tableIsPresentational(el, ctx) ? null : "rowgroup";
    case "tbody":
      // HTML-AAM: rowgroup. Chrome does not expose it; its rows hang off the table (row 2).
      return ctx.rules.hideTbody || tableIsPresentational(el, ctx) ? null : "rowgroup";
    case "tr":
      return tableIsPresentational(el, ctx) ? null : "row";
    case "td": {
      const table = ancestorTableRole(el, ctx);
      if (table === null || PRESENTATIONAL.has(table)) return null; // layout or presentational table
      return table === "grid" || table === "treegrid" ? "gridcell" : "cell"; // HTML-AAM
    }
    case "th":
      return tableIsPresentational(el, ctx) ? null : headerCellRole(el, ctx);
    case "article":
      return "article";
    case "section":
      // ARIA in HTML: `region` only with an accessible name, otherwise generic.
      return hasAccessibleName(el, ctx) ? "region" : null;
    case "form":
      // Chrome exposes every <form> with role form. Screen readers list it as a landmark only when
      // it has a name; the mirror follows the tree and leaves landmark policy to the profiles.
      return "form";
    case "fieldset":
      return "group";
    case "blockquote":
      return "blockquote"; // ARIA 1.2 role; Chrome exposes it
    case "dt":
      return "term"; // HTML-AAM and Chrome; the <dl> itself has no ARIA role
    case "dd":
      return "definition";
    case "figure":
      return "figure";
    case "dialog":
      return "dialog";
    case "hr":
      return "separator";
    case "progress":
      return "progressbar"; // HTML-AAM; a leaf, named by the author
    case "meter":
      return "meter";
    case "output":
      return "status"; // HTML-AAM; Chrome exposes it as a polite, atomic live region (SPEC-004)
    case "iframe":
      return "document"; // the embedded document; Chrome exposes it as an Iframe node (SPEC-003)
    default:
      return null; // generic / no implicit role
  }
}

function inputRole(el: Element): string | null {
  const type = (el.getAttribute("type") ?? "text").toLowerCase();
  switch (type) {
    case "button":
    case "submit":
    case "reset":
    case "image":
    case "file": // HTML-AAM: no ARIA role; browsers expose the upload control as a button
      return "button";
    case "checkbox":
      return "checkbox";
    case "radio":
      return "radio";
    case "range":
      return "slider";
    case "number":
      return "spinbutton";
    case "search":
      return el.hasAttribute("list") ? "combobox" : "searchbox"; // HTML-AAM: datalist → combobox
    case "email":
    case "tel":
    case "url":
    case "text":
      return el.hasAttribute("list") ? "combobox" : "textbox";
    case "password": // no ARIA role *name*, but every platform exposes it as a (protected) textbox
      return "textbox";
    case "hidden":
      return null; // not in the accessibility tree at all
    default:
      return "textbox"; // date/time/color/month/week: HTML-AAM "no corresponding role" — approximation
  }
}

/** Global ARIA states/properties (ARIA 1.2 §6.5) — any of these re-exposes a presentational element. */
const GLOBAL_ARIA_ATTRIBUTES = [
  "aria-atomic",
  "aria-busy",
  "aria-controls",
  "aria-current",
  "aria-describedby",
  "aria-details",
  "aria-disabled",
  "aria-dropeffect",
  "aria-errormessage",
  "aria-flowto",
  "aria-grabbed",
  "aria-haspopup",
  "aria-hidden",
  "aria-invalid",
  "aria-keyshortcuts",
  "aria-label",
  "aria-labelledby",
  "aria-live",
  "aria-owns",
  "aria-relevant",
  "aria-roledescription",
];

function presentationIsOverridden(el: Element): boolean {
  return isFocusable(el) || GLOBAL_ARIA_ATTRIBUTES.some((a) => el.hasAttribute(a));
}

/** Host-language focusability (the cases that matter for conflict resolution, not a full tabbing model). */
function isFocusable(el: Element): boolean {
  if (el.hasAttribute("tabindex") || el.hasAttribute("contenteditable")) return true;
  const tag = el.tagName.toLowerCase();
  if ((tag === "a" || tag === "area") && el.hasAttribute("href")) return true;
  if (tag === "button" || tag === "select" || tag === "textarea") return !el.hasAttribute("disabled");
  if (tag === "input") {
    return !el.hasAttribute("disabled") && (el.getAttribute("type") ?? "").toLowerCase() !== "hidden";
  }
  return tag === "summary" || tag === "iframe";
}

/**
 * HTML-AAM for <th>: scope="row"/"rowgroup" is a rowheader, scope="col"/"colgroup" a
 * columnheader. Without a valid scope (HTML's auto state), HTML's table model decides: a column
 * header when no data cell shares its rows, else a row header when no data cell shares its
 * columns, else neither, which HTML-AAM maps to cell (gridcell in a grid). Chrome decides from the
 * neighbouring cells instead (row 10, `headerFromSiblings`).
 */
function headerCellRole(el: Element, ctx: RoleContext): string {
  const scope = el.getAttribute("scope")?.trim().toLowerCase();
  if (scope === "row" || scope === "rowgroup") return "rowheader";
  if (scope === "col" || scope === "colgroup") return "columnheader";
  if (ctx.rules.headerCellFromSiblings) return headerFromSiblings(el);
  const table = el.parentElement?.closest("table");
  const grid = table ? tableGrid(table, ctx) : undefined;
  const cell = grid?.cells.find((c) => c.el === el);
  if (!grid || !cell) return "columnheader";
  const overlaps = (a: number, aLen: number, b: number, bLen: number) => a < b + bLen && b < a + aLen;
  const data = grid.cells.filter((c) => c.el.tagName.toLowerCase() === "td");
  if (!data.some((c) => overlaps(c.y, c.h, cell.y, cell.h))) return "columnheader";
  if (!data.some((c) => overlaps(c.x, c.w, cell.x, cell.w))) return "rowheader";
  const tableRole = table ? resolveRole(table, ctx) : null;
  return tableRole === "grid" || tableRole === "treegrid" ? "gridcell" : "cell";
}

/**
 * Chromium's DecideRoleFromSiblings, as written in ax_node_object.cc: the only cell in its row, or
 * a header between two headers, is a column header; next to a non-empty data cell, or in a row
 * whose first, last, second, or second-to-last cell is a non-empty data cell, a row header;
 * otherwise a column header. The neighbours are sibling nodes, so a whitespace text node between
 * two cells counts as a neighbour that is neither.
 */
function headerFromSiblings(el: Element): string {
  const next = el.nextSibling;
  const previous = el.previousSibling;
  if (!next && !previous) return "columnheader";
  if (isTag(next, "th") && isTag(previous, "th")) return "columnheader";
  if (isNonEmptyDataCell(next) || isNonEmptyDataCell(previous)) return "rowheader";
  const row = el.parentElement;
  if (!row || row.tagName.toLowerCase() !== "tr") return "columnheader";
  const first = row.firstElementChild;
  const last = row.lastElementChild;
  if (isNonEmptyDataCell(first) || isNonEmptyDataCell(last)) return "rowheader";
  if (isNonEmptyDataCell(first?.nextElementSibling ?? null) || isNonEmptyDataCell(last?.previousElementSibling ?? null)) {
    return "rowheader";
  }
  return "columnheader";
}

function isTag(node: Node | null, tag: string): boolean {
  return node?.nodeType === 1 && (node as Element).tagName.toLowerCase() === tag;
}

function isNonEmptyDataCell(node: Node | null): boolean {
  return isTag(node, "td") && node!.hasChildNodes();
}

/** One cell of a table's grid: its element and the slots it covers. */
interface GridCell {
  el: Element;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A table's cells placed on slots by HTML's table model, for the header-cell rules. */
export interface TableGrid {
  cells: GridCell[];
}

/**
 * HTML's algorithm for forming a table, reduced to what the header-cell rules need: row groups in
 * tree order with `tfoot` last, each cell placed in the first free slot of its row and spanning
 * `colspan` columns and `rowspan` rows (`rowspan="0"` reaches the end of its row group). Rows that
 * are direct children of the table form their own groups. Cached per table for one call.
 */
function tableGrid(table: Element, ctx: RoleContext): TableGrid {
  const cached = ctx.grids?.get(table);
  if (cached) return cached;
  const groups: Element[][] = [];
  const footers: Element[][] = [];
  let loose: Element[] | null = null;
  for (const child of Array.from(table.children)) {
    const tag = child.tagName.toLowerCase();
    if (tag === "tr") {
      if (!loose) groups.push((loose = []));
      loose.push(child);
      continue;
    }
    loose = null;
    const rows = Array.from(child.children).filter((r) => r.tagName.toLowerCase() === "tr");
    if (tag === "thead" || tag === "tbody") groups.push(rows);
    else if (tag === "tfoot") footers.push(rows);
  }
  const cells: GridCell[] = [];
  const taken = new Set<string>();
  let top = 0;
  for (const rows of [...groups, ...footers]) {
    rows.forEach((row, i) => {
      const y = top + i;
      let x = 0;
      for (const el of Array.from(row.children)) {
        if (!/^t[dh]$/i.test(el.tagName)) continue;
        while (taken.has(`${x},${y}`)) x++;
        const w = clampSpan(el.getAttribute("colspan"), 1, 1000, 1);
        const rowspan = clampSpan(el.getAttribute("rowspan"), 0, 65534, 1);
        const h = rowspan === 0 ? rows.length - i : rowspan;
        for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) taken.add(`${x + dx},${y + dy}`);
        cells.push({ el, x, y, w, h });
        x += w;
      }
    });
    top += rows.length;
  }
  const grid = { cells };
  ctx.grids?.set(table, grid);
  return grid;
}

function clampSpan(value: string | null, min: number, max: number, fallback: number): number {
  const n = value === null ? NaN : parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Resolved role of the closest ancestor `<table>`, or null when there is none. */
function ancestorTableRole(el: Element, ctx: RoleContext): string | null {
  const table = el.parentElement?.closest("table");
  return table ? resolveRole(table, ctx) : null;
}

/**
 * ARIA 1.2 presentation inheritance: when a `table` is presentational (explicitly, or by Chrome's
 * layout-table heuristic in Chrome mode), its required owned structure (`thead`/`tbody`/`tfoot`/
 * `tr`/`td`/`th`) without an explicit role is presentational too. (`<li>` under a presentational
 * list is handled by the `li` case.)
 */
function tableIsPresentational(el: Element, ctx: RoleContext): boolean {
  const table = el.parentElement?.closest("table");
  if (!table) return false;
  const role = resolveRole(table, ctx);
  return role === null || PRESENTATIONAL.has(role);
}

// SVG elements SVG-AAM includes only when the author gives them meaning (§4.1.2): shapes are
// graphics-symbol, the rest group, graphics-object, or img. Chrome agrees (probed 2026-10-26).
const SVG_SHAPES = new Set(["circle", "ellipse", "line", "path", "polygon", "polyline", "rect"]);
const SVG_INCLUDED_ROLES: Readonly<Record<string, string>> = {
  g: "group",
  use: "graphics-object",
  image: "img",
  tspan: "group",
  textpath: "group",
  foreignobject: "group",
};

/**
 * Roles for elements in the SVG namespace. SVG-AAM 1.0 maps every `svg` element to
 * `graphics-document`, whose content is read. Chrome (row 9) leaves out an unnamed `svg` with no
 * element children, exposes a nested `svg` as a group, and turns a root with nothing readable
 * inside into an image; the walk applies that last step, since it needs the content. A `text`
 * element reads like a paragraph, as SVG-AAM's note on its platform mappings says, and so is
 * transparent; an `a` with an href is a link.
 */
function svgRole(el: Element, tag: string, ctx: RoleContext): string | null {
  if (tag === "svg") {
    if (!ctx.rules.svgImageWhenNoContent) return "graphics-document";
    if (ctx.parentOf(el)?.namespaceURI === SVG_NS) return svgIncluded(el) ? "group" : null;
    return el.firstElementChild || svgIncluded(el) ? "graphics-document" : null;
  }
  if (tag === "a") return el.hasAttribute("href") || el.hasAttribute("xlink:href") ? "link" : null;
  if (SVG_SHAPES.has(tag)) return svgIncluded(el) ? "graphics-symbol" : null;
  const role = SVG_INCLUDED_ROLES[tag];
  return role && svgIncluded(el) ? role : null;
}

/**
 * SVG-AAM §4.1.2: an SVG element the author gave meaning to: a non-empty `title` or `desc` child,
 * focusability, or a global ARIA attribute (which covers aria-label, aria-labelledby,
 * aria-describedby, and aria-roledescription).
 */
function svgIncluded(el: Element): boolean {
  if (presentationIsOverridden(el)) return true;
  return Array.from(el.children).some(
    (c) => c.namespaceURI === SVG_NS && /^(title|desc)$/i.test(c.tagName) && (c.textContent ?? "").trim() !== "",
  );
}

/** True for an `svg` element whose role came from the SVG rules rather than an author `role`. */
export function isImplicitSvgRoot(el: Element, role: string): boolean {
  return role === "graphics-document" && el.namespaceURI === SVG_NS && el.tagName.toLowerCase() === "svg" && !el.hasAttribute("role");
}

/**
 * Chrome's layout-table rules, as observed against its accessibility tree; `true` means the
 * table is not a data table. Markup that declares structure wins: a summary, caption, head or
 * foot section, header cell, `border` attribute, or `headers`/`scope` on a cell makes it data.
 * Then one row or one column means layout, twenty rows or more means data, and for the rest
 * Chrome looks at presentation: cell borders on at least half the cells, or cell backgrounds
 * that differ from the table's, make it data; otherwise it is layout.
 */
function isLayoutTable(table: Element, styleOf: StyleOf): boolean {
  const children = Array.from(table.children).map((c) => c.tagName.toLowerCase());
  if (table.hasAttribute("summary") || children.some((t) => t === "caption" || t === "thead" || t === "tfoot")) {
    return false;
  }
  const rows = Array.from(table.querySelectorAll("tr")).filter((tr) => tr.closest("table") === table);
  const cells = rows.flatMap((tr) => Array.from(tr.children).filter((c) => /^t[dh]$/i.test(c.tagName)));
  if (cells.some((c) => c.tagName.toLowerCase() === "th" || c.hasAttribute("headers") || c.hasAttribute("scope"))) {
    return false;
  }
  const cols = Math.max(0, ...rows.map((tr) => tr.children.length));
  if (rows.length <= 1 || cols <= 1) return true;
  if (rows.length >= 20) return false;
  // Presentation signals, consulted only once the markup and size rules are silent: Chrome lets
  // a one-cell table stay layout even with a border attribute.
  const border = table.getAttribute("border");
  if (border !== null && border.trim() !== "" && border.trim() !== "0") return false;
  if (cells.length === 0) return true;
  let bordered = 0;
  let tinted = 0;
  const tableBackground = styleOf(table)?.backgroundColor ?? "";
  for (const cell of cells) {
    const style = styleOf(cell);
    if (!style) continue;
    if (hasBorder(style)) bordered++;
    const background = style.backgroundColor ?? "";
    if (background && !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(background) && background !== tableBackground) tinted++;
  }
  return bordered * 2 < cells.length && tinted === 0;
}

/** Any non-zero border width, read from the longhands or, in DOMs that keep shorthands, from them. */
function hasBorder(style: CSSStyleDeclaration): boolean {
  const widths = [
    style.borderTopWidth,
    style.borderRightWidth,
    style.borderBottomWidth,
    style.borderLeftWidth,
    style.borderWidth,
  ];
  if (widths.some((w) => parseFloat(w || "0") > 0)) return true;
  return /(^|\s)(0*[1-9]\d*(\.\d+)?|0?\.\d*[1-9]\d*)(px|em|rem|pt|thin|medium|thick)?(\s|$)/.test(style.border ?? "") && !/^\s*0(px)?\s/.test(style.border ?? "");
}

// The ancestors ARIA in HTML lists for header and footer: the sectioning content elements and the
// roles article, complementary, navigation, and region (main is handled on its own). A sectioning
// root (blockquote, details, dialog, fieldset, figure, td) is not in the list and does not scope.
// Chrome agrees, except that it does not scope by role="region" (row 6).
const SECTIONING_CONTENT_TAGS = new Set(["article", "aside", "nav", "section"]);
const SECTIONING_CONTENT_ROLES = new Set(["article", "complementary", "navigation", "region"]);

/**
 * ARIA in HTML scoping for `<header>`/`<footer>`/`<aside>`: the nearest scoping ancestor is the
 * body, `<main>` (or `role="main"`), or sectioning content. The walk goes
 * up the composed tree, as Chrome's does: a header in a shadow root inside an `<article>` is
 * scoped to the article.
 */
function scopeOf(el: Element, ctx: RoleContext): "body" | "main" | "sectioning" {
  for (let p = ctx.parentOf(el); p; p = ctx.parentOf(p)) {
    const tag = p.tagName.toLowerCase();
    if (tag === "body") return "body";
    if (SECTIONING_CONTENT_TAGS.has(tag)) return "sectioning";
    if (tag === "main") return "main";
    if (p.hasAttribute("role")) {
      const role = resolveRole(p, ctx);
      if (role === "main") return "main";
      if (role === "region" && !ctx.rules.regionScopesHeader) continue;
      if (role && SECTIONING_CONTENT_ROLES.has(role)) return "sectioning";
    }
  }
  return "body";
}

function numericSize(el: Element): number {
  const n = Number(el.getAttribute("size"));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Accessible name per AccName 1.2 via `dom-accessibility-api` (never hand-rolled),
 * whitespace-collapsed. Read defensively: a name-computation hiccup must never drop a node or
 * promote/demote a role by accident, so it yields "" instead of throwing.
 *
 * In Chrome mode (row 4) one Chrome rule is applied through the library's own style hook. When a
 * name is built from content, Chrome leaves out the content of a descendant whose role does not
 * contribute to an ancestor's name (a status, a group, a table, a landmark; see
 * `contributesToAncestorName`) and keeps only that descendant's author name; AccName 1.2 keeps the
 * content. A descendant like that with no author name is reported to the library as hidden, so
 * its text is skipped, and the linearizer reads it as content instead. Inside an aria-labelledby
 * traversal Chrome keeps all content, so the rule is not applied to an element that has one.
 */
export function accessibleName(el: Element, ctx: RoleContext = defaultContext): string {
  try {
    const exclusions = ctx.rules.nameFromContentExclusions && !el.hasAttribute("aria-labelledby");
    const options = { getComputedStyle: nameStyle(el, ctx, exclusions), computedStyleSupportsPseudoElements: false };
    return computeAccessibleName(el, options).replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

function hasAccessibleName(el: Element, ctx: RoleContext): boolean {
  return accessibleName(el, ctx) !== "";
}

const HIDDEN_STYLE = { getPropertyValue: (p: string) => (p === "display" ? "none" : "") } as CSSStyleDeclaration;
const BLOCK_STYLE = { getPropertyValue: (p: string) => (p === "display" ? "block" : "") } as CSSStyleDeclaration;
const EMPTY_STYLE = { getPropertyValue: () => "" } as unknown as CSSStyleDeclaration;

// Roles the library handles itself inside a name: an image's alt, an embedded control's value.
const NAMED_BY_LIBRARY = new Set([
  "img", "textbox", "searchbox", "combobox", "listbox", "slider", "spinbutton", "progressbar", "meter", "scrollbar",
]);

/**
 * The style source for one name computation: the element's real style, with two changes made
 * through the library's own hook. A `<br>` reads as a block, so the line break separates words
 * ("Owner priya", not "Ownerpriya"), as browsers give it; the library adds a space only around
 * elements that are not inline. With `exclusions` (row 4), a descendant Chrome leaves out of the
 * name reads as hidden.
 */
function nameStyle(
  root: Element,
  ctx: RoleContext,
  exclusions: boolean,
): (node: Element, pseudo?: string | null) => CSSStyleDeclaration {
  return (node, pseudo) => {
    if (node.tagName.toLowerCase() === "br") return BLOCK_STYLE;
    if (exclusions && node !== root && !hasAuthorLabel(node)) {
      const role = resolveRole(node, ctx);
      if (!contributesToAncestorName(node, role, ctx) && !(role && NAMED_BY_LIBRARY.has(role))) return HIDDEN_STYLE;
    }
    const view = node.ownerDocument?.defaultView;
    return view ? view.getComputedStyle(node, pseudo) : EMPTY_STYLE;
  };
}

/** True when the author named the element with a non-empty aria-label or an aria-labelledby. */
function hasAuthorLabel(el: Element): boolean {
  return (el.getAttribute("aria-label") ?? "").trim() !== "" || el.hasAttribute("aria-labelledby");
}

// Roles whose content counts toward an ancestor's name in Chrome besides the name-from-content
// roles (Chromium AXObject::SupportsNameFromContents with recursive=true). `graphics-document` is
// Chrome's SvgRoot.
const CONTRIBUTING_ROLES = new Set([
  "generic", "none", "presentation", "paragraph", "region", "list", "listitem", "definition", "term",
  "math", "caption", "emphasis", "strong", "code", "deletion", "insertion", "subscript",
  "superscript", "time", "graphics-document",
]);

/**
 * True when the element's content counts toward the name of an ancestor that is named from its
 * content, as Chrome computes it: no role, a name-from-content role, or one of the roles above.
 * A group counts only as `<details>`, `<address>`, or an SVG element. A status, alert, log, note,
 * timer, marquee, article, figure, blockquote, table, landmark, or composite widget does not: its
 * text is read on its own, and only its author name, if any, joins the ancestor's name.
 */
function contributesToAncestorName(el: Element, role: string | null, ctx: RoleContext): boolean {
  if (role === null || CONTRIBUTING_ROLES.has(role) || takesNameFromContent(role, ctx.rules)) return true;
  if (role === "group") {
    const tag = el.tagName.toLowerCase();
    return tag === "details" || tag === "address" || el.namespaceURI === SVG_NS;
  }
  return false;
}

/**
 * Chrome (row 5) names a form field from its associated `<label>` elements alone when it has
 * any, even when their text is empty, and then uses neither its title nor its placeholder;
 * HTML-AAM 4.1 falls back to both. True when the field has labels, none with text, and no
 * aria-label or resolving aria-labelledby.
 */
export function hasOnlyEmptyLabels(el: Element): boolean {
  if ((el.getAttribute("aria-label") ?? "").trim() !== "" || labelledbyResolves(el)) return false;
  const labels = Array.from((el as HTMLInputElement).labels ?? []);
  return labels.length > 0 && labels.every((label) => !labelHasText(label, el));
}

function labelledbyResolves(el: Element): boolean {
  const root = el.getRootNode() as Partial<Pick<Document, "getElementById">>;
  if (typeof root.getElementById !== "function") return false;
  const ids = (el.getAttribute("aria-labelledby") ?? "").trim().split(/\s+/).filter(Boolean);
  return ids.some((id) => root.getElementById!(id) !== null);
}

/**
 * True when a label holds something a name can come from: visible text outside the control, or
 * an element with an alt, aria-label, aria-labelledby, or title. Deliberately generous: when in
 * doubt the label counts, and the library computes the name as usual.
 */
function labelHasText(label: Element, control: Element): boolean {
  for (const child of Array.from(label.childNodes)) {
    if (child.nodeType === 3) {
      if ((child.textContent ?? "").trim() !== "") return true;
      continue;
    }
    if (child.nodeType !== 1 || child === control) continue;
    const el = child as Element;
    if (isHiddenFromAT(el)) continue;
    if (["alt", "aria-label", "title"].some((a) => (el.getAttribute(a) ?? "").trim() !== "")) return true;
    if (el.hasAttribute("aria-labelledby") || labelHasText(el, control)) return true;
  }
  return false;
}

const ROW_ANCESTORS_CHROME_SKIPS = new Set(["generic", "none", "presentation", "group", "rowgroup"]);

/**
 * Chromium's exception to row 3: a row inside a grid or treegrid, reached through generic,
 * group, and rowgroup ancestors only, is named from its content.
 */
export function rowInGrid(row: Element, ctx: RoleContext): boolean {
  for (let p = ctx.parentOf(row); p; p = ctx.parentOf(p)) {
    const role = resolveRole(p, ctx);
    if (role === "grid" || role === "treegrid") return true;
    if (role !== null && !ROW_ANCESTORS_CHROME_SKIPS.has(role)) return false;
  }
  return false;
}

/** True if the author supplied a name source: aria-label, aria-labelledby, or title. */
export function hasAuthorName(el: Element): boolean {
  return el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby") || el.hasAttribute("title");
}

/**
 * The control a <label> labels: its `for` target, else its first labelable descendant. Used in
 * Chrome mode (row 8), where the text of a label for a checkbox or radio is read only as the
 * control's name. IDs are scoped to a tree, so `for`
 * resolves within the label's own root: its shadow root, or its document.
 */
export function labelledControl(label: Element): Element | null {
  const forId = label.getAttribute("for");
  if (forId) {
    const root = label.getRootNode() as Partial<Pick<Document, "getElementById">>;
    return typeof root.getElementById === "function" ? root.getElementById(forId) : null;
  }
  return label.querySelector("input:not([type=hidden]), select, textarea, button, meter, output, progress");
}

/** True if ARIA prohibits naming the role (caption, paragraph, …): the node gets an empty name. */
export function isNameProhibited(role: string | null): boolean {
  if (!role) return false;
  return roleMap.get(role)?.nameFrom?.includes("prohibited") ?? false;
}

/**
 * True if the role takes its accessible name from its descendant content (AccName step 2F). A
 * `row` does in WAI-ARIA 1.2; Chrome names a row from content only inside a grid (row 3), which
 * `buildNode` handles, so in Chrome mode a row is not treated as named from content here.
 */
export function takesNameFromContent(role: string | null, rules: BrowserRules = defaultContext.rules): boolean {
  if (!role) return false;
  if (role === "row" && rules.rowNamedByAuthorOnly) return false;
  const override = NAME_FROM_CONTENT_OVERRIDES[role];
  if (override !== undefined) return override;
  return roleMap.get(role)?.nameFrom?.includes("contents") ?? false;
}

/**
 * True if the role's DOM descendants are presentational (WAI-ARIA "Children Presentational: True"
 * — button, img, checkbox, tab, slider, …): user agents are not expected to expose them.
 */
export function isChildrenPresentational(role: string | null): boolean {
  if (!role) return false;
  return roleMap.get(role)?.childrenPresentational ?? false;
}

/**
 * Dual-inheritance roles (structure *and* widget in ARIA's superclass graph) that are genuinely
 * operable controls and so count as widgets for the "unnamed control" flag. The other
 * dual-inheritance roles — `row`, `gridcell`, `columnheader`, `rowheader`, `grid`, `progressbar`,
 * `scrollbar` — are table/structure roles a screen reader does not present as controls, and an
 * empty `<th>` corner cell or spacer `<tr>` must not be reported as an unnamed control.
 */
const DUAL_INHERITANCE_WIDGETS = new Set(["slider", "spinbutton", "tab", "treeitem", "listbox", "tree"]);

/**
 * True if the role is an interactive widget — used for the "unnamed control" flag (AC-5). Pure
 * widget roles (every superclass chain goes through `widget`) count, except composite containers
 * such as `tablist` whose name is optional; the operable dual-inheritance roles above are added.
 */
export function isWidget(role: string | null): boolean {
  if (!role) return false;
  if (DUAL_INHERITANCE_WIDGETS.has(role)) return true;
  const chains = roleMap.get(role)?.superClass;
  return (
    !!chains &&
    chains.length > 0 &&
    chains.every((chain) => chain.includes("widget") && !chain.includes("composite"))
  );
}
