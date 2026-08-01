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

  return { toggleTheme, toast, animateCount, setActiveNav, timeAgo, formatDate, debounce, chartDefaults };
})();
