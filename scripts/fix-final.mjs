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

  // Keep card buttons on the same bottom line in desktop grids.
  if (/\.property-card\s*\{/.test(html) && !/\.property-card\s*\{[\s\S]*?display:\s*flex/.test(html)) {
    html = html.replace(/(\.property-card\s*\{)/, '$1\n      display:flex;\n      flex-direction:column;');
  }
  if (/\.property-info\s*\{/.test(html) && !/\.property-info\s*\{[\s\S]*?display:\s*flex/.test(html)) {
    html = html.replace(/(\.property-info\s*\{)/, '$1\n      display:flex;\n      flex-direction:column;\n      flex:1;');
  }
  if (/\.property-button\s*\{/.test(html) && !/\.property-button\s*\{[\s\S]*?margin-top:\s*auto/.test(html)) {
    html = html.replace(/(\.property-button\s*\{)/, '$1\n      margin-top:auto;');
  }

  fs.writeFileSync(path.join(ROOT, file), html);
  return html !== before;
}

const changed = [];
for (const file of files) if (fixHtml(file)) changed.push(file);
console.log(changed.length ? changed.join('\n') : 'No changes needed');
