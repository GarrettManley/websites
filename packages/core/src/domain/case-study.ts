import { z } from "zod";
import { words } from "./words.js";

export const Metric = z.object({ value: z.string(), label: words(7) });
export type Metric = z.infer<typeof Metric>;

export const StackRow = z
  .object({
    layer: z.string().min(1),
    tech: z.string().min(1),
    /** Printed in monospace. Omit when none is recorded. */
    version: z.string().min(1).optional(),
    role: words(26),
    /** Only a reason the project recorded. */
    why: words(22).optional(),
    tier: z.enum(["primary", "supporting"]),
  })
  .strict();
export type StackRow = z.infer<typeof StackRow>;

export const DecisionRecord = z
  .object({
    title: z.string().min(1),
    /** Omit when the project recorded no rejected option. */
    rejected: words(30).optional(),
    heldBy: words(40),
    limit: words(40),
  })
  .strict();
export type DecisionRecord = z.infer<typeof DecisionRecord>;

/**
 * A record's fields in print order. "Rejected" comes last and only when the record has one, so
 * the first two fields hold the same place on every record.
 */
export function decisionFields(record: DecisionRecord): { name: string; text: string }[] {
  return [
    { name: "Enforced by", text: record.heldBy },
    { name: "Known limit", text: record.limit },
    ...(record.rejected === undefined ? [] : [{ name: "Rejected", text: record.rejected }]),
  ];
}

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
  // No defaults or transforms: the MDX body reads the raw YAML,
  // so what is validated is what renders.
  stackDetail: z.array(StackRow).min(1).optional(),
  decisions: z.array(DecisionRecord).min(1).optional(),
});

export type CaseStudyFrontmatter = z.infer<typeof CaseStudyFrontmatter>;

/** Display text for each status. */
export const STATUS_LABEL: Record<CaseStudyFrontmatter["status"], string> = {
  active: "in active use",
  shipped: "shipped",
};
