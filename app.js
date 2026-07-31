// ============================================
// LuckyPick - Main App (SPA Router)
// ============================================
import { t, setLanguage, getCurrentLanguage, getAvailableLanguages } from './i18n.js?v=2026073104';
import * as homePage from './pages/home.js?v=2026073104';
import * as historyPage from './pages/history.js?v=2026073104';
import * as profilePage from './pages/profile.js?v=2026073104';
import * as adminPage from './pages/admin.js?v=2026073104';

// --- State ---
let currentPage = null;
let currentCleanup = null;

// --- Router ---
const routes = {
  home: homePage,
  history: historyPage,
  profile: profilePage,
  admin: adminPage,
};

function getPageFromHash() {
  const hash = window.location.hash.replace('#', '').split('?')[0];
  return hash || 'home';
}

function renderHeader(pageName) {
  if (pageName === 'admin') return ''; // Admin has its own header

  const langs = getAvailableLanguages();
  const curLang = getCurrentLanguage();

  return `
    <header class="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm flex justify-between items-center h-16 px-container-margin max-w-full">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary">language</span>
        <span class="font-display-lg text-primary font-extrabold text-[24px] cursor-pointer" onclick="window.location.hash='#home'">LuckyPick</span>
      </div>
      <div class="flex bg-surface-container p-1 rounded-full text-label-caps overflow-x-auto hide-scrollbar gap-0.5">
        ${langs.map(l => `
          <button class="px-3 py-1 rounded-full transition-all whitespace-nowrap ${l.code === curLang ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-variant/20'}" onclick="window.__switchLang('${l.code}')">${l.label}</button>
        `).join('')}
      </div>
      <button class="flex items-center justify-center p-2 rounded-full hover:bg-surface-variant/20 transition-all" onclick="window.location.hash='#admin'" title="Admin">
        <span class="material-symbols-outlined text-primary">admin_panel_settings</span>
      </button>
    </header>`;
}

function renderBottomNav(pageName) {
  if (pageName === 'admin') return '';

  const tabs = [
    { key: 'home', icon: 'stadium', label: 'ongoing' },
    { key: 'history', icon: 'history', label: 'history' },
    { key: 'profile', icon: 'person', label: 'profile' },
  ];

  return `
    <nav class="fixed bottom-0 w-full z-50 bg-surface/80 backdrop-blur-md border-t border-outline-variant/30 shadow-lg flex justify-around items-center h-20 pb-safe px-4">
      ${tabs.map(tab => {
        const isActive = pageName === tab.key;
        return `
          <a class="flex flex-col items-center justify-center ${isActive ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1' : 'text-on-surface-variant hover:text-primary'} transition-transform scale-95 active:scale-90" href="#${tab.key}">
            <span class="material-symbols-outlined">${tab.icon}</span>
            <span class="font-label-caps text-label-caps">${t(tab.label)}</span>
          </a>`;
      }).join('')}
    </nav>`;
}

function renderWinnerToast() {
  // Show toast if user has won a product (one-time per session)
  if (sessionStorage.getItem('winner_toast_shown')) return '';
  sessionStorage.setItem('winner_toast_shown', 'true');

  return `
    <div class="fixed top-20 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full px-4 toast" id="winner-toast">
      <div class="bg-tertiary text-on-tertiary rounded-2xl p-4 shadow-2xl flex items-center gap-3 winner-glow">
        <span class="material-symbols-outlined text-3xl">emoji_events</span>
        <div class="flex-1">
          <p class="font-bold text-sm">${t('winnerNotification')}</p>
        </div>
        <button class="px-3 py-1 bg-white/20 rounded-full text-sm font-bold hover:bg-white/30 transition-all" onclick="window.location.hash='#profile'; document.getElementById('winner-toast').remove()">
          ${t('checkWinnings')}
        </button>
      </div>
    </div>`;
}

function navigate() {
  const pageName = getPageFromHash();
  const route = routes[pageName];

  if (!route) {
    window.location.hash = '#home';
    return;
  }

  // Cleanup previous page
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  const app = document.getElementById('app');

  // For admin page, render without header/nav
  if (pageName === 'admin') {
    app.innerHTML = route.render();
    // Initialize admin-specific handlers after DOM is ready
    if (route.init) route.init();
  } else {
    app.innerHTML = renderHeader(pageName) + route.render() + renderBottomNav(pageName);
  }

  // Show winner toast on first visit to home
  if (pageName === 'home') {
    app.innerHTML += renderWinnerToast();
  }

  currentPage = pageName;
  currentCleanup = route.cleanup || null;

  // Scroll to top on page change
  window.scrollTo(0, 0);
}

// --- Language Switch ---
window.__switchLang = (lang) => {
  setLanguage(lang);
  navigate(); // Re-render with new language
};

// --- Event Listeners ---
window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);
window.addEventListener('languageChanged', navigate);
