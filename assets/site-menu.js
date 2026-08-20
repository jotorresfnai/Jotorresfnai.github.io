(() => {
  const header = document.querySelector('.header');
  const nav = header?.querySelector('.navigation');
  if (!header || !nav || header.querySelector('.menu-toggle')) return;

  const style = document.createElement('style');
  style.textContent = `
    .menu-toggle{display:none;width:44px;height:44px;padding:10px;border:1px solid rgba(201,163,74,.7);border-radius:8px;background:transparent;color:#fff;cursor:pointer;place-items:center;gap:5px;z-index:30}
    .menu-toggle span{display:block;width:22px;height:2px;background:#fff;border-radius:2px;transition:transform .2s,opacity .2s}
    .menu-toggle:focus-visible{outline:2px solid #e2c477;outline-offset:3px}
    .menu-open .menu-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg)}
    .menu-open .menu-toggle span:nth-child(2){opacity:0}
    .menu-open .menu-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
    @media(max-width:850px){
      .header{position:relative;min-height:70px;height:70px;flex-direction:row!important;align-items:center!important}
      .menu-toggle{display:grid}
      .navigation{position:absolute!important;top:calc(100% + 8px);right:18px;left:18px;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:0!important;padding:10px!important;background:rgba(7,23,27,.98);border:1px solid rgba(201,163,74,.35);border-radius:10px;box-shadow:0 18px 40px rgba(0,0,0,.22);opacity:0;visibility:hidden;transform:translateY(-8px);pointer-events:none;transition:opacity .2s,transform .2s,visibility .2s;z-index:25}
      .menu-open .navigation{opacity:1;visibility:visible;transform:translateY(0);pointer-events:auto}
      .navigation a{display:flex!important;width:100%;padding:13px 12px;border-bottom:1px solid rgba(255,255,255,.08);font-size:14px!important;box-sizing:border-box}
      .navigation a:last-child{border-bottom:0}
      .navigation .whatsapp{justify-content:center;margin-top:6px}
    }
  `;
  document.head.appendChild(style);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'menu-toggle';
  toggle.setAttribute('aria-label', 'Abrir menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = '<span></span><span></span><span></span>';
  header.appendChild(toggle);

  const close = () => {
    header.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  };

  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
})();
