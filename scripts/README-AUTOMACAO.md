# Automação de publicação

A fonte de verdade dos imóveis é o Supabase. O gerador `generate-properties-v2.mjs` reconstrói as páginas completas a partir dos dados atuais de `imoveis` e `imovel_fotos`.

O workflow `generate-properties.yml` é o único processo de publicação. Não usar os scripts históricos de correção (`ensure-property-maps.mjs`, `add-gallery-slideshow.mjs`, `upgrade-galleries.py`) como parte da publicação normal.

Qualquer alteração relevante no imóvel deve resultar numa regeneração completa da página: morada/mapa, áreas, preço, tipologia, descrição, características, fotografias, SEO, slug e restantes campos suportados pelo gerador.
