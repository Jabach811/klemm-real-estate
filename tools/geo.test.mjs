import { test } from 'node:test';
import assert from 'node:assert';
import { CITIES, CITY_KEYS, MAP_W, MAP_H, makeRng, scatter } from './geo.mjs';

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

test('Del Webb sits inside Manteca, not near Lodi', () => {
  const dx = CITIES.delWebb.x - CITIES.manteca.x;
  const dy = CITIES.delWebb.y - CITIES.manteca.y;
  assert.ok(Math.hypot(dx, dy) < CITIES.manteca.spread);
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
  const city = CITIES.tracy;
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
  const city = CITIES.tracy;
  const pts = Array.from({ length: 2000 }, () => scatter(city, rng));
  const meanX = pts.reduce((t, p) => t + p.x, 0) / pts.length;
  const sd = Math.sqrt(pts.reduce((t, p) => t + (p.x - meanX) ** 2, 0) / pts.length);
  // Clamping at 3 sigma trims the tails, so expect a little under the nominal spread.
  assert.ok(sd > city.spread * 0.8, `x spread collapsed to ${sd.toFixed(1)}`);
  assert.ok(sd < city.spread * 1.2, `x spread ballooned to ${sd.toFixed(1)}`);
});
