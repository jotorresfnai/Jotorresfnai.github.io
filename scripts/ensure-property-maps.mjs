import fs from "fs";
import path from "path";

const ROOT = path.resolve("imoveis");
const SUPABASE_URL = "https://scmorocdbdyvnxodpwyi.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_W28Qdq8POfYXjCu3BwUxPQ_2z2o2GcM";
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");}
function slugify(v){return String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&/g," e ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").replace(/-+/g,"-").slice(0,120);}
function chooseSlug(p,used){const base=slugify(p.slug)||slugify(p.titulo)||`imovel-${p.id}`;let s=base,n=2;while(used.has(s))s=`${base}-${n++}`;used.add(s);return s;}

async function getProperties(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/imoveis?select=id,titulo,slug,endereco,localizacao&publicado=eq.true&order=created_at.desc`,{headers});
  if(!r.ok)throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

function mapSection(address){
  const map=`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  const open=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return `<section class="map-section"><h2>Localização no mapa</h2><div class="map"><iframe src="${esc(map)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="Mapa da localização do imóvel"></iframe></div><a href="${esc(open)}" target="_blank" rel="noopener" style="display:inline-flex;margin-top:10px;align-items:center;gap:8px;font-weight:800;color:#8a6a18">Abrir localização no Google Maps</a></section>`;
}

const properties=await getProperties();
if(!fs.existsSync(ROOT))throw new Error("Diretório imoveis não existe.");
const used=new Set();
let changed=0;
let missingAddress=0;
for(const p of properties){
  const slug=chooseSlug(p,used);
  const file=path.join(ROOT,slug,"index.html");
  if(!fs.existsSync(file)){console.warn(`Página não encontrada para ${p.titulo} (${slug})`);continue;}
  let html=fs.readFileSync(file,"utf8");
  const address=String(p.endereco||p.localizacao||"").trim();
  if(!address){missingAddress++;console.warn(`Sem endereço/localização: ${p.titulo}`);continue;}
  const section=mapSection(address);
  const mapRe=/\s*<section class="map-section">[\s\S]*?<\/section>/i;
  if(mapRe.test(html)){
    const current=html.match(mapRe)?.[0]||"";
    if(!current.includes("google.com/maps?q=") || !current.includes('class="map"') || !current.includes("Localização no mapa")){
      html=html.replace(mapRe,`\n  ${section}`);
      fs.writeFileSync(file,html,"utf8");changed++;console.log(`Mapa normalizado: /imoveis/${slug}/`);
    }
  }else if(html.includes("</main>")){
    html=html.replace("</main>",`\n  ${section}\n</main>`);
    fs.writeFileSync(file,html,"utf8");changed++;console.log(`Mapa garantido: /imoveis/${slug}/`);
  }else{
    console.warn(`Não foi possível inserir mapa em ${file}`);
  }
}

for(const dir of fs.readdirSync(ROOT,{withFileTypes:true}).filter(x=>x.isDirectory())){
  const file=path.join(ROOT,dir.name,"index.html");
  if(!fs.existsSync(file))continue;
  const html=fs.readFileSync(file,"utf8");
  if(!html.includes('class="map-section"') || !html.includes('class="map"') || !html.includes('google.com/maps?q=')){
    throw new Error(`MAPA EM FALTA: ${file}`);
  }
}
console.log(`Mapas verificados: ${properties.length} imóveis publicados; ${changed} página(s) alterada(s); ${missingAddress} sem endereço/localização.`);
