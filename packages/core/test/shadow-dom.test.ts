// @vitest-environment happy-dom
/**
 * SPEC-003: composed-tree traversal through shadow roots and slots. Each case lives in
 * fixtures/probes/web-components.html, which is also compared with Chrome's accessibility
 * tree (`pnpm ax:compare`); the expected output below agrees with Chrome except where a test
 * says otherwise.
 */
import { describe, it, expect, afterEach } from "vitest";
import { linearize } from "../src/index";
import { loadCase } from "./probes";

const PAGE = "web-components.html";
const read = (name: string) => linearize(loadCase(PAGE, name).root);
const pairs = (name: string) => read(name).map((n) => [n.role, n.name]);

afterEach(() => {
  document.body.innerHTML = "";
});

describe("shadow DOM and slots (SPEC-003)", () => {
  it("reads open shadow content at the host's position, not the light children (AC-1, AC-3)", () => {
    expect(pairs("open-root")).toEqual([
      ["heading", "Shadow title"],
      ["text", "Shadow body"],
      ["button", "Shadow action"],
    ]);
  });

  it("reads named and default slots, falls back when nothing is assigned, drops unassigned children (AC-2, AC-3)", () => {
    expect(pairs("slots")).toEqual([
      ["heading", "Billing"],
      ["text", "Default slot text"],
      ["link", "Default slot link"],
      ["text", "No footer"],
    ]);
  });

  it("emits a host with a role as a container over its composed children (AC-2)", () => {
    expect(pairs("host-role")).toEqual([
      ["list", ""],
      ["listitem", ""],
      ["text", "One"],
      ["listitem", ""],
      ["text", "Two"],
    ]);
  });

  // Upstream limit: dom-accessibility-api walks a slot's assigned nodes but not a host's shadow
  // root, so a host named from content gets its light text only. Chrome says "Mute audio".
  it.fails("names a host with a role from its shadow content, as Chrome does (upstream limit)", () => {
    expect(pairs("host-name")).toEqual([["button", "Mute audio"]]);
  });

  it("composes nested roots recursively, with a slotted li as a listitem, as Chrome does (AC-4)", () => {
    expect(pairs("nested")).toEqual([
      ["navigation", "App"],
      ["list", ""],
      ["listitem", ""],
      ["link", "Alpha"],
      ["listitem", ""],
      ["link", "Beta"],
      ["main", ""],
      ["heading", "Page title"],
      ["text", "Page text"],
    ]);
  });

  it("marks every node from a shadow tree, at any depth, and no light node (AC-5)", () => {
    const out = read("nested");
    expect(out.map((n) => [n.ref?.tag, n.ref?.shadow ?? false])).toEqual([
      ["nav", true], // x-app's shadow
      ["ul", true], // x-menu's shadow, nested
      ["li", true], // light children of x-menu, which itself lives in x-app's shadow
      ["a", true],
      ["li", true],
      ["a", true],
      ["main", true],
      ["h1", false], // light child of x-app, in the document
      [undefined, false], // text run
    ]);
  });

  it("applies visibility to shadow elements, slotted elements, and slots (AC-8)", () => {
    expect(pairs("visibility")).toEqual([
      ["text", "Shown slotted"],
      ["text", "Visible shadow text"],
    ]);
  });

  it("reads a closed root's light children by default, and its content when supplied (AC-9)", () => {
    const { root, getShadowRoot } = loadCase(PAGE, "closed-root");
    // Default: the DOM does not show a closed root. Chrome shows "Closed content"; documented limit.
    expect(linearize(root).map((n) => n.name)).toEqual(["Light children"]);
    expect(linearize(root, { getShadowRoot }).map((n) => [n.role, n.name, n.ref?.shadow])).toEqual([
      ["text", "Closed content", undefined],
    ]);
  });

  it("consumes slotted text into a shadow heading's name, without reading it twice (AC-10)", () => {
    expect(read("name-across-slot")).toEqual([
      { role: "heading", name: "Order #42", level: 2, ref: { tag: "h2", shadow: true } },
    ]);
  });

  it("merges a text run across a slot and shadow text (AC-10)", () => {
    expect(pairs("run-across-slot")).toEqual([["text", "Total: 12 EUR due today"]]);
  });

  it("resolves a label's for within its own shadow root", () => {
    // The checkbox label reads only as the control's name, so the for lookup found the control.
    expect(pairs("labels")).toEqual([["checkbox", "I agree"]]);
  });
});
