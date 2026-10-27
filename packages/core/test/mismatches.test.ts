// @vitest-environment happy-dom
/**
 * SPEC-005: visual-versus-semantic mismatches from `interpret()`. The cases live in
 * fixtures/probes/mismatches.html, which `pnpm ax:compare` also runs in Chrome (AC-17), where
 * browser default styles and em sizes apply. Here the style comes from the page's px CSS or from
 * the `getComputedStyle` option. Each heuristic is checked in both modes; where the reading
 * differs by mode, the mismatch may too (SPEC-005 backfill from SPEC-006).
 */
import { describe, it, expect, afterEach } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { interpret, linearize, type LinearizeOptions } from "../src/index";
import { loadCase } from "./probes";

const PAGE = "mismatches.html";
const chrome: LinearizeOptions = { browser: "chrome" };
const BOTH: Array<[string, LinearizeOptions]> = [["default", {}], ["chrome", chrome]];

/** Each mismatch as [kind, at, end, tag, signals]. */
function marks(name: string, options: LinearizeOptions = {}) {
  const { root, getShadowRoot } = loadCase(PAGE, name);
  return interpret(root, { getShadowRoot, ...options }).mismatches.map((m) => [m.kind, m.at, m.end, m.ref.tag, m.signals]);
}

/** The same in both modes. */
function marksInBoth(name: string) {
  const inDefault = marks(name);
  expect(marks(name, chrome)).toEqual(inDefault);
  return inDefault;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("the output (AC-1 to AC-5)", () => {
  it("returns nodes equal to linearize in both modes, on every probe case (AC-1, SPEC-006 AC-7)", () => {
    const dir = join(__dirname, "fixtures", "probes");
    let checked = 0;
    for (const page of readdirSync(dir).filter((f) => f.endsWith(".html"))) {
      const html = readFileSync(join(dir, page), "utf8");
      for (const [, name] of html.matchAll(/data-case="([^"]+)"/g)) {
        for (const [, options] of BOTH) {
          const { root, getShadowRoot } = loadCase(page, name!);
          const opts = { getShadowRoot, ...options };
          expect(interpret(root, opts).nodes, `${page} ${name}`).toEqual(linearize(root, opts));
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it("takes the browser option as linearize does and rejects other values (AC-1)", () => {
    document.body.innerHTML = "<table><tr><td>a</td><td>b</td></tr></table>";
    expect(interpret(document.body).nodes[0]?.role).toBe("table");
    expect(interpret(document.body, chrome).nodes[0]?.role).toBe("text");
    expect(() => interpret(document.body, { browser: "firefox" } as unknown as LinearizeOptions)).toThrow(RangeError);
  });

  it("gives each mismatch kind, at, end, ref, and signals (AC-2)", () => {
    expect(marks("heading-inline")).toEqual([["looks-like-heading", 1, 2, "span", ["font-size"]]]);
    expect(marks("table-grid")).toEqual([["looks-like-table", 0, 9, "div", ["grid-layout", "cell-borders"]]]);
    // An element with no content: at equals end, where its content would have been.
    expect(marks("click-empty")).toEqual([["clickable-not-button", 1, 1, "div", ["click-attribute"]]]);
    // An inline element covers the run its text joins, which starts before it.
    expect(marks("click-inline")).toEqual([["clickable-not-button", 0, 1, "span", ["click-attribute"]]]);
    const { root } = loadCase(PAGE, "click-missing-alt");
    const result = interpret(root);
    expect(result.mismatches[0]).toEqual({ kind: "clickable-not-button", at: 0, end: 1, ref: { tag: "div" }, signals: ["click-attribute"] });
    expect(result.nodes[0]).toMatchObject({ role: "img", flags: { missingAlt: true } });
  });

  it("reports one mismatch per element chain, outer first, ordered by at (AC-3)", () => {
    // Large clickable text is one mismatch, not a heading as well.
    expect(marksInBoth("click-heading")).toEqual([["clickable-not-button", 0, 1, "div", ["click-attribute"]]]);
    // Nested grids report the outer one only.
    expect(marksInBoth("table-nested")).toEqual([["looks-like-table", 0, 7, "div", ["grid-layout", "cell-borders"]]]);
    // Large header cells of a fake table are not reported as headings as well.
    expect(marksInBoth("table-big-header")).toEqual([["looks-like-table", 0, 6, "div", ["row-layout", "header-row"]]]);
    const ats = marks("click").map((m) => m[1] as number);
    expect(ats).toEqual([...ats].sort((a, b) => a - b));
  });

  it("skips hidden content and checks shadow trees and frames with their refs (AC-4)", () => {
    expect(marksInBoth("hidden")).toEqual([]);
    expect(marksInBoth("shadow")).toEqual([
      ["clickable-not-button", 0, 1, "div", ["click-attribute"]],
      ["field-without-label", 1, 2, "input", ["no-name", "nearby-text"]],
    ]);
    const { root, getShadowRoot } = loadCase(PAGE, "shadow");
    expect(interpret(root, { getShadowRoot }).mismatches.map((m) => m.ref)).toEqual([
      { tag: "div", shadow: true },
      { tag: "input", shadow: true },
    ]);
    const frame = loadCase(PAGE, "frame");
    expect(interpret(frame.root).mismatches.map((m) => [m.kind, m.at, m.ref])).toEqual([
      ["clickable-not-button", 1, { tag: "div", frame: 1 }],
      ["field-without-label", 2, { tag: "input", frame: 1 }],
    ]);
  });

  it("reads style through the option, once per element, and fires no style signal without it (AC-5)", () => {
    // An injected style decides a heading both ways: a bare <strong> is bold only in a browser.
    const { root } = loadCase(PAGE, "browser-only");
    const onP = (options: LinearizeOptions) => interpret(root, options).mismatches.filter((m) => m.ref.tag === "p");
    expect(onP({})).toEqual([]);
    const boldStrong: LinearizeOptions = {
      getComputedStyle: (el) => {
        const real = window.getComputedStyle(el);
        if (el.tagName.toLowerCase() !== "strong") return real;
        return new Proxy(real, {
          get: (target, prop) => {
            if (prop === "fontWeight") return "700";
            const value = Reflect.get(target, prop, target) as unknown;
            return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(target) : value;
          },
        });
      },
    };
    expect(onP(boldStrong).map((m) => [m.kind, m.signals])).toEqual([["looks-like-heading", ["font-weight"]]]);

    // A counting source is called at most once per element in interpret.
    const click = loadCase(PAGE, "click");
    const calls = new Map<Element, number>();
    const counting = (el: Element) => {
      calls.set(el, (calls.get(el) ?? 0) + 1);
      return window.getComputedStyle(el);
    };
    interpret(click.root, { getComputedStyle: counting });
    expect(calls.size).toBeGreaterThan(0);
    expect(Math.max(...calls.values())).toBe(1);
    expect(linearize(click.root, { getComputedStyle: counting })).toEqual(linearize(click.root));

    // A source that throws: no error, no style-based signal, attribute signals still fire.
    const throwing: LinearizeOptions = {
      getComputedStyle: () => {
        throw new Error("no style");
      },
    };
    const result = interpret(click.root, throwing);
    expect(result.nodes).toEqual(linearize(click.root, throwing));
    expect(result.mismatches.map((m) => m.signals)).toEqual([
      ["click-attribute"],
      ["click-attribute"],
      ["tabindex"],
      ["click-attribute", "tabindex"],
      ["click-attribute"],
      ["click-attribute"],
    ]);
    const grid = loadCase(PAGE, "table-grid");
    expect(interpret(grid.root, throwing).mismatches).toEqual([]);
  });
});

describe("looks like a heading (AC-6 to AC-9)", () => {
  it("fires on text 1.25 times its parent's size (AC-6)", () => {
    expect(marksInBoth("heading-size")).toEqual([["looks-like-heading", 0, 1, "div", ["font-size"]]]);
    // The design brief's lone span between blocks.
    expect(marksInBoth("heading-inline")).toEqual([["looks-like-heading", 1, 2, "span", ["font-size"]]]);
  });

  it("fires on a styled live region with no role of its own, after its node (AC-6, §5)", () => {
    expect(marksInBoth("heading-live")).toEqual([["looks-like-heading", 1, 2, "div", ["font-size"]]]);
  });

  it("fires on text 1.1 times the size and bold over a plain parent (AC-7)", () => {
    expect(marksInBoth("heading-size-bold")).toEqual([["looks-like-heading", 0, 1, "div", ["font-size", "font-weight"]]]);
  });

  it("fires on bold over plain when longer plain text follows, reported on the outer element (AC-8)", () => {
    expect(marksInBoth("heading-bold")).toEqual([["looks-like-heading", 0, 1, "p", ["font-weight"]]]);
    expect(marksInBoth("heading-bold-colon")).toEqual([]);
    expect(marksInBoth("heading-bold-short")).toEqual([]);
  });

  it("reads the next node in the chosen mode: a toggle's label text is a run only by default (AC-8, row 8)", () => {
    expect(marks("heading-bold-label")).toEqual([["looks-like-heading", 0, 1, "div", ["font-weight"]]]);
    expect(marks("heading-bold-label", chrome)).toEqual([]);
  });

  it("does not fire on headings, names, labels, long or letterless text, two lines, or the parent's size (AC-9)", () => {
    expect(marksInBoth("heading-not")).toEqual([]);
    // A div > span chain is reported once, on the div.
    expect(marksInBoth("heading-chain")).toEqual([["looks-like-heading", 0, 1, "div", ["font-size"]]]);
  });
});

describe("looks like a table (AC-10, AC-11)", () => {
  it("fires on a grid, flex rows, or display: table with a presentation signal (AC-10)", () => {
    expect(marksInBoth("table-grid")).toEqual([["looks-like-table", 0, 9, "div", ["grid-layout", "cell-borders"]]]);
    expect(marksInBoth("table-rows-tint")).toEqual([["looks-like-table", 0, 6, "div", ["row-layout", "cell-backgrounds"]]]);
    expect(marksInBoth("table-display")).toEqual([["looks-like-table", 0, 4, "div", ["table-layout", "cell-borders"]]]);
    expect(marksInBoth("table-20-rows")).toEqual([["looks-like-table", 0, 40, "div", ["row-layout", "rows"]]]);
    expect(marksInBoth("table-header")).toEqual([["looks-like-table", 0, 6, "div", ["row-layout", "header-row"]]]);
  });

  it("does not fire on one row or column, card grids, plain short grids, roles, or unresolved tracks (AC-11)", () => {
    expect(marksInBoth("table-not")).toEqual([]);
    expect(marksInBoth("table-in-table")).toEqual([]);
  });

  it("does not fire on a <table> Chrome mode reads as layout, nor inside it (AC-11, operator 2026-10-27)", () => {
    const { root } = loadCase(PAGE, "table-layout-table");
    expect(linearize(root, chrome)[0]?.role).toBe("text"); // Chrome mode: layout, no table roles
    expect(marksInBoth("table-layout-table")).toEqual([]);
  });
});

describe("clickable, not a button or link (AC-12, AC-13)", () => {
  it("fires on click attributes, tabindex, and a pointer cursor, listing every signal (AC-12)", () => {
    expect(marksInBoth("click")).toEqual([
      ["clickable-not-button", 0, 1, "div", ["click-attribute"]],
      ["clickable-not-button", 1, 2, "div", ["click-attribute"]],
      ["clickable-not-button", 2, 3, "div", ["tabindex"]],
      ["clickable-not-button", 3, 4, "div", ["cursor-pointer"]],
      ["clickable-not-button", 4, 5, "div", ["click-attribute", "tabindex", "cursor-pointer"]],
      ["clickable-not-button", 5, 6, "a", ["click-attribute"]],
      ["clickable-not-button", 6, 7, "img", ["click-attribute"]],
    ]);
  });

  it("does not fire on roles, labels, cards with a link, inherited cursors, -1, scrolling regions, or script listeners (AC-13)", () => {
    // The listener added by script is not in the DOM a page can read (pinned: no mark).
    expect(marksInBoth("click-not")).toEqual([]);
    expect(marksInBoth("click-pointer-chain")).toEqual([["clickable-not-button", 0, 1, "div", ["cursor-pointer"]]]);
  });

  it("follows the role in the chosen mode: a layout table's cell has none in Chrome mode (AC-12)", () => {
    expect(marks("click-layout-cell")).toEqual([]);
    expect(marks("click-layout-cell", chrome)).toEqual([["clickable-not-button", 0, 1, "td", ["click-attribute"]]]);
  });
});

describe("field without a label (AC-14, AC-15)", () => {
  it("names what the field is named by instead, and nearby text (AC-14)", () => {
    expect(marksInBoth("field")).toEqual([
      ["field-without-label", 0, 1, "input", ["no-name"]],
      ["field-without-label", 1, 2, "input", ["title"]],
      ["field-without-label", 2, 3, "input", ["placeholder"]],
      ["field-without-label", 4, 5, "input", ["no-name", "nearby-text"]],
      ["field-without-label", 5, 6, "input", ["no-name", "nearby-text"]],
      ["field-without-label", 8, 9, "select", ["no-name", "nearby-text"]],
    ]);
  });

  it("does not take a toggle's label text for nearby text, and does take an unassociated label (AC-14)", () => {
    expect(marks("field-nearby")).toEqual([
      ["field-without-label", 2, 3, "input", ["no-name"]],
      ["field-without-label", 4, 5, "input", ["no-name", "nearby-text"]],
    ]);
    // Chrome mode does not read the toggle's label text, so the indices move; the signals do not.
    expect(marks("field-nearby", chrome)).toEqual([
      ["field-without-label", 1, 2, "input", ["no-name"]],
      ["field-without-label", 3, 4, "input", ["no-name", "nearby-text"]],
    ]);
  });

  it("does not fire with a label, aria-label, or aria-labelledby, or on buttons and hidden inputs (AC-15)", () => {
    expect(marksInBoth("field-labelled")).toEqual([]);
  });

  it("fires on an empty aria-label, an empty label, and a missing labelledby target, by the mode's name (AC-15)", () => {
    expect(marks("field-fires")).toEqual([
      ["field-without-label", 0, 1, "input", ["no-name"]],
      ["field-without-label", 1, 2, "input", ["placeholder"]],
      ["field-without-label", 2, 3, "input", ["placeholder"]],
    ]);
    // Chrome gives a field whose label is empty no name (SPEC-006 row 5).
    expect(marks("field-fires", chrome)).toEqual([
      ["field-without-label", 0, 1, "input", ["no-name"]],
      ["field-without-label", 1, 2, "input", ["no-name"]],
      ["field-without-label", 2, 3, "input", ["placeholder"]],
    ]);
  });
});
