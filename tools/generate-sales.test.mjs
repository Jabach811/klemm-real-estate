import { test } from 'node:test';
import assert from 'node:assert';
import { generateAll, PROFILES, BASE_YEAR, TYPE } from './generate-sales.mjs';
import { CITIES, CITY_KEYS, MAP_W, MAP_H } from './geo.mjs';
import { COUNTY, pointInPolygon } from './basemap-data.mjs';

const SEED = 20260830;
const data = generateAll(SEED);

const cityOf = (s) => CITY_KEYS[s[1]];
const yearOf = (s) => BASE_YEAR + s[0];

test('every profile produced sales', () => {
  for (const key of Object.keys(PROFILES)) {
    assert.ok(data[key].length > 0, `${key} is empty`);
  }
});

test('volumes land near their intended totals', () => {
  const within = (n, target, pct) => Math.abs(n - target) <= target * pct;
  assert.ok(within(data.anchor.length, 3900, 0.12), `anchor was ${data.anchor.length}`);
  assert.ok(within(data.drift.length, 1400, 0.12), `drift was ${data.drift.length}`);
  assert.ok(within(data.specialist.length, 310, 0.15), `specialist was ${data.specialist.length}`);
  assert.ok(within(data.newcomer.length, 240, 0.15), `newcomer was ${data.newcomer.length}`);
});

test('no sale predates its profile or runs past 2026', () => {
  for (const [key, profile] of Object.entries(PROFILES)) {
    for (const s of data[key]) {
      assert.ok(yearOf(s) >= profile.start, `${key} sold in ${yearOf(s)}, starts ${profile.start}`);
      assert.ok(yearOf(s) <= 2026, `${key} sold in ${yearOf(s)}`);
    }
  }
});

test('no sale predates the community being built', () => {
  for (const key of Object.keys(PROFILES)) {
    for (const s of data[key]) {
      const city = CITIES[cityOf(s)];
      assert.ok(
        yearOf(s) >= city.founded,
        `${key}: ${cityOf(s)} sale in ${yearOf(s)}, founded ${city.founded}`,
      );
    }
  }
});

test('every position sits inside the viewbox', () => {
  for (const key of Object.keys(PROFILES)) {
    for (const s of data[key]) {
      assert.ok(s[2] >= 0 && s[2] <= MAP_W, `${key} x ${s[2]}`);
      assert.ok(s[3] >= 0 && s[3] <= MAP_H, `${key} y ${s[3]}`);
    }
  }
});

test('not one sale lands outside San Joaquin County', () => {
  for (const key of Object.keys(PROFILES)) {
    for (const s of data[key]) {
      assert.ok(pointInPolygon(s[2], s[3], COUNTY), `${key} sold at ${s[2]},${s[3]}`);
    }
  }
});

test('the same seed reproduces the same data', () => {
  assert.deepStrictEqual(generateAll(SEED), generateAll(SEED));
});

test('a different seed produces different data', () => {
  assert.notDeepStrictEqual(generateAll(SEED), generateAll(SEED + 1));
});

test('the Anchor is overwhelmingly Tracy', () => {
  const tracy = data.anchor.filter((s) => cityOf(s) === 'tracy').length;
  assert.ok(tracy / data.anchor.length >= 0.8, `only ${tracy}/${data.anchor.length} in Tracy`);
});

test('the Anchor spans the full 38 years', () => {
  const years = data.anchor.map(yearOf);
  assert.strictEqual(Math.min(...years), 1988);
  assert.strictEqual(Math.max(...years), 2026);
});

test('the Drift migrates south over its career', () => {
  const sorted = [...data.drift].sort((a, b) => a[0] - b[0]);
  const slice = Math.floor(sorted.length / 4);
  const meanY = (arr) => arr.reduce((t, s) => t + s[3], 0) / arr.length;
  const early = meanY(sorted.slice(0, slice));
  const late = meanY(sorted.slice(-slice));
  // y increases downward, so a larger late mean means the territory moved south.
  assert.ok(late > early + 60, `drift only moved ${(late - early).toFixed(1)} units south`);
});

test('the Drift ends up in Mountain House and River Islands', () => {
  const late = data.drift.filter((s) => yearOf(s) >= 2016);
  const target = late.filter((s) => cityOf(s) === 'mountainHouse' || cityOf(s) === 'riverIslands');
  assert.ok(target.length / late.length >= 0.7, `only ${target.length}/${late.length} on target`);
});

test('the Specialist is almost entirely waterfront and 55+', () => {
  const core = data.specialist.filter((s) => s[5] === TYPE.WATERFRONT || s[5] === TYPE.FIFTYFIVE);
  assert.ok(
    core.length / data.specialist.length >= 0.7,
    `only ${core.length}/${data.specialist.length} on-type`,
  );
});

test('the Specialist two clusters sit close enough to read as one blob', () => {
  const ri = CITIES.riverIslands;
  const dw = CITIES.delWebb;
  const gap = Math.hypot(ri.x - dw.x, ri.y - dw.y);
  // Close enough that the map misleads, far enough that they are visibly two.
  assert.ok(gap > 30 && gap < 140, `clusters are ${gap.toFixed(0)} units apart`);
});

test('the Newcomer starts in 2020 and accelerates', () => {
  const years = data.newcomer.map(yearOf);
  assert.ok(Math.min(...years) >= 2020);
  const count = (y) => years.filter((v) => v === y).length;
  assert.ok(count(2026) > count(2020) * 1.8, `2026 (${count(2026)}) barely beat 2020 (${count(2020)})`);
});

test('records are compact six-number arrays', () => {
  for (const key of Object.keys(PROFILES)) {
    for (const s of data[key]) {
      assert.strictEqual(s.length, 6);
      assert.ok(s.every((n) => Number.isInteger(n)), `${key} has a non-integer field`);
    }
  }
});
