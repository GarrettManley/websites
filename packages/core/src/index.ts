export {
  CaseStudyFrontmatter,
  DecisionRecord,
  Metric,
  STATUS_LABEL,
  StackRow,
} from "./domain/case-study.js";
export { DiagramKey, DiagramKeyRow, lintDiagram } from "./domain/diagram.js";
export type { PostSummary } from "./domain/post.js";
export { orderPosts, PostFrontmatter } from "./domain/post.js";
export type { CaseStudyRef, ProjectSummary } from "./domain/project.js";
export { Project, summarizeProjects } from "./domain/project.js";
export { PublicResume } from "./domain/resume.js";
export { SiteLink } from "./domain/site.js";
export { slugify } from "./domain/slug.js";
