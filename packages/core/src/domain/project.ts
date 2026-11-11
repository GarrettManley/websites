import { z } from "zod";

export const Project = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string(),
  url: z.url(),
  tags: z.array(z.string()),
  featured: z.boolean(),
});

export type Project = z.infer<typeof Project>;
