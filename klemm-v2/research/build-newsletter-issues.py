from pathlib import Path
from html import escape, unescape
import re
from collections import Counter
import json

SOURCE = Path(r"C:\Dev\Joel's Workspaces\Personal\Work\Jack Klemm Real Estate\Klemm\site\newsletters")
ROOT = Path(__file__).resolve().parents[1] / 'implementation'
OUT = ROOT / 'newsletters'
OUT.mkdir(exist_ok=True)
months = 'january february march april may june july august september october november december'.split()
files = sorted((p for p in SOURCE.glob('*.html') if re.fullmatch(r'[a-z]+-\d{4}', p.stem)), key=lambda p: (int(p.stem.split('-')[1]), months.index(p.stem.split('-')[0])))
pattern = r'<li(?P<attr>[^>]*)><span class="n">(?P<n>.*?)</span><span class="addr">(?P<addr>.*?)</span>(?:<span class="by">(?P<by>.*?)</span>)?</li>'
total = 0
metadata = []
for idx, path in enumerate(files):
    src = path.read_text(encoding='utf-8')
    title = unescape(re.search(r'<h1>(.*?)</h1>', src).group(1))
    records = [{k: (v or '') for k,v in m.groupdict().items()} for m in re.finditer(pattern, src)]
    assert records, path
    assert len(records) == len(re.findall('class="addr"', src)), path
    total += len(records)
    metadata.append(dict(slug=path.stem,title=title,year=int(path.stem.split("-")[1]),month=months.index(path.stem.split("-")[0])+1,count=len(records)))
    def safe(value): return escape(unescape(value))
    rows = '\n'.join(f'<tr><td class="number">{safe(r["n"])}</td><th scope="row">{safe(r["addr"])}</th><td class="broker">{safe(r["by"])}' + (' <span class="klemm-badge">Jack’s brokerage</span>' if 'mine' in r['attr'] else '') + '</td></tr>' for r in records)
    counts = Counter(unescape(r['by']) for r in records)
    summary = ''.join(f'<li><span>{escape(b) if b else "Not recorded"}</span><strong>{n}</strong></li>' for b,n in counts.most_common())
    previous = f'<a href="{files[idx-1].name}">← {files[idx-1].stem.replace("-", " ").title()}</a>' if idx else '<span></span>'
    nextlink = f'<a href="{files[idx+1].name}">{files[idx+1].stem.replace("-", " ").title()} →</a>' if idx+1 < len(files) else '<span></span>'
    doc = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(title)} sales | Klemm Real Estate</title><meta name="robots" content="noindex,nofollow"><link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"><link rel="stylesheet" href="../v2.css"><link rel="stylesheet" href="../newsletter-issues.css"><script src="../v2.js" defer></script></head>
<body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="wrap">
  <a class="wordmark" href="https://klemm-real-estate-efkto1r1b-c-d-solutions.vercel.app/">Klemm <span>Real Estate</span></a>
  <a class="header-phone" href="tel:+12093211094" aria-label="Call Jack at 209.321.1094"><span class="phone-full">209.321.1094</span><span class="phone-short">Call</span></a>
  <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" hidden>Menu <span aria-hidden="true">＋</span></button>
  <nav id="primary-nav" aria-label="Main navigation">
    <a href="https://klemm-real-estate-efkto1r1b-c-d-solutions.vercel.app/">Home</a>
    <a href="../meet-jack.html#about">About</a>
    <a href="https://www.klemmre.com/featured-listings/">Featured Listings</a>
    <a href="sell.html">Sellers</a>
    <a href="buy.html">Buyers</a>
    <a href="../newsletters.html" aria-current="page">Newsletters</a>
    <a href="https://www.klemmre.com/past-sales/">Past Sales</a>
    <a href="communities.html">Communities</a>
    <a href="../meet-jack.html#contact">Contact</a>
  </nav>
</div></header>
<main id="main" class="wrap"><section class="issue-intro"><a class="back" href="../newsletters.html">← All newsletters</a><p class="eyebrow">Monthly market update · Tracy &amp; surrounding communities</p><div class="issue-heading"><div><h1>{escape(title)}</h1><p class="issue-description">Historical sales recorded in this issue of Jack’s newsletter. These are past sales, not current listings.</p></div><div class="sales-total"><strong>{len(records)}</strong><span>recorded sales</span></div></div></section>
<section class="sales-section" aria-labelledby="sales-title"><div class="sales-tools"><div><h2 id="sales-title">Homes sold</h2><p id="result-count" role="status">Showing all {len(records)} sales</p></div><div class="search-control" hidden><label for="sale-search">Find an address or brokerage</label><input id="sale-search" type="search" placeholder="Search this month…" autocomplete="off"></div></div>
<table class="sales-table"><caption class="visually-hidden">Homes sold in {escape(title)} and their listing brokerages</caption><thead><tr><th scope="col">No.</th><th scope="col">Property address</th><th scope="col">Listed by</th></tr></thead><tbody>{rows}</tbody></table><p id="empty-results" hidden>No matching sales. Try a street name or another brokerage.</p><p class="source-note">Data compliments of Metrolist MLS. Brokerage names are shown as recorded in the original newsletter.</p></section>
<details class="broker-summary"><summary>Sales by listing brokerage <span>{len(counts)} brokerages</span></summary><ol>{summary}</ol></details><nav class="issue-pagination" aria-label="Other newsletter issues">{previous}<a href="../newsletters.html">All issues</a>{nextlink}</nav></main>
<footer class="site-footer"><div class="wrap">
  <div><a class="wordmark" href="https://klemm-real-estate-efkto1r1b-c-d-solutions.vercel.app/">Klemm <span>Real Estate</span></a><p>Jack Klemm · Broker &amp; owner</p></div>
  <p><a href="tel:+12093211094">209.321.1094</a><br><a href="mailto:jack@klemmre.com">jack@klemmre.com</a></p>
  <p>672 W 11th St, Ste 216<br>Tracy, CA 95376</p>
  <p>© 2026 Klemm Real Estate · DRE #01004092<br>V2 design preview</p>
</div></footer>
<script>
const search = document.querySelector('#sale-search');
document.querySelector('.search-control').hidden = false;
const rows = Array.from(document.querySelectorAll('.sales-table tbody tr'));
search.addEventListener('input', () => {{
 const query = search.value.trim().toLocaleLowerCase();
 let visible = 0;
 rows.forEach(row => {{ const matches = row.textContent.toLocaleLowerCase().includes(query); row.hidden = !matches; if(matches) visible++; }});
 document.querySelector('#result-count').textContent = query ? `Showing ${{visible}} of ${{rows.length}} sales` : `Showing all ${{rows.length}} sales`;
 document.querySelector('#empty-results').hidden = visible !== 0;
}});
</script></body></html>'''
    # Root-level local HTML links need one parent segment from monthly issues.
    # Limit to the header so chronological sibling issue links remain unchanged.
    def fix_header(match):
        return re.sub(r'href="((?!\.\./)[a-z][a-z0-9-]*\.html(?:#[^"]*)?)"', r'href="../\1"', match.group(0))
    doc = re.sub(r'<header\b.*?</header>', fix_header, doc, flags=re.S)
    (OUT / path.name).write_text(doc, encoding='utf-8')
    assert doc.count('<th scope="row">') == len(records)
    output_tuples = re.findall(r'<tr><td class="number">(.*?)</td><th scope="row">(.*?)</th><td class="broker">(.*?)(?: <span class="klemm-badge">Jack’s brokerage</span>)?</td></tr>', doc)
    expected_tuples = [(safe(r['n']),safe(r['addr']),safe(r['by'])) for r in records]
    assert output_tuples == expected_tuples, path
    assert doc.count('class="klemm-badge"') == sum('mine' in r['attr'] for r in records), path
print(f'Built and checked {len(files)} issues; preserved {total} sale records.')

(ROOT / "issue-data.js").write_text("window.KLEMM_ISSUES = " + json.dumps(metadata[::-1],ensure_ascii=False,indent=2) + ";\n",encoding="utf-8")
