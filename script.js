(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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



  // AR TelePrompt tab groups
  const arTabGroups = [...document.querySelectorAll('[data-tab-group]')];
  arTabGroups.forEach((group) => {
    const buttons = [...group.querySelectorAll('.ar-tab-btn')];
    const panels = [...group.querySelectorAll('.ar-tab-panel')];

    const activateArTab = (tabId) => {
      const targetBtn = buttons.find((btn) => btn.dataset.arTab === tabId);
      const targetPanel = panels.find((panel) => panel.id === tabId);
      if (!targetBtn || !targetPanel) return;

      buttons.forEach((btn) => {
        const active = btn === targetBtn;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
      });

      panels.forEach((panel) => {
        panel.classList.toggle('active', panel === targetPanel);
      });
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => activateArTab(btn.dataset.arTab));
    });
  });
  if (window.location.hash === '#side-story-tab') {
    activateTab('sidestory');
    const lifeStory = document.getElementById('life-story');
    if (lifeStory) lifeStory.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  const bindMediaPreview = (inputId, previewId) => {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;

    input.addEventListener('change', () => {
      preview.innerHTML = '';
      const files = [...(input.files || [])];
      files.forEach((file) => {
        const fig = document.createElement('figure');
        fig.className = 'media-item';
        const url = URL.createObjectURL(file);

        if (file.type.startsWith('video/')) {
          const video = document.createElement('video');
          video.src = url;
          video.controls = true;
          video.preload = 'metadata';
          fig.appendChild(video);
        } else {
          const img = document.createElement('img');
          img.src = url;
          img.alt = file.name;
          img.loading = 'lazy';
          fig.appendChild(img);
        }

        const cap = document.createElement('figcaption');
        cap.textContent = file.name;
        fig.appendChild(cap);
        preview.appendChild(fig);
      });
    });
  };

  bindMediaPreview('project-media-input', 'project-media-preview');

})();
