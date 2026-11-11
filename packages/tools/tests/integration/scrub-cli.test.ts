import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const cli = fileURLToPath(new URL("../../dist/cli/scrub-check.js", import.meta.url));
let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "scrub-"));
  await writeFile(join(dir, "index.html"), "<p>clean</p>");
});
afterEach(() => rm(dir, { recursive: true, force: true }));

const run = (target: string) => spawnSync(process.execPath, [cli, target], { encoding: "utf8" });

describe("scrub-check CLI", () => {
  it("exits 1 and names the file", async () => {
    await mkdir(join(dir, "sub"));
    await writeFile(join(dir, "sub", "leak.html"), String.raw`<p>C:\Users\x</p>`);
    const r = run(dir);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("leak.html");
    expect(r.stdout).not.toContain("index.html");
  });

  it("exits 0 on a clean dist", () => {
    expect(run(dir).status).toBe(0);
  });

  it("skips files named denylist.json", async () => {
    await writeFile(join(dir, "denylist.json"), String.raw`C:\Users\x`);
    expect(run(dir).status).toBe(0);
  });
});
