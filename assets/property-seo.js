/* SEO dinâmico dos imóveis — Jo Torres */
(function(){
  'use strict';

  function text(v){ return String(v ?? '').replace(/\s+/g,' ').trim(); }
  function absoluteUrl(value){ if(!value) return ''; try { return new URL(value, location.origin).href; } catch(e){ return ''; } }
  function number(v){ var n=Number(v); return Number.isFinite(n) ? n : undefined; }
  function setMeta(selector, value){ if(!value) return; var el=document.querySelector(selector); if(el) el.setAttribute('content', value); }
  function addJsonLd(property, photos){
    var title=text(property.titulo) || 'Imóvel', location=text(property.localizacao || property.endereco);
    var description=text(property.descricao) || (title + (location ? ' em '+location : '') + ' — imóvel disponível através de Jo Torres.');
    var image=(photos||[]).map(function(p){ return absoluteUrl(p.url || p.storage_path); }).filter(Boolean);
    if(!image.length && property.imagem_capa) image=[absoluteUrl(property.imagem_capa)];
    var url=location.href;
    var data={'@context':'https://schema.org','@type':'RealEstateListing','name':title,'description':description.slice(0,500),'url':url,'image':image,'datePosted':property.created_at || undefined,'offers':{'@type':'Offer','url':url,'priceCurrency':'EUR','price':number(property.preco),'availability':'https://schema.org/InStock'},'address':{'@type':'PostalAddress','streetAddress':text(property.endereco),'addressLocality':location,'addressCountry':'PT'}};
    if(number(property.area)!==undefined) data.floorSize={'@type':'QuantitativeValue','value':number(property.area),'unitCode':'MTK'};
    if(number(property.quartos)!==undefined) data.numberOfRooms=number(property.quartos);
    if(number(property.casas_banho)!==undefined) data.numberOfBathroomsTotal=number(property.casas_banho);
    Object.keys(data).forEach(function(k){ if(data[k]===undefined) delete data[k]; }); Object.keys(data.offers).forEach(function(k){ if(data.offers[k]===undefined) delete data.offers[k]; });
    var old=document.getElementById('propertyJsonLd'); if(old) old.remove(); var script=document.createElement('script'); script.type='application/ld+json'; script.id='propertyJsonLd'; script.textContent=JSON.stringify(data); document.head.appendChild(script);
  }
  window.applyPropertySeo=function(property, photos){
    if(!property) return; var title=text(property.titulo) || 'Imóvel', location=text(property.localizacao || property.endereco);
    var description=text(property.descricao) || ('Imóvel disponível através de Jo Torres' + (location ? ' em '+location : '') + '.'); var slug=text(property.slug);
    var url=slug ? location.origin + '/imoveis/' + encodeURIComponent(slug) + '/' : location.href;
    document.title=title + (location ? ' em '+location : '') + ' | Jo Torres'; setMeta('meta[name="description"]', description.slice(0,155));
    var canonical=document.getElementById('canonical'); if(canonical) canonical.setAttribute('href',url); setMeta('#ogUrl',url); setMeta('#ogTitle',document.title); setMeta('#ogDescription',description.slice(0,155));
    var first=(photos||[]).find(function(p){return p.url || p.storage_path;}); var image=first ? absoluteUrl(first.url || first.storage_path) : absoluteUrl(property.imagem_capa);
    if(image){ setMeta('#ogImage',image); setMeta('#twitterImage',image); } setMeta('#twitterTitle',document.title); setMeta('#twitterDescription',description.slice(0,155)); addJsonLd(property,photos);
  };
  function ensureCard(){
    var card=document.querySelector('.card'); if(!card) return; var heading=card.querySelector('h2'); if(heading) heading.style.display='none';
    card.querySelectorAll('.location').forEach(function(el){ el.style.display='none'; });
    var old=card.querySelector('.card-intro'); if(!old){ old=document.createElement('div'); old.className='card-intro'; old.style.cssText='font-size:17px;font-weight:800;line-height:1.35;color:#07171b;margin:0 0 8px;'; card.insertBefore(old,card.firstChild); }
    old.textContent='Gostou deste imóvel?';
    var copy=card.querySelector('.card-copy'); if(!copy){ copy=document.createElement('p'); copy.className='card-copy keep-card-text'; copy.textContent='Posso ajudar com mais informações, esclarecer as suas dúvidas ou agendar uma visita.'; copy.style.cssText='font-size:14px;line-height:1.55;color:#4b5960;margin:0 0 18px;'; card.insertBefore(copy,old.nextSibling); } else copy.style.display='block';
    card.querySelectorAll('p').forEach(function(p){ if(p!==copy && !p.closest('.card-intro') && !p.classList.contains('keep-card-text')) p.style.display='none'; });
    var btn=card.querySelector('.contact-btn'); if(btn){ var textNode=btn.querySelector('span'); if(textNode) textNode.textContent='Fale comigo'; }
  }
  function ensureGalleryThumbnails(){
    var gallery=document.querySelector('.gallery'); if(!gallery) return; var slides=Array.prototype.slice.call(gallery.querySelectorAll('.slide')); if(slides.length<2) return; var thumbs=gallery.querySelector('.gallery-thumbnails');
    if(!thumbs){ thumbs=document.createElement('div'); thumbs.className='gallery-thumbnails'; thumbs.setAttribute('aria-label','Miniaturas'); slides.forEach(function(slide,index){ var source=slide.querySelector('img'); if(!source) return; var b=document.createElement('button'); b.type='button'; b.className='gallery-thumb'; b.dataset.thumb=String(index); b.setAttribute('aria-label','Fotografia '+(index+1)); var im=document.createElement('img'); im.src=source.currentSrc || source.src; im.alt=''; b.appendChild(im); thumbs.appendChild(b); }); gallery.appendChild(thumbs); }
    var styleId='property-gallery-fix-style'; if(!document.getElementById(styleId)){ var style=document.createElement('style'); style.id=styleId; style.textContent='.gallery-thumbnails{position:absolute;left:18px;right:18px;bottom:18px;z-index:35;display:flex;gap:8px;justify-content:center;overflow-x:auto;padding:8px;border-radius:12px;background:rgba(7,23,27,.45);backdrop-filter:blur(4px)}.gallery-thumb{width:72px;height:52px;flex:0 0 72px;padding:0;border:2px solid transparent;border-radius:7px;overflow:hidden;background:#07171b;cursor:pointer;opacity:.8}.gallery-thumb.active{border-color:#c9a34a;opacity:1}.gallery-thumb img{width:100%;height:100%;object-fit:cover;display:block}@media(max-width:760px){.gallery-thumbnails{left:8px;right:8px;bottom:8px;justify-content:flex-start}.gallery-thumb{width:58px;height:44px;flex-basis:58px}}'; document.head.appendChild(style); }
    var buttons=Array.prototype.slice.call(thumbs.querySelectorAll('.gallery-thumb')); buttons.forEach(function(btn){ if(btn.dataset.bound==='1') return; btn.dataset.bound='1'; btn.addEventListener('click',function(){ var next=Number(btn.dataset.thumb), nextSlide=slides[next]; if(!nextSlide) return; slides.forEach(function(s,i){ s.classList.toggle('active',i===next); s.style.display=i===next?'block':''; }); buttons.forEach(function(b,i){ b.classList.toggle('active',i===next); }); }); });
    var activeIndex=slides.findIndex(function(s){ return s.classList.contains('active') || s.style.display==='block'; }); if(activeIndex<0) activeIndex=0; buttons.forEach(function(b,i){ b.classList.toggle('active',i===activeIndex); });
  }
  function ensureWatermarkCss(){ if(document.getElementById('fnai-watermark-fix')) return; var link=document.createElement('link'); link.id='fnai-watermark-fix'; link.rel='stylesheet'; link.href='/watermark-fix.css?v=20260822'; document.head.appendChild(link); }
  function ensureWatermarkElement(){
    var gallery=document.querySelector('.gallery'); if(!gallery || gallery.querySelector('.gallery-watermark')) return;
    if(getComputedStyle(gallery).position==='static') gallery.style.position='relative';
    var img=document.createElement('img'); img.className='gallery-watermark'; img.src='/fnai_logo_transparente.png'; img.alt=''; img.setAttribute('aria-hidden','true'); gallery.appendChild(img);
  }
  function repair(){ ensureCard(); ensureGalleryThumbnails(); ensureWatermarkCss(); ensureWatermarkElement(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',repair,{once:true}); else repair(); new MutationObserver(repair).observe(document.documentElement,{childList:true,subtree:true});
})();
