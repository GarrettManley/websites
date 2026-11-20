import type { StackRow } from "./case-study.js";

/** The rows of one layer, in the order they were given. */
export type StackGroup = { layer: string; rows: StackRow[] };

/** One group per layer, in the order the layers first appear. */
function byLayer(rows: StackRow[]): StackGroup[] {
  const groups = new Map<string, StackRow[]>();
  for (const row of rows) {
    const group = groups.get(row.layer);
    if (group) group.push(row);
    else groups.set(row.layer, [row]);
  }
  return [...groups].map(([layer, layerRows]) => ({ layer, rows: layerRows }));
}

/**
 * Splits the stack rows by tier and groups each tier by layer, in first-appearance order.
 * A tier with no rows gives an empty list, so the caller can leave its table out.
 */
export function groupStackRows(rows: StackRow[]): {
  primary: StackGroup[];
  supporting: StackGroup[];
} {
  return {
    primary: byLayer(rows.filter((row) => row.tier === "primary")),
    supporting: byLayer(rows.filter((row) => row.tier === "supporting")),
  };
}

/**
 * The tokens of a version that lists several ("1.0.229, 1.0.154"). Each keeps its comma, so the
 * tokens joined with a space give the original text.
 */
export function versionTokens(version: string): string[] {
  return version.split(/(?<=,) /);
}
