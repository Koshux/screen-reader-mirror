import { roles } from "aria-query";

/**
 * Role resolution for the interpretation (SPEC-001 §3).
 *
 * `dom-accessibility-api` computes the *name*, not the role. `aria-query` gives role *definitions*
 * (used here for the name-from-content and widget determinations), but the implicit role of an HTML
 * element is **conditional** — so the tag→role mapping below applies those conditions (e.g. `<a>` is
 * a link only with `href`) rather than a naive lookup. This is a **curated** resolver covering the
 * elements the engine exercises today; broadening it to the full HTML-AAM mapping (and using
 * `Element.getComputedRole()` as a host oracle) is a tracked follow-up.
 */

type RoleDef = { nameFrom?: readonly string[]; superClass?: ReadonlyArray<readonly string[]> };
const roleMap = roles as unknown as {
  get(key: string): RoleDef | undefined;
  has(key: string): boolean;
};

/** Resolve an element's role: explicit `role` wins; else the conditional implicit role; else null. */
export function resolveRole(el: Element): string | null {
  const explicit = el.getAttribute("role");
  if (explicit) {
    const token = explicit.trim().split(/\s+/)[0]?.toLowerCase();
    if (token && roleMap.has(token)) return token;
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
      return isScopedToSectioning(el) ? null : "banner";
    case "footer":
      return isScopedToSectioning(el) ? null : "contentinfo";
    case "aside":
      return "complementary";
    case "ul":
    case "ol":
    case "menu":
      return "list";
    case "li":
      return "listitem";
    case "p":
      return "paragraph";
    case "img":
      return el.getAttribute("alt") === "" ? "presentation" : "img"; // alt="" = decorative
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
      return "rowgroup";
    case "tr":
      return "row";
    case "td":
      return "cell";
    case "th":
      return "columnheader"; // simplification: scope="row" → rowheader
    case "article":
      return "article";
    case "section":
      return "region"; // simplification: per spec only a named <section> is a region
    case "form":
      return "form"; // simplification: per spec only a named <form> is a form landmark
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
      return "searchbox";
    case "email":
    case "tel":
    case "url":
    case "text":
      return "textbox";
    case "hidden":
    case "password": // no corresponding ARIA role
      return null;
    default:
      return "textbox"; // date/time/color/file etc. → sensible default
  }
}

/** header/footer are banner/contentinfo only at the top level, not inside a sectioning element. */
function isScopedToSectioning(el: Element): boolean {
  const sectioning = new Set(["article", "aside", "main", "nav", "section"]);
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (sectioning.has(p.tagName.toLowerCase())) return true;
  }
  return false;
}

function numericSize(el: Element): number {
  const n = Number(el.getAttribute("size"));
  return Number.isFinite(n) ? n : 0;
}

/** True if the role takes its accessible name from its descendant content (AccName step 2F). */
export function takesNameFromContent(role: string | null): boolean {
  if (!role) return false;
  return roleMap.get(role)?.nameFrom?.includes("contents") ?? false;
}

/** True if the role is an interactive widget — used for the "unnamed control" flag (AC-5). */
export function isWidget(role: string | null): boolean {
  if (!role) return false;
  return roleMap.get(role)?.superClass?.some((chain) => chain.includes("widget")) ?? false;
}
