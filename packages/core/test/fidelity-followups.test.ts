// @vitest-environment happy-dom
/**
 * Fidelity follow-ups found while probing for SPEC-003, SPEC-004, and SPEC-005. Each case lives in
 * fixtures/probes/fidelity-followups.html, which is also compared with Chrome's accessibility tree
 * (`pnpm ax:compare`); the expected output below agrees with Chrome except where a test says
 * otherwise. Probed in Chrome on 2026-10-26.
 */
import { describe, it, expect, afterEach } from "vitest";
import { linearize } from "../src/index";
import { loadCase } from "./probes";

const PAGE = "fidelity-followups.html";
const pairs = (name: string) => linearize(loadCase(PAGE, name).root).map((n) => [n.role, n.name]);

afterEach(() => {
  document.body.innerHTML = "";
});

describe("names from content leave out what Chrome leaves out", () => {
  it("drops the content of a status, group, note, or alert from the name and reads it once", () => {
    // Chrome (Chromium SupportsNameFromContents, recursive) keeps a descendant's content in the
    // name only for name-from-content roles, no role, and a short list (list, region, paragraph,
    // ...). AccName 1.2 step 2H keeps all of it; the mirror follows Chrome.
    expect(pairs("name-from-content")).toEqual([
      ["button", "Save"],
      ["status", ""],
      ["text", "3"],
      ["button", "Send"],
      ["group", ""],
      ["text", "to all"],
      ["button", "Open menu"],
      ["list", ""],
      ["listitem", ""],
      // Pinned: Chrome counts "menu" as part of the button's name only. The engine reads it again,
      // because each emitted container starts a fresh text context (SPEC-001 §3), as a list inside
      // a table cell does.
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
      ["text", "details"], // Pinned, as "menu" above: <details> counts toward Chrome's name.
    ]);
  });

  it("applies the same rule to a label's content, and not inside aria-labelledby", () => {
    expect(pairs("label-name")).toEqual([
      ["text", "Qty"],
      ["status", ""],
      ["text", "3"],
      ["textbox", "Qty"],
      ["text", "Total"],
      ["status", ""],
      ["text", "9"],
      ["textbox", "Total 9"],
    ]);
  });
});

describe("a field with only empty labels has no name", () => {
  it("uses neither title nor placeholder once a label is associated, as Chrome does", () => {
    // HTML-AAM falls back to title and then placeholder when the label text is empty; Chrome does
    // not, and the mirror follows Chrome. An empty aria-label or aria-labelledby target still falls
    // back to the placeholder in both.
    const out = linearize(loadCase(PAGE, "empty-labels").root);
    expect(out.map((n) => [n.role, n.name, n.flags?.unnamed ?? false])).toEqual([
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
  });
});

describe("header, footer, and aside scoping follow Chrome", () => {
  it("gives sectionheader and sectionfooter inside main or sectioning content, banner elsewhere", () => {
    expect(pairs("header-scope")).toEqual([
      ["article", ""],
      ["sectionheader", ""],
      ["text", "Article header"],
      ["sectionfooter", ""],
      ["text", "Article footer"],
      ["sectionheader", ""],
      ["text", "Section header"],
      ["main", ""],
      ["sectionheader", ""],
      ["text", "Main header"],
      ["sectionfooter", ""],
      ["text", "Main footer"],
      ["navigation", ""],
      ["sectionheader", ""],
      ["text", "Nav header"],
      ["article", ""],
      ["sectionheader", ""],
      ["text", "Role header"],
      // A sectioning root does not scope, and neither does role="region".
      ["blockquote", ""],
      ["banner", ""],
      ["text", "Quote header"],
      ["contentinfo", ""],
      ["text", "Quote footer"],
      ["figure", ""],
      ["banner", ""],
      ["text", "Figure header"],
      ["group", "Group"],
      ["text", "Group"],
      ["banner", ""],
      ["text", "Fieldset header"],
      ["region", "Updates"],
      ["banner", ""],
      ["text", "Region header"],
      // The ARIA 1.3 role is accepted when written explicitly.
      ["article", ""],
      ["sectionheader", ""],
      ["text", "Explicit header"],
    ]);
  });

  it("keeps an aside complementary inside a sectioning root, generic inside an article", () => {
    expect(pairs("aside-scope")).toEqual([
      ["blockquote", ""],
      ["complementary", ""],
      ["text", "Quote aside"],
      ["figure", ""],
      ["complementary", ""],
      ["text", "Figure aside"],
      ["article", ""],
      ["text", "Article aside"],
    ]);
  });
});

describe("text runs end where the layout starts a new line", () => {
  it("splits flex and grid items and display:block spans, and joins inline divs", () => {
    expect(pairs("text-runs")).toEqual([
      ["text", "Plan"],
      ["text", "Price"],
      ["text", "Left"],
      ["text", "Right"],
      ["text", "Own"],
      ["text", "line"],
      ["text", "Same line"],
      ["text", "Inline divs"],
    ]);
  });

  it("falls back to the tag when the display cannot be read", () => {
    const { root } = loadCase(PAGE, "text-runs");
    const out = linearize(root, { getComputedStyle: () => null });
    expect(out.map((n) => n.name)).toEqual(["PlanPrice", "LeftRight", "Ownline", "Same line", "Inline", "divs"]);
  });
});

describe("the layout-table rules read style through the getComputedStyle option", () => {
  it("lets an injected style make a two-by-two table a data table", () => {
    document.body.innerHTML =
      '<div id="r"><table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table></div>';
    const root = document.getElementById("r")!;
    expect(linearize(root).map((n) => n.role)).toEqual(["text", "text", "text", "text"]);
    const bordered = (el: Element) => {
      const real = getComputedStyle(el);
      const border = el.tagName === "TD" ? "1px" : "0px";
      return {
        display: real.display,
        visibility: real.visibility,
        backgroundColor: "",
        borderTopWidth: border,
        getPropertyValue: (p: string) => real.getPropertyValue(p),
      } as unknown as CSSStyleDeclaration;
    };
    expect(linearize(root, { getComputedStyle: bordered }).map((n) => n.role)).toEqual([
      "table", "row", "cell", "cell", "row", "cell", "cell",
    ]);
  });
});
