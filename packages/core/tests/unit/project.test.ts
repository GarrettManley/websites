import { describe, expect, it } from "vitest";
import { type Project, summarizeProjects } from "../../src/index.js";

const project = (id: string, url?: string): Project => ({
  id,
  name: id.toUpperCase(),
  summary: "s",
  tags: [],
  featured: false,
  ...(url ? { url } : {}),
});

describe("summarizeProjects", () => {
  it("links to the case study when a project has both a url and a case study", () => {
    const out = summarizeProjects(
      [project("a", "https://example.com/a")],
      [{ slug: "alpha", project: "a" }],
      "/projects",
    );
    expect(out[0]?.href).toBe("/projects/alpha/");
  });

  it("links to the url and omits the url key when there is no case study", () => {
    const out = summarizeProjects([project("a", "https://example.com/a")], [], "/projects");
    expect(out[0]?.href).toBe("https://example.com/a");
    expect(out[0]).not.toHaveProperty("url");
  });

  it("a project with a case study and no url links to the case study", () => {
    const out = summarizeProjects([project("a")], [{ slug: "alpha", project: "a" }], "/projects");
    expect(out[0]?.href).toBe("/projects/alpha/");
  });

  it("throws naming the project and both slugs when two case studies name one project", () => {
    expect(() =>
      summarizeProjects(
        [project("a")],
        [
          { slug: "alpha", project: "a" },
          { slug: "beta", project: "a" },
        ],
        "/projects",
      ),
    ).toThrow(/"a".*"alpha".*"beta"/);
  });

  it("throws naming the project when it has neither url nor case study", () => {
    expect(() => summarizeProjects([project("lonely")], [], "/projects")).toThrow(/lonely/);
  });

  it("throws naming the id when a case study references an unknown project", () => {
    expect(() =>
      summarizeProjects(
        [project("a", "https://example.com/a")],
        [{ slug: "x", project: "ghost" }],
        "/projects",
      ),
    ).toThrow(/ghost/);
  });

  it("preserves input order", () => {
    const out = summarizeProjects(
      [project("b", "https://example.com/b"), project("a", "https://example.com/a")],
      [],
      "/projects",
    );
    expect(out.map((p) => p.id)).toEqual(["b", "a"]);
  });
});
