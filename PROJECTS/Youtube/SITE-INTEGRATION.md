# Wiring the videos into the website

Website project: C:\Dev\Joel's Workspaces\Personal\Work\Websites\Klemm
Read its AGENTS.md and DESIGN.md before editing anything there.

## The principle
The site is the home base. YouTube is where the video files live. Every video points at the site, and the site plays the video without sending people away. Don't turn the site into a YouTube billboard: no "subscribe" pitches, no view counts, no red buttons. A video tour on a listing page should look like part of the listing.

## The matching key
Every video title contains the street address. data/inventory.csv has the address parsed out per video. That's how a listing on the site finds its video: same street number and street name. No database needed. When a listing goes live on the site, look up its address in the CSV (or search the channel) and paste the video ID into the listing.

Embed a single video with the standard YouTube embed (an iframe pointed at youtube-nocookie.com/embed/<video id>). The "nocookie" version doesn't set tracking cookies until someone presses play. Add rel=0 so the player doesn't fill the end of the video with other channels' videos.

## Where each piece goes

1. Listing pages
   Each listing gets its tour embedded below the photo gallery, headed "Video tour." One video. If there is no video for that listing, the section doesn't exist. Don't show a placeholder.

2. City pages (cities/<city>/index.html)
   A strip called "Recent tours in Mountain House" (or whichever city) with three to four videos. Simplest version: a playlist embed of the city playlist, which always shows the newest first once Phase 1 sets playlist order. Cleaner version: hand-pick three video IDs and update them when Jack posts a batch. Start with the playlist embed. It needs zero upkeep.
   Once Phase 3 neighborhood tours exist, the city page leads with that tour instead, and the listing strip moves below it.

3. Sell page (site/sell.html)
   One short section: "Every home I list gets its own video tour." One embedded example (pick a good recent one, not a 2021 one) and a link to the Sold playlist. This is the seller-facing pitch and it's already true.

4. Past Sales page (site/past-sales.html)
   Where a sold home has a video, show it. Same embed. This is proof, and it makes the page feel alive.

5. Contact / footer
   A YouTube link alongside the other contact links. Plain text or a small icon. Nothing more.

6. Newsletters page (site/newsletters.html)
   Once market update videos exist (Phase 3), each month's newsletter entry gets its video next to it. Same content, two formats.

## The reverse link
Every new video's description starts with "See photos, price and details:" and the listing page link. This only works if listing pages have stable web addresses that don't change when a listing sells. Decide the address pattern for listing pages before Phase 2 starts, and keep sold listings at the same address (mark them sold, don't delete them).

## Watch out for
- Page speed. A YouTube embed loads a lot. On pages with more than one video, show a thumbnail image first and only load the real player when someone clicks. One video per page can just embed directly.
- The nocookie domain and rel=0 are the two settings that matter. Nothing else.
- Don't autoplay. Ever.
