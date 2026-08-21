/* SEO dinâmico dos imóveis — Jo Torres */
(function(){
  'use strict';

  function text(v){ return String(v ?? '').replace(/\s+/g,' ').trim(); }
  function absoluteUrl(value){
    if(!value) return '';
    try { return new URL(value, window.location.origin).href; } catch(e){ return ''; }
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
  function addJsonLd(property, photos, pageUrl){
    var title=text(property.titulo) || 'Imóvel';
    var locality=text(property.localizacao || property.endereco);
    var description=text(property.descricao) || (title + (locality ? ' em '+locality : '') + ' — imóvel disponível através de Jo Torres.');
    var image=(photos||[]).map(function(p){ return absoluteUrl(p.url || p.storage_path); }).filter(Boolean);
    if(!image.length && property.imagem_capa) image=[absoluteUrl(property.imagem_capa)];
    var data={
      '@context':'https://schema.org',
      '@type':'RealEstateListing',
      'name':title,
      'description':description.slice(0,500),
      'url':pageUrl,
      'image':image,
      'datePosted':property.created_at || undefined,
      'offers':{
        '@type':'Offer',
        'url':pageUrl,
        'priceCurrency':'EUR',
        'price':number(property.preco),
        'availability':'https://schema.org/InStock'
      },
      'address':{
        '@type':'PostalAddress',
        'streetAddress':text(property.endereco),
        'addressLocality':locality,
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
    var locality=text(property.localizacao || property.endereco);
    var description=text(property.descricao) || ('Imóvel disponível através de Jo Torres' + (locality ? ' em '+locality : '') + '.');
    var slug=text(property.slug);
    var pageUrl=slug ? window.location.origin + '/imoveis/' + encodeURIComponent(slug) + '/' : window.location.href;
    document.title=title + (locality ? ' em '+locality : '') + ' | Jo Torres';
    setMeta('meta[name="description"]', description.slice(0,155));
    var canonical=document.getElementById('canonical');
    if(canonical) canonical.setAttribute('href',pageUrl);
    setMeta('#ogUrl',pageUrl); setMeta('#ogTitle',document.title); setMeta('#ogDescription',description.slice(0,155));
    var first=(photos||[]).find(function(p){return p.url || p.storage_path;});
    var image=first ? absoluteUrl(first.url || first.storage_path) : absoluteUrl(property.imagem_capa);
    if(image){ setMeta('#ogImage',image); setMeta('#twitterImage',image); }
    setMeta('#twitterTitle',document.title); setMeta('#twitterDescription',description.slice(0,155));
    addJsonLd(property,photos,pageUrl);
  };
})();
