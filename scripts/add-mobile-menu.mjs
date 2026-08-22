import fs from 'fs';
import path from 'path';

const files = [
  'index.html',
  'imoveis.html',
  ...fs.existsSync('imoveis')
    ? fs.readdirSync('imoveis', { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => path.join('imoveis', entry.name, 'index.html'))
    : []
];

const CSS = `
.mobile-menu-toggle{display:none;border:0;background:none;color:#fff;font-size:28px;width:46px;height:46px;align-items:center;justify-content:center;cursor:pointer}
@media(max-width:760px){
  .mobile-menu-toggle{display:flex}
  .navigation{position:absolute!important;top:100%!important;left:0!important;right:0!important;width:100%!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:0!important;padding:10px 5% 18px!important;background:#07171b!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:translateY(-6px);transition:opacity .2s ease,transform .2s ease,visibility .2s ease;box-shadow:0 14px 28px rgba(0,0,0,.25)}
  .navigation.mobile-open{opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:translateY(0)}
  .navigation a{padding:15px 5px;border-bottom:1px solid rgba(255,255,255,.1);font-size:18px}
  .navigation .whatsapp{margin-top:12px;text-align:center}
}
`;

const JS = `
<script id="site-mobile-menu">
(function(){
  function initMobileMenu(){
    const toggle=document.getElementById('menuToggle');
    const nav=document.getElementById('navigation');
    if(!toggle||!nav||toggle.dataset.menuReady==='1')return;
    toggle.dataset.menuReady='1';
    const close=()=>{nav.classList.remove('mobile-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menu')};
    toggle.addEventListener('click',()=>{const open=nav.classList.toggle('mobile-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu')});
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    window.addEventListener('resize',()=>{if(window.innerWidth>760)close()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMobileMenu);else initMobileMenu();
})();
</script>`;

const MENU_LINKS = `
<a href="/">Início</a>
<a href="/#sobre">Sobre</a>
<a href="/imoveis.html">Imóveis</a>
<a href="/#contactos">Contactos</a>
<a class="whatsapp" href="https://wa.me/41798362510" target="_blank" rel="noopener">WhatsApp</a>`;

function ensureMenuLinks(html) {
  const navMatch = html.match(/<nav\b[^>]*id=["']navigation["'][^>]*>[\s\S]*?<\/nav>/i);
  if (!navMatch) return html;
  const nav = navMatch[0];
  const hasMainLinks = /href=["']\/["'][^>]*>\s*Início\s*</i.test(nav) && /href=["']\/imoveis\.html["']/i.test(nav);
  if (hasMainLinks) return html;

  const whatsapp = nav.match(/<a\b[^>]*class=["'][^"']*\bwhatsapp\b[^"']*["'][^>]*>[\s\S]*?<\/a>/i);
  const whatsappHtml = whatsapp ? whatsapp[0] : '';
  const cleanNav = nav
    .replace(/<a\b[^>]*class=["'][^"']*\bwhatsapp\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<\/nav>\s*$/i, '');
  const finalWhatsapp = whatsappHtml || MENU_LINKS.match(/<a class="whatsapp"[\s\S]*?<\/a>/i)?.[0] || '';
  const links = MENU_LINKS.replace(/<a class="whatsapp"[\s\S]*?<\/a>/i, finalWhatsapp);
  return html.replace(nav, `${cleanNav}${links}</nav>`);
}

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const navMatch = html.match(/<nav\b[^>]*class=["'][^"']*\bnavigation\b[^"']*["'][^>]*>/i) || html.match(/<nav\b[^>]*>/i);
  if (!navMatch) continue;

  const navTag = navMatch[0];
  if (!/\bid=["']navigation["']/i.test(navTag)) {
    const replacement = navTag.replace(/<nav\b/i, '<nav id="navigation"');
    html = html.replace(navTag, replacement);
  }

  html = ensureMenuLinks(html);

  if (!/id=["']menuToggle["']/i.test(html)) {
    const button = `\n<button class="mobile-menu-toggle" id="menuToggle" type="button" aria-label="Abrir menu" aria-expanded="false"><i class="fa-solid fa-bars"></i></button>\n`;
    html = html.replace(/(<nav\b[^>]*id=["']navigation["'][^>]*>)/i, `${button}$1`);
  }

  if (!html.includes('id="site-mobile-menu-css"')) {
    html = html.replace('</head>', `<style id="site-mobile-menu-css">${CSS}</style>\n</head>`);
  }
  if (!html.includes('id="site-mobile-menu"')) {
    html = html.replace('</body>', `${JS}\n</body>`);
  }

  fs.writeFileSync(file, html, 'utf8');
  console.log(`Menu mobile atualizado: ${file}`);
}