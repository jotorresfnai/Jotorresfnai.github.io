import fs from "fs";
import path from "path";

const ROOT = path.resolve("imoveis");

const CSS = `
/* =========================================================
   SLIDESHOW DOS IMÓVEIS
========================================================= */
.gallery.gallery-slider {
  position: relative !important;
  display: block !important;
  width: 100% !important;
  height: 600px !important;
  overflow: hidden !important;
  border-radius: 10px !important;
  background: #07171b !important;
}
.gallery.gallery-slider .gallery-slide {
  position: absolute !important;
  inset: 0 !important;
  display: block !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
  transition: opacity .35s ease !important;
}
.gallery.gallery-slider .gallery-slide.active {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}
.gallery.gallery-slider .gallery-slide img {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  margin: 0 !important;
}
.gallery-slider-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: 50%;
  background: rgba(7, 23, 27, .78);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 20px;
  padding: 0;
}
.gallery-slider-button:hover { background: rgba(7, 23, 27, .95); }
.gallery-slider-prev { left: 18px; }
.gallery-slider-next { right: 18px; }
.gallery-slider-dots {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}
.gallery-slider-dot {
  width: 9px;
  height: 9px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(255,255,255,.65);
  cursor: pointer;
}
.gallery-slider-dot.active {
  background: #c9a34a;
  transform: scale(1.2);
}
.gallery-slider-counter {
  position: absolute;
  right: 18px;
  bottom: 16px;
  z-index: 20;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(7,23,27,.72);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
@media (max-width: 760px) {
  .gallery.gallery-slider { height: 430px !important; }
  .gallery-slider-button { width: 44px; height: 44px; }
  .gallery-slider-prev { left: 10px; }
  .gallery-slider-next { right: 10px; }
}
`;

const JS = `
(function () {
  function initGallery(gallery) {
    if (!gallery || gallery.dataset.sliderReady === "true") return;
    const slides = Array.from(gallery.querySelectorAll(".gallery-slide"));
    if (!slides.length) return;
    gallery.dataset.sliderReady = "true";
    let current = 0;
    const dots = Array.from(gallery.querySelectorAll(".gallery-slider-dot"));
    const counter = gallery.querySelector(".gallery-slider-counter");

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
      dots.forEach((dot, i) => dot.classList.toggle("active", i === current));
      if (counter) counter.textContent = (current + 1) + " / " + slides.length;
    }

    const previous = gallery.querySelector(".gallery-slider-prev");
    const next = gallery.querySelector(".gallery-slider-next");
    if (previous) previous.addEventListener("click", () => show(current - 1));
    if (next) next.addEventListener("click", () => show(current + 1));
    dots.forEach((dot, index) => dot.addEventListener("click", () => show(index)));

    let touchStartX = 0;
    let touchStartY = 0;
    gallery.addEventListener("touchstart", event => {
      if (!event.touches.length) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, { passive: true });
    gallery.addEventListener("touchend", event => {
      if (!event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - touchStartX;
      const dy = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      show(dx < 0 ? current + 1 : current - 1);
    }, { passive: true });

    show(0);
  }
  document.querySelectorAll(".gallery.gallery-slider").forEach(initGallery);
})();
`;

function addAssets(html) {
  let result = html;
  if (!result.includes("SLIDESHOW DOS IMÓVEIS")) {
    result = result.includes("</head>")
      ? result.replace("</head>", `<style>${CSS}</style>\n</head>`)
      : `<style>${CSS}</style>\n${result}`;
  }
  if (!result.includes("document.querySelectorAll(\".gallery.gallery-slider\")")) {
    result = result.includes("</body>")
      ? result.replace("</body>", `<script>${JS}</script>\n</body>`)
      : `${result}\n<script>${JS}</script>\n`;
  }
  return result;
}

function buildSlider(galleryHtml) {
  const images = galleryHtml.match(/<img\b[^>]*>/gi) || [];
  if (images.length <= 1) return null;

  const slides = images.map((image, index) => `
    <div class="gallery-slide${index === 0 ? " active" : ""}" data-slide-index="${index}">
      ${image}
    </div>
  `).join("\n");

  const dots = images.map((_, index) =>
    `<button class="gallery-slider-dot${index === 0 ? " active" : ""}" type="button" data-slide-to="${index}" aria-label="Fotografia ${index + 1}"></button>`
  ).join("\n");

  return `
<div class="gallery gallery-slider" data-slider-ready="false">
  ${slides}
  <button class="gallery-slider-button gallery-slider-prev" type="button" aria-label="Fotografia anterior">
    <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
  </button>
  <button class="gallery-slider-button gallery-slider-next" type="button" aria-label="Fotografia seguinte">
    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
  </button>
  <div class="gallery-slider-dots" aria-label="Selecionar fotografia">
    ${dots}
  </div>
  <div class="gallery-slider-counter" aria-live="polite">1 / ${images.length}</div>
</div>
`.trim();
}

function transformFile(filePath) {
  const original = fs.readFileSync(filePath, "utf8");
  if (original.includes('class="gallery gallery-slider"') || original.includes("class='gallery gallery-slider'")) {
    return false;
  }

  const match = original.match(/<div\s+class=["']gallery["'][^>]*>[\s\S]*?<\/div>/i);
  if (!match) return false;

  const slider = buildSlider(match[0]);
  if (!slider) return false;

  let html = original.replace(match[0], slider);
  html = addAssets(html);
  fs.writeFileSync(filePath, html, "utf8");
  return true;
}

function findPropertyPages() {
  if (!fs.existsSync(ROOT)) return [];
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(ROOT, entry.name, "index.html"))
    .filter(file => fs.existsSync(file));
}

const pages = findPropertyPages();
let changed = 0;

for (const file of pages) {
  if (transformFile(file)) {
    changed += 1;
    console.log(`Slideshow aplicado: ${path.relative(process.cwd(), file)}`);
  } else {
    console.log(`Sem alteração: ${path.relative(process.cwd(), file)}`);
  }
}

console.log(`Concluído. ${changed} página(s) atualizada(s) de ${pages.length}.`);
