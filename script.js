(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const blossomContainer = document.querySelector('.cherry-blossom-container');

  function spawnBlossom() {
    if (!blossomContainer || reducedMotion) return;
    const flower = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const size = Math.floor(Math.random() * 14) + 10; // 10-23px
    flower.setAttribute('viewBox', '0 0 24 24');
    flower.classList.add('cherry-blossom');
    flower.style.setProperty('--size', `${size}px`);
    flower.style.setProperty('--duration', `${10 + Math.random() * 8}s`);
    flower.style.setProperty('--drift', `${-40 + Math.random() * 80}px`);
    flower.style.left = `${Math.random() * 100}%`;
    flower.style.top = '-28px';
    flower.style.filter = `blur(${Math.random() > 0.75 ? 0.7 : 0}px)`;
    flower.innerHTML = `
      <g fill="${['#ffd2e4','#ffbfd6','#fcb6cb'][Math.floor(Math.random()*3)]}">
        <ellipse cx="12" cy="5" rx="3" ry="5" />
        <ellipse cx="18" cy="10" rx="3" ry="5" transform="rotate(72 18 10)" />
        <ellipse cx="16" cy="18" rx="3" ry="5" transform="rotate(144 16 18)" />
        <ellipse cx="8" cy="18" rx="3" ry="5" transform="rotate(216 8 18)" />
        <ellipse cx="6" cy="10" rx="3" ry="5" transform="rotate(288 6 10)" />
      </g>
      <circle cx="12" cy="12" r="2" fill="#f5c558" />`;

    blossomContainer.appendChild(flower);
    flower.addEventListener('animationend', () => flower.remove(), { once: true });
  }

  if (!reducedMotion) {
    for (let i = 0; i < 18; i++) setTimeout(spawnBlossom, i * 260);
    setInterval(spawnBlossom, 550);
  }

  const sections = [...document.querySelectorAll('main section')];
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        const id = entry.target.id;
        navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
      }
    });
  }, { threshold: 0.35 });
  sections.forEach((s) => io.observe(s));

  const mobileToggle = document.querySelector('.mobile-toggle');
  const navList = document.querySelector('.nav-links');
  mobileToggle?.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    mobileToggle.setAttribute('aria-expanded', String(open));
  });
  navLinks.forEach((link) => link.addEventListener('click', () => navList.classList.remove('open')));

  const stats = document.querySelectorAll('.stat-value[data-target]');
  const statObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.target);
      const duration = 1200;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        el.textContent = Math.floor(target * p).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  stats.forEach((el) => statObserver.observe(el));

  const graph = document.querySelector('.contribution-graph');
  if (graph) {
    const weeks = 52;
    const days = 7;
    const size = 12;
    const gap = 4;
    const colors = ['#1f163f', '#2d2f79', '#3559ba', '#4c7bf3', '#9333ea'];
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < days; d++) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(12 + w * (size + gap)));
        rect.setAttribute('y', String(14 + d * (size + gap)));
        rect.setAttribute('width', String(size));
        rect.setAttribute('height', String(size));
        rect.setAttribute('rx', '3');
        rect.setAttribute('fill', colors[Math.floor(Math.random() * colors.length)]);
        graph.appendChild(rect);
      }
    }
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => null));
  }

  // Timeline accordion functionality
  const timelineHeaders = document.querySelectorAll('.timeline-header');
  timelineHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const expanded = header.getAttribute('aria-expanded') === 'true';
      const contentId = header.getAttribute('aria-controls');
      const content = document.getElementById(contentId);
      
      if (!content) return;
      
      // Toggle expanded state
      header.setAttribute('aria-expanded', String(!expanded));
      
      if (expanded) {
        // Collapse
        content.hidden = true;
      } else {
        // Expand
        content.hidden = false;
      }
    });

    // Keyboard support for accessibility
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });
  });
})();
