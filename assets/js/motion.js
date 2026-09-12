(() => {
  const root = document.documentElement;
  const ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (ridotto) return;              // niente classe js: il CSS non nasconde nulla
  if (!('IntersectionObserver' in window)) return;  // senza observer non riveleremmo piu nulla

  const osservatore = new IntersectionObserver((voci) => {
    for (const voce of voci) {
      if (!voce.isIntersecting) continue;
      voce.target.classList.add('in');
      osservatore.unobserve(voce.target);   // una volta sola
    }
  }, { threshold: 0.2 });

  const elenco = [...document.querySelectorAll('.rv')];

  // Misurata PRIMA di aggiungere 'js' (quando '.rv' non ha ancora opacity:0),
  // altrimenti la lettura fisserebbe quello stato e farebbe partire una transizione vera.
  const giaVisibili = new Set(
    elenco.filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    })
  );

  root.classList.add('js');

  elenco.forEach((el) => {
    const fratelli = [...el.parentElement.children].filter((n) => n.classList.contains('rv'));
    el.style.setProperty('--rv-delay', `${(fratelli.indexOf(el) % 4) * 80}ms`);
    if (giaVisibili.has(el)) {
      // già in vista: 'in' nello stesso giro sincrono di 'js', senza letture di
      // layout in mezzo, così non anima (niente flash, niente calo di contrasto).
      el.classList.add('in');
    } else {
      osservatore.observe(el);
    }
  });

  const sezione = document.querySelector('#metodo');
  if (sezione) {
    const track = sezione.querySelector('.metodo-track');
    const immagini = [...sezione.querySelectorAll('.metodo-img')];
    const punti = [...sezione.querySelectorAll('.metodo-dots li')];
    const titolo = sezione.querySelector('.metodo-titolo');
    const testo = sezione.querySelector('.metodo-testo');
    const passi = [
      ['01 · Valutazione', 'Composizione corporea, allenamento, orari, abitudini. Prima di scrivere qualsiasi cosa.'],
      ['02 · Piano', 'Calorie e distribuzione costruite intorno ai tuoi allenamenti.'],
      ['03 · Controlli', 'Aggiustamenti ogni tre o quattro settimane, con i numeri alla mano.'],
    ];

    let attivo = -1;
    let inCoda = false;

    const aggiorna = () => {
      inCoda = false;
      const percorso = track.offsetHeight - window.innerHeight;
      const fatto = (window.scrollY - track.offsetTop) / percorso;
      const i = fatto < 0.34 ? 0 : fatto < 0.68 ? 1 : 2;
      if (i === attivo) return;
      attivo = i;
      immagini.forEach((im, k) => im.classList.toggle('on', k === i));
      punti.forEach((p, k) => p.classList.toggle('on', k === i));
      titolo.textContent = passi[i][0];
      testo.textContent = passi[i][1];
    };

    window.addEventListener('scroll', () => {
      if (inCoda) return;
      inCoda = true;
      requestAnimationFrame(aggiorna);
    }, { passive: true });
    aggiorna();
  }
})();
