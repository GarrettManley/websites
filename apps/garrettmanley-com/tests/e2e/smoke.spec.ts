import { readdirSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { expect, test } from "@playwright/test";

const RESUME = new URL("../../../../content/shared/resume.json", import.meta.url);
const BLOG_DIR = new URL("../../../../content/blog/", import.meta.url);
const CASE_STUDY_DIR = new URL("../../../../content/case-studies/", import.meta.url);
const PDFS = ["/resume/Garrett_Manley_Resume_ATS.pdf", "/resume/Garrett_Manley_Resume_Styled.pdf"];
const NOT_FOUND_HEADING = "Page not found";

/** Collection ids are the file basenames; any post works for the route check. */
function firstPostPath(): string {
  const first = readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()[0];
  if (!first) throw new Error("content/blog has no posts");
  return `/blog/${basename(first, ".md")}/`;
}

/** Collection ids are the file basenames; any case study works for the route check. */
function firstCaseStudyPath(): string {
  const first = readdirSync(CASE_STUDY_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .sort()[0];
  if (!first) throw new Error("content/case-studies has no entries");
  return `/projects/${basename(first, ".mdx")}/`;
}

type RenderedResume = {
  summary: string;
  skills: { category: string; items: string[] }[];
  work: { roles: { title: string; highlights: { text: string }[] }[] }[];
};

/** Text nodes ResumeView renders (skill items are joined); excludes ids, URLs and *_label fields. */
function renderedText(resume: RenderedResume): string[] {
  return [
    resume.summary,
    ...resume.skills.flatMap((g) => [g.category, g.items.join(", ")]),
    ...resume.work.flatMap((e) =>
      e.roles.flatMap((r) => [r.title, ...r.highlights.map((h) => h.text)]),
    ),
  ];
}

test("core routes return 200", async ({ request }) => {
  const paths = [
    "/",
    "/resume/",
    "/projects/",
    "/blog/",
    "/contact/",
    firstPostPath(),
    firstCaseStudyPath(),
  ];
  for (const path of paths) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
  }
});

test("nav links resolve", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });
  const labels = await nav.getByRole("link").allTextContents();
  expect(labels.length).toBeGreaterThan(0);
  for (const label of labels) {
    await page.goto("/");
    const response = page.waitForResponse((r) => r.request().isNavigationRequest());
    await nav.getByRole("link", { name: label, exact: true }).click();
    expect((await response).status(), label).toBe(200);
    await expect(page.getByRole("heading", { name: NOT_FOUND_HEADING })).toHaveCount(0);
  }
});

test("resume renders literal ampersand", async ({ page }) => {
  const resume = JSON.parse(readFileSync(RESUME, "utf8")) as RenderedResume;
  const sample = renderedText(resume).find((s) => s.includes("&") && !s.includes("\n"));
  test.skip(!sample, "no resume text contains '&'");
  await page.goto("/resume/");
  const el = page.getByText(sample as string, { exact: true }).first();
  await expect(el).toBeVisible();
  const text = await el.textContent();
  expect(text).toContain("&");
  expect(text).not.toContain("&amp;");
});

test("resume pdf links resolve", async ({ request }) => {
  for (const path of PDFS) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()["content-type"], path).toContain("application/pdf");
  }
});

test.describe("on a 375px viewport", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("case study has no horizontal overflow", async ({ page }) => {
    await page.goto(firstCaseStudyPath());
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    // Symmetric overflow-free layouts can still touch the viewport edge: keep the gutter.
    const wide = await page.locator(".measure-wide").first().boundingBox();
    expect(wide?.x).toBeGreaterThan(0);
  });
});

test.describe("on the Workers asset handler", () => {
  test.use({ baseURL: "http://localhost:8787" });

  test("unknown route is 404", async ({ page }) => {
    const res = await page.goto("/does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: NOT_FOUND_HEADING })).toBeVisible();
  });
});
