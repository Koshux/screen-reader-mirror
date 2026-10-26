// @vitest-environment happy-dom
/**
 * SPEC-003: frames. The reachable cases live in fixtures/probes/frames.html, which is also
 * compared with Chrome's accessibility tree (`pnpm ax:compare`) and agrees with it. Cross-origin
 * frames cannot exist in the test DOM, so they are simulated by overriding `contentDocument`.
 */
import { describe, it, expect, afterEach } from "vitest";
import { linearize } from "../src/index";
import { loadCase } from "./probes";

const PAGE = "frames.html";
const read = (name: string) => linearize(loadCase(PAGE, name).root);

afterEach(() => {
  document.body.innerHTML = "";
});

describe("frames (SPEC-003)", () => {
  it("reads a same-origin frame as a named document node followed by its content (AC-6)", () => {
    expect(read("basic")).toEqual([
      { role: "text", name: "Before" },
      { role: "document", name: "Payment form", ref: { tag: "iframe", frame: 1 } },
      { role: "heading", name: "Pay", level: 1, ref: { tag: "h1", frame: 1 } },
      { role: "text", name: "Card details", ref: { tag: "#text", frame: 1 } },
      { role: "button", name: "Pay now", ref: { tag: "button", frame: 1 } },
      { role: "text", name: "After" },
    ]);
  });

  it("names a frame from aria-label before title (AC-6)", () => {
    expect(read("aria-label")[0]).toEqual({ role: "document", name: "Map", ref: { tag: "iframe", frame: 1 } });
  });

  it("numbers frames in reading order and marks nodes with the innermost frame (AC-6)", () => {
    expect(read("nested").map((n) => [n.role, n.name, n.ref?.frame])).toEqual([
      ["document", "Outer", 1],
      ["text", "Outer text", 1],
      ["document", "Inner", 2],
      ["text", "Inner text", 2],
      ["text", "Outer again", 1],
      ["document", "Second", 3],
      ["text", "Second text", 3],
    ]);
  });

  it("reads an empty frame as a document node with nothing after it (AC-6)", () => {
    expect(read("empty")).toEqual([{ role: "document", name: "Empty", ref: { tag: "iframe", frame: 1 } }]);
  });

  it("reads a frame that has not loaded yet as an empty document, not unreachable (AC-6)", () => {
    // A browser gives an unloaded frame an empty about:blank document. The test DOM refuses to
    // load about:blank, so the frame is built detached and the browser's document is supplied.
    const container = document.createElement("div");
    container.innerHTML = '<iframe title="Loading"></iframe>';
    const blank = document.implementation.createHTMLDocument("");
    Object.defineProperty(container.querySelector("iframe"), "contentDocument", { get: () => blank });
    expect(linearize(container)).toEqual([{ role: "document", name: "Loading", ref: { tag: "iframe", frame: 1 } }]);
  });

  it("applies visibility to frames and inside them (AC-8)", () => {
    expect(read("visibility").map((n) => [n.role, n.name])).toEqual([
      ["document", "Hidden inside"],
      ["text", "Shown in frame"],
    ]);
  });

  it("flags a frame the page cannot read as unreachable and reads nothing inside (AC-7)", () => {
    document.body.innerHTML =
      '<iframe title="Throws" srcdoc="<p>secret</p>"></iframe><iframe title="Null" srcdoc="<p>secret</p>"></iframe><p>After</p>';
    const [throws, isNull] = Array.from(document.querySelectorAll("iframe"));
    Object.defineProperty(throws, "contentDocument", {
      get() {
        throw new Error("SecurityError: blocked a frame from accessing a cross-origin frame");
      },
    });
    Object.defineProperty(isNull, "contentDocument", { get: () => null });
    expect(linearize(document.body)).toEqual([
      { role: "document", name: "Throws", ref: { tag: "iframe", frame: 1 }, flags: { unreachable: true } },
      { role: "document", name: "Null", ref: { tag: "iframe", frame: 2 }, flags: { unreachable: true } },
      { role: "text", name: "After" },
    ]);
  });

  it("never records a frame's URL (privacy, §6)", () => {
    document.body.innerHTML = '<iframe title="T" src="about:blank?token=abc" srcdoc="<p>x</p>"></iframe>';
    expect(JSON.stringify(linearize(document.body))).not.toContain("token");
  });
});
