import { describe, expect, it } from 'vitest';

import { crossings, ghostOf, pointsOf, segmentsCross, travel } from './trails.js';

describe('segmentsCross', () => {
  it('sees an X', () => {
    expect(segmentsCross([0, 0], [10, 10], [0, 10], [10, 0])).toBe(true);
  });
  it('lets parallel paths pass', () => {
    expect(segmentsCross([0, 0], [10, 10], [0, 4], [10, 14])).toBe(false);
  });
  it('does not count meeting at an end, or lying along one another', () => {
    expect(segmentsCross([0, 0], [10, 0], [10, 0], [10, 10])).toBe(false);
    expect(segmentsCross([0, 0], [10, 0], [5, 0], [15, 0])).toBe(false);
  });
});

describe('crossings', () => {
  it('finds no crossing in paths that travel together', () => {
    const together = [
      [[82, 56], [42, 32]],
      [[128, 39], [98, 21]],
      { points: [[100, 74], [80, 62]], ghost: { x: 70, y: 56, w: 20, h: 12 } },
    ];
    expect(crossings(together)).toEqual([]);
  });
  it('names the pairs that cross', () => {
    const scattered = [
      [[0, 0], [10, 10]],
      [[0, 10], [10, 0]],
      [[20, 0], [30, 0]],
    ];
    expect(crossings(scattered)).toEqual([[0, 1]]);
  });
  it('reads a path with a bend, segment by segment', () => {
    expect(crossings([[[0, 5], [10, 5], [10, 20]], [[5, 0], [5, 10]]])).toEqual([[0, 1]]);
  });
  it('has nothing to find in no arrows', () => {
    expect(crossings()).toEqual([]);
  });
});

describe('travel', () => {
  const rect = { x: 10, y: 20, w: 20, h: 10 };
  it('runs centre to centre, from the offset to the landing', () => {
    expect(pointsOf(travel(rect, 30, 18))).toEqual([[50, 43], [20, 25]]);
    expect(ghostOf(travel(rect, 30, 18))).toBe(rect);
  });
  it('moves the line into a lane and can leave the ghost out', () => {
    const arrow = travel(rect, 0, -14, { lane: { x: 90 }, ghost: false });
    expect(pointsOf(arrow)).toEqual([[90, 11], [90, 25]]);
    expect(ghostOf(arrow)).toBeUndefined();
  });
});
