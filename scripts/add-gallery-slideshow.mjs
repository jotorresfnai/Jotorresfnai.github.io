import fs from "fs";
import path from "path";

const ROOT = path.resolve("imoveis");

const CSS = `
/* Galeria universal dos imóveis */
.gallery-slider{
  position:relative;
  width:100%;
  background:#07171b;
  border-radius:10px;
  overflow:hidden;
}
.gallery-stage{
  position:relative;
  width:100%;
  height:600px;
  overflow:hidden;
  background:#07171b;
}
.gallery-slide{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  opacity:0;
  visibility:hidden;
  transition:opacity .35s ease;
  pointer-events:none;
}
.gallery-slide.is-active{
  opacity:1;
  visibility:visible;
  pointer-events:auto;
}
.gallery-slide img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
}
.gallery-arrow{
  position:absolute;
  top:50%;
  transform:translateY(-50%);
  z-index:5;
  width:44px;
  height:44px;
  border:0;
  border-radius:50%;
  background:rgba(7,23,27,.72);
  color:#fff;
  display:grid;
  place-items:center;
  cursor:pointer;
  font-size:18px;
  transition:background .2s,transform .2s;
}
.gallery-arrow:hover{background:rgba(7,23,27,.94)}
.gallery-arrow.prev{left:14px}
.gallery-arrow.next{right:14px}
.gallery-counter{
  position:absolute;
  right:14px;
  top:14px;
  z-index:5;
  padding:6px 10px;
  border-radius:20px;
  background:rgba(7,23,27,.72);
  color:#fff;
  font-size:12px;
  font-weight:700;
}
.gallery-thumbs-wrap{
  position:relative;
  display:flex;
  align-items:center;
  gap:8px;
  padding:10px 42px;
  background:#07171b;
}
.gallery-thumbs{
  display:flex;
  gap:8px;
  width:100%;
  overflow-x:auto;
  overflow-y:hidden;
  scroll-behavior:smooth;
  scrollbar-width:thin;
  scrollbar-color:#c9a34a transparent;
  padding:1px 0 5px;
}
.gallery-thumb{
  flex:0 0 92px;
  width:92px;
  height:64px;
  padding:0;
  border:2px solid transparent;
  border-radius:6px;
  overflow:hidden;
  background:#172126;
  cursor:pointer;
  opacity:.72;
}
.gallery-thumb:hover{opacity:1}
.gallery-thumb.is-active{
  border-color:#c9a34a;
  opacity:1;
}
.gallery-thumb img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
}
.gallery-thumb-arrow{
  position:absolute;
  z-index:3;
  top:50%;
  transform:translateY(-50%);
  width:30px;
  height:30px;
  border:0;
  border-radius:50%;
  background:rgba(255,255,255,.92);
  color:#07171b;
  display:grid;
  place-items:center;
  cursor:pointer;
}
.gallery-thumb-arrow.prev{left:7px}
.gallery-thumb-arrow.next{right:7px}
@media(max-width:800px){
  .gallery-stage{height:min(72vw,520px)}
  .gallery-thumb{flex-basis:76px;width:76px;height:54px}
  .gallery-thumbs-wrap{padding-left:38px;padding-right:38px}
  .gallery-arrow{width:38px;height:38px}
}
`;

const SCRIPT = `
<script>
(function(){
  function initGallery(root){
    if(!root || root.dataset.ready==='1') return;
    root.dataset.ready='1';
    const slides=[...root.querySelectorAll('.gallery-slide')];
    const thumbs=[...root.querySelectorAll('.gallery-thumb')];
    const counter=root.querySelector('.gallery-counter');
    const thumbStrip=root.querySelector('.gallery-thumbs');
    if(!slides.length) return;
    let index=0;
    let timer=null;
    function show(next,fromUser){
      index=(next+slides.length)%slides.length;
      slides.forEach((s,i)=>s.classList.toggle('is-active',i===index));
      thumbs.forEach((t,i)=>t.classList.toggle('is-active',i===index));
      if(counter) counter.textContent=(index+1)+' / '+slides.length;
      const active=thumbs[index];
      if(active && thumbStrip){
        const left=active.offsetLeft-thumbStrip.clientWidth/2+active.offsetWidth/2;
        thumbStrip.scrollTo({left:Math.max(0,left),behavior:'smooth'});
      }
      if(fromUser) restart();
    }
    function restart(){
      if(timer) clearInterval(timer);
      if(slides.length>1) timer=setInterval(()=>show(index+1,false),5000);
    }
    const prev=root.querySelector('.gallery-arrow.prev');
    const next=root.querySelector('.gallery-arrow.next');
    if(prev) prev.addEventListener('click',()=>show(index-1,true));
    if(next) next.addEventListener('click',()=>show(index+1,true));
    thumbs.forEach((t,i)=>t.addEventListener('click',()=>show(i,true)));
    const thumbPrev=root.querySelector('.gallery-thumb-arrow.prev');
    const thumbNext=root.querySelector('.gallery-thumb-arrow.next');
    if(thumbPrev) thumbPrev.addEventListener('click',()=>thumbStrip.scrollBy({left:-300,behavior:'smooth'}));
    if(thumbNext) thumbNext.addEventListener('click',()=>thumbStrip.scrollBy({left:300,behavior:'smooth'}));
    let startX=0;
    let endX=0;
    root.addEventListener('touchstart',e=>{startX=e.changedTouches[0].clientX},{passive:true});
    root.addEventListener('touchend',e=>{endX=e.changedTouches[0].clientX;const dx=endX-startX;if(Math.abs(dx)>45) show(index+(dx<0?1:-1),true)},{passive:true});
    root.addEventListener('mouseenter',()=>{if(timer)clearInterval(timer)});
    root.addEventListener('mouseleave',restart);
    show(0,false);
    restart();
  }
  function boot(){document.querySelectorAll('.gallery-slider').forEach(initGallery)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
</script>
`;

function transformFile(filePath){
  let html=fs.readFileSync(filePath,'utf8');
  if(html.includes('class="gallery-slider"')) return false;

  const galleryMatch=html.match(/<div class="gallery">([\s\S]*?)<\/div>/i);
  if(!galleryMatch) return false;

  const images=[...galleryMatch[1].matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
  if(!images.length) return false;

  const slides=images.map((img,i)=>{
    const cleaned=img.replace(/\s+loading="[^"]*"/gi,'');
    return `<div class="gallery-slide${i===0?' is-active':''}">${cleaned}</div>`;
  }).join('\n');

  const thumbs=images.map((img,i)=>{
    const src=(img.match(/\bsrc="([^"]+)"/i)||[])[1]||'';
    const alt=(img.match(/\balt="([^"]*)"/i)||[])[1]||('Fotografia '+(i+1));
    return `<button type="button" class="gallery-thumb${i===0?' is-active':''}" aria-label="Ver fotografia ${i+1}" data-index="${i}"><img src="${src.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" alt="${alt.replace(/"/g,'&quot;')}"></button>`;
  }).join('\n');

  const replacement=`<div class="gallery-slider" data-gallery-slider>\n  <div class="gallery-stage">\n    ${slides}\n    <button type="button" class="gallery-arrow prev" aria-label="Fotografia anterior"><i class="fa-solid fa-chevron-left"></i></button>\n    <button type="button" class="gallery-arrow next" aria-label="Fotografia seguinte"><i class="fa-solid fa-chevron-right"></i></button>\n    <div class="gallery-counter">1 / ${images.length}</div>\n  </div>\n  <div class="gallery-thumbs-wrap">\n    <button type="button" class="gallery-thumb-arrow prev" aria-label="Miniaturas anteriores"><i class="fa-solid fa-chevron-left"></i></button>\n    <div class="gallery-thumbs">${thumbs}</div>\n    <button type="button" class="gallery-thumb-arrow next" aria-label="Mais miniaturas"><i class="fa-solid fa-chevron-right"></i></button>\n  </div>\n</div>`;

  html=html.replace(galleryMatch[0],replacement);

  if(!html.includes('id="property-gallery-slider-css"')){
    html=html.replace('</head>',`<style id="property-gallery-slider-css">${CSS}</style>\n</head>`);
  }
  if(!html.includes('data-gallery-slider')) return false;
  if(!html.includes('function initGallery(root)')){
    html=html.replace('</body>',`${SCRIPT}\n</body>`);
  }

  fs.writeFileSync(filePath,html,'utf8');
  return true;
}

if(fs.existsSync(ROOT)){
  const pages=fs.readdirSync(ROOT,{withFileTypes:true})
    .filter(entry=>entry.isDirectory())
    .map(entry=>path.join(ROOT,entry.name,'index.html'))
    .filter(file=>fs.existsSync(file));

  let changed=0;
  for(const file of pages){
    if(transformFile(file)) changed++;
    console.log(`Galeria verificada: ${path.relative(process.cwd(),file)}`);
  }
  console.log(`Slideshow: ${changed} página(s) atualizada(s).`);
}else{
  console.log('Pasta imoveis ainda não existe; nada a transformar.');
}
