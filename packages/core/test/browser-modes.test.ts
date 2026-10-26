// @vitest-environment happy-dom
/**
 * SPEC-006: the W3C specifications by default, and `browser: "chrome"` to read the page as Chrome
 * does. Each inventory row is tested in both modes. The cases live in
 * fixtures/probes/browser-modes.html (rows 1 to 3 and 7 to 11) and fidelity-followups.html (rows
 * 4 to 6). In Chrome mode, `pnpm ax:compare` shows 0 differing lines on browser-modes.html
 * against Chrome 2026-10-26, so the Chrome values below are Chrome's own.
 */
import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { linearize, type LinearizeOptions } from "../src/index";
import { loadCase } from "./probes";

const PAGE = "browser-modes.html";
const chrome: LinearizeOptions = { browser: "chrome" };

function pairs(page: string, name: string, options: LinearizeOptions = {}) {
  const { root, getShadowRoot } = loadCase(page, name);
  return linearize(root, { getShadowRoot, ...options }).map((n) => [n.role, n.name]);
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("the browser option (AC-1)", () => {
  it("defaults to the W3C reading and accepts chrome", () => {
    document.body.innerHTML = "<table><tr><td>a</td><td>b</td></tr></table>";
    expect(linearize(document.body)[0]?.role).toBe("table");
    expect(linearize(document.body, { browser: undefined })[0]?.role).toBe("table");
    expect(linearize(document.body, chrome)[0]?.role).toBe("text");
  });

  it("throws a RangeError that names the accepted value for anything else", () => {
    document.body.innerHTML = "<p>x</p>";
    for (const browser of ["firefox", "Chrome", "", null, 1]) {
      expect(() => linearize(document.body, { browser } as unknown as LinearizeOptions)).toThrow(RangeError);
    }
    expect(() => linearize(document.body, { browser: "firefox" } as unknown as LinearizeOptions)).toThrow(
      'browser must be "chrome" or left out, not "firefox"',
    );
  });
});

describe("the inventory, each row in both modes (AC-2)", () => {
  it("row 1: HTML-AAM maps every table to table; Chrome reads a layout table as content", () => {
    expect(pairs(PAGE, "layout-table")).toEqual([
      ["table", ""],
      ["rowgroup", ""],
      ["row", "Left Right"],
      ["cell", "Left"],
      ["cell", "Right"],
    ]);
    expect(pairs(PAGE, "layout-table", chrome)).toEqual([
      ["text", "Left"],
      ["text", "Right"],
    ]);
  });

  it("row 2: HTML-AAM maps tbody to rowgroup; Chrome does not expose it", () => {
    expect(pairs(PAGE, "tbody")).toEqual([
      ["table", ""],
      ["rowgroup", ""],
      ["row", "Item"],
      ["columnheader", "Item"],
      ["rowgroup", ""],
      ["row", "Tea"],
      ["cell", "Tea"],
    ]);
    expect(pairs(PAGE, "tbody", chrome)).toEqual([
      ["table", ""],
      ["rowgroup", ""],
      ["row", ""],
      ["columnheader", "Item"],
      ["row", ""],
      ["cell", "Tea"],
    ]);
  });

  it("row 3: WAI-ARIA names a row from its content; Chrome only inside a grid", () => {
    expect(pairs(PAGE, "row-names")).toEqual([
      ["table", ""],
      ["rowgroup", ""],
      ["row", "Name Age"],
      ["columnheader", "Name"],
      ["columnheader", "Age"],
      ["row", "Ann 3"],
      ["cell", "Ann"],
      ["cell", "3"],
      ["grid", "Seats"],
      ["row", "A1 A2"],
      ["gridcell", "A1"],
      ["gridcell", "A2"],
    ]);
    expect(pairs(PAGE, "row-names", chrome)).toEqual([
      ["table", ""],
      ["row", ""],
      ["columnheader", "Name"],
      ["columnheader", "Age"],
      ["row", ""],
      ["cell", "Ann"],
      ["cell", "3"],
      ["grid", "Seats"],
      ["row", "A1 A2"],
      ["gridcell", "A1"],
      ["gridcell", "A2"],
    ]);
  });

  it("row 4: AccName 1.2 keeps every descendant's text in a name from content; Chrome leaves some roles out", () => {
    const page = "fidelity-followups.html";
    // The default is pinned in fidelity-followups.test.ts; the Chrome values are from Chrome's
    // tree and Chromium SupportsNameFromContents(recursive=true).
    expect(pairs(page, "name-from-content", chrome)).toEqual([
      ["button", "Save"],
      ["status", ""],
      ["text", "3"],
      ["button", "Send"],
      ["group", ""],
      ["text", "to all"],
      ["button", "Open menu"],
      ["list", ""],
      ["listitem", ""],
      ["text", "menu"],
      ["button", "Mark read"],
      ["region", "read"],
      ["text", "unread"],
      ["link", "Go"],
      ["note", ""],
      ["text", "new"],
      ["heading", "Orders"],
      ["alert", ""],
      ["text", "1 failed"],
      ["button", "Show more details"],
      ["group", ""],
      ["button", "more"],
      ["text", "details"],
    ]);
    // A label's content follows the same rule; inside aria-labelledby Chrome keeps all content.
    expect(pairs(page, "label-name", chrome)).toEqual([
      ["text", "Qty"],
      ["status", ""],
      ["text", "3"],
      ["textbox", "Qty"],
      ["text", "Total"],
      ["status", ""],
      ["text", "9"],
      ["textbox", "Total 9"],
    ]);
    expect(pairs(page, "name-from-content")[0]).toEqual(["button", "Save 3"]);
  });

  it("row 5: HTML-AAM 4.1 falls back to title and placeholder after an empty label; Chrome gives no name", () => {
    const { root } = loadCase("fidelity-followups.html", "empty-labels");
    const read = (options: LinearizeOptions) =>
      linearize(root, options).map((n) => [n.role, n.name, n.flags?.unnamed ?? false]);
    expect(read(chrome)).toEqual([
      ["textbox", "", true],
      ["textbox", "", true],
      ["textbox", "", true],
      ["textbox", "", true],
      ["checkbox", "", true],
      ["combobox", "", true],
      ["textbox", "Empty aria-label", false],
      ["textbox", "Empty labelledby", false],
      ["img", "Search", false],
      ["textbox", "Search", false],
    ]);
    expect(read({}).slice(0, 2)).toEqual([
      ["textbox", "Empty for", false],
      ["textbox", "Empty wrap", false],
    ]);
  });

  it("row 6: ARIA in HTML scopes a header by role=region; Chrome does not", () => {
    const at = (out: string[][]) => out.slice(out.findIndex(([role, name]) => role === "region" && name === "Updates"));
    expect(at(pairs("fidelity-followups.html", "header-scope")).slice(0, 3)).toEqual([
      ["region", "Updates"],
      ["sectionheader", ""],
      ["text", "Region header"],
    ]);
    expect(at(pairs("fidelity-followups.html", "header-scope", chrome)).slice(0, 3)).toEqual([
      ["region", "Updates"],
      ["banner", ""],
      ["text", "Region header"],
    ]);
  });

  it("row 7: WAI-ARIA names a term by its author only; Chrome names it from its content", () => {
    expect(pairs(PAGE, "term")).toEqual([
      ["term", ""],
      ["text", "Zone"],
      ["definition", ""],
      ["text", "Valletta"],
    ]);
    expect(pairs(PAGE, "term", chrome)).toEqual([
      ["term", "Zone"],
      ["text", "Zone"],
      ["definition", ""],
      ["text", "Valletta"],
    ]);
  });

  it("row 8: a label's text is read as text; Chrome reads a checkbox or radio label only as its name", () => {
    expect(pairs(PAGE, "toggle-labels")).toEqual([
      ["checkbox", "Weekdays"],
      ["text", "Weekdays"],
      ["text", "Yes"],
      ["radio", "Yes"],
      ["text", "Town"],
      ["textbox", "Town"],
    ]);
    expect(pairs(PAGE, "toggle-labels", chrome)).toEqual([
      ["checkbox", "Weekdays"],
      ["radio", "Yes"],
      ["text", "Town"],
      ["textbox", "Town"],
    ]);
  });

  it("rows 9 and 11: SVG-AAM makes every svg root a graphics-document; Chrome an image when nothing inside is readable", () => {
    // Both modes, as SVG-AAM and Chrome agree: svg <text> is read as a block of text, a shape or
    // group with a name is a node, a <title> is never read as text, role=img hides the content,
    // and an svg inside a link is a node of its own.
    expect(pairs(PAGE, "svg")).toEqual([
      ["graphics-document", "Chart"],
      ["text", "Q1"],
      ["graphics-document", "Logo"],
      ["graphics-document", ""],
      ["graphics-document", ""],
      ["graphics-document", ""],
      ["text", "One"],
      ["text", "Two"],
      ["graphics-document", "Map"],
      ["graphics-symbol", "Dot"],
      ["group", "Group"],
      // SVG-AAM 4.1.1: nothing inside defs is exposed (row 11).
      ["graphics-document", ""],
      ["graphics-symbol", ""],
      ["img", "Badge"],
      ["link", "Home"],
      ["graphics-document", ""],
    ]);
    expect(pairs(PAGE, "svg", chrome)).toEqual([
      ["graphics-document", "Chart"],
      ["text", "Q1"],
      ["img", "Logo"],
      ["img", ""],
      // An unnamed svg with no element children is left out.
      ["graphics-document", ""],
      ["text", "One"],
      ["text", "Two"],
      ["graphics-document", "Map"],
      ["graphics-symbol", "Dot"],
      ["group", "Group"],
      ["graphics-document", ""],
      ["text", "Template"], // Chrome reads text inside defs (row 11)
      ["graphics-symbol", ""],
      ["img", "Badge"],
      ["link", "Home"],
      ["img", ""],
    ]);
  });

  it("row 10: HTML's table model decides a scope-less th; Chrome decides from its neighbours", () => {
    const headers = (options: LinearizeOptions = {}) =>
      pairs(PAGE, "th-scope", options).filter(([role]) => /header$|^cell$/.test(role!));
    // HTML: a header is a column header only when no data cell shares its row, a row header only
    // when none shares its column; otherwise HTML-AAM maps it to cell. An empty corner td is a
    // data cell, so it turns Q1, Q2, and East into cells.
    expect(headers()).toEqual([
      ["cell", ""],
      ["cell", "Q1"],
      ["cell", "Q2"],
      ["cell", "East"],
      ["cell", "5"],
      ["cell", "6"],
      ["cell", "1"],
      ["cell", "Mid"],
      ["cell", "2"],
      ["cell", "3"],
      ["cell", "4"],
      ["cell", "5"],
      ["cell", "A"],
      ["cell", "B"],
      ["cell", "1"],
      ["cell", "2"],
      ["cell", "3"],
      ["cell", "4"],
    ]);
    expect(headers(chrome)).toEqual([
      ["cell", ""],
      ["columnheader", "Q1"],
      ["columnheader", "Q2"],
      ["rowheader", "East"],
      ["cell", "5"],
      ["cell", "6"],
      ["cell", "1"],
      ["rowheader", "Mid"],
      ["cell", "2"],
      ["cell", "3"],
      ["cell", "4"],
      ["cell", "5"],
      ["rowheader", "A"],
      ["rowheader", "B"],
      ["cell", "1"],
      ["cell", "2"],
      ["cell", "3"],
      ["cell", "4"],
    ]);
  });

  it("row 10: both rules agree on a header row over a header column, and on a spanning header", () => {
    const headers = (options: LinearizeOptions = {}) =>
      pairs(PAGE, "th-agree", options).filter(([role]) => /header$/.test(role!));
    const expected = [
      ["columnheader", "Name"],
      ["columnheader", "Age"],
      ["rowheader", "Ann"],
      ["columnheader", "Wide"],
      ["rowheader", "R"],
    ];
    expect(headers()).toEqual(expected);
    expect(headers(chrome)).toEqual(expected);
  });
});

describe("markup outside the inventory reads the same in both modes (AC-3)", () => {
  // Each probe case from SPEC-003, SPEC-004, and the fidelity follow-ups, except those that hold
  // an inventory row (named here with the row).
  const INVENTORY_CASES: Record<string, string[]> = {
    "fidelity-followups.html": ["name-from-content", "label-name", "empty-labels", "header-scope"], // rows 4, 5, 6
    "web-components.html": ["labels"], // row 8
  };
  const pages = ["web-components.html", "frames.html", "live-regions.html", "fidelity-followups.html"];
  for (const page of pages) {
    const html = readFileSync(join(__dirname, "fixtures", "probes", page), "utf8");
    const cases = [...html.matchAll(/data-case="([^"]+)"/g)].map((m) => m[1]!);
    for (const name of cases.filter((c) => !INVENTORY_CASES[page]?.includes(c))) {
      it(`${page} ${name}`, () => {
        const { root, getShadowRoot } = loadCase(page, name);
        expect(linearize(root, { getShadowRoot, ...chrome })).toEqual(linearize(root, { getShadowRoot }));
      });
    }
  }
});

describe("the mode reaches shadow roots and frames (AC-5)", () => {
  it("reads a table in a shadow root and in a frame by the chosen mode", () => {
    expect(pairs(PAGE, "shadow-frame")).toEqual([
      ["table", ""],
      ["rowgroup", ""],
      ["row", "In shadow"],
      ["cell", "In"],
      ["cell", "shadow"],
      ["document", "Framed"],
      ["table", ""],
      ["rowgroup", ""],
      ["row", "In frame"],
      ["cell", "In"],
      ["cell", "frame"],
    ]);
    expect(pairs(PAGE, "shadow-frame", chrome)).toEqual([
      ["text", "In"],
      ["text", "shadow"],
      ["document", "Framed"],
      ["text", "In"],
      ["text", "frame"],
    ]);
  });
});
