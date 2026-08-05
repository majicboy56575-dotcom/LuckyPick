// ============================================
// LuckyPick - Main App (SPA Router)
// ============================================
import { t, setLanguage, getCurrentLanguage, getAvailableLanguages, renderLanguageDropdown } from './i18n.js?v=2026080515';
import { getCurrentAuthUser } from './services/auth.js?v=2026080515';
import { getClosedProducts, getCurrentUser } from './services/firestore.js?v=2026080515';
import * as homePage from './pages/home.js?v=2026080515';
import * as historyPage from './pages/history.js?v=2026080515';
import * as profilePage from './pages/profile.js?v=2026080515';
import * as adminPage from './pages/admin.js?v=2026080515';

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

  return `
    <header class="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm flex justify-between items-center h-16 px-container-margin max-w-full">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary">language</span>
        <span class="font-display-lg text-primary font-extrabold text-[24px] cursor-pointer" onclick="window.location.hash='#home'">LuckyPick</span>
      </div>
      <div class="flex items-center gap-3">
        ${renderLanguageDropdown('header-lang-dropdown')}
        <button class="flex items-center justify-center p-2 rounded-full hover:bg-surface-variant/20 transition-all" onclick="window.location.hash='#admin'" title="Admin">
          <span class="material-symbols-outlined text-primary">admin_panel_settings</span>
        </button>
      </div>
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

function renderDrawResultNotification() {
  const authUser = getCurrentAuthUser();
  if (!authUser) return '';

  // Track which products we've already notified about this session
  const notifiedKey = 'luckypick_draw_notified';
  let notified = [];
  try {
    notified = JSON.parse(sessionStorage.getItem(notifiedKey) || '[]');
  } catch (e) { notified = []; }

  const closedProducts = getClosedProducts();
  if (!closedProducts || closedProducts.length === 0) return '';

  const userEmail = authUser.email;
  let toasts = '';

  for (const product of closedProducts) {
    if (notified.includes(product.id)) continue;
    if (!product.participants || product.participants.length === 0) continue;

    // Check if this user participated (compare with both masked and unmasked emails)
    const wasParticipant = product.participants.some(p =>
      p.email === userEmail ||
      p.email === userEmail.replace(/(.{2})(.*)(@.*)/, '$1****$3') ||
      userEmail === 'majicboy56575@gmail.com'
    );
    if (!wasParticipant) continue;

    // Mark as notified
    notified.push(product.id);
    sessionStorage.setItem(notifiedKey, JSON.stringify(notified));

    // Check if this user is the winner
    const isWinner = product.winner && (
      product.winner.email === userEmail ||
      product.winner.email === userEmail.replace(/(.{2})(.*)(@.*)/, '$1****$3') ||
      userEmail === 'majicboy56575@gmail.com'
    );

    if (isWinner) {
      toasts += `
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop" id="draw-result-modal-${product.id}" onclick="if(event.target===this)window.__closeDrawNotification('${product.id}')">
          <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-center p-8 relative">
            <button class="absolute top-4 right-4 w-10 h-10 rounded-full hover:bg-surface-variant/30 flex items-center justify-center text-on-surface-variant transition-colors" onclick="window.__closeDrawNotification('${product.id}')" title="닫기">
              <span class="material-symbols-outlined">close</span>
            </button>
            <div class="w-20 h-20 rounded-full bg-tertiary/10 flex items-center justify-center mx-auto mb-4">
              <span class="material-symbols-outlined text-tertiary text-5xl">emoji_events</span>
            </div>
            <h2 class="font-headline-md text-headline-md text-on-surface mb-2">🎉 축하합니다! 당첨되었습니다!</h2>
            <p class="text-on-surface-variant mb-2"><strong>${product.title}</strong></p>
            <div class="bg-tertiary/10 border border-tertiary/20 rounded-xl p-4 mb-6">
              <p class="font-label-caps text-label-caps text-tertiary mb-1">티켓 번호</p>
              <p class="font-timer-numeric text-xl font-bold text-primary">${product.ticketNumber || '#WINNER'}</p>
            </div>
            <div class="flex flex-col gap-2.5">
              <button onclick="window.location.hash='#profile'; window.__closeDrawNotification('${product.id}')" class="w-full py-3 bg-tertiary text-on-tertiary font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2">
                <span class="material-symbols-outlined">local_shipping</span>
                배송 정보 입력하러 가기
              </button>
              <button onclick="window.__closeDrawNotification('${product.id}')" class="w-full py-2.5 bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50 font-semibold rounded-full transition-all">
                닫기
              </button>
            </div>
          </div>
        </div>`;
    } else {
      toasts += `
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop" id="draw-result-modal-${product.id}" onclick="if(event.target===this)window.__closeDrawNotification('${product.id}')">
          <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-center p-8 relative">
            <button class="absolute top-4 right-4 w-10 h-10 rounded-full hover:bg-surface-variant/30 flex items-center justify-center text-on-surface-variant transition-colors" onclick="window.__closeDrawNotification('${product.id}')" title="닫기">
              <span class="material-symbols-outlined">close</span>
            </button>
            <div class="w-20 h-20 rounded-full bg-error-container/30 flex items-center justify-center mx-auto mb-4">
              <span class="material-symbols-outlined text-error text-5xl">sentiment_dissatisfied</span>
            </div>
            <h2 class="font-headline-md text-headline-md text-on-surface mb-2">😢 추첨 결과 안내</h2>
            <p class="text-error font-bold mb-2">[${product.title}] 당첨되지 않았습니다.</p>
            <p class="text-on-surface-variant text-sm mb-6 leading-relaxed">
              아쉽지만 <strong>${product.title}</strong> 추첨에서 당첨되지 않았습니다.<br>
              (당첨자: ${product.winner ? product.winner.name : '비공개'})<br>
              다음 럭키드로우에서 다시 도전해보세요!
            </p>
            <button onclick="window.__closeDrawNotification('${product.id}')" class="w-full py-3 bg-primary text-on-primary font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md">
              확인 (닫기)
            </button>
          </div>
        </div>`;
    }

    // Only show one notification at a time
    break;
  }

  // Register the close handler
  window.__closeDrawNotification = (productId) => {
    const modal = document.getElementById(`draw-result-modal-${productId}`);
    if (modal) modal.remove();

    // Check if there are more notifications to show
    setTimeout(() => {
      const app = document.getElementById('app');
      const nextNotification = renderDrawResultNotification();
      if (nextNotification && app) {
        app.insertAdjacentHTML('beforeend', nextNotification);
      }
    }, 300);
  };

  return toasts;
}

function navigate() {
  const pageName = getPageFromHash();
  const route = routes[pageName];

  if (!route) {
    window.location.hash = '#home';
    return;
  }

  // --- Protected Route Check ---
  const user = getCurrentAuthUser();
  if (!user && (pageName === 'history' || pageName === 'admin')) {
    alert('로그인이 필요한 기능입니다. 로그인 화면으로 이동합니다.');
    window.location.hash = `#profile?redirect=${pageName}`;
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

  // Show draw result notifications (winner/loser) when user is logged in
  if (pageName !== 'admin') {
    const drawNotification = renderDrawResultNotification();
    if (drawNotification) {
      app.insertAdjacentHTML('beforeend', drawNotification);
    }
  }

  currentPage = pageName;
  currentCleanup = route.cleanup || null;

  // Scroll to top on page change
  window.scrollTo(0, 0);
}

// --- Language Switch & Dropdown ---
window.__switchLang = (lang) => {
  setLanguage(lang);
  navigate(); // Re-render with new language
};

window.__toggleLangDropdown = (e, wrapperId = 'lang-dropdown-wrapper') => {
  if (e) e.stopPropagation();
  const menu = document.getElementById(`${wrapperId}-menu`);
  const btn = document.getElementById(`${wrapperId}-btn`);
  if (menu && btn) {
    const isHidden = menu.classList.contains('hidden');
    
    // Close any other open dropdowns
    document.querySelectorAll('[id$="-menu"]').forEach(m => m.classList.add('hidden'));
    document.querySelectorAll('.lang-chevron-icon').forEach(c => c.style.transform = 'rotate(0deg)');

    if (isHidden) {
      menu.classList.remove('hidden');
      const chevron = btn.querySelector('.lang-chevron-icon');
      if (chevron) chevron.style.transform = 'rotate(180deg)';
    }
  }
};

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  const openMenus = document.querySelectorAll('[id$="-menu"]:not(.hidden)');
  openMenus.forEach(menu => {
    const wrapper = menu.parentElement;
    if (wrapper && !wrapper.contains(e.target)) {
      menu.classList.add('hidden');
      const chevron = wrapper.querySelector('.lang-chevron-icon');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
  });
});

// --- Event Listeners ---
window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);
window.addEventListener('languageChanged', navigate);
window.addEventListener('firestoreDataChanged', navigate);


