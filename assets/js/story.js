(() => {
  const root = document.documentElement;
  root.classList.add('js');

  const progress = document.querySelector('.reading-progress__bar');
  const navLinks = [...document.querySelectorAll('.site-nav__links a[href^="#"]')];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function updateProgress() {
    if (!progress) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percent = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
    progress.style.width = `${percent}%`;
  }

  function setActiveSection(id) {
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function revealInView() {
    const revealItems = [...document.querySelectorAll('.reveal')];
    if (!('IntersectionObserver' in window) || reducedMotion) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  function observeSections() {
    if (!('IntersectionObserver' in window)) return;
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveSection(visible.target.id);
    }, { rootMargin: '-20% 0px -55% 0px', threshold: [0.05, 0.25, 0.5] });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  function bindImageFallbacks() {
    document.querySelectorAll('[data-image-fallback] img').forEach((image) => {
      image.addEventListener('error', () => {
        const frame = image.closest('[data-image-fallback]');
        frame?.classList.add('is-missing');
        frame?.setAttribute('data-fallback-label', image.alt || '图片暂时无法显示');
      });
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateProgress();
      ticking = false;
    });
  }, { passive: true });

  updateProgress();
  revealInView();
  observeSections();
  bindImageFallbacks();
})();
