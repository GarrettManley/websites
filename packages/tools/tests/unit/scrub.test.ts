import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type Rule, scanContent } from "../../src/domain/scrub.js";

const rules = JSON.parse(
  readFileSync(new URL("../../denylist.json", import.meta.url), "utf8"),
) as Rule[];

const ruleIds = (file: string, content: string) =>
  scanContent(file, content, rules).map((h) => h.rule);

describe("scanContent", () => {
  it("flags a link to a repo not on the public allowlist", () => {
    expect(
      ruleIds("a.html", '<a href="https://github.com/GarrettManley/not-a-public-repo">x</a>'),
    ).toContain("private-repo-url");
  });

  it("allows the bare profile URL", () => {
    expect(ruleIds("a.html", '<a href="https://github.com/GarrettManley">me</a>')).toEqual([]);
    expect(ruleIds("a.html", "see https://github.com/GarrettManley/ today")).toEqual([]);
    expect(ruleIds("a.md", "https://github.com/GarrettManley?tab=repositories")).toEqual([]);
  });

  it("allows the public claude-marketplace URL", () => {
    expect(ruleIds("a.html", "https://github.com/GarrettManley/claude-marketplace")).toEqual([]);
  });

  it("flags a repo whose name merely starts with a public name", () => {
    expect(ruleIds("a.md", "https://github.com/GarrettManley/websites-private")).toContain(
      "private-repo-url",
    );
  });

  it("flags aether-engine", () => {
    expect(ruleIds("a.html", "<p>the aether-engine repo</p>")).toContain("private-repo-slug");
  });

  it(String.raw`flags C:\Users\ path`, () => {
    expect(ruleIds("a.js", String.raw`var p = 'C:\\Users\\x\\f'`)).toContain("local-path-win");
    expect(ruleIds("a.txt", String.raw`C:\Users\x`)).toContain("local-path-win");
  });

  it("flags /Users/ path", () => {
    expect(ruleIds("a.txt", "cd /Users/someone/code")).toContain("local-path-posix");
  });

  it("flags Workspace/Duracell", () => {
    expect(ruleIds("a.txt", "see Workspace/Duracell-thing")).toContain("corporate-dir");
  });

  it("flags hb-28u.8", () => {
    expect(ruleIds("a.html", "<p>tracked as hb-28u.8</p>")).toContain("tracker-beads");
  });

  it("flags #139 in prose", () => {
    expect(ruleIds("a.html", "<p>fixed in #139</p>")).toContain("tracker-issue");
  });

  it("allows Duracell and Aether in prose", () => {
    expect(ruleIds("a.html", "<p>I work at Duracell and build Aether.</p>")).toEqual([]);
  });

  it("ignores hex colors and anchors", () => {
    expect(ruleIds("a.html", '<style>a{color:#ff0000}</style><a href="#top">x</a>')).toEqual([]);
  });

  it("applies text rules to raw content for non-html files", () => {
    expect(ruleIds("a.md", "see #139")).toContain("tracker-issue");
  });

  it("reports file, rule and matched text", () => {
    expect(scanContent("x.txt", "hb-abc", rules)).toEqual([
      { file: "x.txt", rule: "tracker-beads", match: "hb-abc" },
    ]);
  });
});
