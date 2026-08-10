/* ==========================================================================
   timeline.js — powers timeline.html
   Shows every submission in the exact order it was submitted, each row
   carrying its question's difficulty + tags (joined from questions.json).
   ========================================================================== */

(async () => {
  const list = document.getElementById('timeline-list');
  const statsGrid = document.getElementById('timeline-stats');
  const searchInput = document.getElementById('search-input');
  const tagFilter = document.getElementById('filter-tag');
  const statusFilter = document.getElementById('filter-status');
  const orderToggle = document.getElementById('order-toggle');
  const orderToggleLabel = document.getElementById('order-toggle-label');
  const paginationInfo = document.getElementById('pagination-info');
  const paginationControls = document.getElementById('pagination-controls');
  const subtitle = document.getElementById('timeline-count-subtitle');

  statsGrid.innerHTML = Array.from({ length: 4 }).map(() => `<div class="skeleton skel-stat"></div>`).join('');

  const PAGE_SIZE = 20;
  let state = {
    bySeq: [],   // every submission, seq = true chronological submit order (1 = first ever)
    filtered: [],
    page: 1,
    order: 'asc', // 'asc' = oldest first (true submitted sequence), 'desc' = newest first
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

    // Enrich every submission with its question's title/difficulty/tags,
    // then sort ascending by timestamp so index 0 is the very first
    // submission ever made — that fixed position is each item's
    // permanent "seq" number, independent of any later sort/filter/page.
    const enriched = submissions.map(s => {
      const q = qMap[s.question_slug];
      return {
        ...s,
        question: q?.title || s.question_slug,
        difficulty: q?.difficulty || null,
        tags: q?.tags || [],
      };
    }).sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

    state.bySeq = enriched.map((s, i) => ({ ...s, seq: i + 1 }));
    subtitle.textContent = `${submissions.length} submissions, in submitted order`;

    renderStats(state.bySeq);
    populateTagFilter(state.bySeq);
    applyFilters();

  } catch (err) {
    console.error(err);
    list.innerHTML = `<div class="error-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
      <div class="title">Could not load timeline</div>${err.message}
    </div>`;
    statsGrid.innerHTML = '';
    App.toast('Failed to load submissions/questions data', 'error');
  }

  function renderStats(all) {
    const total = all.length;
    const uniqueQuestions = new Set(all.map(s => s.question_slug)).size;
    const first = all[0];
    const last = all[all.length - 1];
    const accepted = all.filter(s => s.status_display === 'Accepted').length;
    const rate = total ? ((accepted / total) * 100).toFixed(1) : '0.0';

    statsGrid.innerHTML = `
      <div class="card stat-card fade-up">
        <div class="stat-icon violet">${svgList()}</div>
        <div class="stat-value">${total}</div>
        <div class="stat-label">Total submissions</div>
      </div>
      <div class="card stat-card fade-up">
        <div class="stat-icon teal">${svgTarget()}</div>
        <div class="stat-value">${uniqueQuestions}</div>
        <div class="stat-label">Unique questions</div>
      </div>
      <div class="card stat-card fade-up">
        <div class="stat-icon info">${svgFlag()}</div>
        <div class="stat-value" style="font-size:18px;">${first ? App.formatDate(new Date(Number(first.timestamp) * 1000)) : '—'}</div>
        <div class="stat-label">First submission</div>
      </div>
      <div class="card stat-card fade-up">
        <div class="stat-icon medium">${svgCheck()}</div>
        <div class="stat-value">${rate}%</div>
        <div class="stat-label">Acceptance rate</div>
      </div>
    `;
  }

  function svgList() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 4h11M9 12h11M9 20h11"/><circle cx="4" cy="4" r="1.6"/><circle cx="4" cy="12" r="1.6"/><circle cx="4" cy="20" r="1.6"/></svg>`; }
  function svgTarget() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>`; }
  function svgFlag() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 21V4"/><path d="M5 4h13l-3 4 3 4H5"/></svg>`; }
  function svgCheck() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`; }

  function populateTagFilter(all) {
    const tags = [...new Set(all.flatMap(s => s.tags))].sort();
    tags.forEach(tag => {
      const opt = document.createElement('option');
      opt.value = tag;
      opt.textContent = tag;
      tagFilter.appendChild(opt);
    });
  }

  function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    const tag = tagFilter.value;
    const status = statusFilter.value;

    state.filtered = state.bySeq.filter(s => {
      if (q && !s.question.toLowerCase().includes(q) && !s.tags.some(t => t.toLowerCase().includes(q))) return false;
      if (tag && !s.tags.includes(tag)) return false;
      if (status && s.status_display !== status) return false;
      return true;
    });

    // Sort by the fixed seq number — this is what keeps both the
    // submissions AND their questions in true submitted order,
    // regardless of which direction the user is viewing them in.
    state.filtered.sort((a, b) => state.order === 'asc' ? a.seq - b.seq : b.seq - a.seq);

    state.page = 1;
    render();
  }

  function render() {
    const total = state.filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = state.filtered.slice(start, start + PAGE_SIZE);

    if (total === 0) {
      list.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <div class="title">No submissions match your filters</div>Try clearing search or filters.
      </div>`;
    } else {
      list.innerHTML = pageItems.map(s => {
        const ac = s.status_display === 'Accepted';
        const diffClass = (s.difficulty || '').toLowerCase();
        const submittedAt = new Date(Number(s.timestamp) * 1000);
        return `
        <div class="timeline-item">
          <div class="timeline-seq">
            <span class="timeline-seq-num">#${s.seq}</span>
            <span class="timeline-seq-line"></span>
          </div>
          <div class="timeline-card">
            <div class="timeline-card-top">
              <a class="problem-link" href="https://leetcode.com/problems/${s.question_slug}/" target="_blank" rel="noopener">${s.question}</a>
              ${s.difficulty ? `<span class="badge ${diffClass}">${s.difficulty}</span>` : ''}
              <span class="badge ${ac ? 'ac' : 'fail'}">${s.status_display}</span>
            </div>
            <div class="tag-list-bar">${s.tags.map(t => `<span class="tag-pill">${t}</span>`).join('') || '<span class="tag-pill">Untagged</span>'}</div>
            <div class="timeline-card-meta">
              <span>${App.formatDate(submittedAt)} · ${App.formatTime(submittedAt)}</span>
              <span class="badge neutral">${s.language_name}</span>
              <span>${s.runtime || '—'}</span>
              <span>${s.memory || '—'}</span>
              <button class="row-action-btn" data-history-slug="${s.question_slug}" data-history-title="${s.question.replace(/"/g, '&quot;')}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3v5h5"/><path d="M6 3h8l5 5v13H6z"/><path d="M9 13h6M9 17h6"/></svg>
                View
              </button>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    paginationInfo.textContent = total === 0 ? 'No results' : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total}`;
    renderPaginationControls(totalPages);
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
        if (p >= 1 && p <= totalPages) { state.page = p; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      });
    });
  }

  searchInput.addEventListener('input', App.debounce(applyFilters, 200));
  tagFilter.addEventListener('change', applyFilters);
  statusFilter.addEventListener('change', applyFilters);

  orderToggle.addEventListener('click', () => {
    state.order = state.order === 'asc' ? 'desc' : 'asc';
    orderToggle.dataset.order = state.order;
    orderToggleLabel.textContent = state.order === 'asc' ? 'Oldest first' : 'Newest first';
    applyFilters();
  });

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-history-slug]');
    if (!btn) return;
    App.openSubmissionHistory(btn.dataset.historySlug, btn.dataset.historyTitle);
  });
})();
