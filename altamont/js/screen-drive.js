// Screen two: the drive.
//
// Ten years of weekday mornings, one bar each, in the order they happened. The
// point of drawing all of them is that a single average hides the shape: most
// mornings are fine, and the bad ones are the ones you plan your life around.
//
// Bars stand on the free-flow line, not on zero. The first 68 minutes are the
// distance and never change, so drawing them is a solid block that says nothing.
// What is left is the part other people added to the morning.

(function () {
  const OVER = 120;    // the line above which a morning stops being a commute
  const FOOT = 34;     // room under the baseline for its label

  let canvas, ctx, tip, frame, flat, floorMin, ceiling, dpr;

  function sizeCanvas() {
    const rect = frame.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return rect;
  }

  function scale(h) {
    const base = h - FOOT;
    return (m) => base - ((m - floorMin) / (ceiling - floorMin)) * base;
  }

  function draw() {
    const rect = sizeCanvas();
    const { width: w, height: h } = rect;
    const n = flat.length;
    const bw = w / n;
    const base = h - FOOT;
    const yOf = scale(h);

    ctx.clearRect(0, 0, w, h);

    // Year separators, faint, so the strip reads as a decade and not a smear.
    ctx.strokeStyle = 'rgba(170, 162, 147, 0.45)';
    ctx.lineWidth = 1;
    const perYear = n / window.ALTAMONT_COMMUTE.years.length;
    for (let i = 1; i < window.ALTAMONT_COMMUTE.years.length; i++) {
      const x = Math.round(i * perYear * bw) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, base);
      ctx.stroke();
    }

    for (let i = 0; i < n; i++) {
      const m = flat[i].minutes;
      ctx.fillStyle = m >= OVER ? 'rgba(166, 74, 42, 0.85)' : 'rgba(95, 87, 75, 0.42)';
      const y = Math.min(yOf(m), base - 0.8);
      ctx.fillRect(i * bw, y, Math.max(bw - 0.35, 0.6), base - y);
    }

    // The baseline: the drive with nobody else on the road. Everything standing
    // on it is other people.
    ctx.strokeStyle = 'rgba(27, 23, 18, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, base + 0.5);
    ctx.lineTo(w, base + 0.5);
    ctx.stroke();

    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(27, 23, 18, 0.75)';
    ctx.fillText(`${floorMin} min with an empty road`, 0, base + 20);

    const yOver = yOf(OVER);
    ctx.strokeStyle = 'rgba(166, 74, 42, 0.5)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, yOver);
    ctx.lineTo(w, yOver);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(166, 74, 42, 0.95)';
    ctx.fillText('two hours', 0, yOver - 7);
  }

  function onMove(event) {
    const rect = frame.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const i = Math.floor((x / rect.width) * flat.length);
    if (i < 0 || i >= flat.length) return;
    const d = flat[i];
    const h = Math.floor(d.minutes / 60);
    const m = d.minutes % 60;
    tip.textContent = `${d.year} · ${h}h ${String(m).padStart(2, '0')}m`;
    tip.style.left = `${x}px`;
    tip.style.top = `${scale(rect.height)(d.minutes) - 8}px`;
    tip.classList.add('on');
  }

  function mount(container) {
    const data = window.ALTAMONT_COMMUTE;
    floorMin = data.stats.freeFlow;
    // Top of the plot sits just above the worst morning, so no empty sky.
    ceiling = Math.ceil((data.stats.worst + 6) / 10) * 10;
    flat = data.years.flatMap((y) => y.minutes.map((minutes) => ({ year: y.year, minutes })));

    frame = document.createElement('div');
    frame.className = 'strip-frame';
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    tip = document.createElement('div');
    tip.className = 'strip-tip';
    frame.appendChild(canvas);
    frame.appendChild(tip);
    container.appendChild(frame);

    const axis = document.createElement('div');
    axis.className = 'strip-axis';
    axis.innerHTML = `<span>${data.firstYear}</span><span>${data.lastYear}</span>`;
    container.appendChild(axis);

    frame.addEventListener('mousemove', onMove);
    frame.addEventListener('mouseleave', () => tip.classList.remove('on'));

    draw();

    let timer;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(draw, 140);
    });
  }

  // The tallies under the strip. Written out here rather than in the HTML so the
  // numbers can never drift away from the data they describe.
  function tallies(target) {
    const s = window.ALTAMONT_COMMUTE.stats;
    const oneIn = Math.round(s.n / s.overTwoHours);
    const items = [
      [`${s.median} min`, 'A normal morning'],
      [`${s.mean} min`, 'The average, which nobody drives'],
      [`${s.p90} min`, 'One morning in ten is at least this'],
      [`${Math.floor(s.worst / 60)}h ${s.worst % 60}m`, 'The worst one in ten years'],
      [`1 in ${oneIn}`, 'Mornings over two hours'],
    ];
    target.innerHTML = items
      .map(([n, k]) => `<li><span class="n">${n}</span><span class="k">${k}</span></li>`)
      .join('');
  }

  window.AltamontDrive = { mount, tallies };
})();
