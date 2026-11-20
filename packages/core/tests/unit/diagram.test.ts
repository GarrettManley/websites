import { describe, expect, it } from "vitest";
import { DiagramKey, DiagramKeyRow, lintDiagram } from "../../src/index.js";

const PASSING = `<svg
  xmlns="http://www.w3.org/2000/svg"
  class="dgm"
  id="d"
  role="img"
  aria-labelledby="d-title"
  aria-describedby="d-desc"
  width="440"
  viewBox="0 0 340 120"
>
  <title id="d-title">Store and reader</title>
  <desc id="d-desc">A reader opens the store.</desc>
  <defs>
    <marker id="d-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5">
      <path class="head" d="M0 0 L8 4 L0 8 Z" />
    </marker>
  </defs>
  <rect class="box store" x="6" y="6" width="158" height="52" rx="4" />
  <text class="name" x="18" y="28">Raw store</text>
  <path class="edge cond" d="M85 58 V96" marker-end="url(#d-arrow)" />
  <text class="lbl" x="91" y="80">read &amp; write</text>
  <circle class="node" cx="6" cy="32" r="4.5" />
</svg>`;

const KEY: DiagramKeyRow[] = [
  { path: "Store to reader", label: "read & write", detail: "The reader opens the store." },
  { path: "Reader to screen", label: "", detail: "Drawn without a label." },
];

const row = { path: "A to B", label: "append", detail: "A appends to B." };
const words = (n: number) => Array.from({ length: n }, () => "w").join(" ");
const nameTexts = (n: number) =>
  Array.from({ length: n }, () => '<text class="name">Box</text>').join("");
const insertBefore = (anchor: string, inserted: string) =>
  PASSING.replace(anchor, inserted + anchor);

describe("DiagramKeyRow", () => {
  it("accepts a fifteen-character label", () => {
    expect(DiagramKeyRow.safeParse({ ...row, label: "x".repeat(15) }).success).toBe(true);
  });

  it("rejects a sixteen-character label", () => {
    expect(DiagramKeyRow.safeParse({ ...row, label: "x".repeat(16) }).success).toBe(false);
  });

  it("accepts an empty label", () => {
    expect(DiagramKeyRow.safeParse({ ...row, label: "" }).success).toBe(true);
  });

  it("rejects an empty path", () => {
    expect(DiagramKeyRow.safeParse({ ...row, path: "" }).success).toBe(false);
  });

  it("rejects an empty detail", () => {
    expect(DiagramKeyRow.safeParse({ ...row, detail: "" }).success).toBe(false);
  });

  it("accepts a 32-word detail", () => {
    expect(DiagramKeyRow.safeParse({ ...row, detail: words(32) }).success).toBe(true);
  });

  it("rejects a 33-word detail", () => {
    expect(DiagramKeyRow.safeParse({ ...row, detail: words(33) }).success).toBe(false);
  });

  it("rejects an unknown key", () => {
    expect(DiagramKeyRow.safeParse({ ...row, colour: "amber" }).success).toBe(false);
  });
});

describe("DiagramKey", () => {
  it("accepts one row", () => {
    expect(DiagramKey.safeParse([row]).success).toBe(true);
  });

  it("rejects an empty list", () => {
    expect(DiagramKey.safeParse([]).success).toBe(false);
  });
});

describe("lintDiagram", () => {
  it("returns no problem for a diagram that follows every rule", () => {
    expect(lintDiagram(PASSING, KEY)).toEqual([]);
  });

  it("ignores markup inside a comment", () => {
    const svg = insertBefore("</svg>", '<!-- <circle class="node" fill="#f00" /> -->');
    expect(lintDiagram(svg, KEY)).toEqual([]);
  });

  describe("root", () => {
    it("reports a file with no svg element", () => {
      expect(lintDiagram("<p>not a diagram</p>", KEY)).toEqual(["root: no <svg> element"]);
    });

    it("reports a root without the dgm class", () => {
      const svg = PASSING.replace('class="dgm"', 'class="diagram"');
      expect(lintDiagram(svg, KEY)).toEqual(['root: class "diagram" does not include "dgm"']);
    });

    it("accepts a root that carries dgm among several classes", () => {
      const svg = PASSING.replace('class="dgm"', 'class="wide dgm"');
      expect(lintDiagram(svg, KEY)).toEqual([]);
    });

    it("reports a root whose role is not img", () => {
      const svg = PASSING.replace('role="img"', 'role="presentation"');
      expect(lintDiagram(svg, KEY)).toEqual(['root: role "presentation" is not "img"']);
    });

    it("reports a root without an id", () => {
      const svg = PASSING.replace('  id="d"\n', "");
      expect(lintDiagram(svg, KEY)).toEqual(["root: no id"]);
    });

    it("reports a viewBox that is not 340 wide", () => {
      const svg = PASSING.replace('viewBox="0 0 340 120"', 'viewBox="0 0 360 120"');
      expect(lintDiagram(svg, KEY)).toEqual(['root: viewBox "0 0 360 120" is not 340 wide']);
    });
  });

  describe("ids", () => {
    it("reports an aria-labelledby that names no title", () => {
      const svg = PASSING.replace('aria-labelledby="d-title"', 'aria-labelledby="d-heading"');
      expect(lintDiagram(svg, KEY)).toEqual([
        'ids: aria-labelledby "d-heading" names no <title> id',
      ]);
    });

    it("reports an aria-describedby that names an element other than a desc", () => {
      const svg = PASSING.replace('aria-describedby="d-desc"', 'aria-describedby="d-title"');
      expect(lintDiagram(svg, KEY)).toEqual(['ids: aria-describedby "d-title" names no <desc> id']);
    });

    it("reports an id that does not start with the root id", () => {
      const svg = PASSING.replaceAll("d-arrow", "arrow");
      expect(lintDiagram(svg, KEY)).toEqual([
        'ids: id "arrow" does not start with the root id "d"',
      ]);
    });
  });

  describe("styling", () => {
    it("reports a style element", () => {
      const svg = insertBefore("</svg>", "<style>.dgm .box { stroke-width: 2; }</style>");
      expect(lintDiagram(svg, KEY)).toEqual(["styling: <style> element"]);
    });

    it.each(["fill", "stroke", "color", "stop-color"])("reports a literal %s attribute", (prop) => {
      const svg = PASSING.replace('class="box store"', `class="box store" ${prop}="#abc"`);
      expect(lintDiagram(svg, KEY)).toEqual([
        `styling: ${prop}="#abc" on <rect> is not none, currentColor or var(--color-...)`,
      ]);
    });

    it("reports a literal colour in a style attribute", () => {
      const svg = PASSING.replace('class="box store"', 'class="box store" style="fill: red"');
      expect(lintDiagram(svg, KEY)).toEqual([
        'styling: style "fill: red" on <rect> is not none, currentColor or var(--color-...)',
      ]);
    });

    it("accepts none, currentColor and a colour token", () => {
      const svg = PASSING.replace(
        'class="box store"',
        'class="box store" fill="none" stroke="currentColor" style="color: var(--color-muted)"',
      );
      expect(lintDiagram(svg, KEY)).toEqual([]);
    });

    it("reports a font-size attribute below 11", () => {
      const svg = PASSING.replace('class="name"', 'class="name" font-size="10.5"');
      expect(lintDiagram(svg, KEY)).toEqual([
        'styling: font-size="10.5" on <text> is not 11 or more',
      ]);
    });

    it("reports a font-size below 11 in a style attribute", () => {
      const svg = PASSING.replace('class="name"', 'class="name" style="font-size: 10px"');
      expect(lintDiagram(svg, KEY)).toEqual([
        'styling: style "font-size: 10px" on <text> is not 11 or more',
      ]);
    });

    it("accepts an inline font-size of 11", () => {
      const svg = PASSING.replace('class="name"', 'class="name" font-size="11"');
      expect(lintDiagram(svg, KEY)).toEqual([]);
    });
  });

  describe("node", () => {
    it("reports a diagram with no node", () => {
      const svg = PASSING.replace('class="node"', 'class="head"');
      expect(lintDiagram(svg, KEY)).toEqual(['node: 0 elements have class "node", expected 1']);
    });

    it("reports a diagram with two nodes", () => {
      const svg = insertBefore("</svg>", '<circle class="node" cx="6" cy="90" r="4.5" />');
      expect(lintDiagram(svg, KEY)).toEqual(['node: 2 elements have class "node", expected 1']);
    });

    it("counts a node that carries a second class", () => {
      const svg = PASSING.replace('class="node"', 'class="node store"');
      expect(lintDiagram(svg, KEY)).toEqual([]);
    });

    it("does not count a class that only starts with node", () => {
      const svg = PASSING.replace('class="node"', 'class="node-ring"');
      expect(lintDiagram(svg, KEY)).toEqual(['node: 0 elements have class "node", expected 1']);
    });
  });

  describe("name", () => {
    it("accepts nine names", () => {
      expect(lintDiagram(insertBefore("</svg>", nameTexts(8)), KEY)).toEqual([]);
    });

    it("reports ten names", () => {
      expect(lintDiagram(insertBefore("</svg>", nameTexts(9)), KEY)).toEqual([
        'name: 10 elements have class "name", at most 9 allowed',
      ]);
    });
  });

  describe("labels", () => {
    it("reports a drawn label longer than fifteen characters", () => {
      const label = "sixteen chars ok";
      const svg = PASSING.replace("read &amp; write", label);
      const key = [{ path: "Store to reader", label, detail: "The reader opens the store." }];
      expect(lintDiagram(svg, key)).toEqual([
        'labels: "sixteen chars ok" is 16 characters, at most 15 allowed',
      ]);
    });

    it("reports a drawn label that the key does not have", () => {
      const svg = insertBefore("</svg>", '<text class="lbl">notify</text>');
      expect(lintDiagram(svg, KEY)).toEqual(['labels: drawn but not in the key: "notify"']);
    });

    it("reports a key label that is not drawn", () => {
      const key = [...KEY, { path: "Reader to log", label: "append", detail: "One line." }];
      expect(lintDiagram(PASSING, key)).toEqual(['labels: in the key but not drawn: "append"']);
    });

    it("reports a label drawn twice when the key has it once", () => {
      const svg = insertBefore("</svg>", '<text class="lbl">read &amp; write</text>');
      expect(lintDiagram(svg, KEY)).toEqual(['labels: drawn but not in the key: "read & write"']);
    });

    it("reports both sides when a drawn label and a key label differ", () => {
      const svg = PASSING.replace("read &amp; write", "read only");
      expect(lintDiagram(svg, KEY)).toEqual([
        'labels: drawn but not in the key: "read only"',
        'labels: in the key but not drawn: "read & write"',
      ]);
    });

    it("matches a label that carries a second class", () => {
      const svg = PASSING.replace('class="lbl"', 'class="lbl end"');
      expect(lintDiagram(svg, KEY)).toEqual([]);
    });

    it("trims the drawn text and decodes its entities before comparing", () => {
      const svg = PASSING.replace("read &amp; write", "\n    a &lt; b &gt; c\n  ");
      const key = [{ path: "Store to reader", label: "a < b > c", detail: "Ordering." }];
      expect(lintDiagram(svg, key)).toEqual([]);
    });
  });
});
