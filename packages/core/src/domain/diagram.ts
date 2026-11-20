import { z } from "zod";

const MAX_LABEL = 15;
const MAX_NAMES = 9;
const VIEWBOX_WIDTH = 340;
const MIN_FONT_SIZE = 11;

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** One edge of a diagram: where it runs, the label drawn on it (empty when none), what it means. */
export const DiagramKeyRow = z
  .object({
    path: z.string().min(1),
    label: z.string().max(MAX_LABEL),
    detail: z
      .string()
      .refine((s) => wordCount(s) >= 1 && wordCount(s) <= 32, "expected 1 to 32 words"),
  })
  .strict();
export type DiagramKeyRow = z.infer<typeof DiagramKeyRow>;

/** The key file beside a diagram: the single place its edges are worded. */
export const DiagramKey = z.array(DiagramKeyRow).min(1);
export type DiagramKey = z.infer<typeof DiagramKey>;

type Tag = { name: string; attrs: Map<string, string> };

// Diagrams are hand-written files with a known shape, so start tags and attributes are read with
// regular expressions instead of an XML parser.
const ATTRS = String.raw`(?:\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*`;
const START_TAG = new RegExp(String.raw`<([A-Za-z][\w:-]*)(${ATTRS})\s*/?>`, "g");
const TEXT_ELEMENT = new RegExp(String.raw`<text(${ATTRS})\s*>([\s\S]*?)</text>`, "g");
const ATTR = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const DECLARATION = /([\w-]+)\s*:\s*([^;]+)/g;
const COMMENT = /<!--[\s\S]*?-->/g;

const PAINT_PROPERTIES = new Set(["fill", "stroke", "color", "stop-color"]);
const PAINT_ALLOWED = /^(?:none|currentColor|var\(--color-[\w-]+\))$/;
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">" };

const attributes = (source: string) =>
  new Map(
    [...source.matchAll(ATTR)].map(([, name = "", double, single]) => [
      name,
      double ?? single ?? "",
    ]),
  );

const startTags = (svg: string): Tag[] =>
  [...svg.matchAll(START_TAG)].map(([, name = "", attrs = ""]) => ({
    name,
    attrs: attributes(attrs),
  }));

const classes = (attrs: Map<string, string>) => (attrs.get("class") ?? "").split(/\s+/);
const withClass = (tags: Tag[], name: string) =>
  tags.filter((tag) => classes(tag.attrs).includes(name));

const show = (value: string | undefined) =>
  value === undefined ? "(missing)" : JSON.stringify(value);
const list = (values: string[]) => values.map((value) => JSON.stringify(value)).join(", ");

function rootProblems(root: Tag): string[] {
  const problems: string[] = [];
  const className = root.attrs.get("class");
  const role = root.attrs.get("role");
  const viewBox = root.attrs.get("viewBox");
  if (!classes(root.attrs).includes("dgm")) {
    problems.push(`root: class ${show(className)} does not include "dgm"`);
  }
  if (role !== "img") problems.push(`root: role ${show(role)} is not "img"`);
  if (!root.attrs.get("id")) problems.push("root: no id");
  if (Number(viewBox?.trim().split(/[\s,]+/)[2]) !== VIEWBOX_WIDTH) {
    problems.push(`root: viewBox ${show(viewBox)} is not ${VIEWBOX_WIDTH} wide`);
  }
  return problems;
}

function idProblems(root: Tag, tags: Tag[]): string[] {
  const problems: string[] = [];
  for (const [attr, element] of [
    ["aria-labelledby", "title"],
    ["aria-describedby", "desc"],
  ] as const) {
    const ref = root.attrs.get(attr);
    const target = tags.find((tag) => tag.name === element && tag.attrs.get("id") === ref);
    if (ref === undefined || !target) {
      problems.push(`ids: ${attr} ${show(ref)} names no <${element}> id`);
    }
  }
  // A root without an id is already reported by the root rule.
  const rootId = root.attrs.get("id");
  if (!rootId) return problems;
  for (const tag of tags) {
    const id = tag.attrs.get("id");
    if (id !== undefined && !id.startsWith(rootId)) {
      problems.push(`ids: id ${show(id)} does not start with the root id ${show(rootId)}`);
    }
  }
  return problems;
}

function stylingProblems(tags: Tag[]): string[] {
  const problems: string[] = [];
  for (const tag of tags) {
    if (tag.name === "style") problems.push("styling: <style> element");
    const inline = [...(tag.attrs.get("style") ?? "").matchAll(DECLARATION)].map(
      ([, property = "", value = ""]) => ({
        property,
        value: value.trim(),
        text: `style "${property}: ${value.trim()}"`,
      }),
    );
    const presentation = [...tag.attrs].map(([property, value]) => ({
      property,
      value: value.trim(),
      text: `${property}="${value}"`,
    }));
    for (const { property, value, text } of [...presentation, ...inline]) {
      if (PAINT_PROPERTIES.has(property) && !PAINT_ALLOWED.test(value)) {
        problems.push(
          `styling: ${text} on <${tag.name}> is not none, currentColor or var(--color-...)`,
        );
      }
      if (property === "font-size" && !(Number.parseFloat(value) >= MIN_FONT_SIZE)) {
        problems.push(`styling: ${text} on <${tag.name}> is not ${MIN_FONT_SIZE} or more`);
      }
    }
  }
  return problems;
}

/** The members of `from` that `other` does not also hold, counting repeats. */
function without(from: string[], other: string[]): string[] {
  const pool = [...other];
  return from.filter((value) => {
    const at = pool.indexOf(value);
    if (at === -1) return true;
    pool.splice(at, 1);
    return false;
  });
}

function labelProblems(svg: string, key: DiagramKeyRow[]): string[] {
  const drawn = [...svg.matchAll(TEXT_ELEMENT)]
    .filter(([, attrs = ""]) => classes(attributes(attrs)).includes("lbl"))
    .map(([, , body = ""]) =>
      body.replace(/&(amp|lt|gt);/g, (_, entity: string) => ENTITIES[entity] ?? "").trim(),
    );
  const keyed = key.map((row) => row.label).filter((label) => label !== "");
  const problems = drawn
    .filter((label) => label.length > MAX_LABEL)
    .map(
      (label) =>
        `labels: ${show(label)} is ${label.length} characters, at most ${MAX_LABEL} allowed`,
    );
  const notInKey = without(drawn, keyed);
  const notDrawn = without(keyed, drawn);
  if (notInKey.length > 0) problems.push(`labels: drawn but not in the key: ${list(notInKey)}`);
  if (notDrawn.length > 0) problems.push(`labels: in the key but not drawn: ${list(notDrawn)}`);
  return problems;
}

/**
 * Checks one diagram's SVG source against the house rules and against its key.
 * Returns one message per problem, each starting with the rule it breaks; an empty list means the
 * diagram passes.
 */
export function lintDiagram(svg: string, key: DiagramKeyRow[]): string[] {
  const source = svg.replace(COMMENT, "");
  const tags = startTags(source);
  const root = tags.find((tag) => tag.name === "svg");
  if (!root) return ["root: no <svg> element"];

  const nodes = withClass(tags, "node").length;
  const names = withClass(tags, "name").length;
  return [
    ...rootProblems(root),
    ...idProblems(root, tags),
    ...stylingProblems(tags),
    ...(nodes === 1 ? [] : [`node: ${nodes} elements have class "node", expected 1`]),
    ...(names <= MAX_NAMES
      ? []
      : [`name: ${names} elements have class "name", at most ${MAX_NAMES} allowed`]),
    ...labelProblems(source, key),
  ];
}
