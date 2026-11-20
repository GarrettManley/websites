// @ts-check
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://garrettmanley.com",
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap()],
  markdown: { shikiConfig: { theme: "css-variables" } },
  vite: { plugins: [tailwindcss()] },
});
