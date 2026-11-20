import { z } from "zod";

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** A string of at least one word and at most `max` words. */
export const words = (max: number) =>
  z.string().refine((s) => {
    const count = wordCount(s);
    return count >= 1 && count <= max;
  }, `expected 1 to ${max} words`);
