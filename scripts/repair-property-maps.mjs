import fs from "fs";
import path from "path";
const SUPABASE_URL="https://scmorocdbdyvnxodpwyi.supabase.co";
const KEY=process.env.SUPABASE_ANON_KEY||"sb_publishable_W28Qdq8POfYXjCu3BwUxPQ_2z2o2GcM";
const headers={apikey:KEY,Authorization:`Bearer ${KEY}`};
const root=path.join(process.cwd(),"imoveis");
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");}
function first(p,keys){for(const k of keys)if(p?.[k]!=null&&String(p[k]).trim())return String(p[k]).trim();return "";}
async function get(endpoint){const r=await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`,{headers});if(!r.ok)throw new Error(`Supabase ${r.status}: ${await r.text()}`);return r.json();}
const properties=await get("imoveis?select=id,slug,titulo,endereco,localizacao,morada,cidade,concelho,freguesia&publicado=eq.true");
let changed=0;
for(const p of properties){const slug=p.slug||String(p.titulo||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");if(!slug)continue;const file=path.join(root,slug,"index.html");if(!fs.existsSync(file))continue;let html=fs.readFileSync(file,"utf8");if(html.includes('class="map-section"')&&html.includes("google.com/maps"))continue;const address=first(p,["endereco","localizacao","morada","cidade","concelho","freguesia"]);if(!address)continue;const map=`https://www.google.com/maps?q=${encodeURIComponent(address+", Portugal")}&output=embed&z=14`;const section=`<section class="map-section"><h2>Localização no mapa</h2><div class="map"><iframe src="${esc(map)}" loading="lazy" title="Mapa da localização do imóvel"></iframe></div></section>`;const style='<style id="property-map-fix">.map-section{display:block!important;visibility:visible!important;margin-top:35px}.map{height:450px;min-height:450px;overflow:hidden;border-radius:10px;border:1px solid #e5e2db;background:#eef1f0}.map iframe{width:100%;height:100%;min-height:450px;border:0;display:block}</style>';html=html.replace('</head>',`${style}</head>`);html=html.replace('</main>',`${section}</main>`);fs.writeFileSync(file,html,"utf8");changed++;console.log(`Mapa restaurado: /imoveis/${slug}/`);}
console.log(`Concluído. ${changed} páginas corrigidas.`);
