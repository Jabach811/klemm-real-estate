(() => {
  const study = window.JACK_40_STUDY;
  if (!study) return;

  const cities = ['Tracy', 'Manteca', 'Lathrop', 'Mountain House', 'River Islands'];
  const state = { from: 1986, to: 2025, selectedCities: new Set(cities) };
  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: value >= 1e6 ? 'compact' : 'standard' }).format(value);
  const fullMoney = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  const median = (numbers) => { const sorted = [...numbers].sort((a, b) => a - b); return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0; };
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);

  function filteredSales() { return study.sales.filter((sale) => sale.year >= state.from && sale.year <= state.to && state.selectedCities.has(sale.city)); }
  function filteredYears() { return study.years.filter((row) => row.year >= state.from && row.year <= state.to); }
  function renderCityFilters() {
    $('city-filters').innerHTML = cities.map((city) => `<button type="button" data-city="${city}" aria-pressed="${state.selectedCities.has(city)}">${city}</button>`).join('');
    $('city-filters').querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
      const city = button.dataset.city;
      if (state.selectedCities.has(city) && state.selectedCities.size > 1) state.selectedCities.delete(city); else state.selectedCities.add(city);
      render();
    }));
  }
  function renderMetrics(sales, years) {
    const volume = sales.reduce((sum, sale) => sum + sale.price, 0);
    const start = years[0]?.hpi ?? 0; const end = years.at(-1)?.hpi ?? 0;
    $('metric-records').textContent = sales.length.toLocaleString();
    $('metric-volume').textContent = money(volume);
    $('metric-median').textContent = fullMoney(median(sales.map((sale) => sale.price)));
    $('metric-hpi').textContent = start ? `${((end / start - 1) * 100).toFixed(0)}%` : '—';
  }
  function renderTrend(years) {
    const width = 1100, height = 430, left = 8, right = 12, top = 25, bottom = 42;
    const min = Math.min(...study.years.map((row) => row.hpi)); const max = Math.max(...study.years.map((row) => row.hpi));
    const x = (year) => left + ((year - 1986) / 39) * (width - left - right);
    const y = (value) => top + (1 - (value - min) / (max - min)) * (height - top - bottom);
    const whole = study.years.map((row) => `${x(row.year).toFixed(1)},${y(row.hpi).toFixed(1)}`).join(' ');
    const selected = years.map((row) => `${x(row.year).toFixed(1)},${y(row.hpi).toFixed(1)}`).join(' ');
    const gridValues = [100, 200, 300].filter((value) => value > min && value < max);
    const grid = gridValues.map((value) => `<line x1="${left}" x2="${width-right}" y1="${y(value)}" y2="${y(value)}" stroke="rgba(23,22,22,.15)"/><text x="${left}" y="${y(value)-7}" class="axis-text">${value}</text>`).join('');
    const annotations = [{year:2006,label:'2006 PEAK'},{year:2011,label:'2011 FLOOR'},{year:2024,label:'2024 HIGH'}].map(({year,label}) => { const row = study.years.find((entry) => entry.year === year); return `<circle cx="${x(year)}" cy="${y(row.hpi)}" r="4" fill="#fc5e32"/><text x="${x(year)}" y="${y(row.hpi)-13}" text-anchor="middle" class="anno-text">${label}</text>`; }).join('');
    $('trend').innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fc5e32" stop-opacity=".22"/><stop offset="1" stop-color="#fc5e32" stop-opacity="0"/></linearGradient></defs>${grid}<path d="M ${whole} L ${x(2025)} ${height-bottom} L ${x(1986)} ${height-bottom} Z" fill="url(#fill)"/><polyline points="${whole}" fill="none" stroke="#908b84" stroke-width="1.5"/><polyline points="${selected}" fill="none" stroke="#fc5e32" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>${annotations}<text x="${left}" y="${height-8}" class="axis-text">1986</text><text x="${width-right}" y="${height-8}" text-anchor="end" class="axis-text">2025</text></svg>`;
    $('trend-caption').textContent = `${state.from}—${state.to} selected`;
  }
  function renderVolume(sales, years) {
    const counts = new Map(years.map((row) => [row.year, 0])); sales.forEach((sale) => counts.set(sale.year, (counts.get(sale.year) || 0) + 1));
    const width = 700, height = 270, pad = 18, bottom = 28, max = Math.max(1, ...counts.values()); const bar = (width - pad * 2) / years.length;
    const rects = years.map((row, index) => { const count = counts.get(row.year); const h = (count / max) * (height - bottom - 12); return `<rect x="${pad + index * bar + 1}" y="${height-bottom-h}" width="${Math.max(2, bar-2)}" height="${h}" fill="${row.year === state.to ? '#fc5e32' : '#171616'}"><title>${row.year}: ${count} modeled records</title></rect>`; }).join('');
    $('volume').innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><line x1="${pad}" x2="${width-pad}" y1="${height-bottom}" y2="${height-bottom}" stroke="#171616"/>${rects}<text x="${pad}" y="${height-8}" class="axis-text">${state.from}</text><text x="${width-pad}" y="${height-8}" text-anchor="end" class="axis-text">${state.to}</text><text x="${pad}" y="12" class="axis-text">0—${max} modeled records / year</text></svg>`;
  }
  function renderCityMix(sales) {
    const totals = cities.map((city) => ({ city, count: sales.filter((sale) => sale.city === city).length })); const max = Math.max(1, ...totals.map((row) => row.count));
    $('city-mix').innerHTML = totals.map(({city,count}) => `<div class="city-row"><div class="city-row-head"><span>${city}</span><span>${count.toLocaleString()} / ${sales.length ? Math.round(count / sales.length * 100) : 0}%</span></div><div class="city-row-bar"><div class="city-row-fill" style="width:${count / max * 100}%"></div></div></div>`).join('');
  }
  function renderLedger(sales) {
    const sample = [...sales].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 7);
    $('ledger-rows').innerHTML = sample.length ? sample.map((sale) => `<div class="ledger-row"><div class="ledger-place"><strong>${esc(sale.city)}, ${esc(sale.neighborhood)}</strong><small>${sale.date} · ${sale.recordClass.toUpperCase()}</small></div><span>${sale.propertyClass} · ${sale.beds} bd · ${sale.baths} ba · ${sale.sqft.toLocaleString()} sq ft</span><span class="ledger-price">${fullMoney(sale.price)}</span></div>`).join('') : '<div class="ledger-row"><div class="ledger-place"><strong>No modeled records</strong><small>Adjust the year window or local filters.</small></div></div>';
  }
  function render() {
    const sales = filteredSales(), years = filteredYears();
    $('range-label').textContent = `${state.from} — ${state.to}`;
    renderCityFilters(); renderMetrics(sales, years); renderTrend(years); renderVolume(sales, years); renderCityMix(sales); renderLedger(sales);
    $('filter-status').textContent = `Showing ${sales.length.toLocaleString()} modeled records from ${state.from} through ${state.to} across ${state.selectedCities.size} communities.`;
  }
  function syncRange(changed) { state.from = Number($('from-year').value); state.to = Number($('to-year').value); if (state.from > state.to) { if (changed === 'from') state.to = state.from; else state.from = state.to; $('from-year').value = state.from; $('to-year').value = state.to; } render(); }
  $('from-year').addEventListener('input', () => syncRange('from')); $('to-year').addEventListener('input', () => syncRange('to'));
  render();
})();
