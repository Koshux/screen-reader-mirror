// @vitest-environment happy-dom
/**
 * SPEC-001 AC-7 — the *built* package is what npm and the CDN serve, so exercise it the way a
 * consumer does: import the bundle, run it on a DOM, and check the package contract (ESM,
 * side-effect-free, externalised deps, no Node/network globals). Requires `pnpm build` first;
 * `pnpm verify` and CI build before testing.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type * as Core from "../src/index";

const pkgDir = resolve(__dirname, "..");
const distJs = resolve(pkgDir, "dist/index.js");
const distDts = resolve(pkgDir, "dist/index.d.ts");

beforeAll(() => {
  if (!existsSync(distJs)) {
    throw new Error(`dist/index.js is missing — run \`pnpm build\` before the dist smoke test.`);
  }
});

describe("packages/core dist (AC-7)", () => {
  it("package.json declares a side-effect-free ESM package whose exports point at real files", () => {
    const pkg = JSON.parse(readFileSync(resolve(pkgDir, "package.json"), "utf8"));
    expect(pkg.type).toBe("module");
    expect(pkg.sideEffects).toBe(false);
    expect(pkg.exports["."].import).toBe("./dist/index.js");
    expect(pkg.exports["."].types).toBe("./dist/index.d.ts");
    expect(existsSync(distDts)).toBe(true);
    expect(pkg.files).toEqual(expect.arrayContaining(["dist", "README.md"]));
    // Runtime deps must be externalised (the CDN's +esm endpoint bundles them for us).
    expect(Object.keys(pkg.dependencies).sort()).toEqual(["aria-query", "dom-accessibility-api"]);
  });

  it("the bundle is ESM, imports only the two runtime deps, and has no Node or network globals", () => {
    const js = readFileSync(distJs, "utf8");
    const imports = [...js.matchAll(/^import\s.*?from\s+['"]([^'"]+)['"]/gm)].map((m) => m[1]);
    expect([...new Set(imports)].sort()).toEqual(["aria-query", "dom-accessibility-api"]);
    expect(js).toMatch(/^export \{/m);
    expect(js).not.toMatch(/\brequire\(|module\.exports|\bprocess\.|\b__dirname\b|\bBuffer\b/);
    expect(js).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|navigator\./);
    // A dependency accidentally bundled in would be an order of magnitude larger. Raised from
    // 32 KiB with SPEC-005's heuristics (the engine's own code is about 48 KiB unminified).
    expect(js.length).toBeLessThan(64 * 1024);
  });

  it("the built linearize() works on a DOM exactly like the source", async () => {
    const mod = (await import(/* @vite-ignore */ distJs)) as typeof Core;
    expect(Object.keys(mod).sort()).toEqual(["interpret", "linearize"]);
    document.body.innerHTML = '<h1>Title</h1><p>Intro</p><a href="/x">More</a><img src="a.png">';
    expect(mod.linearize(document.body)).toEqual([
      { role: "heading", name: "Title", level: 1, ref: { tag: "h1" } },
      { role: "text", name: "Intro" },
      { role: "link", name: "More", ref: { tag: "a" } },
      { role: "img", name: "", ref: { tag: "img" }, flags: { missingAlt: true } },
    ]);
  });
});
