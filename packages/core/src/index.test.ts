import { describe, it, expect } from "vitest";
import { implicitRole, linearize } from "./index";

describe("implicitRole", () => {
  it("maps semantic tags to their implicit ARIA role (case-insensitive)", () => {
    expect(implicitRole("h1")).toBe("heading");
    expect(implicitRole("H3")).toBe("heading");
    expect(implicitRole("BUTTON")).toBe("button");
    expect(implicitRole("nav")).toBe("navigation");
    expect(implicitRole("li")).toBe("listitem");
  });

  it("returns undefined for non-semantic tags (the 'styled div/span' case)", () => {
    expect(implicitRole("div")).toBeUndefined();
    expect(implicitRole("span")).toBeUndefined();
  });
});

describe("linearize", () => {
  it("is callable and returns an array (placeholder until SPEC-001)", () => {
    expect(typeof linearize).toBe("function");
    // Called defensively; the real traversal arrives with SPEC-001 / task T4.
    expect(Array.isArray(linearize(null as unknown as Element))).toBe(true);
  });
});
