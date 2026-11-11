import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fsResumeReader, fsResumeWriter } from "../../src/adapters/fs-resume.js";
import { syncPublicResume } from "../../src/app/sync-resume.js";

const fixturePath = new URL("../fixtures/public-resume.json", import.meta.url);
const ATS = "Garrett_Manley_Resume_ATS.pdf";
const STYLED = "Garrett_Manley_Resume_Styled.pdf";
let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "sync-resume-"));
  await mkdir(join(dir, "src"));
  await writeFile(join(dir, "src", "resume.json"), await readFile(fixturePath));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe("fsResumeReader + fsResumeWriter", () => {
  it("round-trips the json and the pdf bytes", async () => {
    const ats = new Uint8Array([37, 80, 68, 70, 1]);
    const styled = new Uint8Array([37, 80, 68, 70, 2]);
    await writeFile(join(dir, "src", ATS), ats);
    await writeFile(join(dir, "src", STYLED), styled);
    await syncPublicResume(
      fsResumeReader(join(dir, "src")),
      fsResumeWriter(join(dir, "content"), join(dir, "pdf")),
    );
    const text = await readFile(join(dir, "content", "resume.json"), "utf8");
    expect(JSON.parse(text)).toEqual(JSON.parse(await readFile(fixturePath, "utf8")));
    expect(text.endsWith("}\n")).toBe(true);
    expect(new Uint8Array(await readFile(join(dir, "pdf", ATS)))).toEqual(ats);
    expect(new Uint8Array(await readFile(join(dir, "pdf", STYLED)))).toEqual(styled);
  });

  it("throws when a PDF is missing", async () => {
    await writeFile(join(dir, "src", ATS), new Uint8Array([1]));
    await expect(fsResumeReader(join(dir, "src"))()).rejects.toThrow();
  });
});
