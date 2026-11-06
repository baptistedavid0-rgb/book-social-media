/* Logo 5 pattes digitales — vectorisé d'après la plaquette.
   Logo5P.svg({id, mode:'photo'|'flat', cls}) renvoie le markup SVG.
   Coordonnées dans le repère de la photo de référence (1290x843). */
(function(){
  const SHAPES = {
    a: {d:'M400 45 L822 45 Q848 45 840 70 L802 170 Q796 186 778 186 L514 186 Q498 186 495 202 L452 335 Q446 355 425 355 L282 355 Q258 355 264 332 L372 68 Q380 45 400 45Z'},
    b: {d:'M560 274 L830 274 Q882 274 900 322 L1068 752 Q1080 808 1030 808 L846 808 Q826 808 820 790 L700 442 Q668 344 598 338 L552 338 Q520 336 522 305 Q526 275 560 274Z'},
    c: {d:'M650 538 Q674 536 682 565 L716 782 Q720 806 696 806 L562 806 Q538 806 546 784 L623 562 Q630 538 650 538Z'},
    d: {d:'M0 -68 L300 -48 A48 48 0 0 1 300 48 L0 68 A68 68 0 0 1 0 -68Z', t:'translate(220 634) rotate(-38.3)'},
    e: {d:'M314 793 L450 793 Q469 793 477 776 L582 560 Q594 530 566 512 Q542 498 522 518 L298 748 Q284 766 294 782 Q300 793 314 793Z'}
  };
  const VB = '135 35 955 783';

  // Trajectoires des feux de voitures (route qui monte en S vers l'horizon)
  const trails = [];
  for (let o = -7; o <= 7; o++){
    trails.push(`M${620+o*22} 850 C${700+o*16} 705 ${962+o*5} 655 ${952+o*3} 562 C${946+o*2} 520 ${902+o} 490 875 478`);
  }
  const col = i => ['#fff3d2','#ffc76a','#ff5b48','#ffe2a6'][i % 4];

  function photo(id){
    let s = `<g class="ph-zoom">
      <rect x="0" y="0" width="1290" height="843" fill="url(#${id}-sky)"/>
      <ellipse cx="900" cy="468" rx="300" ry="70" fill="#ffc77e" opacity=".55" filter="url(#${id}-soft)"/>
      <path d="M560 492 C700 458 840 452 1090 468 L1090 520 L560 520Z" fill="#2b2f3a"/>
      <path d="${hills()}" fill="#0f1217"/>
      <g filter="url(#${id}-glow)" opacity=".75">`;
    trails.forEach((p,i)=>{ s += `<path d="${p}" fill="none" stroke="${col(i)}" stroke-width="${1.2 + (i%3)*.9}" opacity="${.45 + (i%4)*.12}"/>`; });
    s += `</g><g>`;
    trails.forEach((p,i)=>{ s += `<path class="lg-car" style="--dur:${(1.1 + (i%5)*.22).toFixed(2)}s;--off:${-(i*37)%300}px" d="${p}" fill="none" stroke="${col(i+1)}" stroke-width="${2.2 + (i%2)}" stroke-linecap="round"/>`; });
    s += `</g></g>`;
    return s;
  }
  function hills(){
    // colline + ligne d'arbres à gauche, plaine vers l'horizon à droite
    let d = 'M130 612';
    for (let x = 130; x <= 600; x += 14){
      const base = 612 - (x-130)*0.19;
      const h = 10 + ((x*7919) % 23);
      d += ` L${x+4} ${(base-h).toFixed(1)} L${x+9} ${(base-2).toFixed(1)}`;
    }
    d += ' C680 505 780 480 900 476 C1000 474 1060 480 1090 486 L1090 850 L130 850Z';
    return d;
  }

  function svg({id='lg', mode='photo', cls=''} = {}){
    let s = `<svg class="lg5 ${cls}" viewBox="${VB}" aria-label="Logo 5 pattes digitales"><defs>
      <linearGradient id="${id}-sky" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="820">
        <stop offset="0" stop-color="#1b2436"/><stop offset=".3" stop-color="#2f3b55"/>
        <stop offset=".48" stop-color="#5f6779"/><stop offset=".55" stop-color="#d49b63"/>
        <stop offset=".6" stop-color="#8d7f78"/><stop offset=".75" stop-color="#3a3d48"/><stop offset="1" stop-color="#1c1e24"/>
      </linearGradient>
      <filter id="${id}-glow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="${id}-soft"><feGaussianBlur stdDeviation="22"/></filter>
      <linearGradient id="${id}-shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>`;
    for (const k of 'abcd') s += `<clipPath id="${id}-c${k}"><path d="${SHAPES[k].d}"${SHAPES[k].t?` transform="${SHAPES[k].t}"`:''}/></clipPath>`;
    s += `<clipPath id="${id}-all">${Object.values(SHAPES).map(v=>`<path d="${v.d}"${v.t?` transform="${v.t}"`:''}/>`).join('')}</clipPath></defs><g class="lg-root">`;
    // ordre d'empilement : pattes d'abord, puis jambes, puis barre
    for (const k of ['d','e','c','b','a']){
      const v = SHAPES[k];
      s += `<g class="pc pc-${k}">`;
      if (k === 'e') s += `<path d="${v.d}" fill="#e4ef1d"/>`;
      else if (mode === 'photo') s += `<g clip-path="url(#${id}-c${k})">${photo(id)}</g>`;
      else s += `<path d="${v.d}"${v.t?` transform="${v.t}"`:''} fill="currentColor"/>`;
      s += `</g>`;
    }
    s += `<g clip-path="url(#${id}-all)"><g transform="skewX(-20)"><rect class="lg-shine" x="-200" y="0" width="260" height="900" fill="url(#${id}-shine)"/></g></g>`;
    s += `</g></svg>`;
    return s;
  }
  window.Logo5P = { svg };
})();
