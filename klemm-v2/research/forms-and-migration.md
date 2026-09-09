# Forms and staged migration audit

Audit: September 9, 2026. Source inspected read-only: `C:/Dev/Joel's Workspaces/Personal/Work/Jack Klemm Real Estate/Klemm`. No original edits, source build, secret-file reads, live submissions, or emails. Exact current field names, labels, required flags, types, options, and source lines are in `form-contracts.json`.

## Main finding

The current code uses **Resend**, not Formspree. Keep its receipt-and-reply approach, restore required email on five contact forms, and preserve the longer buyer/seller questionnaires while improving their layout. Provider identity is code-verified; account configuration and real delivery are unverified.

There are **24 contact forms** across home, cities, and site, plus two newsletter archive search forms. Nineteen contact forms require email. Search is a local browsing control and should not request contact details.

| Family | Current contract | Required correction / retention |
|---|---|---|
| 15 general forms: homepage, five city homepages, nine standard site pages | Name/text, Phone/tel, Email/email required; Message/textarea optional | Preserve familiar fields and order. |
| Three city tour forms: Lathrop, Manteca, Mountain House | Name/text and Phone/tel required; optional Regarding radio: Selling / Buying / Just curious | Add required Email. These currently cannot pass the API email check. |
| Four detailed forms: find-me-a-home, find-me-an-investment-property, i-want-a-free-cmv, i-want-to-sell-my-property | Name, Email, Phone required; existing contact and property questions optional | Preserve every field; group Contact information and Home details; explain required fields. |
| Two newsletter copies: site/newsletters.html and site/newsletters/newsletters.html | Name required; email optional; Email/Print checkboxes and mailing address optional | Restore the full legacy delivery-preference contract below; required email alone does not achieve parity. Preserve removal requests and printed delivery frequency. |

Detailed buyer fields: contact address/city/state/zip, approximate move date, preferred contact method (Phone / Email / Phone or email), preferred cities, max price, minimum bedrooms/bathrooms (1,2,3,4,5+), minimum square feet, maximum age, must-haves, comments. Seller/CMV uses the same contact fields plus sale address, bedrooms, bathrooms (including half baths), square feet, year built, pool Yes/No, comments. See source `site/find-me-a-home.html:59-104`, `site/i-want-a-free-cmv.html:59-112`; JSON includes all four contracts.

## Mail behavior and concrete gaps

- `api/contact.js:69-74,86-87`: Resend API. Configuration names only: `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO`, `SITE_URL`, `MAIL_LOGO`. No secret values inspected.
- `api/contact.js:93-106`: first send notifies Jack, with Reply-To set to the visitor; second sends the visitor a copy, with Reply-To set to Jack. Receipt subject thanks the visitor. Keep this so normal email replies reach the right person.
- `api/contact.js:78-87`: POST only; honeypot filled => silent 200; email server-validated; missing provider configuration =>503. Fields are HTML escaped (`18,29-31`). Other required HTML fields are not validated server-side. Enforce the agreed form-specific requirements there as well, with sensible field length limits.
- **Verified using isolated mocks:** no email =>422/no sends; valid email =>two sends with correct reply routes; raw URL-encoded `deliver=Email&deliver=Print` retains Print only through `Object.fromEntries` (`80`); second send failure returns 502 even after Jack's first email succeeded (`94-110`). Preserve repeated values and separate receipt retry from lead acceptance to avoid duplicate inquiries when visitors retry.
- No rate limiting or request-origin check is present in this endpoint. The honeypot is its only code-visible spam control. Add bounded abuse protection before public rollout of the auto-reply endpoint.
- `shared/site.js:69-105`: optional emails pass the browser check but fail API validation; failed responses become a generic call-Jack error. Preserve entered values (current code does), link field errors to the input, and clearly distinguish a missing email from a send failure.
- No-JavaScript forms POST correctly but receive raw JSON because the endpoint always responds JSON (`113`); provide an HTML confirmation/redirect for native form submissions. Phone and email links remain fallback contact methods.
- Newsletter success currently promises being on the list (`site/newsletters.html:265`), but the endpoint only sends mail and does not persist a subscription. Say the request reached Jack unless list enrollment is implemented. Require email at `site/newsletters.html:277` and nested copy; city omissions start at `cities/lathrop/tours.html:87`, `cities/manteca/tours.html:242`, `cities/mountain-house/tours.html:89`.

Mock test: `node --experimental-vm-modules klemm-v2/research/tests/contact-mock.mjs`. Output saved beside it. Network fetch and environment were isolated in a VM with dummy data; no live messages sent.

## Preserve old-site familiarity

Public [contact page](https://www.klemmre.com/contact/) shows Name / Phone / Email / Message and Agent Image attribution. Public [CMV page](https://www.klemmre.com/i-want-a-free-cmv/) exposes preferred contact choices, bedroom/bathroom options and pool choices consistent with the local detailed form. These web results were cached (contact three months; CMV ten months), so exact current required flags and delivery behavior are not verified. Buyer web fetch failed. Parent subsequently inspected the live signup in the browser, documented below. Do not claim complete live parity for the other detailed forms from cached evidence.

`Forms design improvements.zip`, read in place without extraction, contains `export/forms.html` with five design forms whose actions are `#`. Its buyer and valuation forms are shorter and omit email; its general contact includes Regarding, and its callback form matches the email-less city tour form. Treat this as a visual reference, not the authoritative complete field contract or a working integration. Preserve the current longer buyer/seller questions rather than copying those shortened export forms wholesale.

The legacy navigation also exposes [Show-Ready Consultation](https://www.klemmre.com/i-want-a-free-show-ready-consultation/); no same-named local site page exists. Retain the old destination until this service has an approved replacement. Exact field parity for that legacy page remains unverified.

## Live newsletter parity gap

Parent browser-verified [Newsletter Delivery Preference](https://www.klemmre.com/delivery-preference/) on September 9, 2026; no submission. The old form contains **Name1 required, Name2, Property Address required, City required, Zip required, Phone1 required, Phone2, Email1 required, Email2**, a mailing-address-is-the-same checkbox, separate Mailing Address / City / State / Zip, and Additional Comments.

Delivery choices are **Email monthly**, **Printed EVERY OTHER MONTH**, and **Neither (remove me)**. Preserve these distinct requests and their frequency. The current simplified newsletter only collects one name, an optional email and one mailing address, with Email/Print checkboxes. It loses the second household contact, property identity, phones, separate mailing location, comments, removal request and accurate printed frequency. This is a material functional mismatch, beyond missing required email. Restore that complete familiar contract in V2 with readable sections; establish the legacy choice control behavior before changing selection rules. Do not assume the current ability to tick both simplified boxes represents the original contract.

Parent also verified the actual old menu flow: **Newsletters (#) → year → month**, including [August 2026](https://www.klemmre.com/august-2026/), and signup at `/delivery-preference/`. Preserve access to signup and year/month browsing during the hybrid period. The replacement homepage `/latest-news/` link does not preserve that verified flow. Parent will retain the browser evidence note separately.

## Hybrid release contract

- `home/index.html:22`: main navigation intentionally uses existing absolute www.klemmre.com destinations for About, Featured Listings, Sellers, Buyers, Newsletters, Past Sales, Communities and Contact. Keep these destinations during V2 design. Parent visually checked the public homepage this session; its visible primary labels agree. The newsletter link is a verified flow discrepancy: local homepage points at `/latest-news/`, while the live old menu exposes `/delivery-preference/` and year/month navigation. Restore those destinations rather than treating latest-news as the archive.
- `tools/build-site.mjs:12-17`: home and all city pages are included; site interiors are excluded by default unless enabled with `LIVE_INTERIOR_PAGES` names or `all`. This setting is not verified in deployment. Enabling `all` would override phased takeover, so use an explicit approved route list.
- `tools/build-site.mjs:13-14`: aliases include homepage, communities, and five city homepages. `39-42` respects source base tags, then rewrites local paths. City tour references to shared scripts resolve through their base tag; do not incorrectly treat them as broken relative paths.
- `vercel.json:7-42`: API route first, files and extensionless matches next, then special listings/reviews redirects and a generic 307 to pages.klemmre.com. Parent's browser received `ERR_NAME_NOT_RESOLVED` for that subdomain this session. This is session evidence, not a universal DNS-outage claim; resolve and verify every fallback before deployment.
- `site-worker.js:1-7` only serves static assets. The Sites worker does not implement the Resend endpoint. A successful static deployment alone therefore does not prove contact forms work. Vercel config does route `/api/*`; verify the actual chosen host supports that handler.
- `tools/build-site.mjs:6,48-50,70-71`: origin controls canonical URLs and sitemap; default is the prior Sites hostname. Supply the intended origin deliberately. Do not publish preview canonical URLs on the final domain.

## Practical V2 acceptance order

1. Freeze the JSON current-code contracts and supplement them with the live newsletter contract above; add required email to every contact/signup form and restore all missing newsletter fields, removal behavior and delivery-frequency wording.
2. Keep production homepage links on existing destinations. Build V2 routes separately; use explicit per-route ownership rather than an early whole-site switch.
3. Implement/validate required fields, both delivery preferences, print address, duplicate prevention and honest confirmation with mocked mail. Keep the exact reply paths tested here.
4. Check desktop/mobile fields, keyboard errors and no-JavaScript confirmation. Validate old-to-new route mapping including signup, show-ready consultation and listing destinations.
5. Before any release: resolve the fallback host, confirm production origin and email host configuration, then perform a separately authorized end-to-end test to controlled recipients and confirm receipt/reply. None of those live mail checks has been done in this audit.
