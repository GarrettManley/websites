import { PublicResume } from "@gm/core";
import raw from "../../../../content/shared/resume.json";

/** Boundary validation at build time: an unknown key (e.g. a phone number) fails the build. */
export const resume: PublicResume = PublicResume.parse(raw);
