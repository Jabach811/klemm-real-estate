import { test } from 'node:test';
import assert from 'node:assert';
import { COUNTY, WATER, toPath, pointInPolygon } from './basemap-data.mjs';
import { CITIES, CITY_KEYS, MAP_W, MAP_H } from './geo.mjs';

test('the county outline stays inside the viewbox', () => {
  for (const [x, y] of COUNTY) {
    assert.ok(x >= 0 && x <= MAP_W, `x ${x}`);
    assert.ok(y >= 0 && y <= MAP_H, `y ${y}`);
  }
});

test('the county fills most of the frame without touching the edges', () => {
  const xs = COUNTY.map((p) => p[0]);
  const ys = COUNTY.map((p) => p[1]);
  assert.ok(Math.min(...xs) > 20 && Math.max(...xs) < MAP_W - 20, 'no horizontal margin');
  assert.ok(Math.min(...ys) > 10 && Math.max(...ys) < MAP_H - 10, 'no vertical margin');
  assert.ok(Math.max(...xs) - Math.min(...xs) > MAP_W * 0.65, 'county too narrow in frame');
  assert.ok(Math.max(...ys) - Math.min(...ys) > MAP_H * 0.8, 'county too short in frame');
});

test('every city centroid lands inside the county', () => {
  for (const key of CITY_KEYS) {
    const c = CITIES[key];
    assert.ok(pointInPolygon(c.x, c.y, COUNTY), `${key} fell outside the county outline`);
  }
});

// Not three sigma. Tracy and Mountain House genuinely stop at the western
// county line, and scatter() rejection-samples anything past it. What matters
// is that no centroid is so close to the edge that most of its cloud is clipped.
test('no city centroid is jammed against the county line', () => {
  for (const key of CITY_KEYS) {
    const c = CITIES[key];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = c.x + dx * c.spread;
      const y = c.y + dy * c.spread;
      assert.ok(pointInPolygon(x, y, COUNTY), `${key} is clipped at one sigma: ${x},${y}`);
    }
  }
});

test('the Delta is the largest water body and sits in the northwest', () => {
  const delta = WATER[0];
  assert.ok(delta.length > 40, 'the Delta lost its detail');
  const meanX = delta.reduce((t, p) => t + p[0], 0) / delta.length;
  const meanY = delta.reduce((t, p) => t + p[1], 0) / delta.length;
  assert.ok(meanX < MAP_W / 2, 'the Delta drifted east');
  assert.ok(meanY < MAP_H / 2, 'the Delta drifted south');
});

test('toPath emits a closed path', () => {
  const d = toPath([[1, 2], [3, 4], [5, 6]]);
  assert.strictEqual(d, 'M1,2 L3,4 L5,6 Z');
});

test('pointInPolygon agrees with an obvious square', () => {
  const sq = [[0, 0], [10, 0], [10, 10], [0, 10]];
  assert.ok(pointInPolygon(5, 5, sq));
  assert.ok(!pointInPolygon(15, 5, sq));
  assert.ok(!pointInPolygon(5, -1, sq));
});
