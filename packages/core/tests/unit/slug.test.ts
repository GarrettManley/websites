import { describe, expect, it } from "vitest";
import { slugify } from "../../src/index";

describe("slugify", () => {
  it.each([
    ["Advanced Merge Conflict Resolution", "advanced-merge-conflict-resolution"],
    ["C# & .NET: Tips!", "c-net-tips"],
    ["  --Hello--  ", "hello"],
  ])("%j -> %j", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});
