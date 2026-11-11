import { parse } from "node-html-parser";

export type Rule = { id: string; pattern: string; flags: string; scope: "raw" | "text" };
export type Hit = { file: string; rule: string; match: string };

function visibleText(html: string): string {
  const root = parse(html);
  for (const el of root.querySelectorAll("script, style")) el.remove();
  return root.text;
}

/** Scan one file's content. `raw` rules see the full content; `text` rules see HTML visible text. */
export function scanContent(file: string, content: string, rules: Rule[]): Hit[] {
  const isHtml = file.toLowerCase().endsWith(".html");
  const text = isHtml ? visibleText(content) : content;
  const hits: Hit[] = [];
  for (const rule of rules) {
    const subject = rule.scope === "raw" ? content : text;
    const re = new RegExp(rule.pattern, rule.flags.includes("g") ? rule.flags : `${rule.flags}g`);
    for (const m of subject.matchAll(re)) hits.push({ file, rule: rule.id, match: m[0] });
  }
  return hits;
}
