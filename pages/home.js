import { t } from '../i18n.js';
import { getActiveProducts, closeExpiredProduct } from '../services/firestore.js';
import { getCurrentAuthUser } from '../services/auth.js';

let countdownIntervals = [];

function clearTimers() {
  countdownIntervals.forEach(id => clearInterval(id));
  countdownIntervals = [];
}

function formatTime(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function getTimerClasses(ms) {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec <= 300) return { bg: 'bg-secondary-container', text: 'text-on-secondary-container', pulse: true };
  if (totalSec <= 3600) return { bg: 'bg-white/80 backdrop-blur-md', text: 'text-primary', pulse: false };
  return { bg: 'bg-white/80 backdrop-blur-md', text: 'text-on-surface-variant', pulse: false };
}

function renderParticipantsModal(product) {
  return `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-backdrop transition-opacity duration-300" id="participantsModal" onclick="if(event.target===this)window.__closeModal()">
      <div class="bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100" id="modalContent">
        <div class="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-white">
          <div>
            <h3 class="font-headline-sm text-headline-sm text-on-surface">${product.title}</h3>
            <p class="text-on-surface-variant font-label-caps text-label-caps uppercase tracking-widest mt-1">${t('participantsList')}</p>
          </div>
          <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/30 text-on-surface-variant" onclick="window.__closeModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          ${product.participants.map((p, i) => {
            const colors = ['bg-primary-container text-on-primary-container', 'bg-secondary-container text-on-secondary-container', 'bg-tertiary-container text-on-tertiary-container'];
            const color = colors[i % 3];
            return `
              <div class="flex items-center gap-4 p-4 rounded-2xl bg-white border border-outline-variant/10 shadow-sm">
                <div class="w-12 h-12 rounded-full ${color} flex items-center justify-center font-bold">${p.initial}</div>
                <div class="flex-grow">
                  <div class="flex justify-between items-center">
                    <span class="font-bold text-on-surface">${p.name}</span>
                    <span class="text-[10px] bg-tertiary-container/10 text-tertiary px-2 py-0.5 rounded-full font-label-caps">VERIFIED</span>
                  </div>
                  <p class="text-on-surface-variant text-sm font-timer-numeric">${p.email}</p>
                  ${p.phone ? `<p class="text-on-surface-variant text-sm font-timer-numeric">${p.phone}</p>` : ''}
                </div>
              </div>`;
          }).join('')}
          <div class="p-4 bg-surface-container-low rounded-2xl">
            <p class="text-on-surface-variant text-xs leading-relaxed italic">${t('privacyNotice')}</p>
          </div>
        </div>
        <div class="p-6 bg-white border-t border-outline-variant/20">
          <button class="w-full py-3 bg-surface-variant/30 text-on-surface font-bold rounded-xl hover:bg-surface-variant/50 transition-colors" onclick="window.__closeModal()">${t('close')}</button>
        </div>
      </div>
    </div>`;
}

function renderProductCard(product, index) {
  const remaining = product.endTime - Date.now();
  const fillPercent = Math.round((product.currentParticipants / product.maxParticipants) * 100);
  const timerClasses = getTimerClasses(remaining);
  const isUrgent = remaining <= 300000;

  return `
    <div class="bg-white rounded-[24px] border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-xl hover:-translate-y-1">
      <div class="relative h-64 w-full">
        <img class="w-full h-full object-contain bg-white" src="${product.imageUrl}" alt="${product.title}">
        <div class="absolute top-4 left-4 flex gap-2">
          <span class="bg-secondary-container text-on-secondary-container font-label-caps text-label-caps px-3 py-1 rounded-full shadow-sm">${product.category}</span>
          <span class="${timerClasses.bg} ${timerClasses.text} font-label-caps text-label-caps px-3 py-1 rounded-full flex items-center gap-1 ${timerClasses.pulse ? 'timer-pulse' : ''}">
            <span class="material-symbols-outlined text-[14px]">${isUrgent ? 'bolt' : 'timer'}</span>
            <span class="font-timer-numeric text-timer-numeric text-[14px]" id="timer-${index}">${formatTime(remaining)}</span>
          </span>
        </div>
      </div>
      <div class="p-container-margin flex-grow flex flex-col">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h2 class="font-headline-sm text-headline-sm text-on-surface">${product.title}</h2>
            <p class="text-on-surface-variant font-body-md">${product.description}</p>
          </div>
          <div class="flex flex-col items-end">
            <span class="text-xs text-on-surface-variant line-through">${t('retail')}: $${product.retailPrice.toLocaleString()}</span>
            <div class="flex flex-col items-end">
              <span class="text-label-caps text-[10px] text-primary uppercase tracking-widest">${t('entryPrice')}</span>
              <span class="font-headline-sm text-headline-sm text-primary">$${product.entryPrice}</span>
            </div>
          </div>
        </div>
        <div class="mt-stack-sm mb-stack-md">
          <div class="flex justify-between items-end mb-2">
            <button class="font-label-caps text-label-caps text-primary hover:underline flex items-center gap-1 cursor-pointer" onclick="window.__showParticipants('${product.id}')">
              <span class="material-symbols-outlined text-[16px]">group</span>
              ${t('participants')} (${product.currentParticipants}/${product.maxParticipants})
            </button>
            <span class="font-label-caps text-label-caps text-on-surface-variant">${fillPercent}% ${t('filled')}</span>
          </div>
          <div class="h-2 w-full bg-surface-container rounded-full overflow-hidden relative">
            <div class="h-full ${isUrgent ? 'bg-secondary' : 'bg-primary'} rounded-full relative overflow-hidden" style="width:${fillPercent}%">
              <div class="absolute inset-0 bg-white/20 progress-pulse w-1/4"></div>
            </div>
          </div>
        </div>
        <button onclick="window.__participate('${product.id}')" class="mt-auto w-full py-4 ${isUrgent ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary text-on-primary'} font-bold rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-md">
          ${isUrgent ? t('hurryParticipate') : t('participateNow')}
          <span class="material-symbols-outlined">${isUrgent ? 'shopping_cart' : 'arrow_forward'}</span>
        </button>
      </div>
    </div>`;
}

export function render() {
  clearTimers();
  const products = getActiveProducts();

  const html = `
    <main class="pt-24 pb-32 px-container-margin max-w-[1200px] mx-auto page-enter">
      <section class="mb-stack-lg">
        <div class="relative rounded-3xl overflow-hidden bg-primary p-stack-md text-white min-h-[280px] flex flex-col justify-end">
          <div class="relative z-10">
            <h1 class="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg mb-2">${t('heroTitle')}</h1>
            <p class="font-body-lg text-body-lg text-primary-fixed max-w-md">${t('heroSubtitle')}</p>
          </div>
        </div>
      </section>
      <section class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        ${products.map((p, i) => renderProductCard(p, i)).join('')}
      </section>
    </main>
    <div id="modal-container"></div>`;

  // Setup timers after render
  setTimeout(() => {
    products.forEach((product, index) => {
      const el = document.getElementById(`timer-${index}`);
      if (!el) return;
      const interval = setInterval(() => {
        const remaining = product.endTime - Date.now();
        if (remaining <= 0) {
          el.textContent = '00:00:00';
          clearInterval(interval);

          // Trigger automatic draw
          const result = closeExpiredProduct(product.id);
          if (result) {
            const authUser = getCurrentAuthUser();
            const isParticipant = authUser && product.participants.some(p => p.email === authUser.email || authUser.email === 'majXXXX@gmail.com');
            const isWinner = authUser && result.winner.email === authUser.email;

            const modalContainer = document.getElementById('modal-container');
            if (modalContainer) {
              if (isWinner) {
                modalContainer.innerHTML = `
                  <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-backdrop" onclick="if(event.target===this)window.__closeDraw()">
                    <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-center p-8">
                      <div class="w-20 h-20 rounded-full bg-tertiary/10 flex items-center justify-center mx-auto mb-4">
                        <span class="material-symbols-outlined text-tertiary text-5xl">emoji_events</span>
                      </div>
                      <h2 class="font-headline-md text-headline-md text-on-surface mb-2">🎉 축하합니다! 당첨되었습니다!</h2>
                      <p class="text-on-surface-variant mb-4"><strong>${result.title}</strong></p>
                      <div class="bg-tertiary/10 border border-tertiary/20 rounded-xl p-4 mb-6">
                        <p class="font-label-caps text-label-caps text-tertiary mb-1">티켓 번호</p>
                        <p class="font-timer-numeric text-xl font-bold text-primary">${result.ticketNumber}</p>
                      </div>
                      <button onclick="window.location.hash='#profile'; window.__closeDraw()" class="w-full py-3 bg-tertiary text-on-tertiary font-bold rounded-full hover:opacity-90 active:scale-95 transition-all">
                        배송 정보 입력하러 가기
                      </button>
                    </div>
                  </div>`;
              } else if (isParticipant) {
                modalContainer.innerHTML = `
                  <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-backdrop" onclick="if(event.target===this)window.__closeDraw()">
                    <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-center p-8">
                      <div class="w-20 h-20 rounded-full bg-error-container/30 flex items-center justify-center mx-auto mb-4">
                        <span class="material-symbols-outlined text-error text-5xl">sentiment_dissatisfied</span>
                      </div>
                      <h2 class="font-headline-md text-headline-md text-on-surface mb-2">😢 추첨 결과 안내</h2>
                      <p class="text-error font-bold mb-2">[${result.title}] 당첨되지 않았습니다.</p>
                      <p class="text-on-surface-variant text-sm mb-6 leading-relaxed">
                        아쉽지만 <strong>${result.title}</strong> 상품 추첨에서 당첨되지 않았습니다.<br>
                        (당첨자: ${result.winner.name})<br>
                        다음 럭키드로우 기회에 다시 도전해보세요!
                      </p>
                      <button onclick="window.__closeDraw()" class="w-full py-3 bg-primary text-on-primary font-bold rounded-full hover:opacity-90 active:scale-95 transition-all">
                        확인
                      </button>
                    </div>
                  </div>`;
              } else {
                modalContainer.innerHTML = `
                  <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-backdrop" onclick="if(event.target===this)window.__closeDraw()">
                    <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-center p-8">
                      <div class="w-20 h-20 rounded-full bg-tertiary/10 flex items-center justify-center mx-auto mb-4">
                        <span class="material-symbols-outlined text-tertiary text-5xl">emoji_events</span>
                      </div>
                      <h2 class="font-headline-md text-headline-md text-on-surface mb-2">🎉 추첨 완료!</h2>
                      <p class="text-on-surface-variant mb-4"><strong>${result.title}</strong></p>
                      <div class="bg-tertiary/10 border border-tertiary/20 rounded-xl p-4 mb-6">
                        <p class="font-label-caps text-label-caps text-tertiary mb-1">당첨자</p>
                        <p class="font-headline-sm text-on-surface">${result.winner.name}</p>
                        <p class="text-sm text-on-surface-variant">${result.winner.email}</p>
                        <p class="font-timer-numeric text-primary mt-2">${result.ticketNumber}</p>
                      </div>
                      <button onclick="window.__closeDraw()" class="w-full py-3 bg-primary text-on-primary font-bold rounded-full hover:opacity-90 active:scale-95 transition-all">
                        확인
                      </button>
                    </div>
                  </div>`;
              }
            }
            window.__closeDraw = () => {
              const mc = document.getElementById('modal-container');
              if (mc) mc.innerHTML = '';
              // Re-render home page with updated product list
              window.dispatchEvent(new CustomEvent('languageChanged'));
            };
          }
          return;
        }
        el.textContent = formatTime(remaining);
      }, 1000);
      countdownIntervals.push(interval);
    });
  }, 100);

  window.__participate = (productId) => {
    const user = getCurrentAuthUser();
    if (!user) {
      alert('로그인이 필요한 서비스입니다. 로그인 화면으로 이동합니다.');
      window.location.hash = `#profile?product=${productId}`;
      return;
    }
    window.location.hash = `#profile?product=${productId}`;
  };

  // Modal handlers
  window.__showParticipants = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    document.getElementById('modal-container').innerHTML = renderParticipantsModal(product);
  };
  window.__closeModal = () => {
    document.getElementById('modal-container').innerHTML = '';
  };

  return html;
}

export function cleanup() {
  clearTimers();
  delete window.__participate;
  delete window.__showParticipants;
  delete window.__closeModal;
  delete window.__closeDraw;
}
