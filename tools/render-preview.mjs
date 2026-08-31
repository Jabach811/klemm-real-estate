// Renders a PNG preview of the map straight from the source data.
//
// The point is to be able to look at the thing without a browser. Node has
// zlib, which is the only hard part of writing a PNG, so this stays dependency
// free. Draws at 2x and averages down, which is enough antialiasing for a
// check like this.
//
// Run: node tools/render-preview.mjs [profile] [outfile]

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COUNTY, WATER } from './basemap-data.mjs';
import { CITIES, MAP_W, MAP_H } from './geo.mjs';
import { generateAll } from './generate-sales.mjs';

const SS = 2;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

function canvas(w, h, bg) {
  const buf = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) buf.set(bg, i * 3);
  return { w, h, buf };
}

function blend(c, x, y, rgb, a) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 3;
  for (let k = 0; k < 3; k++) c.buf[i + k] = Math.round(c.buf[i + k] * (1 - a) + rgb[k] * a);
}

function fillPolygon(c, pts, rgb, a = 1) {
  const ys = pts.map((p) => p[1]);
  const y0 = Math.max(0, Math.floor(Math.min(...ys)));
  const y1 = Math.min(c.h - 1, Math.ceil(Math.max(...ys)));
  for (let y = y0; y <= y1; y++) {
    const cy = y + 0.5;
    const xs = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > cy !== yj > cy) xs.push(((xj - xi) * (cy - yi)) / (yj - yi) + xi);
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.max(0, Math.ceil(xs[k])); x <= Math.min(c.w - 1, Math.floor(xs[k + 1])); x++) {
        blend(c, x, y, rgb, a);
      }
    }
  }
}

function strokePolygon(c, pts, rgb, width) {
  const r = width / 2;
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    const steps = Math.ceil(Math.hypot(bx - ax, by - ay) * 2) + 1;
    for (let s = 0; s <= steps; s++) {
      const x = ax + ((bx - ax) * s) / steps;
      const y = ay + ((by - ay) * s) / steps;
      disc(c, x, y, r, rgb, 1);
    }
  }
}

function disc(c, cx, cy, r, rgb, a) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) blend(c, x, y, rgb, a);
    }
  }
}

function downscale(c, factor) {
  const w = Math.round(c.w / factor);
  const h = Math.round(c.h / factor);
  const out = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const acc = [0, 0, 0];
      for (let dy = 0; dy < factor; dy++) {
        for (let dx = 0; dx < factor; dx++) {
          const i = ((y * factor + dy) * c.w + (x * factor + dx)) * 3;
          for (let k = 0; k < 3; k++) acc[k] += c.buf[i + k];
        }
      }
      const o = (y * w + x) * 3;
      for (let k = 0; k < 3; k++) out[o + k] = Math.round(acc[k] / (factor * factor));
    }
  }
  return { w, h, buf: out };
}

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return (b) => {
    let c = -1;
    for (const v of b) c = t[(c ^ v) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(CRC(body));
  return Buffer.concat([len, body, crc]);
}

function toPng(c) {
  const raw = Buffer.alloc(c.h * (c.w * 3 + 1));
  for (let y = 0; y < c.h; y++) {
    raw[y * (c.w * 3 + 1)] = 0;
    Buffer.from(c.buf.buffer, y * c.w * 3, c.w * 3).copy(raw, y * (c.w * 3 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.w, 0);
  ihdr.writeUInt32BE(c.h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// zoom > 1 crops to a window of the map centred on cx,cy, the way the Anchor
// screen's street zoom does. Dot radii are given in output pixels, so they stay
// the same size on screen however far in you go.
export function renderMap({ pinSets = [], scale = 1, zoom = 1, cx = MAP_W / 2, cy = MAP_H / 2 }) {
  const s = scale * SS;
  const c = canvas(Math.round(MAP_W * s), Math.round(MAP_H * s), hex('#F6F1E8'));
  const k = s * zoom;
  const ox = (MAP_W * s) / 2 - cx * k;
  const oy = (MAP_H * s) / 2 - cy * k;
  const sc = (pts) => pts.map(([x, y]) => [x * k + ox, y * k + oy]);
  fillPolygon(c, sc(COUNTY), hex('#F3EDE2'));
  for (const w of WATER) {
    fillPolygon(c, sc(w), hex('#c7dcea'));
    strokePolygon(c, sc(w), hex('#c7dcea'), 1.4 * s);
  }
  strokePolygon(c, sc(COUNTY), hex('#aaa293'), 1.4 * s);
  for (const set of pinSets) {
    const rgb = hex(set.color);
    for (const p of set.points) disc(c, p[0] * k + ox, p[1] * k + oy, set.r * s, rgb, set.alpha);
  }
  for (const key of Object.keys(CITIES)) {
    const ci = CITIES[key];
    disc(c, ci.x * k + ox, ci.y * k + oy, 3 * s, hex('#1B1712'), 1);
  }
  return toPng(downscale(c, SS));
}

const here = dirname(fileURLToPath(import.meta.url));
const profile = process.argv[2] || 'anchor';
const zoom = Number(process.argv[4] || 1);
const out = process.argv[3] || join(here, '..', 'docs', 'reference', `preview-${profile}.png`);
const data = generateAll(20260830);
const COLORS = { anchor: '#a64a2a', drift: '#2f5d8a', specialist: '#6b8f3a', newcomer: '#8a2f6b' };
const sets =
  profile === 'all'
    ? Object.keys(data).map((k) => ({ points: data[k].map((s) => [s[2], s[3]]), color: COLORS[k], r: 1.5, alpha: 0.5 }))
    : [{ points: data[profile].map((s) => [s[2], s[3]]), color: COLORS[profile] || '#a64a2a', r: 1.5, alpha: 0.5 }];
writeFileSync(out, renderMap({
  pinSets: sets,
  scale: 0.72,
  zoom,
  cx: CITIES.tracy.x,
  cy: CITIES.tracy.y,
}));
console.log(`wrote ${out}`);
