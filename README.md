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
needs a key file, and every key file an SVG.

Registry rule: every project in `projects.json` needs a `url` or a case study (one, at most), or
the build fails. Registry order is display order, and the first three `featured` entries appear on
the home page.

What a page carries: lead with the stack (`TechTable`) and the diagrams (one `View` each), then the
decisions as short records (`DecisionRecords`). Keep body prose short. A long decision narrative
(what was tried, in what order, what went wrong) belongs in a write-up elsewhere, not on the page.

### Frontmatter

The schema is `packages/core/src/domain/case-study.ts`. A capped field holds at least one
whitespace-separated word and at most its cap; a 26-word field reports "expected 1 to 26 words".

| Field | Rule |
| --- | --- |
| `title`, `summary`, `role`, `notice` | Strings; `notice` is optional. |
| `project` | Must equal an `id` in `content/shared/projects.json`. |
| `year`, `status`, `stack` | An integer; `active` or `shipped`; one or more short tags. |
| `metrics` | One to four `{ value, label }` pairs; `label` at most 7 words. |
| `asOf` | The date the page's numbers were true. |
| `stackDetail` | Optional list, not empty, of `{ layer, tech, version?, role, why?, tier }`. `role` at most 26 words, `why` at most 22; `tier` is `primary` or `supporting`. |
| `decisions` | Optional list, not empty, of `{ title, rejected?, heldBy, limit }`. `rejected` at most 30 words, `heldBy` and `limit` at most 40 each. Leave `rejected` out when the project recorded no rejected option. |

`stackDetail` and `decisions` take no defaults and no transforms in the schema, and their rows
reject unknown keys. The body reads them from the raw `frontmatter` variable, not from the parsed
entry, so what is validated must be exactly what renders: write every field out, `tier` included.

### Body components

These are available in the body without imports. `View` checks every prop and both slots,
`TechTable` its `rows`, `DecisionRecords` its `records` and `Carousel` its `id`, `label` and every
slide: a missing or empty one fails the build.

| Component | Required props | Slots | Use |
| --- | --- | --- | --- |
| `View` | `n`, `kind`, `title`, `caption`, `keyLabel`, `rows` | default (the SVG), `answer` | One diagram. `n` is its position among the page's views, a positive integer: it prints as a two-digit number and makes the section id `view-<n>`, so it must be unique on the page. `kind` is the view type, printed beside the number; `title` is a short statement of what the drawing shows, set as an h2; `answer` is one or two sentences; `rows` is the imported key file and `keyLabel` names it. |
| `TechTable` | `rows`, `caption` | none | `rows={frontmatter.stackDetail}`. `groupStackRows` in `@gm/core` splits the rows by `tier` and groups each tier by `layer` in first-appearance order. `primary` rows show; `supporting` rows sit in a closed disclosure named by the optional `moreLabel`. A tier with no rows gets no table. |
| `DecisionRecords` | `records` | none | `records={frontmatter.decisions}`. Each record prints its number and title, then the fields `decisionFields` in `@gm/core` gives, in this order: Enforced by (`heldBy`), Known limit (`limit`), then Rejected (`rejected`) only when the record has one. |
| `Disclosure` | `summary` | default | Detail that starts closed; `summary` says what opening it shows. |
| `Figure` | `caption` | default | Frame and caption for a drawing outside a `View`, with a prose text equivalent directly beneath it. A `View` already wraps its SVG in one. |
| `Carousel` | `id`, `label`, `slides` | none | Images shown one at a time, without script (radio inputs and labels, so the arrow keys work). `id` must be unique on the page. Each slide is `{ image, alt, caption }`, where `image` is an imported image file; each caption ends with a link to the full-size file. Previous and Next appear only with two or more slides. Use images of one size. |

`View` has two layouts. Below 1024px it is one column, with the key a closed disclosure under the
figure. From 1024px the text and the open key are the left column and the figure a right column up
to 440px wide. The open key's label (`keyLabel`) is an h3 under the view's h2. `View` and
`DecisionRecords` then keep the prose column's left edge and extend right only (`.measure-hang` in
`packages/ui/src/styles.css`). Every record then has three equal columns, so Enforced by and Known
limit line up down the list and a record with no Rejected leaves the third column empty; below
1024px the fields stack in the same order.

- Write each slot as `<Fragment slot="answer">`, a blank line, Markdown, a blank line,
  `</Fragment>`. Slot tags must be flush-left: an indented slot tag around a list fails the build
  with "Invalid element name".
- No Tailwind utility classes in content. The content folder is not scanned, so they produce no CSS.
- Put `<` and `{` in prose inside backticks.
- No issue-style references (a hash and a number) or home-directory paths anywhere, code excerpts
  included. The privacy gate fails the build on them, but it can miss a reference split across
  highlighted tokens, so read excerpts by eye.
- `@astrojs/mdx` is pinned to the version whose markdown-processor pins match the installed Astro.
  Bump the two together and check `pnpm why @astrojs/markdown-satteri` still reports one version.

### Diagrams

Import the SVG and its key at the top of the MDX (`import Flow from "./<slug>.flow.svg";` and
`import flowKey from "./<slug>.flow.key.json";`), then give a `View` the component as its default
slot (`<Flow />`) and the key as `rows={flowKey}`. Each diagram is drawn to these rules:

- Root: `<svg class="dgm" id="<root>" role="img" aria-labelledby="<root>-title"
  aria-describedby="<root>-desc" viewBox="0 0 340 <height>">` with `width="440"` and a
  proportional `height`, holding a `<title>` and a `<desc>` with those ids.
- The drawing is 340 units wide, runs top-down and is as short as it can be without crowding. Its
  frame scales it down to fit: in a 375px viewport the smallest text, 11 units, is about 10.5px.
- The `<desc>` says what a sighted reader gets that the key does not, in under about 110 words: it
  names the technology printed on each node in the sentence that introduces the node, and it ends
  with a sentence saying what the amber mark is on.

| Class | Element | Means, and how it is drawn (placement is not linted) |
| --- | --- | --- |
| `box`, `ext` | rect | `box` is a node: code that runs. `ext` is a node that is not part of this system (no fill, dashed outline). |
| `store`, `rule` | rect, plus a line along its top edge | Node: data at rest. The line runs from `x + 4` to `x + w - 4` at `y + 1.5`. |
| `lane`, `lane-label` | rect with `rx="6"`, plus one line of capitals | A boundary: a process, thread, package or transaction. Boxes sit at least 10 units inside it. The label goes at the top-left (`x + 10`, `y + 15`), or at the top-right (`text-anchor="end"`, `x + w - 10`) only when an edge enters at the top-left; never in the lane's body. |
| `gate` | rect drawn as a bar | A lock or checkpoint that everything crossing it must pass. Its label is a `lane-label` centred in the bar. |
| `edge`, `edge cond` | path | Data or a call, ending on its target's outline; with `cond`, dashed: only on a condition. A dashed path starts 1 unit clear of the outline it leaves and carries no arrowhead: the last 8 units before the head are a separate solid `edge` that does. |
| `head` | path in the marker | The arrowhead. One marker per file, the same in each apart from its id: `<marker id="<root>-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path class="head" d="M0 0 L8 4 L0 8 Z"/></marker>`. |
| `bar` | line across the end of a short `edge` stub | "Must not". |
| `name`, `note`, `tech` | text | A node's lines. `name`: its name in plain words, 14 units, at most 9 per diagram. `note` and `tech`: the second and third lines, 12 units; `tech` is monospace, for an identifier. |
| `lbl`, `anno` | text | Monospace, 11 units. `anno` is small text that is not an edge label (a legend). `lbl` is a drawn edge label, at most 15 characters. It sits within 8 units of its edge, nearer to it than to any node name or lane label and never on a lane label's baseline: 6 units right of a vertical edge, centred on the visible run; directly above a horizontal run that is at least as wide as the label. A shorter horizontal edge gets no drawn label: its key row has an empty `label` and says it in the `detail`. Two labels on one line are anchored on the same side of their edges, at least 16 units apart. |
| `node` | circle with `r="4.5"` | The amber mark. Exactly one per diagram, on the thing the diagram is about: centred on the left edge of the box it marks, at the box's vertical centre; on the box's top-left corner if an edge meets that point; directly before the label when it marks a lane. |

The key file is an array of `{ path, label, detail }` rows, one per edge, with no other fields:
`path` names the two ends ("Reader → Store"), `label` repeats the text drawn on that edge (an empty
string when none is drawn) and `detail` says what crosses in 1 to 32 words. `View` prints it with
the figure; with the `<desc>` it is the figure's text equivalent.

`pnpm test` lints every SVG directly in the folder against its key (`lintDiagram` in
`packages/core/src/domain/diagram.ts`) and fails when the folder has no SVG, an SVG has no valid
key file, a key file has no SVG or two files share a root id. Each message starts with its rule:

| Rule | Requires |
| --- | --- |
| `parse` | Every start tag is readable: each attribute has a quoted value (write double quotes) and a space before it. |
| `root` | Class `dgm`, `role="img"`, an id and a viewBox 340 wide. The width, the height and the viewBox origin are not checked. |
| `ids` | `aria-labelledby` and `aria-describedby` name the `<title>` and `<desc>` ids; no id repeats; every id but the root's starts with `<root>-` (the SVG is inlined into the page); every `url(#x)` and `href="#x"` names an id in the file. |
| `classes` | Inside the root, only classes from the table above, with at least one on every `rect`, `path`, `line`, `circle`, `ellipse`, `polygon`, `polyline` and `text` outside `<defs>` and on the marker's path. |
| `styling` | No `<style>` element and no `font` shorthand; any `fill`, `stroke`, `color` or `stop-color` is `none`, `currentColor` or a `var(--color-*)` token; any `font-size` is a plain number or `px` value of at least 11. A property name in a `style` attribute is matched in any letter case. Write none of these: colour and size come from the classes in `packages/ui/src/diagram.css`. |
| `node`, `name` | Exactly one `node`; at most 9 `name` elements. |
| `labels` | Only a `<text>` carries `lbl`. No `lbl` text is over 15 characters, and the `lbl` texts and the key's non-empty `label` values are the same list, compared after decoding numeric character references and the `amp`, `lt` and `gt` entities and collapsing whitespace. A numeric reference past the last Unicode code point is compared as written. A label drawn twice is keyed twice. |

Numbers drawn into SVG text or written into a key file are dated by `asOf` but are not in the
frontmatter. List them in a YAML comment above `asOf`. When `asOf` moves, search the case study's
`.svg` and `.key.json` files for digits and update them in the same change.

To check placement, render the drawing and measure it. Give the SVG path from the repo root:

```sh
pnpm --filter garrettmanley-com diagram content/case-studies/<slug>.<name>.svg
```

The script draws the SVG in the phone and the desktop figure frame, in both themes, with the site's
fonts. It writes four PNGs to `apps/garrettmanley-com/test-results/diagrams/<slug>.<name>/` and
prints a JSON report: text that overlaps, leaves the viewBox or crosses an outline, edges that run
through text or a box, and the smallest text size in pixels. The loop is: draw, run, read the report
and the PNGs, fix. Expect two or three rounds. The script measures and does not gate: no test and no
CI step runs it, and it does not check the placement rules in the class table, so read the PNGs
against them. It needs Playwright's Chromium
(`pnpm --filter garrettmanley-com exec playwright install chromium`).

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
