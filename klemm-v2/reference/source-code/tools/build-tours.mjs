// Builds the "Video tours" strip on each city page and that city's tours.html
// from the YouTube inventory. Run: node tools/build-tours.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const INVENTORY = path.join(root, 'PROJECTS', 'Youtube', 'data', 'inventory.json');
const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
const newest = (a, b) => +a.ageYears - +b.ageYears || +b.views - +a.views;

const CITIES = [
  { slug: 'mountain-house', name: 'Mountain House', publicUrl: 'mountainhousere.html',
    pick: v => v.city === 'Mountain House' },
  { slug: 'manteca', name: 'Manteca', publicUrl: 'mantecare.html',
    pick: v => v.city === 'Manteca' },
  { slug: 'lathrop', name: 'Lathrop', pageName: 'Lathrop and River Islands', publicUrl: 'lathropre.html',
    pick: v => v.city === 'Lathrop' || v.city === 'River Islands', insertBefore: '<section class="showready"' },
  { slug: 'river-islands', name: 'River Islands', publicUrl: 'riverislandsre.html',
    pick: v => v.city === 'River Islands' || /river islands/i.test(v.title),
    allLink: { href: '../cities/lathrop/tours.html', label: 'All Lathrop and River Islands video tours' },
    insertBefore: '<section class="showready"' },
  { slug: 'woodbridge', name: 'Woodbridge', publicUrl: 'woodbridgere.html',
    pick: v => /woodbridge/i.test(v.title),
    allLink: { href: '../cities/manteca/tours.html', label: 'All Manteca video tours, including Woodbridge' },
    insertBefore: '<section class="showready"' },
];

const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const tile = v => {
 if (!/^[A-Za-z0-9_-]{11}$/.test(v.id)) throw new Error('Invalid YouTube video id');
 const address=escape(`${v.address}, ${v.city}`);
 return `<div class="tour"><button class="tour-frame" type="button" data-video="${v.id}" aria-label="Play video tour of ${address}"><img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="Video tour of ${address}" loading="lazy" decoding="async"></button><a class="tour-fallback" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">Watch on YouTube ↗</a><div class="tour-copy"><span>${address}</span><small>Video tour · marketing archive</small></div></div>`;
};

for (const c of CITIES) {
  const rows = inv.filter(c.pick).sort(newest);
  const pageName = c.pageName || c.name;
  const indexPath = `cities/${c.slug}/index.html`;
  let page = fs.readFileSync(indexPath, 'utf8');

  const link = c.allLink || { href: `../cities/${c.slug}/tours.html`, label: `All ${rows.length} ${pageName} video tours` };
  const strip = `<section class="tours" id="tours">
  <div class="tours-head reveal">
    <span class="eyebrow">Video tours</span>
    <h2>Walk through the ${c.name} homes Jack has listed.</h2>
    <p>Explore selected tours from Jack’s marketing archive in ${c.name} — they play right here. Ask Jack about current availability.</p>
  </div>
  <div class="tour-grid reveal">
${rows.slice(0, 3).map(tile).join('\n')}
  </div>
  <p class="tours-more reveal"><a href="${link.href}">${link.label} &rarr;</a></p>
</section>`;

  const existing = page.indexOf('<section class="tours" id="tours">');
  const listings = page.indexOf('<section class="soldhere" id="listings">');
  if (existing >= 0) {
    page = page.slice(0, existing) + strip + page.slice(page.indexOf('</section>', existing) + 10);
  } else if (listings >= 0) {
    page = page.slice(0, listings) + strip + page.slice(page.indexOf('</section>', listings) + 10);
  } else {
    const at = page.indexOf(c.insertBefore);
    page = page.slice(0, at) + strip + '\n\n' + page.slice(at);
  }
  page = page.replace(/<a href="(#listings|listings\.html)" class="nav-hide">Featured Listings<\/a>/, '<a href="#tours" class="nav-hide">Video Tours</a>');
  if (!page.includes('shared/tours.js')) page = page.replace('</body>', '<script src="../shared/tours.js"></script>\n\n</body>');
  fs.writeFileSync(indexPath, page);

  if (c.allLink) continue;

  // Update content inside the approved page, preserving shared chrome and scripts.
  const toursPath=`cities/${c.slug}/tours.html`;
  let tours=fs.readFileSync(toursPath,'utf8');
  const section=/<section class="tours-all">[\s\S]*?<\/section>/;
  if(!section.test(tours))throw new Error('Missing tour archive section: '+toursPath);
  tours=tours.replace(section,`<section class="tours-all"><div class="tour-grid">${rows.map(tile).join('\n')}</div></section>`);
  tours=tours.replace(/<h1>[\s\S]*?<\/h1>/,`<h1>${escape(pageName)}, one home at a time. ${rows.length} video tours.</h1>`);
  tours=tours.replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g,`$1Explore ${rows.length} video tours from Jack Klemm’s marketing archive in ${escape(pageName)}. Ask Jack about current availability.`);
  fs.writeFileSync(toursPath,tours);
  console.log(`${c.slug}: refreshed ${rows.length} tours; preserved page design`);
}
