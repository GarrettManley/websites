import { defineCollection } from "astro:content";
import { PostFrontmatter, Project } from "@gm/core";
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

export const collections = { blog, projects };
