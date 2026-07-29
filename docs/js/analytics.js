/* ==========================================================================
   analytics.js — powers analytics.html
   ========================================================================== */

(async () => {
  const statsGrid = document.getElementById('analytics-stats');
  statsGrid.innerHTML = Array.from({ length: 4 }).map(() => `<div class="skeleton skel-stat"></div>`).join('');

  try {
    const [stats, profile, streaks, questions, heatmap, tags, languages] = await Promise.all([
      GitHubData.getStats(),
      GitHubData.getProfile(),
      GitHubData.getStreaks(),
      GitHubData.getQuestions(),
      GitHubData.getHeatmap(),
      GitHubData.getTags(),
      GitHubData.getLanguages(),
    ]);

    document.getElementById('sidebar-username').textContent = '@' + (profile.username || 'user');
    document.getElementById('last-updated-text').textContent = App.timeAgo(profile.lastUpdated);
    document.getElementById('term-current-streak').innerHTML = `${streaks.current} day${streaks.current === 1 ? '' : 's'}<span class="term-cursor"></span>`;

    const style = getComputedStyle(document.documentElement);
    const activeDays = heatmap.filter(d => d.count > 0).length;
    const avgPerActiveDay = activeDays ? (stats.totalSubmissions / activeDays) : 0;

    statsGrid.innerHTML = `
      <div class="card stat-card fade-up">
        <div class="stat-icon info">${svgTrend()}</div>
        <div class="stat-value">${stats.acceptanceRate.toFixed(1)}%</div>
        <div class="stat-label">Acceptance rate</div>
      </div>
      <div class="card stat-card fade-up">
        <div class="stat-icon teal">${svgCalendar()}</div>
        <div class="stat-value">${activeDays}</div>
        <div class="stat-label">Active days logged</div>
      </div>
      <div class="card stat-card fade-up">
        <div class="stat-icon violet">${svgCode()}</div>
        <div class="stat-value">${avgPerActiveDay.toFixed(1)}</div>
        <div class="stat-label">Avg. submissions / active day</div>
      </div>
      <div class="card stat-card fade-up">
        <div class="stat-icon medium">${svgStreak()}</div>
        <div class="stat-value">${streaks.longest} d</div>
        <div class="stat-label">Longest streak</div>
      </div>
    `;

    renderTimeline(heatmap, style);
    renderDifficulty(stats.difficultyCounts, style);
    renderLanguage(languages, style);
    renderTags(tags, style);
    renderMonthly(questions, style);

  } catch (err) {
    console.error(err);
    statsGrid.innerHTML = `<div class="card error-state" style="grid-column:1/-1;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
      <div class="title">Could not load analytics data</div>${err.message}
    </div>`;
    App.toast('Failed to load analytics data', 'error');
  }

  function svgTrend() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>`; }
  function svgCalendar() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18"/></svg>`; }
  function svgCode() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/></svg>`; }
  function svgStreak() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c1 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-2.5-1-2.5s2 1 2 4.5a5 5 0 0 1-10 0C7 8 12 6 12 2z"/></svg>`; }

  function renderTimeline(heatmap, style) {
    const sorted = [...heatmap].sort((a, b) => new Date(a.date) - new Date(b.date));
    new Chart(document.getElementById('chart-timeline'), {
      type: 'line',
      data: {
        labels: sorted.map(d => d.date),
        datasets: [{
          label: 'Submissions',
          data: sorted.map(d => d.count),
          borderColor: style.getPropertyValue('--accent-teal'),
          backgroundColor: 'rgba(46,230,196,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true }
        }
      }
    });
  }

  function renderDifficulty(counts = {}, style) {
    new Chart(document.getElementById('chart-difficulty'), {
      type: 'pie',
      data: {
        labels: ['Easy', 'Medium', 'Hard'],
        datasets: [{
          data: [counts.EASY || 0, counts.MEDIUM || 0, counts.HARD || 0],
          backgroundColor: [style.getPropertyValue('--easy'), style.getPropertyValue('--medium'), style.getPropertyValue('--hard')],
          borderWidth: 0,
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }

  function renderLanguage(languages, style) {
    const palette = [style.getPropertyValue('--accent-teal'), style.getPropertyValue('--accent-violet'), style.getPropertyValue('--info'), style.getPropertyValue('--medium'), style.getPropertyValue('--hard')];
    new Chart(document.getElementById('chart-language'), {
      type: 'doughnut',
      data: {
        labels: languages.map(l => l.language),
        datasets: [{
          data: languages.map(l => l.count),
          backgroundColor: languages.map((_, i) => palette[i % palette.length]),
          borderWidth: 0,
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom' } } }
    });
  }

  function renderTags(tags, style) {
    const top = [...tags].sort((a, b) => b.count - a.count).slice(0, 10);
    new Chart(document.getElementById('chart-tags'), {
      type: 'bar',
      data: {
        labels: top.map(t => t.tag),
        datasets: [{
          data: top.map(t => t.count),
          backgroundColor: style.getPropertyValue('--accent-violet'),
          borderRadius: 5,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true },
          y: { grid: { display: false } }
        }
      }
    });
  }

  function renderMonthly(questions, style) {
    const solved = questions.filter(q => q.status === 'SOLVED' && q.last_submitted_at);
    const byMonth = {};
    solved.forEach(q => {
      const d = new Date(q.last_submitted_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    const labels = Object.keys(byMonth).sort();
    new Chart(document.getElementById('chart-monthly'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: labels.map(k => byMonth[k]),
          backgroundColor: style.getPropertyValue('--accent-teal'),
          borderRadius: 5,
          maxBarThickness: 34,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }
})();
