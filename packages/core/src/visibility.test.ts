// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { isHiddenFromAT } from "./visibility";

/** Build an element from an HTML string and attach it so it has a document view. */
function el(html: string): Element {
  const host = document.createElement("div");
  host.innerHTML = html;
  const child = host.firstElementChild;
  if (!child) throw new Error("fixture produced no element");
  document.body.appendChild(host);
  return child;
}

describe("isHiddenFromAT (SPEC-001 AC-3)", () => {
  it("a plain visible element is not hidden", () => {
    expect(isHiddenFromAT(el("<p>hi</p>"))).toBe(false);
  });

  it('aria-hidden="true" hides; aria-hidden="false" does not', () => {
    expect(isHiddenFromAT(el('<div aria-hidden="true">x</div>'))).toBe(true);
    expect(isHiddenFromAT(el('<div aria-hidden="false">x</div>'))).toBe(false);
  });

  it('the hidden attribute hides; hidden="until-found" stays in the tree', () => {
    expect(isHiddenFromAT(el("<div hidden>x</div>"))).toBe(true);
    expect(isHiddenFromAT(el('<div hidden="until-found">x</div>'))).toBe(false);
  });

  it("display:none hides", () => {
    expect(isHiddenFromAT(el('<div style="display:none">x</div>'))).toBe(true);
  });

  it("visibility:hidden hides", () => {
    expect(isHiddenFromAT(el('<div style="visibility:hidden">x</div>'))).toBe(true);
  });

  it("is host-agnostic: honours an injected getComputedStyle", () => {
    const node = el("<span>x</span>");
    const hidden = isHiddenFromAT(node, {
      getComputedStyle: () => ({ display: "none", visibility: "visible" }) as CSSStyleDeclaration,
    });
    expect(hidden).toBe(true);
  });

  it("fails open (visible) if computing style throws", () => {
    const node = el("<span>x</span>");
    const hidden = isHiddenFromAT(node, {
      getComputedStyle: () => {
        throw new Error("boom");
      },
    });
    expect(hidden).toBe(false);
  });
});
