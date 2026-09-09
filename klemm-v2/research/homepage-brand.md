# Approved homepage as V2 brand authority

Reviewed 2026-09-09. Source root: `C:\Dev\Joel's Workspaces\Personal\Work\Jack Klemm Real Estate\Klemm`. All line references below are relative to that root. Read-only source review plus direct inspection of the original windmill poster. No browser rendering, video playback, contrast measurement, or mobile visual verification performed. No source edits.

## Overall judgment

The existing front page has a clear, useful identity: warm paper, traditional but readable headlines, personal local imagery, and direct explanations of what Jack actually does. Its strongest distinction is Jack's personal responsibility, not decorative luxury. Carry this into the interior pages rather than inventing a second visual language. A compact interior page can match without repeating the full-screen hero.

## Reuse contract

The homepage base tag at `home/index.html:4` resolves its relative stylesheet to `site/styles.css`. The similarly named company-brand ZIP was also checked: its readme describes Joel's separate Studio business (Instrument Serif/Hanken Grotesk, teal/orange), not Jack's approved identity. Exclude it from Klemm brand decisions.

| Element | Exact source | V2 rule |
|---|---|---|
| Background | `site/styles.css:2-3`: paper `#F6F1E8`, deeper paper `#EFE8DB` | Main reading surface remains light warm paper; deeper paper separates sections/forms. |
| Text and borders | `site/styles.css:4-7`: ink `#1B1712`, secondary `#5F574B`, brick `#A03D22`, hairline `#DCD2C0` | Use ink for reading, brick sparingly for links/active state. Hairlines organize content. |
| Headings | `site/styles.css:8,113-123`: Libre Caslon Display; homepage title 44–84px, line-height 1.04, 17ch width | Preserve family and natural short headlines. Interior titles can be smaller and need less empty space. |
| Body | `site/styles.css:9-10,16-20`: Inter 16px/1.65; Libre Caslon Text for editorial emphasis | Keep Inter for forms, addresses, totals, dates, controls. Caslon Text for short personal quotations and emphasis. |
| Spacing | `site/styles.css:11,240-255`: page inset clamp(20px,5vw,72px), sections 72–140px, copy widths 44–58ch | Keep shared alignment; shorten repetitive interior sections rather than shrinking readable type. |
| Wordmark/header | `site/styles.css:37-66`: sticky paper header, Caslon Text 19px bold, brick “Real Estate,” plain Inter links; menu changes below 1100px | Reuse same header, phone emphasis, menu behavior, and active-page underline. |
| Buttons | `site/styles.css:138-196`: 14px Inter 600 uppercase, 16px × 30px inset, pill radius, ink/cream; brick hover | Keep the recognized button. One dominant action per section; ordinary links for secondary choices. |
| Sections | `home/index.html:42-169` | Strong hierarchy already exists: proof → process → client words → Jack → places → tours. Interior pages should answer their specific question first, then offer proof and a clear next step. |
| Footer/forms | `site/styles.css:475-517,768-899` | Reuse shared footer and field treatment. Retain visible labels, email field, validation, success and error states. Form behavior is a separate audit. |

Gold `#F4C87A` is the hero emphasis/stars color (`site/styles.css:106,123`), not a replacement site accent. Dark testimonial sections exist (`site/styles.css:323`), but do not make every interior page dark to mimic them.

## Hero and brightness findings

- Home hero (`home/index.html:25-39`) uses `home/assets/klemm-hero-loop.mp4` with `home/assets/Klemm windmill hero.png` poster. Title, review line and short service paragraph sit over it, with a single valuation button. Height is min(92vh,860px), image crop 62% 40% (`site/styles.css:70-90`). Mobile overrides use 100svh minus header, 38–55px title (`site/styles.css:745-752`).
- Directly viewed original poster: broad pale blue sky, warm low sun on the left, vivid green rolling hills and turbines on the right. It is already a bright, warm asset. This is an observation of the image, not of the page/video.
- Home does **not** have the `hero-bright` body class (`home/index.html:20`). Its effective overlay is the later global two-gradient rule with .48→.12 sideways and .76→.13 vertically (`site/styles.css:706`), overriding the earlier hero gradient. Stacked gradients can substantially darken the landscape.
- All five city pages opt into later `hero-bright` treatment (`site/styles.css:904-923`). Mountain House: brightness 1.20, near/mid scrim .82/.50, left .50 (`cities/mountain-house/index.html:72`); Manteca: 1.14 and .74/.44 (`cities/manteca/index.html:29`); Lathrop: 1.22 and .78/.46 (`cities/lathrop/index.html:74`); River Islands: 1.26 and .78/.46 (`cities/river-islands/index.html:72`); Woodbridge: 1.16 and .74/.44 (`cities/woodbridge/index.html:86`). These also vary saturation/contrast. This is actual source inconsistency, not proof any individual city looks wrong.
- Best next brightness experiment: an isolated Tracy comparison using the existing directional city treatment, keeping darker protection around the words while exposing more natural sky/landscape. Do not globally lift brightness or change the approved page yet. Inspect moving frames and mobile crop before choosing final values; white text over the bright left sky can lose contrast.
- Preserve per-city image crops: Woodbridge explicitly changes video crop from 34% 40% to 24% 40% on mobile (`cities/woodbridge/index.html:73-82`). Do not flatten this into one universal crop.

## Motion and accessibility already present

`shared/site.js:21-28` adds a background pause/play button and listens to reduced-motion preference. Home's inline code (`home/index.html:235-241`) replaces the video with its poster when reduced motion is initially enabled. The original animated headline rule remains in CSS, but is explicitly disabled later (`site/styles.css:707`); do not assume the approved heading currently animates. The landscape video is the meaningful motion. Home community imagery changes on mouse hover, focus, and click (`home/index.html:213-233`). Global reduced-motion override removes transitions and animations (`site/styles.css:757-760`). Preserve these safeguards and verify in a real browser later.

## Copy that carries the identity

- “One agent who handles all of it.” (`home/index.html:31`)
- “so you're never the general contractor of your own sale.” (`home/index.html:37`)
- “You hand Jack the keys. He hands you back a sold sign.” (`home/index.html:52`)
- “The agent who answers his own phone.” (`home/index.html:117`)
- “He's not a team with his name on it. When you call, you get Jack” (`home/index.html:118`)
- “he knows what your street sold for, not just your ZIP code.” (`home/index.html:128`)
- “Two lines is enough to start.” (`home/index.html:173`)

Keep the personal voice and concrete service details. Avoid generic claims about luxury, seamless journeys or dream homes. Preserve factual caveats such as the tour archive's explicit statement that it does not indicate current availability (`home/index.html:154`). Do not silently strengthen or update numerical claims: 38 years, 3,900+ sales and 123 Zillow reviews are existing copy, not independently verified current facts.

## Tightening opportunities, in priority order

1. Translate the existing brand into compact interior headers, common alignment and readable data/form layouts. Do not redesign the approved homepage to make it match the draft newsletter experiment.
2. Reconcile brightness treatment through a separate comparison as above; not through an unreviewed global edit.
3. Small copy mismatch: the closing form says “Leave your name and number” (`home/index.html:174`) while it also requires email (`home/index.html:181`). A simple reference to contact details would honestly describe the existing requirement. Keep email required.
4. Source maintenance: several hero declarations override earlier rules, and city pages carry local style blocks. V2 should document effective values and eventually centralize shared styles, preserving intentional city differences. Avoid a blind CSS cleanup during design exploration.
5. Verify header density, hero CTA visibility, bright-frame text readability, pause control, forms and narrow-screen reading once browser access is available. These are pending checks, not observed failures.

## Asset anchors and transition boundary

Reuse `home/assets/Klemm windmill hero.png`, `home/assets/klemm-hero-loop.mp4`, `shared/jack/Jack Portrait.jpg`, `shared/listing-prep/staging-detail.jpg`, `home/assets/Tracy City Scape 1.jpg` and existing city photos before considering new art. Header/footer and homepage action links currently deliberately lead to `https://www.klemmre.com/...` (`home/index.html:22,38,108,164-168`). Preserve those destinations in the transitional homepage release; local interior V2 navigation needs an explicitly separate mode until takeover.
