from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
class Quotes(HTMLParser):
 def __init__(self):
  super().__init__(); self.active=None; self.text=[]; self.values={'blockquote':[], 'cite':[]}
 def handle_starttag(self,tag,attrs):
  if tag in self.values:self.active=tag;self.text=[]
 def handle_data(self,data):
  if self.active:self.text.append(data)
 def handle_endtag(self,tag):
  if tag==self.active:self.values[tag].append(' '.join(''.join(self.text).split()));self.active=None
root=Path(__file__).resolve().parents[2]
a,b=Quotes(),Quotes()
a.feed((root/'reference/source-code/site/reviews.html').read_text(encoding='utf-8-sig'))
b.feed((root/'implementation/reviews.html').read_text(encoding='utf-8-sig'))
for tag in a.values:
 assert Counter(a.values[tag])==Counter(b.values[tag]),f'{tag} changed or missing'
assert Counter(zip(a.values['blockquote'],a.values['cite']))==Counter(zip(b.values['blockquote'],b.values['cite'])), 'Quote attribution pairing changed'
assert len(b.values['blockquote'])==15
print('All 15 original excerpts and all 15 attributions preserved exactly (whitespace normalized).')
