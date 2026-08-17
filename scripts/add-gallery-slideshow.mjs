import fs from "fs";
import path from "path";

const ROOT = path.resolve("imoveis");

function transformFile(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  // O gerador atual já cria a galeria/slideshow. Este script é mantido como
  // etapa compatível do workflow e não altera páginas já geradas.
  if (html.includes("gallery-slider")) return false;
  return false;
}

if (fs.existsSync(ROOT)) {
  const pages = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(ROOT, entry.name, "index.html"))
    .filter((file) => fs.existsSync(file));

  let changed = 0;
  for (const file of pages) {
    if (transformFile(file)) changed++;
    console.log(`Galeria verificada: ${path.relative(process.cwd(), file)}`);
  }

  console.log(`Slideshow: verificação concluída (${changed} página(s) alterada(s)).`);
} else {
  console.log("Pasta imoveis ainda não existe; nada a transformar.");
}
