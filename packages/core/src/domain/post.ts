import { z } from "zod";

export const PostFrontmatter = z.object({
  title: z.string(),
  date: z.coerce.date(),
  summary: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type PostFrontmatter = z.infer<typeof PostFrontmatter>;

export type PostSummary = {
  slug: string;
  title: string;
  date: Date;
  summary?: string;
};

/** Newest first; ties broken by title ascending. Returns a new array. */
export function orderPosts(posts: PostSummary[]): PostSummary[] {
  return [...posts].sort(
    (a, b) => b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title),
  );
}
