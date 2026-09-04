// The drawn corridor basemap: Bay, ridges, road, towns.
//
// Shapes live in altamont/data/altamont.js, emitted by tools/generate-altamont.mjs
// from real latitude and longitude. This file only turns them into SVG.
//
// The place names come back as a separate overlay so a screen can stack them
// above its own canvas. Eight hundred landing dots will bury a label otherwise.
//
// Y increases downward: north is a LOWER y.

(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, text) {
    const node = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
    if (text != null) node.textContent = text;
    return node;
  }

  function blank(cls) {
    const geo = window.ALTAMONT_GEO;
    return el('svg', {
      viewBox: `0 0 ${geo.mapW} ${geo.mapH}`,
      class: cls,
      'aria-hidden': 'true',
      preserveAspectRatio: 'xMidYMid meet',
    });
  }

  function group(svg, cls) {
    const g = el('g', { class: cls });
    svg.appendChild(g);
    return g;
  }

  // Label offsets, in map units, for each compass position a place can claim.
  const SIDES = {
    n:  [0, -13, 'middle'],
    s:  [0, 20, 'middle'],
    e:  [10, 5, 'start'],
    w:  [-10, 5, 'end'],
    ne: [9, -9, 'start'],
    nw: [-9, -9, 'end'],
    se: [9, 16, 'start'],
    sw: [-9, 16, 'end'],
  };

  function place(layer, key, p, cls, radius) {
    const [dx, dy, anchor] = SIDES[p.side || 'e'];
    const g = el('g', { class: cls, 'data-place': key });
    g.appendChild(el('circle', { class: 'place-dot', cx: p.x, cy: p.y, r: radius }));
    g.appendChild(el('text', { x: p.x + dx, y: p.y + dy, 'text-anchor': anchor }, p.label));
    layer.appendChild(g);
    return g;
  }

  // Land, water, relief and the road. No names.
  function createTerrain() {
    const geo = window.ALTAMONT_GEO;
    const svg = blank('basemap');

    group(svg, 'layer-ocean').appendChild(el('path', { d: geo.ocean }));

    const ridges = group(svg, 'layer-ridges');
    geo.ridges.forEach((r) => ridges.appendChild(el('path', { d: r.d, 'data-ridge': r.key })));

    group(svg, 'layer-bay').appendChild(el('path', { d: geo.bay }));

    const channels = group(svg, 'layer-channels');
    geo.channels.forEach((d) => channels.appendChild(el('path', { d })));

    group(svg, 'layer-road').appendChild(el('path', { d: geo.corridor }));

    const bridges = group(svg, 'layer-bridges');
    geo.bridges.forEach((b) => bridges.appendChild(el('path', { d: b.d, 'data-bridge': b.key })));

    return svg;
  }

  // Every name on the map, as its own transparent sheet.
  function createLabels(options) {
    const geo = window.ALTAMONT_GEO;
    const opts = options || {};
    const svg = blank('basemap overlay');
    const labels = group(svg, 'layer-labels');

    geo.ridges.forEach((r) => {
      labels.appendChild(el('text', {
        class: 'ridge-label',
        x: r.anchor.x,
        y: r.anchor.y,
        'text-anchor': 'middle',
        transform: `rotate(${r.anchor.angle} ${r.anchor.x} ${r.anchor.y})`,
      }, r.label));
    });

    if (opts.origins !== false) {
      for (const [key, p] of Object.entries(geo.origins)) place(labels, key, p, 'place-origin', 3);
    }
    for (const [key, p] of Object.entries(geo.destinations)) {
      place(labels, key, p, 'place-dest', 4.5);
    }

    // The pass gets a name and an elevation, because the number is the argument.
    const pass = geo.pass;
    const g = el('g', { class: 'place-pass' });
    g.appendChild(el('text', { x: pass.x, y: pass.y - 16, 'text-anchor': 'middle' },
      `${pass.label} — ${pass.elevationFt.toLocaleString()} ft`));
    labels.appendChild(g);

    return svg;
  }

  window.AltamontMap = { createTerrain, createLabels };
})();
