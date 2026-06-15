import { describe, it, expect } from "vitest";
import type { InterpretationNode, NodeFlags } from "./types";

// These tests pin the public node contract from SPEC-001 §3. They are deliberately data-only
// (no DOM) — the shape is what every consumer and every later feature depends on.

describe("InterpretationNode contract (SPEC-001)", () => {
  it("represents an element node — a heading carries its level", () => {
    const heading: InterpretationNode = {
      role: "heading",
      name: "Personal details",
      level: 2,
      ref: { tag: "h2" },
    };
    expect(heading.role).toBe("heading");
    expect(heading.level).toBe(2);
  });

  it("represents a bare text run via role 'text' (no level, no flags)", () => {
    const text: InterpretationNode = { role: "text", name: "Date of birth" };
    expect(text.role).toBe("text");
    expect(text.level).toBeUndefined();
    expect(text.flags).toBeUndefined();
  });

  it("flags an unnamed interactive control (AC-5) and a missing alt (AC-6)", () => {
    const flags: NodeFlags = { unnamed: true };
    const button: InterpretationNode = { role: "button", name: "", flags };
    const img: InterpretationNode = { role: "img", name: "", flags: { missingAlt: true } };
    expect(button.name).toBe("");
    expect(button.flags?.unnamed).toBe(true);
    expect(img.flags?.missingAlt).toBe(true);
  });

  it("is plain JSON-serialisable data with no live node references", () => {
    // The whole point of the model: it must survive crossing a boundary (panel/report/worker).
    const node: InterpretationNode = { role: "link", name: "Home", ref: { tag: "a" } };
    const roundTripped = JSON.parse(JSON.stringify(node)) as InterpretationNode;
    expect(roundTripped).toEqual(node);
    expect(typeof roundTripped.ref?.tag).toBe("string");
  });
});
