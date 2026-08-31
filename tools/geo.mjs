// Coordinate space and geography for the career map.
//
// Node-only. The browser never needs the RNG or the scatter — every sale
// position is baked at generation time — so this file stays an ES module and
// the generator emits the constants the page does need into career-map/data/sales.js.
//
// The space is 1000 x 667, matching the 3:2 reference at
// docs/reference/san-joaquin-county-basemap.png. Y increases downward, so
// north is a LOWER y.

export const MAP_W = 1000;
export const MAP_H = 667;

// spread is the standard deviation, in map units, used when scattering sales
// around the centroid. founded is the first year a sale may exist there.
export const CITIES = {
  tracy:         { label: 'Tracy',                  x: 238, y: 456, spread: 34, founded: 1870 },
  mountainHouse: { label: 'Mountain House',         x: 267, y: 404, spread: 16, founded: 2001 },
  lathrop:       { label: 'Lathrop',                x: 470, y: 400, spread: 20, founded: 1887 },
  riverIslands:  { label: 'River Islands',          x: 449, y: 425, spread: 14, founded: 2014 },
  manteca:       { label: 'Manteca',                x: 537, y: 430, spread: 28, founded: 1918 },
  delWebb:       { label: 'Del Webb at Woodbridge', x: 525, y: 418, spread:  8, founded: 2015 },
  stockton:      { label: 'Stockton',               x: 501, y: 234, spread: 44, founded: 1850 },
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

export function scatter(city, rng) {
  return {
    x: clamp(Math.round(city.x + gaussian(rng) * city.spread), 0, MAP_W),
    y: clamp(Math.round(city.y + gaussian(rng) * city.spread), 0, MAP_H),
  };
}
