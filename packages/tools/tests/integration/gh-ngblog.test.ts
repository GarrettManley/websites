import { describe, expect, it } from "vitest";
import { fileNgBlogReader } from "../../src/adapters/gh-ngblog.js";

describe("fileNgBlogReader", () => {
  it("file reader over the fixture yields 3 posts", async () => {
    const posts = await fileNgBlogReader(
      new URL("../fixtures/ngblog-export.json", import.meta.url),
    )();
    expect(Object.keys(posts)).toHaveLength(3);
    for (const p of Object.values(posts)) expect(p.content.length).toBeGreaterThan(0);
  });
});
