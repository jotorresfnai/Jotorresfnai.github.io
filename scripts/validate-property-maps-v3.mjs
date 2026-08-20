import fs from 'node:fs';
import path from 'node:path';
const dir=path.join(process.cwd(),'imoveis');
const pages=fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>path.join(dir,e.name,'index.html')).filter(fs.existsSync);
if(pages.length!==9) throw new Error(`Expected exactly 9 published property pages, found ${pages.length}`);
for(const file of pages){const h=fs.readFileSync(file,'utf8'); if(!h.includes('data-map-section')||!h.includes('google.com/maps?q=')||!h.includes('<iframe')) throw new Error(`MAPA AUSENTE: ${file}`);}
console.log(`OK: ${pages.length} imóveis com mapa.`);
