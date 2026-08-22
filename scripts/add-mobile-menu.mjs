import fs from 'fs';
import path from 'path';

const root = process.cwd();
const files = [
  path.join(root, 'index.html'),
  path.join(root, 'imoveis.html'),
  ...(fs.existsSync(path.join(root, 'imovel.html')) ? [path.join(root, 'imovel.html')] : []),
  ...(fs.existsSync(path.join(root, 'imoveis'))
    ? fs.readdirSync(path.join(root, 'imoveis'), { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => path.join(root, 'imoveis', e.name, 'index.html'))
    : [])
];

const CSS = `<style id="mobile-menu-css">
.mobile-menu-toggle{display:none;border:0;background:transparent;color:inherit;width:42px;height:42px;padding:0;align-items:center;justify-content:center;cursor:pointer;font-size:22px;line-height:1}
@media (max-width:760px){
.header{position:relative;min-height:68px;padding:0 5%;gap:12px}
.mobile-menu-toggle{display:flex;flex:0 0 42px;order:3}
.navigation{position:absolute!important;top:100%!important;left:0!important;right:0!important;width:100%!important;display:none!important;flex-direction:column!important;align-items:stretch!important;gap:0!important;padding:8px 5% 12px!important;background:#fff!important;border-top:1px solid rgba(0,0,0,.08);box-shadow:0 12px 25px rgba(0,0,0,.12);z-index:1000}
.navigation.mobile-open{display:flex!important}
.navigation a{display:block!important;padding:10px 4px!important;font-size:15px!important;line-height:1.25!important;text-decoration:none!important;border-bottom:1px solid rgba(0,0,0,.07)}
.navigation .whatsapp{margin-top:8px;text-align:center;border-bottom:0}
}
</style>`;

const JS = `<script id="mobile-menu-js">
(()=>{const init=()=>{const nav=document.getElementById('navigation'),toggle=document.getElementById('mobileMenuToggle');if(!nav||!toggle||toggle.dataset.ready==='1')return;toggle.dataset.ready='1';const close=()=>{nav.classList.remove('mobile-open');toggle.setAttribute('aria-expanded','false')};toggle.addEventListener('click',()=>{const open=!nav.classList.contains('mobile-open');nav.classList.toggle('mobile-open',open);toggle.setAttribute('aria-expanded',String(open))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});window.addEventListener('resize',()=>{if(window.innerWidth>760)close()})};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})();
</script>`;

const links = `<a href="/">Início</a><a href="/#sobre">Sobre</a><a href="/imoveis.html">Imóveis</a><a href="/#contactos">Contactos</a><a class="whatsapp" href="https://wa.me/41792601145" target="_blank" rel="noopener">WhatsApp</a>`;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const navMatch = html.match(/<nav\b[^>]*class=["'][^"']*\bnavigation\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/i);
  if (!navMatch) continue;
  const openTag = navMatch[0].match(/^<nav\b[^>]*>/i)?.[0];
  if (!openTag) continue;
  const navTag = /\bid=["']navigation["']/i.test(openTag) ? openTag : openTag.replace(/<nav\b/i,'<nav id="navigation"');
  html = html.replace(navMatch[0], `${navTag}${links}</nav>`);
  if (!/id=["']mobileMenuToggle["']/i.test(html)) {
    html = html.replace(/<nav\b[^>]*id=["']navigation["'][^>]*>/i, '<button id="mobileMenuToggle" class="mobile-menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false"><i class="fa-solid fa-bars" aria-hidden="true"></i></button>\n$&');
  }
  html = html.replace(/\s*<style id="mobile-menu-css">[\s\S]*?<\/style>/i,'');
  html = html.replace(/\s*<script id="mobile-menu-js">[\s\S]*?<\/script>/i,'');
  html = html.replace('</head>',`${CSS}\n</head>`);
  html = html.replace('</body>',`${JS}\n</body>`);
  fs.writeFileSync(file,html,'utf8');
  console.log(`Menu mobile aplicado: ${path.relative(root,file)}`);
}
