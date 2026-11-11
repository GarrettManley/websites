import { z } from "zod";

export const SiteLink = z.object({ label: z.string(), href: z.string() });

export type SiteLink = z.infer<typeof SiteLink>;
