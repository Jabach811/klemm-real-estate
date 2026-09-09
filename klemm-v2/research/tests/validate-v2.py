from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[2]
PAGES = ROOT / 'implementation'

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.fields, self.ids, self.links = [], set(), []
        self.select = None
        self.option = None
        self.forms = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.add(a['id'])
        if tag == 'form': self.forms.append({k:a.get(k) for k in ['action','method']})
        for key in ['href','src']:
            if a.get(key): self.links.append(a[key])
        if tag in ['input','select','textarea'] and a.get('name'):
            f = {'name':a['name'], 'type':a.get('type', 'text' if tag=='input' else tag), 'required':'required' in a, 'value':a.get('value',''), 'options':[]}
            self.fields.append(f)
            if tag == 'select': self.select = f
        if tag == 'option' and self.select is not None:
            self.option = {'value':a.get('value'), 'text':''}
    def handle_data(self, data):
        if self.option is not None: self.option['text'] += data
    def handle_endtag(self, tag):
        if tag == 'option' and self.option is not None:
            self.option['text']=' '.join(self.option['text'].split())
            self.select['options'].append(self.option)
            self.option=None
        if tag == 'select': self.select=None

def parse(path):
    result=Page();result.feed(path.read_text(encoding='utf-8-sig'));return result
parsed={p.resolve():parse(p) for p in PAGES.rglob('*.html')}
checks={}
for name in ['meet-jack.html','i-want-a-free-cmv.html','buy.html','sell.html','communities.html','reviews.html']:
    original=parse(ROOT/'reference/source-code/site'/('sites.html' if name=='communities.html' else name))
    prototype=parsed[(PAGES/name).resolve()]
    assert original.fields==prototype.fields, f'Form control drift: {name}'
    assert original.forms==prototype.forms, f'Form route drift: {name}'
    checks[name]=len(prototype.fields)
links=0
for path, page in parsed.items():
    for raw in page.links:
        url=urlsplit(raw)
        if url.scheme or url.netloc or url.path.startswith('/'): continue
        target=(path.parent/unquote(url.path)).resolve() if url.path else path
        assert target.exists(), f'Missing local link: {raw}'
        if url.fragment and target in parsed: assert unquote(url.fragment) in parsed[target].ids, f'Missing anchor: {raw}'
        links+=1
subprocess.run(['node','--check',str(PAGES/'v2.js')],check=True)
js=(PAGES/'v2.js').read_text(encoding='utf-8')
assert 'fetch(' not in js and 'XMLHttpRequest' not in js and 'localStorage' not in js
manifest=json.loads((ROOT/'research/source-manifest.json').read_text(encoding='utf-8'))
for item in manifest['files']:
    for folder in [Path(manifest['source_root']),ROOT/'reference/source-code']:
        assert hashlib.sha256((folder/item['path']).read_bytes()).hexdigest()==item['sha256'], f'Source or snapshot changed: {item["path"]}'
print(json.dumps({'exact_form_controls_preserved':checks,'local_links_and_assets_checked':links,'javascript_syntax':'passed','no_network_or_local_storage_in_preview_script':True,'source_and_snapshot_files_unchanged':len(manifest['files'])},indent=2))
