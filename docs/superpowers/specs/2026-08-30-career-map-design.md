# The Career Map — design spec

**Date:** 2026-08-30
**Status:** approved in principle, pending asset list + review

## What this is

A standalone page that shows Jack Klemm the non-traditional work Joel can do. It is a capability demo, not a feature of klemmre.com. Nothing here ships into the live site. If Jack loves it, a stripped single-agent version can be harvested into `site/past-sales.html` later — but that is a separate project.

The subject is a real estate career rendered as data. Four agent profiles, each told with the visual treatment that actually suits it. The range is the point: the piece argues that Joel picks the right form for the story rather than applying one house style to everything.

All data is invented. Jack's real numbers are unknown and that is fine — possibly better, since it lets each profile be shaped to make a specific argument.

## The shape

One page, scrolled top to bottom. Four narrative screens, then a fifth that hands over the controls.

Screens one through four are authored. They animate as they scroll into view and cannot be broken in front of a client. Screen five is playable — pick a profile, drag the year, watch it redraw — and exists so the demo ends on the moment where the viewer pictures their own name on it.

## The four profiles

Profiles are named by archetype, not by invented person. No fake headshots, no fake biographies. This avoids colliding with a real local agent and reads better anyway: these are categories a viewer can slot themselves into. Only Jack is named, because the piece is his pitch.

### 1. The Anchor — Jack Klemm

38 years, 1988 to 2026. About 3,900 sales. Roughly 85% inside Tracy city limits, with thin spill into Mountain House after 2001, plus scattered Manteca and Lathrop.

**Treatment: dense pin map, zoomable to street level.**

Density is the entire story, so this one needs the literal map. Every sale is a dot. The payoff is the zoom — starting county-wide, then pulling in until you can see eleven dots on a single street. Nothing abstract delivers that.

**Motion:** pins accumulate in chronological order, 38 years in about twelve seconds. The town fills in like ink soaking into paper. Ends held, fully dense.

**Why:** saturation only reads as saturation when you can see the repeats.

### 2. The Drift

31 years, about 1,400 sales. Starts in Stockton and north Manteca in the mid nineties. Slides southwest through Lathrop across the 2000s. The last decade sits almost entirely in Mountain House and River Islands.

**Treatment: soft territory bloom.**

Not dots — blurred density fields, closer to weather than to pins. The story is not where the sales are, it is where the center of gravity was and how it moved. Individual pins would be noise.

**Motion:** the year scrubs and the warm mass crawls across the county, leaving a faint ghost trail of everywhere it has been. The trail is the career.

**Why:** movement over time is a shape, and a shape needs a continuous form, not a thousand discrete marks.

### 3. The Specialist

19 years, about 310 sales, high average price. Two tight clusters thirty miles apart: waterfront in River Islands, and 55-and-over at Del Webb at Woodbridge. A thin scatter of one-offs elsewhere.

**Treatment: split frame — map beside a re-sort.**

On a map this profile looks scattered and weak: two small dots on a mostly empty county. So the map is shown, honestly, and then beside it the same sales are re-sorted by buyer type, where they snap into two dense confident blocks.

**Motion:** the dots physically travel from their map positions into the sorted groups. One continuous move, no cut.

**Why:** this is the smartest screen in the piece. It admits the map is the wrong tool for this person and then shows the right one. A capability demo needs at least one moment of visible thinking, and this is it.

### 4. The Newcomer

6 years, 2020 to 2026, 240 sales. Concentrated in Mountain House and River Islands — new communities, new agent.

**Treatment: no map at all.**

A newcomer has no territory yet, so a territory map makes them look small. What is actually remarkable is rate: 240 sales in six years is roughly 40 a year, against Jack's 75 a year after thirty-eight. She is at half his rate in a tenth of the time.

The screen is a ledger grid — one small mark per sale, arranged by year, the blocks stacking taller each year. Behind it, ghosted, sits Jack's first six years at the same scale, so you are comparing her start against his start rather than against his lifetime.

**Motion:** marks drop in year by year. The ghost layer fades up last.

**Why:** deliberately breaking the map format on one of four screens proves the piece is choosing forms rather than decorating with one. It is also the only honest and flattering way to show a short career.

### 5. The playable finale

One frame, four buttons, a year slider. Pick a profile and the dots fly to their positions. Reuses the pin renderer from screen one. Closes with a single line of type inviting the viewer to imagine their own history in it.

## Data

Every sale is one record: year, city, position, price band, property type. About 5,850 records total across the four profiles, produced by a generator script with a fixed seed so the output is reproducible.

Positions are expressed in the drawn map's own coordinate space, not real latitude and longitude, and are scattered around town centroids with plausible spread. No real addresses are used anywhere. This sidesteps the problem of dropping invented sales onto real houses.

The generator is a small standalone script that writes a JSON file. Regenerating with a different seed reshuffles the scatter without changing the narratives.

## Technical approach

A single standalone page — one HTML file, one stylesheet, one script, one data file. Static. No build step, no dependencies, no API keys, nothing that can break `build-sites.ps1`.

The county map is drawn by hand as flat SVG rather than pulled from Google or Mapbox. No key to manage, it matches the palette instead of fighting it, and for a craft piece a drawn map is the more impressive object — it looks authored rather than embedded.

Dense animated fields (screens one and two) render to canvas, since several thousand moving dots will strain SVG. The basemap, the split frame, and the ledger grid stay as SVG.

Type and color come from the existing system — Libre Caslon Display and Libre Caslon Text for display, Inter for interface, palette from `DESIGN.md`. Scroll reveals reuse the IntersectionObserver pattern already in `home/index.html`. Reduced-motion preference is respected: animations resolve to their final state instead of playing.

## Assets needed

Almost all of this can be generated. The list is short on purpose.

**Blocking — needed before the map can be drawn:**

1. A reference map of San Joaquin County showing Tracy, Mountain House, Lathrop, River Islands, Manteca, Stockton, and Woodbridge or Lodi, plus I-5, I-205, I-580 and the Delta waterways. A screenshot or a printed map is fine. This is a tracing reference, not artwork.

**Optional — genuinely improves the result:**

2. Scanned ink or paper texture. A few brush or wash blobs on paper, scanned at high resolution, would make the territory bloom on screen two considerably better than a digital gradient. This is the one hand-drawn asset worth getting.
3. High-resolution top-down aerial stills of each community, 2000px or wider, for section openers.
4. A higher-resolution version of Jack's portrait than the one currently in `shared/jack/`.

**Explicitly not needed:**

Headshots for the other three profiles. They are archetypes, not people, and giving them faces would mean either using a real person's photo for a fake agent or generating a fake face. Both are worse than typography alone.

## Out of scope

- Any integration with the live site
- Real MLS or IDX data
- Real addresses or parcel data
- Mobile-first optimization beyond not breaking; this is a demo shown on a laptop

## Open questions

- Does the piece carry Joel's byline, or is it presented anonymously as work?
- Is it shown in person on a laptop, or sent as a link?
