/* SEO dinâmico dos imóveis — Jo Torres */
(function(){
  'use strict';

  function text(v){ return String(v ?? '').replace(/\s+/g,' ').trim(); }
  function absoluteUrl(value){
    if(!value) return '';
    try { return new URL(value, location.origin).href; } catch(e){ return ''; }
  }
  function number(v){
    var n=Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  function setMeta(selector, value){
    if(!value) return;
    var el=document.querySelector(selector);
    if(el) el.setAttribute('content', value);
  }
  function addJsonLd(property, photos){
    var title=text(property.titulo) || 'Imóvel';
    var location=text(property.localizacao || property.endereco);
    var description=text(property.descricao) || (title + (location ? ' em '+location : '') + ' — imóvel disponível através de Jo Torres.');
    var image=(photos||[]).map(function(p){ return absoluteUrl(p.url || p.storage_path); }).filter(Boolean);
    if(!image.length && property.imagem_capa) image=[absoluteUrl(property.imagem_capa)];
    var url=location.href;
    var data={
      '@context':'https://schema.org',
      '@type':'RealEstateListing',
      'name':title,
      'description':description.slice(0,500),
      'url':url,
      'image':image,
      'datePosted':property.created_at || undefined,
      'offers':{
        '@type':'Offer',
        'url':url,
        'priceCurrency':'EUR',
        'price':number(property.preco),
        'availability':'https://schema.org/InStock'
      },
      'address':{
        '@type':'PostalAddress',
        'streetAddress':text(property.endereco),
        'addressLocality':location,
        'addressCountry':'PT'
      }
    };
    if(number(property.area)!==undefined) data.floorSize={'@type':'QuantitativeValue','value':number(property.area),'unitCode':'MTK'};
    if(number(property.quartos)!==undefined) data.numberOfRooms=number(property.quartos);
    if(number(property.casas_banho)!==undefined) data.numberOfBathroomsTotal=number(property.casas_banho);
    Object.keys(data).forEach(function(k){ if(data[k]===undefined) delete data[k]; });
    Object.keys(data.offers).forEach(function(k){ if(data.offers[k]===undefined) delete data.offers[k]; });
    var old=document.getElementById('propertyJsonLd');
    if(old) old.remove();
    var script=document.createElement('script');
    script.type='application/ld+json';
    script.id='propertyJsonLd';
    script.textContent=JSON.stringify(data);
    document.head.appendChild(script);
  }
  window.applyPropertySeo=function(property, photos){
    if(!property) return;
    var title=text(property.titulo) || 'Imóvel';
    var location=text(property.localizacao || property.endereco);
    var description=text(property.descricao) || ('Imóvel disponível através de Jo Torres' + (location ? ' em '+location : '') + '.');
    var slug=text(property.slug);
    var url=slug ? location.origin + '/imoveis/' + encodeURIComponent(slug) + '/' : location.href;
    document.title=title + (location ? ' em '+location : '') + ' | Jo Torres';
    setMeta('meta[name="description"]', description.slice(0,155));
    var canonical=document.getElementById('canonical');
    if(canonical) canonical.setAttribute('href',url);
    setMeta('#ogUrl',url); setMeta('#ogTitle',document.title); setMeta('#ogDescription',description.slice(0,155));
    var first=(photos||[]).find(function(p){return p.url || p.storage_path;});
    var image=first ? absoluteUrl(first.url || first.storage_path) : absoluteUrl(property.imagem_capa);
    if(image){ setMeta('#ogImage',image); setMeta('#twitterImage',image); }
    setMeta('#twitterTitle',document.title); setMeta('#twitterDescription',description.slice(0,155));
    addJsonLd(property,photos);
  };
})();
