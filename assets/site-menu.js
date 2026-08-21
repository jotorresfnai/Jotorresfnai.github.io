(() => {
  const init = () => {
    const header = document.querySelector('.header');
    const nav = header?.querySelector('.navigation');
    if (!header || !nav) return;

    // Favicon links for pages that load the shared site-menu script.
    const addIcon = (rel, href, sizes, type) => {
      if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (sizes) link.sizes = sizes;
      if (type) link.type = type;
      document.head.appendChild(link);
    };
    addIcon('icon', '/favicon.ico', '', 'image/x-icon');
    addIcon('icon', '/favicon-16x16.png', '16x16', 'image/png');
    addIcon('icon', '/favicon-32x32.png', '32x32', 'image/png');
    addIcon('apple-touch-icon', '/apple-touch-icon.png', '180x180', 'image/png');

    nav.querySelectorAll('a').forEach((link) => {
      const label = link.textContent.trim().toLowerCase();
      if (label.includes('início') || label.includes('inicio')) link.href = '/';
      else if (label.includes('imóveis') || label.includes('imoveis')) link.href = '/imoveis.html';
      else if (label.includes('sobre')) link.href = '/#sobre';
      else if (label.includes('contacto') || label.includes('contato')) link.href = '/#contacto';
    });

    let toggle = header.querySelector('.menu-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'menu-toggle';
      toggle.setAttribute('aria-label', 'Abrir menu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span></span><span></span><span></span>';
      header.appendChild(toggle);
    }

    if (!document.getElementById('site-menu-style')) {
      const style = document.createElement('style');
      style.id = 'site-menu-style';
      style.textContent = `
        .menu-toggle{display:none;width:44px;height:44px;padding:10px;border:1px solid rgba(201,163,74,.7);border-radius:8px;background:transparent;color:#fff;cursor:pointer;place-items:center;gap:5px;z-index:1003}
        .menu-toggle span{display:block;width:22px;height:2px;background:#fff;border-radius:2px;transition:transform .2s,opacity .2s}
        .menu-open .menu-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg)}
        .menu-open .menu-toggle span:nth-child(2){opacity:0}
        .menu-open .menu-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
        .fnai-watermark{left:50%!important;top:50%!important;right:auto!important;bottom:auto!important;transform:translate(-50%,-50%)!important;width:100px!important;height:66px!important;background:url('/fnai_logo_transparente.png') center/contain no-repeat!important;color:transparent!important;font-size:0!important;text-shadow:none!important;opacity:.8!important;z-index:5!important;}
        @media(max-width:850px){
          .header{position:relative;min-height:70px;height:70px;flex-direction:row!important;align-items:center!important}
          .menu-toggle{display:grid!important}
          .navigation{position:absolute!important;top:calc(100% + 8px)!important;right:18px!important;left:18px!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:0!important;padding:10px!important;background:rgba(7,23,27,.98)!important;border:1px solid rgba(201,163,74,.35);border-radius:10px;box-shadow:0 18px 40px rgba(0,0,0,.22);opacity:0;visibility:hidden;transform:translateY(-8px);pointer-events:none;transition:opacity .2s,transform .2s,visibility .2s;z-index:1002}
          .menu-open .navigation{opacity:1;visibility:visible;transform:translateY(0);pointer-events:auto}
          .navigation a{display:flex!important;width:100%!important;padding:13px 12px!important;border-bottom:1px solid rgba(255,255,255,.08);font-size:14px!important;box-sizing:border-box}
          .navigation a:last-child{border-bottom:0}
        }
      `;
      document.head.appendChild(style);
    }

    const close = () => {
      header.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
    };

    if (toggle.dataset.menuBound) return;
    toggle.dataset.menuBound = 'true';
    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const open = header.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });

    nav.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;
      close();
      if (href.startsWith('/')) {
        event.preventDefault();
        window.location.assign(href);
      }
    });

    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
