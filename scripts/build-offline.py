from pathlib import Path
import re,base64,json,sys,zipfile
root=Path('dist');dest=Path(sys.argv[1]);dest.parent.mkdir(parents=True,exist_ok=True)
def inline(html):
 def css(m):
  p=root/m[1].lstrip('/');s=p.read_text();s=re.sub(r'@import[^;]*;','',s);return '<style>'+s+'</style>'
 html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',css,html)
 html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+ (root/m[1].lstrip('/')).read_text().replace('</script','<\\/script')+'</script>',html)
 svg='data:image/svg+xml;base64,'+base64.b64encode((root/'landing/canoe.svg').read_bytes()).decode();html=html.replace('/landing/canoe.svg',svg)
 html=re.sub(r'<link rel="icon"[^>]*>','',html)
 return html
pages={}
for r in ['uk','au']:
 for partner in [False,True]:
  key=r+('-firms' if partner else '')
  html=inline((root/r/('partners/index.html' if partner else 'index.html')).read_text())
  html=html.replace('href="/?region=', 'target="_top" href="?region=')
  for rr in ['uk','au']:
   html=html.replace('href="/'+rr+'/partners/"','target="_top" href="?region='+rr+'#proposal-firms"').replace('href="/'+rr+'/"','target="_top" href="?region='+rr+'#proposal"')
  pages[key]=html
html=inline((root/'index.html').read_text())
html=html.replace('href="/${region}/"','href="?region=${region}#proposal"').replace("a.href='/'+region+'/'", "a.href='?region='+region+'#proposal'")
encoded=json.dumps(pages).replace('<','\\u003c')
bridge='''<script>window.RON_OFFLINE_PROPOSALS=PAYLOAD;const offlineDynamic=window.ronDynamic;window.ronDynamic=function(v){if(v==='proposal'||v==='proposal-firms'){const key=(window.RON_REGION||'uk')+(v==='proposal-firms'?'-firms':'');return '<a class="back-link" href="#tour">← Back to demo</a><iframe title="Startup proposal" style="width:100%;height:88vh;border:0" srcdoc="'+esc(window.RON_OFFLINE_PROPOSALS[key])+'"></iframe>'}return offlineDynamic(v)};render();</script>'''.replace('PAYLOAD',encoded)
html=html.replace('</body>',bridge+'</body>');dest.write_text(html)
readme='''RON — ADVISER DEMO & STARTUP PROPOSAL\n\nOpen ron-adviser-proposal.html in a modern browser. No installation or server is required.\n\nChoose UK or Australia, then start the six-step feature tour. The startup proposal websites are embedded in the same file. Your example changes stay in the browser.\n\nThis is a proposal using fictional data. AI extraction, external systems, calls, DocuSign, trades and submissions are simulated. The curated rules were checked on 17 October 2026; this is not comprehensive tax software or professional advice.\n\nUse Reset prototype to restore the examples. Official-source links require internet access. Some managed email/browser policies may block HTML attachments; use the hosted demo instead where permitted.\n'''
(dest.parent/'ron-demo-readme.txt').write_text(readme)
with zipfile.ZipFile(dest.parent/'ron-adviser-demo.zip','w',zipfile.ZIP_DEFLATED) as z:z.write(dest,dest.name);z.writestr('READ ME FIRST.txt',readme)
print('Built standalone adviser proposal and demo:',dest)
