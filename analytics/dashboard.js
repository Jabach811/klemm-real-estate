// Reads window.KLEMM_MODEL and draws the board. No libraries: everything is
// hand-built SVG so the page opens straight off the disk with nothing to load.

(function () {
  const M = window.KLEMM_MODEL;
  const F = Object.fromEntries(M.fields.sales.map((n, i) => [n, i]));
  const A = Object.fromEntries(M.fields.activity.map((n, i) => [n, i]));

  const MIN_YEAR = 1988;
  const MAX_YEAR = 2026;

  // Seven communities that have to stay apart at a glance without turning the
  // page into a paint chart.
  const COMMUNITY_COLOR = ['#8c7b62', '#a64a2a', '#5f7d8c', '#9c8a3f', '#7a5c73', '#4f6b52', '#c2ad8c'];
  // Tied to the community, not to its position in the current selection, so a
  // colour means the same thing whichever agent you are looking at.
  const colorFor = (c) => COMMUNITY_COLOR[M.communities.indexOf(c) % COMMUNITY_COLOR.length];

  const state = { agent: 0, from: MIN_YEAR, to: MAX_YEAR };

  // ---------------------------------------------------------------- helpers

  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, text) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  const svg = (vb) => el('svg', { viewBox: vb, preserveAspectRatio: 'xMidYMid meet' });

  function median(values) {
    if (!values.length) return 0;
    const v = values.slice().sort((a, b) => a - b);
    const h = v.length / 2;
    return v.length % 2 ? v[Math.floor(h)] : (v[h - 1] + v[h]) / 2;
  }

  const int = (n) => Math.round(n).toLocaleString('en-US');

  function money(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return '$' + int(n);
  }

  // A band holding three of four thousand sales is not zero, and printing 0%
  // next to a shaded cell just looks like a bug.
  function pct(part, whole) {
    if (!part) return '—';
    const v = (part / whole) * 100;
    return v < 0.5 ? '<1%' : Math.round(v) + '%';
  }

  function niceMax(v) {
    if (v <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    return Math.ceil(v / (mag / 2)) * (mag / 2);
  }

  function rows() {
    return M.sales.filter((r) =>
      (state.agent === 0 || r[F.agent] === state.agent) &&
      r[F.year] >= state.from && r[F.year] <= state.to);
  }

  function activityRows() {
    return M.activity.filter((r) =>
      (state.agent === 0 || r[A.agent] === state.agent) &&
      r[A.year] >= state.from && r[A.year] <= state.to);
  }

  const yearsInRange = () => {
    const out = [];
    for (let y = state.from; y <= state.to; y++) out.push(y);
    return out;
  };

  // Always label the ends, then every nth year in between, skipping any that
  // would collide with an end label.
  function yearTicks(years, every) {
    const first = years[0];
    const last = years[years.length - 1];
    return years.filter((y) => y === first || y === last
      || (y % every === 0 && y - first >= 3 && last - y >= 3));
  }

  function groupCount(data, keyIndex) {
    const map = new Map();
    for (const r of data) map.set(r[keyIndex], (map.get(r[keyIndex]) || 0) + 1);
    return map;
  }

  function mount(id, node) {
    const host = document.getElementById(id);
    host.textContent = '';
    host.appendChild(node);
  }

  function empty(message) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = message;
    return p;
  }

  // ------------------------------------------------------------------- KPIs

  function drawKpis(data) {
    const cards = [
      ['Sales closed', int(data.length)],
      ['Sales volume', money(data.reduce((t, r) => t + r[F.salePrice], 0))],
      ['Commission earned', money(data.reduce((t, r) => t + r[F.agentNet], 0))],
      ['Median sale price', money(median(data.map((r) => r[F.salePrice])))],
      ['Median days on market', int(median(data.map((r) => r[F.daysOnMarket])))],
    ];
    const host = document.getElementById('kpis');
    host.textContent = '';
    for (const [label, value] of cards) {
      const div = document.createElement('div');
      div.className = 'kpi';
      div.innerHTML = '<div class="kpi-value"></div><div class="kpi-label"></div>';
      div.querySelector('.kpi-value').textContent = value;
      div.querySelector('.kpi-label').textContent = label;
      host.appendChild(div);
    }
  }

  // ------------------------------------------- volume and price, by year

  function drawByYear(data) {
    const years = yearsInRange();
    if (!data.length) return mount('chart-year', empty('No sales in this selection.'));

    const counts = new Map();
    const prices = new Map();
    for (const r of data) {
      counts.set(r[F.year], (counts.get(r[F.year]) || 0) + 1);
      if (!prices.has(r[F.year])) prices.set(r[F.year], []);
      prices.get(r[F.year]).push(r[F.salePrice]);
    }

    const W = 1000, H = 300, L = 46, R = 62, T = 14, B = 32;
    const pw = W - L - R, ph = H - T - B;
    const maxCount = niceMax(Math.max(...counts.values()));
    const maxPrice = niceMax(Math.max(...[...prices.values()].map(median)));
    const step = pw / years.length;
    // Capped, or a one-year selection turns the panel into a black rectangle.
    const barW = Math.max(1.5, Math.min(step * 0.66, 34));

    const s = svg(`0 0 ${W} ${H}`);
    const g = el('g', { class: 'axis' });

    for (let i = 0; i <= 2; i++) {
      const y = T + ph - (ph * i) / 2;
      g.appendChild(el('line', { class: 'grid-line', x1: L, x2: L + pw, y1: y, y2: y }));
      g.appendChild(el('text', { x: L - 9, y: y + 4, 'text-anchor': 'end' }, int((maxCount * i) / 2)));
      g.appendChild(el('text', { x: L + pw + 9, y: y + 4, fill: '#a64a2a' }, money((maxPrice * i) / 2)));
    }
    s.appendChild(g);

    years.forEach((year, i) => {
      const n = counts.get(year) || 0;
      const h = (n / maxCount) * ph;
      s.appendChild(el('rect', {
        class: 'bar', x: L + i * step + (step - barW) / 2, y: T + ph - h, width: barW, height: h,
      }));
    });

    let d = '';
    let last = null;
    years.forEach((year, i) => {
      if (!prices.has(year)) return;
      const x = L + i * step + step / 2;
      const y = T + ph - (median(prices.get(year)) / maxPrice) * ph;
      d += (d ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      last = [x, y];
    });
    if (d.indexOf('L') === -1) {
      s.appendChild(el('circle', { cx: last[0], cy: last[1], r: 4, fill: '#a64a2a' }));
    } else {
      s.appendChild(el('path', { class: 'series-line', d }));
    }

    const labels = el('g', { class: 'axis' });
    for (const year of yearTicks(years, 5)) {
      const x = L + years.indexOf(year) * step + step / 2;
      labels.appendChild(el('text', { x, y: H - 10, 'text-anchor': 'middle' }, year));
    }
    s.appendChild(labels);

    mount('chart-year', s);
  }

  // ------------------------------------------ share of business, by community

  function drawCommunities(data) {
    const years = yearsInRange().filter((y) => data.some((r) => r[F.year] === y));
    if (!years.length) return mount('chart-community', empty('No sales in this selection.'));

    const present = M.communities.filter((c) => data.some((r) => r[F.community] === c.key));
    const share = new Map();
    for (const y of years) {
      const inYear = data.filter((r) => r[F.year] === y);
      share.set(y, present.map((c) => inYear.filter((r) => r[F.community] === c.key).length / inYear.length));
    }

    const W = 520, H = 250, L = 34, R = 6, T = 8, B = 26;
    const pw = W - L - R, ph = H - T - B;
    const xAt = (i) => (years.length === 1 ? [L, L + pw][i > 0 ? 1 : 0] : L + (i / (years.length - 1)) * pw);

    const s = svg(`0 0 ${W} ${H}`);
    const axis = el('g', { class: 'axis' });
    for (const pct of [0, 0.5, 1]) {
      const y = T + ph - pct * ph;
      axis.appendChild(el('line', { class: 'grid-line', x1: L, x2: L + pw, y1: y, y2: y }));
      axis.appendChild(el('text', { x: L - 8, y: y + 4, 'text-anchor': 'end' }, Math.round(pct * 100) + '%'));
    }
    s.appendChild(axis);

    // Stack from the bottom up, one filled band per community.
    const base = years.map(() => 0);
    present.forEach((c, ci) => {
      const top = years.map((y, yi) => base[yi] + share.get(y)[ci]);
      let d = '';
      // Two points per year when only one year survives the filter, so the
      // band still has width instead of collapsing to a hairline.
      const cols = years.length === 1 ? [0, 1] : years.map((_, i) => i);
      cols.forEach((i, n) => {
        const yi = years.length === 1 ? 0 : i;
        d += (n ? 'L' : 'M') + xAt(i) + ' ' + (T + ph - top[yi] * ph);
      });
      cols.slice().reverse().forEach((i) => {
        const yi = years.length === 1 ? 0 : i;
        d += 'L' + xAt(i) + ' ' + (T + ph - base[yi] * ph);
      });
      s.appendChild(el('path', { d: d + 'Z', fill: colorFor(c), opacity: 0.92 }));
      years.forEach((_, yi) => { base[yi] = top[yi]; });
    });

    const labels = el('g', { class: 'axis' });
    for (const year of yearTicks(years, 10)) {
      labels.appendChild(el('text', {
        x: xAt(years.indexOf(year)), y: H - 8,
        'text-anchor': year === years[0] ? 'start' : year === years[years.length - 1] ? 'end' : 'middle',
      }, year));
    }
    s.appendChild(labels);

    mount('chart-community', s);

    const legend = document.getElementById('legend-community');
    legend.textContent = '';
    present.forEach((c) => {
      const span = document.createElement('span');
      const chip = document.createElement('i');
      chip.style.background = colorFor(c);
      span.appendChild(chip);
      span.appendChild(document.createTextNode(c.label));
      legend.appendChild(span);
    });
  }

  // ------------------------------------------------------- horizontal bars

  function horizontalBars(items, opts) {
    const rowH = opts.rowH || 26;
    const W = 520, L = opts.labelWidth || 160, R = 54, T = 4;
    const H = T + items.length * rowH + 4;
    const pw = W - L - R;
    const max = Math.max(...items.map((i) => i.value)) || 1;

    const s = svg(`0 0 ${W} ${H}`);
    items.forEach((item, i) => {
      const y = T + i * rowH;
      const w = (item.value / max) * pw;
      s.appendChild(el('text', { class: 'cat-label', x: L - 12, y: y + rowH / 2 + 4, 'text-anchor': 'end' }, item.label));
      s.appendChild(el('rect', {
        class: item.soft ? 'bar-soft' : 'bar', x: L, y: y + 4, width: Math.max(w, 1), height: rowH - 11,
      }));
      s.appendChild(el('text', { class: 'value-label', x: L + w + 8, y: y + rowH / 2 + 4 }, item.display));
    });
    return s;
  }

  function drawLeadSources(data) {
    if (!data.length) return mount('chart-lead', empty('No sales in this selection.'));
    const counts = groupCount(data, F.leadSource);
    const items = M.leadSources
      .map((l) => ({ label: l.label, value: counts.get(l.key) || 0 }))
      .filter((i) => i.value)
      .sort((a, b) => b.value - a.value)
      .map((i) => ({ ...i, display: pct(i.value, data.length) }));
    mount('chart-lead', horizontalBars(items, { labelWidth: 186 }));
  }

  function drawDaysOnMarket(data) {
    if (!data.length) return mount('chart-dom', empty('No sales in this selection.'));
    const items = M.marketPhases
      .map((p) => {
        const inPhase = data.filter((r) => r[F.year] >= p.start && r[F.year] <= p.end);
        return { label: p.label, value: median(inPhase.map((r) => r[F.daysOnMarket])), n: inPhase.length };
      })
      .filter((i) => i.n)
      .map((i) => ({ ...i, display: int(i.value) + ' days' }));
    mount('chart-dom', horizontalBars(items, { labelWidth: 148, rowH: 30 }));
  }

  function drawFunnel() {
    const data = activityRows();
    const sum = (i) => data.reduce((t, r) => t + r[i], 0);
    const consults = sum(A.consults);
    const offers = sum(A.offersWritten);
    const closed = sum(A.closed);
    if (!consults) return mount('chart-funnel', empty('No activity in this selection.'));

    const items = [
      { label: 'Buyer consults', value: consults, display: int(consults), soft: true },
      { label: 'Offers written', value: offers, display: int(offers), soft: true },
      { label: 'Sales closed', value: closed, display: int(closed) },
    ];
    mount('chart-funnel', horizontalBars(items, { labelWidth: 148, rowH: 38 }));

    document.getElementById('funnel-note').textContent =
      `${Math.round((offers / consults) * 100)} of every 100 consults turned into a written offer, and `
      + `${Math.round((closed / offers) * 100)} of every 100 offers closed.`;
  }

  // ----------------------------------------------------------- price matrix

  function drawMatrix(data) {
    const host = document.getElementById('matrix');
    host.textContent = '';
    if (!data.length) return host.appendChild(empty('No sales in this selection.'));

    const bands = M.priceBands;
    const communities = M.communities.filter((c) => data.some((r) => r[F.community] === c.key));

    const table = document.createElement('table');
    const head = table.createTHead().insertRow();
    head.insertCell().outerHTML = '<th>Community</th>';
    for (const b of bands) head.insertCell().outerHTML = `<th>${b.label}</th>`;
    head.insertCell().outerHTML = '<th>Median price</th>';
    head.insertCell().outerHTML = '<th>Sales</th>';

    const body = table.createTBody();
    for (const c of communities) {
      const inCommunity = data.filter((r) => r[F.community] === c.key);
      const tr = body.insertRow();
      tr.insertCell().textContent = c.label;
      for (const b of bands) {
        const n = inCommunity.filter((r) => r[F.priceBand] === b.key).length;
        const cell = tr.insertCell();
        cell.textContent = pct(n, inCommunity.length);
        if (n) cell.style.background = `rgba(166, 74, 42, ${(0.06 + (n / inCommunity.length) * 0.4).toFixed(3)})`;
      }
      tr.insertCell().textContent = money(median(inCommunity.map((r) => r[F.salePrice])));
      tr.insertCell().textContent = int(inCommunity.length);
    }

    const foot = table.createTFoot().insertRow();
    foot.insertCell().textContent = 'All communities';
    for (const b of bands) {
      foot.insertCell().textContent =
        pct(data.filter((r) => r[F.priceBand] === b.key).length, data.length);
    }
    foot.insertCell().textContent = money(median(data.map((r) => r[F.salePrice])));
    foot.insertCell().textContent = int(data.length);

    host.appendChild(table);
  }

  // ------------------------------------------------------------- interaction

  function render() {
    const data = rows();
    drawKpis(data);
    drawByYear(data);
    drawCommunities(data);
    drawLeadSources(data);
    drawFunnel();
    drawDaysOnMarket(data);
    drawMatrix(data);

    const agent = M.agents.find((a) => a.key === state.agent);
    document.getElementById('scope').textContent = agent
      ? `${agent.label}, working mainly in ${agent.market}.`
      : 'All four archetypes together.';
  }

  function buildControls() {
    const pills = document.getElementById('agent-pills');
    const options = [{ key: 0, label: 'Everyone' }].concat(M.agents);
    for (const o of options) {
      const b = document.createElement('button');
      b.className = 'pill';
      b.type = 'button';
      b.textContent = o.label;
      b.setAttribute('aria-pressed', String(state.agent === o.key));
      b.addEventListener('click', () => {
        state.agent = o.key;
        for (const other of pills.children) other.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-pressed', 'true');
        render();
      });
      pills.appendChild(b);
    }

    const from = document.getElementById('year-from');
    const to = document.getElementById('year-to');
    const readout = document.getElementById('year-readout');
    const sync = () => {
      readout.textContent = state.from === state.to ? state.from : `${state.from} – ${state.to}`;
      render();
    };
    from.addEventListener('input', () => {
      state.from = Number(from.value);
      if (state.from > state.to) { state.to = state.from; to.value = state.to; }
      sync();
    });
    to.addEventListener('input', () => {
      state.to = Number(to.value);
      if (state.to < state.from) { state.from = state.to; from.value = state.from; }
      sync();
    });
    readout.textContent = `${state.from} – ${state.to}`;
  }

  buildControls();
  render();
})();
