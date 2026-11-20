import { z } from "zod";

export const Project = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string(),
  url: z.url().optional(),
  tags: z.array(z.string()),
  featured: z.boolean(),
});

export type Project = z.infer<typeof Project>;

export type ProjectSummary = Omit<Project, "url"> & { href: string };
export type CaseStudyRef = { slug: string; project: string };

/**
 * Card view models in input order. A project with a case study links to
 * `${caseStudyBase}/${slug}/`; otherwise to its `url`.
 * @throws if a project has neither, or a case study names an unknown project id.
 */
export function summarizeProjects(
  projects: Project[],
  caseStudies: CaseStudyRef[],
  caseStudyBase: string,
): ProjectSummary[] {
  const ids = new Set(projects.map((p) => p.id));
  const slugByProject = new Map<string, string>();
  for (const cs of caseStudies) {
    if (!ids.has(cs.project)) {
      throw new Error(`Case study "${cs.slug}" references unknown project id "${cs.project}"`);
    }
    slugByProject.set(cs.project, cs.slug);
  }
  return projects.map(({ url, ...rest }) => {
    const slug = slugByProject.get(rest.id);
    const href = slug === undefined ? url : `${caseStudyBase}/${slug}/`;
    if (href === undefined) {
      throw new Error(`Project "${rest.id}" has neither a url nor a case study`);
    }
    return { ...rest, href };
  });
}
