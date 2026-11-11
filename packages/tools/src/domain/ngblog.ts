import { slugify } from "@gm/core";
import { stringify } from "yaml";
import { z } from "zod";

const NgBlogPostSchema = z.object({
  author: z.string(),
  content: z.array(z.string()).min(1),
  postDate: z.string().min(10),
  postID: z.string(),
});

export type NgBlogPost = z.infer<typeof NgBlogPostSchema>;

/** Boundary validation for one record of the ng-blog export. */
export function parseNgBlogPost(raw: unknown): NgBlogPost {
  return NgBlogPostSchema.parse(raw);
}

export function mapNgBlogPost(raw: NgBlogPost): { slug: string; markdown: string } {
  const [first = "", ...rest] = raw.content;
  const title = first.replace(/^#\s+/, "");
  const body = rest.join("\n").trim();
  const front = stringify({ title, date: raw.postDate.slice(0, 10), tags: [] }, { lineWidth: 0 });
  return { slug: slugify(title), markdown: `---\n${front}---\n\n${body}` };
}
