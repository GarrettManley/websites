import type { SiteLink } from "@gm/core";
import { resume } from "./resume";

export const SITE_TITLE = "Garrett Manley";

export const nav: SiteLink[] = [
  { label: "Resume", href: "/resume/" },
  { label: "Projects", href: "/projects/" },
  { label: "Blog", href: "/blog/" },
  { label: "Contact", href: "/contact/" },
];

export const footerLinks: SiteLink[] = [
  { label: "GitHub", href: "https://github.com/GarrettManley" },
  { label: "LinkedIn", href: resume.basics.linkedin },
  { label: "Lab", href: "https://garrettmanley.dev" },
  { label: "Bluesky", href: "https://bsky.app/profile/garrettmanley.com" },
];

export const resumePdfs: SiteLink[] = [
  { label: "Resume (PDF, ATS)", href: "/resume/Garrett_Manley_Resume_ATS.pdf" },
  { label: "Resume (PDF, styled)", href: "/resume/Garrett_Manley_Resume_Styled.pdf" },
];
