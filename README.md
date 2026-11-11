# websites

Personal web platform monorepo. One Astro app per domain (garrettmanley.com now; the .dev lab,
g.recipes and garrettmanley.app later) over shared packages, built with pnpm and Turborepo.

## Layout

```text
packages/
  core/     pure domain + use cases: no Astro, no fs, no fetch
  content/  adapters: Astro loaders + fs/yaml/gh readers
  ui/       presentation only: Astro components, layouts, tokens
  tools/    CLIs that wire adapters into core use cases (sync, import, scrub-check)
  config/   shared tsconfig and tooling presets
apps/
  garrettmanley-com/   entrypoint: loaders + schemas + pages + theme
  garrettmanley-dev/   later (lab)
  # g-recipes/, garrettmanley-app/  future: same shape, no shared-package edits
```

Dependency rule: `core/domain` <- `core/app` <- `content` and `tools` <- `apps/*`. `ui` depends
only on `core/domain` types. Apps are the only place where loaders, schemas and components meet.

## Getting started

Requires Node 24 and pnpm (`corepack enable`).

```sh
pnpm i && pnpm verify
```

Root scripts (`lint`, `typecheck`, `test`, `build`, `verify`, `e2e`, `deploy`, `preview`) each run
`turbo run <task>` across the workspace.

## Adding an app

Create `apps/<name>/` with its own `package.json` exposing the Turbo tasks it needs (`build`,
`lint`, `typecheck`, `test`, `verify`) and extending `@gm/config/tsconfig.base.json`. Do not edit
the shared packages; if you need to, the abstraction is wrong.

## Privacy

This repository is public. Built output must pass `scrub-check` before deploy: no private repo
URLs, local paths, street addresses or phone numbers.

## License

CC BY-NC-ND 4.0. See [LICENSE.md](LICENSE.md).
