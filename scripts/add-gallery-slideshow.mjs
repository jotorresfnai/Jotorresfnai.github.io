import fs from "fs";
import path from "path";

const ROOT = path.resolve("imoveis");

const CSS = `
.gallery-slider{position:relative;width:100%;background:#fff;border-radius:10px;overflow:hidden}
.gallery-stage{position:relative;width:100%;height:600px;overflow:hidden;background:#07171b}
.gallery-slide{display:none;position:absolute;inset:0;width:100%;height:100%}
.gallery-slide.is-active{display:block}
.gallery-slide img{display:block;width:100%;height:100%;object-fit:cover}
.gallery-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:10;width:44px;height:44px;border:0;border-radius:50%;background:rgba(7,23,27,.72);color:#fff;display:grid;place-items:center;cursor:pointer;font-size:18px}
.gallery-arrow:hover{background:rgba(7,23,27,.94)}
.gallery-arrow.prev{left:14px}.gallery-arrow.next{right:14px}
.gallery-counter{position:absolute;right:14px;top:14px;z-index:10;padding:6px 10px;border-radius:20px;background:rgba(7,23,27,.72);color:#fff;font-size:12px;font-weight:700}
.gallery-thumbs-wrap{position:relative;display:flex;align-items:center;gap:8px;padding:10px 42px;background:#fff}
.gallery-thumbs{display:flex;gap:8px;width:100%;overflow-x:auto;overflow-y:hidden;scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:#c9a34a transparent;padding:1px 0 5px}
.gallery-thumb{flex:0 0 92px;width:92px;height:64px;padding:0;border:2px solid transparent;border-radius:6px;overflow:hidden;background:#fff;cursor:pointer;opacity:.72}
.gallery-thumb:hover{opacity:1}.gallery-thumb.is-active{border-color:#c9a34a;opacity:1}
.gallery-thumb img{display:block;width:100%;height:100%;object-fit:cover}
.gallery-thumb-arrow{position:absolute;z-index:10;top:50%;transform:translateY(-50%);width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.92);color:#07171b;display:grid;place-items:center;cursor:pointer}
.gallery-thumb-arrow.prev{left:7px}.gallery-thumb-arrow.next{right:7px}
@media(max-width:800px){.gallery-stage{height:min(72vw,520px)}.gallery-thumb{flex-basis:76px;width:76px;height:54px}.gallery-thumbs-wrap{padding-left:38px;padding-right:38px}.gallery-arrow{width:38px;height:38px}}
`;

const SCRIPT = `<script>
(function(){
function initGallery(root){
 if(!root||root.dataset.ready==='1')return;
 root.dataset.ready='1';
 const slides=[...root.querySelectorAll('.gallery-slide')];
 const thumbs=[...root.querySelectorAll('.gallery-thumb')];
 const counter=root.querySelector('.gallery-counter');
 const strip=root.querySelector('.gallery-thumbs');
 if(!slides.length)return;
 let index=0,timer=null,busy=false;
 const images=slides.map(s=>s.querySelector('img')).filter(Boolean);
 images.forEach(img=>{img.loading='eager';img.decoding='async';const p=new Image();p.src=img.getAttribute('src')||'';});
 function setActive(n){
   index=(n+slides.length)%slides.length;
   slides.forEach((s,i)=>{s.classList.toggle('is-active',i===index);});
   thumbs.forEach((t,i)=>t.classList.toggle('is-active',i===index));
   if(counter)counter.textContent=(index+1)+' / '+slides.length;
   const a=thumbs[index];
   if(a&&strip)strip.scrollTo({left:Math.max(0,a.offsetLeft-strip.clientWidth/2+a.offsetWidth/2),behavior:'smooth'});
 }
 function show(n,user){
   if(busy)return;
   const next=(n+slides.length)%slides.length;
   if(next===index){if(user)restart();return;}
   const img=images[next];
   const src=img?.getAttribute('src');
   if(!src)return;
   busy=true;
   if(img.complete&&img.naturalWidth>0){setActive(next);busy=false;if(user)restart();return;}
   const done=()=>{setActive(next);busy=false;if(user)restart();};
   const fail=()=>{busy=false;if(user)restart();};
   img.addEventListener('load',done,{once:true});
   img.addEventListener('error',fail,{once:true});
   img.src=src;
 }
 function restart(){clearInterval(timer);if(slides.length>1)timer=setInterval(()=>show(index+1,false),5000)}
 root.querySelector('.gallery-arrow.prev')?.addEventListener('click',()=>show(index-1,true));
 root.querySelector('.gallery-arrow.next')?.addEventListener('click',()=>show(index+1,true));
 thumbs.forEach((t,i)=>t.addEventListener('click',()=>show(i,true)));
 root.querySelector('.gallery-thumb-arrow.prev')?.addEventListener('click',()=>strip?.scrollBy({left:-300,behavior:'smooth'}));
 root.querySelector('.gallery-thumb-arrow.next')?.addEventListener('click',()=>strip?.scrollBy({left:300,behavior:'smooth'}));
 let start=0;
 root.addEventListener('touchstart',e=>start=e.changedTouches[0].clientX,{passive:true});
 root.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-start;if(Math.abs(dx)>45)show(index+(dx<0?1:-1),true)},{passive:true});
 root.addEventListener('mouseenter',()=>clearInterval(timer));
 root.addEventListener('mouseleave',restart);
 setActive(0);restart();
}
function boot(){document.querySelectorAll('.gallery-slider').forEach(initGallery)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
</script>`;

function matchingDivEnd(html,start){let depth=0;const re=/<\/?div\b[^>]*>/gi;re.lastIndex=start;let m;while((m=re.exec(html))){if(/^<div/i.test(m[0]))depth++;else depth--;if(depth===0)return re.lastIndex}return -1}

function extractImages(block){
 const out=[];
 for(const m of block.matchAll(/<img\b[^>]*>/gi)){
   const tag=m[0];
   const src=(tag.match(/\b(?:src|data-src|data-lazy-src|data-original|data-image)=["']([^"']+)["']/i)||[])[1];
   if(src&&!out.some(x=>x.src===src))out.push({src,alt:(tag.match(/\balt=["']([^"']*)["']/i)||[])[1]||"Imóvel"});
 }
 return out;
}

function transformFile(file){
 let html=fs.readFileSync(file,'utf8');
 if(html.includes('class="gallery-slider"'))return false;
 let start=html.indexOf('<div class="property-gallery"');
 if(start<0)start=html.indexOf('<div class="gallery"');
 if(start<0)return false;
 const end=matchingDivEnd(html,start);if(end<0)return false;
 const block=html.slice(start,end),images=extractImages(block);if(!images.length)return false;
 const slides=images.map((x,i)=>`<div class="gallery-slide${i===0?' is-active':''}"><img src="${x.src}" alt="${x.alt.replace(/"/g,'&quot;')}" loading="eager" decoding="async"></div>`).join('\n');
 const thumbs=images.map((x,i)=>`<button type="button" class="gallery-thumb${i===0?' is-active':''}" aria-label="Ver fotografia ${i+1}"><img src="${x.src}" alt="${x.alt.replace(/"/g,'&quot;')}" loading="eager" decoding="async"></button>`).join('\n');
 const replacement=`<div class="gallery-slider" data-gallery-slider><div class="gallery-stage">${slides}<button type="button" class="gallery-arrow prev" aria-label="Fotografia anterior"><i class="fa-solid fa-chevron-left"></i></button><button type="button" class="gallery-arrow next" aria-label="Fotografia seguinte"><i class="fa-solid fa-chevron-right"></i></button><div class="gallery-counter">1 / ${images.length}</div></div><div class="gallery-thumbs-wrap"><button type="button" class="gallery-thumb-arrow prev" aria-label="Miniaturas anteriores"><i class="fa-solid fa-chevron-left"></i></button><div class="gallery-thumbs">${thumbs}</div><button type="button" class="gallery-thumb-arrow next" aria-label="Mais miniaturas"><i class="fa-solid fa-chevron-right"></i></button></div></div>`;
 html=html.slice(0,start)+replacement+html.slice(end);
 if(!html.includes('id="property-gallery-slider-css"'))html=html.replace('</head>',`<style id="property-gallery-slider-css">${CSS}</style>\n</head>`);
 if(!html.includes('function initGallery(root)'))html=html.replace('</body>',`${SCRIPT}\n</body>`);
 fs.writeFileSync(file,html,'utf8');return true;
}

if(fs.existsSync(ROOT)){
 let changed=0;
 for(const dir of fs.readdirSync(ROOT,{withFileTypes:true}).filter(x=>x.isDirectory())){
   const file=path.join(ROOT,dir.name,'index.html');
   if(fs.existsSync(file)&&transformFile(file))changed++;
 }
 console.log(`Slideshow: ${changed} página(s) atualizada(s).`)
}
