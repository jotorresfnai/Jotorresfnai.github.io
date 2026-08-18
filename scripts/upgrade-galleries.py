from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]

CSS = r'''
/* =========================================================
   GALERIA DE IMÓVEIS — SLIDESHOW + MINIATURAS
========================================================= */
.property-gallery{position:relative;width:100%;}
.property-slider{position:relative;height:600px;overflow:hidden;border-radius:10px;background:#07171b;touch-action:pan-y;user-select:none;}
.property-slide{position:absolute;inset:0;opacity:0;visibility:hidden;transition:opacity .35s ease;}
.property-slide.active{opacity:1;visibility:visible;}
.property-slide img{width:100%;height:100%;object-fit:cover;display:block;}
.property-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:5;width:48px;height:48px;border:0;border-radius:50%;background:rgba(7,23,27,.78);color:#fff;display:grid;place-items:center;font-size:18px;cursor:pointer;}
.property-arrow:hover{background:rgba(7,23,27,.96);}
.property-arrow.prev{left:16px;}
.property-arrow.next{right:16px;}
.property-dots{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:5;display:flex;gap:7px;padding:7px 10px;border-radius:20px;background:rgba(7,23,27,.42);backdrop-filter:blur(4px);}
.property-dot{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.55);cursor:pointer;}
.property-dot.active{background:var(--gold);transform:scale(1.25);}
.property-thumbs-wrap{position:relative;margin-top:10px;}
.property-thumbs{display:flex;gap:8px;overflow-x:auto;scroll-behavior:smooth;scrollbar-width:thin;padding:2px 1px 8px;}
.property-thumb{flex:0 0 96px;height:68px;padding:0;border:2px solid transparent;border-radius:6px;overflow:hidden;background:#07171b;cursor:pointer;opacity:.72;}
.property-thumb.active{border-color:var(--gold);opacity:1;}
.property-thumb img{width:100%;height:100%;display:block;object-fit:cover;}
.property-thumbs::-webkit-scrollbar{height:5px;}
.property-thumbs::-webkit-scrollbar-thumb{background:#c9a34a;border-radius:5px;}
@media(max-width:850px){
  .property-slider{height:420px;border-radius:10px;}
  .property-arrow{width:42px;height:42px;font-size:16px;}
  .property-arrow.prev{left:10px;}
  .property-arrow.next{right:10px;}
  .property-thumb{flex-basis:82px;height:58px;}
}
@media(max-width:520px){.property-slider{height:65vw;min-height:300px;max-height:420px;}.property-thumbs{gap:6px;}.property-thumb{flex-basis:78px;height:56px;}}
'''

JS = r'''
<script>
(function(){
  function initGallery(root){
    const slides=[...root.querySelectorAll('.property-slide')];
    const thumbs=[...root.querySelectorAll('.property-thumb')];
    const dots=[...root.querySelectorAll('.property-dot')];
    const thumbStrip=root.querySelector('.property-thumbs');
    const prev=root.querySelector('.property-arrow.prev');
    const next=root.querySelector('.property-arrow.next');
    if(!slides.length) return;
    let index=0, timer=null, startX=0, moved=false;
    function show(n, user){
      index=(n+slides.length)%slides.length;
      slides.forEach((el,i)=>el.classList.toggle('active',i===index));
      thumbs.forEach((el,i)=>el.classList.toggle('active',i===index));
      dots.forEach((el,i)=>el.classList.toggle('active',i===index));
      const t=thumbs[index];
      if(t && user) t.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    }
    function start(){if(slides.length>1){clearInterval(timer);timer=setInterval(()=>show(index+1,false),5000);}}
    function restart(){start();}
    prev?.addEventListener('click',()=>{show(index-1,true);restart();});
    next?.addEventListener('click',()=>{show(index+1,true);restart();});
    thumbs.forEach((t,i)=>t.addEventListener('click',()=>{show(i,true);restart();}));
    dots.forEach((d,i)=>d.addEventListener('click',()=>{show(i,true);restart();}));
    root.addEventListener('mouseenter',()=>clearInterval(timer));
    root.addEventListener('mouseleave',start);
    root.addEventListener('touchstart',e=>{startX=e.changedTouches[0].clientX;moved=false;},{passive:true});
    root.addEventListener('touchmove',()=>{moved=true;},{passive:true});
    root.addEventListener('touchend',e=>{if(!moved)return;const dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>45){show(index+(dx<0?1:-1),true);restart();}},{passive:true});
    show(0,false);start();
  }
  document.querySelectorAll('.property-gallery').forEach(initGallery);
})();
</script>
'''

MARKER = 'property-gallery'


def image_urls(text):
    m = re.search(r'"image"\s*:\s*\[(.*?)\]', text, re.S)
    if not m:
        return []
    return re.findall(r'"(https?://[^"\n]+)"', m.group(1))


def upgrade(path):
    text = path.read_text(encoding='utf-8')
    if MARKER in text:
        return False
    urls = image_urls(text)
    if not urls:
        return False
    title_m = re.search(r'<title>\s*(.*?)\s*</title>', text, re.S)
    alt = title_m.group(1).strip() if title_m else 'Imóvel'
    slides=[]
    thumbs=[]
    dots=[]
    for i,url in enumerate(urls):
        active=' active' if i==0 else ''
        loading='' if i==0 else ' loading="lazy"'
        slides.append(f'      <div class="property-slide{active}"><img src="{url}" alt="{alt}"{loading}></div>')
        thumbs.append(f'      <button class="property-thumb{active}" type="button" aria-label="Fotografia {i+1}"><img src="{url}" alt=""></button>')
        dots.append(f'      <button class="property-dot{active}" type="button" aria-label="Fotografia {i+1}"></button>')
    gallery = '''<div class="property-gallery">\n  <div class="property-slider">\n%s\n    <button class="property-arrow prev" type="button" aria-label="Fotografia anterior"><i class="fa-solid fa-chevron-left"></i></button>\n    <button class="property-arrow next" type="button" aria-label="Fotografia seguinte"><i class="fa-solid fa-chevron-right"></i></button>\n    <div class="property-dots">\n%s\n    </div>\n  </div>\n  <div class="property-thumbs-wrap">\n    <div class="property-thumbs" aria-label="Miniaturas das fotografias">\n%s\n    </div>\n  </div>\n</div>''' % ('\n'.join(slides), '\n'.join(dots), '\n'.join(thumbs))
    text, n = re.subn(r'<div class="gallery">.*?</div>\s*</?\s*', lambda m: gallery + '\n\n', text, count=1, flags=re.S)
    if n == 0:
        return False
    text = text.replace('</style>', CSS + '\n</style>', 1)
    text = text.replace('</body>', JS + '\n</body>', 1)
    path.write_text(text, encoding='utf-8')
    return True


changed=[]
for p in sorted((ROOT/'imoveis').glob('*/index.html')):
    if upgrade(p): changed.append(str(p.relative_to(ROOT)))

print('Updated:', ', '.join(changed) if changed else 'none')
