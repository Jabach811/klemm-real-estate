// Screen three: the trade.
//
// One number goes in — what you pay for housing now — and both sides of the hill
// answer it. The arithmetic is deliberately visible, including the parts that
// make the Valley look worse, because a comparison that only flatters one side
// is not worth showing to anyone.

(function () {
  const money = (v) => '$' + Math.round(v).toLocaleString();
  const sqft = (v) => Math.round(v / 10) * 10;

  function beds(area) {
    if (area < 900) return 1;
    if (area < 1250) return 2;
    if (area < 1800) return 3;
    if (area < 2600) return 4;
    return 5;
  }

  // A monthly payment is linear in price once you fix the rate, the tax rate and
  // the fixed annual costs, so the inversion is one divide rather than a search.
  function priceFor(budget, v) {
    const r = v.rate / 12;
    const growth = Math.pow(1 + r, 360);
    const factor = (r * growth) / (growth - 1);
    const perDollar = (1 - v.downPct) * factor + v.taxRate / 12;
    const fixed = v.insurancePerYear / 12 + v.melloRoosPerYear / 12;
    return Math.max(0, (budget - fixed) / perDollar);
  }

  function row(dt, dd) {
    return `<div><dt>${dt}</dt><dd>${dd}</dd></div>`;
  }

  function render(budget, nodes) {
    const t = window.ALTAMONT_TRADE;

    const bayRaw = budget / t.bay.rentPerSqFt;
    const bayArea = Math.min(Math.max(bayRaw, t.bay.minSqFt), t.bay.maxSqFt);

    const price = priceFor(budget, t.valley);
    const valleyRaw = price / t.valley.pricePerSqFt;
    const valleyArea = Math.min(Math.max(valleyRaw, t.valley.minSqFt), t.valley.maxSqFt);

    nodes.value.textContent = money(budget) + ' a month';

    nodes.bay.innerHTML = [
      `<h3>${t.bay.label}</h3>`,
      `<p class="where">The side you are on</p>`,
      `<p class="headline">${sqft(bayArea).toLocaleString()}<small>sq ft, rented</small></p>`,
      '<dl>',
      row('Bedrooms', beds(bayArea)),
      row('Yard', 'Shared, if any'),
      row('Parking', t.bay.garage),
      row('Equity after ten years', 'None'),
      '</dl>',
    ].join('');

    nodes.valley.innerHTML = [
      `<h3>${t.valley.label}</h3>`,
      `<p class="where">The other side of the hill</p>`,
      `<p class="headline">${sqft(valleyArea).toLocaleString()}<small>sq ft, bought</small></p>`,
      '<dl>',
      row('Bedrooms', beds(valleyArea)),
      row('Yard', 'Yes'),
      row('Parking', t.valley.garage),
      row('Purchase price', money(price)),
      row('Down payment', money(price * t.valley.downPct)),
      '</dl>',
      valleyRaw < t.valley.minSqFt
        ? '<p class="caption">At this number the Valley is condos and townhomes, not houses.</p>'
        : '',
    ].join('');

    // The ledger. This is the part that makes the screen trustworthy: the Valley
    // wins on space and then immediately gives some of it back.
    const c = t.commute;
    const weeksPerMonth = 4.33;
    const milesPerMonth = c.milesOneWay * 2 * c.daysPerWeek * weeksPerMonth;
    const gas = (milesPerMonth / c.mpg) * c.gasPerGallon;
    const upkeep = milesPerMonth * c.upkeepPerMile;
    const tolls = c.tollPerCrossing * c.daysPerWeek * weeksPerMonth;
    const totalCost = gas + upkeep + tolls;

    const hoursPerWeek = (c.minutesOneWay * 2 * c.daysPerWeek) / 60;
    const daysPerYear = (hoursPerWeek * 52) / 24;

    nodes.ledger.innerHTML = [
      row('Driving', `${Math.round(milesPerMonth).toLocaleString()} miles a month`),
      row('Fuel', money(gas)),
      row('Tires, brakes, the car wearing out', money(upkeep)),
      row('Bridge tolls', money(tolls)),
      `<div class="total"><dt>What the drive costs</dt><dd>${money(totalCost)} a month</dd></div>`,
      `<div class="total"><dt>What the drive takes</dt><dd>${hoursPerWeek.toFixed(1)} hours a week</dd></div>`,
    ].join('');

    const gained = sqft(valleyArea) - sqft(bayArea);
    // The drive costs the same no matter what you pay for housing, so on a small
    // budget it swallows a third of the money and the extra room stops paying
    // for itself. That is the case where the right answer is not to move.
    const drivesTooDear = totalCost > budget * 0.3;

    nodes.verdict.innerHTML = gained > 0 && !drivesTooDear
      ? `You get <em>${gained.toLocaleString()} more square feet</em>, a yard and a garage.
         It costs <em>${money(totalCost)} a month</em> and <em>${Math.round(daysPerYear)} days a year</em>
         to go and get it.`
      : `At this number the drive costs <em>${money(totalCost)} a month</em> — most of
         what the extra room is worth — plus <em>${Math.round(daysPerYear)} days a year</em>.
         This is the honest answer: stay put.`;
  }

  function mount(container) {
    const t = window.ALTAMONT_TRADE;
    container.innerHTML = [
      '<div class="slider-row">',
      '  <label for="budget">What you pay for housing now</label>',
      '  <span class="slider-value"></span>',
      `  <input type="range" id="budget" min="${t.budget.min}" max="${t.budget.max}"`,
      `    step="${t.budget.step}" value="${t.budget.start}">`,
      '</div>',
      '<div class="compare">',
      '  <div class="side"></div>',
      '  <div class="side here"></div>',
      '</div>',
      '<div class="ledger">',
      '  <h3>And then the drive</h3>',
      `  <p>${t.commute.milesOneWay} miles each way, ${t.commute.daysPerWeek} days a week,`,
      '     at a normal morning\u2019s pace. Nobody puts this on a listing.</p>',
      '  <dl></dl>',
      '</div>',
      '<p class="verdict"></p>',
    ].join('\n');

    const nodes = {
      value: container.querySelector('.slider-value'),
      bay: container.querySelectorAll('.compare .side')[0],
      valley: container.querySelectorAll('.compare .side')[1],
      ledger: container.querySelector('.ledger dl'),
      verdict: container.querySelector('.verdict'),
    };

    const input = container.querySelector('#budget');
    input.addEventListener('input', () => render(Number(input.value), nodes));
    render(Number(input.value), nodes);
  }

  window.AltamontTrade = { mount };
})();
