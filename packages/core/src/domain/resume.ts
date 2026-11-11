import { z } from "zod";

const Basics = z
  .object({
    name: z.string(),
    headline: z.string(),
    location: z.string(),
    email: z.literal("garrett@garrettmanley.com"),
    url: z.string(),
    linkedin: z.string(),
    url_label: z.string(),
    linkedin_label: z.string(),
  })
  .strict();

const SkillGroup = z.object({ category: z.string(), items: z.array(z.string()) }).strict();

const Highlight = z.object({ id: z.string(), text: z.string() }).strict();

const Role = z
  .object({
    title: z.string(),
    period: z.string(),
    intro: z.string().nullable(),
    highlights: z.array(Highlight),
  })
  .strict();

const Employer = z
  .object({ company: z.string(), location: z.string(), roles: z.array(Role) })
  .strict();

const Publication = z.object({ title: z.string(), venue: z.string(), date: z.string() }).strict();

const Education = z.object({ school: z.string(), degree: z.string(), date: z.string() }).strict();

/** Public resume payload. Deliberately has no phone, address, or certifications. */
export const PublicResume = z
  .object({
    basics: Basics,
    summary: z.string(),
    skills: z.array(SkillGroup),
    work: z.array(Employer),
    publications: z.array(Publication),
    education: z.array(Education),
  })
  .strict();

export type PublicResume = z.infer<typeof PublicResume>;
