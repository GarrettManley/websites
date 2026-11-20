import { Project, type ProjectSummary, summarizeProjects } from "@gm/core";
import raw from "../../../../content/shared/projects.json";
import { CASE_STUDY_BASE, getCaseStudies } from "./case-studies";

/** Boundary validation at build time. Array order is the registry's file order. */
const registry: Project[] = Project.array().parse(raw);

/** All projects in file order as card view models; a project with a case study links to it. */
export async function getProjects(): Promise<ProjectSummary[]> {
  const caseStudies = (await getCaseStudies()).map((entry) => ({
    slug: entry.id,
    project: entry.data.project,
  }));
  return summarizeProjects(registry, caseStudies, CASE_STUDY_BASE);
}

/** The projects flagged `featured`, in file order. */
export async function getFeaturedProjects(): Promise<ProjectSummary[]> {
  return (await getProjects()).filter((project) => project.featured);
}
