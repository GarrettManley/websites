import { Project, type ProjectSummary, summarizeProjects } from "@gm/core";
import raw from "../../../../content/shared/projects.json";
import { CASE_STUDY_BASE, getCaseStudies } from "./case-studies";

/**
 * Boundary validation at build time. Array order is the registry's file order. Imported
 * directly rather than through the content loader: the loader returns entries by id, and card
 * order must be the registry's file order.
 */
const registry: Project[] = Project.array().parse(raw);

/**
 * All projects in file order as card view models; a project with a case study links to it.
 * @throws (via `summarizeProjects`) if a project has neither a url nor a case study, a case
 *   study names an unknown project, or two case studies name the same project.
 */
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
