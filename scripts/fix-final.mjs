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

  // Remove every legacy textual FNAI watermark element.
  html = html.replace(/\s*<[^>]+class=["'][^"']*\bfnai-watermark\b[^"']*["'][^>]*>\s*FNAI\s*<\/[^>]+>/gi, '');

  // Remove the old textual watermark CSS block when present.
  html = html.replace(/\n\s*\/\*[\s\S]*?FNAI\s+WATERMARK[\s\S]*?\*\/\s*\.fnai-watermark\s*\{[\s\S]*?\}\s*/gi, '\n');

  // Use the real transparent FNAI logo as an overlay.
  if (/property-slideshow|property-image|gallery-slide/.test(html) && !/fnai-logo-watermark-css/.test(html)) {
    const css = `<style id="fnai-logo-watermark-css">
.property-slideshow,.property-image,.gallery-slide{position:relative;}
.property-slideshow::after,.property-image::after,.gallery-slide::after{content:"";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(28%,220px);height:min(28%,220px);background:url("/fnai_logo_transparente.png") center/contain no-repeat;opacity:.8;pointer-events:none;z-index:20;}
</style>`;
    html = html.replace('</head>', `${css}\n</head>`);
  }

  // Keep card buttons aligned at the bottom of cards.
  if (/\.property-card\s*\{/.test(html) && !/\.property-card\s*\{[\s\S]*?display:\s*flex/.test(html)) {
    html = html.replace(/(\.property-card\s*\{)/, '$1\n      display:flex;\n      flex-direction:column;');
  }
  if (/\.property-info\s*\{/.test(html) && !/\.property-info\s*\{[\s\S]*?display:\s*flex/.test(html)) {
    html = html.replace(/(\.property-info\s*\{)/, '$1\n      display:flex;\n      flex-direction:column;\n      flex:1;');
  }
  if (/\.property-button\s*\{/.test(html) && !/\.property-button\s*\{[\s\S]*?margin-top:\s*auto/.test(html)) {
    html = html.replace(/(\.property-button\s*\{)/, '$1\n      margin-top:auto;');
  }

  // Restore the visual layout of the current dynamic cards used on imoveis.html.
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

  // Restore the requested detail-gallery layout: thumbnails outside the main photo, on a light strip.
  if (file === 'imovel.html') {
    const css = `<style id="jo-gallery-thumbnails-restore">
.gallery{overflow:visible!important;margin-bottom:84px!important;}
.thumbs{position:absolute!important;left:0!important;right:0!important;bottom:-72px!important;display:flex!important;gap:8px!important;align-items:center!important;justify-content:flex-start!important;overflow-x:auto!important;padding:10px!important;background:#fff!important;border:1px solid var(--border,#e5e2db)!important;border-radius:10px!important;box-shadow:0 6px 18px rgba(0,0,0,.06)!important;backdrop-filter:none!important;z-index:40!important;}
.thumbs .thumb{width:72px!important;height:52px!important;flex:0 0 72px!important;background:#fff!important;border:2px solid #e1e5e6!important;border-radius:7px!important;opacity:1!important;padding:0!important;overflow:hidden!important;}
.thumbs .thumb.active{border-color:var(--gold,#c9a34a)!important;}
.thumbs .thumb img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;}
@media(max-width:760px){.gallery{margin-bottom:78px!important;}.thumbs{bottom:-66px!important;padding:8px!important;}.thumbs .thumb{width:58px!important;height:44px!important;flex-basis:58px!important;}}
</style>`;
    if (!/jo-gallery-thumbnails-restore/.test(html)) {
      html = html.replace('</head>', `${css}\n</head>`);
    }
  }

  fs.writeFileSync(path.join(ROOT, file), html);
  return html !== before;
}

const changed = [];
for (const file of files) if (fixHtml(file)) changed.push(file);
console.log(changed.length ? changed.join('\n') : 'No changes needed');
