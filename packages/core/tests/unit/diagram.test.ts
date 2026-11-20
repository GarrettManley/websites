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

  it("reads an attribute value in single quotes", () => {
    const svg = PASSING.replace('class="node"', "class='node'");
    expect(lintDiagram(svg, KEY)).toEqual([]);
  });

  describe("parse", () => {
    it("reports a start tag with an unquoted attribute value", () => {
      const svg = insertBefore("</svg>", '<circle class="bar" r=4 />');
      expect(lintDiagram(svg, KEY)).toEqual([
        'parse: cannot read the start tag <circle class="bar" r=4 />',
      ]);
    });

    it("reports a start tag with a boolean attribute", () => {
      const svg = insertBefore("</svg>", '<circle hidden class="bar" r="4" />');
      expect(lintDiagram(svg, KEY)).toEqual([
        'parse: cannot read the start tag <circle hidden class="bar" r="4" />',
      ]);
    });

    it("reports a start tag with no space between two attributes", () => {
      const svg = insertBefore("</svg>", '<rect class="box"rx="4" />');
      expect(lintDiagram(svg, KEY)).toEqual([
        'parse: cannot read the start tag <rect class="box"rx="4" />',
      ]);
    });

    it("quotes the first 40 characters of a longer tag it cannot read", () => {
      const svg = insertBefore("</svg>", '<circle class="bar" cx=10 cy="10" r="4.5" />');
      expect(lintDiagram(svg, KEY)).toEqual([
        'parse: cannot read the start tag <circle class="bar" cx=10 cy="10" r="4.5',
      ]);
    });

    it("reports a root tag it cannot read", () => {
      expect(lintDiagram("<svg class=dgm></svg>", KEY)).toEqual([
        "parse: cannot read the start tag <svg class=dgm>",
        "root: no <svg> element",
      ]);
    });
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

    it("reports a root without a viewBox", () => {
      const svg = PASSING.replace('  viewBox="0 0 340 120"\n', "");
      expect(lintDiagram(svg, KEY)).toEqual(["root: viewBox (missing) is not 340 wide"]);
    });

    it("accepts a viewBox written with commas", () => {
      const svg = PASSING.replace('viewBox="0 0 340 120"', 'viewBox="0,0,340,120"');
      expect(lintDiagram(svg, KEY)).toEqual([]);
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

    it("reports a root without aria-labelledby", () => {
      const svg = PASSING.replace('  aria-labelledby="d-title"\n', "");
      expect(lintDiagram(svg, KEY)).toEqual(["ids: aria-labelledby (missing) names no <title> id"]);
    });

    it("reports an id that does not start with the root id", () => {
      const svg = PASSING.replaceAll("d-arrow", "arrow");
      expect(lintDiagram(svg, KEY)).toEqual(['ids: id "arrow" does not start with "d-"']);
    });

    it("reports an id that runs on from the root id without a hyphen", () => {
      const svg = insertBefore("</svg>", '<g id="dx"></g>');
      expect(lintDiagram(svg, KEY)).toEqual(['ids: id "dx" does not start with "d-"']);
    });

    it("reports an id declared by two elements", () => {
      const svg = insertBefore("</svg>", '<g id="d-arrow"></g>');
      expect(lintDiagram(svg, KEY)).toEqual(['ids: id "d-arrow" is declared more than once']);
    });

    it("reports a url() reference that names no id in the file", () => {
      const svg = PASSING.replace("url(#d-arrow)", "url(#d-arow)");
      expect(lintDiagram(svg, KEY)).toEqual(['ids: reference "#d-arow" names no id in this file']);
    });

    it.each(["href", "xlink:href"])("reports a %s that names no id in the file", (attr) => {
      const svg = insertBefore("</svg>", `<use ${attr}="#d-shape" />`);
      expect(lintDiagram(svg, KEY)).toEqual(['ids: reference "#d-shape" names no id in this file']);
    });

    it("accepts an href that names an id in the file", () => {
      const svg = insertBefore("</svg>", '<use href="#d-arrow" />');
      expect(lintDiagram(svg, KEY)).toEqual([]);
    });
  });

  describe("classes", () => {
    it("reports a class that is not in the vocabulary", () => {
      const svg = PASSING.replace('class="name"', 'class="nmae"');
      expect(lintDiagram(svg, KEY)).toEqual(['classes: unknown class "nmae" on <text>']);
    });

    it.each([
      ["rect", '<rect x="1" y="1" width="5" height="5" />'],
      ["path", '<path d="M0 0 H5" />'],
      ["line", '<line x1="0" y1="0" x2="5" y2="5" />'],
      ["circle", '<circle cx="3" cy="3" r="2" />'],
      ["text", '<text x="1" y="9">loose</text>'],
      ["polygon", '<polygon points="0,0 9,0 9,9" />'],
      ["polyline", '<polyline points="0,0 9,0 9,9" />'],
      ["ellipse", '<ellipse cx="9" cy="9" rx="4" ry="2" />'],
    ])("reports a %s without a class", (name, markup) => {
      expect(lintDiagram(insertBefore("</svg>", markup), KEY)).toEqual([
        `classes: <${name}> has no class`,
      ]);
    });

    it("reports an empty class attribute", () => {
      const svg = PASSING.replace('class="box store"', 'class=""');
      expect(lintDiagram(svg, KEY)).toEqual(["classes: <rect> has no class"]);
    });

    it("reports a marker path without a class", () => {
      const svg = PASSING.replace('<path class="head" ', "<path ");
      expect(lintDiagram(svg, KEY)).toEqual(["classes: <path> has no class"]);
    });

    it("accepts a shape without a class inside defs", () => {
      const clip = '<clipPath id="d-clip"><rect width="5" height="5" /></clipPath>';
      expect(lintDiagram(insertBefore("</defs>", clip), KEY)).toEqual([]);
    });

    it("accepts a group without a class", () => {
      const svg = insertBefore("</svg>", "<g></g>");
      expect(lintDiagram(svg, KEY)).toEqual([]);
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

    it("reports a literal colour under an upper-case property name in a style attribute", () => {
      const svg = PASSING.replace('class="box store"', 'class="box store" style="FILL: red"');
      expect(lintDiagram(svg, KEY)).toEqual([
        'styling: style "FILL: red" on <rect> is not none, currentColor or var(--color-...)',
      ]);
    });

    it.each(["none", "currentColor", "var(--color-muted)"])("accepts a fill of %s", (paint) => {
      const svg = PASSING.replace('class="box store"', `class="box store" fill="${paint}"`);
      expect(lintDiagram(svg, KEY)).toEqual([]);
    });

    it("accepts a colour token in a style attribute", () => {
      const svg = PASSING.replace(
        'class="box store"',
        'class="box store" style="color: var(--color-muted)"',
      );
      expect(lintDiagram(svg, KEY)).toEqual([]);
    });

    it("reports a font-size attribute below 11", () => {
      const svg = PASSING.replace('class="name"', 'class="name" font-size="10.5"');
      expect(lintDiagram(svg, KEY)).toEqual([
        'styling: font-size="10.5" on <text> is not a number or px value of 11 or more',
      ]);
    });

    it("reports a font-size below 11 in a style attribute", () => {
      const svg = PASSING.replace('class="name"', 'class="name" style="font-size: 10px"');
      expect(lintDiagram(svg, KEY)).toEqual([
        'styling: style "font-size: 10px" on <text> is not a number or px value of 11 or more',
      ]);
    });

    it("reports a small size under an upper-case property name in a style attribute", () => {
      const svg = PASSING.replace('class="name"', 'class="name" style="FONT-SIZE: 6px"');
      expect(lintDiagram(svg, KEY)).toEqual([
        'styling: style "FONT-SIZE: 6px" on <text> is not a number or px value of 11 or more',
      ]);
    });

    it.each(["11%", "1em", "12pt", "large"])("reports a font-size of %s", (size) => {
      const svg = PASSING.replace('class="name"', `class="name" font-size="${size}"`);
      expect(lintDiagram(svg, KEY)).toEqual([
        `styling: font-size="${size}" on <text> is not a number or px value of 11 or more`,
      ]);
    });

    it.each(["11", "11.5", "12px"])("accepts an inline font-size of %s", (size) => {
      const svg = PASSING.replace('class="name"', `class="name" font-size="${size}"`);
      expect(lintDiagram(svg, KEY)).toEqual([]);
    });

    it("reports the font shorthand", () => {
      const svg = PASSING.replace('class="name"', 'class="name" style="font: 12px sans-serif"');
      expect(lintDiagram(svg, KEY)).toEqual([
        'styling: style "font: 12px sans-serif" on <text> uses the font shorthand',
      ]);
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
      expect(lintDiagram(svg, KEY)).toContain('node: 0 elements have class "node", expected 1');
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

    it("accepts a drawn label of exactly fifteen characters", () => {
      const label = "fifteen chars !";
      const svg = PASSING.replace("read &amp; write", label);
      const key = [{ path: "Store to reader", label, detail: "The reader opens the store." }];
      expect(lintDiagram(svg, key)).toEqual([]);
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

    it("reports the lbl class on an element other than text", () => {
      const nested = '<text class="note"><tspan class="lbl">secret</tspan></text>';
      expect(lintDiagram(insertBefore("</svg>", nested), KEY)).toEqual([
        'labels: class "lbl" on <tspan>, expected <text>',
      ]);
    });

    it("matches a label that carries a second class", () => {
      const svg = PASSING.replace('class="lbl"', 'class="lbl anno"');
      expect(lintDiagram(svg, KEY)).toEqual([]);
    });

    it("trims the drawn text before comparing", () => {
      const svg = PASSING.replace("read &amp; write", "\n    read &amp; write\n  ");
      expect(lintDiagram(svg, KEY)).toEqual([]);
    });

    it("collapses a run of whitespace inside the drawn text before comparing", () => {
      const svg = PASSING.replace("read &amp; write", "read\n    &amp;  write");
      expect(lintDiagram(svg, KEY)).toEqual([]);
    });

    it("collapses a run of whitespace inside a key label before comparing", () => {
      const key = [{ path: "Store to reader", label: "read &  write", detail: "Opens it." }];
      expect(lintDiagram(PASSING, key)).toEqual([]);
    });

    // The decimal reference is built from the code point: written out, a "#" followed by digits
    // reads as a tracker reference to the checks that guard this public repository.
    it.each([
      ["&lt;", "<"],
      ["&gt;", ">"],
      [`&#${"&".codePointAt(0)};`, "&"],
      ["&#x26;", "&"],
      ["&#x2192;", "\u2192"],
    ])("decodes %s in the drawn text before comparing", (reference, character) => {
      const svg = PASSING.replace("read &amp; write", `a ${reference} b`);
      const key = [{ path: "Store to reader", label: `a ${character} b`, detail: "Ordering." }];
      expect(lintDiagram(svg, key)).toEqual([]);
    });

    // Built from parts for the same reason. Both are past the last code point.
    it.each([`&#${"9".repeat(10)};`, "&#x110000;"])(
      "leaves the out-of-range reference %s as written",
      (reference) => {
        const svg = PASSING.replace("read &amp; write", reference);
        const key = [{ path: "Store to reader", label: reference, detail: "Ordering." }];
        expect(lintDiagram(svg, key)).toEqual([]);
      },
    );

    it("decodes a reference once, not the text it produces", () => {
      const svg = PASSING.replace("read &amp; write", "a &amp;lt; b");
      const key = [{ path: "Store to reader", label: "a &lt; b", detail: "Ordering." }];
      expect(lintDiagram(svg, key)).toEqual([]);
    });
  });
});
