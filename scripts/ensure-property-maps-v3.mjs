import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PROPERTIES_DIR = path.join(ROOT, 'imoveis');

function mapBlock(address) {
  const encoded = encodeURIComponent(address || 'Portugal');
  return `\n<section class="map-section" data-map-section>\n  <h2>Localização</h2>\n  <iframe src="https://www.google.com/maps?q=${encoded}&output=embed" width="100%" height="360" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>\n</section>\n`;
}
function ensureMap(html) {
  if (/data-map-section/.test(html) && /https:\/\/www\.google\.com\/maps\?q=/.test(html) && /<iframe[\s\S]*?google\.com\/maps/.test(html)) return html;
  const m = html.match(/(?:data-address|itemprop=["']address["']|class=["'][^"']*address[^"']*["'])[^>]*>([\s\S]*?)<\//i);
  const address = m ? m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : 'Portugal';
  const block = mapBlock(address);
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${block}\n</body>`) : `${html}\n${block}`;
}
if (!fs.existsSync(PROPERTIES_DIR)) throw new Error('Diretório imoveis não existe.');
const pages = fs.readdirSync(PROPERTIES_DIR, {withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>path.join(PROPERTIES_DIR,e.name,'index.html')).filter(fs.existsSync);
if (!pages.length) throw new Error('Nenhuma página de imóvel encontrada.');
for (const file of pages) {
  const updated = ensureMap(fs.readFileSync(file,'utf8'));
  fs.writeFileSync(file, updated);
  if (!/data-map-section/.test(updated) || !/https:\/\/www\.google\.com\/maps\?q=/.test(updated) || !/<iframe[\s\S]*?google\.com\/maps/.test(updated)) throw new Error(`MAPA AUSENTE APÓS CORREÇÃO: ${file}`);
}
console.log(`Mapas verificados: ${pages.length} páginas.`);
