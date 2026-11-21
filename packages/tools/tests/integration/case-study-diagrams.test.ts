import { existsSync, readdirSync, readFileSync } from "node:fs";
import { CaseStudyFrontmatter, DiagramKey, lintDiagram } from "@gm/core";
import { assert, describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

// Reads the content folder: every diagram there has a key and passes the lint.
const dir = new URL("../../../../content/case-studies/", import.meta.url);
const files = readdirSync(dir).sort();
const svgFiles = files.filter((file) => file.endsWith(".svg"));
const keyFiles = files.filter((file) => file.endsWith(".key.json"));
const read = (file: string) => readFileSync(new URL(file, dir), "utf8");

describe("case-study diagrams", () => {
  // Without this, an empty folder generates no lint case below and the suite passes unchecked.
  it("finds at least one diagram", () => {
    expect(svgFiles.length).toBeGreaterThan(0);
  });

  it.each(svgFiles)("%s has a key and passes the diagram lint", (file) => {
    const keyFile = file.replace(/\.svg$/, ".key.json");
    assert(existsSync(new URL(keyFile, dir)), `${file}: the sibling ${keyFile} is missing`);
    const key = DiagramKey.safeParse(JSON.parse(read(keyFile)));
    assert(key.success, `${keyFile} is not a diagram key:\n${key.error?.message}`);

    const problems = lintDiagram(read(file), key.data);

    expect(problems, `${file} breaks the diagram rules:\n${problems.join("\n")}`).toEqual([]);
  });

  it("finds a diagram beside every key file", () => {
    const orphans = keyFiles.filter(
      (file) => !svgFiles.includes(file.replace(/\.key\.json$/, ".svg")),
    );

    expect(orphans, "key files with no sibling .svg").toEqual([]);
  });

  it("gives every diagram its own root id", () => {
    const rootIds = svgFiles.map((file) => /<svg\b[^>]*?\sid="([^"]*)"/.exec(read(file))?.[1]);

    const repeated = rootIds.filter((id, at) => rootIds.indexOf(id) !== at);

    expect(repeated, `root ids used by more than one file in ${svgFiles.join(", ")}`).toEqual([]);
  });

  // Integration (filesystem). The starter files sit in a subfolder, outside the loops above and
  // outside the content collection, so nothing else would notice them going stale.
  it("keeps the _template diagram within the diagram rules", () => {
    const key = DiagramKey.parse(JSON.parse(read("_template/diagram.key.json")));

    const problems = lintDiagram(read("_template/diagram.svg"), key);

    expect(problems, `the template diagram breaks the rules:\n${problems.join("\n")}`).toEqual([]);
  });

  it("keeps the _template frontmatter within the case-study schema", () => {
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(read("_template/case-study.mdx"))?.[1];

    const parsed = CaseStudyFrontmatter.safeParse(parseYaml(frontmatter ?? ""));

    expect(parsed.error?.message, "the template frontmatter does not parse").toBeUndefined();
  });
});
