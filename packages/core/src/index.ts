export {
  CaseStudyFrontmatter,
  DecisionRecord,
  decisionFields,
  Metric,
  STATUS_LABEL,
  StackRow,
} from "./domain/case-study.js";
export { DIAGRAM_CLASSES, DiagramKey, DiagramKeyRow, lintDiagram } from "./domain/diagram.js";
export type { PostSummary } from "./domain/post.js";
export { orderPosts, PostFrontmatter } from "./domain/post.js";
export type { CaseStudyRef, ProjectSummary } from "./domain/project.js";
export { Project, summarizeProjects } from "./domain/project.js";
export { PublicResume } from "./domain/resume.js";
export { SiteLink } from "./domain/site.js";
export { slugify } from "./domain/slug.js";
export type { StackGroup } from "./domain/stack.js";
export { groupStackRows, versionTokens } from "./domain/stack.js";
