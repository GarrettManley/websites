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
  blog/     Markdown posts
  shared/   resume.json, projects.json
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

## Previews and deploys

CI runs `wrangler preview --name pr-<number>` for each affected app on a pull request. A Preview
creates its Worker if it does not exist yet, so a new app needs no prior `wrangler deploy`; its
`wrangler.jsonc` needs a `previews` block (empty is fine). Pushes to `main` run `wrangler deploy`.
Scripts run under pnpm's shell emulator (`shellEmulator: true` in `pnpm-workspace.yaml`), so
`$PR_NUMBER` expands the same way on Windows and Linux.

## Privacy

This repository is public. Built output must pass `scrub-check` (rules in
`packages/tools/denylist.json`) before deploy. Anywhere in the output (markup, CSS, JS, JSON) it
blocks links to non-public GitHub repos, Windows and POSIX home-directory paths, and corporate
directory names. In prose (HTML text, alt/title/meta content, Markdown, XML, plain text) it also
blocks private repo names, tracker IDs and US phone numbers.

## License

CC BY-NC-ND 4.0. See [LICENSE.md](LICENSE.md).
