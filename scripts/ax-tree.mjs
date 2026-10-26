#!/usr/bin/env node
/**
 * Drive a headless Chromium through the DevTools protocol, with no dependencies. This is the
 * fidelity oracle for #6: the pure-JS engine is compared against what the browser actually
 * exposes to assistive technology, on the same DOM.
 *
 * Usage:  node scripts/ax-tree.mjs <file.html> [--out tree.json] [--raw]
 * Env:    CHROME_PATH to point at a specific Chrome, Chromium, or Edge binary.
 *
 * Output: a depth-first list of the exposed (non-ignored) nodes, each with Chrome's role, the
 * accessible name, the heading level when present, and the depth. Ignored nodes are skipped but
 * their children are still visited, which is how a screen reader sees the tree.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const outIndex = args.indexOf("--out");
  const outFile = outIndex >= 0 ? args[outIndex + 1] : null;
  const raw = args.includes("--raw");

  if (!file) {
    console.error("usage: node scripts/ax-tree.mjs <file.html> [--out tree.json] [--raw]");
    process.exit(2);
  }

  const nodes = await dumpAxTree(resolve(file), { raw });
  const text = JSON.stringify(nodes, null, 2);
  if (outFile) writeFileSync(outFile, text);
  else process.stdout.write(text + "\n");
}

/** Launch a headless Chromium, load the file, return the exposed accessibility nodes in order. */
export async function dumpAxTree(absolutePath, { raw = false } = {}) {
  const page = await openPage(absolutePath);
  try {
    return await page.axTree({ raw });
  } finally {
    await page.close();
  }
}

/**
 * Launch a headless Chromium, open the file in a tab, and return a handle that can read the
 * accessibility tree and evaluate JavaScript in the page. Always `close()` it.
 */
export async function openPage(absolutePath) {
  const browser = process.env.CHROME_PATH ?? findBrowser();
  if (!browser) throw new Error("No Chrome, Chromium, or Edge found. Set CHROME_PATH.");

  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = mkdtempSync(join(tmpdir(), "srm-ax-"));
  const proc = spawn(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let cdp;
  try {
    const { webSocketDebuggerUrl } = await waitForDevTools(port);
    cdp = await connect(webSocketDebuggerUrl);
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    const loaded = cdp.waitFor((m) => m.method === "Page.loadEventFired" && m.sessionId === sessionId);
    await cdp.send("Page.navigate", { url: pathToFileURL(absolutePath).href }, sessionId);
    await loaded;
    await sleep(250); // let layout and the accessibility tree settle

    return {
      /** Evaluate an expression in the page and return its JSON-serialisable value. */
      async evaluate(expression) {
        const r = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
        if (r.exceptionDetails) {
          throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
        }
        return r.result?.value;
      },
      /** Chrome's full accessibility tree, flattened unless `raw`. Each node carries its DOM tag. */
      async axTree({ raw = false } = {}) {
        await cdp.send("Accessibility.enable", {}, sessionId);
        const { nodes } = await cdp.send("Accessibility.getFullAXTree", {}, sessionId);
        if (raw) return nodes;
        const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true }, sessionId);
        const tags = new Map();
        const walk = (n) => {
          tags.set(n.backendNodeId, (n.nodeName ?? "").toLowerCase());
          for (const c of n.children ?? []) walk(c);
          if (n.contentDocument) walk(n.contentDocument);
          for (const s of n.shadowRoots ?? []) walk(s);
        };
        walk(root);
        return flatten(nodes, tags);
      },
      async close() {
        cdp.close();
        proc.kill();
        await sleep(100);
        rmSync(profile, { recursive: true, force: true });
      },
    };
  } catch (err) {
    cdp?.close();
    proc.kill();
    rmSync(profile, { recursive: true, force: true });
    throw err;
  }
}

function flatten(nodes, tags = new Map()) {
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const root = nodes.find((n) => !n.parentId) ?? nodes[0];
  const out = [];
  const visit = (n, depth) => {
    const role = n.role?.value ?? "";
    if (role === "InlineTextBox") return; // layout fragments of a StaticText, never announced
    // Ignored nodes are kept, marked, so consumers can still see the tree's structure: a
    // depth-based walk needs every container, announced or not.
    const props = Object.fromEntries((n.properties ?? []).map((p) => [p.name, p.value?.value]));
    const entry = { role, name: n.name?.value ?? "", depth };
    if (n.ignored) entry.ignored = true;
    if (role === "heading" && props.level !== undefined) entry.level = props.level;
    if (n.backendDOMNodeId !== undefined) {
      entry.backendDOMNodeId = n.backendDOMNodeId;
      const tag = tags.get(n.backendDOMNodeId);
      if (tag) entry.tag = tag;
    }
    out.push(entry);
    for (const id of n.childIds ?? []) {
      const child = byId.get(id);
      if (child) visit(child, depth + 1);
    }
  };
  visit(root, 0);
  return out;
}

function findBrowser() {
  const local = process.env.LOCALAPPDATA ?? "";
  const candidates =
    process.platform === "win32"
      ? [
          "C:/Program Files/Google/Chrome/Application/chrome.exe",
          "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
          `${local}/Google/Chrome/Application/chrome.exe`,
          "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
          "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
        ]
      : process.platform === "darwin"
        ? [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          ]
        : [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/usr/bin/microsoft-edge",
          ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

async function waitForDevTools(port) {
  for (let i = 0; i < 150; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return await res.json();
    } catch {
      // not up yet
    }
    await sleep(100);
  }
  throw new Error(`Chrome did not expose DevTools on port ${port} within 15s`);
}

function connect(url) {
  return new Promise((resolveConn, reject) => {
    const ws = new WebSocket(url);
    let nextId = 0;
    const pending = new Map();
    const waiters = new Set();
    ws.onerror = (e) => reject(new Error("WebSocket error: " + (e.message ?? "")));
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message));
        else res(msg.result ?? {});
        return;
      }
      for (const w of waiters) w(msg);
    };
    ws.onopen = () =>
      resolveConn({
        send(method, params = {}, sessionId) {
          return new Promise((res, rej) => {
            const id = ++nextId;
            pending.set(id, { res, rej });
            const payload = { id, method, params };
            if (sessionId) payload.sessionId = sessionId;
            ws.send(JSON.stringify(payload));
          });
        },
        waitFor(predicate) {
          return new Promise((res) => {
            const w = (msg) => {
              if (predicate(msg)) {
                waiters.delete(w);
                res(msg);
              }
            };
            waiters.add(w);
          });
        },
        close() {
          ws.close();
        },
      });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
