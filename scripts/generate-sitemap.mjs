import fs from "fs";
import path from "path";

const SITE_URL = "https://jotorresfnai.github.io";
const urls = [
  `${SITE_URL}/`,
  `${SITE_URL}/imoveis.html`,
];

const propertiesDir = path.resolve("imoveis");
if (fs.existsSync(propertiesDir)) {
  for (const entry of fs.readdirSync(propertiesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexFile = path.join(propertiesDir, entry.name, "index.html");
    if (fs.existsSync(indexFile)) {
      urls.push(`${SITE_URL}/imoveis/${entry.name}/`);
    }
  }
}

const uniqueUrls = [...new Set(urls)].sort((a, b) => {
  if (a === `${SITE_URL}/`) return -1;
  if (b === `${SITE_URL}/`) return 1;
  if (a === `${SITE_URL}/imoveis.html`) return -1;
  if (b === `${SITE_URL}/imoveis.html`) return 1;
  return a.localeCompare(b);
});

const xmlEscape = value => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&apos;");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls.map(url => `  <url><loc>${xmlEscape(url)}</loc></url>`).join("\n")}\n</urlset>\n`;

fs.writeFileSync("sitemap.xml", xml, "utf8");
console.log(`Sitemap gerado com ${uniqueUrls.length} URLs.`);
console.log(uniqueUrls.join("\n"));
