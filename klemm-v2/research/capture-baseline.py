"""Capture selected source code and an asset inventory, without copying secrets or changing the source."""
from pathlib import Path
from html.parser import HTMLParser
from datetime import datetime, timezone
from urllib.parse import urlsplit
import hashlib
import json
import shutil
import subprocess

SOURCE = Path(r"C:\Dev\Joel's Workspaces\Personal\Work\Jack Klemm Real Estate\Klemm")
WORK = Path(__file__).resolve().parents[1]
SNAPSHOT = WORK / 'reference' / 'source-code'
if SNAPSHOT.exists():
    raise SystemExit('Existing baseline preserved. Create a separately dated snapshot for a later capture.')
SNAPSHOT.mkdir(parents=True)
code_types = {'.html', '.css', '.js', '.mjs', '.json', '.py', '.svg'}
records, assets, pages = [], [], []

class Outline(HTMLParser):
    def __init__(self):
        super().__init__()
        self.base = None
        self.headings = []
        self.links = []
        self.heading = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'base': self.base = attrs.get('href')
        if tag in ('h1', 'h2', 'h3'):
            self.heading = {'level': tag, 'text': ''}
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
    def handle_data(self, text):
        if self.heading is not None: self.heading['text'] += text
    def handle_endtag(self, tag):
        if self.heading is not None and tag == self.heading['level']:
            self.heading['text'] = ' '.join(self.heading['text'].split())
            self.headings.append(self.heading)
            self.heading = None

for folder in ('home', 'site', 'cities', 'shared', 'api', 'tools'):
    for source in sorted((SOURCE / folder).rglob('*')):
        if not source.is_file() or any(part.startswith('.') for part in source.relative_to(SOURCE).parts):
            continue
        relative = source.relative_to(SOURCE)
        if source.suffix.lower() not in code_types:
            assets.append({'path': relative.as_posix(), 'bytes': source.stat().st_size})
            continue
        dest = SNAPSHOT / relative
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, dest)
        records.append({'path': relative.as_posix(), 'bytes': source.stat().st_size, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
        if source.suffix == '.html':
            outline = Outline()
            outline.feed(source.read_text(encoding='utf-8-sig'))
            pages.append({'path': relative.as_posix(), 'base': outline.base, 'headings': outline.headings,
                          'links': outline.links, 'external_hosts': sorted({urlsplit(h).netloc for h in outline.links if urlsplit(h).netloc})})
for name in ('vercel.json', 'site-worker.js'):
    source = SOURCE / name
    shutil.copy2(source, SNAPSHOT / name)
    records.append({'path': name, 'bytes': source.stat().st_size, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
head = subprocess.run(['git', '-c', f'safe.directory={SOURCE}', '-C', str(SOURCE), 'rev-parse', 'HEAD'], capture_output=True, text=True).stdout.strip()
manifest = {'captured_at_utc': datetime.now(timezone.utc).isoformat(), 'source_root': str(SOURCE), 'git_head': head,
            'source_state': 'Working tree contains uncommitted changes; hashes describe actual files, not HEAD alone.',
            'snapshot_scope': 'Selected web source code only. Not a runnable site or release package. Media inventoried, not copied. Secrets, account config, agreements, archives, dist and git metadata excluded.',
            'files': records, 'media_and_other_files': assets}
for filename, value in [('source-manifest.json', manifest), ('page-inventory.json', pages)]:
    (WORK / 'research' / filename).write_text(json.dumps(value, indent=2, ensure_ascii=False), encoding='utf-8')
print(json.dumps({'code_files_preserved': len(records), 'html_pages': len(pages), 'asset_files_inventoried': len(assets), 'snapshot_bytes': sum(r['bytes'] for r in records)}))
