// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { linearize } from "./index";

/** Set the document body and return it as the linearization root. */
function root(html: string): Element {
  document.body.innerHTML = html;
  return document.body;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("linearize (SPEC-001)", () => {
  it("returns nodes in depth-first reading order (AC-1)", () => {
    const out = linearize(root('<h1>Title</h1><p>Intro</p><a href="/x">More</a>'));
    expect(out.map((n) => [n.role, n.name])).toEqual([
      ["heading", "Title"],
      ["text", "Intro"],
      ["link", "More"],
    ]);
  });

  it("computes role + accessible name for the common elements (AC-2)", () => {
    const out = linearize(
      root('<button>Save</button><a href="/h">Home</a><h2>Sec</h2><img src="l.png" alt="Logo">'),
    );
    expect(out).toEqual([
      { role: "button", name: "Save", ref: { tag: "button" } },
      { role: "link", name: "Home", ref: { tag: "a" } },
      { role: "heading", name: "Sec", level: 2, ref: { tag: "h2" } },
      { role: "img", name: "Logo", ref: { tag: "img" } },
    ]);
  });

  it("consumes a name-from-content name once; container text surfaces as text (no double-read)", () => {
    const out = linearize(root("<button>Save</button><p>Hello world</p>"));
    expect(out).toEqual([
      { role: "button", name: "Save", ref: { tag: "button" } },
      { role: "text", name: "Hello world" },
    ]);
  });

  it("treats <a> without href as generic text; <a href> as a link (AC-2)", () => {
    expect(linearize(root("<a>Plain</a>")).map((n) => n.role)).toEqual(["text"]);
    expect(linearize(root('<a href="/x">Linked</a>')).map((n) => n.role)).toEqual(["link"]);
  });

  it("excludes aria-hidden and display:none subtrees (AC-3)", () => {
    const out = linearize(
      root(
        '<p>Visible</p><div aria-hidden="true"><h2>Hidden</h2></div><div style="display:none">Gone</div>',
      ),
    );
    expect(out.map((n) => n.name)).toEqual(["Visible"]);
  });

  it("a styled span is not a heading; <h2> and role=heading+aria-level are (AC-4)", () => {
    expect(linearize(root('<span class="h2">Fake</span>')).map((n) => n.role)).toEqual(["text"]);
    const real = linearize(root('<h2>Real</h2><div role="heading" aria-level="3">Aria</div>'));
    expect(real).toEqual([
      { role: "heading", name: "Real", level: 2, ref: { tag: "h2" } },
      { role: "heading", name: "Aria", level: 3, ref: { tag: "div" } },
    ]);
  });

  it("flags an interactive control with no accessible name (AC-5)", () => {
    const out = linearize(root("<button><svg></svg></button>"));
    expect(out).toEqual([
      { role: "button", name: "", ref: { tag: "button" }, flags: { unnamed: true } },
    ]);
  });

  it("flags a missing alt; omits a decorative alt=\"\" (AC-6)", () => {
    const out = linearize(
      root('<img src="a.png"><img src="b.png" alt=""><img src="c.png" alt="Chart">'),
    );
    expect(out).toEqual([
      { role: "img", name: "", ref: { tag: "img" }, flags: { missingAlt: true } },
      { role: "img", name: "Chart", ref: { tag: "img" } },
    ]);
  });
});
