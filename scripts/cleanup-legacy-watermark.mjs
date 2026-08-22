import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const files = [path.join(ROOT,"index.html"),path.join(ROOT,"imoveis.html"),path.join(ROOT,"painel.html"),path.join(ROOT,"imovel.html"),...(fs.existsSync(path.join(ROOT,"imoveis")) ? fs.readdirSync(path.join(ROOT,"imoveis"),{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>path.join(ROOT,"imoveis",e.name,"index.html")) : [])];
const legacyWatermark = /<([a-z0-9]+)\b[^>]*class=["'][^"']*\bfnai-watermark\b[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi;
let changed=0;
for(const file of files){if(!fs.existsSync(file))continue;const before=fs.readFileSync(file,"utf8");const after=before.replace(legacyWatermark,"");if(after!==before){fs.writeFileSync(file,after,"utf8");changed++;}}
console.log(`Legacy watermark cleanup: ${changed} page(s).`);