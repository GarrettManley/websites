---
name: diagram
description: Use when drawing or changing a case-study diagram, which is an SVG with a key file under content/case-studies/. Gives the order of work and the stop rule. The drawing rules stay in the README.
---

# Diagram

The contract is the README section "Diagrams", under "Adding a case study": the root attributes,
the class table, the key file and the lint rules. Read it first. This file gives only the order of
work.

1. Decide before drawing: the one statement the figure makes, the one thing the amber mark is on,
   at most 9 names, and one key row per edge.
2. Copy `content/case-studies/_template/diagram.svg` and `diagram.key.json` to
   `content/case-studies/<slug>.<name>.svg` and `<slug>.<name>.key.json`. Rename the root id, and
   every id that starts with it, to `<short-project-prefix>-<name>`.
3. Draw. Write the `<desc>` and the key rows with the drawing, not after it.
4. Lint: `pnpm turbo run test --filter=@gm/tools`. Fix every message from the diagram test.
5. Measure: `pnpm --filter garrettmanley-com diagram content/case-studies/<slug>.<name>.svg`. Fix
   every error in the JSON report. Answer every warning: fix it or say why it stands.
6. Read the four PNGs against the class table. The script does not check the placement rules.
7. With more than one diagram on the page, compare them once: one marker shape, one store rule
   line, a solid stub before each arrowhead on a dashed edge.
8. List every number drawn into the SVG or written into its key in the YAML comment above `asOf`.

## Stop rule

Steps 4 to 6 are one round. After two rounds, if the report still has an error or a PNG still
breaks a placement rule, stop and escalate: name the rule and show the PNG. Do not keep moving
coordinates.
