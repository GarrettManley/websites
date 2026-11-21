import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type Rule, scanContent } from "../../src/domain/scrub.js";

// Integration: one external point, git plus the filesystem. `scrub-check` reads built output
// only, so nothing else looks at the README, the content sources, scripts or agent files.
const repo = fileURLToPath(new URL("../../../../", import.meta.url));
const denylist = JSON.parse(
  readFileSync(new URL("../../denylist.json", import.meta.url), "utf8"),
) as Rule[];
// The raw-scope rules, plus the private repo name matched in every file type. The other
// text-scope rules are left out: they match hex colours and code.
const rules: Rule[] = denylist.flatMap((rule) =>
  rule.scope === "raw"
    ? [rule]
    : rule.id === "private-repo-slug"
      ? [{ ...rule, scope: "raw" }]
      : [],
);

/** The test fixtures and the denylist hold the patterns on purpose. */
const SKIPPED = /^packages\/tools\/(?:tests\/|denylist\.json$)/;
const BINARY = new Set([".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff2"]);

/** Tracked files plus new files git does not ignore, so a file is scanned before its first commit. */
function sourceFiles(): string[] {
  return (
    execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
      cwd: repo,
      encoding: "utf8",
    })
      .split("\0")
      .filter(
        (file) => file !== "" && !SKIPPED.test(file) && !BINARY.has(extname(file).toLowerCase()),
      )
      // A file deleted from the working tree but not yet from the index is still listed.
      .filter((file) => existsSync(join(repo, file)))
  );
}

describe("source privacy", () => {
  it("finds the repository's files", () => {
    expect(sourceFiles()).toContain("README.md");
  });

  it("finds no private path, repo link or name in any source file", () => {
    const hits = sourceFiles().flatMap((file) =>
      scanContent(file, readFileSync(join(repo, file), "utf8"), rules),
    );

    expect(hits.map((hit) => `${hit.file}: ${hit.rule}`)).toEqual([]);
  });
});
