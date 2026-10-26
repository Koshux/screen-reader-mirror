// @vitest-environment happy-dom
/**
 * Golden fixtures from realistic pages (#6). Each fragment under fixtures/pages has an
 * expected.json produced by running the engine inside Chrome (scripts/ax-compare.mjs
 * --write-expected) after its comparison with Chrome's own accessibility tree was reviewed and
 * every remaining difference was either fixed or pinned with a reason in the log.
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
    it(`${page} matches the output reviewed against Chrome`, () => {
      document.body.innerHTML = readFileSync(join(dir, `${page}.html`), "utf8");
      const expected = JSON.parse(readFileSync(join(dir, `${page}.expected.json`), "utf8"));
      expect(linearize(document.body)).toEqual(expected);
    });
  }
});
