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

  it("<section> is a landmark only when named; every <form> is exposed as a form, as Chrome does", () => {
    expect(linearize(root("<section><p>Hi</p></section>"))).toEqual([{ role: "text", name: "Hi" }]);
    expect(linearize(root('<section aria-label="News"><p>Hi</p></section>'))).toEqual([
      { role: "region", name: "News", ref: { tag: "section" } },
      { role: "text", name: "Hi" },
    ]);
    expect(linearize(root('<form><input aria-label="Q"></form>'))).toEqual([
      { role: "form", name: "", ref: { tag: "form" } },
      { role: "textbox", name: "Q", ref: { tag: "input" } },
    ]);
    expect(linearize(root('<form aria-labelledby="t"><h2 id="t">Search</h2></form>'))).toEqual([
      { role: "form", name: "Search", ref: { tag: "form" } },
      { role: "heading", name: "Search", level: 2, ref: { tag: "h2" } },
    ]);
  });
});

describe("containers, leaves and the no-double-read rule (SPEC-001 §3)", () => {
  it("a table keeps its body: the head row group, unnamed rows, header cells, cells and the links inside them", () => {
    const out = linearize(
      root(
        "<table><thead><tr><th>Col</th></tr></thead>" +
          '<tbody><tr><td>A</td><td><a href="/e">Edit</a></td></tr></tbody></table>',
      ),
    );
    expect(out.map((n) => [n.role, n.name, n.ref?.tag])).toEqual([
      ["table", "", "table"],
      ["rowgroup", "", "thead"],
      ["row", "", "tr"],
      ["columnheader", "Col", "th"],
      ["row", "", "tr"],
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
      ["row", ""],
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
      ["row", ""],
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
    // The header cell keeps this a data table under the layout-table heuristic.
    const out = linearize(root("<table><tr><th>K</th><td><ul><li>A</li><li>B</li></ul></td></tr></table>"));
    expect(out.map((n) => [n.role, n.name])).toEqual([
      ["table", ""],
      ["row", ""],
      ["rowheader", "K"],
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
      ["row", ""],
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
      ["option", "a"],
      ["link", "Area"],
    ]);
  });

  it("<td> in a role=grid table is a gridcell", () => {
    expect(linearize(root('<table role="grid"><tr><td>x</td></tr></table>')).map((n) => n.role)).toEqual([
      "grid",
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

describe("fidelity gaps closed on 2026-10-26 (SPEC-001 §3)", () => {
  it("<details> is a group whose first <summary> is a button; closed content is out of the tree", () => {
    expect(linearize(root("<details><summary>More</summary><p>Secret</p></details>"))).toEqual([
      { role: "group", name: "", ref: { tag: "details" } },
      { role: "button", name: "More", ref: { tag: "summary" } },
    ]);
    expect(linearize(root("<details open><summary>More</summary><p>Shown</p></details>"))).toEqual([
      { role: "group", name: "", ref: { tag: "details" } },
      { role: "button", name: "More", ref: { tag: "summary" } },
      { role: "text", name: "Shown" },
    ]);
    // A second <summary>, or one outside <details>, is generic.
    expect(
      linearize(root("<details open><summary>A</summary><summary>B</summary></details><summary>C</summary>")).map(
        (n) => [n.role, n.name],
      ),
    ).toEqual([
      ["group", ""],
      ["button", "A"],
      ["text", "B"],
      ["text", "C"],
    ]);
  });

  it("a list-box <select> exposes its options and optgroups; a collapsed <select> stays a leaf", () => {
    const listbox =
      '<select multiple aria-label="Pick"><option>One</option><option selected>Two</option>' +
      '<optgroup label="G"><option>Three</option></optgroup></select>';
    expect(linearize(root(listbox)).map((n) => [n.role, n.name])).toEqual([
      ["listbox", "Pick"],
      ["option", "One"],
      ["option", "Two"],
      ["group", "G"],
      ["option", "Three"],
    ]);
    expect(linearize(root('<select size="3" aria-label="Pick"><option>A</option></select>')).map((n) => n.role)).toEqual([
      "listbox",
      "option",
    ]);
    expect(linearize(root('<select aria-label="Pick"><option>A</option><option>B</option></select>'))).toEqual([
      { role: "combobox", name: "Pick", ref: { tag: "select" } },
    ]);
  });

  it("a scope-less <th> is a rowheader only when it starts a row that has data cells", () => {
    const roles = (html: string) => linearize(root(html)).filter((n) => /header$/.test(n.role)).map((n) => n.role);
    expect(roles("<table><thead><tr><th>Name</th><th>Qty</th></tr></thead><tbody><tr><td>Ann</td><td>2</td></tr></tbody></table>")).toEqual([
      "columnheader",
      "columnheader",
    ]);
    expect(roles("<table><tr><th>Name</th><td>Ann</td></tr><tr><th>Age</th><td>9</td></tr></table>")).toEqual([
      "rowheader",
      "rowheader",
    ]);
    expect(roles("<table><tr><th>A</th><th>B</th></tr></table>")).toEqual(["columnheader", "columnheader"]);
    expect(roles("<table><tr><td>x</td><th>Mid</th><td>y</td></tr></table>")).toEqual(["columnheader"]);
  });

  it("<caption> is a caption node with no name (ARIA prohibits one); the table takes the name", () => {
    expect(linearize(root("<table><caption>Sales</caption><tr><td>1</td></tr></table>")).map((n) => [n.role, n.name])).toEqual([
      ["table", "Sales"],
      ["caption", ""],
      ["text", "Sales"],
      ["row", ""],
      ["cell", "1"],
    ]);
  });

  it("an unnamed inline <svg> is decorative unless it is focusable", () => {
    expect(linearize(root('<p>Before</p><svg><path d="M0 0"/></svg><p>After</p>')).map((n) => n.name)).toEqual(["Before", "After"]);
    expect(linearize(root('<svg tabindex="0"><path d="M0 0"/></svg>'))).toEqual([{ role: "img", name: "", ref: { tag: "svg" } }]);
  });

  it("bare text is emitted as runs: inline formatting merges, block boundaries and <br> split", () => {
    expect(linearize(root("<p>Loose <em>text</em> here and <strong>bold</strong>.</p>"))).toEqual([
      { role: "text", name: "Loose text here and bold." },
    ]);
    expect(linearize(root("<div>One <span>two</span> three</div>")).map((n) => n.name)).toEqual(["One two three"]);
    expect(linearize(root("<p>A</p><p>B</p>")).map((n) => n.name)).toEqual(["A", "B"]);
    expect(linearize(root("<p>line<br>break</p>")).map((n) => n.name)).toEqual(["line", "break"]);
    expect(linearize(root('<p>See <a href="/d">docs</a> now</p>')).map((n) => [n.role, n.name])).toEqual([
      ["text", "See"],
      ["link", "docs"],
      ["text", "now"],
    ]);
  });

  // Pinned decision: HTML-AAM makes <li> a listitem only when it is an accessibility child of an
  // element exposed as a list. A <ul role="navigation"> is not exposed as a list, so its items are
  // generic. Browsers differ here; revisit against the real tree in #6.
  it("<li> under <ul role=navigation> is generic", () => {
    expect(linearize(root('<ul role="navigation"><li><a href="/x">X</a></li></ul>')).map((n) => n.role)).toEqual([
      "navigation",
      "link",
    ]);
  });
});

describe("behaviour checked against Chrome's accessibility tree (#6)", () => {
  it("exposes thead and tfoot as row groups, never tbody; rows are named by the author or not at all", () => {
    const out = linearize(
      root(
        "<table><thead><tr><th>H</th></tr></thead><tbody><tr><td>1</td></tr></tbody>" +
          "<tfoot><tr><td>F</td></tr></tfoot></table>",
      ),
    );
    expect(out.map((n) => [n.role, n.name, n.ref?.tag])).toEqual([
      ["table", "", "table"],
      ["rowgroup", "", "thead"],
      ["row", "", "tr"],
      ["columnheader", "H", "th"],
      ["row", "", "tr"],
      ["cell", "1", "td"],
      ["rowgroup", "", "tfoot"],
      ["row", "", "tr"],
      ["cell", "F", "td"],
    ]);
    expect(linearize(root('<table><tr aria-label="Totals"><th>k</th><td>v</td></tr></table>')).map((n) => [n.role, n.name])).toEqual([
      ["table", ""],
      ["row", "Totals"],
      ["rowheader", "k"],
      ["cell", "v"],
    ]);
  });

  it("applies the layout-table heuristic: no headers, caption, or sections plus one row or column, or no borders, is not a table", () => {
    expect(linearize(root("<table><tr><td>a</td><td>b</td></tr></table>")).map((n) => [n.role, n.name])).toEqual([
      ["text", "a"],
      ["text", "b"],
    ]);
    expect(
      linearize(root("<table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>")).map((n) => n.role),
    ).toEqual(["text", "text", "text", "text"]);
    const cell = (t: string) => `<td style="border:1px solid #000">${t}</td>`;
    expect(
      linearize(root(`<table><tr>${cell("a")}${cell("b")}</tr><tr>${cell("c")}${cell("d")}</tr></table>`)).map((n) => n.role),
    ).toEqual(["table", "row", "cell", "cell", "row", "cell", "cell"]);
    expect(linearize(root("<table><tr><th>k</th><td>v</td></tr></table>")).map((n) => n.role)).toEqual([
      "table",
      "row",
      "rowheader",
      "cell",
    ]);
    // The border attribute is a presentation signal: it counts only once the size rule is silent.
    expect(linearize(root('<table border="1"><tr><td>1</td></tr></table>')).map((n) => [n.role, n.name])).toEqual([["text", "1"]]);
    expect(
      linearize(root('<table border="1"><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>')).map((n) => n.role),
    ).toEqual(["table", "row", "cell", "cell", "row", "cell", "cell"]);
    expect(linearize(root('<table summary="Totals"><tr><td>1</td></tr></table>')).map((n) => [n.role, n.name])).toEqual([
      ["table", "Totals"],
      ["row", ""],
      ["cell", "1"],
    ]);
  });

  it("maps dt and dd to term and definition (unnamed; the text reads as content) and blockquote to blockquote", () => {
    expect(
      linearize(root("<dl><dt>Zone</dt><dd>Valletta</dd></dl><blockquote>Keep it small.</blockquote>")).map((n) => [n.role, n.name]),
    ).toEqual([
      ["term", ""],
      ["text", "Zone"],
      ["definition", ""],
      ["text", "Valletta"],
      ["blockquote", ""],
      ["text", "Keep it small."],
    ]);
  });

  it("names a text field from its placeholder when nothing else names it", () => {
    expect(linearize(root('<input type="text" placeholder="Vehicle registration">'))).toEqual([
      { role: "textbox", name: "Vehicle registration", ref: { tag: "input" } },
    ]);
    expect(linearize(root('<textarea placeholder="Notes"></textarea>'))).toEqual([
      { role: "textbox", name: "Notes", ref: { tag: "textarea" } },
    ]);
  });

  it("reads a label's text only as the name of a checkbox or radio, but also as text for a text field", () => {
    expect(
      linearize(root('<label><input type="checkbox"> Weekdays</label><label for="r">Yes</label><input id="r" type="radio">')).map(
        (n) => [n.role, n.name],
      ),
    ).toEqual([
      ["checkbox", "Weekdays"],
      ["radio", "Yes"],
    ]);
    expect(linearize(root('<label>Town <input type="text"></label>')).map((n) => [n.role, n.name])).toEqual([
      ["text", "Town"],
      ["textbox", "Town"],
    ]);
  });

  it("<progress> and <meter> are leaves named by the author", () => {
    expect(
      linearize(
        root('<progress value="40" max="100" aria-label="Progress">40%</progress><meter value="0.7" aria-label="Priority">High</meter>'),
      ).map((n) => [n.role, n.name]),
    ).toEqual([
      ["progressbar", "Progress"],
      ["meter", "Priority"],
    ]);
  });
});
