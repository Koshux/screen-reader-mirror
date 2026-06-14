/**
 * The interpretation model — what a screen reader would encounter, as plain serialisable data.
 *
 * Deliberately free of live DOM references so the output can cross a boundary (extension → panel,
 * CLI → report, worker → UI) and never leaks a node handle. See SPEC-001.
 */
export interface InterpretationNode {
  /** Computed ARIA role, or "text" for a bare run of text. */
  role: string;
  /** Accessible name (AccName 1.2). May be an empty string. */
  name: string;
  /** Heading level 1–6, when the node is a heading. */
  level?: number;
  /** Notable conditions worth surfacing to the developer. */
  flags?: {
    /** An interactive element with no accessible name. */
    unnamed?: boolean;
    /** An `<img>` with no `alt` attribute at all (vs. an intentional `alt=""`). */
    missingAlt?: boolean;
  };
  /** Minimal, serialisable pointer back to the source — never a live node. */
  ref?: { tag: string };
}
