/* Intro « liquide » du logo 5 pattes digitales.
   Une goutte tombe, s'écrase, se divise en gouttelettes (effet métaballes / gooey),
   qui se déploient puis se figent dans les formes exactes du logo.
   Entièrement piloté par le temps (window.__seekHooks) => rendu image par image fluide. */
(function(){
  const NS = 'http://www.w3.org/2000/svg';
  const VB = '135 35 955 783';
  const P = {
    a:{d:'M400 45 L822 45 Q848 45 840 70 L802 170 Q796 186 778 186 L514 186 Q498 186 495 202 L452 335 Q446 355 425 355 L282 355 Q258 355 264 332 L372 68 Q380 45 400 45Z', c:[560,200]},
    b:{d:'M560 274 L830 274 Q882 274 900 322 L1068 752 Q1080 808 1030 808 L846 808 Q826 808 820 790 L700 442 Q668 344 598 338 L552 338 Q520 336 522 305 Q526 275 560 274Z', c:[840,560]},
    c:{d:'M650 538 Q674 536 682 565 L716 782 Q720 806 696 806 L562 806 Q538 806 546 784 L623 562 Q630 538 650 538Z', c:[632,690]},
    d:{d:'M0 -68 L300 -48 A48 48 0 0 1 300 48 L0 68 A68 68 0 0 1 0 -68Z', t:'translate(220 634) rotate(-38.3)', c:[345,525]},
    e:{d:'M314 793 L450 793 Q469 793 477 776 L582 560 Q594 530 566 512 Q542 498 522 518 L298 748 Q284 766 294 782 Q300 793 314 793Z', c:[440,655]}
  };
  const ORDER = ['e','d','c','b','a'];          // ordre de sortie des gouttelettes
  const C = [610, 440];                          // point d'impact de la goutte

  const clamp = x => Math.max(0, Math.min(1, x));
  const prog = (t,a,b) => clamp((t-a)/(b-a));
  const inOut = x => x<.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2,3)/2;
  const inQuad = x => x*x;
  const outBack = (x,s=1.5) => 1 + (s+1)*Math.pow(x-1,3) + s*Math.pow(x-1,2);
  const spring = (x,w=9,z=5.5) => x<=0 ? 0 : 1 - Math.exp(-z*x)*Math.cos(w*x);   // ressort amorti
  const lerp = (a,b,k) => a + (b-a)*k;

  function el(tag, attrs, parent){ const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; }

  function mount(host, {id='liq', T0=0} = {}){
    const svg = el('svg', {viewBox:VB, class:'lg-liquid', 'aria-hidden':'true'});
    const defs = el('defs', {}, svg);
    const blurs = [];
    for (const n of ['n','y']){
      const f = el('filter', {id:`${id}-goo-${n}`, filterUnits:'userSpaceOnUse', x:'-200', y:'-500', width:'1700', height:'1700', 'color-interpolation-filters':'sRGB'}, defs);
      blurs.push(el('feGaussianBlur', {in:'SourceGraphic', stdDeviation:'0'}, f));
      el('feColorMatrix', {values:'1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10'}, f);
    }
    const gN = el('g', {filter:`url(#${id}-goo-n)`, fill:'#1d2638'}, svg);
    const gY = el('g', {filter:`url(#${id}-goo-y)`, fill:'#e4ef1d'}, svg);

    const drop = el('ellipse', {cx:C[0], cy:C[1], rx:0, ry:0}, gN);
    const splash = [...Array(7)].map((_,i)=> el('circle', {r:0}, gN));
    const parts = {};
    for (const k of ORDER){
      const g = k==='e' ? gY : gN;
      const blob = el('circle', {r:0}, g);
      const outer = el('g', {}, g);
      el('path', P[k].t ? {d:P[k].d, transform:P[k].t} : {d:P[k].d}, outer);
      parts[k] = {blob, outer};
    }
    host.insertBefore(svg, host.firstChild);
    const finalSvg = () => host.querySelector('.lg5');

    function frame(T){
      const t = T - T0;
      // 1. chute + écrasement + oscillation de la goutte
      const fall = prog(t, 0, .55);
      let rx, ry, cy;
      if (t < .55){ rx = 84 - 14*fall; ry = 84 + 55*fall; cy = lerp(-260, C[1], inQuad(fall)); }
      else {
        const u = t - .55, w = Math.exp(-4.2*u)*Math.cos(15*u);
        rx = 150*(1 + .4*w); ry = 150*(1 - .4*w); cy = C[1] + 34*w;
      }
      const shrink = 1 - inOut(prog(t, 1.05, 2.0));
      drop.setAttribute('cx', C[0]); drop.setAttribute('cy', cy);
      drop.setAttribute('rx', Math.max(0, rx*shrink)); drop.setAttribute('ry', Math.max(0, ry*shrink));

      // 2. éclaboussures qui partent à l'impact puis sont réabsorbées
      splash.forEach((s,i)=>{
        const a = -Math.PI*(.12 + .76*i/6), x = prog(t, .55, 1.3), out = Math.sin(Math.PI*x);
        const d = (210 + 50*(i%3))*out;
        s.setAttribute('cx', C[0] + Math.cos(a)*d*1.25); s.setAttribute('cy', C[1] + 20 + Math.sin(a)*d*.9);
        s.setAttribute('r', x>0 && x<1 ? (20 + 10*(i%2))*(1-.4*x) : 0);
      });

      // 3. gouttelettes vers chaque forme, puis 4. déploiement en forme exacte
      ORDER.forEach((k,i)=>{
        const {blob, outer} = parts[k], [px,py] = P[k].c;
        const st = 1.0 + i*.08, mv = outBack(prog(t, st, st+.85), 1.1);
        const r = (78 + (k==='b'?18:0)) * prog(t, st-.05, st+.15) * (1 - inOut(prog(t, 1.9+i*.05, 2.65+i*.05)));
        blob.setAttribute('cx', lerp(C[0], px, mv)); blob.setAttribute('cy', lerp(C[1], py, mv));
        blob.setAttribute('r', Math.max(0, r));
        const x = t - (1.55 + i*.06), k2 = Math.max(0, spring(x, 8.5, 5.2));
        const rot = 9*Math.exp(-4.5*Math.max(0,x))*Math.sin(11*Math.max(0,x)) * (i%2?1:-1);
        outer.setAttribute('transform', `translate(${px} ${py}) rotate(${rot}) scale(${k2}) translate(${-px} ${-py})`);
      });

      // flou « liquide » : fort pendant la division, puis se fige à 0
      const s = t < .9 ? lerp(8, 10, prog(t,0,.9)) : t < 1.9 ? lerp(10, 28, inOut(prog(t,.9,1.3))) : 28*(1 - inOut(prog(t, 1.9, 2.9)));
      blurs.forEach(b => b.setAttribute('stdDeviation', s.toFixed(2)));

      // 5. le logo net (avec photo) prend le relais
      const o = inOut(prog(t, 2.7, 3.15));
      const f = finalSvg(); if (f) f.style.opacity = o;
      svg.style.opacity = t > 3.2 ? 0 : 1;
    }
    (window.__seekHooks = window.__seekHooks || []).push(frame);
    frame(0);
  }
  window.Logo5PLiquid = { mount };
})();
