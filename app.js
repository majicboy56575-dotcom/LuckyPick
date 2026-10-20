// ============================================
// LuckyPick - Main App (SPA Router)
// ============================================
import { t, setLanguage, getCurrentLanguage, getAvailableLanguages, renderLanguageDropdown } from './i18n.js';
// NOTE: auth.js must be imported WITHOUT a version query everywhere, so every file shares one module instance (one login state)
import { getCurrentAuthUser, waitForAuth, isAdmin } from './services/auth.js';
import { getClosedProducts, getCurrentUser, getCurrentUserDocCache } from './services/firestore.js';
import { handleTossSuccess, handleDanalSuccess } from '/services/payment.js';
import { getTicketRefundNotices, clearTicketRefundNotices, setUserPoints, setAvailableGoldenTicketsCount, getUserPoints, getAvailableGoldenTicketsCount } from './services/randombox.js';
import { executeUnboxingAnimation } from '/services/unboxing-modal.js';

import * as homePage from './pages/home.js?v=20261016_V33';
import * as historyPage from './pages/history.js?v=20261016_V33';
import * as profilePage from './pages/profile.js?v=20261016_V33';
import * as adminPage from './pages/admin.js?v=20261016_V33';

// Expose dev helpers to window
window.setUserPoints = setUserPoints;
window.setAvailableGoldenTicketsCount = setAvailableGoldenTicketsCount;
window.getUserPoints = getUserPoints;
window.getAvailableGoldenTicketsCount = getAvailableGoldenTicketsCount;
window.getCurrentUserDocCache = getCurrentUserDocCache;
window.getCurrentAuthUser = getCurrentAuthUser;

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

  const showAdminButton = isAdmin();

  return `
    <header class="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-xs flex justify-between items-center h-16 px-container-margin max-w-full border-b border-slate-200/80">
      <div class="flex items-center gap-2 cursor-pointer" onclick="window.location.hash='#home'">
        <span class="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black shadow-sm">🎁</span>
        <span class="font-display-lg text-primary font-black text-[22px]">LuckyPick</span>
      </div>
      <div class="flex items-center gap-3">
        ${renderLanguageDropdown('header-lang-dropdown')}
        ${showAdminButton ? `
          <button class="flex items-center justify-center p-2 rounded-full hover:bg-surface-variant/20 transition-all text-slate-700" onclick="window.location.hash='#admin'" title="Admin">
            <span class="material-symbols-outlined">admin_panel_settings</span>
          </button>
        ` : ''}
      </div>
    </header>`;
}

function renderBottomNav(pageName) {
  if (pageName === 'admin') return '';

  const tabs = [
    { key: 'home', icon: 'package_2', label: '럭키박스' },
    { key: 'history', icon: 'military_tech', label: '당첨자' },
    { key: 'profile', icon: 'inventory_2', label: '내 보관함' },
  ];

  return `
    <nav class="fixed bottom-0 w-full z-50 bg-white/90 backdrop-blur-md border-t border-slate-200/80 shadow-lg flex justify-around items-center h-20 pb-safe px-4">
      ${tabs.map(tab => {
        const isActive = pageName === tab.key;
        return `
          <a class="flex flex-col items-center justify-center ${isActive ? 'bg-primary text-white rounded-2xl px-5 py-1.5 shadow-sm' : 'text-slate-500 hover:text-primary'} transition-all scale-95 active:scale-90" href="#${tab.key}">
            <span class="material-symbols-outlined">${tab.icon}</span>
            <span class="text-[11px] font-bold mt-0.5">${tab.label}</span>
          </a>`;
      }).join('')}
    </nav>`;
}

function renderFooter(pageName) {
  if (pageName === 'admin') return '';

  return `
    <footer class="bg-surface-variant/20 border-t border-outline-variant/30 text-on-surface-variant text-xs pt-8 pb-28 px-container-margin max-w-full mt-12">
      <div class="max-w-4xl mx-auto space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-1.5 font-bold text-on-surface text-sm">
            <span class="material-symbols-outlined text-primary text-base">verified</span>
            <span>럭키픽 (LuckyPick)</span>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <button onclick="window.__openPolicyModal('terms')" class="hover:text-primary hover:underline transition-colors">이용약관</button>
            <span>|</span>
            <button onclick="window.__openPolicyModal('privacy')" class="hover:text-primary hover:underline font-bold transition-colors">개인정보처리방침</button>
            <span>|</span>
            <button onclick="window.__openPolicyModal('refund')" class="hover:text-primary hover:underline font-semibold transition-colors">취소 및 환불정책</button>
          </div>
        </div>

        <div class="space-y-1.5 leading-relaxed text-[11px] text-on-surface-variant/80">
          <p><span class="font-semibold text-on-surface">상호(법인명):</span> 럭키픽 | <span class="font-semibold text-on-surface">대표자:</span> 이재영 | <span class="font-semibold text-on-surface">사업자등록번호:</span> 803-05-03449</p>
          <p><span class="font-semibold text-on-surface">통신판매업신고:</span> 제 2026-화성새솔-0099 호 | <span class="font-semibold text-on-surface">개인정보관리책임자:</span> 이재영</p>
          <p><span class="font-semibold text-on-surface">사업장 소재지:</span> 경기도 화성시 만세구 수노을1로 148, 101동 902호(새솔동, 송산신도시 대방노블랜드 더퍼스티지 1차) (우: 18237)</p>
          <p><span class="font-semibold text-on-surface">고객센터:</span> 070-8019-3205 (운영시간: 평일 10:00~17:00 / 점심 12:00~13:00 / 주말·공휴일 휴무)</p>
          <p><span class="font-semibold text-on-surface">이메일:</span> leejeayoung0713@gmail.com | <span class="font-semibold text-on-surface">호스팅 제공자:</span> Google Firebase</p>
        </div>

        <div class="bg-surface/60 rounded-xl p-3 border border-outline-variant/30 text-[11px] space-y-1.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1 font-semibold text-on-surface">
              <span class="material-symbols-outlined text-xs text-primary">security</span>
              <span>소비자피해보상보험 (에스크로 구매안전서비스) 안내</span>
            </div>
            <a href="escrow_certificate.jpg" target="_blank" class="text-primary hover:underline text-[10px] font-bold flex items-center gap-0.5">
              <span>확인증 보기</span>
              <span class="material-symbols-outlined text-[10px]">open_in_new</span>
            </a>
          </div>
          <p class="text-on-surface-variant/70 leading-normal">
            고객님의 안전거래를 위해 현금 등으로 결제 시 쇼핑몰에서 가입한 네이버파이낸셜(주)의 구매안전서비스를 이용하실 수 있습니다. (등록번호: 제 A17-260921-0558 호)
          </p>
        </div>

        <p class="text-[10px] text-on-surface-variant/60 text-center pt-2">
          Copyright © 2026 LuckyPick. All rights reserved.
        </p>
      </div>
    </footer>`;
}

// Global Notification Handlers (Defined unconditionally at module top-level)
window.__dismissTicketRefundNotice = () => {
  const modal = document.getElementById('refund-notice-modal');
  if (modal) modal.remove();
  clearTicketRefundNotices();
  
  // Check if there are more notifications to show
  setTimeout(() => {
    const app = document.getElementById('app');
    const nextNotification = renderDrawResultNotification();
    if (nextNotification && app) {
      app.insertAdjacentHTML('beforeend', nextNotification);
    }
  }, 100);
};

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
  }, 100);
};

function renderDrawResultNotification() {
  const authUser = getCurrentAuthUser();
  if (!authUser) return '';

  // 1. Golden Ticket Underflow Refund Notices
  const refundNotices = getTicketRefundNotices();
  if (refundNotices && refundNotices.length > 0) {
    const notice = refundNotices[0];
    return `
      <div class="fixed inset-0 z-[120] flex items-center justify-center p-4 modal-backdrop bg-black/60 backdrop-blur-sm" id="refund-notice-modal" onclick="if(event.target===this)window.__dismissTicketRefundNotice()">
        <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95">
          <div class="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <span class="material-symbols-outlined text-3xl">undo</span>
          </div>
          <span class="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full">
            골든 티켓 100% 자동 반환 안내
          </span>
          <h3 class="font-headline-sm text-lg font-bold text-gray-900 mt-2 mb-1">[${notice.raffleTitle}]</h3>
          <p class="text-xs text-gray-600 mb-4 leading-relaxed">
            해당 상품 <strong>그룹 ${notice.groupNumber}</strong>의 목표 인원(${notice.target}명)이 시간 내 미달(${notice.gathered}명)되어 마감되었습니다.
          </p>
          <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs mb-5 space-y-1">
            <div class="flex justify-between items-center font-bold text-amber-950">
              <span>반환된 골든 티켓</span>
              <span class="font-mono text-base text-primary">+${notice.refundCount}장</span>
            </div>
            <p class="text-[11px] text-amber-800">회원님의 골든 티켓 지갑으로 전액 자동 환불 반환되었습니다.</p>
          </div>
          <button onclick="window.__dismissTicketRefundNotice()" class="w-full py-3.5 bg-primary text-white font-bold rounded-2xl text-xs shadow-md hover:bg-primary-container transition-all active:scale-95 cursor-pointer">
            확인 및 다른 상품에 응모하기
          </button>
        </div>
      </div>`;
  }

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
            <button class="absolute top-4 right-4 w-10 h-10 rounded-full hover:bg-surface-variant/30 flex items-center justify-center text-on-surface-variant transition-colors" onclick="window.__closeDrawNotification('${product.id}')" title="${t('close')}">
              <span class="material-symbols-outlined">close</span>
            </button>
            <div class="w-20 h-20 rounded-full bg-tertiary/10 flex items-center justify-center mx-auto mb-4">
              <span class="material-symbols-outlined text-tertiary text-5xl">emoji_events</span>
            </div>
            <h2 class="font-headline-md text-headline-md text-on-surface mb-2">${t('congratsWinner')}</h2>
            <p class="text-on-surface-variant mb-2"><strong>${product.title}</strong></p>
            <div class="bg-tertiary/10 border border-tertiary/20 rounded-xl p-4 mb-6">
              <p class="font-label-caps text-label-caps text-tertiary mb-1">${t('ticketNumberLabel')}</p>
              <p class="font-timer-numeric text-xl font-bold text-primary">${product.ticketNumber || '#WINNER'}</p>
            </div>
            <div class="flex flex-col gap-2.5">
              <button onclick="window.location.hash='#profile'; window.__closeDrawNotification('${product.id}')" class="w-full py-3 bg-tertiary text-on-tertiary font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2">
                <span class="material-symbols-outlined">local_shipping</span>
                ${t('goEnterShipping')}
              </button>
              <button onclick="window.__closeDrawNotification('${product.id}')" class="w-full py-2.5 bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50 font-semibold rounded-full transition-all">
                ${t('close')}
              </button>
            </div>
          </div>
        </div>`;
    } else {
      toasts += `
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop" id="draw-result-modal-${product.id}" onclick="if(event.target===this)window.__closeDrawNotification('${product.id}')">
          <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-center p-8 relative">
            <button class="absolute top-4 right-4 w-10 h-10 rounded-full hover:bg-surface-variant/30 flex items-center justify-center text-on-surface-variant transition-colors" onclick="window.__closeDrawNotification('${product.id}')" title="${t('close')}">
              <span class="material-symbols-outlined">close</span>
            </button>
            <div class="w-20 h-20 rounded-full bg-error-container/30 flex items-center justify-center mx-auto mb-4">
              <span class="material-symbols-outlined text-error text-5xl">sentiment_dissatisfied</span>
            </div>
            <h2 class="font-headline-md text-headline-md text-on-surface mb-2">${t('drawResultTitle')}</h2>
            <p class="text-error font-bold mb-2">[${product.title}] ${t('notWonTitle')}</p>
            <p class="text-on-surface-variant text-sm mb-6 leading-relaxed whitespace-pre-line">${t('notWonDesc', { title: product.title, winner: product.winner ? product.winner.name : '-' })}</p>
            <button onclick="window.__closeDrawNotification('${product.id}')" class="w-full py-3 bg-primary text-on-primary font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md">
              ${t('close')}
            </button>
          </div>
        </div>`;
    }

    // Only show one notification at a time
    break;
  }

  return toasts;
}

function navigate() {
  // Check if URL has Toss payment redirect query params (?paymentKey=... or ?toss=...)
  const urlParams = new URLSearchParams(window.location.search);
  const tossStatus = urlParams.get('toss');
  const tossPaymentKey = urlParams.get('paymentKey');
  const tossOrderId = urlParams.get('orderId');
  const tossAmount = urlParams.get('amount');
  const tossProductId = urlParams.get('productId') || sessionStorage.getItem('toss_pending_product');

  if (tossStatus === 'fail') {
    const errorCode = urlParams.get('code') || '';
    const errorMessage = urlParams.get('message') || '결제가 취소되었습니다.';
    window.history.replaceState({}, document.title, window.location.pathname);
    sessionStorage.removeItem('toss_pending_product');
    if (errorCode !== 'PAY_PROCESS_CANCELED') {
      alert(`토스 결제 실패: ${errorMessage}`);
    }
    window.location.hash = '#home';
    return;
  }

  if (tossPaymentKey && tossOrderId && tossAmount) {
    window.history.replaceState({}, document.title, window.location.pathname);
    const pendingBoxId = sessionStorage.getItem('pending_unboxing_box_id');
    sessionStorage.removeItem('toss_pending_product');
    sessionStorage.removeItem('pending_unboxing_box_id');

    (async () => {
      const user = await waitForAuth(5000);
      if (!user) {
        alert('로그인 정보를 확인하는 데 실패했습니다. 다시 로그인 후 시도해주세요.');
        window.location.hash = '#profile';
        return;
      }
      try {
        const result = await handleTossSuccess(tossPaymentKey, tossOrderId, tossAmount, tossProductId || pendingBoxId || 'box_basic');
        
        if (pendingBoxId || result.isLuckyBox) {
          // Lucky box unboxing flow
          const targetBox = pendingBoxId || result.boxId || tossProductId || 'box_basic';
          executeUnboxingAnimation(targetBox, 'toss');
        } else {
          // General golden raffle entry flow
          const countText = result.currentParticipants && result.maxParticipants
            ? `${result.currentParticipants}/${result.maxParticipants}`
            : '';
          alert(`🎉 토스 결제 성공!\n\n참여가 등록되었습니다! (현재 참여 인원: ${countText})\n\n[진행 중] 페이지로 이동합니다.`);
          window.location.hash = '#home';
        }
      } catch (err) {
        console.error('[Toss] Confirm failed:', err);
        alert(`토스 결제 승인 실패: ${err.message || '서버 오류가 발생했습니다.'}`);
        window.location.hash = '#home';
      }
    })();
    return;
  }

  // --- Danal Payment Redirect Handlers ---
  const danalStatus = urlParams.get('danal');
  const danalReturnParams = urlParams.get('RETURNPARAMS');
  const danalAmount = urlParams.get('amount');
  const danalProductId = urlParams.get('productId') || sessionStorage.getItem('danal_pending_product') || 'box_basic';

  if (danalStatus === 'cancel') {
    window.history.replaceState({}, document.title, window.location.pathname);
    alert('다날 결제가 취소되었습니다.');
    window.location.hash = '#home';
    return;
  }

  if (danalStatus === 'card_return' && danalReturnParams) {
    window.history.replaceState({}, document.title, window.location.pathname);
    sessionStorage.removeItem('danal_pending_product');
    (async () => {
      const user = await waitForAuth(5000);
      if (!user) {
        alert('로그인 정보를 확인하지 못했습니다. 다시 로그인 후 시도해주세요.');
        window.location.hash = '#profile';
        return;
      }
      try {
        const result = await handleDanalSuccess(danalReturnParams, danalAmount, danalProductId, null, 'card');
        if (result && result.success) {
          alert('🎉 다날 카드 결제 완료! 럭키박스를 개봉합니다.');
          executeUnboxingAnimation(danalProductId, 'danal');
        } else {
          alert(`다날 결제 실패: ${result.message || '승인 실패'}`);
          window.location.hash = '#home';
        }
      } catch (err) {
        console.error('[Danal] Confirm error:', err);
        alert(`다날 결제 승인 실패: ${err.message || '오류가 발생했습니다.'}`);
        window.location.hash = '#home';
      }
    })();
    return;
  }

  if (danalStatus === 'phone_return') {
    window.history.replaceState({}, document.title, window.location.pathname);
    sessionStorage.removeItem('danal_pending_product');
    (async () => {
      const user = await waitForAuth(5000);
      if (!user) {
        alert('로그인 정보를 확인하지 못했습니다. 다시 로그인 후 시도해주세요.');
        window.location.hash = '#profile';
        return;
      }
      alert('🎉 다날 휴대폰 소액결제 승인이 완료되었습니다! 럭키박스를 개봉합니다.');
      executeUnboxingAnimation(danalProductId, 'danal_phone');
    })();
    return;
  }


  const pageName = getPageFromHash();
  const route = routes[pageName];

  if (!route) {
    window.location.hash = '#home';
    return;
  }

  // --- Protected Route Check ---
  if (pageName === 'admin' && !isAdmin()) {
    alert(t('loginRequiredAlert') || '관리자 권한이 필요합니다.');
    window.location.hash = `#profile?redirect=${pageName}`;
    return;
  }

  // Cleanup previous page
  if (currentCleanup) {
    try { currentCleanup(); } catch (e) { console.warn('Cleanup error:', e); }
    currentCleanup = null;
  }

  const app = document.getElementById('app');
  if (!app) return;

  try {
    // For admin page, render without header/nav
    if (pageName === 'admin') {
      app.innerHTML = route.render();
      if (route.init) route.init();
    } else {
      app.innerHTML = renderHeader(pageName) + route.render() + renderFooter(pageName) + renderBottomNav(pageName);
    }
  } catch (renderError) {
    console.error(`[Router] Error rendering page ${pageName}:`, renderError);
    app.innerHTML = `
      <div class="p-8 max-w-lg mx-auto text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <span class="material-symbols-outlined text-3xl">error</span>
        </div>
        <h3 class="font-bold text-lg text-gray-900">페이지 렌더링 중 오류가 발생했습니다</h3>
        <p class="text-xs text-gray-500 font-mono bg-slate-50 p-3 rounded-xl">${renderError.message}</p>
        <button onclick="window.location.hash='#home'; window.location.reload();" class="px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-xs">
          홈으로 이동
        </button>
      </div>`;
    return;
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

// --- Policy Modals (Terms, Privacy, Refund) ---
const POLICY_CONTENT = {
  terms: {
    title: '이용약관 (Terms of Service)',
    content: `
      <div class="space-y-4 text-xs text-on-surface-variant leading-relaxed">
        <h4 class="font-bold text-on-surface text-sm">제1조 (목적)</h4>
        <p>본 약관은 럭키픽(이하 "회사")이 운영하는 온라인 쇼핑몰(이하 "몰")에서 제공하는 전자상거래 및 블라인드 큐레이션 쇼핑 서비스(이하 "서비스")를 이용함에 있어 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        
        <h4 class="font-bold text-on-surface text-sm">제2조 (용어의 정의)</h4>
        <p>1. "럭키픽"이란 회사가 정품 실물 재화를 이용자에게 판매 및 공급하기 위하여 운영하는 전자상거래 쇼핑몰 플랫폼을 말합니다.<br>
        2. "블라인드 큐레이션 상품(서프라이즈 커머스)"이란 사전에 투명하게 공시된 제조사 정품 실물 상품 풀(Pool) 중 무작위 알고리즘을 통해 100% 실물 재화가 확정 지급되는 기획 패키지 상품을 의미합니다. (꽝 없음, 최소 보장 가치 100% 보장)<br>
        3. "단순변심 반품 및 스토어 적립금 전환"이란 이용자가 개봉 결과를 확인한 후 해당 실물 상품의 배송을 희망하지 않는 경우, 전자상거래법상 청약철회 절차에 갈음하여 상품 정가의 80%에 상당하는 쇼핑몰 포인트(스토어 크레딧)로 즉시 반품 적립을 선택할 수 있는 편의 제도를 의미합니다. (현금 환전 불가, 몰 내 재구매 전용)<br>
        4. "구매 고객 사은행사(골든 래플)"란 블라인드 큐레이션 상품을 구매한 고객에게 감사의 의미로 무상 지급되는 보너스 마일리지(골든 티켓)로 응모하는 소비자 현상경품 프로모션으로, 어떠한 유료 복권이나 사행성 금전 대가를 요구하지 않습니다.</p>

        <h4 class="font-bold text-on-surface text-sm">제3조 (재화의 공급 및 배송)</h4>
        <p>1. 회사는 이용자가 주문한 실물 상품 또는 마이페이지 보관함에서 배송 요청한 상품에 대하여 기본 배송비(3,000원) 결제 확인 후 영업일 기준 1~3일 이내에 지정된 택배사(CJ대한통운/우체국 등)를 통해 신속하게 발송합니다.<br>
        2. 배송 과정 중 발생한 상품의 파손, 분실 등은 전적으로 회사가 책임을 지고 1:1 무상 재배송 또는 전액 환불을 진행합니다.</p>

        <h4 class="font-bold text-on-surface text-sm">제4조 (경품 지급 및 제세공과금)</h4>
        <p>1. 구매 고객 사은행사(골든 래플) 당첨 품목 중 소득세법 제129조에 의거하여 단일 상품 가액이 5만 원을 초과하는 경품의 경우, 제세공과금(22%)은 당첨자 본인 부담으로 부과됩니다.<br>
        2. 회사는 원천징수 의무자로서 당첨자의 본인 확인 및 관련 세무 신고 서류를 수령한 후 실물 경품을 정식 출고합니다.<br>
        3. 정해진 기간 내 본인 확인 서류 미제출 시 경품 지급이 취소될 수 있으며, 응모에 사용된 골든 티켓은 자동 반환됩니다.</p>

        <h4 class="font-bold text-on-surface text-sm">제5조 (청약철회 및 소비자 보호)</h4>
        <p>1. 회원은 전자상거래 등에서의 소비자보호에 관한 법률 제17조에 따라 결제 후 박스를 개봉하지 않거나 배송 전 상태인 경우 결제일로부터 7일 이내에 전액 결제 취소(환불)를 요청할 수 있습니다.<br>
        2. 상품의 내용이 표시·광고 내용과 다르거나 하자가 있는 경우 상품을 공급받은 날부터 3개월 이내, 그 사실을 안 날부터 30일 이내에 무상 교환 또는 전액 환불이 가능합니다.<br>
        3. 회사는 소비자의 권익 보호를 위하여 네이버파이낸셜(주)의 구매안전서비스(에스크로)에 정식 가입되어 있습니다.</p>
      </div>
    `
  },
  privacy: {
    title: '개인정보처리방침 (Privacy Policy)',
    content: `
      <div class="space-y-4 text-xs text-on-surface-variant leading-relaxed">
        <h4 class="font-bold text-on-surface text-sm">1. 개인정보의 수집 및 이용 목적</h4>
        <p>회사는 다음의 목적을 위하여 최소한의 개인정보를 처리합니다:<br>
        • 회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증<br>
        • 전자상거래 대금 결제 확인, 주문 처리, 취소 및 환불 정산<br>
        • 실물 상품의 주문 처리, 배송지 확인 및 택배 배송 위탁<br>
        • 5만원 초과 경품 당첨 시 소득세법에 따른 제세공과금 원천징수 신고<br>
        • 고객 문의 응대 및 불만 처리, 분쟁 조정을 위한 기록 보존</p>

        <h4 class="font-bold text-on-surface text-sm">2. 수집하는 개인정보 항목</h4>
        <p>• 필수항목: 이름(성명), 이메일 주소, 로그인 식별자, 결제 승인 기록<br>
        • 상품 배송 신청 시: 수령인 성명, 수령인 휴대전화번호, 배송지 주소<br>
        • 고가 경품 당첨 시: 주민등록번호(소득세법상 원천징수용, 별도 암호화 보관 후 즉시 파기)</p>

        <h4 class="font-bold text-on-surface text-sm">3. 개인정보의 보유 및 파기</h4>
        <p>이용자의 개인정보는 수집 및 이용목적이 달성되면 지체 없이 파기합니다. 단, 전자상거래법 등 관계 법령에 따라 다음 기간 동안 보존합니다:<br>
        • 계약 또는 청약철회 등에 관한 기록: 5년<br>
        • 대금결제 및 재화 등의 공급에 관한 기록: 5년<br>
        • 소비자의 불만 또는 분쟁처리에 관한 기록: 3년</p>

        <h4 class="font-bold text-on-surface text-sm">4. 개인정보 보호책임자 및 고객센터</h4>
        <p>• 성명: 이재영 (대표자)<br>
        • 고객센터: 070-8019-3205 (운영시간: 평일 10:00 ~ 17:00)<br>
        • 이메일: leejeayoung0713@gmail.com</p>
      </div>
    `
  },
  refund: {
    title: '취소·교환·반품 및 배송 정책 (Refund & Shipping Policy)',
    content: `
      <div class="space-y-4 text-xs text-on-surface-variant leading-relaxed">
        <h4 class="font-bold text-on-surface text-sm">1. 청약철회 (주문 취소 및 환불) 안내</h4>
        <p>• <strong>개봉 전 결제 취소:</strong> 결제 후 상품을 개봉하지 않은 상태이거나 실물 상품의 배송 접수 전 상태에서는 결제일로부터 7일 이내 언제든지 주문 취소 및 100% 전액 환불이 가능합니다.<br>
        • <strong>환불 수단 원칙:</strong> 주문 취소 및 환불 시 승인된 원 결제수단(신용카드 승인 취소, 휴대폰 결제 취소 등)으로만 환불 처리되며, 별도의 현금/계좌 환불은 불가합니다.<br>
        • <strong>환불 처리 소요 기간:</strong> 결제 취소 요청 접수 즉시 전자지급결제대행사(PG사)로 취소 전송되며, 신용카드는 카드사 영업일 기준 3~5일 내 승인 취소 및 한도가 복구됩니다.</p>

        <h4 class="font-bold text-on-surface text-sm">2. 배송 전 단순변심 반품 (스토어 적립금 전환)</h4>
        <p>• 고객님께서 획득하신 실물 상품의 배송을 원치 않으실 경우, 택배 출고 전 마이페이지 보관함에서 <strong>'단순변심 반품(80% 스토어 적립금 전환)'</strong>을 선택하실 수 있습니다.<br>
        • 전환된 적립금은 쇼핑몰 내 모든 블라인드 큐레이션 상품 재구매에 자유롭게 사용 가능합니다. (현금 환전 불가)</p>

        <h4 class="font-bold text-on-surface text-sm">3. 실물 상품 택배 배송 안내</h4>
        <p>• <strong>배송 택배사:</strong> CJ대한통운 또는 우체국택배<br>
        • <strong>출고 일정:</strong> 마이페이지 보관함에서 배송 요청 시 영업일 기준 1~3일 이내 정품 포장 출고됩니다.<br>
        • <strong>배송비:</strong> 일반 상품 및 사은품 배송 신청 시 기본 배송비 3,000원 (제주 및 도서산간 지역 추가 운임 3,000원)</p>

        <h4 class="font-bold text-on-surface text-sm">4. 교환 및 반품 규정</h4>
        <p>• <strong>상품 불량 및 오배송:</strong> 수령하신 상품이 파손, 불량 또는 표기 스펙과 상이한 경우 수령일로부터 30일 이내 무상 1:1 교환 또는 전액 환불을 보장합니다. (반품 택배비 회사 전액 부담)<br>
        • <strong>수령 후 단순변심 반품:</strong> 실물 상품 수령 후 미개봉 상태에서 7일 이내 반품 가능하며, 왕복 택배비(6,000원)는 고객 부담입니다.<br>
        • <strong>반품/교환 주소지:</strong> 경기도 화성시 만세구 수노을1로 148, 101동 902호 럭키픽 고객지원팀 앞 (우: 18237)</p>
      </div>
    `
  }
};

window.__openPolicyModal = (type) => {
  const policy = POLICY_CONTENT[type];
  if (!policy) return;

  const existing = document.getElementById('policy-modal');
  if (existing) existing.remove();

  const modalHtml = `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop bg-black/60 backdrop-blur-sm" id="policy-modal" onclick="if(event.target===this)window.__closePolicyModal()">
      <div class="bg-surface w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-variant/10">
          <h3 class="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-lg">gavel</span>
            ${policy.title}
          </h3>
          <button class="w-8 h-8 rounded-full hover:bg-surface-variant/40 flex items-center justify-center text-on-surface-variant transition-colors" onclick="window.__closePolicyModal()">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          ${policy.content}
        </div>
        <div class="px-6 py-3 border-t border-outline-variant/20 bg-surface-variant/10 flex justify-end">
          <button onclick="window.__closePolicyModal()" class="px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-full hover:opacity-90 active:scale-95 transition-all">
            확인
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.__closePolicyModal = () => {
  const modal = document.getElementById('policy-modal');
  if (modal) modal.remove();
};

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

// --- Debounced Router for Background Data Syncs ---
let backgroundSyncTimer = null;
function debouncedNavigate() {
  // If an active animation modal is open, defer re-rendering so animations are not interrupted
  if (document.getElementById('unboxing-stage-modal') || document.getElementById('direct-pay-modal')) {
    return;
  }
  if (backgroundSyncTimer) clearTimeout(backgroundSyncTimer);
  backgroundSyncTimer = setTimeout(() => {
    navigate();
  }, 50);
}

// --- Event Listeners ---
// Direct User Interactions: 0ms Immediate Rendering
window.addEventListener('hashchange', () => navigate());
window.addEventListener('languageChanged', () => navigate());

// Background Server Data Sync: 50ms Batch Throttled (Flicker-Free)
window.addEventListener('firestoreDataChanged', debouncedNavigate);
window.addEventListener('authStateChanged', debouncedNavigate);
window.addEventListener('userDataChanged', debouncedNavigate);
window.addEventListener('superRafflesChanged', debouncedNavigate);
window.addEventListener('boxCatalogChanged', debouncedNavigate);

// Immediately initialize router
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => navigate());
} else {
  navigate();
}



