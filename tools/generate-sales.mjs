// Generates the invented sale data for the career map demo.
//
// Nothing here corresponds to a real sale, a real address, or a real agent.
// Positions are scattered in the drawn map's own coordinate space, never
// latitude and longitude, so no pin can land on an actual house.
//
// Run: node tools/generate-sales.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITIES, CITY_KEYS, MAP_W, MAP_H, makeRng, scatter } from './geo.mjs';
import { COUNTY, WATER, toPath } from './basemap-data.mjs';

export const BASE_YEAR = 1988;

export const TYPE = { SFH: 0, CONDO: 1, FIFTYFIVE: 2, WATERFRONT: 3 };

export const TYPE_LABELS = ['Single family', 'Condo or townhome', '55+', 'Waterfront'];

// Each era is [fromYear, toYear, salesPerYear, { cityKey: weight }].
// Weights are relative, not percentages — communities that did not exist yet
// are dropped and the rest are renormalised.
export const PROFILES = {
  anchor: {
    label: 'The Anchor',
    start: 1988,
    types: {
      tracy: TYPE.SFH,
      mountainHouse: TYPE.SFH,
      manteca: TYPE.SFH,
      lathrop: TYPE.SFH,
      riverIslands: TYPE.WATERFRONT,
      stockton: TYPE.SFH,
      delWebb: TYPE.FIFTYFIVE,
    },
    eras: [
      [1988, 2000, 82, { tracy: 92, manteca: 4, lathrop: 4 }],
      [2001, 2013, 96, { tracy: 88, mountainHouse: 6, manteca: 3, lathrop: 3 }],
      [2014, 2026, 122, { tracy: 84, mountainHouse: 7, riverIslands: 4, manteca: 3, lathrop: 2 }],
    ],
  },
  drift: {
    label: 'The Drift',
    start: 1995,
    types: {
      stockton: TYPE.SFH,
      manteca: TYPE.SFH,
      lathrop: TYPE.SFH,
      mountainHouse: TYPE.SFH,
      riverIslands: TYPE.WATERFRONT,
      tracy: TYPE.SFH,
    },
    eras: [
      [1995, 2004, 38, { stockton: 82, manteca: 18 }],
      [2005, 2015, 46, { stockton: 22, manteca: 34, lathrop: 34, mountainHouse: 10 }],
      [2016, 2026, 52, { mountainHouse: 48, riverIslands: 34, lathrop: 12, tracy: 6 }],
    ],
  },
  specialist: {
    label: 'The Specialist',
    start: 2007,
    types: {
      riverIslands: TYPE.WATERFRONT,
      delWebb: TYPE.FIFTYFIVE,
      manteca: TYPE.SFH,
      lathrop: TYPE.SFH,
    },
    eras: [
      [2007, 2014, 9, { manteca: 55, lathrop: 45 }],
      [2015, 2019, 18, { delWebb: 62, riverIslands: 26, manteca: 12 }],
      [2020, 2026, 22, { riverIslands: 50, delWebb: 44, manteca: 6 }],
    ],
  },
  newcomer: {
    label: 'The Newcomer',
    start: 2020,
    types: {
      mountainHouse: TYPE.SFH,
      riverIslands: TYPE.WATERFRONT,
      tracy: TYPE.SFH,
      lathrop: TYPE.SFH,
    },
    eras: [
      [2020, 2021, 20, { mountainHouse: 62, tracy: 38 }],
      [2022, 2024, 38, { mountainHouse: 48, riverIslands: 34, tracy: 12, lathrop: 6 }],
      [2025, 2026, 54, { riverIslands: 46, mountainHouse: 40, lathrop: 14 }],
    ],
  },
};

function pickCity(mix, year, rng) {
  const open = Object.entries(mix).filter(([key]) => year >= CITIES[key].founded);
  if (open.length === 0) return null;
  const total = open.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [key, w] of open) {
    roll -= w;
    if (roll <= 0) return key;
  }
  return open[open.length - 1][0];
}

const PRICE_LIFT = {
  riverIslands: 2,
  delWebb: 1,
  mountainHouse: 1,
  tracy: 0,
  lathrop: 0,
  manteca: 0,
  stockton: -1,
};

function priceBand(cityKey, rng) {
  const lift = PRICE_LIFT[cityKey] ?? 0;
  return Math.max(0, Math.min(4, Math.round(rng() * 2 + 1 + lift)));
}

export function generateProfile(profile, rng) {
  const sales = [];
  for (const [from, to, perYear, mix] of profile.eras) {
    for (let year = from; year <= to; year++) {
      // +/- 18% wobble so the accumulation does not look metronomic.
      const n = Math.round(perYear * (0.82 + rng() * 0.36));
      for (let i = 0; i < n; i++) {
        const cityKey = pickCity(mix, year, rng);
        if (!cityKey) continue;
        const p = scatter(CITIES[cityKey], rng);
        sales.push([
          year - BASE_YEAR,
          CITY_KEYS.indexOf(cityKey),
          p.x,
          p.y,
          priceBand(cityKey, rng),
          profile.types[cityKey] ?? TYPE.SFH,
        ]);
      }
    }
  }
  return sales;
}

export function generateAll(seed) {
  const out = {};
  // One RNG per profile, offset from the master seed, so editing one profile's
  // eras does not reshuffle every other profile.
  Object.entries(PROFILES).forEach(([key, profile], i) => {
    out[key] = generateProfile(profile, makeRng(seed + i * 7919));
  });
  return out;
}

function emit(data) {
  const profiles = Object.entries(PROFILES)
    .map(([k, p]) => `    ${k}: { label: ${JSON.stringify(p.label)}, start: ${p.start} }`)
    .join(',\n');

  const cities = CITY_KEYS.map((k) => {
    const c = CITIES[k];
    return `    ${k}: { label: ${JSON.stringify(c.label)}, x: ${c.x}, y: ${c.y}, spread: ${c.spread} }`;
  }).join(',\n');

  const sales = Object.entries(data)
    .map(([k, v]) => `  ${k}: [\n${v.map((s) => `    [${s.join(',')}]`).join(',\n')}\n  ]`)
    .join(',\n');

  return [
    '// Generated by tools/generate-sales.mjs. Do not edit by hand.',
    '// Invented data for demonstration. No real sales, agents, or addresses.',
    '',
    'window.CAREER_MAP_META = {',
    `  baseYear: ${BASE_YEAR},`,
    `  endYear: 2026,`,
    `  mapW: ${MAP_W},`,
    `  mapH: ${MAP_H},`,
    `  cityKeys: ${JSON.stringify(CITY_KEYS)},`,
    `  typeLabels: ${JSON.stringify(TYPE_LABELS)},`,
    '  cities: {',
    cities,
    '  },',
    '  profiles: {',
    profiles,
    '  },',
    `  county: ${JSON.stringify(toPath(COUNTY))},`,
    `  water: ${JSON.stringify(WATER.map(toPath))}`,
    '};',
    '',
    'window.CAREER_MAP_SALES = {',
    sales,
    '};',
    '',
  ].join('\n');
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = join(here, '..', 'career-map', 'data', 'sales.js');
  const data = generateAll(20260830);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, emit(data));
  const counts = Object.entries(data)
    .map(([k, v]) => `${k} ${v.length}`)
    .join(', ');
  console.log(`wrote ${outPath}`);
  console.log(counts);
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('generate-sales.mjs')) main();
