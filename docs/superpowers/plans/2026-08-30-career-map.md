# Career Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone scrolling page that renders four invented real-estate career profiles, each in the visualization treatment that suits it, ending in a playable frame.

**Architecture:** Static page at `career-map/`, outside the `build-sites.ps1` pipeline so it never ships to the live site. Classic `<script>` tags attaching to one `CareerMap` global — no ES modules, no bundler, no `fetch`. This matters: the piece must open by double-clicking the file with no internet and no server. Generated sale data is emitted as a `.js` file that assigns a global for the same reason. Dense animated fields render to canvas; the basemap, split frame, and ledger render as SVG.

**Tech Stack:** Vanilla HTML/CSS/JS. Node 24 (`node --test`, built in) for generator tests only. Python http.server on port 8742 via the existing `.claude/launch.json` for preview.

---

## A note on testing in this plan

This is a visual piece. Unit tests are written only where there is real deterministic logic — the coordinate helpers and the sale generator. Those get true TDD.

The five rendering screens are verified in the browser preview with screenshots, not asserted against. A passing test would not tell you whether the Drift bloom looks like weather. Do not write DOM snapshot tests for them; they cost time and prove nothing.

For the same reason, renderer tasks below specify exact file paths, exact function signatures, exact behavior and exact verification steps, but do not transcribe every drawing call. The logic-bearing tasks (1, 3) contain complete code.

---

## File structure

| File | Responsibility |
|---|---|
| `career-map/index.html` | All five screens, markup only |
| `career-map/career-map.css` | All styling, tokens pulled from `DESIGN.md` |
| `career-map/js/geo.js` | Coordinate space, town centroids, seeded RNG, scatter |
| `career-map/js/basemap.js` | Injects the traced county SVG |
| `career-map/js/screen-anchor.js` | Screen 1, canvas pin accumulation |
| `career-map/js/screen-drift.js` | Screen 2, canvas territory bloom |
| `career-map/js/screen-specialist.js` | Screen 3, SVG split frame + morph |
| `career-map/js/screen-newcomer.js` | Screen 4, SVG ledger grid |
| `career-map/js/screen-play.js` | Screen 5, interactive finale |
| `career-map/js/main.js` | Scroll observers, wiring, reduced-motion |
| `career-map/data/sales.js` | Generated. Assigns `window.CAREER_MAP_SALES` |
| `tools/generate-sales.mjs` | Generator. Writes `career-map/data/sales.js` |
| `tools/generate-sales.test.mjs` | Tests for the generator |

---

## Task 1: Coordinate space and geography

**Files:**
- Create: `career-map/js/geo.js`
- Test: `tools/geo.test.mjs`

The map's coordinate space is `0 0 1000 667`, matching the reference image's 3:2 aspect. Y increases downward, so north is a *lower* y. Centroids below are read off `docs/reference/san-joaquin-county-basemap.png` and get calibrated against the traced path in Task 2.

`spread` is the standard deviation in map units used when scattering sales around a centroid. `founded` means no sale may be generated there before that year.

- [ ] **Step 1: Write the failing test**

Create `tools/geo.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { CITIES, CITY_KEYS, makeRng, scatter } from '../career-map/js/geo.js';

test('every city sits inside the map viewbox', () => {
  for (const key of CITY_KEYS) {
    const c = CITIES[key];
    assert.ok(c.x > 0 && c.x < 1000, `${key} x out of range`);
    assert.ok(c.y > 0 && c.y < 667, `${key} y out of range`);
  }
});

test('Stockton is north of Tracy', () => {
  assert.ok(CITIES.stockton.y < CITIES.tracy.y);
});

test('Del Webb sits inside Manteca, not near Lodi', () => {
  const dx = CITIES.delWebb.x - CITIES.manteca.x;
  const dy = CITIES.delWebb.y - CITIES.manteca.y;
  assert.ok(Math.hypot(dx, dy) < CITIES.manteca.spread);
});

test('makeRng is deterministic for a given seed', () => {
  const a = makeRng(42), b = makeRng(42);
  assert.strictEqual(a(), b());
  assert.strictEqual(a(), b());
});

test('makeRng returns values in [0,1)', () => {
  const r = makeRng(7);
  for (let i = 0; i < 500; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1);
  }
});

test('scatter stays inside the viewbox and near its centroid', () => {
  const rng = makeRng(3);
  for (let i = 0; i < 2000; i++) {
    const p = scatter(CITIES.tracy, rng);
    assert.ok(p.x >= 0 && p.x <= 1000);
    assert.ok(p.y >= 0 && p.y <= 667);
    assert.ok(Math.hypot(p.x - CITIES.tracy.x, p.y - CITIES.tracy.y) <= CITIES.tracy.spread * 3);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/geo.test.mjs`
Expected: FAIL, cannot find module `../career-map/js/geo.js`

- [ ] **Step 3: Write the implementation**

Create `career-map/js/geo.js`. It is written so it works both as a plain browser script and as an ESM import in tests:

```js
const MAP_W = 1000;
const MAP_H = 667;

const CITIES = {
  tracy:         { label: 'Tracy',                    x: 238, y: 456, spread: 34, founded: 1870 },
  mountainHouse: { label: 'Mountain House',           x: 267, y: 404, spread: 16, founded: 2001 },
  lathrop:       { label: 'Lathrop',                  x: 470, y: 400, spread: 20, founded: 1887 },
  riverIslands:  { label: 'River Islands',            x: 449, y: 425, spread: 14, founded: 2014 },
  manteca:       { label: 'Manteca',                  x: 537, y: 430, spread: 28, founded: 1918 },
  delWebb:       { label: 'Del Webb at Woodbridge',   x: 525, y: 418, spread:  8, founded: 2015 },
  stockton:      { label: 'Stockton',                 x: 501, y: 234, spread: 44, founded: 1850 },
};

const CITY_KEYS = Object.keys(CITIES);

// mulberry32 — small, fast, deterministic.
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Box-Muller, clamped to 3 sigma so nothing lands in the next county.
function gaussian(rng) {
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return clamp(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v), -3, 3);
}

function scatter(city, rng) {
  return {
    x: clamp(Math.round(city.x + gaussian(rng) * city.spread), 0, MAP_W),
    y: clamp(Math.round(city.y + gaussian(rng) * city.spread), 0, MAP_H),
  };
}

const geo = { MAP_W, MAP_H, CITIES, CITY_KEYS, makeRng, scatter, clamp };
if (typeof window !== 'undefined') window.CareerMapGeo = geo;
export { MAP_W, MAP_H, CITIES, CITY_KEYS, makeRng, scatter, clamp };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/geo.test.mjs`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add career-map/js/geo.js tools/geo.test.mjs
git commit -m "Add career map coordinate space and seeded scatter"
```

---

## Task 2: Draw the county basemap

**Files:**
- Create: `career-map/js/basemap.js`
- Reference: `docs/reference/san-joaquin-county-basemap.png`

No tests. This is tracing work, verified by eye.

- [ ] **Step 1: Trace the county outline**

Open the reference PNG. Trace the San Joaquin County boundary as a single SVG `path` in the `0 0 1000 667` space. The reference is 1536x1024, so divide every pixel coordinate by 1.536.

Keep it simplified — roughly 40 to 60 points. This is a stylized map, not a survey. The recognizable features are the notched northwest corner where the Delta cuts in, the long straight eastern edge, and the stepped southern boundary.

- [ ] **Step 2: Add water and roads as separate paths**

Three layers, each its own path group so they can be styled and faded independently:
- `water` — the Delta lobes and the San Joaquin river running north through the middle
- `roads` — I-5 (north/south through the centre), I-205 and I-580 (the southwest commuter corridor), Highway 99 (northeast)
- `border` — the county outline stroke

- [ ] **Step 3: Write the module**

Create `career-map/js/basemap.js` exposing:

```js
window.CareerMapBasemap = {
  // Returns an <svg> element at 0 0 1000 667 with .layer-water, .layer-roads, .layer-border groups.
  create() { /* ... */ },
  // Town dots + labels. keys is an array of CITY_KEYS; others are omitted entirely.
  labelCities(svgEl, keys) { /* ... */ }
};
```

`labelCities` must never render the Lodi-area Woodbridge. It is not in `CITIES` and must not be added — the only Woodbridge in this piece is Del Webb, inside Manteca.

- [ ] **Step 4: Verify in the browser**

Create a throwaway `career-map/index.html` that calls `create()` and appends it to the body.

Start the preview: `preview_start` with name `klemm-static`, then navigate to `http://localhost:8742/career-map/index.html`.

Take a screenshot. Compare against `docs/reference/san-joaquin-county-basemap.png`. The county silhouette must be recognizable side by side. Confirm Tracy sits low-left, Stockton high-centre, Manteca right of Lathrop.

- [ ] **Step 5: Calibrate the centroids**

Overlay the seven city dots. If any sits in the wrong place relative to the traced outline, correct the `x`/`y` values in `career-map/js/geo.js` and re-run `node --test tools/geo.test.mjs` to confirm the invariants still hold.

- [ ] **Step 6: Commit**

```bash
git add career-map/js/basemap.js career-map/js/geo.js career-map/index.html
git commit -m "Add traced San Joaquin County basemap"
```

---

## Task 3: The sale generator

**Files:**
- Create: `tools/generate-sales.mjs`
- Test: `tools/generate-sales.test.mjs`
- Output: `career-map/data/sales.js`

Each sale is a compact array to keep the emitted file small: `[yearOffset, cityIdx, x, y, priceBand, typeIdx]` where `yearOffset` is years since 1988, `cityIdx` indexes `CITY_KEYS`, `priceBand` is 0-4, and `typeIdx` is 0 single-family, 1 condo/townhome, 2 fifty-five-plus, 3 waterfront.

Profiles are defined as eras. Each era names a year range, a per-year sale count, and a weighted city mix.

- [ ] **Step 1: Write the failing test**

Create `tools/generate-sales.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { generateAll, PROFILES, BASE_YEAR } from './generate-sales.mjs';
import { CITIES, CITY_KEYS, MAP_W, MAP_H } from '../career-map/js/geo.js';

const data = generateAll(20260830);
const cityOf = (s) => CITY_KEYS[s[1]];
const yearOf = (s) => BASE_YEAR + s[0];

test('every profile produced sales', () => {
  for (const key of Object.keys(PROFILES)) {
    assert.ok(data[key].length > 0, `${key} is empty`);
  }
});

test('volumes land near their intended totals', () => {
  const within = (n, target, pct) => Math.abs(n - target) <= target * pct;
  assert.ok(within(data.anchor.length, 3900, 0.12), `anchor was ${data.anchor.length}`);
  assert.ok(within(data.drift.length, 1400, 0.12), `drift was ${data.drift.length}`);
  assert.ok(within(data.specialist.length, 310, 0.15), `specialist was ${data.specialist.length}`);
  assert.ok(within(data.newcomer.length, 240, 0.15), `newcomer was ${data.newcomer.length}`);
});

test('no sale predates its profile or runs past 2026', () => {
  for (const [key, profile] of Object.entries(PROFILES)) {
    for (const s of data[key]) {
      assert.ok(yearOf(s) >= profile.start, `${key} sold in ${yearOf(s)}, starts ${profile.start}`);
      assert.ok(yearOf(s) <= 2026, `${key} sold in ${yearOf(s)}`);
    }
  }
});

test('no sale predates the community being built', () => {
  for (const key of Object.keys(PROFILES)) {
    for (const s of data[key]) {
      assert.ok(yearOf(s) >= CITIES[cityOf(s)].founded,
        `${key}: ${cityOf(s)} sale in ${yearOf(s)}, founded ${CITIES[cityOf(s)].founded}`);
    }
  }
});

test('every position sits inside the viewbox', () => {
  for (const key of Object.keys(PROFILES)) {
    for (const s of data[key]) {
      assert.ok(s[2] >= 0 && s[2] <= MAP_W);
      assert.ok(s[3] >= 0 && s[3] <= MAP_H);
    }
  }
});

test('the same seed reproduces the same data', () => {
  assert.deepStrictEqual(generateAll(20260830), generateAll(20260830));
});

test('the Anchor is overwhelmingly Tracy', () => {
  const tracy = data.anchor.filter((s) => cityOf(s) === 'tracy').length;
  assert.ok(tracy / data.anchor.length >= 0.8, `only ${tracy}/${data.anchor.length} in Tracy`);
});

test('the Drift migrates south over its career', () => {
  const sorted = [...data.drift].sort((a, b) => a[0] - b[0]);
  const slice = Math.floor(sorted.length / 4);
  const meanY = (arr) => arr.reduce((t, s) => t + s[3], 0) / arr.length;
  // y increases downward, so a later, larger mean y means the territory moved south.
  assert.ok(meanY(sorted.slice(-slice)) > meanY(sorted.slice(0, slice)) + 60,
    'drift did not move far enough south');
});

test('the Specialist only sells waterfront and 55+', () => {
  const core = data.specialist.filter((s) => s[5] === 2 || s[5] === 3).length;
  assert.ok(core / data.specialist.length >= 0.85, `only ${core}/${data.specialist.length} on-type`);
});

test('the Newcomer starts in 2020', () => {
  assert.ok(Math.min(...data.newcomer.map(yearOf)) >= 2020);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/generate-sales.test.mjs`
Expected: FAIL, cannot find module `./generate-sales.mjs`

- [ ] **Step 3: Write the generator**

Create `tools/generate-sales.mjs`:

```js
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITIES, CITY_KEYS, makeRng, scatter } from '../career-map/js/geo.js';

export const BASE_YEAR = 1988;

const T = { SFH: 0, CONDO: 1, FIFTYFIVE: 2, WATERFRONT: 3 };

// Each era: [fromYear, toYear, salesPerYear, { cityKey: weight }]
export const PROFILES = {
  anchor: {
    start: 1988,
    types: { tracy: T.SFH, mountainHouse: T.SFH, manteca: T.SFH, lathrop: T.SFH, riverIslands: T.WATERFRONT, stockton: T.SFH, delWebb: T.FIFTYFIVE },
    eras: [
      [1988, 2000, 82, { tracy: 92, manteca: 4, lathrop: 4 }],
      [2001, 2013, 96, { tracy: 88, mountainHouse: 6, manteca: 3, lathrop: 3 }],
      [2014, 2026, 122, { tracy: 84, mountainHouse: 7, riverIslands: 4, manteca: 3, lathrop: 2 }],
    ],
  },
  drift: {
    start: 1995,
    types: { stockton: T.SFH, manteca: T.SFH, lathrop: T.SFH, mountainHouse: T.SFH, riverIslands: T.WATERFRONT, tracy: T.SFH },
    eras: [
      [1995, 2004, 38, { stockton: 74, manteca: 26 }],
      [2005, 2015, 46, { stockton: 28, manteca: 34, lathrop: 30, mountainHouse: 8 }],
      [2016, 2026, 52, { mountainHouse: 46, riverIslands: 34, lathrop: 14, tracy: 6 }],
    ],
  },
  specialist: {
    start: 2007,
    types: { riverIslands: T.WATERFRONT, delWebb: T.FIFTYFIVE, manteca: T.SFH, lathrop: T.SFH },
    eras: [
      [2007, 2014, 9,  { manteca: 55, lathrop: 45 }],
      [2015, 2019, 18, { delWebb: 62, riverIslands: 26, manteca: 12 }],
      [2020, 2026, 22, { riverIslands: 50, delWebb: 44, manteca: 6 }],
    ],
  },
  newcomer: {
    start: 2020,
    types: { mountainHouse: T.SFH, riverIslands: T.WATERFRONT, tracy: T.SFH, lathrop: T.SFH },
    eras: [
      [2020, 2021, 21, { mountainHouse: 62, tracy: 38 }],
      [2022, 2024, 40, { mountainHouse: 48, riverIslands: 34, tracy: 12, lathrop: 6 }],
      [2025, 2026, 55, { riverIslands: 46, mountainHouse: 40, lathrop: 14 }],
    ],
  },
};

function pickCity(mix, year, rng) {
  // Drop communities that did not exist yet, then re-normalise the weights.
  const open = Object.entries(mix).filter(([k]) => year >= CITIES[k].founded);
  if (open.length === 0) return null;
  const total = open.reduce((t, [, w]) => t + w, 0);
  let roll = rng() * total;
  for (const [key, w] of open) {
    roll -= w;
    if (roll <= 0) return key;
  }
  return open[open.length - 1][0];
}

function priceBand(cityKey, rng) {
  const lift = { riverIslands: 2, delWebb: 1, mountainHouse: 1, tracy: 0, lathrop: 0, manteca: 0, stockton: -1 }[cityKey] ?? 0;
  return Math.max(0, Math.min(4, Math.round(rng() * 2 + 1 + lift)));
}

export function generateProfile(profile, rng) {
  const sales = [];
  for (const [from, to, perYear, mix] of profile.eras) {
    for (let year = from; year <= to; year++) {
      // +/- 18% year-to-year wobble so the accumulation does not look metronomic.
      const n = Math.round(perYear * (0.82 + rng() * 0.36));
      for (let i = 0; i < n; i++) {
        const cityKey = pickCity(mix, year, rng);
        if (!cityKey) continue;
        const p = scatter(CITIES[cityKey], rng);
        sales.push([
          year - BASE_YEAR,
          CITY_KEYS.indexOf(cityKey),
          p.x,
          p.y,
          priceBand(cityKey, rng),
          profile.types[cityKey] ?? T.SFH,
        ]);
      }
    }
  }
  return sales;
}

export function generateAll(seed) {
  const out = {};
  // One RNG per profile, seeded off the master seed, so editing one profile's
  // eras does not reshuffle the others.
  Object.entries(PROFILES).forEach(([key, profile], i) => {
    out[key] = generateProfile(profile, makeRng(seed + i * 7919));
  });
  return out;
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = join(here, '..', 'career-map', 'data', 'sales.js');
  const data = generateAll(20260830);
  const body = Object.entries(data)
    .map(([k, v]) => `  ${k}: [\n${v.map((s) => `    [${s.join(',')}]`).join(',\n')}\n  ]`)
    .join(',\n');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath,
    `// Generated by tools/generate-sales.mjs. Do not edit by hand.\n` +
    `// Invented data. No real addresses, no real sales.\n` +
    `window.CAREER_MAP_SALES = {\n${body}\n};\n`);
  const counts = Object.entries(data).map(([k, v]) => `${k} ${v.length}`).join(', ');
  console.log(`wrote ${outPath} — ${counts}`);
}

if (process.argv[1] && process.argv[1].endsWith('generate-sales.mjs')) main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/generate-sales.test.mjs`
Expected: PASS, 10 tests

If the volume test fails, adjust `salesPerYear` in the offending era rather than loosening the tolerance. If the Drift migration test fails, widen the north/south gap between its first and last era mixes.

- [ ] **Step 5: Generate the data file**

Run: `node tools/generate-sales.mjs`
Expected: `wrote .../career-map/data/sales.js — anchor 3900ish, drift 1400ish, specialist 310ish, newcomer 240ish`

Confirm the file is under 400KB: `ls -l career-map/data/sales.js`

- [ ] **Step 6: Commit**

```bash
git add tools/generate-sales.mjs tools/generate-sales.test.mjs career-map/data/sales.js
git commit -m "Add seeded sale generator and generated career data"
```

---

## Task 4: Screen 1 — The Anchor

**Files:**
- Create: `career-map/js/screen-anchor.js`
- Modify: `career-map/index.html`, `career-map/career-map.css`

Canvas layered over the SVG basemap. 3,900 dots accumulate in chronological order over about twelve seconds, then hold. A zoom pulls from county-wide into a single dense Tracy neighbourhood.

- [ ] **Step 1: Build the static end state first**

Render all 3,900 anchor dots at once, no animation, no zoom. Dot radius 1.6 map units, fill `#171717` at 55% alpha so overlaps darken and repeat streets read as denser ink.

Interface:

```js
window.CareerMapAnchor = {
  mount(containerEl) {},   // build canvas + basemap, draw nothing
  play() {},               // run the accumulation, then the zoom
  finish() {}              // jump straight to the final held frame
};
```

- [ ] **Step 2: Verify the static frame**

Navigate to `http://localhost:8742/career-map/index.html`, screenshot.

Tracy must read as a solid dark mass, Mountain House and River Islands as faint clouds, the rest of the county nearly empty. If Tracy is a flat blob with no internal texture, lower the alpha to 40% and re-check.

- [ ] **Step 3: Add chronological accumulation**

Sort by `yearOffset`. Draw progressively across roughly 12 seconds using `requestAnimationFrame`, tracking elapsed time rather than frame count so it runs the same on any refresh rate. Never clear the canvas — new dots layer onto old ones, which is what produces the ink-soak.

Overlay the running year in Libre Caslon Display, and the running sale count beneath it in Inter.

- [ ] **Step 4: Add the zoom**

After accumulation completes, hold one second, then ease the canvas transform over two seconds to about 6x centred on Tracy. The dot radius must stay constant in screen pixels while zooming, so divide the drawn radius by the current scale. Hold the zoomed frame.

- [ ] **Step 5: Verify the animation**

Reload and screenshot at roughly 3s, 8s, and after the zoom settles. Confirm the county fills progressively rather than appearing at once, the year counter climbs, and individual dots stay crisp at 6x.

- [ ] **Step 6: Commit**

```bash
git add career-map/js/screen-anchor.js career-map/index.html career-map/career-map.css
git commit -m "Add the Anchor screen: chronological pin accumulation and street zoom"
```

---

## Task 5: Screen 2 — The Drift

**Files:**
- Create: `career-map/js/screen-drift.js`
- Modify: `career-map/index.html`, `career-map/career-map.css`

Blurred density field, not dots. The mass migrates from Stockton down to Mountain House and River Islands across 31 years, leaving a ghost trail.

- [ ] **Step 1: Build the density field for a single year window**

For a five-year window, draw each sale as a radial gradient blob of radius 26 map units at low alpha onto an offscreen canvas, then composite. Overlapping blobs accumulate into a continuous field. Do not use a CSS blur filter — it is too slow to animate at this size.

Interface mirrors Task 4 exactly: `mount(containerEl)`, `play()`, `finish()`.

- [ ] **Step 2: Verify one window**

Screenshot the 1995-1999 window. It must read as one soft warm mass sitting over Stockton with no visible individual dots. If blobs are distinguishable, raise the radius or lower per-blob alpha.

- [ ] **Step 3: Animate the window across the career**

Slide the five-year window from 1995 to 2026 over about fourteen seconds. Each frame clears and redraws the current window, then draws the accumulated ghost trail underneath at roughly 12% alpha.

- [ ] **Step 4: Verify the migration**

Screenshot at 1998, 2010, and 2024. The bright mass must be clearly over Stockton, then Lathrop/Manteca, then Mountain House/River Islands. The ghost trail must show the full path travelled. If the movement is not obvious at a glance, widen the era mixes in `tools/generate-sales.mjs`, regenerate, and re-run the generator tests.

- [ ] **Step 5: Commit**

```bash
git add career-map/js/screen-drift.js career-map/index.html career-map/career-map.css
git commit -m "Add the Drift screen: migrating territory bloom with ghost trail"
```

---

## Task 6: Screen 3 — The Specialist

**Files:**
- Create: `career-map/js/screen-specialist.js`
- Modify: `career-map/index.html`, `career-map/career-map.css`

Split frame. Left is the map, where River Islands and Del Webb sit close enough to read as one vague territory. Right is the same sales re-sorted by buyer type into two dense blocks. The dots travel between the two states in one continuous move.

- [ ] **Step 1: Render both end states as static SVG**

Left: 310 dots at their map positions over the basemap, labelled only Lathrop, Manteca, River Islands, Del Webb.

Right: the same 310 dots packed into two labelled blocks, "Waterfront, River Islands" and "55+, Del Webb at Woodbridge". Pack each block as a tidy grid, roughly 14 columns.

Each dot is one `<circle>` with a stable `data-i` index, so the same element moves between states. 310 circles is well within SVG's comfortable range.

- [ ] **Step 2: Verify the argument reads**

Screenshot both states. The map state must genuinely look unremarkable — a small vague cluster mid-county. The sorted state must look confident and deliberate. If the map state already looks impressive, the screen has no argument; tighten the two clusters in the generator so they overlap more.

- [ ] **Step 3: Animate the transition**

Interpolate each circle's cx/cy from map position to grid position over 1.4 seconds with a staggered delay of about 1.5ms per index, easing out. One continuous move — never fade one state out and the other in.

- [ ] **Step 4: Verify the morph**

Screenshot mid-transition. Dots must be visibly in flight, not snapped. Confirm the stagger reads as a sweep rather than a single block move.

- [ ] **Step 5: Commit**

```bash
git add career-map/js/screen-specialist.js career-map/index.html career-map/career-map.css
git commit -m "Add the Specialist screen: map-to-buyer-type re-sort"
```

---

## Task 7: Screen 4 — The Newcomer

**Files:**
- Create: `career-map/js/screen-newcomer.js`
- Modify: `career-map/index.html`, `career-map/career-map.css`

No map. A ledger grid: one small square per sale, columns by year, stacking taller each year. Behind it, ghosted, Jack's first six years at the same scale.

- [ ] **Step 1: Render the newcomer ledger**

Seven columns, 2020 through 2026. Each column is a stack of 6x6 unit squares with 2 units of gap, one per sale, growing upward from a shared baseline. Year labels in Inter beneath the baseline.

- [ ] **Step 2: Add the comparison layer**

Behind the newcomer columns, draw Jack's 1988-1993 sales as the same grid at the same scale in `--hairline-strong`, aligned to the same baseline so the two are directly comparable.

Label it plainly: "Jack's first six years, same scale." The comparison must be honest — first six against first six, never against his lifetime total.

- [ ] **Step 3: Verify the comparison is legible and fair**

Screenshot. A viewer must be able to tell at a glance whose columns are whose and that both cover six years. If the ghost layer competes with the foreground, drop it to `--hairline`.

- [ ] **Step 4: Animate**

Squares drop in year by year, about 300ms per column. The ghost layer fades up last, over 600ms, after all foreground columns have landed.

- [ ] **Step 5: Commit**

```bash
git add career-map/js/screen-newcomer.js career-map/index.html career-map/career-map.css
git commit -m "Add the Newcomer screen: ledger grid with same-scale comparison"
```

---

## Task 8: Screen 5 — The playable finale

**Files:**
- Create: `career-map/js/screen-play.js`
- Modify: `career-map/index.html`, `career-map/career-map.css`

One frame, four profile buttons, one year slider. Reuses the Anchor dot renderer.

- [ ] **Step 1: Build the frame and controls**

Basemap plus canvas, four buttons labelled The Anchor, The Drift, The Specialist, The Newcomer, and a range input spanning 1988 to 2026. Selecting a profile clamps the slider to that profile's start year.

- [ ] **Step 2: Wire the year slider**

Dragging redraws all sales for the selected profile up to and including the slider year. Redraw must complete inside one frame at 3,900 dots — draw to an offscreen canvas and blit, rather than issuing 3,900 separate arc calls per frame.

- [ ] **Step 3: Wire profile switching**

Switching profiles animates dots from their current positions to the new profile's positions over 900ms. Where counts differ, surplus dots fade out and new ones fade in.

- [ ] **Step 4: Verify interaction**

Drag the slider end to end for each of the four profiles. Confirm no stutter at the Anchor's full 3,900 and that switching never leaves orphaned dots on screen.

- [ ] **Step 5: Commit**

```bash
git add career-map/js/screen-play.js career-map/index.html career-map/career-map.css
git commit -m "Add the playable finale"
```

---

## Task 9: Assembly, typography, and motion policy

**Files:**
- Modify: `career-map/index.html`, `career-map/career-map.css`
- Create: `career-map/js/main.js`

- [ ] **Step 1: Write the scroll orchestration**

`main.js` mounts all five screens on load and uses one `IntersectionObserver` at threshold 0.55 to call `play()` on a screen the first time it enters view, matching the pattern in `home/index.html:210`. A screen already played is never replayed.

- [ ] **Step 2: Apply the type system**

Load Libre Caslon Display, Libre Caslon Text, and Inter from the same Google Fonts URL used in `home/index.html:17`. Pull colours from `DESIGN.md`. Each screen gets an eyebrow in Inter, a display headline in Libre Caslon Display, and one short paragraph in Libre Caslon Text.

Do not add borders, badges, kicker bars, or decorative rules. The screens are carried by the visualization and the type. Per the project's own design discipline, the default answer to any additional visual element is no.

- [ ] **Step 3: Add the opening and closing frames**

An opening title screen naming the piece and carrying Joel's byline. A closing frame after the finale with one line inviting the viewer to picture their own history.

State plainly somewhere persistent, in small type, that the data is invented for demonstration. This is not a disclaimer to bury — a viewer who thinks these are real sales and later learns otherwise is a worse outcome than one who knows up front.

- [ ] **Step 4: Handle reduced motion**

If `matchMedia('(prefers-reduced-motion: reduce)')` matches, `main.js` calls `finish()` instead of `play()` on every screen, so each renders its final held state immediately. The finale's controls stay fully interactive.

- [ ] **Step 5: Verify it survives being sent as a link**

Open `career-map/index.html` directly from the filesystem, not through the server. Every screen must render with no console errors — this is the check that catches an accidental `fetch` or ES module import.

Then confirm it still works served, at `http://localhost:8742/career-map/index.html`.

- [ ] **Step 6: Commit**

```bash
git add career-map/js/main.js career-map/index.html career-map/career-map.css
git commit -m "Assemble career map screens, typography, and motion policy"
```

---

## Task 10: Final pass

**Files:**
- Modify: whatever the pass turns up

- [ ] **Step 1: Full scroll-through**

Load the page fresh. Scroll top to bottom at reading pace. Screenshot each of the five screens at rest. Check `read_console_messages` for errors.

- [ ] **Step 2: Check it at laptop size**

`resize_window` to 1440x900, the likely demo machine. Confirm no horizontal scroll and no clipped map. Then 1280x800. This is not a mobile-first piece, but it must not break outright on a narrow window.

- [ ] **Step 3: Confirm each screen earns its treatment**

Look at the five screenshots side by side. If any two screens read as the same visual idea, the piece has failed its premise and that screen needs rethinking, not restyling.

- [ ] **Step 4: Re-run the logic tests**

Run: `node --test tools/`
Expected: PASS, 16 tests

- [ ] **Step 5: Commit**

```bash
git add -A career-map tools
git commit -m "Final pass on the career map demo"
```

---

## Self-review notes

Spec coverage checked against `docs/superpowers/specs/2026-08-30-career-map-design.md`:

- Four profiles, each with its own treatment — Tasks 4 through 7
- Playable finale — Task 8
- Archetype naming, no fake headshots — Task 9 Step 2
- Drawn SVG basemap, no map API — Task 2
- Canvas for dense fields, SVG for basemap/split/ledger — Tasks 4-7
- Seeded reproducible generator, no real addresses — Task 3
- Existing type and colour system — Task 9 Step 2
- Reduced motion — Task 9 Step 4
- Joel's byline — Task 9 Step 3
- Holds up sent as a link — Task 9 Step 5
- Outside the live build — no task modifies `build-sites.ps1`; `career-map/` is not copied by it

Two things the spec did not cover that this plan adds: an explicit invented-data notice on the page (Task 9 Step 3), and the file:// constraint that rules out ES modules and `fetch` (stated in Architecture, verified in Task 9 Step 5).
