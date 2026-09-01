// Builds a star-schema version of the invented career data for modelling.
//
// The career map only needs six numbers per sale. This takes those same seeded
// sales and hangs the rest of a transaction off them — price, size, days on
// market, where the lead came from, how it was financed — plus a set of lookup
// tables to join against. Nothing here is real. It is shaped like a real
// brokerage extract so it behaves like one in a model.
//
// Writes a JSON bundle. tools/build-model-workbook.py turns it into the
// workbook; this file owns all of the logic.
//
// Run: node tools/export-model-tables.mjs <out.json>

import { writeFileSync } from 'node:fs';
import { CITIES, CITY_KEYS, makeRng } from './geo.mjs';
import { PROFILES, BASE_YEAR, TYPE_LABELS, generateAll } from './generate-sales.mjs';

const SEED = 20260830;
const END_YEAR = 2026;

const pick = (rng, weighted) => {
  const total = weighted.reduce((t, w) => t + w[1], 0);
  let r = rng() * total;
  for (const [value, w] of weighted) {
    r -= w;
    if (r <= 0) return value;
  }
  return weighted[weighted.length - 1][0];
};

const gauss = (rng) => {
  const u = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
};

const round = (v, to) => Math.round(v / to) * to;

// ---------------------------------------------------------------- dimensions

const MARKET_PHASES = [
  [1, 'Early market', 1987, 1996, 'Steady, unremarkable. Prices creep.'],
  [2, 'Run-up', 1997, 2004, 'Bay Area money starts commuting east. Volume and prices climb together.'],
  [3, 'Peak', 2005, 2007, 'Everything sells. Multiple offers are normal.'],
  [4, 'Crash', 2008, 2011, 'Prices fall by roughly half. Days on market triple.'],
  [5, 'Recovery', 2012, 2019, 'Slow, long climb back. Inventory stays thin.'],
  [6, 'Pandemic surge', 2020, 2022, 'Remote work pushes demand outward. Homes sell over asking in days.'],
  [7, 'Rate shock', 2023, 2026, 'Rates bite. Prices hold but volume and speed drop.'],
];
const phaseFor = (year) => MARKET_PHASES.find(([, , from, to]) => year >= from && year <= to);

// Dollars per square foot, county wide, by year. Anchored at the phase turns
// above and interpolated in between.
const PPSF_ANCHORS = [
  [1988, 92], [1996, 118], [2000, 168], [2004, 262], [2006, 295],
  [2009, 158], [2011, 132], [2015, 205], [2019, 258], [2021, 312],
  [2022, 348], [2024, 336], [2026, 352],
];
function ppsf(year) {
  if (year <= PPSF_ANCHORS[0][0]) return PPSF_ANCHORS[0][1];
  for (let i = 1; i < PPSF_ANCHORS.length; i++) {
    const [y1, v1] = PPSF_ANCHORS[i];
    if (year <= y1) {
      const [y0, v0] = PPSF_ANCHORS[i - 1];
      return v0 + ((v1 - v0) * (year - y0)) / (y1 - y0);
    }
  }
  return PPSF_ANCHORS[PPSF_ANCHORS.length - 1][1];
}

const COMMUNITY = {
  tracy:         { city: 'Tracy',    type: 'Established city', mult: 1.05, sqft: [1850, 420], commute: 72, school: 7, hoa: 0,   lat: 37.7397, lon: -121.4252 },
  mountainHouse: { city: 'Mountain House', type: 'Master-planned', mult: 1.15, sqft: [2450, 480], commute: 62, school: 9, hoa: 0,   lat: 37.7830, lon: -121.5430 },
  lathrop:       { city: 'Lathrop',  type: 'Established city', mult: 1.00, sqft: [1900, 400], commute: 85, school: 6, hoa: 45,  lat: 37.8227, lon: -121.2766 },
  riverIslands:  { city: 'Lathrop',  type: 'Waterfront master-planned', mult: 1.05, sqft: [2700, 560], commute: 84, school: 8, hoa: 165, lat: 37.8050, lon: -121.3300 },
  manteca:       { city: 'Manteca',  type: 'Established city', mult: 0.98, sqft: [1880, 410], commute: 92, school: 6, hoa: 0,   lat: 37.7974, lon: -121.2160 },
  delWebb:       { city: 'Manteca',  type: 'Active adult 55+',  mult: 1.15, sqft: [1720, 300], commute: 92, school: 5, hoa: 235, lat: 37.7860, lon: -121.2020 },
  stockton:      { city: 'Stockton', type: 'Established city', mult: 0.80, sqft: [1720, 520], commute: 105, school: 4, hoa: 0,   lat: 37.9577, lon: -121.2908 },
};

// Waterfront is already sitting in the priciest community, so its own premium
// has to stay small or the two multipliers compound into fantasy money.
const TYPE_MULT = [1.0, 0.86, 1.06, 1.06];
const TYPE_SQFT_MULT = [1.0, 0.68, 0.9, 1.05];

const LEAD_SOURCES = [
  [1, 'Repeat client', 'Sphere', 'Yes'],
  [2, 'Referral from past client', 'Sphere', 'Yes'],
  [3, 'Sphere of influence', 'Sphere', 'Yes'],
  [4, 'Sign call', 'Organic', 'No'],
  [5, 'Open house', 'Organic', 'No'],
  [6, 'Online portal enquiry', 'Paid', 'No'],
  [7, 'Builder relationship', 'Partner', 'Yes'],
  [8, 'Relocation network', 'Partner', 'Yes'],
  [9, 'Farming and mailers', 'Paid', 'No'],
];

// Where each archetype's business actually comes from. This is the most useful
// difference between them and it is invisible on the map.
const LEAD_MIX = {
  anchor:     [[1, 24], [2, 30], [3, 16], [4, 9], [5, 6], [6, 5], [7, 2], [8, 3], [9, 5]],
  drift:      [[1, 14], [2, 20], [3, 14], [4, 10], [5, 9], [6, 16], [7, 4], [8, 8], [9, 5]],
  specialist: [[1, 10], [2, 16], [3, 8], [4, 4], [5, 8], [6, 10], [7, 34], [8, 8], [9, 2]],
  newcomer:   [[1, 3], [2, 9], [3, 12], [4, 6], [5, 20], [6, 32], [7, 6], [8, 8], [9, 4]],
};

const SIDES = [[1, 'Listing side'], [2, 'Buyer side'], [3, 'Both sides']];
const SIDE_MIX = {
  anchor: [[1, 58], [2, 36], [3, 6]],
  drift: [[1, 44], [2, 52], [3, 4]],
  specialist: [[1, 38], [2, 60], [3, 2]],
  newcomer: [[1, 22], [2, 76], [3, 2]],
};

const FINANCING = [
  [1, 'Conventional', 'No', 20],
  [2, 'FHA', 'No', 4],
  [3, 'VA', 'No', 0],
  [4, 'Cash', 'Yes', 100],
  [5, 'Jumbo', 'No', 25],
  [6, 'Seller carryback', 'No', 15],
];

const BUYER_PROFILES = [
  [1, 'First-time buyer', 'Buying their first home, usually price led.'],
  [2, 'Move-up buyer', 'Selling something smaller to buy something larger.'],
  [3, 'Downsizer', 'Leaving a larger home, often paying cash.'],
  [4, 'Investor', 'Buying to rent out or resell.'],
  [5, 'Bay Area relocation', 'Trading a commute for square footage.'],
  [6, 'Second home', 'Not their primary residence.'],
];
const BUYER_MIX = {
  tracy: [[1, 26], [2, 28], [3, 8], [4, 8], [5, 28], [6, 2]],
  mountainHouse: [[1, 14], [2, 26], [3, 6], [4, 4], [5, 48], [6, 2]],
  lathrop: [[1, 30], [2, 26], [3, 8], [4, 10], [5, 24], [6, 2]],
  riverIslands: [[1, 8], [2, 30], [3, 14], [4, 4], [5, 40], [6, 4]],
  manteca: [[1, 32], [2, 28], [3, 10], [4, 10], [5, 18], [6, 2]],
  delWebb: [[1, 2], [2, 6], [3, 78], [4, 4], [5, 6], [6, 4]],
  stockton: [[1, 38], [2, 22], [3, 8], [4, 22], [5, 8], [6, 2]],
};

const PRICE_BANDS = [
  [1, 'Entry', 0, 250000],
  [2, 'Moderate', 250000, 450000],
  [3, 'Mid market', 450000, 650000],
  [4, 'Upper', 650000, 900000],
  [5, 'Premium', 900000, 99999999],
];
const bandFor = (price) => PRICE_BANDS.find(([, , lo, hi]) => price >= lo && price < hi)[0];

// Spring is the season here, and always has been.
const MONTH_WEIGHT = [5, 6, 9, 11, 12, 11, 9, 9, 8, 8, 6, 6];
const SEASON = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer',
  'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AGENTS = {
  anchor:     { key: 1, market: 'Tracy', team: 3, license: 'Broker associate', designation: 'GRI, CRS' },
  drift:      { key: 2, market: 'Mountain House and River Islands', team: 2, license: 'Salesperson', designation: 'ABR' },
  specialist: { key: 3, market: 'River Islands and Del Webb', team: 1, license: 'Salesperson', designation: 'SRES' },
  newcomer:   { key: 4, market: 'Mountain House', team: 1, license: 'Salesperson', designation: 'None' },
};

// Days on market and how far off asking a sale lands, by market phase.
const PHASE_MARKET = {
  1: { dom: [46, 18], overAsk: -0.018 },
  2: { dom: [31, 14], overAsk: 0.004 },
  3: { dom: [19, 10], overAsk: 0.021 },
  4: { dom: [94, 42], overAsk: -0.061 },
  5: { dom: [38, 18], overAsk: -0.004 },
  6: { dom: [13, 8], overAsk: 0.038 },
  7: { dom: [44, 22], overAsk: -0.012 },
};

// ------------------------------------------------------------------ the facts

function buildFacts() {
  const sales = generateAll(SEED);
  const rng = makeRng(SEED + 104729);
  const rows = [];
  let id = 0;

  for (const [profileKey, list] of Object.entries(sales)) {
    const agent = AGENTS[profileKey];
    for (const s of list) {
      const year = BASE_YEAR + s[0];
      const cityKey = CITY_KEYS[s[1]];
      const c = COMMUNITY[cityKey];
      const typeIdx = s[5];
      const [phaseKey, , , , ] = phaseFor(year);
      const m = PHASE_MARKET[phaseKey];

      const month = pick(rng, MONTH_WEIGHT.map((w, i) => [i, w]));
      const day = 1 + Math.floor(rng() * new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
      const close = new Date(Date.UTC(year, month, day));

      const sqft = Math.max(720, round(
        (c.sqft[0] * TYPE_SQFT_MULT[typeIdx]) + gauss(rng) * c.sqft[1] * 0.7, 10));
      const price = Math.max(85000, round(
        ppsf(year) * c.mult * TYPE_MULT[typeIdx] * sqft * (1 + gauss(rng) * 0.11), 500));

      const dom = Math.max(1, Math.round(m.dom[0] + Math.abs(gauss(rng)) * m.dom[1]));
      const listPrice = Math.max(50000, round(price / (1 + m.overAsk + gauss(rng) * 0.02), 500));
      const listDate = new Date(close.getTime() - dom * 86400000);

      const beds = Math.max(2, Math.min(6, Math.round(sqft / 620 + gauss(rng) * 0.5)));
      const baths = Math.max(1, Math.min(5, Math.round((beds * 0.7 + 0.6) * 2) / 2));
      const built = typeIdx === 3 ? Math.min(year, 2014 + Math.floor(rng() * 12))
        : cityKey === 'mountainHouse' ? Math.min(year, 2001 + Math.floor(rng() * 24))
        : cityKey === 'delWebb' ? Math.min(year, 2015 + Math.floor(rng() * 11))
        : 1955 + Math.floor(rng() * (Math.max(1, year - 1955)));

      const financing = pick(rng, financingMix(price, typeIdx, cityKey, year));
      const side = pick(rng, SIDE_MIX[profileKey]);
      const lead = pick(rng, LEAD_MIX[profileKey]);
      const buyer = pick(rng, BUYER_MIX[cityKey]);

      const rate = round(0.022 + rng() * 0.008 + (side === 3 ? 0.021 : 0), 0.0005);
      const gross = Math.round(price * rate);
      const split = profileKey === 'anchor' ? 0.85 : profileKey === 'newcomer' ? 0.55 : 0.7;
      const concession = rng() < (phaseKey === 4 || phaseKey === 7 ? 0.38 : 0.1)
        ? round(price * (0.004 + rng() * 0.014), 250) : 0;

      id += 1;
      rows.push([
        id,
        agent.key,
        Number(iso(close).replaceAll('-', '')),
        Number(iso(listDate).replaceAll('-', '')),
        s[1] + 1,
        typeIdx + 1,
        side,
        lead,
        financing,
        buyer,
        bandFor(price),
        listPrice,
        price,
        price - listPrice,
        dom,
        sqft,
        beds,
        baths,
        built,
        round(sqft * (2.4 + rng() * 2.6), 50),
        rate,
        gross,
        Math.round(gross * split),
        concession,
        s[2],
        s[3],
      ]);
    }
  }
  return rows;
}

function financingMix(price, typeIdx, cityKey, year) {
  const mix = [[1, 52], [2, 12], [3, 8], [4, 10], [5, 4], [6, 2]];
  if (typeIdx === 2) { mix[3][1] += 34; mix[1][1] -= 8; }
  if (price > 900000) { mix[4][1] += 28; mix[1][1] -= 8; mix[2][1] -= 4; }
  if (cityKey === 'tracy' || cityKey === 'manteca') mix[2][1] += 6;
  if (year >= 2009 && year <= 2013) { mix[1][1] += 16; mix[2][1] += 6; }
  return mix.map(([k, w]) => [k, Math.max(0, w)]);
}

const iso = (d) => d.toISOString().slice(0, 10);

// A second fact table at a different grain: one row per agent per month. Lets
// you build a funnel — appointments to offers to closings — that the sale rows
// on their own cannot show.
function buildActivity(factRows) {
  const rng = makeRng(SEED + 15485863);
  const closedBy = new Map();
  for (const r of factRows) {
    const ym = String(r[2]).slice(0, 6);
    const k = r[1] + '|' + ym;
    closedBy.set(k, (closedBy.get(k) || 0) + 1);
  }

  const rows = [];
  let id = 0;
  for (const [profileKey, profile] of Object.entries(PROFILES)) {
    const agent = AGENTS[profileKey];
    for (let year = profile.start; year <= END_YEAR; year++) {
      for (let month = 1; month <= 12; month++) {
        const ym = `${year}${String(month).padStart(2, '0')}`;
        const closed = closedBy.get(agent.key + '|' + ym) || 0;
        const consults = Math.round(closed * (2.1 + rng() * 1.4) + rng() * 3);
        const listingsTaken = Math.round(closed * (0.5 + rng() * 0.5));
        const offersWritten = Math.round(closed * (1.5 + rng() * 1.1));
        const openHouses = Math.round(listingsTaken * (0.8 + rng() * 1.6));
        const spend = round(200 + closed * (90 + rng() * 260) + (profileKey === 'newcomer' ? 400 : 0), 25);
        id += 1;
        rows.push([
          id,
          agent.key,
          Number(ym + '01'),
          year,
          month,
          closed,
          consults,
          listingsTaken,
          offersWritten,
          openHouses,
          spend,
        ]);
      }
    }
  }
  return rows;
}

// Starts a year early. A house listed in November 1987 closed in 1988, and a
// date table with a gap in it breaks the relationship for those rows.
function buildDates() {
  const rows = [];
  for (let y = BASE_YEAR - 1; y <= END_YEAR; y++) {
    const [phaseKey, phaseName] = phaseFor(y);
    for (let m = 0; m < 12; m++) {
      const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      for (let d = 1; d <= last; d++) {
        const date = new Date(Date.UTC(y, m, d));
        const dow = date.getUTCDay();
        const q = Math.floor(m / 3) + 1;
        rows.push([
          Number(`${y}${String(m + 1).padStart(2, '0')}${String(d).padStart(2, '0')}`),
          iso(date),
          y,
          q,
          `${y} Q${q}`,
          m + 1,
          MONTHS[m],
          MONTHS[m].slice(0, 3),
          `${y}-${String(m + 1).padStart(2, '0')}`,
          d,
          DAYS[dow],
          dow === 0 ? 7 : dow,
          dow === 0 || dow === 6 ? 'Yes' : 'No',
          SEASON[m],
          phaseKey,
          phaseName,
        ]);
      }
    }
  }
  return rows;
}

// ------------------------------------------------------------------- assembly

const facts = buildFacts();
const activity = buildActivity(facts);

const sheets = [
  {
    name: 'ReadMe',
    columns: ['Item', 'Detail'],
    rows: [
      ['What this is', 'Invented real-estate career data, shaped as a star schema for modelling practice.'],
      ['Is any of it real', 'No. No real sale, address, agent, client or price. The four agents are archetypes, not people.'],
      ['Grain of FactSales', 'One row per closed sale.'],
      ['Grain of FactAgentMonth', 'One row per agent per calendar month, from their first year onward.'],
      ['Rows in FactSales', facts.length],
      ['Rows in FactAgentMonth', activity.length],
      ['Sales run', `${BASE_YEAR} to ${END_YEAR}`],
      ['DimDate runs', `${BASE_YEAR - 1} to ${END_YEAR}, so listings that started the year before still join`],
      ['Mark as date table', 'DimDate, on the Date column.'],
      ['Two date roles', 'FactSales has CloseDateKey and ListDateKey. Only one can be an active relationship to DimDate. Use USERELATIONSHIP for the other.'],
      ['Positions', 'MapX and MapY are the drawn map’s own units, not latitude and longitude, so no sale sits on a real house. Community latitude and longitude are in DimCommunity for map visuals.'],
      ['Rebuild', 'node tools/export-model-tables.mjs, then python tools/build-model-workbook.py'],
    ],
  },
  {
    name: 'Relationships',
    columns: ['FromTable', 'FromColumn', 'ToTable', 'ToColumn', 'Cardinality', 'Note'],
    rows: [
      ['FactSales', 'AgentKey', 'DimAgent', 'AgentKey', 'Many to one', ''],
      ['FactSales', 'CloseDateKey', 'DimDate', 'DateKey', 'Many to one', 'Make this the active one'],
      ['FactSales', 'ListDateKey', 'DimDate', 'DateKey', 'Many to one', 'Inactive. Activate with USERELATIONSHIP'],
      ['FactSales', 'CommunityKey', 'DimCommunity', 'CommunityKey', 'Many to one', ''],
      ['FactSales', 'PropertyTypeKey', 'DimPropertyType', 'PropertyTypeKey', 'Many to one', ''],
      ['FactSales', 'SideKey', 'DimSide', 'SideKey', 'Many to one', ''],
      ['FactSales', 'LeadSourceKey', 'DimLeadSource', 'LeadSourceKey', 'Many to one', ''],
      ['FactSales', 'FinancingKey', 'DimFinancing', 'FinancingKey', 'Many to one', ''],
      ['FactSales', 'BuyerProfileKey', 'DimBuyerProfile', 'BuyerProfileKey', 'Many to one', ''],
      ['FactSales', 'PriceBandKey', 'DimPriceBand', 'PriceBandKey', 'Many to one', ''],
      ['FactAgentMonth', 'AgentKey', 'DimAgent', 'AgentKey', 'Many to one', ''],
      ['FactAgentMonth', 'MonthStartDateKey', 'DimDate', 'DateKey', 'Many to one', 'First of the month'],
      ['DimDate', 'MarketPhaseKey', 'DimMarketPhase', 'MarketPhaseKey', 'Many to one', 'Snowflake. Flatten it if you prefer a pure star'],
    ],
  },
  {
    name: 'FactSales',
    columns: ['SaleID', 'AgentKey', 'CloseDateKey', 'ListDateKey', 'CommunityKey', 'PropertyTypeKey',
      'SideKey', 'LeadSourceKey', 'FinancingKey', 'BuyerProfileKey', 'PriceBandKey', 'ListPrice',
      'SalePrice', 'PriceVsList', 'DaysOnMarket', 'SquareFeet', 'Bedrooms', 'Bathrooms', 'YearBuilt',
      'LotSquareFeet', 'CommissionRate', 'GrossCommission', 'AgentNetCommission', 'SellerConcession',
      'MapX', 'MapY'],
    rows: facts,
  },
  {
    name: 'FactAgentMonth',
    columns: ['ActivityID', 'AgentKey', 'MonthStartDateKey', 'Year', 'MonthNumber', 'ClosedSales',
      'BuyerConsults', 'ListingsTaken', 'OffersWritten', 'OpenHouses', 'MarketingSpend'],
    rows: activity,
  },
  {
    name: 'DimAgent',
    columns: ['AgentKey', 'Archetype', 'CareerStartYear', 'YearsActive', 'PrimaryMarket', 'TeamSize',
      'LicenseType', 'Designations', 'IsMockData'],
    rows: Object.entries(PROFILES).map(([k, p]) => {
      const a = AGENTS[k];
      return [a.key, p.label, p.start, END_YEAR - p.start + 1, a.market, a.team, a.license, a.designation, 'Yes'];
    }),
  },
  {
    name: 'DimDate',
    columns: ['DateKey', 'Date', 'Year', 'QuarterNumber', 'YearQuarter', 'MonthNumber', 'MonthName',
      'MonthShort', 'YearMonth', 'DayOfMonth', 'DayName', 'DayOfWeekNumber', 'IsWeekend', 'Season',
      'MarketPhaseKey', 'MarketPhase'],
    rows: buildDates(),
  },
  {
    name: 'DimCommunity',
    columns: ['CommunityKey', 'Community', 'City', 'County', 'State', 'CommunityType', 'YearFounded',
      'TypicalSquareFeet', 'CommuteToBayAreaMinutes', 'SchoolRating', 'TypicalMonthlyHOA',
      'MapX', 'MapY', 'Latitude', 'Longitude'],
    rows: CITY_KEYS.map((k, i) => {
      const c = COMMUNITY[k];
      return [i + 1, CITIES[k].label, c.city, 'San Joaquin', 'CA', c.type, CITIES[k].founded,
        c.sqft[0], c.commute, c.school, c.hoa, CITIES[k].x, CITIES[k].y, c.lat, c.lon];
    }),
  },
  {
    name: 'DimPropertyType',
    columns: ['PropertyTypeKey', 'PropertyType', 'IsAttached', 'IsAgeRestricted'],
    rows: TYPE_LABELS.map((label, i) => [i + 1, label, i === 1 ? 'Yes' : 'No', i === 2 ? 'Yes' : 'No']),
  },
  {
    name: 'DimSide',
    columns: ['SideKey', 'Side', 'RepresentsSeller', 'RepresentsBuyer'],
    rows: SIDES.map(([k, label]) => [k, label, k === 2 ? 'No' : 'Yes', k === 1 ? 'No' : 'Yes']),
  },
  {
    name: 'DimLeadSource',
    columns: ['LeadSourceKey', 'LeadSource', 'Channel', 'IsRelationshipDriven'],
    rows: LEAD_SOURCES,
  },
  {
    name: 'DimFinancing',
    columns: ['FinancingKey', 'FinancingType', 'IsCash', 'TypicalDownPaymentPercent'],
    rows: FINANCING,
  },
  {
    name: 'DimBuyerProfile',
    columns: ['BuyerProfileKey', 'BuyerProfile', 'Description'],
    rows: BUYER_PROFILES,
  },
  {
    name: 'DimPriceBand',
    columns: ['PriceBandKey', 'BandLabel', 'MinPrice', 'MaxPrice'],
    rows: PRICE_BANDS,
  },
  {
    name: 'DimMarketPhase',
    columns: ['MarketPhaseKey', 'MarketPhase', 'StartYear', 'EndYear', 'WhatHappened'],
    rows: MARKET_PHASES,
  },
];

const out = process.argv[2];
writeFileSync(out, JSON.stringify({ sheets }));
console.log(`${sheets.length} tables, ${facts.length} sales, ${activity.length} agent-months -> ${out}`);
