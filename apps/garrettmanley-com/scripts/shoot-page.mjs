// Screenshot site pages from a local preview of the built site, to be read before a UI change is
// called done.
//
//   pnpm --filter garrettmanley-com shots /projects/<slug>/ [more site paths]
//
// The leading slash is optional: Git Bash on Windows rewrites an argument that starts with one.
// Expects `astro preview --port 4321` to be serving dist/. Shoots each path full page at 375 and
// 1280 wide, in light and dark, into this app's test-results/shots/, which git ignores.
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const BASE = "http://localhost:4321";
const SIZES = [
  { width: 375, height: 740, deviceScaleFactor: 2 },
  { width: 1280, height: 900, deviceScaleFactor: 1 },
];

const args = process.argv.slice(2);
// Git Bash on Windows rewrites an argument that starts with a slash into a drive path.
if (args.length === 0 || args.some((arg) => /^[A-Za-z]:/.test(arg))) {
  console.error("usage: pnpm --filter garrettmanley-com shots <site path> [more site paths]");
  console.error(
    "       for example /projects/ (in Git Bash write projects/, with no leading slash)",
  );
  process.exit(2);
}
const paths = args.map((arg) => `/${arg.replace(/^\/+/, "")}`);
const outDir = resolve(dirname(fileURLToPath(import.meta.url)), "../test-results/shots");
mkdirSync(outDir, { recursive: true });
/** "/projects/<slug>/" becomes "projects-<slug>"; "/" becomes "home". */
const fileStem = (path) => path.split("/").filter(Boolean).join("-") || "home";

const browser = await chromium.launch();
try {
  for (const size of SIZES) {
    for (const theme of ["dark", "light"]) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        deviceScaleFactor: size.deviceScaleFactor,
        colorScheme: theme,
      });
      const page = await context.newPage();
      for (const path of paths) {
        const response = await page.goto(BASE + path, { waitUntil: "networkidle" });
        if (!response?.ok()) throw new Error(`${path} answered ${response?.status()}`);
        await page.evaluate(() => document.fonts.ready);
        const file = resolve(outDir, `${fileStem(path)}-${size.width}-${theme}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(file);
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}
