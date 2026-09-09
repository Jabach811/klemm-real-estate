"""Write a reviewable route proposal. This does not change routing or publish anything."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
entries = []
def add(old, source, proposed, note='', owner='legacy'):
    entries.append({'legacy_path': old, 'v2_source': source, 'proposed_v2_path': proposed,
                    'transition_owner': owner, 'status': 'proposal-not-implemented', 'notes': note})
add('/', 'home/index.html', '/', 'Approved front page; retain current public destination behavior.', 'approved-front')
add('/about/', 'site/meet-jack.html', '/meet-jack/#about', 'Proposed merged page; preserve biography and add stable anchor.')
add('/contact/', 'site/meet-jack.html', '/meet-jack/#contact', 'Direct contact access; no forced biography scroll.')
add('/testimonials/', 'site/reviews.html', '/reviews/', 'Keep complete existing review collection accessible; selected reviews on Meet Jack.')
add('/featured-listings/', 'site/listings.html', '/listings/', 'Current inventory provider remains external until a replacement is verified.')
add('/past-sales/', 'site/past-sales.html', '/past-sales/', 'Keep profile sources, checked dates and representation caveats.')
add('/communities/', 'site/sites.html', '/communities/', 'Retain six community destinations and current aliases.')
add('/delivery-preference/', 'site/newsletters.html', '/newsletters/#signup', 'Must preserve legacy preference/removal fields and print frequency.')
add('/latest-news/', None, None, 'Do not relabel generic news as the monthly newsletter archive; inspect and retain legacy content separately.')
add('/i-want-a-free-show-ready-consultation/', None, None, 'No local equivalent; keep legacy destination until scope/fields are confirmed.')
for slug in ('find-me-a-home', 'find-me-an-investment-property', 'i-want-a-free-cmv', 'i-want-to-sell-my-property'):
    add('/'+slug+'/', 'site/'+slug+'.html', '/'+slug+'/', 'Preserve familiar form intent, labels and all questions; email required.')
for old, folder, proposed in [
    ('tracy','home','/'), ('mountain-house','cities/mountain-house','/mountainhousere.html'),
    ('manteca','cities/manteca','/mantecare.html'), ('lathrop','cities/lathrop','/lathropre.html'),
    ('river-islands-in-lathrop-ca','cities/river-islands','/riverislandsre.html')]:
    add('/communities/'+old+'/', folder+'/index.html', proposed,
        'Preserve legacy nested city URL in addition to approved current alias; exact cutover pending.', 'approved-front/legacy-alias-pending')
data_text = (ROOT / 'reference/source-code/site/newsletters/archive-data.js').read_text(encoding='utf-8-sig')
data = json.loads(data_text.split('=',1)[1].strip().removesuffix(';'))
for slug, sales in data['i']:
    add('/'+slug+'/', 'site/newsletters/'+slug+'.html', '/newsletters/'+slug+'/',
        f'Preserve monthly issue URL and {len(sales)} source sale records.')
result = {'status':'Proposed route ownership; not active configuration',
          'unresolved':'Verify alternate legacy host before domain cutover. www.klemmre.com alone cannot remain a legacy origin when it points at V2.',
          'additional_v2_pages':['/buy/','/sell/','/meet-jack/','/newsletters/','/woodbridgere.html'],
          'routes':entries}
(ROOT / 'plans/route-map.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(f'Saved {len(entries)} proposed legacy route mappings, including {len(data["i"])} monthly issues.')
