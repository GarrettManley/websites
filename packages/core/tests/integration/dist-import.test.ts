import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, it } from "vitest";

it("built dist/index.js loads under plain Node ESM", async () => {
  const url = pathToFileURL(resolve(import.meta.dirname, "../../dist/index.js")).href;
  const mod = await import(/* @vite-ignore */ url);
  expect(typeof mod.slugify).toBe("function");
});
