import {catalogue, help, escapeHTML} from '../shared.js';
// Editorial: a premium magazine layout. Markup is fully readable without JS;
// optional motion is added by bindEditorialMotion() in ../editorial-motion.js.
const IMG = (base, extra = '') => {
  const b = escapeHTML(base);
  return `<img class="scene-image" src="${b}/editorial-1536.webp" srcset="${b}/editorial-768.webp 768w, ${b}/editorial-1536.webp 1536w" sizes="(max-width: 767px) 100vw, 80vw" width="1536" height="1024" alt="" decoding="async"${extra}>`;
};
// Split each title line into characters so they can be revealed one by one.
// No inline styles (the demo server's CSP blocks them); the motion script sets --i.
function splitTitle(text) {
  return String(text).split('\n').map(line => `<span class="ed-line"><span class="ed-line-inner">${[...line].map(ch => `<span class="ed-char">${ch === ' ' ? '&nbsp;' : escapeHTML(ch)}</span>`).join('')}</span></span>`).join('');
}
export function editorial(model) {
  const assetBase = model.assetBase || '/storefront-ui/assets';
  const heading = String(model.heroTitle || '工具之外，\n是更大的世界。');
  const brand = escapeHTML(model.brand || '数字商店');
  const cats = (model.categories || []).map(c => c.name).filter(Boolean);
  const words = (cats.length ? cats : ['数字工具', '创作资源', '数字生活']).concat(['编辑精选', '即时交付', '原创视觉']);
  const ticker = words.map(w => `<span>${escapeHTML(w)}</span><i>✦</i>`).join('');
  const chapters = [
    ['01', '雪线之上', '把注意力留给真正重要的事。'],
    ['02', '窗前的光', '一张安静的桌面，一段专注的时间。'],
    ['03', '留白之间', '工具退到幕后，想法走到台前。'],
    ['04', '远处的山', '每一次选择，都在靠近更大的世界。'],
  ];
  return `<div class="ed-intro" aria-hidden="true"><div class="ed-intro-inner"><span class="ed-intro-mark">Coco9</span><span class="ed-intro-sub">Édition · 杂志极简</span><span class="ed-intro-count" data-ed-intro-count>00</span></div></div>
<div class="ed-progress" aria-hidden="true"><span data-ed-progress></span></div>
<section class="ed-hero" data-ed-hero>
 <p class="ed-kicker" data-ed-reveal><span>No. 09</span><span>${brand} · 秋冬刊</span><span>Tools for a wider world.</span></p>
 <div class="ed-hero-head">
  <h1 class="ed-title" aria-label="${escapeHTML(heading.replace(/\n/g, ''))}"><span aria-hidden="true">${splitTitle(heading)}</span></h1>
  <aside class="ed-hero-side" data-ed-reveal>
   <p class="ed-wordmark">Digital<br><em>Goods</em></p>
   <p class="catalog-deck">给想法一个开始，给自己更多空间。<br>一份关于好工具的编辑手册。</p>
   <button type="button" class="catalog-browse" data-catalog-jump data-magnetic><span data-magnetic-inner>浏览商品</span> <span aria-hidden="true">↗</span></button>
  </aside>
 </div>
 <figure class="ed-figure" data-ed-curtain><div class="ed-curtain">
  <div class="ed-parallax" data-ed-parallax="0.12">${IMG(assetBase, ' fetchpriority="high"')}</div>
  <figcaption><span>图 01</span>雪线之上的工作室 — 一个人，一扇窗，一整片山。</figcaption>
 </div></figure>
</section>
<div class="ed-marquee" aria-hidden="true"><div class="ed-marquee-track"><div>${ticker}</div><div>${ticker}</div></div></div>
<section class="ed-stats" aria-label="商店概览">
 <div data-ed-reveal><strong><span data-ed-count="${cats.length || 3}">${cats.length || 3}</span></strong><p>精选品类<br><small>Curated categories</small></p></div>
 <div data-ed-reveal><strong><span data-ed-count="24">24</span><sup>h</sup></strong><p>自助交付<br><small>Instant delivery</small></p></div>
 <div data-ed-reveal><strong><span data-ed-count="100">100</span><sup>%</sup></strong><p>原创视觉素材<br><small>Original artwork</small></p></div>
</section>
<section class="ed-rail" data-ed-rail aria-label="本季编辑精选">
 <div class="ed-rail-sticky">
  <div class="ed-rail-head" data-ed-reveal><p class="ed-label">Chapter · 本季编辑精选</p><h2>慢一点，<em>看清楚</em>再选择。</h2></div>
  <div class="ed-rail-track" data-ed-rail-track>
   ${chapters.map(([n, t, d]) => `<article class="ed-chapter" data-cursor="阅读"><div class="ed-chapter-media">${IMG(assetBase, ' loading="lazy"')}</div><div class="ed-chapter-copy"><span>${n}</span><h3>${t}</h3><p>${d}</p></div></article>`).join('')}
  </div>
 </div>
</section>
${catalogue(model.categories, {title: '好工具，始于选择'})}
${help}`;
}
