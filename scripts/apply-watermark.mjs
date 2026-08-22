import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CSS = `<style id="fnai-logo-watermark-css">
.fnai-watermark { display: none !important; }
.property-image, .property-list-image, .gallery-slide, .gallery-thumb { position: relative; }
.property-image::after, .property-list-image::after, .gallery-slide::after, .gallery-thumb::after {
  content: ""; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: min(28%, 260px); height: min(28%, 260px);
  background: url("/fnai_logo_transparente.png") center / contain no-repeat;
  opacity: .8; pointer-events: none; z-index: 20;
}
.gallery-thumb::after { width: 58%; height: 58%; }
</style>`;
function removeOldTextWatermarks(html) {
  return html.replace(/<([a-z0-9]+)\b[^>]*class=["'][^"']*\bfnai-watermark\b[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, "");
}
function processFile(file) {
  let html = fs.readFileSync(file, "utf8");
  html = removeOldTextWatermarks(html);
  html = html.replace(/\s*<style id="fnai-logo-watermark-css">[\s\S]*?<\/style>/i, "");
  html = html.replace("</head>", `${CSS}\n</head>`);
  fs.writeFileSync(file, html, "utf8");
  return true;
}
const files = [path.join(ROOT,"index.html"),path.join(ROOT,"imoveis.html"),path.join(ROOT,"painel.html"),...(fs.existsSync(path.join(ROOT,"imoveis")) ? fs.readdirSync(path.join(ROOT,"imoveis"),{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>path.join(ROOT,"imoveis",e.name,"index.html")) : [])];
for (const file of files) if (fs.existsSync(file)) { processFile(file); console.log(`Watermark atualizada: ${path.relative(ROOT,file)}`); }
console.log(`Watermark aplicada a ${files.filter(f=>fs.existsSync(f)).length} página(s).`);