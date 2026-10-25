import { roles } from "aria-query";
import { computeAccessibleName } from "dom-accessibility-api";

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
 * Resolve an element's role: explicit `role` wins; else the conditional implicit role; else null
 * (generic / no role).
 *
 * WAI-ARIA 1.2 role-attribute processing: the value is a space-separated list of fallback tokens
 * and the user agent uses the **first token that names a non-abstract role** — so `role="foo
 * button"` is a button, and an abstract role like `role="widget"` is ignored.
 */
export function resolveRole(el: Element): string | null {
  const explicit = el.getAttribute("role");
  if (explicit) {
    for (const token of explicit.trim().toLowerCase().split(/\s+/)) {
      const def = roleMap.get(token);
      if (!def || def.abstract) continue;
      // ARIA 1.2 presentation-role conflict resolution: a focusable element, or one carrying a
      // global ARIA attribute, ignores `presentation`/`none` and keeps its implicit role.
      if (PRESENTATIONAL.has(token) && presentationIsOverridden(el)) return implicitRole(el);
      return token;
    }
  }
  return implicitRole(el);
}

function implicitRole(el: Element): string | null {
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
      // ARIA in HTML: banner only when scoped to the body — not inside main, sectioning content
      // (article/aside/nav/section or those roles) or a sectioning root (dialog, figure, td, …).
      return scopeOf(el) === "body" ? "banner" : null;
    case "footer":
      return scopeOf(el) === "body" ? "contentinfo" : null;
    case "aside":
      // ARIA in HTML: complementary when scoped to body or main; inside sectioning content or a
      // sectioning root only when it has an accessible name, else generic.
      return scopeOf(el) !== "sectioning" || hasAccessibleName(el) ? "complementary" : null;
    case "ul":
    case "ol":
    case "menu":
      return "list";
    case "li":
      // HTML-AAM / ARIA in HTML: `listitem` only as the child of an element exposed as a list
      // (`<ul>`/`<ol>`/`<menu>` or `role="list"`); an orphan `<li>` is generic. Going through
      // `resolveRole` on the parent also honours `<ul role="presentation">` (ARIA presentation
      // inheritance for required owned elements).
      return el.parentElement && resolveRole(el.parentElement) === "list" ? "listitem" : null;
    case "p":
      return "paragraph";
    case "img":
      // alt="" = decorative (presentation) — unless focusable / global ARIA re-exposes it.
      return el.getAttribute("alt") === "" && !presentationIsOverridden(el) ? "presentation" : "img";
    case "svg":
      // SVG-AAM: the root is an image-like object named by its <title> / aria-label. Without a
      // name it is treated as decorative here (its <title>/<desc> are never read as text).
      return hasAccessibleName(el) ? "img" : null;
    case "input":
      return inputRole(el);
    case "textarea":
      return "textbox";
    case "select":
      return el.hasAttribute("multiple") || numericSize(el) > 1 ? "listbox" : "combobox";
    case "table":
      return "table";
    case "thead":
    case "tbody":
    case "tfoot":
      return tableIsPresentational(el) ? null : "rowgroup";
    case "tr":
      return tableIsPresentational(el) ? null : "row";
    case "td": {
      const table = ancestorTableRole(el);
      if (table && PRESENTATIONAL.has(table)) return null;
      return table === "grid" || table === "treegrid" ? "gridcell" : "cell"; // HTML-AAM
    }
    case "th": {
      if (tableIsPresentational(el)) return null;
      // HTML-AAM: scope="row"/"rowgroup" → rowheader; otherwise columnheader (the HTML-AAM
      // "in a thead / first cell" heuristics for scope-less <th> are a simplification here).
      const scope = el.getAttribute("scope")?.toLowerCase();
      return scope === "row" || scope === "rowgroup" ? "rowheader" : "columnheader";
    }
    case "article":
      return "article";
    case "section":
      // ARIA in HTML: `region` only with an accessible name, otherwise generic.
      return hasAccessibleName(el) ? "region" : null;
    case "form":
      // HTML-AAM: an unnamed `<form>` is not exposed as a landmark.
      return hasAccessibleName(el) ? "form" : null;
    case "fieldset":
      return "group";
    case "figure":
      return "figure";
    case "dialog":
      return "dialog";
    case "hr":
      return "separator";
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

/** Resolved role of the closest ancestor `<table>`, or null when there is none. */
function ancestorTableRole(el: Element): string | null {
  const table = el.parentElement?.closest("table");
  return table ? resolveRole(table) : null;
}

/**
 * ARIA 1.2 presentation inheritance: when a `table` is presentational, its required owned
 * structure (`thead`/`tbody`/`tfoot`/`tr`/`td`/`th`) without an explicit role is presentational
 * too — the classic layout table. (`<li>` under a presentational list is handled by the `li` case.)
 */
function tableIsPresentational(el: Element): boolean {
  const role = ancestorTableRole(el);
  return role !== null && PRESENTATIONAL.has(role);
}

// HTML sectioning content, the landmark roles ARIA in HTML scopes the same way, and the sectioning
// roots other than body (HTML §4.3.11).
const SECTIONING_CONTENT_TAGS = new Set(["article", "aside", "nav", "section"]);
const SECTIONING_CONTENT_ROLES = new Set(["article", "complementary", "navigation", "region"]);
const SECTIONING_ROOT_TAGS = new Set(["blockquote", "details", "dialog", "fieldset", "figure", "td"]);

/**
 * ARIA in HTML scoping for `<header>`/`<footer>`/`<aside>`: the nearest scoping ancestor is the
 * body, `<main>` (or `role="main"`), or sectioning content / a sectioning root.
 */
function scopeOf(el: Element): "body" | "main" | "sectioning" {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const tag = p.tagName.toLowerCase();
    if (tag === "body") return "body";
    if (SECTIONING_CONTENT_TAGS.has(tag) || SECTIONING_ROOT_TAGS.has(tag)) return "sectioning";
    if (tag === "main") return "main";
    if (p.hasAttribute("role")) {
      const role = resolveRole(p);
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
