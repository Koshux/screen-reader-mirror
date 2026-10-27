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
 */
import { describe, it, expect, afterEach } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { linearize } from "../src/index";

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
});
