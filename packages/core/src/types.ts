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
  /**
   * A frame whose document cannot be read from here (cross-origin), so its content is not in the
   * reading order. SPEC-003 AC-7.
   */
  unreachable?: boolean;
}

/**
 * How a live region is set up (SPEC-004), from `aria-live`, `aria-atomic`, `aria-relevant`, and
 * `aria-busy`, or the role's implicit values (`alert`, `status`, `log`). The engine reads the page
 * at one moment, so this says what a screen reader is told to announce, not when it speaks: a
 * region inserted together with its message, for example, is often not announced at all.
 */
export interface LiveRegion {
  /** How urgently a change is announced: `aria-live`, or the role's implicit value. */
  politeness: "polite" | "assertive";
  /** True when the whole region is read on a change, false when only the changed part is. */
  atomic: boolean;
  /** The changes that are announced, from `aria-relevant`, with `all` expanded. */
  relevant: Array<"additions" | "removals" | "text">;
  /** `aria-busy="true"`: the region is being updated and announcements are held. */
  busy?: true;
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
  /**
   * Heading level, present only when the node is a heading: 1–6 from `<h1>`–`<h6>`, any integer
   * ≥ 1 from an author `aria-level` (which wins over the tag), 2 when neither is given.
   */
  level?: number;
  /** Notable conditions; omitted entirely when there are none. */
  flags?: NodeFlags;
  /**
   * Present only when the node is a live region: how it is set up to be announced when it
   * changes. It describes the set-up, not when or whether a screen reader will speak. SPEC-004.
   */
  live?: LiveRegion;
  /**
   * Minimal, serialisable pointer back to the source element: a tag name and where the element
   * lives, never a live node. Text runs carry no `ref`, except inside a frame, where they carry
   * `{ tag: "#text", frame }` so the frame's extent is unambiguous.
   */
  ref?: {
    tag: string;
    /** The element lives inside a shadow tree, at any depth. SPEC-003 AC-5. */
    shadow?: true;
    /**
     * The node is inside the n-th frame met in reading order (1-based), the innermost one when
     * frames nest. A frame's own `document` node carries its index too. SPEC-003 AC-6.
     */
    frame?: number;
  };
}

/**
 * What `interpret()` returns (SPEC-005): the reading order, and the places where the page looks
 * like one thing and the tree says another.
 */
export interface Interpretation {
  /** The reading order: exactly what `linearize(root, options)` returns. */
  nodes: InterpretationNode[];
  /** Places where the page looks like one thing and the tree says another. Guesses, not facts. */
  mismatches: Mismatch[];
}

/**
 * A visual-versus-semantic mismatch: a guess from markup and computed style, with the signals it
 * rests on, so a developer can weigh it. Hosts place it beside `nodes[at..end)`. New kinds and
 * signal values may be added in a minor release, so a consumer ignores values it does not know.
 */
export interface Mismatch {
  kind: "looks-like-heading" | "looks-like-table" | "clickable-not-button" | "field-without-label";
  /** Index in `nodes` of the first node holding the element's content. */
  at: number;
  /** One past the last node holding the element's content; equal to `at` when there is none. */
  end: number;
  /** The element the mismatch was found on, in the shape of a node's `ref`. */
  ref: NonNullable<InterpretationNode["ref"]>;
  /** The signals that fired, as stable identifiers, in a fixed order (SPEC-005 §3). */
  signals: MismatchSignal[];
}

/** Why a mismatch fired. Identifiers, not sentences: the host phrases them. */
export type MismatchSignal =
  | "font-size" | "font-weight"
  | "grid-layout" | "row-layout" | "table-layout"
  | "rows" | "cell-borders" | "cell-backgrounds" | "header-row"
  | "click-attribute" | "tabindex" | "cursor-pointer"
  | "no-name" | "title" | "placeholder" | "nearby-text";
