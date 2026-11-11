#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { fileNgBlogReader, ghNgBlogReader } from "../adapters/gh-ngblog.js";
import { mapNgBlogPost } from "../domain/ngblog.js";

const { values } = parseArgs({
  options: { out: { type: "string" }, "from-file": { type: "string" } },
});

if (!values.out) {
  console.error("usage: import-ngblog --out <dir> [--from-file <path>]");
  process.exit(2);
}

const reader = values["from-file"]
  ? fileNgBlogReader(resolve(values["from-file"]))
  : ghNgBlogReader();
const out = resolve(values.out);
await mkdir(out, { recursive: true });

for (const post of Object.values(await reader())) {
  const { slug, markdown } = mapNgBlogPost(post);
  await writeFile(join(out, `${slug}.md`), `${markdown}\n`);
  console.log(`wrote ${slug}.md`);
}
