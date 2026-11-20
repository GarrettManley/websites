import { getCollection } from "astro:content";
import { type ProjectSummary, summarizeProjects } from "@gm/core";
import { CASE_STUDY_BASE, getCaseStudies } from "./case-studies";

/** All projects in file order as card view models; a project with a case study links to it. */
export async function getProjects(): Promise<ProjectSummary[]> {
  const projects = (await getCollection("projects")).map((entry) => entry.data);
  const caseStudies = (await getCaseStudies()).map((entry) => ({
    slug: entry.id,
    project: entry.data.project,
  }));
  return summarizeProjects(projects, caseStudies, CASE_STUDY_BASE);
}

/** The projects flagged `featured`, in file order. */
export async function getFeaturedProjects(): Promise<ProjectSummary[]> {
  return (await getProjects()).filter((project) => project.featured);
}
