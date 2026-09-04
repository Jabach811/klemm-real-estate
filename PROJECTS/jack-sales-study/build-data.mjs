import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Official source series: FHFA All-Transactions HPI for San Joaquin County,
// CA, retrieved from FRED series ATNHPIUS06077A on 2026-08-31. Index: 2000=100.
const HPI = [
  [1986, 54.93], [1987, 58.42], [1988, 65.66], [1989, 76.78], [1990, 84.73],
  [1991, 85.92], [1992, 85.05], [1993, 82.85], [1994, 80.74], [1995, 78.31],
  [1996, 76.97], [1997, 77.09], [1998, 81.40], [1999, 86.79], [2000, 100.00],
  [2001, 118.99], [2002, 128.47], [2003, 139.01], [2004, 166.09], [2005, 215.59],
  [2006, 233.76], [2007, 207.19], [2008, 134.10], [2009, 105.08], [2010, 101.81],
  [2011, 94.85], [2012, 95.63], [2013, 114.48], [2014, 138.34], [2015, 147.92],
  [2016, 162.00], [2017, 176.47], [2018, 190.94], [2019, 199.21], [2020, 205.95],
  [2021, 242.99], [2022, 280.42], [2023, 276.50], [2024, 288.12], [2025, 285.59],
];

const BASE_PRICE_2000 = 165000;

const COMMUNITY = {
  Tracy: { available: 1900, factor: 1.00, neighborhoods: ['Central', 'West', 'North', 'South'] },
  Manteca: { available: 1900, factor: 0.92, neighborhoods: ['Central', 'Northgate', 'East', 'South'] },
  Lathrop: { available: 1900, factor: 0.96, neighborhoods: ['Central', 'Mossdale', 'North', 'South'] },
  'Mountain House': { available: 2002, factor: 1.08, neighborhoods: ['Wicklund', 'Altamont', 'Cordes', 'Bethany'] },
  'River Islands': { available: 2014, factor: 1.18, neighborhoods: ['Stewart Tract', 'Lakeside', 'Island District'] },
};

function makeRng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng) {
  const left = Math.max(rng(), 1e-8);
  const right = rng();
  return Math.sqrt(-2 * Math.log(left)) * Math.cos(2 * Math.PI * right);
}

function pick(rng, entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let choice = rng() * total;
  for (const entry of entries) {
    choice -= entry.weight;
    if (choice <= 0) return entry.key;
  }
  return entries.at(-1).key;
}

function volumeFor(year) {
  if (year <= 1993) return 31 + (year - 1986) * 3;
  if (year <= 2000) return 49 + (year - 1994) * 3;
  if (year <= 2006) return 70 + (year - 2001) * 7;
  if (year <= 2012) return [84, 70, 53, 49, 51, 57][year - 2007];
  if (year <= 2019) return 72 + (year - 2013) * 4;
  return [112, 126, 117, 93, 88, 86][year - 2020];
}

function cityWeights(year) {
  const entries = [
    { key: 'Tracy', weight: year < 2002 ? 55 : 38 },
    { key: 'Manteca', weight: year < 2002 ? 27 : 21 },
    { key: 'Lathrop', weight: year < 2002 ? 18 : 17 },
  ];
  if (year >= 2002) entries.push({ key: 'Mountain House', weight: year < 2014 ? 24 : 21 });
  if (year >= 2014) entries.push({ key: 'River Islands', weight: year < 2018 ? 8 : 17 });
  return entries;
}

function eraFor(year) {
  if (year <= 1994) return 'Foundation';
  if (year <= 2006) return 'Expansion';
  if (year <= 2012) return 'Correction';
  return 'Rebuild';
}

function quarterDate(year, rng) {
  const month = Math.floor(rng() * 12) + 1;
  const day = Math.floor(rng() * 27) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function compactNumber(value) {
  return Math.round(value / 1000) * 1000;
}

export function buildStudy() {
  const rng = makeRng(40010092);
  const sales = [];
  const years = HPI.map(([year, hpi]) => {
    const volume = volumeFor(year);
    const yearlySales = [];
    const marketAnchor = BASE_PRICE_2000 * (hpi / 100);

    for (let index = 0; index < volume; index++) {
      const city = pick(rng, cityWeights(year));
      const community = COMMUNITY[city];
      const propertyClass = pick(rng, [
        { key: 'Detached', weight: 76 },
        { key: 'Townhome', weight: 14 },
        { key: 'Condo', weight: 10 },
      ]);
      const beds = propertyClass === 'Condo' ? (rng() < .58 ? 2 : 3) : (rng() < .18 ? 3 : rng() < .76 ? 4 : 5);
      const baths = beds <= 2 ? (rng() < .55 ? 2 : 1) : beds === 3 ? (rng() < .55 ? 2 : 3) : (rng() < .46 ? 2 : 3);
      const sqftBase = propertyClass === 'Condo' ? 980 : propertyClass === 'Townhome' ? 1450 : 1860;
      const sqft = Math.max(680, Math.round((sqftBase + (beds - 3) * 270 + gaussian(rng) * 190) / 10) * 10);
      const sizeFactor = 0.72 + Math.min(1.55, sqft / 1900) * .28;
      const typeFactor = propertyClass === 'Condo' ? .83 : propertyClass === 'Townhome' ? .94 : 1;
      const price = compactNumber(Math.max(45000, marketAnchor * community.factor * typeFactor * sizeFactor * Math.exp(gaussian(rng) * .13)));
      const sale = {
        id: `JK-${year}-${String(index + 1).padStart(3, '0')}`,
        recordClass: 'modeled',
        date: quarterDate(year, rng),
        year,
        era: eraFor(year),
        city,
        neighborhood: community.neighborhoods[Math.floor(rng() * community.neighborhoods.length)],
        propertyClass,
        beds,
        baths,
        sqft,
        price,
        hpi,
      };
      yearlySales.push(sale);
      sales.push(sale);
    }

    const sorted = yearlySales.map((sale) => sale.price).sort((a, b) => a - b);
    return {
      year,
      hpi,
      sales: volume,
      modeledMedianPrice: sorted[Math.floor(sorted.length / 2)],
      era: eraFor(year),
    };
  });

  return {
    methodology: {
      recordClass: 'modeled',
      scope: 'Illustrative 1986–2025 transaction model for Jack Klemm dashboard exploration.',
      priceBasis: 'Every modeled year is calibrated to the official annual FHFA San Joaquin County HPI (2000=100); individual records, attributes, volumes, and community mix are modeled—not Jack’s actual transaction history.',
      source: {
        publisher: 'U.S. Federal Housing Finance Agency via FRED',
        series: 'ATNHPIUS06077A',
        title: 'All-Transactions House Price Index for San Joaquin County, CA',
        retrieved: '2026-08-31',
        url: 'https://fred.stlouisfed.org/series/ATNHPIUS06077A',
      },
    },
    years,
    sales,
  };
}

function writeStudy() {
  const study = buildStudy();
  const here = dirname(fileURLToPath(import.meta.url));
  const out = join(here, 'data');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'modeled-sales.json'), `${JSON.stringify(study.sales, null, 2)}\n`);
  writeFileSync(join(out, 'market-index.json'), `${JSON.stringify({ methodology: study.methodology, years: study.years }, null, 2)}\n`);
  writeFileSync(join(out, 'study-data.js'), `window.JACK_40_STUDY = ${JSON.stringify(study)};\n`);
  console.log(`wrote ${study.years.length} annual HPI records and ${study.sales.length} modeled transactions`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) writeStudy();
