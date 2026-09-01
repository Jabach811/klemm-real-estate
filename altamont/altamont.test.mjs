import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = new URL('.', import.meta.url);
const page = readFileSync(fileURLToPath(new URL('./index.html', here)), 'utf8');

test('Altamont Advantage presents Jack as the local-market guide', () => {
  assert.match(page, /<title>The Altamont Advantage<\/title>/);
  assert.match(page, /Your buyer story starts before they reach Tracy\./);
  assert.match(page, /Jack makes the landing feel obvious\./);
});

test('Altamont Advantage includes the five-community buyer lens', () => {
  assert.match(page, /The five places buyers ask about first\./);
  for (const place of ['Tracy', 'Mountain House', 'Lathrop', 'River Islands', 'Manteca']) {
    assert.match(page, new RegExp(`<h3>${place}<\\/h3>`));
  }
});

test('Altamont Advantage makes the seller launch process concrete', () => {
  assert.match(page, /A listing launch is not a listing upload\./);
  for (const step of ['Make the plan', 'Make it show-ready', 'Make people stop', 'Make the offer count']) {
    assert.match(page, new RegExp(`<h3>${step}<\\/h3>`));
  }
});

test('Altamont Advantage never represents illustrative data as client data', () => {
  assert.match(page, /Illustrative demonstration/);
  assert.match(page, /No client, buyer, or market data is shown here\./);
  assert.doesNotMatch(page, /Placeholder/);
});
