import fs from "fs";
import path from "path";

const SUPABASE_URL = "https://scmorocdbdyvnxodpwyi.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_W28Qdq8POfYXjCu3BwUxPQ_2z2o2GcM";

const SITE_URL = "https://jotorresfnai.github.io";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function js(value) {
  return JSON.stringify(value ?? "")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function money(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Preço sob consulta";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return esc(value);
  }

  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(number);
}

async function supabase(pathname) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${pathname}`,
    {
      headers
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Supabase ${response.status}: ${text}`
    );
  }

  return response.json();
}

function cleanSlug(slug, id) {
  const value = String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");

  if (value) {
    return value
      .replace(/[^a-z0-9À-ÿ_-]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  return `imovel-${id}`;
}

function propertyUrl(slug) {
  return `${SITE_URL}/imoveis/${slug}/`;
}

function buildJsonLd(property, photos, slug) {
  const images = photos
    .map(photo => photo.url)
    .filter(Boolean);

  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.titulo || "Imóvel",
    "description":
      property.seo_descricao ||
      property.descricao ||
      "",
    "url": propertyUrl(slug),
    "image": images.length
      ? images
      : property.imagem_capa
        ? [property.imagem_capa]
        : [],
    "datePosted":
      property.created_at || undefined,
    "address": {
      "@type": "PostalAddress",
      "addressLocality":
        property.localizacao || "",
      "streetAddress":
        property.endereco || ""
    },
    "offers": {
      "@type": "Offer",
      "price":
        property.preco !== null &&
        property.preco !== undefined
          ? String(property.preco)
          : undefined,
      "priceCurrency": "EUR",
      "url": propertyUrl(slug)
    }
  };

  if (property.quartos !== null &&
      property.quartos !== undefined) {
    data.numberOfRooms = Number(property.quartos);
  }

  return JSON.stringify(data, null, 2);
}

function buildGallery(property, photos) {
  const urls = [];

  if (property.imagem_capa) {
    urls.push(property.imagem_capa);
  }

  for (const photo of photos) {
    if (
      photo.url &&
      !urls.includes(photo.url)
    ) {
      urls.push(photo.url);
    }
  }

  if (!urls.length) {
    return `
      <div class="gallery-empty">
        <i class="fa-solid fa-house"></i>
        <span>Imagem não disponível</span>
      </div>
    `;
  }

  return `
    <div class="gallery">
      ${urls
        .map(
          (url, index) => `
          <img
            src="${esc(url)}"
            alt="${esc(property.titulo || "Imóvel")}"
            ${index === 0 ? "" : 'loading="lazy"'}
          >
        `
        )
        .join("")}
    </div>
  `;
}

function buildFeatures(property) {
  const items = [];

  if (
    property.quartos !== null &&
    property.quartos !== undefined
  ) {
    items.push(`
      <div class="feature">
        <i class="fa-solid fa-bed"></i>
        <strong>${esc(property.quartos)}</strong>
        <span>Quartos</span>
      </div>
    `);
  }

  if (
    property.casas_banho !== null &&
    property.casas_banho !== undefined
  ) {
    items.push(`
      <div class="feature">
        <i class="fa-solid fa-bath"></i>
        <strong>${esc(property.casas_banho)}</strong>
        <span>Casas de banho</span>
      </div>
    `);
  }

  if (
    property.area !== null &&
    property.area !== undefined &&
    property.area !== ""
  ) {
    items.push(`
      <div class="feature">
        <i class="fa-solid fa-ruler-combined"></i>
        <strong>${esc(property.area)}</strong>
        <span>m²</span>
      </div>
    `);
  }

  if (property.garagem) {
    items.push(`
      <div class="feature">
        <i class="fa-solid fa-car"></i>
        <strong>Sim</strong>
        <span>Garagem</span>
      </div>
    `);
  }

  if (property.piscina) {
    items.push(`
      <div class="feature">
        <i class="fa-solid fa-person-swimming"></i>
        <strong>Sim</strong>
        <span>Piscina</span>
      </div>
    `);
  }

  return items.join("");
}

function buildTags(property) {
  const tags = [];

  if (property.tipo) {
    tags.push(property.tipo);
  }

  if (property.estado) {
    tags.push(property.estado);
  }

  if (property.luxo) {
    tags.push("Imóvel de luxo");
  }

  if (property.categoria_energetica) {
    tags.push(
      `Classe energética ${property.categoria_energetica}`
    );
  }

  return tags
    .map(
      tag => `
        <span class="tag">
          <i class="fa-solid fa-check"></i>
          ${esc(tag)}
        </span>
      `
    )
    .join("");
}

function buildPage(property, photos, slug) {
  const title =
    property.seo_titulo ||
    `${property.titulo || "Imóvel"} | Jo Torres`;

  const description =
    property.seo_descricao ||
    property.descricao ||
    `${property.titulo || "Imóvel"} disponível através de Jo Torres, consultor imobiliário em Portugal.`;

  const canonical = propertyUrl(slug);

  const jsonLd =
    buildJsonLd(property, photos, slug);

  const gallery =
    buildGallery(property, photos);

  const features =
    buildFeatures(property);

  const tags =
    buildTags(property);

  const address =
    property.endereco ||
    property.localizacao ||
    "";

  const mapUrl = address
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        address
      )}&output=embed`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-PT">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>${esc(title)}</title>

<meta
  name="description"
  content="${esc(description)}"
>

<meta
  name="robots"
  content="index, follow"
>

<link
  rel="canonical"
  href="${esc(canonical)}"
>

<meta
  property="og:type"
  content="website"
>

<meta
  property="og:url"
  content="${esc(canonical)}"
>

<meta
  property="og:title"
  content="${esc(title)}"
>

<meta
  property="og:description"
  content="${esc(description)}"
>

<meta
  property="og:locale"
  content="pt_PT"
>

${
  property.imagem_capa
    ? `
<meta
  property="og:image"
  content="${esc(property.imagem_capa)}"
>
`
    : ""
}

<meta
  name="twitter:card"
  content="summary_large_image"
>

<meta
  name="twitter:title"
  content="${esc(title)}"
>

<meta
  name="twitter:description"
  content="${esc(description)}"
>

${
  property.imagem_capa
    ? `
<meta
  name="twitter:image"
  content="${esc(property.imagem_capa)}"
>
`
    : ""
}

<script type="application/ld+json">
${jsonLd}
</script>

<link
  rel="preconnect"
  href="https://fonts.googleapis.com"
>

<link
  rel="preconnect"
  href="https://fonts.gstatic.com"
  crossorigin
>

<link
  href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap"
  rel="stylesheet"
>

<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
>

<style>

:root{
  --dark:#07171b;
  --gold:#c9a34a;
  --gold-light:#e2c477;
  --cream:#f7f5f0;
  --text:#172126;
  --muted:#687277;
  --border:#e5e2db;
}

*{
  box-sizing:border-box;
}

html{
  scroll-behavior:smooth;
}

body{
  margin:0;
  font-family:"DM Sans",Arial,sans-serif;
  color:var(--text);
  background:#fff;
}

a{
  color:inherit;
  text-decoration:none;
}

.header{
  height:82px;
  background:var(--dark);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 5vw;
}

.logo{
  display:flex;
  align-items:center;
  gap:12px;
}

.logo-circle{
  width:45px;
  height:45px;
  border:1px solid var(--gold);
  border-radius:50%;
  display:grid;
  place-items:center;
  color:var(--gold-light);
  font-family:"Playfair Display",serif;
  font-weight:700;
}

.logo-text strong{
  display:block;
  letter-spacing:2px;
}

.logo-text span{
  display:block;
  color:#b9c2c4;
  font-size:9px;
  letter-spacing:1.5px;
  margin-top:3px;
}

.navigation{
  display:flex;
  align-items:center;
  gap:25px;
}

.navigation a{
  font-size:13px;
}

.navigation a:hover{
  color:var(--gold-light);
}

.whatsapp{
  border:1px solid rgba(201,163,74,.7);
  padding:10px 16px;
  border-radius:25px;
}

.container{
  width:min(1200px,92%);
  margin:auto;
  padding:30px 0 90px;
}

.back{
  display:inline-flex;
  align-items:center;
  gap:8px;
  color:var(--muted);
  font-weight:700;
  margin-bottom:25px;
}

.back:hover{
  color:var(--gold);
}

.gallery{
  display:grid;
  grid-template-columns:2fr 1fr;
  gap:5px;
  height:600px;
  overflow:hidden;
  border-radius:10px;
  background:#07171b;
}

.gallery img{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}

.gallery img:first-child{
  grid-row:span 2;
}

.gallery img:nth-child(n+4){
  display:none;
}

.gallery-empty{
  height:600px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  color:#fff;
  gap:15px;
  font-size:20px;
}

.gallery-empty i{
  font-size:45px;
  color:var(--gold-light);
}

.main-grid{
  display:grid;
  grid-template-columns:minmax(0,1fr) 340px;
  gap:55px;
  margin-top:45px;
}

.eyebrow{
  color:var(--gold);
  font-size:11px;
  letter-spacing:3px;
  font-weight:800;
  text-transform:uppercase;
}

h1{
  font-family:"Playfair Display",serif;
  font-size:clamp(42px,5vw,68px);
  line-height:1.05;
  margin:8px 0 12px;
}

.location{
  color:var(--muted);
  font-size:16px;
}

.location i{
  color:var(--gold);
}

.price{
  font-size:32px;
  font-weight:800;
  margin:25px 0;
}

.features{
  display:grid;
  grid-template-columns:repeat(5,1fr);
  border-top:1px solid var(--border);
  border-bottom:1px solid var(--border);
  margin-bottom:30px;
}

.feature{
  text-align:center;
  padding:18px 7px;
  border-right:1px solid var(--border);
}

.feature:last-child{
  border-right:0;
}

.feature i{
  color:var(--gold);
  display:block;
  margin-bottom:7px;
}

.feature strong{
  display:block;
  font-size:16px;
}

.feature span{
  color:var(--muted);
  font-size:11px;
}

.tags{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-bottom:30px;
}

.tag{
  border:1px solid var(--border);
  padding:7px 10px;
  font-size:12px;
  font-weight:700;
  border-radius:5px;
}

.tag i{
  color:var(--gold);
}

.description,
.address{
  margin-top:35px;
}

.description h2,
.address h2,
.map-section h2{
  font-family:"Playfair Display",serif;
  font-size:32px;
  margin:0 0 15px;
}

.description-text{
  color:#596367;
  font-size:16px;
  line-height:1.9;
  white-space:pre-line;
}

.card{
  background:var(--cream);
  border:1px solid var(--border);
  padding:28px;
  height:max-content;
}

.card h2{
  font-family:"Playfair Display",serif;
  margin-top:0;
}

.card p{
  color:var(--muted);
  line-height:1.7;
}

.contact-btn{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:9px;
  background:var(--dark);
  color:#fff;
  padding:15px;
  border-radius:5px;
  font-weight:800;
  margin-top:20px;
}

.contact-btn:hover{
  background:#0d252b;
}

.fnai-link{
  display:block;
  text-align:center;
  color:#8a6a18;
  font-size:13px;
  font-weight:800;
  margin-top:18px;
}

.map-section{
  margin-top:60px;
}

.map{
  height:450px;
  overflow:hidden;
  border-radius:10px;
  border:1px solid var(--border);
}

.map iframe{
  width:100%;
  height:100%;
  border:0;
}

footer{
  background:#041114;
  color:#fff;
  padding:35px 7vw;
  display:flex;
  justify-content:space-between;
  gap:20px;
}

footer span{
  color:#899496;
  font-size:11px;
}

@media(max-width:850px){

  .navigation a:not(.whatsapp){
    display:none;
  }

  .gallery{
    height:420px;
    grid-template-columns:1fr;
  }

  .gallery img:first-child{
    grid-row:auto;
  }

  .gallery img:nth-child(n+2){
    display:none;
  }

  .main-grid{
    grid-template-columns:1fr;
    gap:30px;
  }

  .features{
    grid-template-columns:repeat(2,1fr);
  }

  .feature{
    border-bottom:1px solid var(--border);
  }

  footer{
    flex-direction:column;
  }

}

</style>

</head>

<body>

<header class="header">

<a
  class="logo"
  href="${SITE_URL}/"
>

<div class="logo-circle">
JT
</div>

<div class="logo-text">

<strong>JO TORRES</strong>

<span>
CONSULTOR IMOBILIÁRIO
</span>

</div>

</a>

<nav class="navigation">

<a href="${SITE_URL}/">
Início
</a>

<a href="${SITE_URL}/imoveis.html">
Imóveis
</a>

<a href="${SITE_URL}/#sobre">
Sobre mim
</a>

<a href="${SITE_URL}/#contacto">
Contacto
</a>

<a
  class="whatsapp"
  href="https://wa.me/41792601145"
  target="_blank"
  rel="noopener"
>

<i class="fa-brands fa-whatsapp"></i>
WhatsApp

</a>

</nav>

</header>

<main class="container">

<a
  class="back"
  href="${SITE_URL}/imoveis.html"
>

<i class="fa-solid fa-arrow-left"></i>

Voltar aos imóveis

</a>

${gallery}

<div class="main-grid">

<section>

<div class="eyebrow">
${esc(property.tipo || "IMÓVEL")}
</div>

<h1>
${esc(property.titulo || "Imóvel")}
</h1>

<div class="location">

<i class="fa-solid fa-location-dot"></i>

${esc(property.localizacao || "")}

</div>

<div class="price">
${money(property.preco)}
</div>

<div class="features">

${features}

</div>

<div class="tags">

${tags}

</div>

<section class="description">

<h2>
Descrição
</h2>

<div class="description-text">
${esc(property.descricao || "Para mais informações, entre em contacto comigo.")}
</div>

</section>

${
  address
    ? `
<section class="address">

<h2>
Localização
</h2>

<p>
${esc(address)}
</p>

</section>
`
    : ""
}

</section>

<aside class="card">

<h2>
Fale comigo
</h2>

<p>
Interessado neste imóvel? Entre em contacto comigo para obter mais informações, agendar uma visita ou esclarecer qualquer questão.
</p>

<a
  class="contact-btn"
  href="https://wa.me/41792601145?text=${encodeURIComponent(
    `Olá Jo Torres, tenho interesse no imóvel "${property.titulo || ""}" (${canonical}).`
  )}"
  target="_blank"
  rel="noopener"
>

<i class="fa-brands fa-whatsapp"></i>

Contactar pelo WhatsApp

</a>

<a
  class="fnai-link"
  href="${property.fnai_url || "#"}"
  ${
    property.fnai_url
      ? 'target="_blank" rel="noopener"'
      : ""
  }
>

<i class="fa-solid fa-building"></i>

Ver informação FNAI

</a>

</aside>

</div>

${
  mapUrl
    ? `
<section class="map-section">

<h2>
Localização no mapa
</h2>

<div class="map">

<iframe
  src="${esc(mapUrl)}"
  loading="lazy"
  title="Mapa da localização do imóvel"
></iframe>

</div>

</section>
`
    : ""
}

</main>

<footer>

<div>
<strong>JO TORRES</strong>
<br>
<span>
CONSULTOR IMOBILIÁRIO
</span>
</div>

<span>
© 2026 Jo Torres. Todos os direitos reservados.
</span>

</footer>

</body>

</html>
`;
}

async function main() {

  console.log("A obter imóveis publicados...");

  const properties = await supabase(
    "imoveis?select=*&publicado=eq.true&order=created_at.desc"
  );

  console.log(
    `Encontrados ${properties.length} imóveis publicados.`
  );

  let photos = [];

  try {
    photos = await supabase(
      "imovel_fotos?select=*&order=ordem.asc"
    );
  } catch (error) {
    console.log(
      "Não foi possível obter fotografias:",
      error.message
    );
  }

  const outputRoot =
    path.join(process.cwd(), "imoveis");

  fs.mkdirSync(outputRoot, {
    recursive: true
  });

  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/imoveis.html`
  ];

  for (const property of properties) {

    const slug =
      cleanSlug(property.slug, property.id);

    const propertyPhotos =
      photos.filter(
        photo =>
          String(photo.imovel_id) ===
          String(property.id)
      );

    const directory =
      path.join(outputRoot, slug);

    fs.mkdirSync(directory, {
      recursive: true
    });

    const html =
      buildPage(
        property,
        propertyPhotos,
        slug
      );

    fs.writeFileSync(
      path.join(directory, "index.html"),
      html,
      "utf8"
    );

    urls.push(propertyUrl(slug));

    console.log(
      `Gerado: /imoveis/${slug}/`
    );
  }

  const today =
    new Date().toISOString().split("T")[0];

  const sitemapEntries =
    urls
      .map(
        url => `
  <url>
    <loc>${esc(url)}</loc>
    <lastmod>${today}</lastmod>
  </url>`
      )
      .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${sitemapEntries}
</urlset>
`;

  fs.writeFileSync(
    path.join(
      process.cwd(),
      "sitemap.xml"
    ),
    sitemap,
    "utf8"
  );

  console.log(
    "sitemap.xml atualizado."
  );
}

main().catch(error => {

  console.error(error);

  process.exit(1);

});
