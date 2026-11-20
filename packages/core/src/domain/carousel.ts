/**
 * Position of the slide `step` places from `index` in a carousel of `count` slides, wrapping at
 * both ends. Positions are 0-based.
 */
export function neighbourSlide(index: number, step: number, count: number): number {
  return (((index + step) % count) + count) % count;
}
