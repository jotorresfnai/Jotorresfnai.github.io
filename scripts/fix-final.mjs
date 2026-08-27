import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const files = [
  'index.html', 'imoveis.html', 'imovel.html',
  ...(fs.existsSync(path.join(ROOT, 'imoveis'))
    ? fs.readdirSync(path.join(ROOT, 'imoveis'), { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => path.join('imoveis', e.name, 'index.html'))
    : [])
].filter(f => fs.existsSync(path.join(ROOT, f)));

function fixHtml(file) {
  let html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const before = html;

  if (!/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']\/?favicon\.svg["']/i.test(html)) {
    html = html.replace('</head>', '  <link rel="icon" type="image/svg+xml" href="/favicon.svg">\n  <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml">\n</head>');
  }

  html = html.replace(/\s*<[^>]+class=["'][^"']*\bfnai-watermark\b[^"']*["'][^>]*>\s*FNAI\s*<\/[^>]+>/gi, '');
  html = html.replace(/\n\s*\/\*[\s\S]*?FNAI\s+WATERMARK[\s\S]*?\*\/\s*\.fnai-watermark\s*\{[\s\S]*?\}\s*/gi, '\n');

  if (/property-slideshow|property-image|gallery-slide/.test(html) && !/fnai-logo-watermark-css/.test(html)) {
    const css = `<style id="fnai-logo-watermark-css">
.property-slideshow,.property-image,.gallery-slide{position:relative;}
.property-slideshow::after,.property-image::after,.gallery-slide::after{content:"";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(28%,220px);height:min(28%,220px);background:url("/fnai_logo_transparente.png") center/contain no-repeat;opacity:.8;pointer-events:none;z-index:20;}
</style>`;
    html = html.replace('</head>', `${css}\n</head>`);
  }

  if (/\.property-card\s*\{/.test(html) && !/\.property-card\s*\{[\s\S]*?display:\s*flex/.test(html)) {
    html = html.replace(/(\.property-card\s*\{)/, '$1\n      display:flex;\n      flex-direction:column;');
  }
  if (/\.property-info\s*\{/.test(html) && !/\.property-info\s*\{[\s\S]*?display:\s*flex/.test(html)) {
    html = html.replace(/(\.property-info\s*\{)/, '$1\n      display:flex;\n      flex-direction:column;\n      flex:1;');
  }
  if (/\.property-button\s*\{/.test(html) && !/\.property-button\s*\{[\s\S]*?margin-top:\s*auto/.test(html)) {
    html = html.replace(/(\.property-button\s*\{)/, '$1\n      margin-top:auto;');
  }

  if (file === 'imoveis.html') {
    const css = `<style id="jo-card-alignment-restore">
.grid{align-items:stretch;}
.card{display:flex;flex-direction:column;height:100%;}
.card-body{display:flex;flex-direction:column;flex:1;}
.card-link{margin-top:auto;}
</style>`;
    if (!/jo-card-alignment-restore/.test(html)) {
      html = html.replace('</head>', `${css}\n</head>`);
    }
  }

  if (file === 'imovel.html') {
    const css = `<style id="jo-gallery-thumbnails-restore-final">
.jo-gallery-wrap{width:100%;position:relative;}
.jo-gallery-wrap>.gallery{margin:0!important;overflow:visible!important;}
.jo-gallery-wrap>.jo-thumbs-out{position:static!important;display:flex!important;gap:8px!important;align-items:center!important;justify-content:flex-start!important;overflow-x:auto!important;overflow-y:hidden!important;width:100%!important;min-height:72px!important;padding:10px!important;margin-top:12px!important;background:#fff!important;border:1px solid var(--border,#e5e2db)!important;border-radius:10px!important;box-shadow:0 6px 18px rgba(0,0,0,.06)!important;backdrop-filter:none!important;z-index:auto!important;}
.jo-gallery-wrap>.jo-thumbs-out .thumb{width:72px!important;height:52px!important;flex:0 0 72px!important;padding:0!important;background:#f7f5f0!important;border:2px solid #e1e5e6!important;border-radius:7px!important;overflow:hidden!important;opacity:1!important;visibility:visible!important;display:block!important;}
.jo-gallery-wrap>.jo-thumbs-out .thumb.active{border-color:var(--gold,#c9a34a)!important;}
.jo-gallery-wrap>.jo-thumbs-out .thumb img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;opacity:1!important;visibility:visible!important;}
@media(max-width:760px){.jo-gallery-wrap>.jo-thumbs-out{min-height:60px!important;padding:8px!important;margin-top:10px!important}.jo-gallery-wrap>.jo-thumbs-out .thumb{width:58px!important;height:44px!important;flex-basis:58px!important;}}
</style>`;
    html = html.replace(/<style id="jo-gallery-thumbnails-restore">[\s\S]*?<\/style>/i, '');
    html = html.replace(/<style id="jo-gallery-thumbnails-restore-v2">[\s\S]*?<\/style>/i, '');
    html = html.replace(/<style id="jo-gallery-thumbnails-restore-v3">[\s\S]*?<\/style>/i, '');
    html = html.replace(/<style id="jo-gallery-thumbnails-restore-final">[\s\S]*?<\/style>/i, '');
    if (!/jo-gallery-thumbnails-restore-final/.test(html)) {
      html = html.replace('</head>', `${css}\n</head>`);
    }

    const js = `<script id="jo-gallery-thumbnails-restore-final-js">
(function(){
  const API='https://scmorocdbdyvnxodpwyi.supabase.co';
  const KEY='sb_publishable_W28Qdq8POfYXjCu3BwUxPQ_2z2o2GcM';
  const slug=new URLSearchParams(location.search).get('slug');
  if(!slug)return;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  async function json(url){const r=await fetch(url,{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});if(!r.ok)throw new Error('Supabase '+r.status);return r.json();}
  async function ensure(){
    const app=document.getElementById('app');
    const gallery=app?.querySelector('.gallery');
    if(!app||!gallery)return;
    let thumbs=gallery.querySelector('.thumbs');
    let wrap=app.querySelector('.jo-gallery-wrap');
    if(!wrap){wrap=document.createElement('div');wrap.className='jo-gallery-wrap';gallery.parentNode.insertBefore(wrap,gallery);wrap.appendChild(gallery);}
    if(thumbs){
      if(thumbs.dataset.moved!=='1'){
        const out=document.createElement('div');out.className='jo-thumbs-out';
        while(thumbs.firstChild)out.appendChild(thumbs.firstChild);
        thumbs.remove();wrap.appendChild(out);out.dataset.moved='1';
      }
      return;
    }
    const props=await json(API+'/rest/v1/imoveis?select=id,titulo,imagem_capa&slug=eq.'+encodeURIComponent(slug)+'&publicado=eq.true&limit=1');
    if(!props.length)return;
    const photos=await json(API+'/rest/v1/imovel_fotos?select=ordem,url&imovel_id=eq.'+encodeURIComponent(props[0].id)+'&order=ordem.asc');
    const rows=[];
    if(props[0].imagem_capa)rows.push({url:props[0].imagem_capa});
    for(const p of photos){if(p.url&&!rows.some(x=>x.url===p.url))rows.push(p);}
    if(rows.length<2)return;
    const out=document.createElement('div');out.className='jo-thumbs-out';
    out.innerHTML=rows.map((x,i)=>'<button type="button" class="thumb '+(i===0?'active':'')+'" data-i="'+i+'"><img src="'+esc(x.url)+'" alt="'+esc(props[0].titulo||'Imóvel')+' - fotografia '+(i+1)+'"></button>').join('');
    wrap.appendChild(out);
    const main=document.getElementById('mainImage');
    const buttons=[...out.querySelectorAll('.thumb')];
    let index=0;
    const show=n=>{index=(n+rows.length)%rows.length;if(main)main.src=rows[index].url;buttons.forEach((b,k)=>b.classList.toggle('active',k===index));};
    buttons.forEach((b,k)=>b.addEventListener('click',()=>show(k)));
    if(!gallery.querySelector('.jo-fallback-controls')){
      const controls=document.createElement('div');controls.className='controls jo-fallback-controls';controls.innerHTML='<button type="button" aria-label="Fotografia anterior"><i class="fa-solid fa-chevron-left"></i></button><button type="button" aria-label="Fotografia seguinte"><i class="fa-solid fa-chevron-right"></i></button>';
      gallery.appendChild(controls);
      controls.children[0].onclick=()=>show(index-1);controls.children[1].onclick=()=>show(index+1);
    }
  }
  let tries=0;const timer=setInterval(()=>{ensure().catch(e=>console.warn('Galeria do imóvel:',e));if(++tries>60)clearInterval(timer)},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>ensure().catch(()=>{}));else ensure().catch(()=>{});
})();
</script>`;
    html = html.replace(/<script id="jo-gallery-thumbnails-restore-v3-js">[\s\S]*?<\/script>/i, '');
    html = html.replace(/<script id="jo-gallery-thumbnails-restore-final-js">[\s\S]*?<\/script>/i, '');
    html = html.replace('</body>', `${js}\n</body>`);
  }

  fs.writeFileSync(path.join(ROOT, file), html);
  return html !== before;
}

const changed=[];
for(const file of files) if(fixHtml(file)) changed.push(file);
console.log(changed.length?changed.join('\n'):'No changes needed');
