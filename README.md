# websites

Personal web platform monorepo. One Astro app per domain (garrettmanley.com now; the .dev lab,
g.recipes and garrettmanley.app later) over shared packages, built with pnpm and Turborepo.

## Layout

```text
packages/
  core/     domain schemas and rules (Zod): no Astro, no fs, no fetch
  ui/       presentation only: Astro components, layouts, Tailwind tokens
  tools/    Node CLIs (sync-resume, import-ngblog, scrub-check): domain <- app <- adapters <- cli
  config/   shared tsconfig base
apps/
  garrettmanley-com/   entrypoint: content collections, data loaders, pages, theme
  # garrettmanley-dev/, g-recipes/, garrettmanley-app/  later: same shape, no shared-package edits
content/
  blog/          Markdown posts
  case-studies/  MDX case studies, one per project, with their diagrams
  shared/        resume.json, projects.json
```

Dependency rule: `core` is the innermost ring. `ui` depends only on `core` types, `tools`
depends on `core`, and apps depend on all three. Apps are the only place where content loading,
schemas and components meet.

## Getting started

Requires Node 24 and pnpm (`corepack enable`).

```sh
pnpm i && pnpm verify
```

Root scripts (`lint`, `typecheck`, `test`, `build`, `verify`, `e2e`, `deploy`, `preview`) each run
`turbo run <task>` across the workspace.

## Adding an app

Create `apps/<name>/` with its own `package.json` exposing the Turbo tasks it needs (`build`,
`lint`, `typecheck`, `test`, `verify`, `e2e`, `deploy`, `preview`). Astro apps extend
`astro/tsconfigs/strict`; non-Astro packages add `"@gm/config": "workspace:*"` as a devDependency
and extend `@gm/config/tsconfig.base.json`. `BaseLayout` takes a `lang` prop and a `head` slot for
per-app tags (canonical link, favicon). Do not edit the shared packages; if you need to, the
abstraction is wrong.

## Adding a case study

Write `content/case-studies/<slug>.mdx`, with any diagram beside it as `<slug>.<name>.svg`. The
slug becomes the URL `/projects/<slug>/`. The frontmatter schema is
`packages/core/src/domain/case-study.ts`: `project` must equal an `id` in
`content/shared/projects.json`, `metrics` holds one to four `{ value, label }` pairs, `asOf` dates
the numbers, and `notice` is optional.

Registry rule: every project in `projects.json` needs a `url` or a case study (one, at most), or
the build fails. Registry order is display order, and the first three `featured` entries appear on
the home page.

Body rules:

- `Decision` and `Figure` are available without imports. `Decision` takes `n` and `title` and the
  slots `chose`, `why` and `proof` (required; a missing one fails the build) and `rejected`
  (optional). Write each slot as `<Fragment slot="chose">`, a blank line, Markdown, a blank line,
  `</Fragment>`. Slot tags must be flush-left: an indented slot tag around a list fails the build
  with "Invalid element name".
- No Tailwind utility classes in content. The content folder is not scanned, so they produce no CSS.
- Put `<` and `{` in prose inside backticks.
- No issue-style references (a hash and a number) or home-directory paths anywhere, code excerpts
  included. The privacy gate fails the build on them, but it can miss a reference split across
  highlighted tokens, so read excerpts by eye.

Diagram vocabulary:

- Hand-drawn SVG, imported at the top of the MDX and placed inside `<Figure caption="...">`, with a
  prose text equivalent directly beneath the figure.
- `role="img"` with a `<title>` (the name, via `aria-labelledby`) and a `<desc>` (the description,
  via `aria-describedby`), their ids unique to the file.
- A `viewBox` about 360 units wide, laid out top-down so it reads on a phone.
- Colors only from `var(--color-*)`: boxes filled `--color-raised` (outlined `--color-control`) on
  the figure's `--color-surface` frame; edges and external (dashed) boxes in `--color-muted`; text
  in `--color-fg` or `--color-muted`; `--color-node` (amber) at most once, on the one thing the
  diagram is about.
- Give the root `<svg>` an id and scope every selector in its `<style>` under it.

Dependencies: `@astrojs/mdx` is pinned to the version whose markdown-processor pins match the
installed Astro. Bump the two together and check `pnpm why @astrojs/markdown-satteri` still reports
one version.

## Previews and deploys

CI runs `wrangler preview --name pr-<number>` for each affected app on a pull request. A Preview
creates its Worker if it does not exist yet, so a new app needs no prior `wrangler deploy`; its
`wrangler.jsonc` needs a `previews` block (empty is fine). Pushes to `main` run `wrangler deploy`.
Scripts run under pnpm's shell emulator (`shellEmulator: true` in `pnpm-workspace.yaml`), so
`$PR_NUMBER` expands the same way on Windows and Linux.

## Secrets

CI reads `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from GitHub Actions secrets. They are
copied from a 1Password item in a vault that unattended automation cannot read. `.env.tpl` holds
the `op://` references only, never values.

- **Sync to GitHub, or run wrangler locally:** run `Invoke-WithSecrets -Interactive -- <command>`
  from inside the repo. Each run needs a Windows Hello approval. `Invoke-WithSecrets` is the
  maintainer's machine-local 1Password helper, in `~/scripts/lib`.
- **Rotate:** mint a new token, update the 1Password item, re-sync, confirm a green CI preview,
  then revoke the old token.
- **If the token is compromised:** revoke it in Cloudflare first, then do the rotation steps.

## Privacy

This repository is public. Built output must pass `scrub-check` (rules in
`packages/tools/denylist.json`) before deploy. Anywhere in the output (markup, CSS, JS, JSON) it
blocks links to non-public GitHub repos, Windows and POSIX home-directory paths, and corporate
directory names. In prose (HTML text, alt/title/meta content, Markdown, XML, plain text) it also
blocks private repo names, tracker IDs and US phone numbers.

## License

CC BY-NC-ND 4.0. See [LICENSE.md](LICENSE.md).
