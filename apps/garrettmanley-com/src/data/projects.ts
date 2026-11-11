import { getCollection } from "astro:content";
import type { Project } from "@gm/core";

/** All projects in file order, as plain domain values. */
export async function getProjects(): Promise<Project[]> {
  return (await getCollection("projects")).map((entry) => entry.data);
}

/** The projects flagged `featured`, in file order. */
export async function getFeaturedProjects(): Promise<Project[]> {
  return (await getProjects()).filter((project) => project.featured);
}
