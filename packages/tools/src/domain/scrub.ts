import { type HTMLElement, parse } from "node-html-parser";

export type Rule = { id: string; pattern: string; flags: string; scope: "raw" | "text" };
export type Hit = { file: string; rule: string; match: string };

/** Prose files: text-scope rules apply. Code and data files (.css/.js/.json) only get raw rules. */
const PROSE_EXTENSIONS = [".md", ".txt", ".xml"];

function attributeText(el: HTMLElement): string[] {
  const out: string[] = [];
  for (const name of ["alt", "title"]) {
    const v = el.getAttribute(name);
    if (v) out.push(v);
  }
  if (el.tagName === "META") {
    const v = el.getAttribute("content");
    if (v) out.push(v);
  }
  return out;
}

/** Visible text plus alt/title/meta-content attribute values, with script and style removed. */
function htmlText(html: string): string {
  const root = parse(html);
  for (const el of root.querySelectorAll("script, style")) el.remove();
  const attrs = root.querySelectorAll("*").flatMap(attributeText);
  return [root.text, ...attrs].join("\n");
}

function textSubject(file: string, content: string): string | undefined {
  const lower = file.toLowerCase();
  if (lower.endsWith(".html")) return htmlText(content);
  if (PROSE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return content;
  return undefined;
}

/** Scan one file's content. `raw` rules see the full content; `text` rules see prose only. */
export function scanContent(file: string, content: string, rules: Rule[]): Hit[] {
  const text = textSubject(file, content);
  const hits: Hit[] = [];
  for (const rule of rules) {
    const subject = rule.scope === "raw" ? content : text;
    if (subject === undefined) continue;
    const re = new RegExp(rule.pattern, rule.flags.includes("g") ? rule.flags : `${rule.flags}g`);
    for (const m of subject.matchAll(re)) hits.push({ file, rule: rule.id, match: m[0] });
  }
  return hits;
}
