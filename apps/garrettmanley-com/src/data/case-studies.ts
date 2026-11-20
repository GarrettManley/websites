import { getCollection } from "astro:content";

/** Case-study base path; pages are `${CASE_STUDY_BASE}/${slug}/`. */
export const CASE_STUDY_BASE = "/projects";

/** Every case study entry, in collection order. The slug is the collection id (file basename). */
export async function getCaseStudies() {
  return getCollection("caseStudies");
}
