import { z } from "zod";

export const Metric = z.object({ value: z.string(), label: z.string() });
export type Metric = z.infer<typeof Metric>;

export const CaseStudyFrontmatter = z.object({
  title: z.string(),
  summary: z.string(),
  /** Id in content/shared/projects.json. */
  project: z.string(),
  year: z.number().int(),
  role: z.string(),
  status: z.enum(["active", "shipped"]),
  stack: z.array(z.string()).min(1),
  metrics: z.array(Metric).min(1).max(4),
  asOf: z.coerce.date(),
  notice: z.string().optional(),
});

export type CaseStudyFrontmatter = z.infer<typeof CaseStudyFrontmatter>;

/** Display text for each status. */
export const STATUS_LABEL: Record<CaseStudyFrontmatter["status"], string> = {
  active: "in active use",
  shipped: "shipped",
};
