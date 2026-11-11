import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { type NgBlogPost, parseNgBlogPost } from "../domain/ngblog.js";

export type NgBlogReader = () => Promise<Record<string, NgBlogPost>>;

const EXPORT_PATH =
  "repos/GarrettManley/ng-blog/contents/backups/garrettmanley-website-blogs-export.json";

function parseExport(json: string): Record<string, NgBlogPost> {
  const raw = JSON.parse(json) as Record<string, unknown>;
  return Object.fromEntries(Object.entries(raw).map(([id, post]) => [id, parseNgBlogPost(post)]));
}

/** Reads the public ng-blog export through the `gh` CLI (network IO). */
export function ghNgBlogReader(): NgBlogReader {
  return async () => {
    const { stdout } = await promisify(execFile)(
      "gh",
      ["api", EXPORT_PATH, "-H", "Accept: application/vnd.github.raw"],
      { maxBuffer: 16 * 1024 * 1024 },
    );
    return parseExport(stdout);
  };
}

/** Reads the same export shape from a local file. */
export function fileNgBlogReader(path: string | URL): NgBlogReader {
  return async () => parseExport(await readFile(path, "utf8"));
}
