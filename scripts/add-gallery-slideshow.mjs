import fs from "fs";
import path from "path";

const ROOT = path.resolve("imoveis");

const CSS = `
/* =========================================================
   SLIDESHOW DOS IMÓVEIS
========================================================= */
.gallery.gallery-slider{
  position:relative;
  display:block;
  height:600px;
  overflow:hidden;
  border-radius:10px;
  background:#07171b;
}

.gallery.gallery-slider .gallery-slide{
  position:absolute;
  inset:0;
  opacity:0;
  visibility:hidden;
  transition:opacity .35s ease;
}

.gallery.gallery-slider .gallery-slide.active{
  opacity:1;
  visibility:visible;
}

.gallery.gallery-slider .gallery-slide img{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}

.gallery-slider-btn{
  position:absolute;
  top:50%;
  transform:translateY(-50%);
  z-index:10;
  width:52px;
  height:52px;
  border:0;
  border-radius:50%;
  background:rgba(7,23,27,.78);
  color:#fff;
  display:grid;
  place-items:center;
  cursor:pointer;
  font-size:20px;
  transition:background .2s ease, transform .2s ease;
}

.gallery-slider-btn:hover{
  background:rgba(7,23,27,.95);
}

.gallery-slider-btn.prev{left:18px;}
.gallery-slider-btn.next{right:18px;}

.gallery-slider-dots{
  position:absolute;
  z-index:11;
  left:50%;
  bottom:18px;
  transform:translateX(-50%);
  display:flex;
  gap:7px;
  max-width:90%;
  overflow:hidden;
  padding:3px;
}

.gallery-slider-dot{
  width:9px;
  height:9px;
  padding:0;
  border:0;
  border-radius:50%;
  background:rgba(255,255,255,.65);
  cursor:pointer;
  flex:0 0 9px;
}

.gallery-slider-dot.active{
  background:#c9a34a;
  transform:scale(1.2);
}

.gallery-slider-counter{
  position:absolute;
  z-index:11;
  right:18px;
  bottom:17px;
  color:#fff;
  background:rgba(7,23,27,.68);
  padding:5px 9px;
  border-radius:14px;
  font-size:12px;
  font-weight:700;
}

@media(max-width:760px){
  .gallery.gallery-slider{
    height:420px;
    border-radius:10px;
  }

  .gallery-slider-btn{
    width:44px;
    height:44px;
    font-size:17px;
  }

  .gallery-slider-btn.prev{left:10px;}
  .gallery-slider-btn.next{right:10px;}

  .gallery-slider-dots{
    bottom:14px;
  }
}
`;

const JS = `
<script>
(function(){
  function initGallerySliders(){
    document.querySelectorAll('.gallery.gallery-slider').forEach(function(gallery){
      if(gallery.dataset.sliderReady === '1') return;
      gallery.dataset.sliderReady = '1';

      var slides = Array.from(gallery.querySelectorAll('.gallery-slide'));
      if(slides.length <= 1) return;

      var current = 0;
      var timer = null;

      var dots = Array.from(gallery.querySelectorAll('.gallery-slider-dot'));
      var counter = gallery.querySelector('.gallery-slider-counter');

      function show(index){
        current = (index + slides.length) % slides.length;

        slides.forEach(function(slide, i){
          slide.classList.toggle('active', i === current);
        });

        dots.forEach(function(dot, i){
          dot.classList.toggle('active', i === current);
        });

        if(counter){
          counter.textContent = (current + 1) + ' / ' + slides.length;
        }
      }

      function next(){ show(current + 1); }
      function prev(){ show(current - 1); }

      var nextButton = gallery.querySelector('.gallery-slider-btn.next');
      var prevButton = gallery.querySelector('.gallery-slider-btn.prev');

      if(nextButton) nextButton.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        next();
        restart();
      });

      if(prevButton) prevButton.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        prev();
        restart();
      });

      dots.forEach(function(dot){
        dot.addEventListener('click', function(){
          show(Number(dot.dataset.index || 0));
          restart();
        });
      });

      function start(){
        if(timer) clearInterval(timer);
        timer = setInterval(next, 5000);
      }

      function stop(){
        if(timer){
          clearInterval(timer);
          timer = null;
        }
      }

      function restart(){
        stop();
        start();
      }

      gallery.addEventListener('mouseenter', stop);
      gallery.addEventListener('mouseleave', start);

      var touchStartX = 0;
      var touchStartY = 0;

      gallery.addEventListener('touchstart', function(e){
        if(!e.touches || !e.touches[0]) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        stop();
      }, {passive:true});

      gallery.addEventListener('touchend', function(e){
        if(!e.changedTouches || !e.changedTouches[0]) return;

        var dx = e.changedTouches[0].clientX - touchStartX;
        var dy = e.changedTouches[0].clientY - touchStartY;

        if(Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)){
          if(dx < 0) next();
          else prev();
        }

        start();
      }, {passive:true});

      show(0);
      start();
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initGallerySliders);
  }else{
    initGallerySliders();
  }
})();
</script>
`;

function escapeHtml(value){
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildSlider(inner){
  const imageRegex = /<img\b[^>]*>/gi;
  const images = inner.match(imageRegex) || [];

  if(images.length <= 1){
    return `<div class="gallery">${images.join("")}</div>`;
  }

  const slides = images.map((img, index) => `
    <div class="gallery-slide${index === 0 ? " active" : ""}" data-index="${index}">
      ${img}
    </div>
  `).join("");

  const dots = images.map((_, index) => `
    <button
      type="button"
      class="gallery-slider-dot${index === 0 ? " active" : ""}"
      data-index="${index}"
      aria-label="Fotografia ${index + 1}"
    ></button>
  `).join("");

  return `
    <div class="gallery gallery-slider" aria-label="Galeria de fotografias do imóvel">
      ${slides}

      <button type="button" class="gallery-slider-btn prev" aria-label="Fotografia anterior">
        <i class="fa-solid fa-chevron-left"></i>
      </button>

      <button type="button" class="gallery-slider-btn next" aria-label="Fotografia seguinte">
        <i class="fa-solid fa-chevron-right"></i>
      </button>

      <div class="gallery-slider-dots">
        ${dots}
      </div>

      <div class="gallery-slider-counter">1 / ${images.length}</div>
    </div>
  `;
}

function processFile(file){
  let html = fs.readFileSync(file, "utf8");

  if(!html.includes('class="gallery"')) return false;

  html = html.replace(
    /<div class="gallery">([\s\S]*?)<\/div>/i,
    (_, inner) => buildSlider(inner)
  );

  if(!html.includes(".gallery.gallery-slider")){
    html = html.replace("</style>", `${CSS}\n</style>`);
  }

  if(!html.includes("function initGallerySliders")){
    html = html.replace("</body>", `${JS}\n</body>`);
  }

  fs.writeFileSync(file, html, "utf8");
  return true;
}

if(fs.existsSync(ROOT)){
  const entries = fs.readdirSync(ROOT, {withFileTypes:true});

  for(const entry of entries){
    if(!entry.isDirectory()) continue;

    const file = path.join(ROOT, entry.name, "index.html");

    if(fs.existsSync(file)){
      processFile(file);
    }
  }
}
