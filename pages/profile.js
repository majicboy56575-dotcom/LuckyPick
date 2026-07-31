// ============================================
// LuckyPick - Profile Page (로그인 및 결제)
// ============================================
import { t } from '../i18n.js';
import { getCurrentUser, getActiveProducts, addParticipation } from '../services/firestore.js';
import { renderPayPalButtons, selectPaymentMethod, PAYMENT_METHODS } from '../services/payment.js';

function renderShippingModal() {
  return `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-backdrop" id="shipping-modal" onclick="if(event.target===this)window.__closeShippingModal()">
      <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div class="p-6 border-b border-outline-variant/20">
          <h3 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">local_shipping</span>
            ${t('enterShippingInfo')}
          </h3>
        </div>
        <div class="p-6 space-y-4">
          <div class="space-y-2">
            <label class="font-label-caps text-label-caps text-on-surface-variant">${t('recipientName')}</label>
            <input type="text" class="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="홍길동">
          </div>
          <div class="space-y-2">
            <label class="font-label-caps text-label-caps text-on-surface-variant">${t('recipientPhone')}</label>
            <input type="tel" class="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="010-1234-5678">
          </div>
          <div class="space-y-2">
            <label class="font-label-caps text-label-caps text-on-surface-variant">${t('shippingAddress')}</label>
            <input type="text" class="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="서울시 강남구 역삼동 123-45">
          </div>
          <div class="space-y-2">
            <label class="font-label-caps text-label-caps text-on-surface-variant">${t('zipCode')}</label>
            <input type="text" class="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="06234">
          </div>
        </div>
        <div class="p-6 border-t border-outline-variant/20 flex gap-3">
          <button class="flex-1 py-3 bg-surface-variant/30 text-on-surface font-bold rounded-xl hover:bg-surface-variant/50 transition-colors" onclick="window.__closeShippingModal()">${t('cancel')}</button>
          <button class="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors active:scale-95" onclick="window.__submitShipping()">${t('submitShipping')}</button>
        </div>
      </div>
    </div>`;
}

export function render() {
  const user = getCurrentUser();
  const activeProducts = getActiveProducts();

  // Dynamically parse product ID from URL query parameters (e.g. #profile?product=prod_002)
  const hash = window.location.hash;
  let targetProductId = 'prod_001';
  if (hash.includes('?product=')) {
    targetProductId = hash.split('?product=')[1].split('&')[0];
  }

  const selectedProduct = activeProducts.find(p => p.id === targetProductId) || activeProducts[0];
  const fee = 2.50;
  const totalAmount = (selectedProduct.entryPrice + fee).toFixed(2);

  const html = `
    <main class="pt-24 px-4 max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32 page-enter">
      <!-- Left Side: Login & Payment -->
      <div class="lg:col-span-7 flex flex-col gap-8">
        <!-- Step Progress -->
        <div class="flex items-center gap-4 font-label-caps text-label-caps text-outline">
          <span class="text-primary font-bold">${t('step1Login')}</span>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span class="text-on-surface font-bold">${t('step2Payment')}</span>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>${t('step3Confirm')}</span>
        </div>

        <!-- Login Section -->
        <section class="glass-card rounded-xl p-6 shadow-sm">
          <h2 class="font-headline-sm text-headline-sm mb-6 text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">person</span>
            ${t('quickAccess')}
          </h2>
          <p class="text-on-surface-variant mb-6 font-body-md text-body-md">${t('loginSubtitle')}</p>
          <div class="flex flex-col sm:flex-row gap-4">
            <button class="flex-1 flex items-center justify-center gap-3 bg-white border border-outline-variant px-6 py-3 rounded-full hover:bg-surface-bright transition-all font-body-md font-semibold text-on-surface shadow-sm">
              <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              ${t('continueGoogle')}
            </button>
            <button class="flex-1 flex items-center justify-center gap-3 bg-black text-white px-6 py-3 rounded-full hover:opacity-90 transition-all font-body-md font-semibold shadow-md">
              <svg class="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              ${t('continueApple')}
            </button>
          </div>
          <div class="mt-6 pt-6 border-t border-outline-variant/30 text-center">
            <button class="text-primary font-bold font-body-md hover:underline">${t('continueGuest')}</button>
          </div>
        </section>

        <!-- Payment Method -->
        <section class="glass-card rounded-xl p-6 shadow-sm">
          <h2 class="font-headline-sm text-headline-sm mb-6 text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">payments</span>
            ${t('paymentMethod')}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div class="payment-option relative">
              <input checked id="paypal" name="payment" type="radio" class="hidden" onchange="window.__selectPayMethod('paypal')">
              <label class="flex flex-col items-center justify-center p-4 border-2 border-outline-variant rounded-xl cursor-pointer hover:border-primary/50 transition-all bg-white text-center" for="paypal">
                <div class="h-10 flex items-center justify-center mb-1">
                  <span class="font-display-lg text-[20px] font-extrabold tracking-tight text-[#003087]">Pay<span class="text-[#0079C1]">Pal</span></span>
                </div>
                <span class="font-body-md text-xs text-on-surface-variant">Sandbox Active</span>
              </label>
            </div>
            <div class="payment-option relative">
              <input id="toss" name="payment" type="radio" class="hidden" onchange="window.__selectPayMethod('toss')">
              <label class="flex flex-col items-center justify-center p-4 border-2 border-outline-variant rounded-xl cursor-pointer hover:border-primary/50 transition-all bg-white text-center" for="toss">
                <div class="h-10 flex items-center justify-center mb-1">
                  <span class="font-display-lg text-[20px] font-extrabold tracking-tight text-[#0058be]">Toss Pay</span>
                </div>
                <span class="font-body-md text-xs text-on-surface-variant">${t('simpleAndFast')}</span>
              </label>
            </div>
            <div class="payment-option relative">
              <input id="kakao" name="payment" type="radio" class="hidden" onchange="window.__selectPayMethod('kakao')">
              <label class="flex flex-col items-center justify-center p-4 border-2 border-outline-variant rounded-xl cursor-pointer hover:border-primary/50 transition-all bg-white text-center" for="kakao">
                <div class="h-10 flex items-center justify-center mb-1">
                  <span class="font-display-lg text-[20px] font-extrabold tracking-tight text-on-surface">Kakao Pay</span>
                </div>
                <span class="font-body-md text-xs text-on-surface-variant">${t('secureMobilePay')}</span>
              </label>
            </div>
          </div>

          <!-- PayPal SDK Container -->
          <div id="paypal-button-wrapper" class="mt-6">
            <div id="paypal-button-container" class="w-full min-h-[150px]"></div>
          </div>

          <!-- Toss / Kakao Button -->
          <div id="standard-pay-button" class="mt-6 hidden">
            <button onclick="window.__triggerStandardPay()" class="w-full bg-primary text-on-primary font-headline-sm text-headline-sm py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              ${t('payNow')}
              <span class="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>

          <div class="mt-8 flex flex-wrap justify-center items-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all">
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[20px]">verified_user</span>
              <span class="text-label-caps font-label-caps">${t('sslSecure')}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[20px]">shield</span>
              <span class="text-label-caps font-label-caps">${t('dataProtected')}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[20px]">lock</span>
              <span class="text-label-caps font-label-caps">${t('encrypted')}</span>
            </div>
          </div>
        </section>

        <!-- Winning History -->
        ${user.wonProducts.length > 0 ? `
        <section class="glass-card rounded-xl p-6 shadow-sm">
          <h2 class="font-headline-sm text-headline-sm mb-6 text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-tertiary">emoji_events</span>
            ${t('winningHistory')}
          </h2>
          ${user.wonProducts.map(wp => `
            <div class="bg-tertiary/10 border border-tertiary/20 rounded-xl p-4 flex gap-4 mb-4">
              <div class="w-20 h-20 rounded-lg overflow-hidden shrink-0 shadow-sm">
                <img src="${wp.imageUrl}" alt="${wp.title}" class="w-full h-full object-contain bg-white">
              </div>
              <div class="flex flex-col justify-center flex-1">
                <span class="font-label-caps text-[10px] text-tertiary uppercase mb-1">${t('winnerSelected')}</span>
                <h4 class="font-headline-sm text-[18px] text-on-surface leading-tight">${wp.title}</h4>
                <p class="text-on-surface-variant font-body-md text-sm mt-1">${t('drawDate')}: ${wp.drawDate}</p>
              </div>
              <button class="self-center px-4 py-2 bg-tertiary text-on-tertiary rounded-full text-sm font-bold hover:opacity-90 transition-all active:scale-95 shrink-0" onclick="window.__openShippingModal()">
                ${t('enterShippingInfo')}
              </button>
            </div>
          `).join('')}
        </section>` : ''}

        <!-- Recent Participations -->
        <section class="glass-card rounded-xl p-6 shadow-sm">
          <div class="flex justify-between items-center mb-6">
            <h2 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">history</span>
              ${t('recentParticipations')}
            </h2>
          </div>
          <div class="space-y-4">
            ${user.participatedProducts.map(pp => `
              <div class="flex gap-4 p-3 border border-outline-variant/20 rounded-lg">
                <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <img src="${pp.imageUrl}" class="w-full h-full object-contain bg-white">
                </div>
                <div class="flex-1">
                  <div class="flex justify-between">
                    <h4 class="font-semibold text-on-surface">${pp.title}</h4>
                    <span class="text-[10px] font-bold ${pp.status === 'active' ? 'text-primary' : 'text-on-surface-variant'}">${pp.status === 'active' ? t('ongoing_status') : t('ended')}</span>
                  </div>
                  <p class="text-xs text-on-surface-variant">${t('participatedAgo')}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <p class="mt-4 text-[12px] text-outline font-body-md italic">${t('recordsNote')}</p>
        </section>
      </div>

      <!-- Right Side: Order Summary -->
      <aside class="lg:col-span-5">
        <div class="sticky top-24 space-y-6">
          <div class="glass-card rounded-xl overflow-hidden shadow-sm">
            <div class="bg-surface-container-high p-6">
              <h3 class="font-headline-sm text-headline-sm text-on-surface">${t('orderSummary')}</h3>
            </div>
            <div class="p-6">
              <div class="flex gap-4 mb-8">
                <div class="w-24 h-24 rounded-lg overflow-hidden shrink-0 shadow-sm border border-outline-variant/20">
                  <img src="${selectedProduct.imageUrl}" alt="${selectedProduct.title}" class="w-full h-full object-contain bg-white">
                </div>
                <div class="flex flex-col justify-center">
                  <span class="font-label-caps text-[10px] text-on-surface-variant uppercase mb-1">${selectedProduct.category}</span>
                  <h4 class="font-headline-sm text-[18px] text-on-surface leading-tight">${selectedProduct.title}</h4>
                  <p class="text-on-surface-variant font-body-md text-sm mt-1">${t('entryTicket')}</p>
                </div>
              </div>
              <div class="space-y-4 border-t border-outline-variant/30 pt-6 mb-8">
                <div class="flex justify-between items-center text-on-surface-variant">
                  <span class="font-body-md text-body-md">${t('entryPrice')}</span>
                  <span class="font-timer-numeric text-on-surface">$${selectedProduct.entryPrice.toFixed(2)}</span>
                </div>
                <div class="flex justify-between items-center text-on-surface-variant">
                  <span class="font-body-md text-body-md">${t('platformFee')}</span>
                  <span class="font-timer-numeric text-on-surface">$${fee.toFixed(2)}</span>
                </div>
                <div class="flex justify-between items-center text-tertiary">
                  <span class="font-body-md text-body-md">${t('discount')}</span>
                  <span class="font-timer-numeric">-$0.00</span>
                </div>
              </div>
              <div class="bg-surface-container-low rounded-lg p-6 flex flex-col gap-1 border border-primary/10">
                <div class="flex justify-between items-center">
                  <span class="font-headline-md text-headline-md text-on-surface">${t('total')}</span>
                  <span class="font-display-lg text-[28px] text-on-surface">$${totalAmount}</span>
                </div>
                <p class="text-outline text-[12px] font-body-md text-right">${t('vatIncluded')}</p>
              </div>
            </div>
          </div>

          <div class="bg-secondary-container/10 border border-secondary-container/20 rounded-xl p-4 flex items-start gap-3">
            <span class="material-symbols-outlined text-secondary pt-1">timer</span>
            <div>
              <p class="font-body-md text-secondary font-bold text-sm">${t('drawClosingSoon')}</p>
              <p class="text-on-surface-variant text-sm font-body-md">${t('drawClosingDesc')}</p>
            </div>
          </div>
        </div>
      </aside>
    </main>
    <div id="shipping-modal-container"></div>`;

  // Render PayPal SDK buttons after DOM update for the SPECIFIC selected product
  setTimeout(() => {
    renderPayPalButtons('paypal-button-container', {
      amount: parseFloat(totalAmount),
      orderName: `LuckyPick ${selectedProduct.title} Ticket`,
      onSuccess: (payment) => {
        const updatedProduct = addParticipation({
          productId: selectedProduct.id,
          paymentId: payment.paymentId,
          payer: payment.payer
        });

        const countText = updatedProduct ? `${updatedProduct.currentParticipants}/${updatedProduct.maxParticipants}` : '';

        alert(`🎉 PayPal Sandbox 결제 성공!\n\nTransaction ID: ${payment.paymentId}\nStatus: ${payment.status}\n\n[${selectedProduct.title}] 참여가 등록되었습니다! (현재 참여 인원: ${countText})\n\n[진행 중] 페이지로 이동합니다.`);

        window.location.hash = '#home';
      },
      onError: (err) => {
        console.error('PayPal Error:', err);
        alert('PayPal 결제 진행 중 오류가 발생했습니다.');
      }
    });
  }, 100);

  window.__selectPayMethod = (method) => {
    selectPaymentMethod(method);
    const paypalWrapper = document.getElementById('paypal-button-wrapper');
    const standardBtn = document.getElementById('standard-pay-button');

    if (method === 'paypal') {
      if (paypalWrapper) paypalWrapper.classList.remove('hidden');
      if (standardBtn) standardBtn.classList.add('hidden');
    } else {
      if (paypalWrapper) paypalWrapper.classList.add('hidden');
      if (standardBtn) standardBtn.classList.remove('hidden');
    }
  };

  window.__triggerStandardPay = () => {
    const updatedProduct = addParticipation({
      productId: selectedProduct.id,
      paymentId: 'mock_' + Date.now(),
      payer: null
    });

    const countText = updatedProduct ? `${updatedProduct.currentParticipants}/${updatedProduct.maxParticipants}` : '';
    alert(`🎉 결제가 완료되었습니다! (Mock Payment Success)\n\n[${selectedProduct.title}] 참여가 등록되었습니다! (현재 참여 인원: ${countText})\n\n[진행 중] 페이지로 이동합니다.`);

    window.location.hash = '#home';
  };

  window.__openShippingModal = () => {
    document.getElementById('shipping-modal-container').innerHTML = renderShippingModal();
  };
  window.__closeShippingModal = () => {
    document.getElementById('shipping-modal-container').innerHTML = '';
  };
  window.__submitShipping = () => {
    alert('배송 정보가 제출되었습니다! (Shipping info submitted!)');
    window.__closeShippingModal();
  };

  return html;
}

export function cleanup() {
  delete window.__selectPayMethod;
  delete window.__triggerStandardPay;
  delete window.__openShippingModal;
  delete window.__closeShippingModal;
  delete window.__submitShipping;
}
