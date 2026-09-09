# Klemm V2 — start here

**Direction:** make every page feel like a natural continuation of the homepage Jack approved. Keep the warm, bright setting and personal voice; make the interior pages simpler to read and use.

This is the separate V2 research and planning workspace created September 9, 2026. The approved working site and the earlier newsletter experiment have not been changed. No V2 site has been published.

## Read these first

1. [Direction and build plan](plans/V2-PLAN.md) — overall judgment, what stays, what changes, sequence, release boundaries.
2. [Homepage brand reference](research/homepage-brand.md) — exact fonts, colors, spacing, buttons, hero behavior and asset sources.
3. [Interior page review](research/interior-pages.md) — all 14 top-level interior pages, including the existing merged Meet Jack page.
4. [Forms and migration](research/forms-and-migration.md) — Resend behavior, required-email gaps, old/new form differences and hosting risks.
5. [Live old-site observations](research/legacy-browser-review.md) — what was actually seen in the browser.
6. [Decisions and open checks](plans/DECISIONS.md) — confirmed requirements, recommendations and unresolved items.
7. [Proposed route map](plans/route-map.json) — 180 legacy-path mappings, including all monthly issues; planning data, not active redirects.
8. [Vercel and first V2 browser review](research/vercel-and-v2-browser-review.md) — live reference, first two prototypes and actual device/form checks.

## What is saved here

- `reference/source-code/`: a frozen copy of 200 selected web-source files from the actual working tree, including its uncommitted work. Reference only; not a runnable website or deployment package.
- `research/source-manifest.json`: source paths, SHA-256 fingerprints and an inventory of 68 media/other files. Large media stays in its original location until needed in the V2 implementation.
- `research/page-inventory.json`: headings, links and base URLs for 185 source HTML files (homepage, city/tour pages, interior pages, monthly issues and duplicate archive).
- `research/form-contracts.json`: all 26 forms, of which 24 collect contact details and two are archive search controls.
- `research/tests/`: isolated mail-handler checks; they send no real emails.

Source: `C:/Dev/Joel's Workspaces/Personal/Work/Jack Klemm Real Estate/Klemm`.
Earlier experiment: `../newsletter-preview/`. Its archive interactions can inform V2; its styling and shortened signup are **not** the brand or form authority.

## Current status

Research, source preservation and implementation plan complete. Joel supplied the first Vercel URL; its approved homepage has now been inspected in the browser. The first two V2 prototypes have been built and checked on desktop and phone widths. Live Resend delivery remains unverified. The original local-file preview was not reopened; the separate new prototypes run in their own local HTTP preview folder.

**Ready to review:** [Meet Jack](implementation/meet-jack.html) and [free valuation](implementation/i-want-a-free-cmv.html). Both retain the approved brand and their original form contracts. This establishes the shared patterns; the remaining interiors have not been redesigned yet.

Keep this folder private/local. Agreements, secrets, account configuration and unrelated brand packs were deliberately excluded from the source snapshot. Future releases must package only an explicit site output folder, never this workspace root.
