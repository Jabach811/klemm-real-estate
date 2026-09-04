# YouTube Upgrade Project

Fixing up Jack Klemm's YouTube channel and wiring it into the new website.
Channel: https://www.youtube.com/@jackklemm3607 (838 listing videos, 74 subscribers, posting since ~2021).

Read this file first, then STATUS in PLAN.md. That tells you where we are.

## The goal, in Joel's words
Extract as much as we can from what's already there, refine it, and make it trackable.
Jack has 838 videos and no idea what they do for him. The job is to plug that asset in
(channel settings, playlists, titles, links) and wire it to the new site so views and clicks
can finally be measured. Joel works in post only: he does not film. New content ideas have
to work with footage and photos Jack already has, or with a phone voice recording from Jack.

## Who's who
- Jack Klemm: the broker. Owns the channel. Makes one slideshow video per listing.
- Joel: runs this project. Jack is expected to add Joel as a channel manager so Joel can make the changes directly.
- Claude: does the research, writes the copy, builds the data and the site pieces, and drives YouTube Studio in Joel's browser when asked.

## Ground rules
- Anything on YouTube goes through Joel's real Chrome (the Claude in Chrome tools), not the built-in browser pane. Joel's Premium account is signed in there.
- Talk to Joel in plain English. He is a designer, not a coder. Define any technical term the moment you use it.
- Never publish, change, or delete anything on the live channel without Joel saying go for that specific change. Drafting copy is fine. Clicking Save in YouTube Studio is not, until he says so.
- Keep the deliverables in this folder. The website lives elsewhere (see below). Don't scaffold new folders without a reason.
- No emojis. No decorative formatting. Short files that answer a question beat long ones that look thorough.

## What's in this folder
- PLAN.md: the phases, the checklist, and STATUS (what's done, what's next). Update STATUS when you finish something.
- AUDIT.md: what the channel looks like today and why it isn't working. The evidence behind the plan.
- TEMPLATES.md: ready-to-paste copy. Channel About text, title formula, description template, playlist names, tags, end screen layout.
- SITE-INTEGRATION.md: how the videos plug into the website, and where in the site code that happens.
- presentation/index.html: the pitch page for Jack. One scrolling HTML page with the numbers charted, what's broken, and the three-layer fix. Uses the website's type and colors. Open it in a browser.
- data/inventory.csv: every video on the channel with its city, address, views, and age. Open it in Excel.
- data/summary.json: totals by city, view distribution, top 20 videos.
- data/build-inventory.mjs: rebuilds the CSV from a raw dump. data/README.md explains how to refresh the dump.

## Related project
The website build is at
C:\Dev\Joel's Workspaces\Personal\Work\Websites\Klemm
City pages are in cities/<city>/index.html. Main pages are in site/. Read that project's AGENTS.md before touching it.

## How a session usually goes
1. Read PLAN.md STATUS.
2. Pick the next unchecked item in the current phase.
3. If it needs YouTube Studio, open it in Joel's Chrome and confirm with Joel before saving anything.
4. If it needs copy, draft it in TEMPLATES.md and show Joel.
5. If it needs site work, follow SITE-INTEGRATION.md and the website project's rules.
6. Update STATUS. Tell Joel what changed and where to see it.
