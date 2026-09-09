# V2 design previews

- [Meet Jack](meet-jack.html) — story, selected reviews and contact together.
- [Free current market value](i-want-a-free-cmv.html) — all original questions, clearer groups and phone layout.
- [Buy with Jack](buy.html) — approved buying process and starting form.
- [Sell with Jack](sell.html) — preparation, six selling steps, seller stories and valuation request.
- [Communities](communities.html) — six community introductions and links to the approved guides.
- [Reviews](reviews.html) — selected client excerpts, community filters and linked Zillow rating.

The approved Vercel homepage is linked from Home. Other unbuilt destinations retain links to Jack's old site. These are local design previews, not a published full site. All forms demonstrate validation without sending or storing details.

To reopen in a browser, run from this folder:

```
python -m http.server 8766 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8766/meet-jack.html` or `http://127.0.0.1:8766/i-want-a-free-cmv.html`.

Do not run the server from the research workspace or original source root. This folder contains only the new prototypes and their portrait/style/script assets. The local server does not implement `/api/contact`; the prototype's guarded form handler never calls it.

See `../research/vercel-and-v2-browser-review.md` for actual checks and remaining work.

Newsletters: newsletters.html includes the latest available issue and a year selector for all 161 monthly issues. The newsletters/ folder contains the matching sales readers. Signup and delivery changes link to Jack's existing full delivery form.

