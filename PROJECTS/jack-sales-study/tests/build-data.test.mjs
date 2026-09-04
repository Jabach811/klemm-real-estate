import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const builderPath = fileURLToPath(new URL('./build-data.mjs', root));

test('buildStudy produces a forty-year, HPI-calibrated market study', async () => {
  assert.equal(existsSync(builderPath), true, 'the study builder should exist');
  if (!existsSync(builderPath)) return;

  const { buildStudy } = await import(pathToFileURL(builderPath).href);
  const study = buildStudy();

  assert.equal(study.years.length, 40);
  assert.equal(study.years[0].year, 1986);
  assert.equal(study.years.at(-1).year, 2025);
  assert.equal(study.years.find((row) => row.year === 1986).hpi, 54.93);
  assert.equal(study.years.find((row) => row.year === 2000).hpi, 100);
  assert.equal(study.years.find((row) => row.year === 2025).hpi, 285.59);
});

test('the modeled ledger has no invented addresses or falsely real records', async () => {
  assert.equal(existsSync(builderPath), true, 'the study builder should exist');
  if (!existsSync(builderPath)) return;

  const { buildStudy } = await import(pathToFileURL(builderPath).href);
  const { sales } = buildStudy();

  assert.ok(sales.length >= 2500, 'the dashboard needs a meaningful record set');
  assert.ok(sales.every((sale) => sale.recordClass === 'modeled'));
  assert.ok(sales.every((sale) => !('address' in sale)));
  assert.ok(sales.every((sale) => sale.year >= 1986 && sale.year <= 2025));
});

test('community availability follows the modeled development timeline', async () => {
  assert.equal(existsSync(builderPath), true, 'the study builder should exist');
  if (!existsSync(builderPath)) return;

  const { buildStudy } = await import(pathToFileURL(builderPath).href);
  const { sales } = buildStudy();

  assert.equal(sales.some((sale) => sale.city === 'Mountain House' && sale.year < 2002), false);
  assert.equal(sales.some((sale) => sale.city === 'River Islands' && sale.year < 2014), false);
});
