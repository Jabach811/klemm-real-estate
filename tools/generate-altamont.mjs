// Generates the invented data for the Altamont piece.
//
// Nothing here is a real household, a real move, or a real morning. The shapes
// are meant to be plausible enough to argue with and are labelled as invented
// everywhere they appear.
//
// Run: node tools/generate-altamont.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BOUNDS, MAP_W, MAP_H, PX_PER_MILE, project, toPath,
  BAY, OCEAN, CHANNELS, RIDGES, ridgeToPolygon, ridgeLabel, CORRIDOR, BRIDGES,
  ORIGINS, DESTINATIONS, PASS,
} from './altamont-geo.mjs';

const FIRST_YEAR = 2015;
const LAST_YEAR = 2026;

// mulberry32 — same generator the career map uses, so both demos are
// reproducible from a seed and nothing drifts between runs.
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round1 = (v) => Math.round(v * 10) / 10;

function gaussian(rng) {
  const u = Math.max(rng(), 1e-9);
  return clamp(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()), -3, 3);
}

function pick(rng, entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let r = rng() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return entries[entries.length - 1];
}

// ---------------------------------------------------------------------------
// The moves
// ---------------------------------------------------------------------------

// Moves per year. The flow is real in shape: a slow climb, a hard jump in 2020
// when the office stopped being a place, a settling after.
const VOLUME = {
  2015: 34, 2016: 41, 2017: 48, 2018: 52, 2019: 57,
  2020: 96, 2021: 118, 2022: 92, 2023: 74, 2024: 79, 2025: 86, 2026: 44,
};

// Destination pull shifts across the decade. Early on it is Tracy and Manteca
// because that is what existed. River Islands and Del Webb arrive mid-decade and
// take share fast.
function destinationWeights(year) {
  const out = [];
  for (const [key, d] of Object.entries(DESTINATIONS)) {
    if (year < d.founded + 1) continue;
    let w = d.weight;
    if (key === 'riverIslands') w *= clamp((year - 2015) / 4, 0.15, 1.9);
    if (key === 'mountainHouse') w *= clamp((year - 2012) / 6, 0.4, 1.5);
    if (key === 'delWebb') w *= clamp((year - 2016) / 3, 0.2, 1.4);
    if (key === 'tracy') w *= clamp(1.35 - (year - 2015) * 0.03, 0.85, 1.35);
    out.push({ key, weight: w });
  }
  return out;
}

function scatterAround(lonLat, milesSd, rng) {
  const [cx, cy] = project(lonLat);
  const sd = milesSd * PX_PER_MILE;
  return [
    round1(clamp(cx + gaussian(rng) * sd, 2, MAP_W - 2)),
    round1(clamp(cy + gaussian(rng) * sd, 2, MAP_H - 2)),
  ];
}

function buildMoves() {
  const rng = makeRng(20260831);
  const originList = Object.entries(ORIGINS).map(([key, o]) => ({ key, weight: o.weight }));
  const moves = [];

  for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
    const dests = destinationWeights(year);
    for (let i = 0; i < VOLUME[year]; i++) {
      const origin = pick(rng, originList);
      const dest = pick(rng, dests);
      const o = ORIGINS[origin.key];
      const d = DESTINATIONS[dest.key];
      const [ox, oy] = scatterAround([o.lon, o.lat], 1.6, rng);
      const [dx, dy] = scatterAround([d.lon, d.lat], dest.key === 'stockton' ? 2.2 : 1.1, rng);
      moves.push([year, origin.key, dest.key, ox, oy, dx, dy]);
    }
  }
  return moves;
}

// ---------------------------------------------------------------------------
// The drive
// ---------------------------------------------------------------------------

// One commuter, one direction, every weekday morning for ten years. Tracy to the
// Peninsula over the San Mateo Bridge — the drive this piece was written about.
//
// Free-flow is about 68 minutes. Everything above that is the part nobody puts
// in a listing: a long right tail, not a wider bell. Most mornings are fine.
// The bad ones are very bad, and they are what you actually remember.
const COMMUTE_FIRST_YEAR = 2016;
const COMMUTE_LAST_YEAR = 2025;

function buildCommute() {
  const rng = makeRng(48219);
  const years = [];

  for (let year = COMMUTE_FIRST_YEAR; year <= COMMUTE_LAST_YEAR; year++) {
    // The base creeps up as the corridor fills in, and drops the year the
    // offices emptied out.
    let base = 66 + (year - COMMUTE_FIRST_YEAR) * 1.15;
    if (year === 2020) base -= 13;
    if (year === 2021) base -= 7;

    const minutes = [];
    for (let day = 0; day < 250; day++) {
      const weekday = day % 5;
      // Tuesday through Thursday carry the load. Friday is a gift.
      const dayFactor = [1.0, 1.06, 1.07, 1.05, 0.9][weekday];
      // Winter mornings: rain, dark, more spinouts on the pass.
      const seasonal = 1 + 0.06 * Math.cos((day / 250) * 2 * Math.PI);

      // Lognormal congestion on top of free-flow.
      const delay = Math.exp(1.95 + gaussian(rng) * 0.62);

      // Roughly one morning in sixteen something actually happens — a wreck on
      // the pass, wind closing the big rigs down, fog in the Delta.
      const incident = rng() < 0.062 ? 30 + rng() * 85 : 0;

      const m = (base + delay) * dayFactor * seasonal + incident;
      minutes.push(Math.round(clamp(m, 58, 235)));
    }
    years.push({ year, minutes });
  }

  const all = years.flatMap((y) => y.minutes).sort((a, b) => a - b);
  const at = (p) => all[Math.floor(all.length * p)];
  const stats = {
    n: all.length,
    mean: Math.round(all.reduce((s, v) => s + v, 0) / all.length),
    median: at(0.5),
    p10: at(0.1),
    p90: at(0.9),
    worst: all[all.length - 1],
    freeFlow: 68,
    overTwoHours: all.filter((v) => v >= 120).length,
    overNinety: all.filter((v) => v >= 90).length,
  };

  return { firstYear: COMMUTE_FIRST_YEAR, lastYear: COMMUTE_LAST_YEAR, years, stats };
}

// ---------------------------------------------------------------------------
// The trade
// ---------------------------------------------------------------------------

// Everything the third screen needs to do its arithmetic in the browser. Kept as
// stated assumptions rather than baked answers so the numbers can be argued with
// and corrected — which is the whole point of the screen.
const TRADE = {
  budget: { min: 2600, max: 6800, step: 100, start: 4200 },

  bay: {
    label: 'Hayward',
    note: 'Renting. Typical three-bedroom stock, 1960s–80s.',
    rentPerSqFt: 3.05,
    minSqFt: 620,
    maxSqFt: 2050,
    yardOdds: 0.25,
    garage: 'Carport or street',
  },

  valley: {
    label: 'Tracy',
    note: 'Buying, 20% down, 30-year fixed.',
    rate: 0.0645,
    downPct: 0.20,
    taxRate: 0.0115,
    insurancePerYear: 1650,
    // Newer master-planned communities carry a special assessment on top of
    // ordinary property tax. Leaving it out is the most common way these
    // comparisons lie.
    melloRoosPerYear: 2400,
    pricePerSqFt: 352,
    minSqFt: 1150,
    maxSqFt: 3400,
    garage: 'Two-car garage',
  },

  // The part that gets left off the fridge-door math.
  commute: {
    milesOneWay: 62,
    daysPerWeek: 4,
    mpg: 29,
    gasPerGallon: 4.62,
    tollPerCrossing: 8,
    upkeepPerMile: 0.19,
    minutesOneWay: null, // filled from the commute stats below
  },
};

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

function geometry() {
  return {
    mapW: MAP_W,
    mapH: MAP_H,
    bounds: BOUNDS,
    pxPerMile: round1(PX_PER_MILE),
    bay: toPath(BAY),
    ocean: toPath(OCEAN),
    channels: CHANNELS.map((c) => toPath(c, false)),
    ridges: RIDGES.map((r) => ({
      key: r.key,
      label: r.label,
      d: toPath(ridgeToPolygon(r.spine, r.width)),
      anchor: ridgeLabel(r.spine),
    })),
    corridor: toPath(CORRIDOR, false),
    bridges: BRIDGES.map((b) => ({ key: b.key, label: b.label, d: toPath(b.line, false) })),
    origins: mapPlaces(ORIGINS),
    destinations: mapPlaces(DESTINATIONS),
    pass: placePoint(PASS),
  };
}

function mapPlaces(places) {
  const out = {};
  for (const [key, p] of Object.entries(places)) out[key] = placePoint(p);
  return out;
}

function placePoint(p) {
  const [x, y] = project([p.lon, p.lat]);
  const out = { label: p.label, x, y };
  if (p.side) out.side = p.side;
  if (p.elevationFt) out.elevationFt = p.elevationFt;
  return out;
}

function main() {
  const commute = buildCommute();
  TRADE.commute.minutesOneWay = commute.stats.median;

  const moves = buildMoves();
  const byYear = {};
  for (const m of moves) byYear[m[0]] = (byYear[m[0]] || 0) + 1;

  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = join(here, '..', 'altamont', 'data', 'altamont.js');
  mkdirSync(dirname(outPath), { recursive: true });

  const body = [
    '// Generated by tools/generate-altamont.mjs. Do not edit by hand.',
    '// Invented data for demonstration. No real households, moves, or mornings.',
    '',
    `window.ALTAMONT_GEO = ${JSON.stringify(geometry(), null, 2)};`,
    '',
    `window.ALTAMONT_MOVES = {`,
    `  firstYear: ${FIRST_YEAR},`,
    `  lastYear: ${LAST_YEAR},`,
    `  perYear: ${JSON.stringify(byYear)},`,
    `  total: ${moves.length},`,
    '  // [year, originKey, destKey, fromX, fromY, toX, toY]',
    `  rows: [`,
    ...moves.map((m) => `    [${m[0]},"${m[1]}","${m[2]}",${m[3]},${m[4]},${m[5]},${m[6]}],`),
    `  ],`,
    `};`,
    '',
    `window.ALTAMONT_COMMUTE = ${JSON.stringify(commute)};`,
    '',
    `window.ALTAMONT_TRADE = ${JSON.stringify(TRADE, null, 2)};`,
    '',
  ].join('\n');

  writeFileSync(outPath, body);

  console.log(`map        ${MAP_W} x ${MAP_H}  (${round1(PX_PER_MILE)} px per mile)`);
  console.log(`moves      ${moves.length} across ${FIRST_YEAR}-${LAST_YEAR}`);
  console.log(`commute    ${commute.stats.n} mornings, median ${commute.stats.median}, worst ${commute.stats.worst}`);
  console.log(`           ${commute.stats.overTwoHours} over two hours (${(100 * commute.stats.overTwoHours / commute.stats.n).toFixed(1)}%)`);
  console.log(`wrote      ${outPath}`);
}

main();
