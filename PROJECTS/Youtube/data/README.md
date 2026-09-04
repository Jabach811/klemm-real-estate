# Channel data

## Files
- inventory.csv / inventory.json: one row per video. Columns: id, title, address (parsed from the title), city (guessed from the title), views, age (as YouTube shows it, e.g. "5 years ago"), ageYears (that age as a number), titleStyle, url.
- summary.json: totals, views distribution, top 20, and any titles the city guesser couldn't place.
- raw/: the raw dumps from the channel's Videos tab, dated. Keep them; they're the audit trail.
- build-inventory.mjs: rebuilds the three files above from the raw dumps.
- scrape-channel.js: the snippet that pulls the video list from the channel page.

## Limits of this data
- Ages are YouTube's rounded labels ("5 years ago"), not exact dates. Good enough for sorting, not for a timeline.
- View counts are rounded the way YouTube shows them (1.2K = 1200).
- Video length is not in this dump. Recent videos are 1:39; the 2021 ones are 4 to 5 minutes. If exact lengths are needed, they have to be pulled per video.
- City is guessed from the title. Seven titles had no city and are listed in summary.json.

## How to refresh it
1. In Joel's Chrome (the Claude in Chrome tools), open https://www.youtube.com/@jackklemm3607/videos
2. Run scrape-channel.js on that page with the JavaScript tool. It walks YouTube's own "load more" requests until it has every video and stores the list in the page.
3. Get the list out as text. The tool's output window is small, so put the list into the page body and read it with the page-text tool; if it's over 50,000 characters, do it in two halves (the commented lines at the bottom of scrape-channel.js show how).
4. Save the text as raw/channel-dump-<date>-part1.txt (and part2 if needed).
5. Run: node build-inventory.mjs raw/channel-dump-<date>-part1.txt raw/channel-dump-<date>-part2.txt
