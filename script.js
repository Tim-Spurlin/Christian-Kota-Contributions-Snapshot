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

  const animateValue = (el, target) => {
    const duration = 1100;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      el.textContent = Math.floor(target * p).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const graph = document.querySelector('.contribution-graph');
  const drawFallbackGraph = () => {
    if (!graph) return;
    graph.innerHTML = '';
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
  };

  const contributionsSection = document.querySelector('#contributions');
  const githubUsername = contributionsSection?.dataset.githubUser;
  const statEls = [...document.querySelectorAll('.stat-value[data-stat]')];
  const statsNote = document.querySelector('#github-stats-note');

  const drawActivityGraph = (events) => {
    if (!graph) return;
    graph.innerHTML = '';
    const now = new Date();
    const daysTotal = 364;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysTotal);
    const dayCounts = new Map();

    events.forEach((event) => {
      const created = new Date(event.created_at);
      if (created >= startDate) {
        const key = created.toISOString().slice(0, 10);
        const increment = event.type === 'PushEvent' ? (event.payload?.size || 1) : 1;
        dayCounts.set(key, (dayCounts.get(key) || 0) + increment);
      }
    });

    const values = [...dayCounts.values()];
    const max = Math.max(1, ...values);
    const palette = ['#1f163f', '#2d2f79', '#3559ba', '#4c7bf3', '#9333ea'];
    const size = 12;
    const gap = 4;

    for (let offset = 0; offset < 364; offset++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + offset);
      const dayIndex = (current.getDay() + 6) % 7;
      const weekIndex = Math.floor(offset / 7);
      const key = current.toISOString().slice(0, 10);
      const count = dayCounts.get(key) || 0;
      const intensity = count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4));

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(12 + weekIndex * (size + gap)));
      rect.setAttribute('y', String(14 + dayIndex * (size + gap)));
      rect.setAttribute('width', String(size));
      rect.setAttribute('height', String(size));
      rect.setAttribute('rx', '3');
      rect.setAttribute('fill', palette[intensity]);
      rect.setAttribute('aria-label', `${key}: ${count} public events`);
      graph.appendChild(rect);
    }
  };

  const hydrateGithubStats = async () => {
    if (!githubUsername || statEls.length === 0) {
      drawFallbackGraph();
      return;
    }

    const profileResp = await fetch(`https://api.github.com/users/${githubUsername}`);
    if (!profileResp.ok) throw new Error('Unable to fetch profile stats');
    const profile = await profileResp.json();

    const mapping = {
      public_repos: profile.public_repos,
      followers: profile.followers,
      following: profile.following,
      public_gists: profile.public_gists,
    };

    statEls.forEach((el) => {
      const value = mapping[el.dataset.stat] ?? 0;
      animateValue(el, Number(value));
    });

    const eventsResp = await fetch(`https://api.github.com/users/${githubUsername}/events/public?per_page=100`);
    if (eventsResp.ok) {
      const events = await eventsResp.json();
      drawActivityGraph(events);
      if (statsNote) statsNote.textContent = 'Live stats from GitHub API. Activity graph shows recent public events.';
    } else {
      drawFallbackGraph();
      if (statsNote) statsNote.textContent = 'Live account stats loaded. Activity graph is shown in fallback mode due to API rate limits.';
    }
  };

  hydrateGithubStats().catch(() => {
    drawFallbackGraph();
    if (statsNote) statsNote.textContent = 'Unable to load GitHub live data right now. Please refresh to retry.';
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => null));
  }

  // Tab switching functionality
  const tabBtns = [...document.querySelectorAll('.tab-btn')];
  const tabContents = [...document.querySelectorAll('.tab-content')];
  const tabLinks = [...document.querySelectorAll('[data-open-tab]')];

  function activateTab(tabId) {
    const targetButton = tabBtns.find((btn) => btn.dataset.tab === tabId);
    const targetContent = document.getElementById(tabId);
    if (!targetButton || !targetContent) return;

    tabBtns.forEach((btn) => {
      const active = btn === targetButton;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    tabContents.forEach((content) => {
      content.classList.toggle('active', content === targetContent);
    });
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  tabLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const targetTab = link.getAttribute('data-open-tab');
      if (targetTab) activateTab(targetTab);
    });
  });

  if (window.location.hash === '#side-story') {
    activateTab('sidestory');
    const lifeStory = document.getElementById('life-story');
    if (lifeStory) lifeStory.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }
  const timelineItems = [...document.querySelectorAll('.timeline-item')];
  const timelineButtons = [...document.querySelectorAll('.timeline-header')];
  const chapterChips = [...document.querySelectorAll('.chapter-chip')];

  function closeTimelineItem(item) {
    const btn = item.querySelector('.timeline-header');
    const content = item.querySelector('.timeline-content');
    btn?.setAttribute('aria-expanded', 'false');
    item.classList.remove('active');
    if (content) content.hidden = true;
  }

  function openTimelineItem(item) {
    const btn = item.querySelector('.timeline-header');
    const content = item.querySelector('.timeline-content');
    btn?.setAttribute('aria-expanded', 'true');
    item.classList.add('active');
    if (content) content.hidden = false;
  }

  timelineButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.timeline-item');
      if (!item) return;
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      timelineItems.forEach(closeTimelineItem);
      if (!isOpen) openTimelineItem(item);
    });
  });

  chapterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const chapter = chip.dataset.chapter;
      chapterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      timelineItems.forEach((item) => {
        const isVisible = chapter === 'all' || item.dataset.chapter === chapter;
        item.classList.toggle('is-hidden', !isVisible);
        if (!isVisible) closeTimelineItem(item);
      });

      const firstVisible = timelineItems.find((item) => !item.classList.contains('is-hidden'));
      if (firstVisible) openTimelineItem(firstVisible);
    });
  });

  if (timelineItems.length) openTimelineItem(timelineItems[0]);

})();
