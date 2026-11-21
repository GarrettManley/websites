---
name: case-study
description: Use when adding a case-study page for a project, or rewriting one. Gives the ordered steps from evidence to merged page and the points where work must stop. The authoring contract stays in the README.
---

# Case study

The contract is the README section "Adding a case study", with its "Limits of the shape" list.
Read both first. This file gives only the order of work and the stop rules.

1. Find the owner's disclosure decisions for the source project: names, imagery, the role line.
   If none are recorded, ask.
2. Build the evidence pack first. It lives in the source project's own folder, never in this repo.
   Read each facet on the default branch at a recorded commit, then have a second reader try to
   refute it. No headline number comes from an exploration summary.
3. Check the project against "Limits of the shape". If it does not fit, stop and say which limit.
4. Copy `content/case-studies/_template/` to `<slug>.*`. The page shape is fixed. For a new page
   type, or a departure from the shape, build it with placeholder content, shoot it with the
   `shots` script and get the owner's yes on the picture before writing content.
5. Fill the frontmatter from the pack. `rejected` only where the project recorded a rejected
   option. `asOf` is the pack's date.
6. Draw each figure with the `diagram` skill (`.claude/skills/diagram/SKILL.md`).
7. Screenshots and sample output:
   - Show only the owner's own UI and output.
   - Announce every run that opens a window, each time.
   - A capture run that wrote no file has failed.
8. Meet the e2e requirements, named by test: "no figure scrolls sideways" needs at least one
   figure on the page; "steps through its carousel and back to the first image" needs two or more
   slides in a `Carousel`. Use images of one size.
9. Write the body. Default about 450 words of prose; that number is a default, not a rule. A long
   narrative stays in the source project.
10. Run the gates in `AGENTS.md`, run `shots` and read the screenshots. Read code excerpts by eye
    for private identifiers split across highlighted tokens.
11. Review the claims after every rewrite, in batches: a reader, then a second reader who tries to
    refute the first. In scope: body, captions, alt text, each `<desc>`, key rows and frontmatter.
    A fact with a single source is read again at the source.
12. If the page describes work that is not merged in the source project, say so, get a yes, note
    it in the pull request body and open an issue for the re-check.
13. Open a pull request. Wait for green CI. The owner reads the prose on the preview. Squash.

## Stop rules

- No evidence pack, no content.
- A claim the pack does not support is cut or re-read at the source. It is not softened.
- A caption is a claim. Check it against the image and the source.
- A new page shape waits for the owner's yes on a placeholder page.
