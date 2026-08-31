import { test } from 'node:test';
import assert from 'node:assert';
import { CITIES, CITY_KEYS, MAP_W, MAP_H, makeRng, scatter } from './geo.mjs';
import { COUNTY, pointInPolygon } from './basemap-data.mjs';

test('every city sits inside the map viewbox', () => {
  for (const key of CITY_KEYS) {
    const c = CITIES[key];
    assert.ok(c.x > 0 && c.x < MAP_W, `${key} x out of range`);
    assert.ok(c.y > 0 && c.y < MAP_H, `${key} y out of range`);
  }
});

test('Stockton is north of Tracy', () => {
  assert.ok(CITIES.stockton.y < CITIES.tracy.y);
});

test('Del Webb sits on Manteca, not on the Woodbridge near Lodi', () => {
  const dw = CITIES.delWebb;
  const dist = Math.hypot(dw.x - CITIES.manteca.x, dw.y - CITIES.manteca.y);
  assert.ok(dist < 30, `Del Webb is ${dist.toFixed(0)} units off Manteca`);
  // The reference map labels a second Woodbridge just south of Stockton, near
  // Lodi. Del Webb at Woodbridge has nothing to do with it.
  assert.ok(dw.y > CITIES.stockton.y + 120, 'Del Webb drifted north toward Lodi');
});

test('makeRng is deterministic for a given seed', () => {
  const a = makeRng(42);
  const b = makeRng(42);
  assert.strictEqual(a(), b());
  assert.strictEqual(a(), b());
});

test('makeRng returns values in [0,1)', () => {
  const r = makeRng(7);
  for (let i = 0; i < 500; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1);
  }
});

test('scatter stays inside the viewbox and near its centroid', () => {
  const rng = makeRng(3);
  const city = CITIES.stockton;
  // Each axis is clamped to 3 sigma independently, so the bound is per-axis,
  // not radial. +1 absorbs the rounding to integers.
  const limit = city.spread * 3 + 1;
  for (let i = 0; i < 2000; i++) {
    const p = scatter(city, rng);
    assert.ok(p.x >= 0 && p.x <= MAP_W);
    assert.ok(p.y >= 0 && p.y <= MAP_H);
    assert.ok(Math.abs(p.x - city.x) <= limit, `x drifted ${Math.abs(p.x - city.x)}`);
    assert.ok(Math.abs(p.y - city.y) <= limit, `y drifted ${Math.abs(p.y - city.y)}`);
  }
});

test('scatter actually spreads out rather than stacking on the centroid', () => {
  const rng = makeRng(11);
  const city = CITIES.stockton;
  const pts = Array.from({ length: 2000 }, () => scatter(city, rng));
  const meanX = pts.reduce((t, p) => t + p.x, 0) / pts.length;
  const sd = Math.sqrt(pts.reduce((t, p) => t + (p.x - meanX) ** 2, 0) / pts.length);
  // Clamping at 3 sigma trims the tails, so expect a little under the nominal spread.
  assert.ok(sd > city.spread * 0.8, `x spread collapsed to ${sd.toFixed(1)}`);
  assert.ok(sd < city.spread * 1.2, `x spread ballooned to ${sd.toFixed(1)}`);
});

test('scatter never places a sale outside the county', () => {
  const rng = makeRng(19);
  for (const key of CITY_KEYS) {
    for (let i = 0; i < 800; i++) {
      const p = scatter(CITIES[key], rng);
      assert.ok(pointInPolygon(p.x, p.y, COUNTY), `${key} landed at ${p.x},${p.y}`);
    }
  }
});
