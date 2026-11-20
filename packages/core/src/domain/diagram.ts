import { z } from "zod";
import { words } from "./words.js";

const MAX_LABEL = 15;
const MAX_NAMES = 9;
const VIEWBOX_WIDTH = 340;
const MIN_FONT_SIZE = 11;

/** The classes the diagram stylesheet defines for elements inside the root (the root has "dgm"). */
export const DIAGRAM_CLASSES: readonly string[] = [
  "box",
  "store",
  "rule",
  "gate",
  "ext",
  "lane",
  "edge",
  "cond",
  "bar",
  "head",
  "name",
  "note",
  "tech",
  "lbl",
  "anno",
  "lane-label",
  "node",
];
const VOCABULARY = new Set(DIAGRAM_CLASSES);
/** Elements that are painted, so each needs a class to take its colours from the stylesheet. */
const DRAWN = new Set(["rect", "path", "line", "circle", "ellipse", "polygon", "polyline", "text"]);

/** One edge of a diagram: where it runs, the label drawn on it (empty when none), what it means. */
export const DiagramKeyRow = z
  .object({
    path: z.string().min(1),
    label: z.string().max(MAX_LABEL),
    detail: words(32),
  })
  .strict();
export type DiagramKeyRow = z.infer<typeof DiagramKeyRow>;

/** The key file beside a diagram: the single place its edges are worded. */
export const DiagramKey = z.array(DiagramKeyRow).min(1);
export type DiagramKey = z.infer<typeof DiagramKey>;

/** A start tag: its attributes and the names of the elements open around it, outermost first. */
type Element = { name: string; attrs: Map<string, string>; inside: string[] };

// Diagram files have a known shape, so tags and attributes are read with regular expressions
// instead of an XML parser. TOKEN matches, in this order: an end tag, a start tag the reader
// understands, and any other start of an element (at most its first 40 characters).
const NAME = String.raw`[A-Za-z][\w:-]*`;
const ATTRS = String.raw`(?:\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*`;
const TOKEN = new RegExp(
  String.raw`</(${NAME})\s*>|<(${NAME})(${ATTRS})\s*(/?)>|<[A-Za-z][^<>]{0,37}[^<]?`,
  "g",
);
const TEXT_ELEMENT = new RegExp(String.raw`<text(${ATTRS})\s*>([\s\S]*?)</text>`, "g");
const ATTR = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const DECLARATION = /([\w-]+)\s*:\s*([^;]+)/g;
const COMMENT = /<!--[\s\S]*?-->/g;

/** Property names in lower case; a style declaration's name is lower-cased before the lookup. */
const PAINT_PROPERTIES = new Set(["fill", "stroke", "color", "stop-color"]);
const PAINT_ALLOWED = /^(?:none|currentColor|var\(--color-[\w-]+\))$/;
const FONT_SIZE = /^\d+(?:\.\d+)?(?:px)?$/;
const URL_REFERENCE = /url\(\s*["']?#([^"')\s]*)["']?\s*\)/g;
const HREF_ATTRIBUTES = new Set(["href", "xlink:href"]);
const LAST_CODE_POINT = 0x10ffff;
const CHARACTER_REFERENCE = /&(?:(amp|lt|gt)|#(\d+)|#x([0-9a-fA-F]+));/g;
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">" };

const attributes = (source: string) =>
  new Map(
    [...source.matchAll(ATTR)].map(([, name = "", double, single]) => [
      name,
      double ?? single ?? "",
    ]),
  );

/**
 * Reads every start tag in document order. A start tag the reader cannot parse (an unquoted or
 * boolean attribute, no space between two attributes) is returned in `unread`, not skipped.
 */
function readElements(source: string): { elements: Element[]; unread: string[] } {
  const elements: Element[] = [];
  const unread: string[] = [];
  const open: string[] = [];
  for (const [text, closed, name, attrs = "", selfClosing] of source.matchAll(TOKEN)) {
    if (closed !== undefined) {
      const depth = open.lastIndexOf(closed);
      if (depth !== -1) open.length = depth;
    } else if (name !== undefined) {
      elements.push({ name, attrs: attributes(attrs), inside: [...open] });
      if (!selfClosing) open.push(name);
    } else {
      unread.push(text.replace(/\s+/g, " "));
    }
  }
  return { elements, unread };
}

const classes = (attrs: Map<string, string>) =>
  (attrs.get("class") ?? "").split(/\s+/).filter(Boolean);
const withClass = (elements: Element[], name: string) =>
  elements.filter((element) => classes(element.attrs).includes(name));

const show = (value: string | undefined) =>
  value === undefined ? "(missing)" : JSON.stringify(value);
const list = (values: string[]) => values.map((value) => JSON.stringify(value)).join(", ");

function rootProblems(root: Element): string[] {
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

/** The ids an element points at: every `url(#x)` in an attribute and every `href="#x"`. */
const references = (element: Element) =>
  [...element.attrs].flatMap(([name, value]) => [
    ...[...value.matchAll(URL_REFERENCE)].map(([, id = ""]) => id),
    ...(HREF_ATTRIBUTES.has(name) && value.startsWith("#") ? [value.slice(1)] : []),
  ]);

function idProblems(root: Element, elements: Element[]): string[] {
  const problems: string[] = [];
  for (const [attr, target] of [
    ["aria-labelledby", "title"],
    ["aria-describedby", "desc"],
  ] as const) {
    const ref = root.attrs.get(attr);
    const named = elements.find((el) => el.name === target && el.attrs.get("id") === ref);
    if (ref === undefined || !named) {
      problems.push(`ids: ${attr} ${show(ref)} names no <${target}> id`);
    }
  }
  const ids = elements.flatMap((element) => element.attrs.get("id") ?? []);
  for (const id of new Set(ids.filter((id, at) => ids.indexOf(id) !== at))) {
    problems.push(`ids: id ${show(id)} is declared more than once`);
  }
  for (const id of new Set(elements.flatMap(references))) {
    if (!ids.includes(id)) {
      problems.push(`ids: reference ${show(`#${id}`)} names no id in this file`);
    }
  }
  // A root without an id is already reported by the root rule.
  const rootId = root.attrs.get("id");
  if (!rootId) return problems;
  const prefix = `${rootId}-`;
  for (const element of elements) {
    const id = element.attrs.get("id");
    if (element !== root && id !== undefined && !id.startsWith(prefix)) {
      problems.push(`ids: id ${show(id)} does not start with ${show(prefix)}`);
    }
  }
  return problems;
}

function classProblems(root: Element, elements: Element[]): string[] {
  const problems: string[] = [];
  for (const element of elements) {
    if (element === root) continue;
    const tokens = classes(element.attrs);
    for (const token of tokens) {
      if (!VOCABULARY.has(token)) {
        problems.push(`classes: unknown class ${show(token)} on <${element.name}>`);
      }
    }
    // Inside <defs> only a marker's path is painted where it is used.
    const painted =
      !element.inside.includes("defs") ||
      (element.name === "path" && element.inside.includes("marker"));
    if (DRAWN.has(element.name) && painted && tokens.length === 0) {
      problems.push(`classes: <${element.name}> has no class`);
    }
  }
  return problems;
}

function stylingProblems(elements: Element[]): string[] {
  const problems: string[] = [];
  for (const element of elements) {
    if (element.name === "style") problems.push("styling: <style> element");
    const inline = [...(element.attrs.get("style") ?? "").matchAll(DECLARATION)].map(
      ([, property = "", value = ""]) => ({
        // CSS property names are case-insensitive; the message quotes the name as written.
        property: property.toLowerCase(),
        value: value.trim(),
        text: `style "${property}: ${value.trim()}"`,
      }),
    );
    const presentation = [...element.attrs].map(([property, value]) => ({
      property,
      value: value.trim(),
      text: `${property}="${value}"`,
    }));
    for (const { property, value, text } of [...presentation, ...inline]) {
      const where = `${text} on <${element.name}>`;
      if (PAINT_PROPERTIES.has(property) && !PAINT_ALLOWED.test(value)) {
        problems.push(`styling: ${where} is not none, currentColor or var(--color-...)`);
      }
      if (
        property === "font-size" &&
        !(FONT_SIZE.test(value) && Number.parseFloat(value) >= MIN_FONT_SIZE)
      ) {
        problems.push(`styling: ${where} is not a number or px value of ${MIN_FONT_SIZE} or more`);
      }
      if (property === "font") problems.push(`styling: ${where} uses the font shorthand`);
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

const collapse = (text: string) => text.replace(/\s+/g, " ").trim();
/**
 * Text as it is drawn: character references decoded once, runs of whitespace collapsed. A numeric
 * reference past the last code point is left as written, so it shows up as a label mismatch.
 */
const drawnText = (source: string) =>
  collapse(
    source.replace(
      CHARACTER_REFERENCE,
      (whole: string, named?: string, decimal?: string, hex?: string) => {
        if (named) return ENTITIES[named] ?? "";
        const point = decimal ? Number(decimal) : Number.parseInt(hex ?? "", 16);
        return point <= LAST_CODE_POINT ? String.fromCodePoint(point) : whole;
      },
    ),
  );

function labelProblems(svg: string, elements: Element[], key: DiagramKeyRow[]): string[] {
  // Only a <text> is read as a label, so the class anywhere else would go unmatched with the key.
  const problems = withClass(elements, "lbl")
    .filter((element) => element.name !== "text")
    .map((element) => `labels: class "lbl" on <${element.name}>, expected <text>`);
  const drawn = [...svg.matchAll(TEXT_ELEMENT)]
    .filter(([, attrs = ""]) => classes(attributes(attrs)).includes("lbl"))
    .map(([, , body = ""]) => drawnText(body));
  const keyed = key.map((row) => collapse(row.label)).filter((label) => label !== "");
  for (const label of drawn.filter((text) => text.length > MAX_LABEL)) {
    problems.push(
      `labels: ${show(label)} is ${label.length} characters, at most ${MAX_LABEL} allowed`,
    );
  }
  const notInKey = without(drawn, keyed);
  const notDrawn = without(keyed, drawn);
  if (notInKey.length > 0) problems.push(`labels: drawn but not in the key: ${list(notInKey)}`);
  if (notDrawn.length > 0) problems.push(`labels: in the key but not drawn: ${list(notDrawn)}`);
  return problems;
}

/**
 * Checks one diagram's SVG source against the house rules and against its key.
 * Returns one message per problem, each starting with the rule it breaks (parse, root, ids,
 * classes, styling, node, name, labels); an empty list means the diagram passes.
 */
export function lintDiagram(svg: string, key: DiagramKeyRow[]): string[] {
  const source = svg.replace(COMMENT, "");
  const { elements, unread } = readElements(source);
  const parseProblems = unread.map((tag) => `parse: cannot read the start tag ${tag}`);
  const root = elements.find((element) => element.name === "svg");
  if (!root) return [...parseProblems, "root: no <svg> element"];

  const nodes = withClass(elements, "node").length;
  const names = withClass(elements, "name").length;
  return [
    ...parseProblems,
    ...rootProblems(root),
    ...idProblems(root, elements),
    ...classProblems(root, elements),
    ...stylingProblems(elements),
    ...(nodes === 1 ? [] : [`node: ${nodes} elements have class "node", expected 1`]),
    ...(names <= MAX_NAMES
      ? []
      : [`name: ${names} elements have class "name", at most ${MAX_NAMES} allowed`]),
    ...labelProblems(source, elements, key),
  ];
}
