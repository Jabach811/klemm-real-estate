// Coordinate space and geography for the career map.
//
// Node-only. The browser never needs the RNG or the scatter — every sale
// position is baked at generation time — so this file stays an ES module and
// the generator emits the constants the page does need into career-map/data/sales.js.
//
// The space is 1000 x 667, matching the 3:2 reference at
// docs/reference/san-joaquin-county-basemap.png. Y increases downward, so
// north is a LOWER y.
//
// Centroids were read off the reference's own markers and labels. The scale
// works out to roughly 16 map units per mile, which is what sets each spread:
// a spread is the city's rough radius in miles times 16, divided by three, so
// that three standard deviations lands near the edge of the built-up area.

import { COUNTY, pointInPolygon } from './basemap-data.mjs';

export const MAP_W = 1000;
export const MAP_H = 667;

// spread is the standard deviation, in map units, used when scattering sales
// around the centroid. founded is the first year a sale may exist there.
export const CITIES = {
  tracy:         { label: 'Tracy',                  x: 248, y: 464, spread: 15, founded: 1870 },
  mountainHouse: { label: 'Mountain House',         x: 238, y: 412, spread:  7, founded: 2001 },
  lathrop:       { label: 'Lathrop',                x: 471, y: 401, spread:  9, founded: 1887 },
  riverIslands:  { label: 'River Islands',          x: 440, y: 424, spread:  6, founded: 2014 },
  manteca:       { label: 'Manteca',                x: 526, y: 441, spread: 12, founded: 1918 },
  delWebb:       { label: 'Del Webb at Woodbridge', x: 516, y: 428, spread:  3, founded: 2015 },
  stockton:      { label: 'Stockton',               x: 479, y: 249, spread: 24, founded: 1850 },
};

export const CITY_KEYS = Object.keys(CITIES);

// mulberry32 — small, fast, deterministic.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Box-Muller, clamped to 3 sigma so nothing lands in the next county.
function gaussian(rng) {
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return clamp(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v), -3, 3);
}

// Tracy and Mountain House sit right up against the western county line, so a
// plain gaussian would put sales in Alameda County. Redraw until the point is
// inside, then fall back to the centroid. The flat western edge this produces
// on Tracy's cloud is not an artefact — the city really does stop at the line.
export function scatter(city, rng) {
  for (let tries = 0; tries < 24; tries++) {
    const x = clamp(Math.round(city.x + gaussian(rng) * city.spread), 0, MAP_W);
    const y = clamp(Math.round(city.y + gaussian(rng) * city.spread), 0, MAP_H);
    if (pointInPolygon(x, y, COUNTY)) return { x, y };
  }
  return { x: city.x, y: city.y };
}
