# Decisions and open checks

## Confirmed by Joel, September 9, 2026

- The Tracy/home front page is the design authority; Jack approved it and likes the other front pages, Buy and Sell.
- Bright, light imagery and the animated hero matter. Preserve the honest copy and personal touches.
- Interior pages must feel cohesive in fonts, color, spacing, navigation and tone.
- Existing form familiarity matters; every contact/signup form must include required email for the receipt flow.
- Keep old-site destinations working on the new front pages during the Agent Image transition.
- Ultimately take over the entire site, but do not treat that intent as a current domain-switch or publication instruction.
- V2 has its own workspace. Preserve existing projects. Delegate focused work efficiently.
- Joel will provide the Vercel addresses for the deployed versions.

## Recommendations, not yet implemented

- Use existing Meet Jack as the base for About + Contact, with selected reviews and access to the complete review collection.
- Keep the four lead intents and old route names. Tighten presentation without removing questions.
- One shared V2 source with explicit transitional/full-takeover routing, rather than permanent duplicate sites.
- First representative build: Meet Jack plus the free valuation form.
- Newsletter preview layout is reusable, but restore approved brand and legacy form contract before V2 adoption.
- Test brighter Tracy treatment as a separate comparison only; preserve current approved home.

## Verified in code or browser

- Resend is the current mail provider. The handler sends Jack an inquiry and the visitor a receipt, with reciprocal reply addresses.
- 24 contact forms exist; 19 require email, three city tour forms omit it and two archive copies leave it optional.
- Existing merged content is `site/meet-jack.html`. There are 14 top-level interior HTML pages and 161 individual monthly issues.
- Homepage `<base href="../site/">` means its `styles.css` resolves correctly to `site/styles.css`.
- Live old newsletter menu leads to delivery preferences and year/month pages. Its print schedule says every other month; it offers a removal request and detailed household/property fields.
- `pages.klemmre.com` failed name resolution in this browser session; `www.klemmre.com` opened successfully. This needs deployed-host verification, not an assumption of a global outage.
- The company-brand ZIP is for Joel's separate Studio business. It is not Jack's brand reference. The forms ZIP contains design exports, not authoritative working form contracts.

## Still open

Update: Joel supplied `https://klemm-real-estate-efkto1r1b-c-d-solutions.vercel.app/`. Its homepage is now browser-reviewed. Meet Jack and free valuation prototypes are built and checked at desktop/320px/390px. See `research/vercel-and-v2-browser-review.md` for evidence; items below describe broader checks still pending.

- Which deployed Vercel build corresponds to each approved source, and whether deployment environment values differ from code defaults.
- Rendered desktop/mobile comparison of approved new pages, moving hero brightness and font/media behavior.
- Actual Resend account configuration, verified sending domain, notification destination, receipt delivery and Reply-To test. Secret values have not been read.
- Whether newsletter enrollment/removal is handled manually by Jack or by another tool; the current handler has no list-storage integration.
- Confirm print frequency before final copy; preserve current every-other-month wording in the meantime.
- Complete live parity for all legacy lead forms, plus future listing-service and Show-Ready Consultation ownership.
- Final public label for the combined page (About Jack / Meet Jack), with Contact remaining easy to find either way.

Record later answers here with date and evidence. Do not silently convert an assumption into an approved decision.

## 2026-09-09 — Approved About tweaks and Buy preview

Joel approved About/CMV visual direction and footer. Requested one page at a time; Buy is the only additional page built this pass.
- About portrait desktop minimum image height 588px (previous cap 490px), copy and final link align with image bottom. Added source-grounded seller preparation paragraph. Mobile remains naturally stacked.
- CMV custom dropdowns reuse the original quiet white/cream menu treatment with brick selected check, adding keyboard selection, Escape cancellation, outside close, labels and native fallback. All original options remain.
- Shared email syntax validator trims surrounding spaces and rejects malformed domains, repeated local dots, missing domain suffixes and overlong components. Allows plus tags, apostrophes, subdomains and longer suffixes. No claim of inbox verification; production API unchanged. Before launch, apply matching server-side checks and perform an authorized Resend delivery/receipt test.
- Buy uses the approved shared styles/footer, existing buy-street photo, source personal copy, three steps and the exact original seven form controls. Buyers links now open local buy.html across the three previews.
- All previews still prevent sending. No live mail test or publication performed.

Verification: 22 email syntax cases passed; CMV browser rejected bad..email@example.com and accepted preview+home@example.com with explicit no-send success. Required Buy name/phone/email errors focus the first missing field. CMV ArrowDown/Enter updated the backing bathrooms select; Escape preserved selection. Desktop screenshots checked for portrait alignment, dropdown, Buy hero/process/contact/footer. Buy measured no horizontal overflow at 390px (client/scroll 375) and 320px (305). Images loaded; Buy console error log empty. Source parity script passed: exact controls 7/19/7, 39 local links/assets, all 200 originals and frozen snapshots unchanged.

Preview: http://127.0.0.1:8766/buy.html . Await Joel's Buy review before moving to another page.

## 2026-09-09 — Sell preview following Buy approval

Joel approved Buy and requested Sell next. Built only sell.html/sell.css plus copies of existing staging-before/after photos. Preserved six source process steps, seller quotes and original seven form controls. Used the accepted cream/Caslon/Inter system and identical footer, visible before/after captions, a short valuation request and detailed CMV links. Sellers navigation now opens sell.html across the four previews; other content remains intact.

Browser checks: desktop hero/photos/steps/contact inspected; 390px hero visually checked; document has no horizontal overflow at 390px (375 client/scroll) or 320px (305 client/scroll). Images loaded. Required empty fields focus Name; malformed email rejected and plus-tag email accepted with explicit preview-only confirmation. No console errors. Desktop restored and Sell left open. Parity check passed all four forms (7/19/7/7 named controls), 55 local links/assets and 200 unchanged source/snapshot files. No submission or publication.

Await Sell review before proceeding to another page.

## 2026-09-09 — Address suggestion interaction, provider pending

Joel approved Sell and requested predictive address suggestions on all address forms. Current V2 address fields are both on CMV; both now opt into shared address-autocomplete.js/css. Contact selection fills its own City/State/ZIP; property selection keeps the full address in its separate field. Inputs remain editable. Existing 19-control CMV contract preserved.

No existing provider integration found in inspected source. Asked Joel which account/service is available; no answer yet. Built only an explicitly labeled fictional fixture demo at i-want-a-free-cmv.html?address-demo=1, not a live address search. Normal CMV keeps manual-entry fallback. Provider choice, adapter and real-address testing remain pending; no paid account or API enabled.

Browser checked keyboard selection, City/State/ZIP autofill, unchanged separate property field, second property selection without changing contact details, no-results manual text retention, Escape dismissal and 390px no horizontal overflow (375 client/scroll). Exact form parity + local paths passed (58 links/assets). See research/address-autocomplete.md for the reusable contract and future form rollout. Original source unchanged.

## 2026-09-09 — Live Google address lookup

Connected and verified real suggestions in both CMV address fields. Restricted browser key to2requiredAPIs and local/exactVercel referrers. Contact selection fills city/state/ZIP; sale address remains independent. Details and outstanding release/usage-controls checks in research/address-autocomplete.md. Local lookup is live; contact submissions remain preview-only and Vercel has not been deployed.

## 2026-09-09 — Communities preview

Built only Communities next at implementation/communities.html and communities.css, with six original community images copied. Kept source site/sites.html six descriptions, Woodbridge55+Manteca label, three regional testimonials and exact seven contact fields. Uses approved fonts/palette/header/footer, equal photo-over-cream cards and shared preview-only validation. All four other V2 page headers now link to communities.html. No original city pages changed.

Destinations use approved Vercel homepage and the five city aliases from source tools/build-site.mjs. Mountain House and Manteca destinations verified in browser; remaining city routes source-verified only (web tool could not open deployment and shell network was blocked). No claim of checking every remote destination.

Desktop card rows/footer and390px visual review passed; widths390 and320 had matching client/scroll375 and305 respectively. All6images loaded. RequiredName/Phone/Email errors shown correctly; console errors empty. Exactformparity passed allfivepages7/19/7/7/7controls,82localreferences,200source/snapshotfiles unchanged. Desktop restored and local Communities left open. No publication or email submission. Await Joel review before next page.

## 2026-09-09 — Reviews preview

Built reviews.html/css/js following user emphasis on Reviews and prior alignment request.15existing excerpts preserved exactly with paired attributions; total123/5.0Zillow snapshot verifiedSep9 withsource/date shown separately. Allreviewsrender withoutJS; progressivecityfilterAll/Tracy/MountainHouse/Lathrop/Manteca with live counts. No invented individualratings or names. Matchingheader/footer/contactform; About/Sell/Communities reviewlinks now localreviews.html.

Verification: review-parity.py passesall15quote/citepairs; sixformcontractspreserved7/19/7/7/7/7; original200filesandfrozenreference unchanged. Browserfilters counts8Tracy/3MountainHouse/3Lathrop/1Manteca/15All; blanksubmit focusesnameandmarksnamephoneemail. Desktopfirstrowquotes/cites matchedverticalpositions.390/320nohorizontaloverflow375/305; phone screenshots readable; consoleerrorsnone. Desktoprestored and Reviewsleftopen. OnlycurrentReviewsbuilt; no publishing/emails. Awaituserreview.

## Interior consistency pass — September 9, 2026
All seven landing pages now share interior.css: 360px desktop introductions, matching two-column proportions, heading sizes, spacing and brick italic Libre Caslon Text emphasis. Buy image moved immediately below the introduction. Mobile introductions stack with natural height so longer text does not clip or create forced blank areas. Navigation header remains shared. Monthly issue readers retain their existing shared template.
Text pass corrected five-community wording, replaced aging year counts, clarified valuation estimate wording, made newsletter delivery copy visitor-facing, and removed the claim that every reviewed client began with a seller walk-through. Actual testimonials preserved. Source and snapshot unchanged; 2,538 local links/assets checked, all original form contracts retained, all 15 testimonial pairs pass parity. Browser measured all seven desktop introductions at 360px; narrow-screen checks recorded separately during the pass. Local preview only.

