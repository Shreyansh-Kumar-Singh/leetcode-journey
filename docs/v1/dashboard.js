/* ==========================================================================
   dashboard.js — populates index.html
   ========================================================================== */

(async () => {
  const statsGrid = document.getElementById('stats-grid');

  function skeletonCards(n) {
    return Array.from({ length: n }).map(() =>
      `<div class="skeleton skel-stat"></div>`
    ).join('');
  }
  statsGrid.innerHTML = skeletonCards(6);

  const icon = {
    total: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    easy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`,
    medium: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>`,
    hard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l9 18H3z"/></svg>`,
    rate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>`,
    subs: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3v5h5"/><path d="M6 3h8l5 5v13H6z"/></svg>`,
    streak: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c1 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-2.5-1-2.5s2 1 2 4.5a5 5 0 0 1-10 0C7 8 12 6 12 2z"/></svg>`,
  };

  function statCard(id, label, iconKey, colorClass) {
    return `
      <div class="card stat-card fade-up">
        <div class="stat-icon ${colorClass}">${icon[iconKey]}</div>
        <div class="stat-value count-up" id="${id}">0</div>
        <div class="stat-label">${label}</div>
      </div>`;
  }

  try {
    const [stats, profile, streaks] = await Promise.all([
      GitHubData.getStats(),
      GitHubData.getProfile(),
      GitHubData.getStreaks(),
    ]);

    document.getElementById('sidebar-username').textContent = '@' + (profile.username || 'user');
    document.getElementById('last-updated-text').textContent = App.timeAgo(profile.lastUpdated);
    document.getElementById('term-current-streak').innerHTML =
      `${streaks.current} day${streaks.current === 1 ? '' : 's'}<span class="term-cursor"></span>`;

    statsGrid.innerHTML = [
      statCard('stat-total', 'Total solved', 'total', 'teal'),
      statCard('stat-easy', 'Easy', 'easy', 'easy'),
      statCard('stat-medium', 'Medium', 'medium', 'medium'),
      statCard('stat-hard', 'Hard', 'hard', 'hard'),
      statCard('stat-rate', 'Acceptance rate', 'rate', 'info'),
      statCard('stat-subs', 'Total submissions', 'subs', 'violet'),
      statCard('stat-streak', 'Current streak', 'streak', 'teal'),
      statCard('stat-longest', 'Longest streak', 'streak', 'violet'),
    ].join('');

    App.animateCount(document.getElementById('stat-total'), stats.totalQuestions || 0);
    App.animateCount(document.getElementById('stat-easy'), stats.difficultyCounts?.EASY || 0);
    App.animateCount(document.getElementById('stat-medium'), stats.difficultyCounts?.MEDIUM || 0);
    App.animateCount(document.getElementById('stat-hard'), stats.difficultyCounts?.HARD || 0);
    App.animateCount(document.getElementById('stat-rate'), stats.acceptanceRate || 0, { decimals: 1, suffix: '%' });
    App.animateCount(document.getElementById('stat-subs'), stats.totalSubmissions || 0);
    App.animateCount(document.getElementById('stat-streak'), streaks.current, { suffix: ' d' });
    App.animateCount(document.getElementById('stat-longest'), streaks.longest, { suffix: ' d' });

    renderDifficultyChart(stats.difficultyCounts);
    renderLanguageChart(stats.languageCounts);
    await renderRecentSubmissions();
    await renderTopTags();

  } catch (err) {
    console.error(err);
    statsGrid.innerHTML = `<div class="card error-state" style="grid-column: 1 / -1;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
      <div class="title">Could not load dashboard data</div>
      <div>${err.message}</div>
    </div>`;
    App.toast('Failed to load data files', 'error');
  }

  function renderDifficultyChart(counts = {}) {
    const ctx = document.getElementById('chart-difficulty');
    const style = getComputedStyle(document.documentElement);
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Easy', 'Medium', 'Hard'],
        datasets: [{
          data: [counts.EASY || 0, counts.MEDIUM || 0, counts.HARD || 0],
          backgroundColor: [style.getPropertyValue('--easy'), style.getPropertyValue('--medium'), style.getPropertyValue('--hard')],
          borderWidth: 0,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '68%',
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  function renderLanguageChart(counts = {}) {
    const ctx = document.getElementById('chart-language');
    const style = getComputedStyle(document.documentElement);
    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const palette = [style.getPropertyValue('--accent-teal'), style.getPropertyValue('--accent-violet'), style.getPropertyValue('--info'), style.getPropertyValue('--medium'), style.getPropertyValue('--hard')];
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: labels.map((_, i) => palette[i % palette.length]),
          borderRadius: 6,
          maxBarThickness: 42,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true }
        }
      }
    });
  }

  async function renderRecentSubmissions() {
    const container = document.getElementById('recent-submissions');
    const [submissions, qMap] = await Promise.all([GitHubData.getSubmissions(), GitHubData.getQuestionsBySlug()]);
    const recent = [...submissions]
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      .slice(0, 8);

    if (recent.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="title">No submissions yet</div>Run the downloader to sync your latest activity.</div>`;
      return;
    }

    container.innerHTML = recent.map(s => {
      const q = qMap[s.question_slug];
      const title = q ? q.title : s.question_slug;
      const ac = s.status_display === 'Accepted';
      const ts = new Date(Number(s.timestamp) * 1000);
      return `
        <div class="sub-row">
          <span class="sub-status-dot ${ac ? 'ac' : 'fail'}"></span>
          <span class="sub-title">${title}</span>
          <span class="badge neutral">${s.language_name}</span>
          <span class="sub-meta">${App.timeAgo(ts)}</span>
        </div>`;
    }).join('');
  }

  async function renderTopTags() {
    const container = document.getElementById('top-tags');
    const tags = await GitHubData.getTags();
    const sorted = [...tags].sort((a, b) => b.count - a.count).slice(0, 6);
    const max = sorted[0]?.count || 1;

    if (sorted.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="title">No tag data</div></div>`;
      return;
    }

    container.innerHTML = sorted.map(t => `
      <div class="top-tags-row">
        <span style="min-width:110px;">${t.tag}</span>
        <div class="tag-bar-track"><div class="tag-bar-fill" style="width:${(t.count / max) * 100}%"></div></div>
        <span class="badge neutral">${t.count}</span>
      </div>
    `).join('');
  }
})();
