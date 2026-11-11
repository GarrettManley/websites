import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { mapNgBlogPost, parseNgBlogPost } from "../../src/domain/ngblog.js";

const post = (over: Record<string, unknown> = {}) => ({
  author: "A",
  content: ["# Hello World", "", "body line", "more"],
  postDate: "2019-08-16T15:22:39.079Z",
  postID: "-x",
  ...over,
});

const frontmatter = (markdown: string): Record<string, unknown> => {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(markdown);
  return parse(m?.[1] ?? "") as Record<string, unknown>;
};

describe("mapNgBlogPost", () => {
  it("maps title from leading heading", () => {
    const { slug, markdown } = mapNgBlogPost(parseNgBlogPost(post()));
    expect(slug).toBe("hello-world");
    expect(frontmatter(markdown).title).toBe("Hello World");
    expect(markdown.endsWith("\n\nbody line\nmore")).toBe(true);
  });

  it("preserves post date as YYYY-MM-DD", () => {
    const { markdown } = mapNgBlogPost(parseNgBlogPost(post()));
    expect(markdown).toContain("date: 2019-08-16");
    expect(frontmatter(markdown).tags).toEqual([]);
  });

  it("escapes YAML-significant characters in title", () => {
    const title = 'Merge: "ours" vs theirs';
    const { markdown } = mapNgBlogPost(parseNgBlogPost(post({ content: [`# ${title}`, "", "x"] })));
    expect(frontmatter(markdown).title).toBe(title);
  });

  it("rejects a post missing content", () => {
    const { content: _omit, ...rest } = post();
    expect(() => parseNgBlogPost(rest)).toThrow();
  });
});
