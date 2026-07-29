/* ==========================================================================
   submissions.js — powers submissions.html
   ========================================================================== */

(async () => {
  const tbody = document.getElementById('submissions-tbody');
  const statsGrid = document.getElementById('submissions-stats');
  const searchInput = document.getElementById('search-input');
  const languageFilter = document.getElementById('filter-language');
  const statusFilter = document.getElementById('filter-status');
  const dateFilter = document.getElementById('filter-date');
  const paginationInfo = document.getElementById('pagination-info');
  const paginationControls = document.getElementById('pagination-controls');
  const subtitle = document.getElementById('submissions-count-subtitle');

  statsGrid.innerHTML = Array.from({ length: 4 }).map(() => `<div class="skeleton skel-stat"></div>`).join('');

  const PAGE_SIZE = 15;
  let state = {
    all: [],
    filtered: [],
    page: 1,
    sortKey: 'timestamp',
    sortDir: 'desc',
  };

  try {
    const [submissions, qMap, profile, streaks] = await Promise.all([
      GitHubData.getSubmissions(),
      GitHubData.getQuestionsBySlug(),
      GitHubData.getProfile(),
      GitHubData.getStreaks(),
    ]);

    document.getElementById('sidebar-username').textContent = '@' + (profile.username || 'user');
    document.getElementById('last-updated-text').textContent = App.timeAgo(profile.lastUpdated);
    document.getElementById('term-current-streak').innerHTML = `${streaks.current} day${streaks.current === 1 ? '' : 's'}<span class="term-cursor"></span>`;

    state.all = submissions.map(s => ({
      ...s,
      question: qMap[s.question_slug]?.title || s.question_slug,
    }));
    subtitle.textContent = `${submissions.length} submissions tracked`;

    renderStats(state.all);
    populateLanguageFilter(state.all);
    applyFilters();

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7"><div class="error-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
      <div class="title">Could not load submissions</div>${err.message}
    </div></td></tr>`;
    statsGrid.innerHTML = '';
    App.toast('Failed to load submissions.json', 'error');
  }

  function renderStats(all) {
    const total = all.length;
    const accepted = all.filter(s => s.status_display === 'Accepted').length;
    const rate = total ? ((accepted / total) * 100).toFixed(1) : '0.0';
    const langCounts = {};
    all.forEach(s => { langCounts[s.language_name] = (langCounts[s.language_name] || 0) + 1; });
    const topLang = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0];

    statsGrid.innerHTML = `
      <div class="card stat-card fade-up">
        <div class="stat-icon violet">${svgList()}</div>
        <div class="stat-value">${total}</div>
        <div class="stat-label">Total submissions</div>
      </div>
      <div class="card stat-card fade-up">
        <div class="stat-icon teal">${svgCheck()}</div>
        <div class="stat-value">${accepted}</div>
        <div class="stat-label">Accepted</div>
      </div>
      <div class="card stat-card fade-up">
        <div class="stat-icon info">${svgTrend()}</div>
        <div class="stat-value">${rate}%</div>
        <div class="stat-label">Acceptance rate</div>
      </div>
      <div class="card stat-card fade-up">
        <div class="stat-icon medium">${svgCode()}</div>
        <div class="stat-value" style="font-size:20px;">${topLang ? topLang[0] : '—'}</div>
        <div class="stat-label">Most used language</div>
      </div>
    `;
  }

  function svgList() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 4h11M9 12h11M9 20h11"/><circle cx="4" cy="4" r="1.6"/><circle cx="4" cy="12" r="1.6"/><circle cx="4" cy="20" r="1.6"/></svg>`; }
  function svgCheck() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`; }
  function svgTrend() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>`; }
  function svgCode() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/></svg>`; }

  function populateLanguageFilter(all) {
    const langs = [...new Set(all.map(s => s.language_name))].sort();
    langs.forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang;
      opt.textContent = lang;
      languageFilter.appendChild(opt);
    });
  }

  function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    const lang = languageFilter.value;
    const status = statusFilter.value;
    const days = dateFilter.value ? Number(dateFilter.value) : null;
    const cutoff = days ? Date.now() / 1000 - days * 86400 : null;

    state.filtered = state.all.filter(s => {
      if (q && !s.question.toLowerCase().includes(q)) return false;
      if (lang && s.language_name !== lang) return false;
      if (status && s.status_display !== status) return false;
      if (cutoff && Number(s.timestamp) < cutoff) return false;
      return true;
    });

    sortFiltered();
    state.page = 1;
    render();
  }

  function sortFiltered() {
    if (!state.filtered) return;
    const { sortKey, sortDir } = state;
    const dir = sortDir === 'asc' ? 1 : -1;
    state.filtered.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'submission_id' || sortKey === 'timestamp') { av = Number(av); bv = Number(bv); }
      if (sortKey === 'runtime') { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0; }
      if (sortKey === 'memory') { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0; }
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }

  function render() {
    const total = state.filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = state.filtered.slice(start, start + PAGE_SIZE);

    if (total === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <div class="title">No submissions match your filters</div>Try clearing search or filters.
      </div></td></tr>`;
    } else {
      tbody.innerHTML = pageItems.map(s => {
        const ac = s.status_display === 'Accepted';
        return `
        <tr>
          <td>${s.submission_id}</td>
          <td><a class="problem-link" href="https://leetcode.com/problems/${s.question_slug}/" target="_blank" rel="noopener">${s.question}</a></td>
          <td><span class="badge neutral">${s.language_name}</span></td>
          <td>${s.runtime || '—'}</td>
          <td>${s.memory || '—'}</td>
          <td><span class="badge ${ac ? 'ac' : 'fail'}">${s.status_display}</span></td>
          <td>${App.formatDate(new Date(Number(s.timestamp) * 1000))}</td>
        </tr>`;
      }).join('');
    }

    paginationInfo.textContent = total === 0 ? 'No results' : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total}`;
    renderPaginationControls(totalPages);
    updateSortArrows();
  }

  function renderPaginationControls(totalPages) {
    const { page } = state;
    let html = `<button class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>‹</button>`;
    const windowSize = 2;
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= windowSize) {
        html += `<button class="page-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
      } else if (Math.abs(p - page) === windowSize + 1) {
        html += `<span class="page-btn" style="border:none;background:none;">…</span>`;
      }
    }
    html += `<button class="page-btn" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>›</button>`;
    paginationControls.innerHTML = html;
    paginationControls.querySelectorAll('.page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = Number(btn.dataset.page);
        if (p >= 1 && p <= totalPages) { state.page = p; render(); }
      });
    });
  }

  function updateSortArrows() {
    document.querySelectorAll('th[data-sort]').forEach(th => {
      const arrow = th.querySelector('.sort-arrow');
      if (th.dataset.sort === state.sortKey) {
        arrow.textContent = state.sortDir === 'asc' ? '▲' : '▼';
      } else {
        arrow.textContent = '';
      }
    });
  }

  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = key;
        state.sortDir = 'asc';
      }
      sortFiltered();
      render();
    });
  });

  searchInput.addEventListener('input', App.debounce(applyFilters, 200));
  languageFilter.addEventListener('change', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  dateFilter.addEventListener('change', applyFilters);
})();
