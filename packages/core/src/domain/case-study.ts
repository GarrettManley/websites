import { z } from "zod";

const words = (max: number) => (s: string) => s.trim().split(/\s+/).length <= max;

export const Metric = z.object({ value: z.string(), label: z.string().refine(words(7)) });
export type Metric = z.infer<typeof Metric>;

export const StackRow = z
  .object({
    layer: z.string().min(1),
    tech: z.string().min(1),
    /** Printed in monospace. Omit when none is recorded. */
    version: z.string().min(1).optional(),
    role: z.string().refine(words(26)),
    /** Only a reason the project recorded. */
    why: z.string().refine(words(22)).optional(),
    tier: z.enum(["primary", "supporting"]),
  })
  .strict();
export type StackRow = z.infer<typeof StackRow>;

export const DecisionRecord = z
  .object({
    title: z.string().min(1),
    rejected: z.string().refine(words(30)),
    heldBy: z.string().refine(words(40)),
    limit: z.string().refine(words(40)),
  })
  .strict();
export type DecisionRecord = z.infer<typeof DecisionRecord>;

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
  // No defaults or transforms: the MDX body reads the raw YAML, so what is validated is what renders.
  stackDetail: z.array(StackRow).min(1).optional(),
  decisions: z.array(DecisionRecord).min(1).optional(),
});

export type CaseStudyFrontmatter = z.infer<typeof CaseStudyFrontmatter>;

/** Display text for each status. */
export const STATUS_LABEL: Record<CaseStudyFrontmatter["status"], string> = {
  active: "in active use",
  shipped: "shipped",
};
