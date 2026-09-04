// Screen 1 — The Anchor.
//
// A canvas of one dot per sale sits on top of the SVG basemap. Dots are drawn
// in the order the sales happened and the canvas is never cleared, so streets
// that came up again and again soak darker, the way ink does on paper.
//
// The zoom is the payoff, so it is done properly: the canvas redraws every
// frame with the dot radius held at a constant number of screen pixels, and the
// SVG re-aims its viewBox to match. Scaling the elements with a CSS transform
// would just make fat blurry dots.

(function () {
  const ACCUMULATE_MS = 12000;
  const HOLD_MS = 1000;
  const ZOOM_MS = 2000;
  const ZOOM = 12;
  const DOT_UNITS = 1.6;
  const DOT_ALPHA = 0.55;

  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function build(container) {
    const meta = window.CAREER_MAP_META;
    const svg = window.CareerMapBasemap.create();
    window.CareerMapBasemap.labelCities(svg, ['tracy', 'mountainHouse', 'lathrop', 'manteca', 'stockton']);
    container.appendChild(svg);

    const canvas = document.createElement('canvas');
    canvas.className = 'pin-canvas';
    container.appendChild(canvas);

    const readout = document.createElement('div');
    readout.className = 'readout';
    readout.innerHTML = '<span class="readout-year"></span><span class="readout-count"></span>';
    container.appendChild(readout);

    return {
      meta,
      svg,
      canvas,
      ctx: canvas.getContext('2d'),
      yearEl: readout.querySelector('.readout-year'),
      countEl: readout.querySelector('.readout-count'),
      sales: window.CAREER_MAP_SALES.anchor.slice().sort((a, b) => a[0] - b[0]),
    };
  }

  // Everything drawn goes through this. zoom 1 centred on the map is the whole
  // county; higher zoom narrows in on cx,cy.
  function view(s, zoom, cx, cy) {
    const base = s.canvas.clientWidth / s.meta.mapW;
    const k = base * zoom;
    return {
      base,
      k,
      ox: s.canvas.clientWidth / 2 - cx * k,
      oy: s.canvas.clientHeight / 2 - cy * k,
      r: DOT_UNITS * base,
    };
  }

  function aimSvg(s, zoom, cx, cy) {
    const w = s.meta.mapW / zoom;
    const h = s.meta.mapH / zoom;
    s.svg.setAttribute('viewBox', `${cx - w / 2} ${cy - h / 2} ${w} ${h}`);
    s.svg.style.setProperty('--map-zoom', zoom);
    s.svg.classList.toggle('close-in', zoom > 3);
  }

  function resize(s) {
    const dpr = window.devicePixelRatio || 1;
    s.canvas.width = Math.round(s.canvas.clientWidth * dpr);
    s.canvas.height = Math.round(s.canvas.clientHeight * dpr);
    s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function clear(s) {
    s.ctx.save();
    s.ctx.setTransform(1, 0, 0, 1, 0, 0);
    s.ctx.clearRect(0, 0, s.canvas.width, s.canvas.height);
    s.ctx.restore();
  }

  function drawRange(s, v, from, to) {
    const ctx = s.ctx;
    ctx.fillStyle = `rgba(23, 23, 23, ${DOT_ALPHA})`;
    for (let i = from; i < to; i++) {
      const sale = s.sales[i];
      ctx.beginPath();
      ctx.arc(sale[2] * v.k + v.ox, sale[3] * v.k + v.oy, v.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function setReadout(s, index) {
    const year = s.meta.baseYear + s.sales[Math.max(0, index - 1)][0];
    s.yearEl.textContent = year;
    s.countEl.textContent = index.toLocaleString() + ' sales';
  }

  let state = null;
  let raf = 0;

  function mount(container) {
    container.textContent = '';
    state = build(container);
    resize(state);
    aimSvg(state, 1, state.meta.mapW / 2, state.meta.mapH / 2);
    setReadout(state, 0);
    state.yearEl.textContent = state.meta.baseYear;
    window.addEventListener('resize', () => {
      if (!state) return;
      resize(state);
      redrawAll(state, state.zoom || 1, state.cx || state.meta.mapW / 2, state.cy || state.meta.mapH / 2);
    });
  }

  function redrawAll(s, zoom, cx, cy) {
    s.zoom = zoom;
    s.cx = cx;
    s.cy = cy;
    clear(s);
    drawRange(s, view(s, zoom, cx, cy), 0, s.sales.length);
    aimSvg(s, zoom, cx, cy);
  }

  function play() {
    if (!state) return;
    const s = state;
    const tracy = s.meta.cities.tracy;
    const midX = s.meta.mapW / 2;
    const midY = s.meta.mapH / 2;
    cancelAnimationFrame(raf);
    clear(s);
    aimSvg(s, 1, midX, midY);

    let drawn = 0;
    const start = performance.now();
    const v = view(s, 1, midX, midY);

    function frame(now) {
      // rAF hands back the timestamp of the frame it belongs to, which can sit
      // a hair before the call that scheduled it.
      const t = Math.max(0, now - start);
      if (t < ACCUMULATE_MS) {
        const target = Math.min(s.sales.length, Math.floor((t / ACCUMULATE_MS) * s.sales.length));
        drawRange(s, v, drawn, target);
        drawn = target;
        setReadout(s, drawn);
        raf = requestAnimationFrame(frame);
        return;
      }
      if (drawn < s.sales.length) {
        drawRange(s, v, drawn, s.sales.length);
        drawn = s.sales.length;
        setReadout(s, drawn);
      }
      const after = t - ACCUMULATE_MS;
      if (after < HOLD_MS) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const p = Math.min(1, (after - HOLD_MS) / ZOOM_MS);
      // Zoom geometrically, and pull the centre across on the curve of how much
      // of the county is still on screen. Moving the centre linearly instead
      // lets Tracy slide out of frame halfway through the push in.
      const z = Math.exp(Math.log(ZOOM) * easeInOut(p));
      const f = (1 - 1 / z) / (1 - 1 / ZOOM);
      redrawAll(s, z, midX + (tracy.x - midX) * f, midY + (tracy.y - midY) * f);
      if (p < 1) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    if (!state) return;
    cancelAnimationFrame(raf);
    const s = state;
    setReadout(s, s.sales.length);
    redrawAll(s, ZOOM, s.meta.cities.tracy.x, s.meta.cities.tracy.y);
  }

  window.CareerMapAnchor = { mount, play, finish };
})();
