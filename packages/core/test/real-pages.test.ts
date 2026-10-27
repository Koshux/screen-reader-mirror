// @vitest-environment happy-dom
/**
 * Golden fixtures from realistic pages (#6, SPEC-006). Each fragment under fixtures/pages has two
 * goldens, produced by running the engine inside Chrome (scripts/ax-compare.mjs
 * --write-expected): <name>.chrome.json in Chrome mode, which agrees with Chrome's own
 * accessibility tree with 0 differing lines, and <name>.expected.json in the default reading,
 * which follows the W3C specifications and whose diff a person reviews (recorded in the log).
 *
 * This test pins the engine to that output under happy-dom, so a change in the engine or in the
 * DOM implementation shows up here. Regenerate deliberately with the script, never by hand.
 *
 * SPEC-005: `interpret()` gives the same nodes as the goldens, and exactly the mismatches listed
 * in AC-16, in both modes. The pages carry no stylesheet and happy-dom applies no browser
 * defaults, so no style-based signal fires here; Chrome's results are in the implementation log.
 */
import { describe, it, expect, afterEach } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { interpret, linearize, type LinearizeOptions } from "../src/index";

const dir = join(__dirname, "fixtures", "pages");
const pages = readdirSync(dir)
  .filter((f) => f.endsWith(".html"))
  .map((f) => f.replace(/\.html$/, ""));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("real-page golden fixtures (#6)", () => {
  it("has at least the four reviewed pages", () => {
    expect(pages).toEqual(expect.arrayContaining(["issue-tracker", "service-form", "reference-article", "component-demo"]));
  });

  for (const page of pages) {
    it(`${page} matches the reviewed default reading`, () => {
      document.body.innerHTML = readFileSync(join(dir, `${page}.html`), "utf8");
      const expected = JSON.parse(readFileSync(join(dir, `${page}.expected.json`), "utf8"));
      expect(linearize(document.body)).toEqual(expected);
    });

    it(`${page} in Chrome mode matches the output compared with Chrome`, () => {
      document.body.innerHTML = readFileSync(join(dir, `${page}.html`), "utf8");
      const expected = JSON.parse(readFileSync(join(dir, `${page}.chrome.json`), "utf8"));
      expect(linearize(document.body, { browser: "chrome" })).toEqual(expected);
    });
  }

  // AC-16: [kind, tag, signals, the text of the nodes the mismatch covers].
  const mismatches: Record<string, Array<[string, string, string[], string[]]>> = {
    "issue-tracker": [["clickable-not-button", "div", ["click-attribute"], ["img "]]],
    "component-demo": [
      [
        "clickable-not-button",
        "div",
        ["click-attribute"],
        ["text Define tokens", "text Light and dark palettes with contrast ratios.", "text In progress"],
      ],
    ],
    "service-form": [
      ["field-without-label", "input", ["placeholder"], ["textbox Vehicle registration"]],
      ["clickable-not-button", "div", ["click-attribute"], ["text Continue"]],
    ],
    "reference-article": [],
  };

  for (const [page, expected] of Object.entries(mismatches)) {
    for (const [mode, options] of [["default", {}], ["Chrome mode", { browser: "chrome" }]] as Array<[string, LinearizeOptions]>) {
      it(`${page} in ${mode}: interpret gives the golden nodes and the AC-16 mismatches (SPEC-005)`, () => {
        document.body.innerHTML = readFileSync(join(dir, `${page}.html`), "utf8");
        const golden = JSON.parse(readFileSync(join(dir, `${page}.${options.browser ? "chrome" : "expected"}.json`), "utf8"));
        const { nodes, mismatches: found } = interpret(document.body, options);
        expect(nodes).toEqual(golden);
        expect(
          found.map((m) => [m.kind, m.ref.tag, m.signals, nodes.slice(m.at, m.end).map((n) => `${n.role} ${n.name}`)]),
        ).toEqual(expected);
      });
    }
  }
});
