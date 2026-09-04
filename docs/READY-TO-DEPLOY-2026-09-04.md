# Klemm sites — ready for deployment review

Prepared September 4, 2026. No deployment was made.

Six community landing sites are included: Tracy, Mountain House, Manteca, Lathrop, River Islands, and Woodbridge. The package has 18 customer pages and keeps 33 current and older page addresses working.

## What changed

- Consistent navigation, community directory, keyboard controls, phone layout, and background-video pause controls.
- Removed unfinished forms and placeholders. Contact and newsletter requests open the visitor's email or messaging app; there is no on-site submission service.
- Linked 20 real newsletter issues and the existing current-listings page. Those destinations remain on www.klemmre.com and must stay available.
- Clearly labeled historical video tours, with search and load-more controls in the three large archives, accessible playback, and direct YouTube fallback links.
- Removed unsupported annual-sales wording and softened promises about results.
- Preserved the established imagery and visual direction. The deployment build now includes only referenced assets: 63.4 MB instead of 94.6 MB. Original source assets remain in the project.
- Fixed seller process photo switching and the nested Woodbridge hero background during final review.

## Verification

46 automated tests pass, including 3 new customer-page checks. All 33 built HTML pages pass local link, image-reference, heading, metadata, and duplicate-ID checks. All 18 customer pages were checked in the browser at desktop and phone widths; the homepage also fits a 320-pixel screen. Menu, archive search, load more, tour embedding, and seller photo switching were checked. All 20 newsletter issue URLs and the current-listings URL returned HTTP 200. Individual tour videos were not all played through.

## Build and handoff

Run from this project folder:

```powershell
./build-sites.ps1
node --test tools/site-release.test.mjs
python tools/validate-site.py
```

The deployable package is `archive/releases/klemm-upgrade-ready-2026-09-04.tgz`, containing `dist/client` and `dist/server`. The source remains uncommitted for review.

The default public origin is https://klemm-real-estate-tracy.jabach0811.chatgpt.site. For a different destination, set `SITE_ORIGIN` to its HTTPS origin and rebuild before deployment, so canonical links and the sitemap match. No custom-domain migration is included.

Use this note for this release; older handoff documents describe earlier versions. Preview the community directory at http://127.0.0.1:8767/sites.html while the local preview server is running.
