/* ==========================================================================
   heatmap.js — powers heatmap.html
   GitHub-style contribution calendar built from heatmap.json
   ========================================================================== */

(async () => {
  const statsGrid = document.getElementById('heatmap-stats');
  const yearChips = document.getElementById('year-chips');
  const container = document.getElementById('heatmap-container');
  const tooltip = document.getElementById('hm-tooltip');

  statsGrid.innerHTML = Array.from({ length: 4 }).map(() => `<div class="skeleton skel-stat"></div>`).join('');
  container.innerHTML = `<div class="skeleton" style="height:130px;width:100%;"></div>`;

  let countByDate = {};
  let years = [];
  let activeYear = null;

  try {
    const [heatmap, profile, streaks] = await Promise.all([
      GitHubData.getHeatmap(),
      GitHubData.getProfile(),
      GitHubData.getStreaks(),
    ]);

    document.getElementById('sidebar-username').textContent = '@' + (profile.username || 'user');
    document.getElementById('last-updated-text').textContent = App.timeAgo(profile.lastUpdated);
    document.getElementById('term-current-streak').innerHTML = `${streaks.current} day${streaks.current === 1 ? '' : 's'}<span class="term-cursor"></span>`;

    heatmap.forEach(d => { countByDate[d.date] = (countByDate[d.date] || 0) + d.count; });
    years = [...new Set(heatmap.map(d => d.date.slice(0, 4)))].sort((a, b) => b - a);
    activeYear = years[0] || String(new Date().getFullYear());

    const totalSubs = heatmap.reduce((sum, d) => sum + d.count, 0);
    const activeDays = Object.values(countByDate).filter(c => c > 0).length;
    const bestDay = heatmap.reduce((best, d) => (d.count > (best?.count || 0) ? d : best), null);

    statsGrid.innerHTML = `
      <div class="card stat-card fade-up">
        <div class="stat-icon teal">${svgFlame()}</div>
        <div class="stat-value">${streaks.current}</div>
        <div class="stat-label">Current streak (days)</div>
      </div>
      <div class="card stat-card fade-up">
        <div class="stat-icon violet">${svgFlame()}</div>
        <div class="stat-value">${streaks.longest}</div>
        <div class="stat-label">Longest streak (days)</div>
      </div>
      <div class="card stat-card fade-up">
        <div class="stat-icon info">${svgCalendar()}</div>
        <div class="stat-value">${activeDays}</div>
        <div class="stat-label">Total active days</div>
      </div>
      <div class="card stat-card fade-up">
        <div class="stat-icon medium">${svgBolt()}</div>
        <div class="stat-value">${bestDay ? bestDay.count : 0}</div>
        <div class="stat-label">Best day${bestDay ? ' · ' + App.formatDate(bestDay.date) : ''}</div>
      </div>
    `;

    renderYearChips();
    renderCalendar(activeYear);

  } catch (err) {
    console.error(err);
    statsGrid.innerHTML = `<div class="card error-state" style="grid-column:1/-1;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
      <div class="title">Could not load heatmap data</div>${err.message}
    </div>`;
    container.innerHTML = '';
    App.toast('Failed to load heatmap.json', 'error');
  }

  function svgFlame() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c1 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-2.5-1-2.5s2 1 2 4.5a5 5 0 0 1-10 0C7 8 12 6 12 2z"/></svg>`; }
  function svgCalendar() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18"/></svg>`; }
  function svgBolt() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h7l-1 8 11-13h-7l1-7z"/></svg>`; }

  function renderYearChips() {
    if (years.length === 0) { yearChips.innerHTML = ''; return; }
    yearChips.innerHTML = years.map(y =>
      `<button class="year-chip ${y === activeYear ? 'active' : ''}" data-year="${y}">${y}</button>`
    ).join('');
    yearChips.querySelectorAll('.year-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        activeYear = btn.dataset.year;
        yearChips.querySelectorAll('.year-chip').forEach(b => b.classList.toggle('active', b === btn));
        renderCalendar(activeYear);
      });
    });
  }

  function levelFor(count) {
    if (!count) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
  }

  function renderCalendar(year) {
    const start = new Date(`${year}-01-01T00:00:00`);
    const end = new Date(`${year}-12-31T00:00:00`);
    // Align the grid to start on a Sunday for a clean 7-row layout.
    const gridStart = new Date(start);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const days = [];
    const cursor = new Date(gridStart);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const monthLabels = [];
    let lastMonth = -1;
    days.forEach((d, i) => {
      if (d.getDay() === 0) {
        const month = d.getMonth();
        if (d >= start && month !== lastMonth) {
          monthLabels.push(d.toLocaleDateString(undefined, { month: 'short' }));
          lastMonth = month;
        } else {
          monthLabels.push('');
        }
      }
    });

    const monthLabelsHTML = `<div class="month-labels">${monthLabels.map(m => `<div>${m}</div>`).join('')}</div>`;

    const cellsHTML = days.map(d => {
      const key = d.toISOString().slice(0, 10);
      const inYear = d >= start && d <= end;
      const count = countByDate[key] || 0;
      const level = inYear ? levelFor(count) : 0;
      return `<div class="heatmap-cell" data-level="${inYear ? level : ''}" data-date="${key}" data-count="${count}" style="${inYear ? '' : 'visibility:hidden;'}"></div>`;
    }).join('');

    container.innerHTML = `${monthLabelsHTML}<div class="heatmap-grid">${cellsHTML}</div>`;

    container.querySelectorAll('.heatmap-cell[data-date]').forEach(cell => {
      cell.addEventListener('mouseenter', (e) => {
        const { date, count } = cell.dataset;
        tooltip.textContent = `${count} submission${count === '1' ? '' : 's'} · ${App.formatDate(date)}`;
        tooltip.classList.add('show');
      });
      cell.addEventListener('mousemove', (e) => {
        tooltip.style.left = e.clientX + 14 + 'px';
        tooltip.style.top = e.clientY - 34 + 'px';
      });
      cell.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
    });
  }
})();
