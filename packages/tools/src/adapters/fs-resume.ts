import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ResumeReader, ResumeWriter } from "../app/sync-resume.js";

const PDF_NAMES = ["Garrett_Manley_Resume_ATS.pdf", "Garrett_Manley_Resume_Styled.pdf"] as const;

export function fsResumeReader(sourceDir: string): ResumeReader {
  return async () => {
    const json: unknown = JSON.parse(await readFile(join(sourceDir, "resume.json"), "utf8"));
    const pdfs = await Promise.all(
      PDF_NAMES.map(async (name) => ({ name, bytes: await readFile(join(sourceDir, name)) })),
    );
    return { json, pdfs };
  };
}

export function fsResumeWriter(contentDir: string, pdfDir: string): ResumeWriter {
  return async (resume, pdfs) => {
    await mkdir(contentDir, { recursive: true });
    await mkdir(pdfDir, { recursive: true });
    await writeFile(join(contentDir, "resume.json"), `${JSON.stringify(resume, null, 2)}\n`);
    for (const pdf of pdfs) await writeFile(join(pdfDir, pdf.name), pdf.bytes);
  };
}
