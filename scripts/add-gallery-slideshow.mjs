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