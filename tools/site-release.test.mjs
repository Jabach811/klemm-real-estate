import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const pages = ['home', 'site', 'cities'].flatMap(walk).filter(p => p.endsWith('.html'));
test('Customer pages contain no unconnected forms or draft content', () => {
 const issues = pages.filter(file => /YOUR_FORM_ID|href="#"|Photo needed|Listing needed|Data needed|Content needed|Street address|class="asset-slot/i.test(fs.readFileSync(file,'utf8').split('<body')[1]));
 assert.deepEqual(issues, []);
});
test('The newsletter archive links to real published issues', () => {
 const html = fs.readFileSync('site/newsletters.html','utf8');
 assert.ok(html.includes('https://www.klemmre.com/august-2026/'));
 assert.ok(html.includes('data-done="You’re on the list.'));
});
test('Contact forms retain the Resend API route on every source page', () => {
 let contactPageCount = 0;
 for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const forms = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].filter(([form]) => form.includes('contact-form'));
  if (!forms.length) continue;
  contactPageCount += 1;
  for (const [form] of forms) {
   assert.match(form, /action="\/api\/contact"/, file);
   assert.match(form, /method="post"/, file);
   assert.match(form, /name="_subject"/, file);
   assert.match(form, /type="submit"/, file);
  }
  assert.ok(html.includes('shared/site.js'), file + ': submission handling missing');
  assert.ok(!html.includes('window.location.href = \'mailto:'), file + ': old email form remains');
 }
 assert.ok(contactPageCount > 0, 'no customer contact forms found');
});
test('CMV address selection fills only its matching contact location fields', () => {
 const html = fs.readFileSync('site/i-want-a-free-cmv.html', 'utf8');
 assert.match(html, /<input[^>]*id="cmv-your_address"[^>]*data-address-autocomplete[^>]*data-address-city="cmv-your_city"[^>]*data-address-state="cmv-your_state"[^>]*data-address-zip="cmv-your_zip"/);
 assert.match(html, /<input[^>]*id="cmv-sale_address"[^>]*data-address-autocomplete/);
 assert.match(html, /href="\.\.\/shared\/address-autocomplete\.css"/);
 for (const script of ['address-config.js', 'address-google.js', 'address-autocomplete.js']) assert.match(html, new RegExp(`src="\\.\\.\\/shared\\/${script}"`));
});
test('Full GPT Sites build excludes the broken duplicate newsletter route', () => {
 execFileSync(process.execPath, ['tools/build-site.mjs'], {
  env: { ...process.env, LIVE_INTERIOR_PAGES: 'all', YOUTUBE_API_KEY: 'test-key' },
  stdio: 'pipe',
 });
 assert.ok(fs.existsSync('dist/client/newsletters.html'));
 assert.equal(fs.existsSync('dist/client/newsletters/newsletters.html'), false);
});
test('Built GPT Sites pages send forms to the Resend endpoint', () => {
 const built = walk('dist/client').filter(file => file.endsWith('.html'));
 assert.ok(built.length > 0, 'build emitted no customer pages');
 for (const file of built) {
  const html = fs.readFileSync(file, 'utf8');
  for (const [form] of [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].filter(([form]) => form.includes('contact-form'))) {
   assert.match(form, /action="https:\/\/release-two-pages\.vercel\.app\/api\/contact"/, file);
  }
 }
});
test('Every customer page offers accessible navigation and direct contact', () => {
 for (const file of pages) {
  const html=fs.readFileSync(file,'utf8');
  for (const token of ['<main id="main"','aria-label="Main navigation"','href="sms:+12093211094"','href="mailto:jack@klemmre.com']) assert.ok(html.includes(token), file+': '+token);
  for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) if (!(m[1]||'').includes('application/ld+json')) new vm.Script(m[2],{filename:file});
 }
});
