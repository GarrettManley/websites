import { describe, expect, it } from "vitest";
import { neighbourSlide } from "../../src/index.js";

describe("neighbourSlide", () => {
  it("steps forward inside the range", () => {
    expect(neighbourSlide(0, 1, 3)).toBe(1);
  });

  it("wraps from the last slide to the first", () => {
    expect(neighbourSlide(2, 1, 3)).toBe(0);
  });

  it("wraps from the first slide to the last", () => {
    expect(neighbourSlide(0, -1, 3)).toBe(2);
  });

  it("gives the other slide in both directions when there are two", () => {
    expect([neighbourSlide(0, -1, 2), neighbourSlide(0, 1, 2)]).toEqual([1, 1]);
  });
});
