/**
 * screen-reader-mirror — client-side engine.
 *
 * Computes the linearized, screen-reader reading order of a DOM subtree: the ordered sequence of
 * roles and accessible names a screen reader would traverse, with assistive-tech-hidden content
 * excluded and the obvious encoding mistakes flagged. `interpret()` adds the places where the page
 * looks like one thing and the tree says another (SPEC-005).
 *
 * Hard rule: nothing in this package makes a network call (ADR-0001).
 */
export { linearize, interpret, type LinearizeOptions } from "./linearize";
export type { InterpretationNode, NodeFlags, LiveRegion, Interpretation, Mismatch, MismatchSignal } from "./types";
