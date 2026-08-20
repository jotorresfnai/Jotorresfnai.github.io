import fs from "fs";

const file = "imoveis.html";
let html = fs.readFileSync(file, "utf8");

function replaceOnce(source, oldText, newText, label) {
  if (source.includes(newText)) return source;
  if (!source.includes(oldText)) throw new Error(`Não encontrei o bloco: ${label}`);
  return source.replace(oldText, newText);
}

html = replaceOnce(html, `.property-card {\n\n      background: white;\n\n      border-radius: 18px;\n\n      overflow: hidden;\n\n      border: 1px solid #e6e9ea;\n\n      box-shadow:\n        0 8px 30px rgba(0,0,0,.06);\n\n      transition:\n        transform .25s,\n        box-shadow .25s;\n    }`, `.property-card {\n\n      background: white;\n\n      border-radius: 18px;\n\n      overflow: hidden;\n\n      border: 1px solid #e6e9ea;\n\n      box-shadow:\n        0 8px 30px rgba(0,0,0,.06);\n\n      transition:\n        transform .25s,\n        box-shadow .25s;\n\n      display: flex;\n\n      flex-direction: column;\n\n      height: 100%;\n    }`, "property-card");

html = replaceOnce(html, `.property-info {\n\n      padding: 22px;\n    }`, `.property-info {\n\n      padding: 22px;\n\n      display: flex;\n\n      flex-direction: column;\n\n      flex: 1;\n    }`, "property-info");

html = replaceOnce(html, `.property-features {\n\n      display: grid;\n\n      grid-template-columns:\n        repeat(4, 1fr);`, `.property-features {\n\n      display: grid;\n\n      grid-template-columns:\n        repeat(auto-fit, minmax(82px, 1fr));`, "property-features");

const actionsCssMarker = `    /* =====================================================\n       WHATSAPP\n    ===================================================== */`;
if (!html.includes(".property-actions {")) {
  if (!html.includes(actionsCssMarker)) throw new Error("Não encontrei a secção de ações do cartão.");
  html = html.replace(actionsCssMarker, `    /* =====================================================\n       AÇÕES DO CARTÃO\n    ===================================================== */\n\n    .property-actions {\n\n      margin-top: auto;\n\n      display: flex;\n\n      flex-direction: column;\n\n      gap: 10px;\n    }\n\n    .property-actions .property-button,\n    .property-actions .whatsapp-button,\n    .property-actions .fnai-link {\n\n      flex: 0 0 auto;\n\n      margin: 0;\n    }\n\n\n${actionsCssMarker}`);
}

const garageOld = `            <div class="feature">\n\n              <i class="fa-solid fa-car"></i>\n\n              <strong>\n\n                ${\n                  garage\n                    ? 'Sim'\n                    : 'Não'\n                }\n\n              </strong>\n\n              <span>\n                Garagem\n              </span>\n\n            </div>`;
const garageNew = `            ${garage ? `\n\n              <div class="feature">\n\n                <i class="fa-solid fa-car"></i>\n\n                <strong>Sim</strong>\n\n                <span>\n                  Garagem\n                </span>\n\n              </div>\n\n            ` : ''}`;
html = replaceOnce(html, garageOld, garageNew, "garagem");

const actionMarker = `          <!-- =================================================\n               BOTÃO VER IMÓVEL\n          ================================================== -->`;
if (!html.includes("<div class=\"property-actions\">")) {
  if (!html.includes(actionMarker)) throw new Error("Não encontrei o bloco dos botões.");
  html = html.replace(actionMarker, `${actionMarker}\n\n          <div class="property-actions">`);
}

const propertyInfoClose = `\n\n\n        </div>\n\n      </article>`;
if (html.includes("<div class=\"property-actions\">") && html.includes(propertyInfoClose) && !html.includes("          </div>\n\n        </div>\n\n      </article>")) {
  html = html.replace(propertyInfoClose, `\n\n\n          </div>\n\n        </div>\n\n      </article>`);
}

fs.writeFileSync(file, html, "utf8");
console.log("[CARD] Cartões alinhados e campos opcionais condicionais aplicados.");
