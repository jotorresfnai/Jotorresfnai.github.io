import fs from "fs";

// Sitemap dinâmico: a fonte dos imóveis é o Supabase, não as pastas do GitHub.
const SITE_URL = "https://jotorresfnai.github.io";
const SUPABASE_URL = "https://scmorocdbdyvnxodpwyi.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_W28Qdq8POfYXjCu3BwUxPQ_2z2o2GcM";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Accept: "application/json",
};

async function fetchPublishedProperties() {
  const url =
    `${SUPABASE_URL}/rest/v1/imoveis` +
    `?select=slug,publicado` +
    `&publicado=eq.true` +
    `&slug=not.is.null`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      `Supabase respondeu ${response.status}: ${await response.text()}`,
    );
  }

  return response.json();
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const urls = [
  `${SITE_URL}/`,
  `${SITE_URL}/imoveis.html`,
  `${SITE_URL}/sobre.html`,
  `${SITE_URL}/contacto.html`,
];

const properties = await fetchPublishedProperties();

for (const property of properties) {
  const slug = String(property.slug || "").trim();
  if (!slug) continue;
  urls.push(`${SITE_URL}/imovel.html?slug=${encodeURIComponent(slug)}`);
}

const uniqueUrls = [...new Set(urls)];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls
  .map(
    (url) =>
      `  <url>\n    <loc>${xmlEscape(url)}</loc>\n  </url>`,
  )
  .join("\n")}\n</urlset>\n`;

fs.writeFileSync("sitemap.xml", xml, "utf8");

console.log(`Sitemap gerado com ${uniqueUrls.length} URLs.`);
console.log(`Imóveis publicados incluídos: ${properties.length}`);
console.log(uniqueUrls.join("\n"));
