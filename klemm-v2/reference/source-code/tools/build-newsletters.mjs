import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const issues = JSON.parse(fs.readFileSync(path.join(root, 'tools/newsletter-issues.json'), 'utf8'));
const cleanBroker = raw => {
  if (!raw) return '';
  let b = raw
    .replace(/\s*[({[]?\s*(?:https?:\/\/|www\.).*$/i, '')
    .replace(/\s*[({[]?\s*(?:view|see)?\s*(?:the\s+)?virtual(?:\s+tour)?(?:\s+at)?\s*:?\s*\)?\s*$/i, '')
    .replace(/\s*[({[]\s*(?:no\s+)?photos?[^)\]]*\)?\s*$/i, '')
    .replace(/\s*[–—-]\s*courtesy\s+of\s+.*$/i, '')
    .replace(/^of\s*/i, '')
    .replace(/\s+\d{2,}[a-z]{4,}$/i, '')
    .replace(/\bReal\s+(?:Esatte|Estat|Esate|Estae|Estste)\b/gi, 'Real Estate')
    .replace(/[\s.,;:–—-]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return /^vt$/i.test(b) ? '' : b;
};
for (const issue of Object.values(issues)) {
  for (const item of issue.items) item.broker = cleanBroker(item.broker);
}

const isKlemm = b => /^klemm real estate$/i.test(b);

const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const cap = s => s[0].toUpperCase() + s.slice(1);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const order = Object.keys(issues)
  .map(slug => { const [m, y] = slug.split('-'); return { slug, month: cap(m), year: y, sort: +y * 12 + months.indexOf(m) }; })
  .sort((a, b) => a.sort - b.sort);

const nav = up => `<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><a class="wordmark" href="${up}../home/index.html">Klemm <span>Real Estate</span></a><a class="header-phone" href="tel:+12093211094" aria-label="Call Jack at 209.321.1094"><span class="phone-full">209.321.1094</span><span class="phone-short">Call</span></a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" hidden>Menu <span aria-hidden="true">＋</span></button><nav id="primary-nav" aria-label="Main navigation"><a href="${up}../home/index.html">Home</a><a href="${up}sites.html">Communities</a><a href="${up}sell.html">Sell</a><a href="${up}buy.html">Buy</a><a href="${up}listings.html">Listings &amp; tours</a><a href="${up}newsletters.html" aria-current="page">Newsletters</a><a href="${up}contact.html">Contact</a></nav></header>`;

const footer = up => `<footer>
  <div class="footer-links"><a href="${up}about.html">About Jack</a><a href="${up}reviews.html">Client reviews</a><a href="${up}past-sales.html">Sales record</a><a href="sms:+12093211094">Text Jack</a></div>
  <div class="foot-grid">
    <div class="foot-name">Jack Klemm<span class="foot-brand">Klemm Real Estate</span></div>
    <div class="foot-contact">
      <a href="tel:+12093211094">209.321.1094</a><br>
      <a href="mailto:jack@klemmre.com">jack@klemmre.com</a><br>
      672 W 11th St, Ste 216, Tracy, CA 95376
    </div>
  </div>
  <div class="foot-legal">
    <span>&copy; 2026 Klemm Real Estate &middot; DRE #01004092</span>
    <span><a href="https://www.facebook.com/JackKlemmRE" style="color:inherit">Facebook</a> &middot; <a href="https://www.zillow.com/profile/JackCKlemm" style="color:inherit">Zillow</a></span>
  </div>
</footer>`;

const issueCss = `
  .issue-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
    gap: clamp(36px, 5vw, 90px);
    align-items: start;
    padding: clamp(56px, 9vh, 110px) var(--pad) clamp(32px, 5vh, 56px);
  }
  .issue-head .back { display: block; width: fit-content; margin-bottom: 30px; font-size: 13px; color: var(--ink-soft); text-decoration: none; border-bottom: 1px solid var(--hairline); }
  .issue-head .back:hover { color: var(--brick); border-color: var(--brick); }
  .issue-head h1 { font-family: var(--serif); font-weight: 400; font-size: clamp(40px, 5.8vw, 76px); line-height: 1.05; letter-spacing: -0.01em; }
  .issue-head p { margin-top: 20px; max-width: 56ch; font-size: 15px; color: var(--ink-soft); }

  .issue-summary h2 {
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  .issue-summary ol { list-style: none; margin-top: 16px; border-top: 1px solid var(--ink); }
  .issue-summary li { display: flex; align-items: baseline; gap: 14px; padding: 11px 2px; border-bottom: 1px solid var(--hairline); }
  .issue-summary .b { font-family: var(--serif-text); font-size: 15.5px; line-height: 1.3; }
  .issue-summary .n { margin-left: auto; font-size: 12.5px; font-variant-numeric: tabular-nums; color: var(--ink-soft); }
  .issue-summary .rest { margin-top: 14px; font-size: 12.5px; line-height: 1.55; color: var(--ink-soft); }
  @media (max-width: 900px) { .issue-head { grid-template-columns: 1fr; gap: 40px; } }

  .sold { padding: 0 var(--pad) clamp(56px, 9vh, 110px); }
  .sold ol { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); column-gap: clamp(24px, 4vw, 64px); border-bottom: 1px solid var(--hairline); }
  .sold li { display: flex; align-items: baseline; gap: 14px; padding: 15px 2px; border-top: 1px solid var(--hairline); }
  .sold .n { flex: none; width: 2.4ch; font-size: 12px; font-variant-numeric: tabular-nums; color: var(--ink-soft); }
  .sold .addr { font-family: var(--serif-text); font-size: 17px; line-height: 1.3; }
  .sold .by { margin-left: auto; padding-left: 12px; text-align: right; font-size: 11.5px; line-height: 1.4; color: var(--ink-soft); }
  .sold li.mine .by, .issue-summary li.mine .b, .issue-summary li.mine .n { color: var(--brick); }
  .sold li.mine .addr, .issue-summary li.mine .b { font-weight: 600; }

  .issue-foot { display: flex; flex-wrap: wrap; gap: 20px 40px; align-items: baseline; padding: clamp(40px, 6vh, 72px) var(--pad) clamp(72px, 11vh, 130px); border-top: 1px solid var(--hairline); }
  .issue-foot a { font-family: var(--serif-text); font-size: 18px; color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--hairline); }
  .issue-foot a:hover { color: var(--brick); border-color: var(--brick); }
  .issue-foot .next { margin-left: auto; }
`;

const summary = items => {
  const tally = new Map();
  for (const i of items) {
    if (!i.broker) continue;
    tally.set(i.broker, (tally.get(i.broker) || 0) + 1);
  }
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = ranked.slice(0, 8);
  const rows = top.map(([name, n]) =>
    `      <li${isKlemm(name) ? ' class="mine"' : ''}><span class="b">${esc(name)}</span><span class="n">${n}</span></li>`
  ).join('\n');
  const restBrokers = ranked.length - top.length;
  const known = ranked.reduce((n, e) => n + e[1], 0);
  const restHomes = known - top.reduce((n, e) => n + e[1], 0);
  const unknown = items.length - known;
  const lines = [];
  if (restBrokers) lines.push(`${restBrokers} other brokerage${restBrokers === 1 ? '' : 's'} sold the remaining ${restHomes}.`);
  if (unknown) lines.push(`${unknown} sale${unknown === 1 ? ' has' : 's have'} no brokerage listed.`);
  const rest = lines.length ? `  <p class="rest">${lines.join(' ')}</p>` : '';
  return `  <aside class="issue-summary">
    <h2>Listed by</h2>
    <ol>
${rows}
    </ol>
${rest}
  </aside>`;
};

const issuePage = (entry, prev, next) => {
  const data = issues[entry.slug];
  const label = `${entry.month} ${entry.year}`;
  const desc = `Every home sold in Tracy and the surrounding communities in ${label}, from Jack Klemm's monthly newsletter. Data compliments of Metrolist MLS.`;
  const rows = data.items.map((i, n) =>
    `      <li${isKlemm(i.broker) ? ' class="mine"' : ''}><span class="n">${n + 1}</span><span class="addr">${esc(i.address)}</span>${i.broker ? `<span class="by">${esc(i.broker)}</span>` : ''}</li>`
  ).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${label} Newsletter &mdash; Klemm Real Estate | Tracy, CA</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${label} Newsletter &mdash; Klemm Real Estate | Tracy, CA">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="https://klemmre.com/newsletters/${entry.slug}.html">
<meta property="og:image" content="https://klemmre.com/home/assets/Klemm%20windmill%20hero.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../styles.css">
<style>${issueCss}</style>
</head>
<body id="top">

${nav('../')}
<main id="main" tabindex="-1">

<section class="issue-head">
  <div class="issue-intro">
    <a class="back" href="../newsletters.html">&larr; All newsletters</a>
    <h1>${label}</h1>
    <p>Every home that sold in Tracy and the surrounding communities this month, in the order they closed. ${esc(data.note || 'Data is compliments of Metrolist MLS.')}</p>
  </div>
${summary(data.items)}
</section>

<section class="sold" aria-label="Homes sold in ${label}">
  <ol>
${rows}
  </ol>
</section>

<nav class="issue-foot" aria-label="Other issues">
  ${prev ? `<a href="${prev.slug}.html">&larr; ${prev.month} ${prev.year}</a>` : ''}
  ${next ? `<a class="next" href="${next.slug}.html">${next.month} ${next.year} &rarr;</a>` : ''}
</nav>

</main>
${footer('../')}

<script src="../../shared/site.js" defer></script>
</body>
</html>
`;
};

const dir = path.join(root, 'site/newsletters');
fs.mkdirSync(dir, { recursive: true });
order.forEach((entry, i) => {
  fs.writeFileSync(path.join(dir, entry.slug + '.html'), issuePage(entry, order[i - 1], order[i + 1]));
});

const latest = order[order.length - 1];
const years = [...new Set(order.map(e => e.year))].sort().reverse();
const totalSales = order.reduce((n, e) => n + issues[e.slug].items.length, 0);
const num = n => n.toLocaleString('en-US');

const brokers = [];
const brokerIds = new Map();
const brokerId = b => {
  if (!b) return -1;
  if (!brokerIds.has(b)) { brokerIds.set(b, brokers.length); brokers.push(b); }
  return brokerIds.get(b);
};
const indexed = [...order].reverse().map(e => [e.slug, issues[e.slug].items.map(i => [i.address, brokerId(i.broker)])]);
fs.writeFileSync(path.join(dir, 'archive-data.js'), `window.KLEMM_ARCHIVE=${JSON.stringify({ b: brokers, i: indexed })};\n`);

const tallyPanel = (entries, year) => {
  const items = entries.flatMap(e => issues[e.slug].items);
  const tally = new Map();
  for (const i of items) {
    if (!i.broker) continue;
    tally.set(i.broker, (tally.get(i.broker) || 0) + 1);
  }
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = ranked.slice(0, 8);
  const rows = top.map(([name, n]) =>
    `        <li${isKlemm(name) ? ' class="mine"' : ''}><span class="b">${esc(name)}</span><span class="n">${num(n)}</span></li>`
  ).join('\n');
  const known = ranked.reduce((n, e) => n + e[1], 0);
  const restBrokers = ranked.length - top.length;
  const restHomes = known - top.reduce((n, e) => n + e[1], 0);
  const scope = year ? `in ${year}` : 'since April 2013';
  const rest = restBrokers
    ? `      <p class="rest">${num(restBrokers)} other brokerages sold the remaining ${num(restHomes)} ${scope}.</p>`
    : '';
  return `    <div class="arch-sum" data-year="${year}"${year ? ' hidden' : ''}>
      <h3>Listed by</h3>
      <ol>
${rows}
      </ol>
${rest}
    </div>`;
};

const panels = [tallyPanel(order, ''), ...years.map(y => tallyPanel(order.filter(e => e.year === y), y))].join('\n');

const chips = `    <button type="button" class="on" data-year="">All years</button>` + '\n' +
  years.map(y => `    <button type="button" data-year="${y}">${y}</button>`).join('\n');

const grids = years.map(year => {
  const list = order.filter(e => e.year === year).map(e => {
    const count = issues[e.slug].items.length;
    const tag = e.slug === latest.slug ? '<em class="tag">Latest</em>' : '';
    const aria = `${e.month} ${e.year} newsletter, ${count} sales${e.slug === latest.slug ? ', the latest issue' : ''}`;
    return `        <li><a href="newsletters/${e.slug}.html" aria-label="${aria}"><span class="m">${e.month}</span>${tag}<span class="c">${count}</span></a></li>`;
  }).join('\n');
  return `    <div class="year-block" data-year="${year}" id="y${year}">
      <div class="year-head"><h3>${year}</h3></div>
      <ul class="month-grid">
${list}
      </ul>
    </div>`;
}).join('\n\n');

const block = `  <div class="archive" data-issues="${order.length}" data-sales="${totalSales}">
  <form class="archive-search" role="search" onsubmit="return false">
    <label for="archive-q">Search the archive</label>
    <input id="archive-q" type="search" autocomplete="off" spellcheck="false" placeholder="Street, address, brokerage, or month">
  </form>

  <nav class="year-chips" aria-label="Filter by year">
${chips}
  </nav>

  <p class="archive-count" role="status" aria-live="polite">${num(order.length)} issues, ${num(totalSales)} sales.</p>

  <div class="archive-results" hidden></div>

  <div class="archive-summary">
${panels}
  </div>

  <div class="archive-months">
${grids}
  </div>
</div>`;

const indexPath = path.join(root, 'site/newsletters.html');
const index = fs.readFileSync(indexPath, 'utf8');
if (!index.includes('<!-- archive:start -->')) throw new Error('Archive markers not found in site/newsletters.html');
const marked = index.replace(
  /(<!-- archive:start -->)[\s\S]*?(<!-- archive:end -->)/,
  (_, start, end) => `${start}\n${block}\n  ${end}`
);

fs.writeFileSync(indexPath, marked);

console.log(`Built ${order.length} newsletter issues (${order[0].slug} to ${latest.slug}) and refreshed the archive list.`);
