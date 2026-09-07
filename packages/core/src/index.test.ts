import { describe, it, expect } from "vitest";
import * as core from "./index";

describe("public API surface", () => {
  it("exports linearize as a function", () => {
    expect(typeof core.linearize).toBe("function");
  });
});
