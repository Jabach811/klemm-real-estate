import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const pages = ['home', 'site', 'cities'].flatMap(walk).filter(p => p.endsWith('.html'));
test('Customer pages contain no unconnected forms or draft content', () => {
 const issues = pages.filter(file => /YOUR_FORM_ID|href="#"|Photo needed|Listing needed|Data needed|Content needed|Street address|class="asset-slot/i.test(fs.readFileSync(file,'utf8').split('<body')[1]));
 assert.deepEqual(issues, []);
});
test('The newsletter archive links to real published issues', () => {
 const html = fs.readFileSync('site/newsletters.html','utf8');
 assert.ok(html.includes('https://www.klemmre.com/august-2026/'));
 assert.ok(!html.includes('formspree'));
});
test('Every customer page offers accessible navigation and direct contact', () => {
 for (const file of pages) {
  const html=fs.readFileSync(file,'utf8');
  for (const token of ['<main id="main"','aria-label="Main navigation"','href="sms:+12093211094"','href="mailto:jack@klemmre.com']) assert.ok(html.includes(token), file+': '+token);
  for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) if (!(m[1]||'').includes('application/ld+json')) new vm.Script(m[2],{filename:file});
 }
});
