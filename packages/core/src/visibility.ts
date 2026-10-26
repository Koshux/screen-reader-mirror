/**
 * AT-visibility predicate — SPEC-001 §3 / AC-3.
 *
 * Returns `true` when an element is excluded from the accessibility tree, so the linearizer skips
 * it (and, for the MVP, its subtree). The four exclusion conditions:
 *   - `aria-hidden="true"`
 *   - the `hidden` attribute (except `hidden="until-found"`, which stays in the tree)
 *   - `display: none`
 *   - `visibility: hidden` / `collapse`
 *
 * Attribute conditions (`aria-hidden`, `hidden`) are reliable everywhere. The CSS conditions need
 * `getComputedStyle`, which jsdom implements only partially — pass inline styles in tests or use
 * happy-dom / a real browser (SPEC-001 §5). Style is read **defensively**: if it can't be computed
 * (detached node, no view, throwing impl), the element is treated as visible so we never wrongly
 * drop content.
 *
 * Host-agnostic by design: the computed-style source comes from the element's own
 * `ownerDocument.defaultView`, never a global `window` (core makes no global/network assumptions).
 *
 * Note: `visibility:hidden` can be overridden by a descendant (`visibility:visible`); honouring that
 * per-descendant is a deferred refinement (SPEC-001 non-goals) — the MVP treats it as hidden here.
 */
export interface VisibilityOptions {
  /** Override the computed-style source (defaults to the element's own document view). */
  getComputedStyle?: (el: Element) => CSSStyleDeclaration | null | undefined;
}

export function isHiddenFromAT(el: Element, options: VisibilityOptions = {}): boolean {
  // 1. aria-hidden — case-insensitive "true" token (matches browser/Blink behaviour; any non-"true"
  //    value, including "false" and the empty string, does not hide).
  if (el.getAttribute("aria-hidden")?.toLowerCase() === "true") return true;

  // 2. the `hidden` attribute, except hidden="until-found" (visually hidden but still in the tree).
  const hidden = el.getAttribute("hidden");
  if (hidden !== null && hidden.toLowerCase() !== "until-found") return true;

  // 2b. The content of a closed <details> is not rendered: everything except its first <summary>
  //     is out of the tree. (The browser hides it inside the element's own shadow slot, so no
  //     computed-style check can see it.)
  if (isInsideClosedDetails(el)) return true;

  // 3 & 4. CSS-based hiding, read defensively.
  const style = resolveStyle(el, options);
  if (style) {
    if (style.display === "none") return true;
    if (style.visibility === "hidden" || style.visibility === "collapse") return true;
  }
  return false;
}

/** The element's computed style from the option or its own window, or null when it cannot be read. */
export function resolveStyle(el: Element, options: VisibilityOptions): CSSStyleDeclaration | null {
  try {
    if (options.getComputedStyle) return options.getComputedStyle(el) ?? null;
    const view = el.ownerDocument?.defaultView;
    return view ? view.getComputedStyle(el) : null;
  } catch {
    return null; // fail-open: can't compute → treat as visible
  }
}

/** True for any child of a closed `<details>` other than its first `<summary>`. */
export function isInsideClosedDetails(el: Element): boolean {
  const parent = el.parentElement;
  if (!parent || parent.tagName.toLowerCase() !== "details" || parent.hasAttribute("open")) return false;
  return el !== firstSummaryOf(parent);
}

/** The `<summary>` a `<details>` exposes: its first summary child, or null. */
export function firstSummaryOf(details: Element): Element | null {
  for (const child of Array.from(details.children)) {
    if (child.tagName.toLowerCase() === "summary") return child;
  }
  return null;
}
