import { defineCollection } from "astro:content";
import { CaseStudyFrontmatter, PostFrontmatter, Project } from "@gm/core";
import { file, glob } from "astro/loaders";

/** Content lives at the repo root (`content/`), shared across apps; schemas come from @gm/core. */
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "../../content/blog" }),
  schema: PostFrontmatter,
});

const projects = defineCollection({
  loader: file("../../content/shared/projects.json"),
  schema: Project,
});

const caseStudies = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "../../content/case-studies" }),
  schema: CaseStudyFrontmatter,
});

export const collections = { blog, projects, caseStudies };
