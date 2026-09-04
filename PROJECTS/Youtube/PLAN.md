# Plan

Three phases. Phase 1 is an afternoon in YouTube Studio once Joel has manager access. Phase 2 is the website. Phase 3 is new content and needs Jack's time.

## STATUS
Last updated: 2026-09-02

Done:
- [x] Audit of the channel (AUDIT.md)
- [x] Full inventory of all 838 videos with city and address (data/inventory.csv)
- [x] Copy drafted for channel, titles, descriptions, playlists (TEMPLATES.md)

- [x] Pitch page for Jack (presentation/index.html). Joel presents this before Phase 1 starts. To preview it, open the file in a browser, or start the "youtube-presentation" server from the website project's launch config.

Waiting on:
- [ ] Jack adds Joel as a channel manager (YouTube Studio > Settings > Permissions > Invite. Role: Manager. Jack does not share his password.)

Next up:
- [ ] Phase 1, item 1 (channel basics)

## Phase 1: Straighten out the channel (quick fixes)
Everything here is settings and copy. No new videos.

1. Channel basics (YouTube Studio > Customization)
   - [ ] Upload a banner. Design it in this project (banner spec in TEMPLATES.md). Size 2560 x 1440, keep the important part inside the middle 1546 x 423.
   - [ ] Change the handle. First choice @klemmrealestate, fallback @jackklemm.
   - [ ] Replace the About text with the version in TEMPLATES.md.
   - [ ] Add links: klemmre.com, mountainhousere.com, mantecare.com, lathropre.com, phone.
   - [ ] Add channel keywords (list in TEMPLATES.md).
   - [ ] Set a featured video for returning visitors and a trailer for new visitors. Until a real trailer exists, use the 2700 Annette Ct video (his most watched).
   - [ ] Connect klemmre.com as the channel's associated website (Settings > Channel > Advanced). Needed before end screens and cards can link to the site.

2. Playlists (YouTube Studio > Content > Playlists)
   - [ ] Create the playlists listed in TEMPLATES.md (one per city, plus Sold and Neighborhoods).
   - [ ] Add every video to its city playlist. Use data/inventory.csv as the checklist. In Studio, filter Content by a city name in the search box, select all, Add to playlist. Do it city by city.
   - [ ] Set playlist order to newest first.
   - [ ] Arrange the channel Home tab: featured video, then the city playlists as sections, Mountain House first (growth story), then Tracy, Manteca, Lathrop / River Islands.

3. Default settings for future uploads (Settings > Upload defaults)
   - [ ] Paste the description template.
   - [ ] Add the default tags.
   - [ ] Comments: on, hold potentially inappropriate for review.
   - [ ] Category: leave as is. There is no real estate category and it doesn't matter.

4. Fix the recent batch (the 49 "remark + address" titles from the last few months)
   - [ ] Retitle using the formula in TEMPLATES.md. Fix the typos while there.
   - [ ] Add the listing link to the top of each description.
   - [ ] Add an end screen: city playlist on the left, subscribe on the right. Save it as a template the first time.

5. Bulk-fix the back catalog (the other 789)
   - [ ] Studio bulk edit: select all videos, Edit > Description > Add to end, paste the short contact-and-link block. Do it in one pass.
   - [ ] Studio bulk edit: turn comments on for all.
   - [ ] End screens on old videos: only worth it for the 46 videos with 100+ views. Use the saved template. Skip the rest.
   - [ ] Don't retitle old videos. Not worth the hours. They're sold homes.

## Phase 2: Wire it into the website
See SITE-INTEGRATION.md for where each piece goes.
- [ ] Each listing on the site embeds its own tour video (match on address).
- [ ] Each city page gets a "Recent tours in <city>" strip from that city's playlist.
- [ ] Sell page: "Every listing gets a video tour" with one embedded example and a link to the Sold playlist.
- [ ] Past Sales page: sold-home videos as proof.
- [ ] Footer or contact: link to the channel.
- [ ] The reverse link: every new video description points at its listing page. That's in the template already; it only works once listing pages exist and have stable web addresses.

## Phase 3: New content (needs Jack, Joel does post only)
Do these in order. Each one is a repeatable format, not a one-off. Joel does not film. Anything here has to work from existing footage, existing photos, or a voice memo from Jack.
- [ ] Neighborhood compilations from existing footage: "Homes we've sold in Tracy Hills" style cuts built from the slideshows already on the channel. No new filming.
- [ ] Thumbnail template: city and price on a consistent layout, applied to every new upload.
- [ ] Listing video template so each new upload comes out the same: intro card, captions, end screen.
- [ ] Monthly market update, one per city, 3 to 5 minutes. Jack on camera or voice over a few charts. Script comes from the newsletter he already writes. Start with Tracy and Mountain House.
- [ ] Neighborhood tours: Tracy Hills, River Islands, the Mountain House villages, Ellis, Woodbridge. The "Live at Ellis" video proves this works. Each one gets embedded on the matching city page.
- [ ] Real walkthroughs for premium listings (the 4-minute format that got his top views). Not every listing. The ones worth it.
- [ ] Shorts: a 30-second vertical cut of the slideshow per listing. Only if the above is running smoothly. Cheap to add, low payoff on its own.

## What to measure
Don't chase subscribers. Watch these instead, monthly, in YouTube Studio > Analytics:
- Views per listing video in its first 30 days (baseline now: median 21).
- Clicks from video descriptions and end screens to klemmre.com (visible in Analytics once the site is connected).
- Traffic source "YouTube search" as a share of views. If titles are working, this goes up.
- Views on the area videos, once they exist. Those are the ones that can actually grow.
