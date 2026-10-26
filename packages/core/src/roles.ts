import { roles } from "aria-query";
import { computeAccessibleName } from "dom-accessibility-api";
import { firstSummaryOf, resolveStyle } from "./visibility";

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
// `row` is name-from-content in ARIA, but browsers do not name rows from their cells and screen
// readers never announce such a name; a row is named by the author or not at all.
const NAME_FROM_CONTENT_OVERRIDES: Readonly<Record<string, boolean>> = { rowgroup: false, row: false };

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
export function resolveRole(
  el: Element,
  parentOf: ParentOf = composedParent,
  styleOf: StyleOf = ownStyle,
): string | null {
  const explicit = el.getAttribute("role");
  if (explicit) {
    for (const token of explicit.trim().toLowerCase().split(/\s+/)) {
      if (ARIA_1_3_ROLES.has(token)) return token;
      const def = roleMap.get(token);
      if (!def || def.abstract) continue;
      // ARIA 1.2 presentation-role conflict resolution: a focusable element, or one carrying a
      // global ARIA attribute, ignores `presentation`/`none` and keeps its implicit role.
      if (PRESENTATIONAL.has(token) && presentationIsOverridden(el)) return implicitRole(el, parentOf, styleOf);
      return token;
    }
  }
  return implicitRole(el, parentOf, styleOf);
}

function implicitRole(el: Element, parentOf: ParentOf, styleOf: StyleOf): string | null {
  const tag = el.tagName.toLowerCase();
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
      return scopeOf(el, parentOf) === "body" ? "banner" : "sectionheader";
    case "footer":
      return scopeOf(el, parentOf) === "body" ? "contentinfo" : "sectionfooter";
    case "aside":
      // ARIA in HTML: complementary when scoped to body or main; inside sectioning content or a
      // sectioning root only when it has an accessible name, else generic.
      return scopeOf(el, parentOf) !== "sectioning" || hasAccessibleName(el) ? "complementary" : null;
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
      const parent = parentOf(el);
      return parent && resolveRole(parent, parentOf, styleOf) === "list" ? "listitem" : null;
    }
    case "p":
      return "paragraph";
    case "img":
      // alt="" = decorative (presentation) — unless focusable / global ARIA re-exposes it.
      return el.getAttribute("alt") === "" && !presentationIsOverridden(el) ? "presentation" : "img";
    case "svg":
      // SVG-AAM: the root is an image-like object named by its <title> / aria-label. Unnamed, it
      // is decorative (its <title>/<desc> are never read as text) unless it is focusable or carries
      // a global ARIA attribute, which keeps it in the tree with an empty name.
      return hasAccessibleName(el) || presentationIsOverridden(el) ? "img" : null;
    case "input":
      return inputRole(el);
    case "textarea":
      return "textbox";
    case "select":
      return el.hasAttribute("multiple") || numericSize(el) > 1 ? "listbox" : "combobox";
    case "table":
      // Chrome's layout-table rules (isLayoutTable): a table that is not a data table is
      // presentational.
      return isLayoutTable(el, styleOf) ? null : "table";
    case "thead":
    case "tfoot":
      return tableIsPresentational(el, styleOf) ? null : "rowgroup"; // exposed by Chrome
    case "tbody":
      return null; // not exposed by Chrome; its rows hang directly off the table
    case "tr":
      return tableIsPresentational(el, styleOf) ? null : "row";
    case "td": {
      const table = ancestorTableRole(el, styleOf);
      if (table === null || PRESENTATIONAL.has(table)) return null; // layout or presentational table
      return table === "grid" || table === "treegrid" ? "gridcell" : "cell"; // HTML-AAM
    }
    case "th":
      return tableIsPresentational(el, styleOf) ? null : headerCellRole(el);
    case "article":
      return "article";
    case "section":
      // ARIA in HTML: `region` only with an accessible name, otherwise generic.
      return hasAccessibleName(el) ? "region" : null;
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
 * columnheader. Without a scope, browsers apply the HTML table-model heuristic: a header cell that
 * starts a row containing data cells is a row header; every other header cell is a column header.
 */
function headerCellRole(el: Element): string {
  const scope = el.getAttribute("scope")?.toLowerCase();
  if (scope === "row" || scope === "rowgroup") return "rowheader";
  if (scope === "col" || scope === "colgroup") return "columnheader";
  const row = el.parentElement;
  if (!row || row.tagName.toLowerCase() !== "tr") return "columnheader";
  const cells = Array.from(row.children).filter((c) => /^(td|th)$/i.test(c.tagName));
  const hasDataCells = cells.some((c) => c.tagName.toLowerCase() === "td");
  return hasDataCells && cells[0] === el ? "rowheader" : "columnheader";
}

/** Resolved role of the closest ancestor `<table>`, or null when there is none. */
function ancestorTableRole(el: Element, styleOf: StyleOf): string | null {
  const table = el.parentElement?.closest("table");
  return table ? resolveRole(table, composedParent, styleOf) : null;
}

/**
 * ARIA 1.2 presentation inheritance: when a `table` is presentational (explicitly, or by Chrome's
 * layout-table heuristic), its required owned structure (`thead`/`tfoot`/`tr`/`td`/`th`) without
 * an explicit role is presentational too. (`<li>` under a presentational list is handled by the
 * `li` case.)
 */
function tableIsPresentational(el: Element, styleOf: StyleOf): boolean {
  const table = el.parentElement?.closest("table");
  if (!table) return false;
  const role = resolveRole(table, composedParent, styleOf);
  return role === null || PRESENTATIONAL.has(role);
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
// Chrome agrees, except that it does not scope by role="region" (pinned in a test).
const SECTIONING_CONTENT_TAGS = new Set(["article", "aside", "nav", "section"]);
const SECTIONING_CONTENT_ROLES = new Set(["article", "complementary", "navigation", "region"]);

/**
 * ARIA in HTML scoping for `<header>`/`<footer>`/`<aside>`: the nearest scoping ancestor is the
 * body, `<main>` (or `role="main"`), or sectioning content. The walk goes
 * up the composed tree, as Chrome's does: a header in a shadow root inside an `<article>` is
 * scoped to the article.
 */
function scopeOf(el: Element, parentOf: ParentOf): "body" | "main" | "sectioning" {
  for (let p = parentOf(el); p; p = parentOf(p)) {
    const tag = p.tagName.toLowerCase();
    if (tag === "body") return "body";
    if (SECTIONING_CONTENT_TAGS.has(tag)) return "sectioning";
    if (tag === "main") return "main";
    if (p.hasAttribute("role")) {
      const role = resolveRole(p, parentOf);
      if (role === "main") return "main";
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
 */
export function accessibleName(el: Element): string {
  try {
    return computeAccessibleName(el).replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

function hasAccessibleName(el: Element): boolean {
  return accessibleName(el) !== "";
}

/** True if the author supplied a name source: aria-label, aria-labelledby, or title. */
export function hasAuthorName(el: Element): boolean {
  return el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby") || el.hasAttribute("title");
}

/**
 * The control a <label> labels: its `for` target, else its first labelable descendant. Used to
 * decide whether the label text is read on its own (text fields) or only as the control name
 * (checkboxes and radios), which is how Chrome exposes it. IDs are scoped to a tree, so `for`
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

/** True if the role takes its accessible name from its descendant content (AccName step 2F). */
export function takesNameFromContent(role: string | null): boolean {
  if (!role) return false;
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
