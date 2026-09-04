// The drawn San Joaquin County basemap.
//
// The shapes live in career-map/data/sales.js, emitted by the generator from
// tools/basemap-data.mjs. This file only turns them into SVG.
//
// Y increases downward: north is a LOWER y.

(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    const node = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }

  function create() {
    const meta = window.CAREER_MAP_META;
    const svg = el('svg', {
      viewBox: `0 0 ${meta.mapW} ${meta.mapH}`,
      class: 'basemap',
      'aria-hidden': 'true',
      preserveAspectRatio: 'xMidYMid meet',
    });

    const land = el('g', { class: 'layer-land' });
    land.appendChild(el('path', { d: meta.county }));

    const water = el('g', { class: 'layer-water' });
    meta.water.forEach((d) => water.appendChild(el('path', { d })));

    const border = el('g', { class: 'layer-border' });
    border.appendChild(el('path', { d: meta.county }));

    svg.appendChild(land);
    svg.appendChild(water);
    svg.appendChild(border);
    svg.appendChild(el('g', { class: 'layer-labels' }));
    return svg;
  }

  // keys is an array of city keys. Anything not named is left off entirely —
  // each screen labels only what it is arguing about.
  function labelCities(svg, keys) {
    const cities = window.CAREER_MAP_META.cities;
    const layer = svg.querySelector('.layer-labels');
    layer.textContent = '';
    for (const key of keys) {
      const c = cities[key];
      if (!c) continue;
      const g = el('g', { class: 'city', 'data-city': key });
      g.appendChild(el('circle', { cx: c.x, cy: c.y, r: 2.5 }));
      const label = el('text', { x: c.x, y: c.y - 8 });
      label.textContent = c.label;
      g.appendChild(label);
      layer.appendChild(g);
    }
    return layer;
  }

  window.CareerMapBasemap = { create, labelCities };
})();
