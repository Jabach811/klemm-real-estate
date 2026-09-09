(() => {
  const filter = document.querySelector('.review-filter');
  if (!filter) return;
  const cards = [...document.querySelectorAll('.review-card')];
  const buttons = [...filter.querySelectorAll('[data-review-filter]')];
  const count = document.getElementById('review-count');
  buttons.forEach(button => button.addEventListener('click', () => {
    const city = button.dataset.reviewFilter;
    let visible = 0;
    cards.forEach(card => { card.hidden = city !== 'All' && card.dataset.city !== city; if (!card.hidden) visible++; });
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    count.textContent = city === 'All' ? `Showing all ${visible} excerpts.` : `Showing ${visible} ${city} excerpt${visible === 1 ? '' : 's'}.`;
  }));
  filter.hidden = false;
})();
