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
  return `<section class="map-section"><h2>Localização no mapa</h2><div class="map"><iframe src="${esc(map)}" loading="lazy" title="Mapa da localização do imóvel"></iframe></div></section>`;
}

const properties=await getProperties();
if(!fs.existsSync(ROOT))process.exit(0);
const used=new Set();
let changed=0;
for(const p of properties){
  const slug=chooseSlug(p,used);
  const file=path.join(ROOT,slug,"index.html");
  if(!fs.existsSync(file))continue;
  let html=fs.readFileSync(file,"utf8");
  if(html.includes('class="map-section"') && html.includes('google.com/maps?q='))continue;
  const address=String(p.endereco||p.localizacao||"").trim();
  if(!address)continue;
  const section=mapSection(address);
  if(html.includes("</main>"))html=html.replace("</main>",`${section}</main>`);
  else continue;
  fs.writeFileSync(file,html,"utf8");
  changed++;
  console.log(`Mapa garantido: /imoveis/${slug}/`);
}
console.log(`Mapas corrigidos: ${changed} página(s).`);
