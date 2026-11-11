#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { type Rule, scanContent } from "../domain/scrub.js";

const EXTENSIONS = new Set([".html", ".xml", ".txt", ".json", ".js", ".css", ".md"]);
const DEFAULT_RULES = new URL("../../denylist.json", import.meta.url);

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (EXTENSIONS.has(extname(entry.name).toLowerCase()) && entry.name !== "denylist.json") {
      yield path;
    }
  }
}

const { values, positionals } = parseArgs({
  options: { rules: { type: "string" } },
  allowPositionals: true,
});
const [target] = positionals;
if (!target) {
  console.error("usage: scrub-check <distDir> [--rules <path>]");
  process.exit(2);
}

const rules = JSON.parse(
  await readFile(values.rules ? resolve(values.rules) : DEFAULT_RULES, "utf8"),
) as Rule[];
const root = resolve(target);

let hits = 0;
for await (const path of walk(root)) {
  const file = relative(root, path).replaceAll("\\", "/");
  for (const hit of scanContent(file, await readFile(path, "utf8"), rules)) {
    console.log(`${hit.file}: [${hit.rule}] ${hit.match}`);
    hits++;
  }
}
process.exit(hits > 0 ? 1 : 0);
