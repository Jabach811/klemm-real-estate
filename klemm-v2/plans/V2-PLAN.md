# Klemm V2 direction and build plan

September 9, 2026 · Research and proposed implementation plan. No approved source changes or deployment.

## Overall feel

The front page already has the right reason to exist: Jack knows these streets and personally takes responsibility for the work. The landscape, warm colors and traditional headings make that feel established; the plain copy makes it approachable. The interior pages should continue that conversation. They should not feel like a second agency designed them, or make someone sit through another large introduction before finding a form, address or newsletter.

Keep the homepage as the reference, not as the first redesign target. Buy and Sell already carry much of its personality and need tightening rather than replacement. The larger gains are consistent navigation, less empty space before useful content, a coherent About/Contact experience, and a newsletter archive that reads like a useful local record.

The initial newsletter experiment proved a simpler browsing layout, but it moved away from approved typography and shortened a form that needs old-site parity. Carry forward its search and latest-issue structure, not its standalone visual system or signup contract.

## Brand rules for every page

| Role | Use |
|---|---|
| Main surface | Warm paper `#F6F1E8`; white fields and `#EFE8DB` section separation where useful |
| Reading / secondary text | `#1B1712` / `#5F574B` |
| Accent / rules | Brick `#A03D22` / hairline `#DCD2C0` |
| Headings | Libre Caslon Display; Caslon Text for emphasis, short quotes and wordmark |
| Reading, forms and data | Inter; comfortable 16px body baseline; clear labels and aligned figures |
| Navigation and buttons | Approved paper header, direct phone access, familiar pill buttons and visible focus states |
| Copy | Concrete, local and personal. Preserve Joel's distinctive lines and factual caveats. |
| Imagery and motion | Existing local assets and approved landscape videos; gentle motion, pause controls and reduced-motion support |

Interior headings should use a common compact scale, initially around 36–56px, with 32–56px section spacing where content benefits. These are proposed starting values to compare visually against the homepage, not locked measurements. Preserve the homepage's larger storytelling rhythm. Keep text readable before adding decorative treatments.

Light and bright means daylight imagery, light reading surfaces and well-spaced information. It does not mean washing out photos or weakening text contrast. The homepage omits the newer city `hero-bright` class, while all five city pages use per-scene settings. Make a separate Tracy brightness comparison later; judge moving frames and phone crops before choosing settings. Do not alter Jack's approved page now.

## Page structure

- **Meet Jack:** start from existing `site/meet-jack.html`. A compact introduction, real portrait/story, selected genuine reviews, and a direct contact section. Keep Call / Email / Contact easy to reach at the top. A Contact link should go straight to the form rather than require scrolling through biography. Keep the complete existing review collection accessible; do not imply selected excerpts are all 123 reviews.
- **Buy and Sell:** preserve the voice, service details, familiar questions and existing imagery. Tighten repeated large headings and gaps, make the next action obvious, and use light supporting sections where large dark bands interrupt reading.
- **Communities:** keep the six-destination local image layout and recognizable city pages. Preserve intentional crop differences. Woodbridge is a neighborhood/community destination, not a newly invented city.
- **Newsletters:** compact personal introduction → latest issue → searchable archive → signup/preferences. Monthly issues use clear address lists, useful labels and secondary brokerage totals. Preserve all 161 issues and 10,941 recorded sales. No invented prices. Keep newsletter preferences capable of the old form's household/property information, email/print choices and removal request. Email required in every delivery mode. Existing public wording says email monthly and print every other month; confirm that schedule before changing it.
- **Listings and tours:** current listings first; clearly labeled historical video tours second. Do not treat old tours as available homes. Preserve current listing-service links during transition.
- **Past sales:** retain its separate purpose, source links, checked dates and scope caveats. Do not turn aggregate claims into an invented transaction history.
- **Four lead pages:** retain the existing buyer, investor, valuation and seller intents, fields and familiar route names. Improve grouping, spacing and validation without shortening the questionnaires by default.

The detailed page-by-page evidence is in `../research/interior-pages.md`.

## One V2 source, two deliberate release modes

Maintain the approved V1 source separately while designing V2. Within V2, use one shared source and an explicit route map rather than maintaining two manually edited copies of every page.

| Mode | Behavior |
|---|---|
| Transition | Approved new front pages remain live; established buyer/seller/about/contact/listing destinations stay on the verified Agent Image host until replaced. Preserve old newsletter menu intent, not the unrelated `/latest-news/` shortcut. |
| Full-takeover preview | Interior navigation goes to completed V2 pages. Old URLs are mapped to equivalent content, with direct anchors for merged contact/about sections. This remains a preview until routes, forms and host configuration pass checks. |

The existing build already supports selectively publishing interiors through `LIVE_INTERIOR_PAGES`; extend and document that boundary rather than inventing a separate hosting system. Explicitly supply the correct deployment origin. Do not switch `all` on merely because source pages exist.

Before moving the root domain, ensure Agent Image content has a verified, working alternate destination. `pages.klemmre.com` did not resolve in this browser session. Existing `www.klemmre.com` links may point back into the new host after a domain switch, so they cannot alone guarantee the old site remains reachable.

Preserve `/about/`, `/contact/`, `/testimonials/`, `/delivery-preference/`, all old monthly issue slugs, the four lead routes, and community URLs. Keep Show-Ready Consultation on the old host until its replacement scope is clear. Never redirect all missing pages to the homepage.

## Build sequence

1. **Baseline and contracts — completed in this workspace.** Source-code snapshot, asset inventory, brand rules, 14-page review, form-field inventory and mocked API evidence. No private files or credentials copied.
2. **Shared V2 page pattern.** Build Meet Jack and the free current-market-value page in a separate implementation directory. Reuse approved fonts, buttons, header/footer and actual content. Give Joel a desktop/phone comparison before propagating it. Preserve Contact and review access even if their content is merged.
3. **Form reliability in the V2 copy.** Add missing required emails; preserve repeated delivery choices; validate required fields on both sides; preserve user input on error; separate an accepted lead from a failed receipt; use honest newsletter request confirmations. Retain legacy newsletter fields and removal intent. Test these with mocked mail first.
4. **Apply the shared pattern.** Tighten Buy/Sell; align Communities, Listings and Past Sales; adapt the newsletter archive and all generated monthly pages. Use shared templates/generation where the source already repeats markup, without adopting a new framework.
5. **Host and device review.** Use Joel's two Vercel URLs to identify exactly which approved builds are deployed. Check page identity and link modes, actual media playback, font loading, 320/390px layouts, keyboard flow, reduced motion and form states. Compare the separate Tracy brightness variation if still wanted.
6. **Staged release and eventual takeover.** Enable only accepted routes. Test real inquiry and receipt delivery with controlled recipients and confirm Reply-To behavior. Preserve old URLs/content and export requirements, then switch the domain when the remaining Agent Image dependencies are resolved. Keep a rollback package and route checklist.

## Acceptance checks

- Same recognizable brand from homepage to interior; no generic font or palette substitution.
- Every existing factual statement, review, service description and important form question either preserved or deliberately accounted for.
- All contact/signup forms visibly require email; search requires no personal information.
- Print selection retains mailing/property distinction; combined delivery survives serialization; removal requests are supported or clearly routed.
- Form success does not claim list enrollment without list enrollment, or claim failure after an inquiry was already accepted without explaining the distinction.
- Direct Contact access, current-page states, readable inputs, useful empty/error states and no horizontal overflow at narrow widths.
- Old-to-new URL map tested, including monthly archives and routes that remain with Agent Image.
- Actual hosting origin, API route, Resend sender configuration, logo and both email deliveries checked before live signoff.
- Browser evidence is recorded separately from source and mock-test evidence. No claim of visual completion until the rendered pages are inspected.

## What Joel needs to provide later

The two Vercel URLs, which one Jack approved, and the controlled email addresses for the eventual delivery check. No password or API key needs to be pasted into chat. Also confirm whether the current print schedule remains every other month and whether newsletter requests are manually applied to Jack's list; the code currently only sends emails.
