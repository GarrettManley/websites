import { describe, expect, it } from "vitest";
import { groupStackRows, type StackRow, versionTokens } from "../../src/index.js";

const row = (layer: string, tech: string, tier: StackRow["tier"] = "primary"): StackRow => ({
  layer,
  tech,
  role: "Does one job.",
  tier,
});

describe("groupStackRows", () => {
  it("orders the layers by first appearance", () => {
    const rows = [row("Storage", "SQLite"), row("Capture", "fs4"), row("Agent", "rmcp")];

    const layers = groupStackRows(rows).primary.map((group) => group.layer);

    expect(layers).toEqual(["Storage", "Capture", "Agent"]);
  });

  it("makes one group of a layer that another layer's row splits", () => {
    const first = row("Capture", "std");
    const between = row("Storage", "SQLite");
    const last = row("Capture", "fs4");

    const { primary } = groupStackRows([first, between, last]);

    expect(primary).toEqual([
      { layer: "Capture", rows: [first, last] },
      { layer: "Storage", rows: [between] },
    ]);
  });

  it("groups a layer once in each tier it has rows in", () => {
    const main = row("Capture", "std");
    const extra = row("Capture", "tempfile", "supporting");

    const groups = groupStackRows([main, extra]);

    expect(groups).toEqual({
      primary: [{ layer: "Capture", rows: [main] }],
      supporting: [{ layer: "Capture", rows: [extra] }],
    });
  });

  it("gives no primary group when every row is supporting", () => {
    const rows = [row("Tests", "insta", "supporting"), row("Build", "sccache", "supporting")];

    expect(groupStackRows(rows).primary).toEqual([]);
  });

  it("gives no supporting group when every row is primary", () => {
    const rows = [row("Storage", "SQLite"), row("Agent", "rmcp")];

    expect(groupStackRows(rows).supporting).toEqual([]);
  });
});

describe("versionTokens", () => {
  it("returns a single version as one token", () => {
    expect(versionTokens("3.45.1")).toEqual(["3.45.1"]);
  });

  it("keeps the comma on every token but the last", () => {
    expect(versionTokens("1.0.229, 1.0.154")).toEqual(["1.0.229,", "1.0.154"]);
  });

  it("keeps a token that contains a space whole", () => {
    expect(versionTokens("=0.37.0, glow 0.17.0")).toEqual(["=0.37.0,", "glow 0.17.0"]);
  });
});
