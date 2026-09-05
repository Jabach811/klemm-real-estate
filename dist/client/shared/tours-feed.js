// Refreshes the tour cards on a city page from that city's YouTube playlist.
// The cards already in the HTML stay put if this fails, so the page never ends up empty.
const KEY = 'REPLACE_WITH_YOUR_YOUTUBE_API_KEY';

// Street names are capitalised, so only capitalised words are allowed between the
// house number and the street type. That keeps prose like "4 BR home on ... St" out.
const ADDRESS = /\b\d+\s+(?:[NSEW]\.?\s+)?(?:[A-Z0-9][A-Za-z0-9'.-]*\s+){1,3}(?:St|Ave|Dr|Ct|Ln|Way|Pl|Rd|Blvd|Cir|Ter|Park|Loop)\b\.?/;

const label = (title, city) => {
  const hit = title.match(ADDRESS);
  return hit ? `${hit[0].trim().replace(/\.$/, '')}, ${city}` : title.replace(/\s*\.$/, '');
};

const feed = document.querySelector('.tour-grid[data-playlist]');
if (feed && KEY) {
  const { playlist, city } = feed.dataset;
  const cards = [...feed.querySelectorAll('.tour')];
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${cards.length}&playlistId=${playlist}&key=${KEY}`;

  fetch(url)
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(data => {
      data.items.forEach((item, i) => {
        const card = cards[i];
        const id = item.snippet.resourceId.videoId;
        const name = label(item.snippet.title, city);
        const button = card.querySelector('.tour-frame');
        const img = card.querySelector('img');

        button.dataset.video = id;
        button.setAttribute('aria-label', `Play video tour of ${name}`);
        img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        img.alt = `Video tour of ${name}`;
        card.querySelector('.tour-fallback').href = `https://www.youtube.com/watch?v=${id}`;
        card.querySelector('.tour-copy span').textContent = name;
      });

      const more = document.querySelector('.tours-more a');
      const total = data.pageInfo?.totalResults;
      if (more && total) more.textContent = more.textContent.replace(/\d+/, total);
    })
    .catch(() => {});
}
