// @ts-check
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://garrettmanley.com",
  output: "static",
  trailingSlash: "always",
  integrations: [mdx(), sitemap()],
  markdown: { shikiConfig: { theme: "css-variables" } },
  vite: { plugins: [tailwindcss()] },
});
