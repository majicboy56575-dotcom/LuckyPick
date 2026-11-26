// ============================================
// LuckyPick - PWA Install Prompt (i18n-enabled)
// - Fast 1.2s initial prompt on mobile browsers
// - Reinstall-friendly: no permanent INSTALLED_KEY lock (only standalone hides it)
// - Header button support via isPwaStandalone() & window.__lpOpenInstallPrompt()
// - Full 7-language i18n support + live re-render on languageChanged
// ============================================
import { t } from '../i18n.js';

const DISMISS_KEY = 'lp_pwa_dismissed_until';
const FORCE_PARAM = 'lp_install';
const DISMISS_DAYS = 3;
const SHOW_DELAY_MS = 1200;

const ua = navigator.userAgent || '';
const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isIPhone = /iPhone|iPod/i.test(ua);
const isAndroid = /Android/i.test(ua);
const isMobile = isIOS || isAndroid;
const isMetaInApp = /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Instagram/i.test(ua);
const isKakaoInApp = /KAKAOTALK/i.test(ua);
const isOtherInApp = /NAVER\(inapp|Line\/|DaumApps|; wv\)/i.test(ua);
const isInApp = isMetaInApp || isKakaoInApp || isOtherInApp;

let deferredPrompt = null;
let currentVariant = null;
let showTimer = null;
let blockedAttempts = 0;
let promptWaitAttempts = 0;

export function isPwaStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true
  );
}

function isDismissed() {
  return Date.now() < Number(localStorage.getItem(DISMISS_KEY) || 0);
}

function dismissFor(days) {
  localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 86400000));
}

function forceRequested() {
  return new URLSearchParams(window.location.search).get(FORCE_PARAM) === '1';
}

function stripForceParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(FORCE_PARAM)) return;
  url.searchParams.delete(FORCE_PARAM);
  history.replaceState(history.state, '', url.pathname + url.search + url.hash);
}

function track(name, params = {}) {
  try {
    if (typeof window.fbq === 'function') window.fbq('trackCustom', name, params);
  } catch (e) { /* ignore */ }
}

function externalTargetUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set(FORCE_PARAM, '1');
  url.hash = '';
  return url;
}

function blockingModalOpen() {
  return [
    'direct-pay-modal', 'unboxing-stage-modal', 'purchase-confirm-modal', 'unboxing-confirm-modal',
    'login-required-modal', 'policy-modal', 'charge-pay-modal', 'single-ship-modal', 'password-reset-modal',
  ].some((id) => document.getElementById(id));
}

function shouldAutoShow() {
  if (isPwaStandalone() || !isMobile) return false;
  if (window.location.search.includes('danal=')) return false;
  if (window.location.hash.startsWith('#admin')) return false;
  if (forceRequested()) return true;
  return !isDismissed();
}

function showToast(message) {
  const old = document.getElementById('lp-pwa-toast');
  if (old) old.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="lp-pwa-toast" class="fixed left-1/2 -translate-x-1/2 bottom-28 z-[140] bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl">${message}</div>`);
  setTimeout(() => document.getElementById('lp-pwa-toast')?.remove(), 2600);
}

function injectStyles() {
  if (document.getElementById('lp-pwa-style')) return;
  document.head.insertAdjacentHTML('beforeend', `
    <style id="lp-pwa-style">
      @keyframes lpPwaUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes lpPwaBounce { 0%,100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 10px); } }
      .lp-pwa-panel { animation: lpPwaUp .28s ease-out; }
      .lp-pwa-arrow { animation: lpPwaBounce 1.1s ease-in-out infinite; }
    </style>`);
}

const SHARE_ICON = `<svg viewBox="0 0 24 24" class="w-4 h-4 inline-block align-[-3px]" fill="none" stroke="#0a84ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 11v8a2 2 0 002 2h10a2 2 0 002-2v-8"/></svg>`;

function benefitsBlock() {
  const items = [
    ['bolt', t('pwaBenefit1a'), t('pwaBenefit1b')],
    ['fullscreen', t('pwaBenefit2a'), t('pwaBenefit2b')],
    ['download_done', t('pwaBenefit3a'), t('pwaBenefit3b')],
  ];
  return `
    <div class="grid grid-cols-3 gap-2 text-center">
      ${items.map(([icon, a, b]) => `
        <div class="bg-slate-50 border border-slate-100 rounded-2xl py-3 px-1">
          <span class="material-symbols-outlined text-primary text-[22px]">${icon}</span>
          <p class="text-[10px] text-gray-500 mt-0.5 leading-tight">${a}</p>
          <p class="text-[11px] font-bold text-gray-900 leading-tight">${b}</p>
        </div>`).join('')}
    </div>`;
}

function stepsBlock(steps) {
  return `
    <ol class="space-y-2.5 bg-slate-50 border border-slate-100 rounded-2xl p-4">
      ${steps.map((s, i) => `
        <li class="flex items-start gap-2.5 text-[13px] text-gray-800 leading-snug">
          <span class="shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center mt-px">${i + 1}</span>
          <span>${s}</span>
        </li>`).join('')}
    </ol>`;
}

function primaryBtn(label, action, icon = 'install_mobile') {
  return `
    <button onclick="${action}" class="w-full py-3.5 bg-primary hover:bg-primary-container text-white font-black rounded-full text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
      <span class="material-symbols-outlined text-lg">${icon}</span><span>${label}</span>
    </button>`;
}

function secondaryBtn(label, action) {
  return `
    <button onclick="${action}" class="w-full py-2.5 text-slate-500 hover:text-slate-800 font-semibold text-xs cursor-pointer">${label}</button>`;
}

function shell({ subtitle, body, buttons, centered = false, arrow = false }) {
  return `
    <div id="lp-pwa-sheet" class="fixed inset-0 z-[130] flex ${centered ? 'items-center p-4' : 'items-end sm:items-center sm:p-4'} justify-center bg-black/50 backdrop-blur-sm"
         onclick="if(event.target===this)window.__lpPwa.later()">
      <div class="lp-pwa-panel bg-white w-full sm:max-w-md ${centered ? 'max-w-md rounded-3xl' : 'rounded-t-3xl sm:rounded-3xl'} shadow-2xl border border-slate-100 overflow-hidden"
           style="padding-bottom: env(safe-area-inset-bottom);">
        ${centered ? '' : '<div class="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden"></div>'}
        <div class="p-6 pt-4 space-y-4">
          <div class="flex items-center gap-3.5 pt-1">
            <img src="/icons/icon-192.png" class="w-14 h-14 rounded-2xl shadow-md shrink-0" alt="LuckyPick">
            <div class="min-w-0 flex-1">
              <h3 class="font-black text-[17px] text-gray-900 leading-snug">${t('pwaTitle')}</h3>
              <p class="text-xs text-gray-500 mt-0.5 leading-snug">${subtitle}</p>
            </div>
            <button onclick="window.__lpPwa.later()" class="self-start p-1 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="${t('close')}">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          ${body}
          <div class="space-y-1 pt-1">${buttons}</div>
        </div>
      </div>
      ${arrow ? `
        <div class="lp-pwa-arrow fixed left-1/2 bottom-3 flex flex-col items-center text-white drop-shadow-lg pointer-events-none">
          <span class="text-[11px] font-bold bg-black/60 rounded-full px-3 py-1 mb-1">${t('pwaHereShare')} ${SHARE_ICON}</span>
          <span class="material-symbols-outlined text-4xl">arrow_downward</span>
        </div>` : ''}
    </div>`;
}

const variants = {
  androidPrompt: () => shell({
    subtitle: t('pwaAndroidSub'),
    body: benefitsBlock(),
    buttons: primaryBtn(t('pwaInstallBtn'), 'window.__lpPwa.install()') + secondaryBtn(t('pwaLaterBtn'), 'window.__lpPwa.later()'),
  }),

  androidManual: () => shell({
    subtitle: t('pwaAndroidManualSub'),
    body: benefitsBlock() + stepsBlock([
      t('pwaAndroidStep1'),
      t('pwaAndroidStep2'),
      t('pwaAndroidStep3'),
    ]),
    buttons: primaryBtn(t('pwaGotItBtn'), 'window.__lpPwa.gotIt()', 'check_circle') + secondaryBtn(t('pwaLaterBtn'), 'window.__lpPwa.later()'),
  }),

  iosBrowser: () => shell({
    subtitle: t('pwaIosSub'),
    centered: isIPhone,
    arrow: isIPhone,
    body: stepsBlock([
      t('pwaIosStep1', { icon: SHARE_ICON }),
      t('pwaIosStep2'),
      t('pwaIosStep3'),
    ]),
    buttons: primaryBtn(t('pwaGotItBtn'), 'window.__lpPwa.gotIt()', 'check_circle') + secondaryBtn(t('pwaLaterBtn'), 'window.__lpPwa.later()'),
  }),

  androidInApp: () => shell({
    subtitle: t('pwaAndroidInAppSub'),
    body: benefitsBlock(),
    buttons: primaryBtn(t('pwaOpenChromeBtn'), 'window.__lpPwa.openExternal()', 'open_in_browser') + secondaryBtn(t('pwaLaterBtn'), 'window.__lpPwa.later()'),
  }),

  iosInApp: () => shell({
    subtitle: t('pwaIosInAppSub'),
    body: stepsBlock(
      isKakaoInApp
        ? [t('pwaKakaoStep1'), t('pwaIosInAppStep3')]
        : [t('pwaIosInAppStep1'), t('pwaIosInAppStep2'), t('pwaIosInAppStep3')]
    ),
    buttons:
      primaryBtn(t('pwaOpenSafariBtn'), 'window.__lpPwa.openExternal()', 'open_in_browser') +
      `<button onclick="window.__lpPwa.copyLink()" class="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-xs cursor-pointer flex items-center justify-center gap-1">
         <span class="material-symbols-outlined text-base">content_copy</span><span>${t('pwaCopyLinkBtn')}</span>
       </button>` +
      secondaryBtn(t('pwaLaterBtn'), 'window.__lpPwa.later()'),
  }),
};

function pickVariant() {
  if (isInApp) return isIOS ? 'iosInApp' : 'androidInApp';
  if (isIOS) return 'iosBrowser';
  if (deferredPrompt) return 'androidPrompt';
  return 'androidManual';
}

function renderSheet(variantKey) {
  injectStyles();
  document.getElementById('lp-pwa-sheet')?.remove();
  currentVariant = variantKey;
  document.body.insertAdjacentHTML('beforeend', variants[variantKey]());
}

function closeSheet() {
  document.getElementById('lp-pwa-sheet')?.remove();
  currentVariant = null;
}

function showSheet() {
  const key = pickVariant();
  renderSheet(key);
  stripForceParam();
  track('PWAPromptShown', { variant: key });
}

function tryAutoShow() {
  if (!shouldAutoShow() || document.getElementById('lp-pwa-sheet')) return;

  if (blockingModalOpen()) {
    if (++blockedAttempts < 20) scheduleShow(2500);
    return;
  }

  // Short 800ms grace period on Android Chrome so native prompt usually arrives first (max ~2s total)
  if (isAndroid && !isInApp && !deferredPrompt && promptWaitAttempts < 1) {
    promptWaitAttempts++;
    scheduleShow(800);
    return;
  }

  showSheet();
}

function scheduleShow(delay = SHOW_DELAY_MS) {
  clearTimeout(showTimer);
  showTimer = setTimeout(tryAutoShow, delay);
}

window.__lpPwa = {
  async install() {
    if (!deferredPrompt) {
      renderSheet('androidManual');
      return;
    }
    track('PWAInstallClick');
    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    promptEvent.prompt();
    try {
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        track('PWAInstallAccepted');
      } else {
        track('PWAInstallDeclined');
        dismissFor(1);
      }
    } catch (e) { /* ignore */ }
    closeSheet();
  },

  later() {
    dismissFor(DISMISS_DAYS);
    track('PWAInstallLater', { variant: currentVariant });
    closeSheet();
  },

  gotIt() {
    dismissFor(7);
    track('PWAGuideConfirmed', { variant: currentVariant });
    closeSheet();
  },

  openExternal() {
    const target = externalTargetUrl();
    const full = target.toString();
    track('PWAOpenExternal', { platform: isIOS ? 'ios' : 'android' });

    if (isKakaoInApp) {
      window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(full);
      return;
    }
    if (isAndroid) {
      window.location.href =
        `intent://${target.host}${target.pathname}${target.search}` +
        `#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(full)};end`;
      return;
    }
    window.location.href = 'x-safari-' + full;
    setTimeout(() => showToast(t('pwaToastOpenFallback')), 1200);
  },

  async copyLink() {
    const full = externalTargetUrl().toString();
    try {
      await navigator.clipboard.writeText(full);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = full;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (err) { /* ignore */ }
      ta.remove();
    }
    track('PWACopyLink');
    showToast(t('pwaToastCopied'));
  },
};

window.__lpOpenInstallPrompt = () => {
  if (isPwaStandalone()) {
    showToast(t('pwaToastAlreadyApp'));
    return;
  }
  showSheet();
};

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (currentVariant === 'androidManual') renderSheet('androidPrompt');
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  closeSheet();
  track('PWAInstalled');
  showToast(t('pwaToastInstalled'));
});

window.addEventListener('languageChanged', () => {
  if (currentVariant && document.getElementById('lp-pwa-sheet')) {
    renderSheet(currentVariant);
  }
});

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.warn('[PWA] Service worker registration failed:', err);
  });
}

function init() {
  registerServiceWorker();
  if (isPwaStandalone()) return;
  scheduleShow();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
