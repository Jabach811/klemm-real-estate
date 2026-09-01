(() => {
  const stage = document.querySelector('.stage');
  const crossing = document.querySelector('.crossing');
  const label = crossing.querySelector('.crossing-label');

  function setCrossed(crossed) {
    stage.classList.toggle('is-crossed', crossed);
    crossing.setAttribute('aria-pressed', String(crossed));
    label.textContent = crossed ? 'Return to the dark' : 'Follow the line';
  }

  crossing.addEventListener('click', () => {
    setCrossed(!stage.classList.contains('is-crossed'));
  });

  stage.addEventListener('pointermove', (event) => {
    const x = Math.round((event.clientX / window.innerWidth) * 100);
    const y = Math.round((event.clientY / window.innerHeight) * 100);
    stage.style.setProperty('--x', `${x}%`);
    stage.style.setProperty('--y', `${y}%`);
  });
})();
