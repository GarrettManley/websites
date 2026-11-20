import { describe, expect, it } from "vitest";
import { CaseStudyFrontmatter, DecisionRecord, Metric, StackRow } from "../../src/index.js";

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

const row = { layer: "Storage", tech: "SQLite", role: "Holds every match.", tier: "primary" };
const record = { title: "Why", rejected: "Option A", heldBy: "It held.", limit: "It limits." };
const words = (n: number) => Array.from({ length: n }, () => "w").join(" ");

describe("CaseStudyFrontmatter", () => {
  it("rejects more than four metrics", () => {
    const metrics = Array.from({ length: 5 }, (_, i) => ({ value: `${i}`, label: "m" }));
    expect(CaseStudyFrontmatter.safeParse({ ...valid, metrics }).success).toBe(false);
  });

  it("accepts four metrics", () => {
    const metrics = Array.from({ length: 4 }, (_, i) => ({ value: `${i}`, label: "m" }));
    expect(CaseStudyFrontmatter.safeParse({ ...valid, metrics }).success).toBe(true);
  });

  it("rejects zero metrics", () => {
    expect(CaseStudyFrontmatter.safeParse({ ...valid, metrics: [] }).success).toBe(false);
  });

  it("coerces asOf to a Date", () => {
    expect(CaseStudyFrontmatter.parse(valid).asOf).toBeInstanceOf(Date);
  });

  it("parses without stackDetail and decisions", () => {
    expect(CaseStudyFrontmatter.safeParse(valid).success).toBe(true);
  });

  it("returns stackDetail and decisions deeply equal to the input", () => {
    const input = {
      ...valid,
      stackDetail: [row, { ...row, version: "3.45", why: "Recorded reason.", tier: "supporting" }],
      decisions: [record],
    };
    const parsed = CaseStudyFrontmatter.parse(input);
    expect(parsed.stackDetail).toEqual(input.stackDetail);
    expect(parsed.decisions).toEqual(input.decisions);
  });
});

describe("Metric", () => {
  it("accepts a seven-word label", () => {
    expect(Metric.safeParse({ value: "1", label: words(7) }).success).toBe(true);
  });

  it("rejects an eight-word label", () => {
    expect(Metric.safeParse({ value: "1", label: words(8) }).success).toBe(false);
  });
});

describe("StackRow", () => {
  it("accepts a valid row", () => {
    expect(StackRow.safeParse(row).success).toBe(true);
  });

  it("rejects a row without tier", () => {
    const { tier: _tier, ...noTier } = row;
    expect(StackRow.safeParse(noTier).success).toBe(false);
  });

  it("rejects a role over 26 words", () => {
    expect(StackRow.safeParse({ ...row, role: words(27) }).success).toBe(false);
  });

  it("rejects a why over 22 words", () => {
    expect(StackRow.safeParse({ ...row, why: words(23) }).success).toBe(false);
  });

  it("rejects an unknown key", () => {
    expect(StackRow.safeParse({ ...row, extra: "x" }).success).toBe(false);
  });
});

describe("DecisionRecord", () => {
  it("accepts a valid record", () => {
    expect(DecisionRecord.safeParse(record).success).toBe(true);
  });

  it.each([
    ["rejected", 31],
    ["heldBy", 41],
    ["limit", 41],
  ])("rejects an over-long %s", (field, n) => {
    expect(DecisionRecord.safeParse({ ...record, [field]: words(n) }).success).toBe(false);
  });

  it("rejects an unknown key", () => {
    expect(DecisionRecord.safeParse({ ...record, extra: "x" }).success).toBe(false);
  });
});
