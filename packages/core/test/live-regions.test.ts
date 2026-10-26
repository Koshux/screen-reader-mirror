// @vitest-environment happy-dom
/**
 * SPEC-004: live regions. Each case lives in fixtures/probes/live-regions.html, which is also
 * compared with Chrome's accessibility tree (`pnpm ax:compare`); the expected output below agrees
 * with Chrome except where a test says otherwise.
 */
import { describe, it, expect, afterEach } from "vitest";
import { linearize, type InterpretationNode, type LiveRegion } from "../src/index";
import { loadCase } from "./probes";

const PAGE = "live-regions.html";
const read = (name: string) => {
  const { root, getShadowRoot } = loadCase(PAGE, name);
  return linearize(root, { getShadowRoot });
};
const triples = (name: string) => read(name).map((n) => [n.role, n.name, n.live]);

const polite: LiveRegion = { politeness: "polite", atomic: false, relevant: ["additions", "text"] };
const assertive: LiveRegion = { politeness: "assertive", atomic: false, relevant: ["additions", "text"] };
const atomic = (region: LiveRegion): LiveRegion => ({ ...region, atomic: true });

afterEach(() => {
  document.body.innerHTML = "";
});

describe("live regions (SPEC-004)", () => {
  it("emits a role-less or paragraph live region as a node with its politeness (AC-1)", () => {
    expect(triples("explicit")).toEqual([
      ["generic", "", polite],
      ["text", "Saved", undefined],
      ["generic", "", assertive],
      ["text", "Card declined", undefined],
      ["paragraph", "", polite],
      ["text", "Basket total 12 euro", undefined],
    ]);
  });

  it("gives alert, status, log, and output their implicit values, and timer and marquee none (AC-2)", () => {
    expect(triples("implicit")).toEqual([
      ["alert", "", atomic(assertive)],
      ["text", "Payment failed", undefined],
      ["status", "", atomic(polite)],
      ["text", "Address saved", undefined],
      ["log", "", polite],
      ["text", "Line one", undefined],
      ["status", "", atomic(polite)],
      ["text", "42", undefined],
      ["timer", "", undefined],
      ["text", "10:00", undefined],
      ["marquee", "", undefined],
      ["text", "Headlines", undefined],
    ]);
  });

  it("lets a valid aria-live win over the role, removes live for off, and ignores an invalid token (AC-3)", () => {
    // Chrome passes "bogus" and " ASSERTIVE " through as written. WAI-ARIA treats an invalid
    // value as absent, so the engine does: no node for the bogus div, polite for the bogus
    // status. The engine also trims and lower-cases the token, so " ASSERTIVE " is assertive.
    expect(triples("override")).toEqual([
      ["status", "", undefined],
      ["text", "Quiet status", undefined],
      ["alert", "", atomic(polite)],
      ["text", "Polite alert", undefined],
      ["text", "Off region", undefined],
      ["text", "Bogus region", undefined],
      ["status", "", atomic(polite)],
      ["text", "Bogus status", undefined],
      ["generic", "", assertive],
      ["text", "Spaced token", undefined],
    ]);
  });

  it("takes atomic from aria-atomic, then the role, then false (AC-4)", () => {
    expect(read("atomic").filter((n) => n.live).map((n) => n.live?.atomic)).toEqual([true, false, false, false]);
  });

  it("lists relevant changes in a fixed order, expands all, and falls back to the default (AC-5)", () => {
    expect(read("relevant").filter((n) => n.live).map((n) => n.live?.relevant)).toEqual([
      ["additions", "text"],
      ["additions", "removals", "text"],
      ["removals"],
      ["additions", "text"],
      ["additions", "text"],
    ]);
  });

  it("marks busy only for aria-busy=true (AC-6)", () => {
    expect(triples("busy")).toEqual([
      ["generic", "", { ...polite, busy: true }],
      ["text", "Loading results", undefined],
      ["generic", "", polite],
      ["text", "Results ready", undefined],
    ]);
  });

  it("emits an empty live region with nothing after it (AC-7)", () => {
    expect(read("empty")).toEqual([{ role: "generic", name: "", ref: { tag: "div" }, live: polite }]);
  });

  it("emits nothing for a live region hidden from assistive technology (AC-8)", () => {
    expect(triples("hidden")).toEqual([["text", "Visible text", undefined]]);
  });

  it("gives nested regions each their own value (AC-9)", () => {
    expect(triples("nested")).toEqual([
      ["generic", "", polite],
      ["text", "Outer message", undefined],
      ["generic", "", assertive],
      ["text", "Inner message", undefined],
    ]);
  });

  it("represents a live region in a shadow tree and in a frame with the SPEC-003 markers (AC-10)", () => {
    const out = read("shadow-frame");
    const status = (n: InterpretationNode) => n.role === "status";
    expect(out.filter(status)).toEqual([
      { role: "status", name: "", ref: { tag: "div", shadow: true }, live: atomic(polite) },
      { role: "status", name: "", ref: { tag: "div", frame: 1 }, live: atomic(polite) },
    ]);
  });

  it("carries live on any role and no live field on nodes that are not live regions (AC-11)", () => {
    expect(triples("plain")).toEqual([
      ["text", "Plain paragraph", undefined],
      ["text", "Plain span", undefined],
      ["region", "Updates", polite],
      ["text", "Named live section", undefined],
      ["button", "Live button", polite],
      // aria-live is a global attribute, so it overrides presentation and the div keeps its
      // implicit role: none, so it is a generic live region, as in Chrome.
      ["generic", "", polite],
      ["text", "Presentation region", undefined],
      // A live label is a node, and Chrome keeps its text as well as the checkbox name, so the
      // text is read on its own here, unlike a label that is not live.
      ["generic", "", polite],
      ["checkbox", "Accept terms", undefined],
      ["text", "Accept terms", undefined],
      ["document", "Live frame", polite],
      ["text", "Frame text", undefined],
    ]);
    expect(read("plain").slice(0, 2).every((n) => !("live" in n))).toBe(true);
  });

  it("does not read a live region's text again inside a heading, link, or button (AC-12)", () => {
    expect(triples("inside-name")).toEqual([
      ["button", "Items 3", undefined],
      ["generic", "", polite],
      ["heading", "Results 5", undefined],
      ["generic", "", polite],
      ["link", "Basket 2", undefined],
      ["generic", "", polite],
    ]);
  });

  it("ends the text run at the edges of an inline live region, as Chrome does (§3)", () => {
    expect(triples("inline")).toEqual([
      ["text", "Total:", undefined],
      ["generic", "", polite],
      ["text", "12", undefined],
      ["text", "items", undefined],
    ]);
  });
});
