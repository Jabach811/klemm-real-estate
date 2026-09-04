document.querySelectorAll('.tour-frame[data-video]').forEach(frame => {
  const play = () => {
    if (frame.classList.contains('playing')) return;
    const id = frame.dataset.video;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1`;
    iframe.title = frame.querySelector('img').alt;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    frame.classList.add('playing');
    frame.appendChild(iframe);
  };
  frame.addEventListener('click', play);
  frame.setAttribute('role', 'button');
  frame.setAttribute('tabindex', '0');
  frame.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
});
