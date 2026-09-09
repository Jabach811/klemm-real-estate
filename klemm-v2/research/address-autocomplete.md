# Address suggestions — integration notes

Scope: all address fields in the current V2 previews. CMV is currently the only built page collecting an address: contact address plus a separate property-for-sale address. Apply this shared component to future buyer-questionnaire and newsletter property/mailing fields as those pages are built. Do not change the approved original site.

Current connection: no live provider configured. Normal forms keep manual address entry. An explicit `?address-demo=1` URL supplies clearly labeled fictional fixtures to review interactions without sending typed addresses to an external service. This is not a real address search or address verification.

Component: `address-autocomplete.js` and `.css`. Opt in a street input with `data-address-autocomplete`. Set `data-address-city`, `data-address-state`, and `data-address-zip` to input IDs within the same form. Grouped fields receive street/city/state/ZIP separately. An address without mapped companions stores the full selected label; never fills another address group. All fields remain editable, including unit details.

Provider contract: set `window.klemmAddressProvider` before the component. `suggest(query)` resolves an array of `{label,street,city,state,zip}`; optional `resolve(item)` obtains details before filling. Provider adapter must handle service-specific session tokens, attribution, permitted use, allowed origins and quotas. Do not add API keys or credentials to research notes.

Google Places is a supported implementation option to evaluate once Joel confirms an account. Its current Autocomplete Data API supports a custom UI and fetches structured details after selection. It requires an API project/key and billing setup; we have not created or enabled billing. Use separate search sessions per address input, local-area bias rather than a hard city restriction, and manual fallback when a result lacks street-level details. Include required attribution/privacy treatment before turning on live suggestions.

Official references checked 2026-09-09:
- https://developers.google.com/maps/documentation/javascript/place-autocomplete-data
- https://developers.google.com/maps/documentation/javascript/get-api-key

Outstanding: provider selection/setup, adapter implementation and real-address browser test. No live lookup is claimed complete.

## Google connection setup (in progress)

Joel requested real wiring on 2026-09-09. Google Cloud opened in the in-app browser but requires his sign-in. No billing enabled or keys created.

Verified global pricing: first 10,000 monthly Autocomplete Requests and first 10,000 Place Details Essentials calls free per respective SKU; initial paid tier $2.83 and $5.00 per 1,000 respectively. A visitor may generate multiple autocomplete requests. Example: 500 visitors x6 requests +500 detail lookups stays within both allowances if no other account usage; 3,000 visitors x6 requests +3,000 details means8,000 excess request events, approximately $22.64 before taxes/other usage. Session rules affect billable requests. Source https://developers.google.com/maps/billing-and-pricing/pricing . This is not a traffic forecast or guaranteed free operation.

Once signed in: select/create Jack's project, establish owner-managed billing, enable Maps JavaScript API and Places API (New), create a browser key restricted to those APIs and exact required website referrers (local127.0.0.1:8766 and approved Vercel host initially; production host when authorized). Set applicable usage quotas and billing alerts; alerts alone do not cap spending. Place browser-restricted key in address-config.js without printing it into tool output. Verify a public nonpersonal street address in both CMV fields. Keep submission preview-only.

Before publication include public privacy/terms coverage of Google service use, required attribution, and verify actual production referrer restrictions. Live provider must request only necessary address fields, not higher-cost displayName/photos/reviews.

Connection code now present: address-config.js (blank browser API key), lazy address-google.js adapter, CMV script wiring and Google Maps result attribution. Separate sessions per input; only formattedAddress/addressComponents fetched, avoiding extra place data. Empty config makes no Google SDK or lookup requests. All current form contracts still pass. Real connection remains pending Google Cloud sign-in, API/billing configuration, restricted key and live test. Do not describe the blank-key adapter as live.

## 2026-09-09 — Google live connection verified

Joel completed Google onboarding and local referrer restriction. Browser confirmed success and free-trial status ($300 /90days shown); no account upgrade performed. Key restricted to Maps JavaScript API and Places API (New), with referrers http://127.0.0.1:8766/* and the exact approved klemm-real-estate-efkto1r1b-c-d-solutions.vercel.app host. Saved settings confirmed HTTP referrers,2APIs. Browser key copied through clipboard directly into implementation/address-config.js; value not printed or recorded in notes.

LIVE browser test at normal CMV URL (without address-demo): public office query returned Google results. Keyboard selection filled street/city/CA/ZIP+4; separate property field stayed blank. Property lookup then resolved full address without changing contact fields. Test inputs cleared by reload. Real address requests were made, but no contact form or email was submitted. Normal CMV is now live for address lookup locally; Vercel files were not deployed.

Remaining before publication: public privacy/terms integration, production host restrictions, deliberate usage quotas/budget alerts. No custom spending cap or alerts have been configured; do not claim otherwise. Existing Google trial status is not a permanent free-use guarantee. Future V2 address forms should use this shared component.
