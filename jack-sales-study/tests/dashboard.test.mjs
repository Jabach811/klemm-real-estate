import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const pathFor = (name) => fileURLToPath(new URL(name, root));

test('the dashboard has a fresh long-view interface and loads its local study data', () => {
  const indexPath = pathFor('index.html');
  assert.equal(existsSync(indexPath), true, 'the dashboard entry page should exist');
  if (!existsSync(indexPath)) return;

  const page = readFileSync(indexPath, 'utf8');
  assert.match(page, /The Long View/i);
  assert.match(page, /data\/study-data\.js/);
  assert.match(page, /dashboard\.js/);
  assert.match(page, /modeled/i);
});

test('the dashboard script provides filterable visual sections and updates an accessible status region', () => {
  const scriptPath = pathFor('dashboard.js');
  const indexPath = pathFor('index.html');
  assert.equal(existsSync(scriptPath), true, 'the interactive dashboard script should exist');
  if (!existsSync(scriptPath)) return;

  const script = readFileSync(scriptPath, 'utf8');
  for (const feature of ['renderTrend', 'renderVolume', 'renderCityMix', 'filter-status']) {
    assert.match(script, new RegExp(feature));
  }
  assert.match(readFileSync(indexPath, 'utf8'), /aria-live/);
});
