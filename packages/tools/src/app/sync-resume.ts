import { PublicResume } from "@gm/core";

export type ResumePdf = { name: string; bytes: Uint8Array };
export type ResumeReader = () => Promise<{ json: unknown; pdfs: ResumePdf[] }>;
export type ResumeWriter = (resume: PublicResume, pdfs: ResumePdf[]) => Promise<void>;

/** Validates the private resume build against PublicResume, then writes it. Throws ZodError before any write. */
export async function syncPublicResume(
  read: ResumeReader,
  write: ResumeWriter,
): Promise<PublicResume> {
  const { json, pdfs } = await read();
  const resume = PublicResume.parse(json);
  await write(resume, pdfs);
  return resume;
}
