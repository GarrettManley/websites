import { describe, expect, it } from "vitest";
import { CaseStudyFrontmatter } from "../../src/index.js";

const valid = {
  title: "T",
  summary: "S",
  project: "a",
  year: 2026,
  role: "Author",
  status: "shipped",
  stack: ["ts"],
  metrics: [{ value: "1", label: "one" }],
  asOf: "2026-11-12",
};

describe("CaseStudyFrontmatter", () => {
  it("rejects more than four metrics", () => {
    const metrics = Array.from({ length: 5 }, (_, i) => ({ value: `${i}`, label: "m" }));
    expect(CaseStudyFrontmatter.safeParse({ ...valid, metrics }).success).toBe(false);
  });

  it("coerces asOf to a Date", () => {
    expect(CaseStudyFrontmatter.parse(valid).asOf).toBeInstanceOf(Date);
  });
});
