#!/usr/bin/env node
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { fsResumeReader, fsResumeWriter } from "../adapters/fs-resume.js";
import { syncPublicResume } from "../app/sync-resume.js";

const { values } = parseArgs({
  options: {
    from: { type: "string" },
    content: { type: "string" },
    pdf: { type: "string" },
  },
});

if (!values.from || !values.content || !values.pdf) {
  console.error("usage: sync-resume --from <public-build-dir> --content <dir> --pdf <dir>");
  process.exit(2);
}

const resume = await syncPublicResume(
  fsResumeReader(resolve(values.from)),
  fsResumeWriter(resolve(values.content), resolve(values.pdf)),
);
console.log(`synced resume for ${resume.basics.name}`);
