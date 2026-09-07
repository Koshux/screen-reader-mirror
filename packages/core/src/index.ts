/**
 * screen-reader-mirror — client-side engine.
 *
 * Computes the linearized, screen-reader reading order of a DOM subtree: the ordered sequence of
 * roles and accessible names a screen reader would traverse, with assistive-tech-hidden content
 * excluded and the obvious encoding mistakes flagged.
 *
 * Hard rule: nothing in this package makes a network call (ADR-0001).
 */
export { linearize, type LinearizeOptions } from "./linearize";
export type { InterpretationNode, NodeFlags } from "./types";
