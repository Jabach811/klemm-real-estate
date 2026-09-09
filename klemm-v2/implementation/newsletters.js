(() => {
  const select = document.getElementById('archive-year');
  const control = document.querySelector('.archive-year-control');
  const status = document.querySelector('.archive-status');
  const years = [...document.querySelectorAll('.archive-year')];
  if (!select || !control || !status || !years.length) return;
  const render = () => {
    const year = select.value;
    let count = 0;
    years.forEach(group => {
      group.hidden = year !== 'all' && group.dataset.year !== year;
      group.open = year !== 'all' && group.dataset.year === year;
      if (!group.hidden) count += group.querySelectorAll('.archive-issue').length;
    });
    status.textContent = year === 'all' ? `${count} issues. Open a year to browse its months.` : `${count} issues in ${year}, newest first.`;
  };
  select.addEventListener('change', render);
  render();
  control.hidden = false;
  status.hidden = false;
})();
