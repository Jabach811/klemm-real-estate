# Vercel reference and first V2 browser review

September 9, 2026. Reference supplied by Joel: https://klemm-real-estate-efkto1r1b-c-d-solutions.vercel.app/

## Approved front-page observations

- Opened and inspected the actual Vercel homepage on desktop and requested 390px/320px phone viewports. Its title, navigation and main story match the intended Tracy reference.
- Computed styles confirm Libre Caslon Display headings, Inter body and cream `rgb(246,241,232)`. The familiar header and ink/cream pill button are the appropriate reference for interior pages.
- The windmill video loaded (`readyState: 4`). Pause changed to Play; playback was restored. No claim about every frame or autoplay conditions on every device.
- The scene is visibly darkened around the large white/gold text. Leave the accepted hero unchanged; a future brighter landscape comparison should retain directional protection behind text.
- The layout reads well as an introduction, but its text and dark testimonial band are spacious. Interior forms and archives should not repeat that much space before useful content.
- On the requested 390px viewport the header measured about 130px high and the hero action ended around 864px, just below the 844px viewport. At 320px the wrapped header measured about 183px. This supports a compact accessible interior menu, not a claim the existing site is broken.
- No horizontal overflow was measured at those two viewport widths. The live homepage form has required name, phone and email, optional message and action `/api/contact`. No live form was submitted.
- Main navigation still points to existing www.klemmre.com paths. The Newsletters link remains `/latest-news/`, which does not reproduce the old newsletter menu documented in the earlier browser review.
- Tour cards changed after the runtime feed loaded; do not treat the first static card list as a definitive deployed-content mismatch.

## First V2 prototypes completed

New files live only in `implementation/`. The canonical approved source and frozen reference snapshot are unchanged. This is a two-page design prototype, not a full-site launch or backend replacement.

- `meet-jack.html`: combined story, selected real review excerpts and direct contact access. Real source portrait; source fonts/palette; approved-style header and buttons; bright review section; primary message link goes directly to the form.
- `i-want-a-free-cmv.html`: familiar free-CMV offer explained plainly, visible Contact information and Home details groups, native selects, complete original questions.
- `v2.css` / `v2.js`: shared shell, compact phone menu, readable controls, focus states and review-only validation. Footer is shared consistently, including phone/email/address/license number.
- The existing source form contracts are retained: 7 named controls for Meet Jack and 19 for CMV, including hidden metadata. Types, required flags, values and select choices compare exactly against the snapshot.

## Browser checks actually performed

The two **new** prototypes were served from their isolated implementation folder at `http://127.0.0.1:8766/`. This exposes only that new design folder, not the original site or the research workspace. The original local-file page blocked earlier was not reopened or served as a workaround. The approved homepage was inspected at Joel's supplied HTTPS URL.

- Desktop screenshots of both prototypes, plus 320px and 390px layouts.
- No horizontal overflow on either prototype at those requested phone widths; final document scroll width equaled client width (305px or 375px after scrollbar allowance).
- Final narrow header around 77px, with both Call and Menu accessible. Menu opens/closes, reports expanded state, and Escape closes it and returns focus.
- Meet Jack portrait loaded. Headline wrapping adjusted to keep “the phone” together. Contact-field spacing and matching footer tightened after visual inspection.
- Valuation inputs use 16px text; phone fields become one column. All questions remain visible, not hidden in a multi-step flow.
- Empty submission on each prototype produces errors for the required fields and focuses the first error. Dummy valid details produce an explicit no-send preview confirmation. No network submission or email occurred.
- Browser error logs for the final two prototype tabs were empty.
- Temporary viewport overrides were reset; clean desktop previews remain open.

## Automated checks

`python klemm-v2/research/tests/validate-v2.py` passed: both exact form-control comparisons, 20 local links/assets/anchors, JavaScript syntax, no network/storage calls in the preview script, and unchanged fingerprints for all 200 source/snapshot files.

## Remaining before production

Prototype handlers deliberately do not send. Connect tested production form handling only after form reliability work in the main plan; do not simply replace this review script with the old handler and assume the known Resend edge cases are fixed. Full keyboard traversal, OS reduced-motion behavior, additional browsers/devices and live receipt/reply delivery still need their specific checks. The remaining interior pages are not redesigned yet.

The second Vercel address is still pending if it represents another approved deployment. Its absence did not prevent reviewing the first reference or building these two prototypes.
