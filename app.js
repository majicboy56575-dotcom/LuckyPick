// ============================================
// LuckyPick - Main App (SPA Router)
// ============================================
import { t, setLanguage, getCurrentLanguage, getAvailableLanguages, renderLanguageDropdown } from './i18n.js?v=2026092901';
import { getCurrentAuthUser, waitForAuth } from './services/auth.js?v=2026092901';
import { getClosedProducts, getCurrentUser } from './services/firestore.js?v=2026092901';
import { handleTossSuccess } from './services/payment.js?v=2026092901';
import * as homePage from './pages/home.js?v=2026092901';
import * as historyPage from './pages/history.js?v=2026092901';
import * as profilePage from './pages/profile.js?v=2026092901';
import * as adminPage from './pages/admin.js?v=2026092901';

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
          <p><span class="font-semibold text-on-surface">고객센터:</span> 010-4710-5657 | <span class="font-semibold text-on-surface">이메일:</span> leejeayoung0713@gmail.com | <span class="font-semibold text-on-surface">호스팅:</span> Google Firebase</p>
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
    sessionStorage.removeItem('toss_pending_product');

    (async () => {
      const user = await waitForAuth(5000);
      if (!user) {
        alert('로그인 정보를 확인하는 데 실패했습니다. 다시 로그인 후 시도해주세요.');
        window.location.hash = '#profile';
        return;
      }
      try {
        const result = await handleTossSuccess(tossPaymentKey, tossOrderId, tossAmount, tossProductId || 'prod_001');
        const countText = result.currentParticipants && result.maxParticipants
          ? `${result.currentParticipants}/${result.maxParticipants}`
          : '';
        alert(`🎉 토스 결제 성공!\n\nPayment Key: ${tossPaymentKey}\n\n참여가 등록되었습니다! (현재 참여 인원: ${countText})\n\n[진행 중] 페이지로 이동합니다.`);
      } catch (err) {
        console.error('[Toss] Confirm failed:', err);
        alert(`토스 결제 승인 실패: ${err.message || '서버 오류가 발생했습니다.'}`);
      }
      window.location.hash = '#home';
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
  const user = getCurrentAuthUser();
  if (!user && (pageName === 'history' || pageName === 'admin')) {
    alert(t('loginRequiredAlert'));
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
    app.innerHTML = renderHeader(pageName) + route.render() + renderFooter(pageName) + renderBottomNav(pageName);
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
        <p>본 약관은 럭키픽(이하 "회사")이 운영하는 온라인 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        
        <h4 class="font-bold text-on-surface text-sm">제2조 (용어의 정의)</h4>
        <p>1. "럭키픽"이란 회사가 상품 또는 용역을 이용자에게 제공하기 위하여 설정한 전자상거래 및 한정 수량 프로모션 플랫폼을 말합니다.<br>
        2. "이용자"란 서비스에 접속하여 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.<br>
        3. "참여 슬롯"이란 회원이 프로모션 상품의 추첨 대상자가 되기 위해 결제하는 1회의 응모 권리를 의미합니다.</p>

        <h4 class="font-bold text-on-surface text-sm">제3조 (서비스의 제공 및 공정 추첨)</h4>
        <p>1. 회사는 정해진 모집 인원(슬롯)이 마감되는 즉시 투명하고 조작 불가능한 시스템 난수 추첨 알고리즘을 통해 1인의 당첨자를 공정하게 선정합니다.<br>
        2. 당첨된 회원에게는 해당 상품을 무상(배송비 포함 무료)으로 배송합니다.</p>

        <h4 class="font-bold text-on-surface text-sm">제4조 (100% 자동 환불 원칙)</h4>
        <p>1. 정해진 모집 기한 내에 목표 슬롯이 마감되지 않거나 상품 제공이 불가능해진 경우, 해당 프로모션은 취소되며 참여자의 결제 금액은 <strong>별도 신청 없이 전액(100%) 자동 환불</strong>됩니다.<br>
        2. 회원은 추첨 진행 전 마이페이지에서 언제든지 참여를 자진 취소하고 결제 대금을 전액 환불받을 수 있습니다.</p>
      </div>
    `
  },
  privacy: {
    title: '개인정보처리방침 (Privacy Policy)',
    content: `
      <div class="space-y-4 text-xs text-on-surface-variant leading-relaxed">
        <h4 class="font-bold text-on-surface text-sm">1. 개인정보의 수집 및 이용 목적</h4>
        <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다:<br>
        - 회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증<br>
        - 결제 승인, 결제 취소 및 환불 처리<br>
        - 프로모션 당첨자 확인 및 당첨 상품 배송</p>

        <h4 class="font-bold text-on-surface text-sm">2. 수집하는 개인정보 항목</h4>
        <p>- 필수항목: 성명, 이메일 주소, 결제 승인 번호(Toss/PayPal 식별자)<br>
        - 배송 필요 시(당첨자 한정): 수령인 성명, 연락처, 배송지 주소</p>

        <h4 class="font-bold text-on-surface text-sm">3. 개인정보의 보유 및 이용기간</h4>
        <p>관계 법령의 규정에 따라 보존할 의무가 있는 경우를 제외하고는 이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다.<br>
        - 계약 또는 청약철회 등에 관한 기록: 5년<br>
        - 대금결제 및 재화 등의 공급에 관한 기록: 5년<br>
        - 소비자의 불만 또는 분쟁처리에 관한 기록: 3년</p>

        <h4 class="font-bold text-on-surface text-sm">4. 개인정보 보호책임자</h4>
        <p>성명: 이재영 | 연락처: 010-4710-5657 | 이메일: leejeayoung0713@gmail.com</p>
      </div>
    `
  },
  refund: {
    title: '취소 및 환불 정책 (Refund & Cancel Policy)',
    content: `
      <div class="space-y-4 text-xs text-on-surface-variant leading-relaxed">
        <h4 class="font-bold text-on-surface text-sm">1. 참여 취소 및 전액 환불 규정</h4>
        <p>• <strong>추첨 진행 전 자진 취소:</strong> 프로모션이 마감(완판)되기 전까지는 '마이페이지 > 참여 내역'에서 언제든지 참여를 취소할 수 있으며, 취소 즉시 결제된 수단으로 100% 자동 환불 처리됩니다.<br>
        • <strong>목표 인원 미달 시 자동 환불:</strong> 상품별 설정된 모집 기간 내에 정원이 채워지지 않은 경우, 프로모션은 자동 종료되며 모든 참여자의 결제 금액이 100% 자동 취소/환불됩니다.</p>

        <h4 class="font-bold text-on-surface text-sm">2. 당첨 상품 배송 및 교환 규정</h4>
        <p>• <strong>배송 안내:</strong> 당첨자 발표 후 배송지가 입력되면 영업일 기준 3일 이내에 출고되며 모든 배송비는 무료입니다.<br>
        • <strong>교환/반품 안내:</strong> 배송된 상품이 파손, 불량 또는 주문 내역과 상이한 경우 수령일로부터 7일 이내에 1:1 무상 교환을 진행합니다.</p>

        <h4 class="font-bold text-on-surface text-sm">3. 환불 소요 기간</h4>
        <p>• 카드 결제: 카드사 영업일 기준 3~5일 이내 한도 복구 또는 결제 취소 반영<br>
        • 간편결제(토스/페이팔): 승인 취소 즉시 환불 처리</p>
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

// --- Event Listeners ---
window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);
window.addEventListener('languageChanged', navigate);
window.addEventListener('firestoreDataChanged', navigate);


