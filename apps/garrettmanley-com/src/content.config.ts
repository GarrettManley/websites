import { defineCollection } from "astro:content";
import { CaseStudyFrontmatter, PostFrontmatter } from "@gm/core";
import { glob } from "astro/loaders";

/** Content lives at the repo root (`content/`), shared across apps; schemas come from @gm/core. */
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "../../content/blog" }),
  schema: PostFrontmatter,
});

const caseStudies = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "../../content/case-studies" }),
  schema: CaseStudyFrontmatter,
});

export const collections = { blog, caseStudies };
