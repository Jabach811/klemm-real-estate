# Project organization

- `cities/<city>/index.html` is that city's live page when one exists.
- `cities/<city>/assets/` contains all imagery, video, notes, and neighborhood material for that city. A named community with its own page gets its own folder, such as `cities/woodbridge/`, even when it sits inside another city.
- `shared/jack/` contains Jack-specific imagery. `shared/listing-prep/` contains reusable staging and listing-prep photography.
- `site/` holds shared site pages and styling. The build preserves their existing public root URLs and also publishes each city folder at `cities/<city>/`.

## Keep it consistent

1. Never put a city file at the project root. Start with `cities/<city-slug>/`.
2. Use `index.html` for a city landing page; put its assets in that same city's `assets/` folder.
3. Use lowercase hyphenated city folder names, for example `mountain-house` and `river-islands`.
4. Use descriptive, lowercase-hyphenated names for new media: `<city>-<place>-<purpose>.png`.
5. Put a file in `shared/` only when it genuinely works across more than one city.
