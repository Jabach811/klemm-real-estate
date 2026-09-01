// Turns the star-schema bundle into one browser-readable file.
//
// The dashboard has to run by double-clicking it, with no server, so it cannot
// fetch a CSV or a JSON file. Everything ships as a script that assigns a
// global. Rows are arrays of numbers rather than objects because the same data
// as objects is roughly four times the bytes for no benefit.
//
// Run: node tools/build-dashboard-data.mjs <bundle.json> <out.js>

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const bundle = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3];

const sheet = (name) => {
  const s = bundle.sheets.find((x) => x.name === name);
  const idx = Object.fromEntries(s.columns.map((c, i) => [c, i]));
  return { rows: s.rows, at: (row, col) => row[idx[col]] };
};

const sales = sheet('FactSales');
const activity = sheet('FactAgentMonth');

const salesRows = sales.rows.map((r) => {
  const key = String(sales.at(r, 'CloseDateKey'));
  return [
    sales.at(r, 'AgentKey'),
    Number(key.slice(0, 4)),
    Number(key.slice(4, 6)),
    sales.at(r, 'CommunityKey'),
    sales.at(r, 'PropertyTypeKey'),
    sales.at(r, 'SideKey'),
    sales.at(r, 'LeadSourceKey'),
    sales.at(r, 'FinancingKey'),
    sales.at(r, 'BuyerProfileKey'),
    sales.at(r, 'PriceBandKey'),
    sales.at(r, 'SalePrice'),
    sales.at(r, 'ListPrice'),
    sales.at(r, 'DaysOnMarket'),
    sales.at(r, 'SquareFeet'),
    sales.at(r, 'GrossCommission'),
    sales.at(r, 'AgentNetCommission'),
  ];
});

const activityRows = activity.rows.map((r) => [
  activity.at(r, 'AgentKey'),
  activity.at(r, 'Year'),
  activity.at(r, 'MonthNumber'),
  activity.at(r, 'ClosedSales'),
  activity.at(r, 'BuyerConsults'),
  activity.at(r, 'ListingsTaken'),
  activity.at(r, 'OffersWritten'),
  activity.at(r, 'OpenHouses'),
  activity.at(r, 'MarketingSpend'),
]);

const lookup = (name, keyCol, labelCol, extra = {}) => {
  const s = sheet(name);
  return s.rows.map((r) => {
    const o = { key: s.at(r, keyCol), label: s.at(r, labelCol) };
    for (const [k, col] of Object.entries(extra)) o[k] = s.at(r, col);
    return o;
  });
};

const model = {
  fields: {
    sales: ['agent', 'year', 'month', 'community', 'propertyType', 'side', 'leadSource',
      'financing', 'buyerProfile', 'priceBand', 'salePrice', 'listPrice', 'daysOnMarket',
      'squareFeet', 'grossCommission', 'agentNet'],
    activity: ['agent', 'year', 'month', 'closed', 'consults', 'listingsTaken',
      'offersWritten', 'openHouses', 'spend'],
  },
  agents: lookup('DimAgent', 'AgentKey', 'Archetype', { start: 'CareerStartYear', market: 'PrimaryMarket' }),
  communities: lookup('DimCommunity', 'CommunityKey', 'Community', { city: 'City', founded: 'YearFounded' }),
  propertyTypes: lookup('DimPropertyType', 'PropertyTypeKey', 'PropertyType'),
  sides: lookup('DimSide', 'SideKey', 'Side'),
  leadSources: lookup('DimLeadSource', 'LeadSourceKey', 'LeadSource', { channel: 'Channel' }),
  financing: lookup('DimFinancing', 'FinancingKey', 'FinancingType'),
  buyerProfiles: lookup('DimBuyerProfile', 'BuyerProfileKey', 'BuyerProfile'),
  priceBands: lookup('DimPriceBand', 'PriceBandKey', 'BandLabel', { min: 'MinPrice', max: 'MaxPrice' }),
  marketPhases: lookup('DimMarketPhase', 'MarketPhaseKey', 'MarketPhase', { start: 'StartYear', end: 'EndYear' }),
  sales: salesRows,
  activity: activityRows,
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `window.KLEMM_MODEL = ${JSON.stringify(model)};\n`);
console.log(`${salesRows.length} sales, ${activityRows.length} agent-months -> ${out}`);
