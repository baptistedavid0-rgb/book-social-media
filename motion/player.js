/* Lecteur de timeline : toutes les animations CSS sont pilotées par un temps unique (lecture / export image par image). */
(() => {
  const DURATION = +document.currentScript.dataset.duration;
  window.DURATION = DURATION;
  const stage = document.getElementById('stage'), wrap = document.getElementById('wrap');
  const render = new URLSearchParams(location.search).has('render');
  if (render) document.body.classList.add('render');
  const fit = () => { if (!render) stage.style.transform = `scale(${wrap.clientWidth/1080})`; };
  addEventListener('resize', fit); fit();

  const counters = [...document.querySelectorAll('[data-count]')].map(el => {
    const [from,to,start,dur] = el.dataset.count.split(',').map(Number);
    return {el,from,to,start,dur,pre:el.dataset.pre||'',suf:el.dataset.suf||''};
  });
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const scrub = document.getElementById('scrub'), out = document.getElementById('time'), btn = document.getElementById('play');
  let anims = [];

  function seek(t){
    t = Math.max(0, Math.min(DURATION, t));
    for (const a of anims) a.currentTime = t * 1000;
    (window.__seekHooks || []).forEach(f => f(t));
    for (const c of counters){
      const p = easeOut(Math.max(0, Math.min(1, (t - c.start) / c.dur)));
      c.el.textContent = c.pre + Math.round(c.from + (c.to - c.from) * p) + c.suf;
    }
    if (scrub){ scrub.value = t; out.textContent = t.toFixed(1) + ' s'; }
  }
  window.seek = seek;

  let playing = !render, t0 = performance.now(), cur = 0;
  function loop(now){
    if (playing){ cur = ((now - t0) / 1000) % (DURATION + 1.2); seek(Math.min(cur, DURATION)); }
    requestAnimationFrame(loop);
  }
  btn.onclick = () => { playing = !playing; btn.textContent = playing ? 'Pause' : 'Lecture'; if (playing) t0 = performance.now() - cur*1000; };
  document.getElementById('restart').onclick = () => { cur = 0; t0 = performance.now(); if (!playing) seek(0); };
  scrub.oninput = () => { playing = false; btn.textContent = 'Lecture'; cur = +scrub.value; seek(cur); };

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    // décalage du logo pour qu'il démarre centré avant l'apparition du nom
    document.querySelectorAll('.row').forEach(r => {
      const hold = r.querySelector('.logo-hold, .s1-hold'), word = r.querySelector('.lg-word');
      if (hold && word){
        const gap = parseFloat(getComputedStyle(r).columnGap) || 0;
        hold.style.setProperty('--shift', ((word.offsetWidth + gap) / 2) + 'px');
      }
    });
    anims = document.getAnimations(); anims.forEach(a => a.pause());
    seek(0); window.__ready = true;
    if (!render) requestAnimationFrame(loop);
  });
})();
