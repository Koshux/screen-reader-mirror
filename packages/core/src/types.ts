/**
 * The interpretation model — what a screen reader would encounter, as plain serialisable data.
 *
 * Every node is plain, JSON-serialisable data with **no live DOM references**, so the output can
 * cross a boundary (content-script → side panel, CLI → report file, worker → UI) without leaking a
 * node handle. This model is the public contract from SPEC-001 §3 (spec-reviewed 2026-06-15).
 */

/**
 * Conditions worth surfacing to the developer about a node. Each flag is omitted unless true, so an
 * absent `flags` (or `flags.x`) means "not applicable / fine".
 */
export interface NodeFlags {
  /** An interactive (widget-role) element with no accessible name. SPEC-001 AC-5. */
  unnamed?: boolean;
  /** An `<img>` with no `alt` attribute at all — distinct from an intentional `alt=""`. SPEC-001 AC-6. */
  missingAlt?: boolean;
}

/**
 * One entry in the linearized, screen-reader reading order.
 *
 * A node is either an **element** (with its computed `role` and accessible `name`) or a **bare run
 * of text** (`role: "text"`). Per the "no double-read" rule (SPEC-001 §3), an element whose role
 * takes its name from content carries that text in `name` and does *not* also produce `text` nodes
 * for the same subtree.
 */
export interface InterpretationNode {
  /**
   * Computed WAI-ARIA role (e.g. `"heading"`, `"link"`, `"button"`), or the literal `"text"` for a
   * bare text run. Resolved per SPEC-001 §3 — an explicit `role` wins; otherwise the *conditional*
   * implicit role (e.g. `<a>` is only a `link` with an `href`) — never a naive tag→role map.
   */
  role: string;
  /** Accessible name per AccName 1.2. May be an empty string (see {@link NodeFlags.unnamed}). */
  name: string;
  /** Heading level 1–6, present only when the node is a heading. */
  level?: number;
  /** Notable conditions; omitted entirely when there are none. */
  flags?: NodeFlags;
  /** Minimal, serialisable pointer back to the source element — a tag name only, never a live node. */
  ref?: { tag: string };
}
