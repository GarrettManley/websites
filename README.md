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

Write `content/case-studies/<slug>.mdx`; the slug becomes the URL `/projects/<slug>/`. Each diagram
sits beside it as `<slug>.<name>.svg`, with its edge key as `<slug>.<name>.key.json`. Every SVG
needs a key file.

Registry rule: every project in `projects.json` needs a `url` or a case study (one, at most), or
the build fails. Registry order is display order, and the first three `featured` entries appear on
the home page.

What a page carries: lead with the stack (`TechTable`) and the diagrams (one `View` each), then the
decisions as short records (`DecisionRecords`). Keep body prose short. A long decision narrative
(what was tried, in what order, what went wrong) belongs in a write-up elsewhere, not on the page.

### Frontmatter

The schema is `packages/core/src/domain/case-study.ts`. Word caps count whitespace-separated words.

| Field | Rule |
| --- | --- |
| `title`, `summary`, `role`, `notice` | Strings; `notice` is optional. |
| `project` | Must equal an `id` in `content/shared/projects.json`. |
| `year`, `status`, `stack` | An integer; `active` or `shipped`; one or more short tags. |
| `metrics` | One to four `{ value, label }` pairs; `label` at most 7 words. |
| `asOf` | The date the page's numbers were true. |
| `stackDetail` | Optional list of `{ layer, tech, version?, role, why?, tier }`. `role` at most 26 words, `why` at most 22; `tier` is `primary` or `supporting`. |
| `decisions` | Optional list of `{ title, rejected, heldBy, limit }`. `rejected` at most 30 words, `heldBy` and `limit` at most 40 each. |

`stackDetail` and `decisions` take no defaults and no transforms in the schema, and their rows
reject unknown keys. The body reads them from the raw `frontmatter` variable, not from the parsed
entry, so what is validated must be exactly what renders: write every field out, `tier` included.

### Body components

These are available in the body without imports. A missing required slot, an empty `rows` or
`records`, or an empty `keyLabel` fails the build.

| Component | Required props | Slots | Use |
| --- | --- | --- | --- |
| `View` | `n`, `kind`, `question`, `caption`, `keyLabel`, `rows` | default (the SVG), `answer` | One diagram: a numbered eyebrow with the view kind, the question as an h2, a one- or two-sentence answer, the figure, and the key as a closed table. `rows` is the imported key file; `keyLabel` is unique on the page. |
| `TechTable` | `rows`, `caption` | none | `rows={frontmatter.stackDetail}`. `primary` rows show, grouped by `layer` in first-appearance order; `supporting` rows sit in a closed disclosure named by the optional `moreLabel`. |
| `DecisionRecords` | `records` | none | `records={frontmatter.decisions}`. Each record prints its title, then Rejected, Held by and Stops short of. |
| `Disclosure` | `summary` | default | Detail that starts closed; `summary` says what opening it shows. |
| `Figure` | `caption` | default | Frame and caption for a drawing outside a `View`, with a prose text equivalent directly beneath it. A `View` already wraps its SVG in one. |
| `Decision` | `n`, `title` | `chose`, `why`, `proof`; optional `rejected` | A long-form decision with Markdown slots. Use sparingly. |

- Write each slot as `<Fragment slot="answer">`, a blank line, Markdown, a blank line,
  `</Fragment>`. Slot tags must be flush-left: an indented slot tag around a list fails the build
  with "Invalid element name".
- No Tailwind utility classes in content. The content folder is not scanned, so they produce no CSS.
- Put `<` and `{` in prose inside backticks.
- No issue-style references (a hash and a number) or home-directory paths anywhere, code excerpts
  included. The privacy gate fails the build on them, but it can miss a reference split across
  highlighted tokens, so read excerpts by eye.

### Diagrams

Import the SVG and its key at the top of the MDX (`import Flow from "./<slug>.flow.svg";` and
`import flowKey from "./<slug>.flow.key.json";`), then give a `View` the component as its default
slot (`<Flow />`) and the key as `rows={flowKey}`. Each diagram is hand-drawn to these rules:

- Root: `<svg class="dgm" id="<root>" role="img" aria-labelledby="<root>-title"
  aria-describedby="<root>-desc" viewBox="0 0 340 <height>">` with `width="440"` and a
  proportional `height`, holding a `<title>` and a `<desc>` with those ids.
- The viewBox is 340 units wide and the drawing runs top-down, so it reads on a phone without
  sideways scroll. No text is smaller than 11 units.
- The SVG is inlined into the page: the root id is unique across the folder, and every other id in
  the file (markers included) is prefixed with it.
- No `<style>` block. The classes below come from `packages/ui/src/diagram.css`; any `fill` or
  `stroke` written in the file is `none`, `currentColor` or a `var(--color-*)` token.
- Outlines use `--color-muted`, not `--color-control`: control is below 3:1 against the figure's
  `--color-surface` in the light theme.

| Class | Element | Means |
| --- | --- | --- |
| `box` | rect | Node: code that runs. |
| `store`, `rule` | rect, plus a line along its top edge | Node: data at rest. |
| `ext` | rect | Node: not part of this system (no fill, dashed outline). |
| `lane`, `lane-label` | rect, plus capitals text | A boundary: a process, thread, package or transaction. |
| `gate` | full-width bar | A lock or checkpoint that everything crossing it must pass. |
| `edge`, `edge cond` | path | Data or a call; with `cond`, dashed: only on a condition. The arrowhead is a marker whose path has class `head`. |
| `bar` | line across the end of a short `edge` stub | "Must not". |
| `name` | text | A node's name in plain words, 14 units. At most 9 per diagram. |
| `note`, `tech` | text | A node's second and third lines, 12 units; `tech` is monospace, for an identifier. |
| `lbl`, `anno` | text | Monospace, 11 units. `lbl` is a drawn edge label, at most 15 characters; `anno` is any other small text (a legend, a gate label). |
| `node` | circle | The amber mark. Exactly one per diagram, on the thing the diagram is about. |

The key file is an array of `{ path, label, detail }`, one row per edge: `path` names the two ends
("Reader → Store"), `label` repeats the text drawn on that edge (an empty string when none is
drawn) and `detail` says what crosses in 1 to 32 words. `View` prints it under the figure, so it is
the figure's text equivalent. `pnpm test` lints every SVG in the folder against its key
(`lintDiagram` in `packages/core/src/domain/diagram.ts`): the root attributes, the id, `<style>`
and colour rules, an inline `font-size` under 11, the single `node`, the 9-name and 15-character
caps, and that the `lbl` texts and the non-empty `label` values are identical, so a label drawn
twice is keyed twice. An SVG with no key file fails.

Numbers drawn into SVG text or written into a key file are dated by `asOf` but are not in the
frontmatter. When `asOf` moves, search the case study's `.svg` and `.key.json` files for digits and
update them in the same change.

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
