// Turns the raw channel dump(s) (lines of: id title views age) into
// inventory.csv, inventory.json and summary.json with a city guess per video.
// Usage: node build-inventory.mjs raw-dump-1.txt [raw-dump-2.txt ...]
import fs from 'node:fs';
const seen = new Set();
const lines = [];
for (const src of process.argv.slice(2)) {
  let raw = fs.readFileSync(src, 'utf8');
  try { const j = JSON.parse(raw); raw = j.map(x => x.text).join('\n'); } catch {}
  for (const l0 of raw.split('\n')) {
    const l = l0.trim();
    const m = l.match(/^([\w-]{11})\s+(.*?)\s+(No views|[\d,.]+[KM]? views?)\s+(\d+ \w+ ago)$/);
    if (!m || seen.has(m[1])) continue;
    seen.add(m[1]);
    lines.push(m.slice(1));
  }
}
const cityRules = [
  ['Mountain House', /mountain house|mtn house/i],
  ['River Islands', /river islands/i],
  ['Lathrop', /lathrop/i],
  ['Manteca', /manteca/i],
  ['Tracy', /tracy/i],
  ['Ripon', /ripon/i],
  ['Salida', /salida/i],
  ['Stockton', /stockton/i],
  ['Patterson', /patterson/i],
  ['Modesto', /modesto/i],
  ['Lodi', /lodi/i],
  ['Escalon', /escalon/i],
  ['Oakdale', /oakdale/i],
  ['Discovery Bay', /discovery bay/i],
  ['Livermore', /livermore/i],
  ['Turlock', /turlock/i],
  ['Newman', /newman/i],
  ['Los Banos', /los banos/i],
  ['Byron', /byron/i],
  ['Brentwood', /brentwood/i],
];
const num = s => { const m = (s||'').replace(/,/g,'').match(/([\d.]+)([KM])?/); if (!m) return 0; let n = parseFloat(m[1]); if (m[2]==='K') n*=1000; if (m[2]==='M') n*=1e6; return Math.round(n); };
const ageYears = s => { const m = (s||'').match(/(\d+)\s+(day|week|month|year)/); if (!m) return 0; const n=+m[1]; return ({day:n/365, week:n/52, month:n/12, year:n})[m[2]]; };
const addr = t => { const m = t.match(/(\d{2,6}\s+(?:[NSEW]\.?\s+)?[A-Za-z0-9'.]+(?:\s+[A-Za-z0-9'.]+){0,4}?\s+(?:St|Street|Ave|Avenue|Ct|Court|Dr|Drive|Ln|Lane|Way|Rd|Road|Pl|Place|Blvd|Cir|Circle|Ter|Terrace|Loop|Trl|Trail|Pkwy|Hwy)\b\.?)/i); return m ? m[1].replace(/\s+/g,' ').replace(/\.$/,'') : ''; };
const rows = lines.map(([id, title, views, age]) => {
  const city = (cityRules.find(([, re]) => re.test(title)) || ['Unknown'])[0];
  const style = /^\d/.test(title.trim()) ? 'address-only' : (/ at \d/.test(title) ? 'remark + address' : 'other');
  return { id, title, address: addr(title), city, views: num(views), age, ageYears: +ageYears(age).toFixed(2), titleStyle: style, url: 'https://www.youtube.com/watch?v=' + id };
});
const esc = v => '"' + String(v).replace(/"/g,'""') + '"';
const cols = ['id','title','address','city','views','age','ageYears','titleStyle','url'];
fs.writeFileSync('inventory.csv', '﻿' + cols.join(',') + '\n' + rows.map(r => cols.map(c => esc(r[c])).join(',')).join('\n'));
fs.writeFileSync('inventory.json', JSON.stringify(rows, null, 1));
const by = (k) => rows.reduce((a, r) => (a[r[k]] = (a[r[k]]||0)+1, a), {});
const sorted = rows.map(r=>r.views).sort((a,b)=>a-b);
const sum = {
  total: rows.length,
  byCity: by('city'),
  byTitleStyle: by('titleStyle'),
  totalViews: rows.reduce((a,r)=>a+r.views,0),
  medianViews: sorted[Math.floor(rows.length/2)],
  under10Views: rows.filter(r=>r.views<10).length,
  over100Views: rows.filter(r=>r.views>=100).length,
  postedLast12Months: rows.filter(r=>r.ageYears<=1).length,
  postedLast12MonthsMedianViews: (()=>{const v=rows.filter(r=>r.ageYears<=1).map(r=>r.views).sort((a,b)=>a-b);return v[Math.floor(v.length/2)]})(),
  top20: rows.slice().sort((a,b)=>b.views-a.views).slice(0,20).map(r=>({views:r.views, age:r.age, title:r.title, id:r.id})),
  unknownCity: rows.filter(r=>r.city==='Unknown').map(r=>r.title),
  noAddressParsed: rows.filter(r=>!r.address).length,
};
fs.writeFileSync('summary.json', JSON.stringify(sum, null, 1));
console.log(JSON.stringify(sum, null, 1));
