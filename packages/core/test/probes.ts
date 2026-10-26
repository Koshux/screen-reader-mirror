/**
 * Load one case from a probe page under fixtures/probes (SPEC-003). The same page is what
 * `pnpm ax:compare` loads in Chrome, so a unit fixture and its Chrome check share one source.
 *
 * Chrome parses declarative shadow roots (`<template shadowrootmode>`); the test DOM does not,
 * so they are attached here in code. Closed roots are kept aside and returned through
 * `getShadowRoot`, the way the extension will supply them.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface ProbeCase {
  root: Element;
  getShadowRoot: (host: Element) => ShadowRoot | undefined;
}

export function loadCase(page: string, name: string): ProbeCase {
  const doc = globalThis.document;
  doc.body.innerHTML = readFileSync(join(__dirname, "fixtures", "probes", page), "utf8");
  const closed = new Map<Element, ShadowRoot>();
  attachDeclarativeRoots(doc.body, closed);
  const root = doc.querySelector(`[data-case="${name}"]`);
  if (!root) throw new Error(`no case "${name}" in ${page}`);
  return { root, getShadowRoot: (host) => closed.get(host) };
}

function attachDeclarativeRoots(scope: ParentNode, closed: Map<Element, ShadowRoot>): void {
  for (const template of Array.from(scope.querySelectorAll("template[shadowrootmode]"))) {
    const host = template.parentElement;
    if (!host) continue;
    const mode = template.getAttribute("shadowrootmode") === "closed" ? "closed" : "open";
    const shadow = host.attachShadow({ mode });
    shadow.appendChild((template as HTMLTemplateElement).content.cloneNode(true));
    template.remove();
    if (mode === "closed") closed.set(host, shadow);
    attachDeclarativeRoots(shadow, closed);
  }
}
