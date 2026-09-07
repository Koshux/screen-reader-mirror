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

  it("reads a nested document depth-first: landmarks, lists, named regions (AC-1)", () => {
    const out = linearize(
      root(
        '<nav aria-label="Main"><ul><li><a href="/a">A</a></li></ul></nav>' +
          '<main><section aria-label="S"><h2>T</h2><p>Body</p></section></main>',
      ),
    );
    expect(out.map((n) => [n.role, n.name])).toEqual([
      ["navigation", "Main"],
      ["list", ""],
      ["listitem", ""],
      ["link", "A"],
      ["main", ""],
      ["region", "S"],
      ["heading", "T"],
      ["text", "Body"],
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

  it("role=heading without aria-level defaults to level 2, per WAI-ARIA (AC-4)", () => {
    expect(linearize(root('<div role="heading">Plain</div>'))).toEqual([
      { role: "heading", name: "Plain", level: 2, ref: { tag: "div" } },
    ]);
  });

  it("flags an interactive control with no accessible name (AC-5)", () => {
    const out = linearize(root("<button><svg></svg></button>"));
    expect(out).toEqual([
      { role: "button", name: "", ref: { tag: "button" }, flags: { unnamed: true } },
    ]);
  });

  it('flags a missing alt; omits a decorative alt="" (AC-6)', () => {
    const out = linearize(
      root('<img src="a.png"><img src="b.png" alt=""><img src="c.png" alt="Chart">'),
    );
    expect(out).toEqual([
      { role: "img", name: "", ref: { tag: "img" }, flags: { missingAlt: true } },
      { role: "img", name: "Chart", ref: { tag: "img" } },
    ]);
  });

  it('an explicit role=img on <img alt=""> is exposed — explicit role wins over the decorative default (AC-6)', () => {
    // Chromium includes it as an image with an empty name; only the bare alt="" is ignored.
    expect(linearize(root('<img src="a.png" alt="" role="img">'))).toEqual([
      { role: "img", name: "", ref: { tag: "img" } },
    ]);
  });
});

describe("conditional role resolution (SPEC-001 §3)", () => {
  it("uses the first non-abstract token of a multi-token role; abstract roles are ignored", () => {
    expect(linearize(root('<div role="foo button" aria-label="Save">Save</div>'))).toEqual([
      { role: "button", name: "Save", ref: { tag: "div" } },
    ]);
    expect(linearize(root('<div role="bogus img" aria-label="Chart"></div>'))).toEqual([
      { role: "img", name: "Chart", ref: { tag: "div" } },
    ]);
    expect(linearize(root('<div role="widget">Abstract</div>'))).toEqual([
      { role: "text", name: "Abstract" },
    ]);
  });

  // Known divergence, pinned so it flips visibly when fixed: the role is right, but
  // `dom-accessibility-api` derives name-from-content from the *first* role token only, so the
  // content name is lost behind an unknown fallback token. Upstream limitation — not hand-rolled.
  it.fails("name-from-content behind an unknown first role token (upstream AccName limitation)", () => {
    expect(linearize(root('<div role="foo button">Save</div>'))).toEqual([
      { role: "button", name: "Save", ref: { tag: "div" } },
    ]);
  });

  it("<li> is a listitem only inside a list; orphaned or under role=presentation it is generic", () => {
    expect(linearize(root("<li>Orphan</li>"))).toEqual([{ role: "text", name: "Orphan" }]);
    expect(linearize(root('<ul role="presentation"><li>Layout</li></ul>'))).toEqual([
      { role: "text", name: "Layout" },
    ]);
    expect(linearize(root("<ul><li>Item</li></ul>")).map((n) => n.role)).toEqual([
      "list",
      "listitem",
      "text",
    ]);
    expect(linearize(root('<div role="list"><li>X</li></div>')).map((n) => n.role)).toEqual([
      "list",
      "listitem",
      "text",
    ]);
  });

  it("input[type=password] is a (protected) textbox; type=hidden is not in the tree", () => {
    expect(
      linearize(root('<label>Pw <input type="password"></label><input type="hidden" name="t">')),
    ).toEqual([
      { role: "text", name: "Pw" },
      { role: "textbox", name: "Pw", ref: { tag: "input" } },
    ]);
  });

  it("<section> and <form> are landmarks only when they have an accessible name", () => {
    expect(linearize(root("<section><p>Hi</p></section>"))).toEqual([{ role: "text", name: "Hi" }]);
    expect(linearize(root('<section aria-label="News"><p>Hi</p></section>'))).toEqual([
      { role: "region", name: "News", ref: { tag: "section" } },
      { role: "text", name: "Hi" },
    ]);
    expect(linearize(root('<form><input aria-label="Q"></form>'))).toEqual([
      { role: "textbox", name: "Q", ref: { tag: "input" } },
    ]);
    expect(linearize(root('<form aria-labelledby="t"><h2 id="t">Search</h2></form>'))).toEqual([
      { role: "form", name: "Search", ref: { tag: "form" } },
      { role: "heading", name: "Search", level: 2, ref: { tag: "h2" } },
    ]);
  });
});

describe("containers, leaves and the no-double-read rule (SPEC-001 §3)", () => {
  it("a table keeps its body: rowgroups, rows, header cells, cells and the links inside them", () => {
    const out = linearize(
      root(
        "<table><thead><tr><th>Col</th></tr></thead>" +
          '<tbody><tr><td>A</td><td><a href="/e">Edit</a></td></tr></tbody></table>',
      ),
    );
    expect(out.map((n) => [n.role, n.name, n.ref?.tag])).toEqual([
      ["table", "", "table"],
      ["rowgroup", "", "thead"],
      ["row", "Col", "tr"],
      ["columnheader", "Col", "th"],
      ["rowgroup", "", "tbody"],
      ["row", "A Edit", "tr"],
      ["cell", "A", "td"],
      ["cell", "Edit", "td"],
      ["link", "Edit", "a"],
    ]);
  });

  it("nested elements inside a name-from-content role stay in the reading order; their text is not re-read", () => {
    expect(linearize(root('<h2><a href="/p">Post</a></h2>'))).toEqual([
      { role: "heading", name: "Post", level: 2, ref: { tag: "h2" } },
      { role: "link", name: "Post", ref: { tag: "a" } },
    ]);
    expect(
      linearize(root('<a href="/p"><img src="t.png" alt="Thumb"><h3>Card</h3><p>Desc</p></a>')),
    ).toEqual([
      { role: "link", name: "Thumb Card Desc", ref: { tag: "a" } },
      { role: "img", name: "Thumb", ref: { tag: "img" } },
      { role: "heading", name: "Card", level: 3, ref: { tag: "h3" } },
    ]);
    expect(linearize(root('<a href="/p">Go <button>Now</button></a>'))).toEqual([
      { role: "link", name: "Go Now", ref: { tag: "a" } },
      { role: "button", name: "Now", ref: { tag: "button" } },
    ]);
  });

  it("children-presentational roles and form controls are leaves: no content re-read", () => {
    expect(linearize(root('<span role="img" aria-label="check mark">✅</span>'))).toEqual([
      { role: "img", name: "check mark", ref: { tag: "span" } },
    ]);
    expect(linearize(root('<svg role="img" aria-label="Logo"><title>Logo</title></svg>'))).toEqual([
      { role: "img", name: "Logo", ref: { tag: "svg" } },
    ]);
    expect(linearize(root('<select aria-label="Pick"><option>One</option></select>'))).toEqual([
      { role: "combobox", name: "Pick", ref: { tag: "select" } },
    ]);
  });

  it("<th scope=row> is a rowheader; other <th> are columnheaders", () => {
    const out = linearize(root('<table><tr><th scope="row">Name</th><td>Ann</td></tr></table>'));
    expect(out.map((n) => [n.role, n.name])).toEqual([
      ["table", ""],
      ["rowgroup", ""],
      ["row", "Name Ann"],
      ["rowheader", "Name"],
      ["cell", "Ann"],
    ]);
  });
});

describe("presentation-role conflict resolution and inheritance (ARIA 1.2 §5.4.1)", () => {
  it("a focusable element, or one with a global ARIA attribute, ignores role=presentation", () => {
    expect(linearize(root('<a href="/x" role="presentation">Link</a>')).map((n) => n.role)).toEqual([
      "link",
    ]);
    expect(linearize(root('<img src="a.png" alt="" aria-label="Chart">'))).toEqual([
      { role: "img", name: "Chart", ref: { tag: "img" } },
    ]);
    // Neither focusable nor globally-attributed: presentation is honoured.
    expect(linearize(root('<img src="a.png" alt="X" role="none">'))).toEqual([]);
  });

  // Known divergence, pinned: the role is resolved correctly, but `dom-accessibility-api` honours
  // the literal role attribute when deciding name-from-content, so the link's name is "" (and it is
  // flagged unnamed). Same upstream limitation as the multi-token case; flips when fixed upstream.
  it.fails("name-from-content of a focusable role=presentation element (upstream AccName limitation)", () => {
    expect(linearize(root('<a href="/x" role="presentation">Link</a>'))).toEqual([
      { role: "link", name: "Link", ref: { tag: "a" } },
    ]);
  });

  it("a layout table (role=presentation) hides its rows and cells but keeps their content", () => {
    expect(
      linearize(
        root('<table role="presentation"><tr><td>Foo</td><td><a href="/x">Bar</a></td></tr></table>'),
      ),
    ).toEqual([
      { role: "text", name: "Foo" },
      { role: "link", name: "Bar", ref: { tag: "a" } },
    ]);
    // …but an explicit role on an owned element is not overridden.
    expect(
      linearize(root('<table role="presentation"><tr><td role="cell">Keep</td></tr></table>')),
    ).toEqual([{ role: "cell", name: "Keep", ref: { tag: "td" } }]);
  });
});

describe("flags on real-world markup (AC-5 / AC-6)", () => {
  it("flags every unnamed control the AC names: link, textbox, checkbox, select, textarea, slider", () => {
    const out = linearize(
      root(
        '<a href="/x"><img src="i.png" alt=""></a><input type="text"><input type="checkbox">' +
          '<select><option>a</option></select><textarea></textarea><input type="range">',
      ),
    );
    expect(out).toEqual([
      { role: "link", name: "", ref: { tag: "a" }, flags: { unnamed: true } },
      { role: "textbox", name: "", ref: { tag: "input" }, flags: { unnamed: true } },
      { role: "checkbox", name: "", ref: { tag: "input" }, flags: { unnamed: true } },
      { role: "combobox", name: "", ref: { tag: "select" }, flags: { unnamed: true } },
      { role: "textbox", name: "", ref: { tag: "textarea" }, flags: { unnamed: true } },
      { role: "slider", name: "", ref: { tag: "input" }, flags: { unnamed: true } },
    ]);
  });

  it("does not flag empty table structure or an unnamed tablist as unnamed controls", () => {
    const out = linearize(
      root(
        '<table><tr><th></th><th>Q1</th></tr><tr><td><img src="i.png" alt=""></td></tr></table>' +
          '<div role="tablist"></div>',
      ),
    );
    expect(out.some((n) => n.flags?.unnamed)).toBe(false);
    expect(out.map((n) => [n.role, n.name])).toEqual([
      ["table", ""],
      ["rowgroup", ""],
      ["row", "Q1"],
      ["columnheader", ""],
      ["columnheader", "Q1"],
      ["row", ""],
      ["cell", ""],
      ["tablist", ""],
    ]);
  });

  it("a missing-alt <img> inside a button is still flagged; a role=button card keeps its link (AC-6)", () => {
    expect(linearize(root('<button><img src="i.png"></button>'))).toEqual([
      { role: "button", name: "", ref: { tag: "button" }, flags: { unnamed: true } },
      { role: "img", name: "", ref: { tag: "img" }, flags: { missingAlt: true } },
    ]);
    expect(linearize(root('<div role="button" tabindex="0">Card <a href="/x">Link</a></div>'))).toEqual([
      { role: "button", name: "Card Link", ref: { tag: "div" } },
      { role: "link", name: "Link", ref: { tag: "a" } },
    ]);
  });
});

describe("text context resets per container (SPEC-001 §3)", () => {
  it("a list inside a table cell keeps its item text; a rowgroup does not consume text", () => {
    const out = linearize(root("<table><tr><td><ul><li>A</li><li>B</li></ul></td></tr></table>"));
    expect(out.map((n) => [n.role, n.name])).toEqual([
      ["table", ""],
      ["rowgroup", ""],
      ["row", "A B"],
      ["cell", "A B"],
      ["list", ""],
      ["listitem", ""],
      ["text", "A"],
      ["listitem", ""],
      ["text", "B"],
    ]);
    const aria = linearize(
      root('<div role="table"><div role="rowgroup">Note<div role="row"><div role="cell">A</div></div></div></div>'),
    );
    expect(aria.map((n) => [n.role, n.name])).toEqual([
      ["table", ""],
      ["rowgroup", ""],
      ["text", "Note"],
      ["row", "A"],
      ["cell", "A"],
    ]);
  });

  it("an inline <svg> is an image named by its <title>; unnamed it is decorative and never read as text", () => {
    expect(linearize(root('<svg><title>Logo</title><path d="M0 0"/></svg>'))).toEqual([
      { role: "img", name: "Logo", ref: { tag: "svg" } },
    ]);
    expect(linearize(root('<p>Before</p><svg><path d="M0 0"/></svg><p>After</p>')).map((n) => n.name)).toEqual([
      "Before",
      "After",
    ]);
  });
});

describe("more conditional implicit roles (SPEC-001 §3)", () => {
  it("excludes hidden and visibility:hidden subtrees; keeps hidden=until-found (AC-3)", () => {
    const out = linearize(
      root(
        '<p>Visible</p><div hidden><h2>Hid</h2></div><div hidden="until-found">Found</div>' +
          '<span style="visibility:hidden">VH</span>',
      ),
    );
    expect(out.map((n) => n.name)).toEqual(["Visible", "Found"]);
  });

  it("header/footer are banner/contentinfo only when scoped to the body", () => {
    const out = linearize(
      root(
        "<header>Top</header><main><header>Inner</header></main><article><footer>AF</footer></article>" +
          '<dialog open><header>DH</header></dialog><div role="article"><header>RH</header></div>' +
          "<footer>Bottom</footer>",
      ),
    );
    expect(out.map((n) => [n.role, n.name])).toEqual([
      ["banner", ""],
      ["text", "Top"],
      ["main", ""],
      ["text", "Inner"],
      ["article", ""],
      ["text", "AF"],
      ["dialog", ""],
      ["text", "DH"],
      ["article", ""],
      ["text", "RH"],
      ["contentinfo", ""],
      ["text", "Bottom"],
    ]);
  });

  it("<aside> is complementary under body/main; inside sectioning content only when named", () => {
    const out = linearize(
      root(
        "<main><aside>Side</aside></main><article><aside>Related</aside>" +
          '<aside aria-label="Related">R</aside></article>',
      ),
    );
    expect(out.map((n) => [n.role, n.name])).toEqual([
      ["main", ""],
      ["complementary", ""],
      ["text", "Side"],
      ["article", ""],
      ["text", "Related"],
      ["complementary", "Related"],
      ["text", "R"],
    ]);
  });

  it("input types map by HTML-AAM: submit/file → button, range → slider, number → spinbutton, search, datalist → combobox; select multiple → listbox; area[href] → link", () => {
    const out = linearize(
      root(
        '<input type="submit" value="Go"><input type="file" aria-label="Upload">' +
          '<input type="range" aria-label="Vol"><input type="number" aria-label="N">' +
          '<input type="search" aria-label="S"><input type="text" list="l" aria-label="City">' +
          '<datalist id="l"><option value="A"></datalist><select multiple aria-label="M"><option>a</option></select>' +
          '<map><area href="/a" alt="Area"></map>',
      ),
    );
    expect(out.map((n) => [n.role, n.name])).toEqual([
      ["button", "Go"],
      ["button", "Upload"],
      ["slider", "Vol"],
      ["spinbutton", "N"],
      ["searchbox", "S"],
      ["combobox", "City"],
      ["listbox", "M"],
      ["link", "Area"],
    ]);
  });

  it("<td> in a role=grid table is a gridcell", () => {
    expect(linearize(root('<table role="grid"><tr><td>x</td></tr></table>')).map((n) => n.role)).toEqual([
      "grid",
      "rowgroup",
      "row",
      "gridcell",
    ]);
  });

  it("aria-level overrides the tag level on a native heading (AC-4)", () => {
    expect(linearize(root('<h3 aria-level="5">L</h3>'))).toEqual([
      { role: "heading", name: "L", level: 5, ref: { tag: "h3" } },
    ]);
  });

  // Known divergence, pinned: HTML-AAM names a <figure> from its <figcaption>; dom-accessibility-api
  // does not apply that native-label step yet. Flips when upstream does.
  it.fails("<figure> takes its name from <figcaption> (upstream AccName limitation)", () => {
    expect(
      linearize(root('<figure><img src="x.png" alt="Chart"><figcaption>Fig 1</figcaption></figure>'))[0],
    ).toEqual({ role: "figure", name: "Fig 1", ref: { tag: "figure" } });
  });
});
