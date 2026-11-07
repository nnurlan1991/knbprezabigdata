(() => {
  const deck = document.getElementById('deck');
  const slides = [...document.querySelectorAll('.slide')];
  const N = slides.length;
  let cur = -1;

  // generated pieces: service squares (slide 4) and backup bars (slide 8)
  const svc = document.getElementById('svc');
  if (svc) for (let i = 0; i < 15; i++) {
    const b = document.createElement('i');
    b.className = 'grow-y';
    b.style.cssText = `flex:1;height:34px;background:${i < 5 ? 'var(--teal)' : i === 5 ? 'linear-gradient(90deg,var(--teal) 10%,#E0F2FE 10%)' : '#E0F2FE'};--d:${0.6 + i * 0.05}s`;
    svc.appendChild(b);
  }
  document.querySelectorAll('.bk').forEach(el => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
    el.dataset.h.split(',').forEach((h, i) => {
      const b = document.createElement('i');
      b.className = 'grow-y';
      b.style.height = h + '%';
      el.appendChild(b);
    });
    const lab = document.createElement('div');
    lab.className = 'bkd';
    lab.innerHTML = days.map(d => `<span>${d}</span>`).join('');
    el.after(lab);
  });

  // stagger delays in DOM order per slide
  slides.forEach(s => {
    let i = 0;
    s.querySelectorAll('.r, .grow-y, .grow-x').forEach(el => {
      if (el.style.getPropertyValue('--d')) return;
      const isBar = !el.classList.contains('r');
      el.style.setProperty('--d', (0.12 + i * (isBar ? 0.07 : 0.11)).toFixed(2) + 's');
      i++;
    });
  });

  // count-up numbers
  const NUM = /\d+(?:[  ]\d{3})*(?:,\d+)?/;
  const counters = [...document.querySelectorAll('.cnt')].map(el => {
    const t = el.textContent, m = t.match(NUM);
    if (!m) return null;
    const raw = m[0], dec = (raw.split(',')[1] || '').length, grouped = /[  ]/.test(raw);
    const val = parseFloat(raw.replace(/[  ]/g, '').replace(',', '.'));
    return { el, pre: t.slice(0, m.index), post: t.slice(m.index + raw.length), val, dec, grouped, text: t };
  }).filter(Boolean);
  const fmt = (v, c) => {
    let s = v.toFixed(c.dec).replace('.', ',');
    if (c.grouped) { const [a, b] = s.split(','); s = a.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (b ? ',' + b : ''); }
    return c.pre + s + c.post;
  };
  function runCounters(slide) {
    counters.filter(c => slide.contains(c.el)).forEach(c => {
      const delay = parseFloat(getComputedStyle(c.el.closest('.r') || c.el).getPropertyValue('--d')) || 0;
      const t0 = performance.now() + delay * 1000 + 150, dur = 1400;
      c.el.textContent = fmt(0, c);
      const tick = now => {
        if (!slide.classList.contains('active')) { c.el.textContent = c.text; return; }
        const p = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - p, 4);
        c.el.textContent = p >= 1 ? c.text : fmt(c.val * e, c);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function go(n) {
    n = Math.max(0, Math.min(N - 1, n));
    if (n === cur) return;
    const prev = slides[cur];
    if (prev) {
      prev.classList.remove('active');
      prev.classList.add('leave');
      setTimeout(() => prev.classList.remove('leave'), 650);
    }
    cur = n;
    const s = slides[n];
    s.classList.remove('leave');
    void s.offsetWidth; // restart transitions
    s.classList.add('active');
    runCounters(s);
    document.getElementById('bar').style.width = ((n + 1) / N * 100) + '%';
    document.getElementById('count').textContent = `${n + 1} / ${N}`;
    history.replaceState(null, '', '#' + (n + 1));
  }

  function fit() {
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    deck.style.transform = `translate(-50%,-50%) scale(${k})`;
  }
  addEventListener('resize', fit); fit();

  const fs = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  addEventListener('keydown', e => {
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go(cur + 1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(N - 1);
    else if (e.key === 'f' || e.key === 'F' || e.key === 'а' || e.key === 'А') fs();
  });
  document.getElementById('prev').onclick = e => { e.stopPropagation(); go(cur - 1); };
  document.getElementById('next').onclick = e => { e.stopPropagation(); go(cur + 1); };
  document.getElementById('fs').onclick = e => { e.stopPropagation(); fs(); };
  document.getElementById('viewport').addEventListener('click', e => go(cur + (e.clientX > innerWidth / 3 ? 1 : -1)));
  let tx = null;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
  });
  setTimeout(() => document.getElementById('hint').classList.add('hide'), 100);

  addEventListener('hashchange', () => go((parseInt(location.hash.slice(1)) || 1) - 1));
  go((parseInt(location.hash.slice(1)) || 1) - 1);
})();
