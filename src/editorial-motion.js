// Optional motion layer for the editorial theme. Vanilla JS: IntersectionObserver,
// requestAnimationFrame and CSS transforms only. Returns a dispose function.
// Without this file (or with prefers-reduced-motion) the page stays fully static and readable.
let introPlayed = false;
export function bindEditorialMotion(root) {
  const store = root && root.querySelector('.design-editorial');
  if (!store || typeof window === 'undefined') return () => {};
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro = store.querySelector('.ed-intro');
  if (reduce || !('IntersectionObserver' in window)) { intro && intro.remove(); return () => {}; }
  const cleanups = [], on = (el, type, fn, opts) => { el.addEventListener(type, fn, opts); cleanups.push(() => el.removeEventListener(type, fn, opts)); };
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  store.querySelectorAll('.ed-char').forEach((c, i) => c.style.setProperty('--i', i));
  store.classList.add('ed-motion');
  // 1. Page-load intro: a short counter, then the curtain lifts and the hero plays.
  const startHero = () => store.classList.add('ed-ready');
  if (intro && !introPlayed) {
    introPlayed = true;
    const count = intro.querySelector('[data-ed-intro-count]'), t0 = performance.now(), dur = 1100;
    let raf = 0;
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur);
      count.textContent = String(Math.round(easeOut(p) * 100)).padStart(2, '0');
      if (p < 1) raf = requestAnimationFrame(tick);
      else { intro.classList.add('ed-intro-out'); setTimeout(startHero, 250); setTimeout(() => intro.remove(), 1300); }
    };
    raf = requestAnimationFrame(tick);
    cleanups.push(() => cancelAnimationFrame(raf));
  } else { intro && intro.remove(); requestAnimationFrame(startHero); }
  // 2. Scroll reveals (sections, product cards, curtains) with stagger.
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('ed-in'); io.unobserve(e.target); if (e.target.matches('[data-ed-count]')) countUp(e.target); }
  }, {rootMargin: '0px 0px -12% 0px', threshold: 0.12});
  const watch = scope => {
    scope.querySelectorAll('[data-ed-reveal],[data-ed-curtain],[data-ed-count],.catalog-heading,.filters,.catalog-help').forEach(el => io.observe(el));
    scope.querySelectorAll('.products > .product').forEach((el, i) => { el.style.setProperty('--d', (i % 4) * 90 + 'ms'); io.observe(el); });
  };
  watch(store);
  // demo.js re-renders cards on search/filter: observe the new ones.
  const products = store.querySelector('.products');
  if (products) { const mo = new MutationObserver(() => watch(products)); mo.observe(products, {childList: true}); cleanups.push(() => mo.disconnect()); }
  cleanups.push(() => io.disconnect());
  const countUp = el => {
    const target = Number(el.dataset.edCount) || 0, t0 = performance.now(), dur = 1600;
    const step = now => { const p = Math.min(1, (now - t0) / dur); el.textContent = String(Math.round(easeOut(p) * target)); if (p < 1) requestAnimationFrame(step); };
    el.textContent = '0'; requestAnimationFrame(step);
  };
  // 3. Scroll-driven effects in one rAF: progress bar, parallax, pinned horizontal rail.
  const bar = store.querySelector('[data-ed-progress]');
  const parallax = [...store.querySelectorAll('[data-ed-parallax]')];
  const rail = store.querySelector('[data-ed-rail]'), track = store.querySelector('[data-ed-rail-track]');
  const railPinned = () => window.matchMedia('(min-width: 768px)').matches;
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight, doc = document.documentElement, max = doc.scrollHeight - vh;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    for (const el of parallax) {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const speed = Number(el.dataset.edParallax) || .1, center = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0,${(center * -speed * 100).toFixed(2)}%,0) scale(1.18)`;
    }
    if (rail && track) {
      if (railPinned()) {
        const r = rail.getBoundingClientRect(), dist = track.scrollWidth - track.clientWidth;
        rail.style.height = (vh + Math.max(0, dist)) + 'px';
        const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
        track.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
      } else { rail.style.height = ''; track.style.transform = ''; }
    }
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  on(window, 'scroll', request, {passive: true}); on(window, 'resize', request);
  request();
  // 4. Desktop-only pointer effects: custom cursor, magnetic buttons, card tilt.
  if (finePointer) {
    const cursor = document.createElement('div');
    cursor.className = 'ed-cursor is-hidden'; cursor.style.transform = 'translate3d(-200px,-200px,0)'; cursor.setAttribute('aria-hidden', 'true'); cursor.innerHTML = '<span></span>';
    document.body.append(cursor); document.body.classList.add('ed-has-cursor');
    cleanups.push(() => { cursor.remove(); document.body.classList.remove('ed-has-cursor'); });
    const label = cursor.firstChild;
    let x = -100, y = -100, cx = -100, cy = -100, raf = 0;
    const loop = () => {
      cx += (x - cx) * .2; cy += (y - cy) * .2;
      cursor.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > .3 ? requestAnimationFrame(loop) : 0;
    };
    cleanups.push(() => cancelAnimationFrame(raf));
    on(document, 'pointermove', e => {
      cursor.classList.remove('is-hidden'); x = e.clientX; y = e.clientY; if (cx < -50) { cx = x; cy = y; } if (!raf) raf = requestAnimationFrame(loop);
      const card = e.target.closest && e.target.closest('.product,[data-cursor]');
      const link = e.target.closest && e.target.closest('a,button,select,label');
      cursor.classList.toggle('is-card', !!card); cursor.classList.toggle('is-link', !card && !!link);
      label.textContent = card ? (card.dataset.cursor || '查看') : '';
      // magnetic
      const mag = e.target.closest && e.target.closest('[data-magnetic]');
      store.querySelectorAll('[data-magnetic].is-pulled').forEach(m => { if (m !== mag) resetMag(m); });
      if (mag) {
        const r = mag.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        mag.classList.add('is-pulled'); mag.style.transform = `translate3d(${dx * .3}px,${dy * .4}px,0)`;
        const inner = mag.querySelector('[data-magnetic-inner]'); if (inner) inner.style.transform = `translate3d(${dx * .15}px,${dy * .2}px,0)`;
      }
      // tilt
      const tilt = e.target.closest && e.target.closest('.design-editorial .product');
      store.querySelectorAll('.product.is-tilt').forEach(p => { if (p !== tilt) { p.classList.remove('is-tilt'); p.style.removeProperty('--rx'); p.style.removeProperty('--ry'); } });
      if (tilt) {
        const r = tilt.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        tilt.classList.add('is-tilt'); tilt.style.setProperty('--rx', (-py * 6).toFixed(2) + 'deg'); tilt.style.setProperty('--ry', (px * 8).toFixed(2) + 'deg');
      }
    }, {passive: true});
    on(document, 'pointerdown', () => cursor.classList.add('is-down'));
    on(document, 'pointerup', () => cursor.classList.remove('is-down'));
    on(document.documentElement, 'pointerleave', () => cursor.classList.add('is-hidden'));
    on(document.documentElement, 'pointerenter', () => cursor.classList.remove('is-hidden'));
    // Magnetic targets also include the help link and the filters.
    store.querySelectorAll('.catalog-help a,.filters .filter').forEach(el => el.setAttribute('data-magnetic', ''));
  }
  function resetMag(m) { m.classList.remove('is-pulled'); m.style.transform = ''; const i = m.querySelector('[data-magnetic-inner]'); if (i) i.style.transform = ''; }
  return () => { for (const fn of cleanups.splice(0)) fn(); store.classList.remove('ed-motion', 'ed-ready'); };
}
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
