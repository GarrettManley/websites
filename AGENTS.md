# AGENTS.md

Gotchas for agents in this repo. The README is the reference. This lists only what has gone wrong.

- **Gates, in CI order:** `pnpm turbo run lint typecheck test verify`, then `pnpm turbo run e2e`,
  then an offline link check of each `dist`. CI adds `--affected`; leave it off locally.
- **Under `--filter`:** run test, typecheck and lint as three commands. In
  `pnpm --filter <pkg> test typecheck lint` the extra words reach vitest as file filters.
- **Stale preview:** before local e2e run `pnpm --filter garrettmanley-com exec astro preview stop`.
  Off CI the Playwright config reuses a server already on port 4321 or 8787, so a stale one (from
  another worktree, say) serves an old build.
- **`@gm/core`** resolves to its `dist/`. Outside turbo, run `pnpm --filter @gm/core build` before
  you typecheck or test a package that depends on it.
- **Landing:** pull request, green CI, squash. The owner reads prose on the preview URL that CI
  posts on the pull request. Deploys and previews go through CI only.
- **UI change:** run the `shots` script (README, "Getting started") and read the screenshots before
  saying done. Tailwind drops a class it cannot parse without any error.
- **Page content:** every number, caption and "Rejected" row comes from a verified read of the
  source project. A caption is a claim. For a new page type, show the page shape with placeholder
  content before writing content.
- **This repo is public.** In every tracked file, this one included: no home-directory paths, no
  private repository names or URLs, no tracker or issue ids from other projects, no account,
  player or other identifiers from a source project's data, no corporate directory names. Write
  "the source project". `packages/tools/tests/integration/source-privacy.test.ts` enforces part of
  this (paths, private repo links, one repo name). The rest is on you.
- **Windows:** close editors and language servers that hold a worktree before
  `git worktree remove`, then run `git worktree prune`.
- **Pointers:** README, "Adding a case study", is the authoring contract; do not restate it. The
  skills are `.claude/skills/case-study/SKILL.md` and `.claude/skills/diagram/SKILL.md`.
