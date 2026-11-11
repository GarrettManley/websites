import { getCollection } from "astro:content";
import { orderPosts, type PostSummary } from "@gm/core";

/** Blog base path; post URLs are `${BLOG_BASE}/${slug}/`. */
export const BLOG_BASE = "/blog";

/** Every post as a `PostSummary`, newest first. The slug is the collection id (file basename). */
export async function getPosts(): Promise<PostSummary[]> {
  const entries = await getCollection("blog");
  return orderPosts(
    entries.map(({ id, data }) => ({
      slug: id,
      title: data.title,
      date: data.date,
      ...(data.summary === undefined ? {} : { summary: data.summary }),
    })),
  );
}
