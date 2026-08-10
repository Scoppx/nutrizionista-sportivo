(() => {
  const root = document.documentElement;
  const ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (ridotto) return;              // niente classe js: il CSS non nasconde nulla

  root.classList.add('js');

  const osservatore = new IntersectionObserver((voci) => {
    for (const voce of voci) {
      if (!voce.isIntersecting) continue;
      voce.target.classList.add('in');
      osservatore.unobserve(voce.target);   // una volta sola
    }
  }, { threshold: 0.2 });

  document.querySelectorAll('.rv').forEach((el, i) => {
    el.style.setProperty('--rv-delay', `${(i % 4) * 80}ms`);
    osservatore.observe(el);
  });
})();
