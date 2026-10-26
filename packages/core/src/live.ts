import { aria, roles } from "aria-query";
import type { LiveRegion } from "./types";

/**
 * Live-region resolution (SPEC-004 §3). The valid tokens and each role's implicit `aria-live` and
 * `aria-atomic` come from `aria-query`, so nothing here re-derives WAI-ARIA's tables.
 */

type PropDef = { values?: readonly string[] };
const propMap = aria as unknown as { get(key: string): PropDef | undefined };
const roleMap = roles as unknown as { get(key: string): { props?: Record<string, unknown> } | undefined };

type Relevant = LiveRegion["relevant"][number];
// The fixed output order of `relevant`; `all` expands to every one of them.
const RELEVANT_ORDER: readonly Relevant[] = ["additions", "removals", "text"];
const DEFAULT_RELEVANT: readonly Relevant[] = ["additions", "text"];

const LIVE_TOKENS = new Set(propMap.get("aria-live")?.values ?? []);
const RELEVANT_TOKENS = new Set(propMap.get("aria-relevant")?.values ?? []);
const BOOLEAN_TOKENS = new Set(["true", "false"]);

/**
 * The live region an element sets up, or undefined when it is not one. An explicit, valid
 * `aria-live` wins over the role's implicit value; `off` means not a live region. An invalid
 * token is treated as absent, as WAI-ARIA asks (Chrome passes it through as written).
 */
export function liveRegionOf(el: Element, role: string | null): LiveRegion | undefined {
  const implicit = role ? roleMap.get(role)?.props : undefined;
  const politeness = token(el.getAttribute("aria-live"), LIVE_TOKENS) ?? stringProp(implicit?.["aria-live"]);
  if (politeness !== "polite" && politeness !== "assertive") return undefined;

  const atomicAttr = token(el.getAttribute("aria-atomic"), BOOLEAN_TOKENS);
  const atomic = (atomicAttr ?? stringProp(implicit?.["aria-atomic"])) === "true";

  const region: LiveRegion = { politeness, atomic, relevant: relevantOf(el.getAttribute("aria-relevant")) };
  if (el.getAttribute("aria-busy")?.trim().toLowerCase() === "true") region.busy = true;
  return region;
}

/** The value lower-cased and trimmed when it is one of the valid tokens, else undefined. */
function token(value: string | null, valid: ReadonlySet<string>): string | undefined {
  const v = value?.trim().toLowerCase();
  return v && valid.has(v) ? v : undefined;
}

function stringProp(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** `aria-relevant`: valid tokens in the fixed order, `all` expanded, the default when none is valid. */
function relevantOf(value: string | null): Relevant[] {
  const tokens = new Set((value ?? "").trim().toLowerCase().split(/\s+/).filter((t) => RELEVANT_TOKENS.has(t)));
  if (tokens.size === 0) return [...DEFAULT_RELEVANT];
  return RELEVANT_ORDER.filter((t) => tokens.has("all") || tokens.has(t));
}
