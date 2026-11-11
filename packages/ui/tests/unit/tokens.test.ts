import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * WCAG contrast gate over the canonical token file. Reads tokens.css as data (no browser):
 * dark = the :root block; light = :root overlaid with the [data-theme="light"] block.
 */
const css = readFileSync(
  fileURLToPath(new URL("../../src/tokens/tokens.css", import.meta.url)),
  "utf8",
);

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`selector not found: ${selector}`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]?.trim()]),
  );
}

const root = block(":root");
const themes = {
  dark: root,
  light: { ...root, ...block(':root[data-theme="light"]') },
};

function hex(vars: Record<string, string>, name: string): string {
  let value = vars[name];
  for (let hops = 0; value?.startsWith("var("); hops++) {
    if (hops > 4) throw new Error(`var() cycle at ${name}`);
    value = vars[value.slice(4, -1).trim()];
  }
  if (!value || !/^#[0-9a-f]{6}$/i.test(value))
    throw new Error(`${name} is not a 6-digit hex: ${value}`);
  return value;
}

function luminance(color: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(color.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT = ["fg", "muted", "accent", "ok", "warn", "danger", "info"];
const GROUNDS = ["bg", "surface", "raised"];
const UI = ["control", "node", "accent"];

describe.each(Object.entries(themes))("%s theme", (_theme, vars) => {
  const c = (fg: string, bg: string) =>
    contrast(hex(vars, `--color-${fg}`), hex(vars, `--color-${bg}`));

  it.each(TEXT.flatMap((fg) => GROUNDS.map((bg) => [fg, bg])))(
    "text %s on %s is at least 4.5:1",
    (fg, bg) => {
      expect(c(fg as string, bg as string)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(UI)("UI %s on bg is at least 3:1", (fg) => {
    expect(c(fg, "bg")).toBeGreaterThanOrEqual(3);
  });

  it("accent-fg on accent is at least 4.5:1", () => {
    expect(c("accent-fg", "accent")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("light theme blocks", () => {
  it("OS-preference and data-theme light blocks define identical tokens", () => {
    expect(block(':root:not([data-theme="dark"])')).toEqual(block(':root[data-theme="light"]'));
  });
});
