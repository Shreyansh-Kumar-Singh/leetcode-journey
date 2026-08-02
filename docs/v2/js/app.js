/* ==========================================================================
   app.js — shared UI behaviors used across every page
   (theme toggle, mobile sidebar, toasts, scroll-to-top, counters, clock)
   ========================================================================== */

const App = (() => {
  const THEME_KEY = 'lj-theme';

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  }

  function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.menu-toggle');
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (!sidebar || !toggle) return;

    const open = () => { sidebar.classList.add('open'); backdrop && backdrop.classList.add('show'); };
    const close = () => { sidebar.classList.remove('open'); backdrop && backdrop.classList.remove('show'); };

    toggle.addEventListener('click', () => {
      sidebar.classList.contains('open') ? close() : open();
    });
    backdrop && backdrop.addEventListener('click', close);
    sidebar.querySelectorAll('.nav-item').forEach(a => a.addEventListener('click', close));
  }

  function initScrollTop() {
    const btn = document.querySelector('.scroll-top-btn');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('show', window.scrollY > 400);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function initCopyRepoLink() {
    document.querySelectorAll('[data-copy-repo]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const url = 'https://github.com/Shreyansh-Kumar-Singh/leetcode-journey';
        try {
          await navigator.clipboard.writeText(url);
          toast('Repository link copied to clipboard', 'success');
        } catch (e) {
          toast('Could not copy link', 'error');
        }
      });
    });
  }

  function toast(message, type = 'info', duration = 3200) {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    el.innerHTML = `<strong>${icons[type] || ''}</strong><span>${message}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 220);
    }, duration);
  }

  function animateCount(el, target, opts = {}) {
    const duration = opts.duration || 900;
    const decimals = opts.decimals || 0;
    const suffix = opts.suffix || '';
    const start = 0;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = start + (target - start) * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(step);
  }

  function setActiveNav() {
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach(a => {
      const href = a.getAttribute('href');
      a.classList.toggle('active', href === path);
    });
  }

  function timeAgo(dateInput) {
    const date = new Date(dateInput);
    if (isNaN(date)) return '—';
    const diffMs = Date.now() - date.getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}d ago`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month}mo ago`;
    return `${Math.floor(month / 12)}y ago`;
  }

  function formatDate(dateInput) {
    const date = new Date(dateInput);
    if (isNaN(date)) return '—';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatTime(dateInput) {
    const date = new Date(dateInput);
    if (isNaN(date)) return '—';
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function formatDayHeader(dateInput) {
    const date = new Date(dateInput);
    if (isNaN(date)) return '—';
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  /* ------------------------------------------------------------------
     Submission-history modal — shows every submitted attempt for a
     single question, grouped day by day. Triggered from the "History"
     action button on the Problems and Submissions pages.
     ------------------------------------------------------------------ */

  function ensureModal() {
    let modal = document.getElementById('lj-modal-root');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'lj-modal-root';
    modal.className = 'lj-modal-backdrop';
    modal.innerHTML = `
      <div class="lj-modal" role="dialog" aria-modal="true" aria-labelledby="lj-modal-title">
        <div class="lj-modal-header">
          <div>
            <div class="lj-modal-title" id="lj-modal-title">Submission history</div>
            <div class="lj-modal-subtitle" id="lj-modal-subtitle"></div>
          </div>
          <button class="lj-modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="lj-modal-body" id="lj-modal-body"></div>
      </div>`;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    modal.querySelector('.lj-modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
    });

    return modal;
  }

  function closeModal() {
    const modal = document.getElementById('lj-modal-root');
    if (!modal) return;
    modal.classList.remove('show');
    document.body.classList.remove('lj-modal-open');
  }

  function statusBadgeClass(statusDisplay) {
    return statusDisplay === 'Accepted' ? 'ac' : 'fail';
  }

  async function openSubmissionHistory(titleSlug, titleText) {
    if (typeof GitHubData === 'undefined') return;
    const modal = ensureModal();
    const titleEl = document.getElementById('lj-modal-title');
    const subtitleEl = document.getElementById('lj-modal-subtitle');
    const body = document.getElementById('lj-modal-body');

    titleEl.textContent = titleText || 'Submission history';
    subtitleEl.textContent = 'Loading every attempt for this problem…';
    body.innerHTML = `<div class="skeleton skel-row"></div><div class="skeleton skel-row"></div><div class="skeleton skel-row"></div>`;

    modal.classList.add('show');
    document.body.classList.add('lj-modal-open');

    try {
      const submissions = await GitHubData.getSubmissions();
      const list = submissions
        .filter(s => s.question_slug === titleSlug)
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

      if (list.length === 0) {
        subtitleEl.textContent = 'No recorded attempts yet';
        body.innerHTML = `<div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <div class="title">No submissions found</div>This problem has no recorded attempts.
        </div>`;
        return;
      }

      const groups = {};
      list.forEach(s => {
        const d = new Date(Number(s.timestamp) * 1000);
        const key = d.toISOString().slice(0, 10);
        (groups[key] = groups[key] || []).push(s);
      });
      const dayKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

      subtitleEl.textContent = `${list.length} submission${list.length === 1 ? '' : 's'} across ${dayKeys.length} day${dayKeys.length === 1 ? '' : 's'}`;

      body.innerHTML = dayKeys.map(key => {
        const items = groups[key];
        const dayLabel = formatDayHeader(new Date(Number(items[0].timestamp) * 1000));
        return `
        <div class="submission-day-group">
          <div class="submission-day-header">
            <span>${dayLabel}</span>
            <span class="submission-day-count">${items.length} attempt${items.length === 1 ? '' : 's'}</span>
          </div>
          <div class="submission-day-items">
            ${items.map(s => `
              <div class="submission-item">
                <span class="badge ${statusBadgeClass(s.status_display)}">${s.status_display}</span>
                <span class="submission-item-lang">${s.language_name}</span>
                <span class="submission-item-time">${formatTime(new Date(Number(s.timestamp) * 1000))}</span>
                <span class="submission-item-runtime">${s.runtime || '—'}</span>
                <span class="submission-item-memory">${s.memory || '—'}</span>
              </div>
            `).join('')}
          </div>
        </div>`;
      }).join('');
    } catch (err) {
      subtitleEl.textContent = '';
      body.innerHTML = `<div class="error-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
        <div class="title">Could not load submissions</div>${err.message}
      </div>`;
    }
  }

  function debounce(fn, wait = 250) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function chartDefaults() {
    if (typeof Chart === 'undefined') return;
    const styles = getComputedStyle(document.documentElement);
    const textSecondary = styles.getPropertyValue('--text-secondary').trim() || '#8b93a8';
    Chart.defaults.color = textSecondary;
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    Chart.defaults.plugins.legend.labels.padding = 16;
  }

  function init() {
    initTheme();
    initSidebar();
    initScrollTop();
    initCopyRepoLink();
    setActiveNav();
    chartDefaults();

    const themeBtn = document.querySelector('[data-theme-toggle]');
    themeBtn && themeBtn.addEventListener('click', () => {
      toggleTheme();
      chartDefaults();
      window.dispatchEvent(new CustomEvent('lj-theme-changed'));
    });

    const exportBtn = document.querySelector('[data-export-stats]');
    exportBtn && exportBtn.addEventListener('click', async () => {
      try {
        const stats = await GitHubData.getStats();
        const profile = await GitHubData.getProfile();
        const blob = new Blob([JSON.stringify({ profile, stats }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leetcode-stats.json';
        a.click();
        URL.revokeObjectURL(url);
        toast('Statistics exported', 'success');
      } catch (e) {
        toast('Export failed — data not loaded yet', 'error');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    toggleTheme, toast, animateCount, setActiveNav, timeAgo, formatDate, formatTime,
    formatDayHeader, debounce, chartDefaults, openSubmissionHistory, closeModal,
  };
})();
