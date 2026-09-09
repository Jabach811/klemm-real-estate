"""Validate the built site's local URLs, fragment targets, images and public content."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, unquote
import json, re, sys
root = Path(__file__).resolve().parents[1] / 'dist' / 'client'
class Page(HTMLParser):
 def __init__(self):
  super().__init__(); self.refs=[]; self.ids=[]; self.images=[]; self.headings=0; self.mains=0; self.canonical=[]
 def handle_starttag(self, tag, attrs):
  a=dict(attrs)
  if 'id' in a: self.ids.append(a['id'])
  if tag=='img': self.images.append(a)
  if tag=='h1': self.headings+=1
  if tag=='main': self.mains+=1
  if tag=='link' and a.get('rel')=='canonical': self.canonical.append(a.get('href'))
  for key in ('href','src','poster'):
   if a.get(key): self.refs.append(a[key])
pages={}
for file in root.rglob('*.html'):
 page=Page(); page.feed(file.read_text(encoding='utf8')); pages[file.resolve()]=page
errors=[]
for file,page in pages.items():
 name=file.relative_to(root).as_posix()
 if len(page.ids)!=len(set(page.ids)): errors.append(f'{name}: duplicate IDs')
 if page.headings!=1 or page.mains!=1: errors.append(f'{name}: expected one h1 and main')
 if len(page.canonical)!=1: errors.append(f'{name}: expected one canonical URL')
 if any('alt' not in image for image in page.images): errors.append(f'{name}: image without alt text')
 content=file.read_text(encoding='utf8')
 if re.search(r'YOUR_FORM_ID|href="#"|Photo needed|Listing needed|Street address|Content needed|Data needed', content): errors.append(f'{name}: unfinished content')
 for value in page.refs:
  url=urlparse(urljoin('https://local/'+name,value))
  if url.netloc!='local': continue
  target=(root/unquote(url.path.lstrip('/'))).resolve()
  if not target.is_relative_to(root): errors.append(f'{name}: reference escapes build'); continue
  if not target.is_file(): errors.append(f'{name}: missing {value}'); continue
  if url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids: errors.append(f'{name}: missing fragment {value}')
print(json.dumps({'pages':len(pages),'errors':errors},indent=2))
sys.exit(bool(errors))
