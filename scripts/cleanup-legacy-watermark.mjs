import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const files = [
  path.join(ROOT, "index.html"),
  path.join(ROOT, "imoveis.html"),
  path.join(ROOT, "painel.html"),
  path.join(ROOT, "imovel.html"),
  ...(fs.existsSync(path.join(ROOT, "imoveis"))
    ? fs.readdirSync(path.join(ROOT, "imoveis"), { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(ROOT, "imoveis", entry.name, "index.html"))
    : [])
];

const legacyWatermark = /<([a-z0-9]+)\b[^>]*class=["'][^"']*\bfnai-watermark\b[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi;

let changed = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(legacyWatermark, "");
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed++;
    console.log(`Watermark antiga removida: ${path.relative(ROOT, file)}`);
  }
}

console.log(`Limpeza de watermark antiga: ${changed} página(s).`);