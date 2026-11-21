// Render one diagram SVG the way the site's Figure shows it, and report geometry problems
// measured with the real fonts.
//
//   pnpm --filter garrettmanley-com diagram content/case-studies/<slug>.<name>.svg [out-dir]
//
// A package script runs with the app directory as its working directory, so both paths are read
// from the repo root instead: pass them as written above, or pass absolute paths. Without an
// out-dir the files go to this app's test-results/diagrams/<name>/, which git ignores.
//
// Writes <name>-phone-dark.png, <name>-phone-light.png, <name>-desktop-dark.png and
// <name>-desktop-light.png (with the HTML page each was shot from) and prints a JSON report on
// stdout. Exit code 1 when the phone report has errors, its frame scrolls sideways or its
// smallest text is under 10px. Paths in the report are relative to the repo root.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(app, "../..");

const [svgArg, outDirArg] = process.argv.slice(2);
if (!svgArg) {
  console.error("usage: pnpm --filter garrettmanley-com diagram <diagram.svg> [out-dir]");
  console.error("       paths are relative to the repo root");
  process.exit(2);
}
const svgPath = resolve(repo, svgArg);
const name = basename(svgPath).replace(/\.svg$/, "");
const outDir = outDirArg ? resolve(repo, outDirArg) : resolve(app, "test-results/diagrams", name);
mkdirSync(outDir, { recursive: true });
const svg = readFileSync(svgPath, "utf8");
const tokens = readFileSync(resolve(repo, "packages/ui/src/tokens/tokens.css"), "utf8");
const diagram = readFileSync(resolve(repo, "packages/ui/src/diagram.css"), "utf8");

const font = (family, pkg, weight) =>
  `@font-face{font-family:"${family}";font-weight:${weight};font-style:normal;src:url("${
    pathToFileURL(
      resolve(
        repo,
        `packages/ui/node_modules/@fontsource/${pkg}/files/${pkg}-latin-${weight}-normal.woff2`,
      ),
    ).href
  }") format("woff2");}`;
const fonts = [
  font("IBM Plex Sans", "ibm-plex-sans", 400),
  font("IBM Plex Sans", "ibm-plex-sans", 500),
  font("IBM Plex Sans", "ibm-plex-sans", 600),
  font("IBM Plex Mono", "ibm-plex-mono", 400),
  font("IBM Plex Mono", "ibm-plex-mono", 500),
].join("\n");

// Frame widths, border included. A 375px phone leaves 343px for the figure (16px gutters); the
// frame has a 1px border and 8px padding, so the drawing gets 325px. On desktop View.astro caps
// the figure column at 440px and Figure.astro pads the frame 16px from `sm`, so the drawing
// gets 406px.
const VARIANTS = [
  { key: "phone", frame: 343, pad: 8 },
  { key: "desktop", frame: 440, pad: 16 },
];

const html = (theme, v) => `<!doctype html><html data-theme="${theme}"><head><meta charset="utf-8">
<style>${fonts}\n${tokens}\n${diagram}
html,body{margin:0;background:var(--color-bg);}
body{padding:16px;font-family:var(--font-sans);}
#frame{box-sizing:border-box;width:${v.frame}px;padding:${v.pad}px;background:var(--color-surface);
  border:1px solid var(--color-border);border-radius:8px;overflow-x:auto;}
#frame>svg{display:block;margin:0 auto;max-width:100%;height:auto;}
</style></head><body><div id="frame">${svg}</div></body></html>`;

const measure = () => {
  const root = document.querySelector("#frame > svg");
  const vb = root.viewBox.baseVal;
  const scale = root.getBoundingClientRect().width / vb.width;
  const box = (el) => {
    const b = el.getBBox();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  };
  const hit = (a, b) => {
    const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return w > 0.75 && h > 0.75;
  };
  const inside = (a, b, pad = 0) =>
    a.x >= b.x + pad &&
    a.y >= b.y + pad &&
    a.x + a.w <= b.x + b.w - pad &&
    a.y + a.h <= b.y + b.h - pad;
  const cls = (el) => el.getAttribute("class") || "";
  const label = (el) => `"${el.textContent.trim()}"`;

  const texts = [...root.querySelectorAll("text")].map((el) => ({ el, b: box(el), cls: cls(el) }));
  const nodes = [...root.querySelectorAll("rect.box, rect.store, rect.ext")].map((el) => ({
    el,
    b: box(el),
  }));
  const gates = [...root.querySelectorAll("rect.gate")].map((el) => ({ el, b: box(el) }));
  const lanes = [...root.querySelectorAll("rect.lane")].map((el) => ({ el, b: box(el) }));
  const edges = [...root.querySelectorAll("path.edge, line.edge, path.bar, line.bar")];

  const errors = [];
  const warnings = [];
  const r = (n) => Math.round(n * 10) / 10;
  const at = (b) => `x ${r(b.x)}..${r(b.x + b.w)}, y ${r(b.y)}..${r(b.y + b.h)}`;

  for (const t of texts) {
    if (t.b.w === 0) {
      errors.push(`empty text element at ${at(t.b)}`);
      continue;
    }
    if (t.b.x < 0 || t.b.y < 0 || t.b.x + t.b.w > vb.width || t.b.y + t.b.h > vb.height) {
      errors.push(
        `text ${label(t.el)} leaves the viewBox (${at(t.b)}; viewBox is ${vb.width} by ${vb.height})`,
      );
    }
    for (const n of [...nodes, ...gates]) {
      if (!hit(t.b, n.b)) continue;
      if (!inside(t.b, n.b)) {
        errors.push(`text ${label(t.el)} (${at(t.b)}) crosses the border of the box at ${at(n.b)}`);
      } else if (n.b.x + n.b.w - (t.b.x + t.b.w) < 8) {
        warnings.push(
          `text ${label(t.el)} ends ${r(n.b.x + n.b.w - (t.b.x + t.b.w))} units from the right edge of its box (want 8 or more)`,
        );
      }
    }
    for (const l of lanes) {
      if (hit(t.b, l.b) && !inside(t.b, l.b)) {
        // A lane label may sit on its lane's top border only if it does not cross the stroke line itself.
        const crossesStroke =
          (t.b.y < l.b.y && t.b.y + t.b.h > l.b.y) ||
          (t.b.y < l.b.y + l.b.h && t.b.y + t.b.h > l.b.y + l.b.h) ||
          (t.b.x < l.b.x && t.b.x + t.b.w > l.b.x) ||
          (t.b.x < l.b.x + l.b.w && t.b.x + t.b.w > l.b.x + l.b.w);
        if (crossesStroke)
          errors.push(
            `text ${label(t.el)} (${at(t.b)}) crosses the outline of the lane at ${at(l.b)}`,
          );
      }
    }
  }
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      if (hit(texts[i].b, texts[j].b)) {
        errors.push(
          `texts ${label(texts[i].el)} and ${label(texts[j].el)} overlap (${at(texts[i].b)} and ${at(texts[j].b)})`,
        );
      }
    }
  }

  for (const e of edges) {
    const len = e.getTotalLength();
    const pts = [];
    for (let d = 0; d <= len; d += 1.5) pts.push(e.getPointAtLength(d));
    const d = e.getAttribute("d") || "line";
    const seenText = new Set();
    const seenNode = new Set();
    for (const p of pts) {
      for (const t of texts) {
        if (seenText.has(t)) continue;
        if (
          p.x > t.b.x - 1 &&
          p.x < t.b.x + t.b.w + 1 &&
          p.y > t.b.y - 1 &&
          p.y < t.b.y + t.b.h + 1
        ) {
          seenText.add(t);
          errors.push(`edge "${d}" runs through text ${label(t.el)} (${at(t.b)})`);
        }
      }
      for (const n of nodes) {
        if (seenNode.has(n)) continue;
        if (
          p.x > n.b.x + 3 &&
          p.x < n.b.x + n.b.w - 3 &&
          p.y > n.b.y + 3 &&
          p.y < n.b.y + n.b.h - 3
        ) {
          seenNode.add(n);
          errors.push(`edge "${d}" runs through the inside of the box at ${at(n.b)}`);
        }
      }
    }
    // An 8-unit solid stub is how a dashed edge carries its arrowhead, so only 8 < len < 10 warns.
    if (len > 8.05 && len < 10 && e.getAttribute("marker-end")) {
      warnings.push(`edge "${d}" is ${r(len)} units long, shorter than about two arrowheads`);
    }
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (hit(nodes[i].b, nodes[j].b))
        errors.push(`boxes at ${at(nodes[i].b)} and ${at(nodes[j].b)} overlap`);
    }
  }

  const sizes = texts.map((t) => parseFloat(getComputedStyle(t.el).fontSize) * scale);
  return {
    viewBox: `${vb.width} x ${vb.height}`,
    drawnWidthPx: r(vb.width * scale),
    drawnHeightPx: r(vb.height * scale),
    smallestTextPx: r(Math.min(...sizes)),
    frameScrollsSideways:
      document.querySelector("#frame").scrollWidth > document.querySelector("#frame").clientWidth,
    counts: { texts: texts.length, boxes: nodes.length, lanes: lanes.length, edges: edges.length },
    errors,
    warnings,
  };
};

const browser = await chromium.launch();
const report = { diagram: name, images: [], phone: null, desktop: null };
try {
  for (const v of VARIANTS) {
    for (const theme of ["dark", "light"]) {
      const page = await browser.newPage({
        viewport: { width: v.frame + 32, height: 400 },
        deviceScaleFactor: 2,
      });
      const file = resolve(outDir, `${name}-${v.key}-${theme}.html`);
      writeFileSync(file, html(theme, v));
      await page.goto(pathToFileURL(file).href);
      await page.evaluate(async () => {
        await Promise.all(
          ['400 12px "IBM Plex Sans"', '500 14px "IBM Plex Sans"', '400 12px "IBM Plex Mono"'].map(
            (f) => document.fonts.load(f),
          ),
        );
        await document.fonts.ready;
      });
      const png = resolve(outDir, `${name}-${v.key}-${theme}.png`);
      await page.locator("#frame").screenshot({ path: png });
      report.images.push(relative(repo, png).replaceAll("\\", "/"));
      if (theme === "dark") report[v.key] = await page.evaluate(measure);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
const failed =
  report.phone.errors.length > 0 ||
  report.phone.frameScrollsSideways ||
  report.phone.smallestTextPx < 10;
process.exitCode = failed ? 1 : 0;
