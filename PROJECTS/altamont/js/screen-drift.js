// Screen one: the drift.
//
// Every household that crossed the Altamont, drawn in the order it happened.
// Two canvases sit over the basemap — one keeps the accumulated ink, one carries
// whatever is in the air this frame.

(function () {
  const YEAR_MS = 780;
  const FLIGHT_MS = 900;
  const BOW = 0.115; // how far the arc lifts off the straight line, as a share of its length

  let frame, inkCtx, liveCtx, scale, dpr;
  let readoutYear, readoutCount;
  let moves, byYear, raf = null;

  function sizeCanvas(canvas) {
    const rect = frame.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = rect.width / window.ALTAMONT_GEO.mapW;
    return ctx;
  }

  function control(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    return [
      (x0 + x1) / 2 + (dy / len) * len * BOW,
      (y0 + y1) / 2 - (dx / len) * len * BOW,
    ];
  }

  function at(t, a, c, b) {
    const u = 1 - t;
    return u * u * a + 2 * u * t * c + t * t * b;
  }

  function prepare() {
    const rows = window.ALTAMONT_MOVES.rows;
    moves = rows.map((r) => {
      const [year, origin, dest, x0, y0, x1, y1] = r;
      const [cx, cy] = control(x0, y0, x1, y1);
      return { year, origin, dest, x0, y0, x1, y1, cx, cy };
    });
    byYear = new Map();
    for (const m of moves) {
      if (!byYear.has(m.year)) byYear.set(m.year, []);
      byYear.get(m.year).push(m);
    }
    // Departures are spread across their year so the flow reads as a stream
    // rather than twelve volleys.
    for (const list of byYear.values()) {
      list.forEach((m, i) => { m.offset = (i / list.length) * YEAR_MS; });
    }
  }

  function drawArc(ctx, m, alpha) {
    ctx.strokeStyle = `rgba(166, 74, 42, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(m.x0 * scale, m.y0 * scale);
    ctx.quadraticCurveTo(m.cx * scale, m.cy * scale, m.x1 * scale, m.y1 * scale);
    ctx.stroke();
  }

  function land(ctx, m) {
    drawArc(ctx, m, 0.055);
    ctx.fillStyle = 'rgba(27, 23, 18, 0.5)';
    ctx.beginPath();
    ctx.arc(m.x1 * scale, m.y1 * scale, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  function setReadout(year, count) {
    readoutYear.textContent = year;
    readoutCount.textContent = `${count.toLocaleString()} households, so far`;
  }

  function mount(container) {
    const geo = window.ALTAMONT_GEO;
    prepare();

    frame = document.createElement('div');
    frame.className = 'map-frame';
    frame.style.aspectRatio = `${geo.mapW} / ${geo.mapH}`;
    container.appendChild(frame);

    // On a narrow screen the map is wider than the phone and slides sideways.
    // Open it on the landing side — that is the half the screen is about.
    if (container.scrollWidth > container.clientWidth) {
      container.scrollLeft = (container.scrollWidth - container.clientWidth) * 0.8;
    }

    frame.appendChild(window.AltamontMap.createTerrain());

    const ink = document.createElement('canvas');
    const live = document.createElement('canvas');
    frame.appendChild(ink);
    frame.appendChild(live);
    frame.appendChild(window.AltamontMap.createLabels());

    const readout = document.createElement('div');
    readout.className = 'readout';
    readout.innerHTML = '<div class="readout-year"></div><div class="readout-count"></div>';
    frame.appendChild(readout);
    readoutYear = readout.querySelector('.readout-year');
    readoutCount = readout.querySelector('.readout-count');

    const controls = document.createElement('div');
    controls.className = 'map-controls';
    const button = document.createElement('button');
    button.className = 'replay';
    button.textContent = 'Replay';
    button.addEventListener('click', play);
    controls.appendChild(button);
    frame.appendChild(controls);

    inkCtx = sizeCanvas(ink);
    liveCtx = sizeCanvas(live);

    // Re-rendering on resize would mean replaying, so redraw the finished state
    // instead and leave the animation to the replay button.
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        inkCtx = sizeCanvas(ink);
        liveCtx = sizeCanvas(live);
        if (raf === null) finish();
      }, 160);
    });

    setReadout(window.ALTAMONT_MOVES.firstYear, 0);
  }

  function clear() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    const rect = frame.getBoundingClientRect();
    inkCtx.clearRect(0, 0, rect.width, rect.height);
    liveCtx.clearRect(0, 0, rect.width, rect.height);
  }

  function finish() {
    clear();
    const data = window.ALTAMONT_MOVES;
    for (const m of moves) land(inkCtx, m);
    setReadout(data.lastYear, data.total);
  }

  function play() {
    clear();
    const data = window.ALTAMONT_MOVES;
    const years = [];
    for (let y = data.firstYear; y <= data.lastYear; y++) years.push(y);

    const pending = moves.map((m) => ({
      m,
      start: (m.year - data.firstYear) * YEAR_MS + m.offset,
      done: false,
    }));
    const total = (years.length - 1) * YEAR_MS + YEAR_MS + FLIGHT_MS;

    let landed = 0;
    const t0 = performance.now();

    function step(now) {
      const elapsed = now - t0;
      const rect = frame.getBoundingClientRect();
      liveCtx.clearRect(0, 0, rect.width, rect.height);

      for (const p of pending) {
        if (p.done) continue;
        const t = (elapsed - p.start) / FLIGHT_MS;
        if (t < 0) continue;
        if (t >= 1) {
          land(inkCtx, p.m);
          p.done = true;
          landed++;
          continue;
        }
        // Ease out so arrivals settle rather than snap.
        const e = 1 - Math.pow(1 - t, 2.2);
        const x = at(e, p.m.x0, p.m.cx, p.m.x1) * scale;
        const y = at(e, p.m.y0, p.m.cy, p.m.y1) * scale;
        drawArc(liveCtx, p.m, 0.11 * (1 - t));
        liveCtx.fillStyle = `rgba(166, 74, 42, ${0.55 + 0.45 * (1 - t)})`;
        liveCtx.beginPath();
        liveCtx.arc(x, y, 2.4, 0, Math.PI * 2);
        liveCtx.fill();
      }

      const yearIndex = Math.min(years.length - 1, Math.floor(elapsed / YEAR_MS));
      setReadout(years[yearIndex], landed);

      if (elapsed < total) {
        raf = requestAnimationFrame(step);
      } else {
        raf = null;
        finish();
      }
    }

    raf = requestAnimationFrame(step);
  }

  window.AltamontDrift = { mount, play, finish };
})();
