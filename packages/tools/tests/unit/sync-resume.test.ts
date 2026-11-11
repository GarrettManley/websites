import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { syncPublicResume } from "../../src/app/sync-resume.js";

const fixture: Record<string, unknown> = JSON.parse(
  readFileSync(new URL("../fixtures/public-resume.json", import.meta.url), "utf8"),
);

describe("syncPublicResume", () => {
  it("passes a valid resume through to the writer", async () => {
    const write = vi.fn(async () => {});
    const pdfs = [{ name: "a.pdf", bytes: new Uint8Array([1]) }];
    const result = await syncPublicResume(async () => ({ json: fixture, pdfs }), write);
    expect(write).toHaveBeenCalledWith(result, pdfs);
    expect(result).toEqual(fixture);
  });

  it("throws and writes nothing when json has a phone field", async () => {
    const write = vi.fn(async () => {});
    const basics = fixture.basics as Record<string, unknown>;
    const json = { ...fixture, basics: { ...basics, phone: "555-0100" } };
    await expect(syncPublicResume(async () => ({ json, pdfs: [] }), write)).rejects.toThrow();
    expect(write).not.toHaveBeenCalled();
  });
});
