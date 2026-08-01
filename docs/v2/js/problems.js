/* ==========================================================================
   problems.js — powers problems.html
   ========================================================================== */

(async () => {
  const tbody = document.getElementById('problems-tbody');
  const searchInput = document.getElementById('search-input');
  const difficultyFilter = document.getElementById('filter-difficulty');
  const tagFilter = document.getElementById('filter-tag');
  const statusFilter = document.getElementById('filter-status');
  const topicChips = document.getElementById('topic-chips');
  const paginationInfo = document.getElementById('pagination-info');
  const paginationControls = document.getElementById('pagination-controls');
  const subtitle = document.getElementById('problems-count-subtitle');

  const PAGE_SIZE = 15;
  let state = {
    all: [],
    filtered: [],
    page: 1,
    sortKey: 'frontend_id',
    sortDir: 'asc',
  };

  try {
    const [questions, profile, streaks] = await Promise.all([
      GitHubData.getQuestions(),
      GitHubData.getProfile(),
      GitHubData.getStreaks(),
    ]);

    document.getElementById('sidebar-username').textContent = '@' + (profile.username || 'user');
    document.getElementById('last-updated-text').textContent = App.timeAgo(profile.lastUpdated);
    document.getElementById('term-current-streak').innerHTML = `${streaks.current} day${streaks.current === 1 ? '' : 's'}<span class="term-cursor"></span>`;

    state.all = questions;
    subtitle.textContent = `${questions.length} problems tracked`;

    populateTagFilter(questions);
    renderTopicChips(questions);
    applyFilters();
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="8"><div class="error-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
      <div class="title">Could not load problems</div>${err.message}
    </div></td></tr>`;
    App.toast('Failed to load problems.json', 'error');
  }

  function populateTagFilter(questions) {
    const tagSet = new Set();
    questions.forEach(q => (q.tags || []).forEach(t => tagSet.add(t)));
    [...tagSet].sort().forEach(tag => {
      const opt = document.createElement('option');
      opt.value = tag;
      opt.textContent = tag;
      tagFilter.appendChild(opt);
    });
  }

  function renderTopicChips(questions) {
    const counts = new Map();
    questions.forEach(q => (q.tags || []).forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
    const topics = [...counts.entries()].sort((a, b) => b[1] - a[1]);

    if (topics.length === 0) {
      topicChips.innerHTML = `<span style="color:var(--text-muted); font-size:13px;">No topics found</span>`;
      return;
    }

    topicChips.innerHTML = topics.map(([tag, count]) => `
      <button type="button" class="topic-chip" data-tag="${tag}">
        ${tag}
        <span class="topic-chip-count">${count}</span>
      </button>
    `).join('');

    topicChips.querySelectorAll('.topic-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        const isActive = chip.classList.contains('active');
        tagFilter.value = isActive ? '' : tag;
        syncTopicChips();
        applyFilters();
      });
    });
  }

  function syncTopicChips() {
    const active = tagFilter.value;
    topicChips.querySelectorAll('.topic-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.tag === active);
    });
  }

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const diff = difficultyFilter.value;
    const tag = tagFilter.value;
    const status = statusFilter.value;

    state.filtered = state.all.filter(q => {
      if (diff && q.difficulty !== diff) return false;
      if (status && q.status !== status) return false;
      if (tag && !(q.tags || []).includes(tag)) return false;
      if (query) {
        const haystack = (q.title + ' ' + (q.tags || []).join(' ')).toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    sortFiltered();
    state.page = 1;
    render();
  }

  function sortFiltered() {
    const { sortKey, sortDir } = state;
    const dir = sortDir === 'asc' ? 1 : -1;
    state.filtered.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'frontend_id' || sortKey === 'num_submitted') { av = Number(av); bv = Number(bv); }
      if (sortKey === 'last_submitted_at') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
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
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <div class="title">No problems match your filters</div>Try clearing search or filters.
      </div></td></tr>`;
    } else {
      tbody.innerHTML = pageItems.map((q, i) => `
        <tr>
          <td>${start + i + 1}</td>
          <td>${q.frontend_id}</td>
          <td><a class="problem-link" href="https://leetcode.com/problems/${q.title_slug}/" target="_blank" rel="noopener">${q.title}</a></td>
          <td><span class="badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span></td>
          <td><span class="badge ${q.status === 'SOLVED' ? 'solved' : 'unsolved'}">${q.status}</span></td>
          <td><div class="tag-list-bar">${(q.tags || []).slice(0, 3).map(t => `<span class="tag-pill">${t}</span>`).join('')}${(q.tags || []).length > 3 ? `<span class="tag-pill">+${q.tags.length - 3}</span>` : ''}</div></td>
          <td>${App.formatDate(q.last_submitted_at)}</td>
          <td>${q.num_submitted}</td>
        </tr>
      `).join('');
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
  difficultyFilter.addEventListener('change', applyFilters);
  tagFilter.addEventListener('change', () => { syncTopicChips(); applyFilters(); });
  statusFilter.addEventListener('change', applyFilters);
})();
