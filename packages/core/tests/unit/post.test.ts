import { describe, expect, it } from "vitest";
import { orderPosts, PostFrontmatter, type PostSummary } from "../../src/index.js";

const post = (slug: string, title: string, date: string): PostSummary => ({
  slug,
  title,
  date: new Date(date),
});

describe("orderPosts", () => {
  it("sorts newest first", () => {
    const out = orderPosts([post("a", "A", "2024-01-01"), post("b", "B", "2025-01-01")]);
    expect(out.map((p) => p.slug)).toEqual(["b", "a"]);
  });

  it("breaks date ties by title", () => {
    const out = orderPosts([post("z", "Zed", "2025-01-01"), post("a", "Alpha", "2025-01-01")]);
    expect(out.map((p) => p.title)).toEqual(["Alpha", "Zed"]);
  });

  it("does not mutate input", () => {
    const input = [post("a", "A", "2024-01-01"), post("b", "B", "2025-01-01")];
    orderPosts(input);
    expect(input.map((p) => p.slug)).toEqual(["a", "b"]);
  });
});

describe("PostFrontmatter", () => {
  it("coerces ISO date strings", () => {
    const parsed = PostFrontmatter.parse({ title: "T", date: "2025-03-04" });
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.tags).toEqual([]);
  });
});
