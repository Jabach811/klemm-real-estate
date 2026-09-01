import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = new URL('.', import.meta.url);
const pagePath = fileURLToPath(new URL('./index.html', here));
const cssPath = fileURLToPath(new URL('./ridge.css', here));
const scriptPath = fileURLToPath(new URL('./ridge.js', here));

test('The Ridge exists as a fresh standalone art experience', () => {
  assert.equal(existsSync(pagePath), true);
  assert.equal(existsSync(cssPath), true);
  assert.equal(existsSync(scriptPath), true);
});

test('The Ridge frames the move as a threshold, not a traditional website', () => {
  const page = existsSync(pagePath) ? readFileSync(pagePath, 'utf8') : '';
  assert.match(page, /<title>The Ridge — A Klemm Real Estate Study<\/title>/);
  assert.match(page, /Not a map\. A threshold\./);
  assert.match(page, /Follow the line/);
  assert.match(page, /assets\/ridge-night.png/);
  assert.doesNotMatch(page, /card|dashboard|grid/i);
});

test('The Ridge has an intentional, accessible motion boundary', () => {
  const css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';
  const script = existsSync(scriptPath) ? readFileSync(scriptPath, 'utf8') : '';
  assert.match(css, /prefers-reduced-motion/);
  assert.match(script, /is-crossed/);
  assert.match(script, /aria-pressed/);
});
