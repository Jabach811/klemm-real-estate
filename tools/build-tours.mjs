// Builds the "Video tours" strip on each city page and that city's tours.html
// from the YouTube inventory. Run: node tools/build-tours.mjs
import fs from 'node:fs';

const INVENTORY = "C:/Dev/Joel's Workspaces/Personal/Work/Jack Klemm Real Estate/Klemm/PROJECTS/Youtube/data/inventory.json";
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

const tile = (v, city) => `    <div class="tour">
      <div class="tour-frame" data-video="${v.id}">
        <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="Video tour of ${v.address}, ${v.city}" loading="lazy">
      </div>
      <div class="tour-copy">
        <span>${v.address}, ${v.city}</span>
        <small>${v.age}</small>
      </div>
    </div>`;

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
    <p>Every home Jack lists gets its own video tour. These are the three most recent in ${c.name} &mdash; they play right here.</p>
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

  const header = page.slice(page.indexOf('<header>'), page.indexOf('</header>') + 9)
    .replace('href="#tours" class="nav-hide"', `href="../cities/${c.slug}/tours.html" class="nav-hide active"`)
    .replace('class="nav-hide active">Home', 'class="nav-hide">Home')
    .replace(/href="#(about|sell|buy|reviews)"/g, `href="../cities/${c.slug}/index.html#$1"`);
  const footer = page.slice(page.indexOf('<footer>'), page.indexOf('</footer>') + 9);
  const menuScript = page.slice(page.indexOf("document.querySelectorAll('.menu > button')"), page.indexOf("if (matchMedia("));
  const fonts = page.match(/<link rel="preconnect"[\s\S]*?styles\.css">/)[0];
  const ogImage = page.match(/<meta property="og:image" content="([^"]+)">/)[1];
  const title = `${pageName} Home Video Tours — Jack Klemm | Klemm Real Estate`;
  const desc = `Video tours of ${rows.length} ${pageName} homes listed and sold by Jack Klemm, Klemm Real Estate. Every home Jack lists gets its own tour.`;

  fs.writeFileSync(`cities/${c.slug}/tours.html`, `<!DOCTYPE html>
<html lang="en">
<head>
<base href="../../site/">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="https://klemmre.com/cities/${c.slug}/tours.html">
<meta property="og:image" content="${ogImage}">
${fonts}
</head>
<body>

${header}

<section class="tours-hero">
  <span class="eyebrow">${pageName} &middot; Video tours</span>
  <h1>Every home Jack lists here gets a video tour. All ${rows.length} of them.</h1>
  <p>Homes for sale and homes already sold, newest first. Each one plays right on this page. Selling in ${c.name}? Yours gets the same treatment &mdash; call or text <a href="tel:+12093211094" style="color:inherit">209.321.1094</a>.</p>
</section>

<section class="tours-all">
  <div class="tour-grid">
${rows.map(tile).join('\n')}
  </div>
</section>

${footer}

<script>
  ${menuScript.trim()}
</script>
<script src="../shared/tours.js"></script>

</body>
</html>
`);
  console.log(`${c.slug}: strip + tours.html (${rows.length} videos)`);
}
