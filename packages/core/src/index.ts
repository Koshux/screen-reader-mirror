/**
 * screen-reader-mirror — client-side engine.
 *
 * This is the M1 scaffold. The real linearization (depth-first reading order, AccName via
 * `dom-accessibility-api`, roles via `aria-query`, AT-visibility, the obvious-mistake flags) is
 * specified in SPEC-001 and built via the board tasks. `implicitRole` below is the genuine seed of
 * that role mapping; `linearize` is an honest placeholder until SPEC-001 lands.
 *
 * Hard rule: nothing in this package may make a network call (see ADR-0001).
 */
import type { InterpretationNode } from "./types";

export type { InterpretationNode } from "./types";

/**
 * A small subset of HTML→implicit-ARIA-role mappings. SPEC-001 (task T4) replaces this with the
 * complete, context-aware mapping from `aria-query` (e.g. `<a>` is only a `link` with an `href`).
 */
const IMPLICIT_ROLES: Readonly<Record<string, string>> = {
  a: "link",
  button: "button",
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  img: "img",
  nav: "navigation",
  main: "main",
  header: "banner",
  footer: "contentinfo",
  ul: "list",
  ol: "list",
  li: "listitem",
  p: "paragraph",
};

/** Implicit ARIA role for a tag name, or `undefined` if it has none. Case-insensitive. */
export function implicitRole(tagName: string): string | undefined {
  return IMPLICIT_ROLES[tagName.toLowerCase()];
}

/**
 * Linearize a DOM subtree into the ordered sequence a screen reader would traverse.
 *
 * Placeholder: returns `[]` until SPEC-001 is implemented. The signature is the intended public
 * contract; a future optional second argument will carry options (verbosity profile, shadow/iframe
 * traversal) additively.
 *
 * @param root the element to interpret
 */
export function linearize(root: Element): InterpretationNode[] {
  void root; // not yet used — see SPEC-001 / board task T4
  return [];
}
