// @vitest-environment happy-dom
/**
 * Fidelity follow-ups found while probing for SPEC-003, SPEC-004, and SPEC-005. Each case lives in
 * fixtures/probes/fidelity-followups.html, which is also compared with Chrome's accessibility tree
 * (`pnpm ax:compare`). The engine follows the W3C specifications first; where Chrome differs, the
 * test says what Chrome gives, and test/browser-modes.test.ts checks it in Chrome mode
 * (SPEC-006). Probed in Chrome on 2026-10-26.
 */
import { describe, it, expect, afterEach } from "vitest";
import { linearize } from "../src/index";
import { loadCase } from "./probes";

const PAGE = "fidelity-followups.html";
const pairs = (name: string) => linearize(loadCase(PAGE, name).root).map((n) => [n.role, n.name]);

afterEach(() => {
  document.body.innerHTML = "";
});

describe("names from content follow AccName 1.2", () => {
  it("keeps the content of a status, group, note, or alert in a name built from content", () => {
    // AccName 1.2 (recursive name from content) takes every descendant's text, whatever its role.
    // Chrome leaves out the content of roles that do not count toward an ancestor's name
    // (Chromium SupportsNameFromContents, recursive): it gives "Save", "Send", "Go", and "Orders".
    // Pinned difference; Chrome mode applies it (SPEC-006 row 4).
    // A button has presentational children (WAI-ARIA 1.2 §5.2.9), so it is a name scope
    // (SPEC-007): text that went into its name is not read again inside it, at any depth. A link
    // and a heading are not, so each emitted container inside them starts a fresh text context
    // (SPEC-001 §3) and the note's and alert's text is read again after the name.
    expect(pairs("name-from-content")).toEqual([
      ["button", "Save 3"],
      ["status", ""],
      ["button", "Send to all"],
      ["group", ""],
      ["button", "Open menu"],
      ["list", ""],
      ["listitem", ""],
      ["button", "Mark read"], // an author name stands in for the region's content, in both
      ["region", "read"],
      ["text", "unread"],
      ["link", "Go new"],
      ["note", ""],
      ["text", "new"],
      ["heading", "Orders 1 failed"],
      ["alert", ""],
      ["text", "1 failed"],
      ["button", "Show more details"],
      ["group", ""],
      ["button", "more"],
    ]);
  });

  it("does the same for a label's content and for aria-labelledby", () => {
    // Chrome gives the first field "Qty" (the status left out) and the second "Total 9".
    expect(pairs("label-name")).toEqual([
      ["text", "Qty"],
      ["status", ""],
      ["text", "3"],
      ["textbox", "Qty 3"],
      ["text", "Total"],
      ["status", ""],
      ["text", "9"],
      ["textbox", "Total 9"],
    ]);
  });
});

describe("a role with presentational children reads its name once (SPEC-007)", () => {
  it("does not read text again that went into the name, and keeps the nodes inside (AC-1 to AC-3)", () => {
    // WAI-ARIA 1.2 §5.2.9: descendants of button, tab, option, and the other roles with
    // presentational children are not to be exposed, else "some information may be read twice".
    // The nodes stay (SPEC-001: a missing-alt image inside a button is what a developer needs to
    // see); their text, already in the name, is not read again. Chrome's tree keeps them too.
    const both = [
      ["button", "Pick red blue"],
      ["list", ""],
      ["listitem", ""],
      ["listitem", ""],
      ["button", "Save file"],
      ["img", ""],
      ["button", "Card Read more"],
      ["link", "Read"],
      ["tablist", ""],
      ["tab", "Tab one"],
      ["list", ""],
      ["listitem", ""],
      ["listbox", "Colour"],
    ];
    const rest = [
      // A list named by its author did not give its content to the name: its item is read.
      ["button", "Inbox unread"],
      ["list", "unread"],
      ["listitem", ""],
      ["text", "4"],
      // A button with an author name reads as before (SPEC-007 keeps today's reading there).
      ["button", "Close"],
      ["list", ""],
      ["listitem", ""],
      ["text", "x"],
      // A link and a heading do not have presentational children: unchanged (AC-3).
      ["link", "Link item"],
      ["list", ""],
      ["listitem", ""],
      ["text", "item"],
      ["heading", "Head entry"],
      ["list", ""],
      ["listitem", ""],
      ["text", "entry"],
    ];
    // AccName 1.2 keeps a group's content in the option's name; Chrome leaves it out (row 4) and
    // reads it as text (AC-2).
    expect(pairs("name-scope")).toEqual([...both, ["option", "Opt grouped"], ["group", ""], ...rest]);
    const inChrome = linearize(loadCase(PAGE, "name-scope").root, { browser: "chrome" }).map((n) => [n.role, n.name]);
    expect(inChrome).toEqual([...both, ["option", "Opt"], ["group", ""], ["text", "grouped"], ...rest]);
    const img = linearize(loadCase(PAGE, "name-scope").root).find((n) => n.role === "img");
    expect(img?.flags).toEqual({ missingAlt: true });
  });

  it("spaces inline elements in a name in the test DOM, where Chrome does not (AC-7)", () => {
    // The test DOM gives a span or b no computed display, and the name library puts a space
    // around anything that is not display: inline. Chrome, and the engine running in Chrome,
    // give "Savenow" and "Boldtext" (pnpm ax:compare, 2026-10-28). A test-environment artefact,
    // pinned rather than worked around; the name-spacing case sets display: inline to test the
    // browser result.
    for (const options of [{}, { browser: "chrome" as const }]) {
      const out = linearize(loadCase(PAGE, "name-spacing-test-dom").root, options);
      expect(out.map((n) => n.name)).toEqual(["Save now", "Bold text"]);
    }
  });
});

describe("a field with only empty labels follows HTML-AAM", () => {
  it("falls back to the title, then the placeholder", () => {
    // HTML-AAM 4.1: when the associated label gives an empty name, use the title, then the
    // placeholder. Chrome uses neither once a label is associated and gives the first six fields
    // no name. Pinned difference. An empty aria-label or aria-labelledby target falls back to the
    // placeholder in both.
    const out = linearize(loadCase(PAGE, "empty-labels").root);
    expect(out.map((n) => [n.role, n.name, n.flags?.unnamed ?? false])).toEqual([
      ["textbox", "Empty for", false],
      ["textbox", "Empty wrap", false],
      ["textbox", "Hidden text", false],
      ["textbox", "Title only", false],
      ["checkbox", "Check title", false],
      ["combobox", "Select title", false],
      ["textbox", "Empty aria-label", false],
      ["textbox", "Empty labelledby", false],
      ["img", "Search", false],
      ["textbox", "Search", false],
    ]);
  });
});

describe("header, footer, and aside scoping follow HTML-AAM and ARIA in HTML", () => {
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
      // A sectioning root does not scope: ARIA in HTML does not list it, and Chrome agrees.
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
      // ARIA in HTML lists role=region as scoping. Chrome does not and gives a banner here.
      // Pinned difference.
      ["region", "Updates"],
      ["sectionheader", ""],
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
      // The page shows a space between the two inline-block spans. Chrome's tree drops that
      // whitespace text node, so the oracle reads "Sameline"; the engine keeps the space.
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
  it("lets an injected style make a two-by-two table a data table in Chrome mode", () => {
    document.body.innerHTML =
      '<div id="r"><table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table></div>';
    const root = document.getElementById("r")!;
    expect(linearize(root, { browser: "chrome" }).map((n) => n.role)).toEqual(["text", "text", "text", "text"]);
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
    expect(linearize(root, { getComputedStyle: bordered, browser: "chrome" }).map((n) => n.role)).toEqual([
      "table", "row", "cell", "cell", "row", "cell", "cell",
    ]);
  });
});
