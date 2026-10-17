from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
root=Path('dist')
class Scan(HTMLParser):
 def __init__(self):super().__init__();self.robots=False;self.refs=[]
 def handle_starttag(self,t,attrs):
  d=dict(attrs)
  if t=='meta' and d.get('name')=='robots':self.robots='noindex' in d.get('content','') and 'nofollow' in d.get('content','')
  for key in ['src','href']:
   if d.get(key):self.refs.append(d[key])
errors=[]
for p in root.rglob('*.html'):
 scan=Scan();scan.feed(p.read_text())
 if not scan.robots:errors.append(f'{p}: missing noindex/nofollow')
 for ref in scan.refs:
  u=urlsplit(ref)
  if u.scheme or u.netloc or not u.path:continue
  target=root/unquote(u.path.lstrip('/')) if u.path.startswith('/') else p.parent/unquote(u.path)
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append(f'{p}: missing {ref}')
assert (root/'robots.txt').read_text()=='User-agent: *\nDisallow: /\n'
assert (root/'CNAME').read_text().strip()=='ron.ideas.willhackett.com'
if errors:raise SystemExit('\n'.join(errors))
print('PASS: all HTML pages noindex/nofollow, local links/assets exist, robots block and custom domain present.')
