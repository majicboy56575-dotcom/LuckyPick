// ============================================
// LuckyPick - Interactive Unboxing & Payment Integration
// ============================================
import { getRandomBoxTiers, openRandomBox, convertVaultItemToPoints, getUserPoints, setUserPoints, getAvailableGoldenTicketsCount } from './randombox.js?v=20261004_19';
import { requestTossPayment, renderPayPalButtons } from './payment.js?v=20261004_22';
import { getCurrentAuthUser, requireLogin } from './auth.js';

export function showProbabilityModal(boxId) {
  const tiers = getRandomBoxTiers();
  const tier = tiers.find(b => b.id === boxId);
  if (!tier) return;

  const modalHtml = `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop animate-in fade-in" id="prob-modal" onclick="if(event.target===this)window.__closeProbModal()">
      <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div class="p-6 bg-gradient-to-r ${tier.color} text-white flex justify-between items-center">
          <div>
            <span class="text-[10px] font-extrabold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">투명한 공정 확률 100% 공개</span>
            <h3 class="text-xl font-bold mt-1">${tier.name} 등장 품목 및 확률표</h3>
            <p class="text-xs text-white/80">구매 시 아래 실물 상품 중 1개가 100% 무조건 지급됩니다 (꽝 없음)</p>
          </div>
          <button onclick="window.__closeProbModal()" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-3 custom-scrollbar">
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs">
            <span class="material-symbols-outlined text-amber-600 text-2xl">verified_user</span>
            <div>
              <p class="font-bold">전자상거래 등에서의 소비자보호법 준수</p>
              <p class="text-[11px] text-amber-800">최소 보장 가치 <strong>₩${tier.minGuaranteedValue.toLocaleString()}원</strong> 이상이며, 모든 품목의 당첨 확률 합은 정확히 100%입니다.</p>
            </div>
          </div>

          <div class="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
            ${tier.items.map((item) => {
              const probPercent = (item.prob * 100).toFixed(1);
              const gradeColors = {
                LEGENDARY: 'bg-amber-100 text-amber-800 border-amber-300',
                EPIC: 'bg-purple-100 text-purple-800 border-purple-300',
                RARE: 'bg-blue-100 text-blue-800 border-blue-300',
                NORMAL: 'bg-gray-100 text-gray-700 border-gray-200'
              };
              const gradeClass = gradeColors[item.grade] || gradeColors.NORMAL;

              return `
                <div class="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 transition-colors">
                  <img src="${item.image}" alt="${item.name}" class="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0">
                  <div class="flex-grow min-w-0">
                    <div class="flex items-center gap-1.5 mb-0.5">
                      <span class="text-[9px] font-extrabold px-2 py-0.2 rounded border ${gradeClass}">${item.grade}</span>
                      <span class="text-xs font-bold text-gray-900 truncate">${item.name}</span>
                    </div>
                    <p class="text-[11px] text-gray-500">소비자가: <strong>₩${item.retailPrice.toLocaleString()}원</strong></p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <span class="text-sm font-extrabold text-primary font-mono">${probPercent}%</span>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>

        <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button onclick="window.__closeProbModal()" class="px-6 py-2.5 bg-gray-800 text-white font-bold rounded-xl text-xs hover:bg-gray-900 transition-colors">
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>`;

  const existing = document.getElementById('prob-modal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

export function startUnboxingFlow(boxId) {
  if (!requireLogin('럭키박스 개봉 및 100% 실물 득템은 로그인 후 이용하실 수 있습니다.')) return;
  const tiers = getRandomBoxTiers();
  const tier = tiers.find(b => b.id === boxId);
  if (!tier) return;

  const currentPts = getUserPoints();
  const hasEnoughPoints = currentPts >= tier.price;

  // Render Selection & Payment Confirmation Modal
  const confirmModal = `
    <div class="fixed inset-0 z-[90] flex items-center justify-center p-4 modal-backdrop" id="unboxing-confirm-modal" onclick="if(event.target===this)window.__closeConfirmModal()">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95">
        <div class="relative w-28 h-28 mx-auto mb-4">
          <img src="${tier.boxImage}" class="w-full h-full object-cover rounded-2xl shadow-lg border-2 border-primary/20 float-anim" alt="${tier.name}">
          <span class="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md">
            골든티켓 +${tier.goldenTickets}장 적립
          </span>
        </div>

        <h3 class="font-headline-sm text-xl font-extrabold text-gray-900 mb-1">${tier.name}</h3>
        <p class="text-xs text-gray-500 mb-4">${tier.tagline}</p>

        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 mb-6 text-xs">
          <div class="flex justify-between">
            <span class="text-gray-500">결제 금액</span>
            <span class="font-extrabold text-primary text-sm font-mono">₩${tier.price.toLocaleString()}원</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">최소 보장 실물 가치</span>
            <span class="font-bold text-emerald-600">₩${tier.minGuaranteedValue.toLocaleString()}원 상당 (100% 당첨)</span>
          </div>
          <div class="flex justify-between border-t border-slate-200 pt-2">
            <span class="text-gray-500">내 보유 포인트</span>
            <span class="font-bold ${hasEnoughPoints ? 'text-gray-800' : 'text-red-500'} font-mono">
              ₩${currentPts.toLocaleString()} P ${!hasEnoughPoints ? '(부족)' : ''}
            </span>
          </div>
        </div>

        ${hasEnoughPoints ? `
          <div class="flex flex-col gap-2.5">
            <button onclick="window.__executeOpenBoxWithPoints('${tier.id}')" class="w-full py-3.5 bg-gradient-to-r ${tier.color} text-white font-extrabold rounded-2xl shadow-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2">
              <span class="material-symbols-outlined">inventory_2</span>
              포인트로 즉시 개봉하기 (₩${tier.price.toLocaleString()}P)
            </button>
            <button onclick="window.__openDirectPaymentModal('${tier.id}', ${tier.price})" class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">credit_card</span>
              다른 결제수단(토스/카드/PayPal)으로 바로 구매
            </button>
          </div>
        ` : `
          <div class="space-y-3">
            <div class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-left">
              ⚠️ 보유 포인트가 부족합니다. 아래 결제수단으로 즉시 결제 후 바로 개봉할 수 있습니다.
            </div>
            <button onclick="window.__openDirectPaymentModal('${tier.id}', ${tier.price})" class="w-full py-3.5 bg-primary text-white font-extrabold rounded-2xl shadow-lg hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-2">
              <span class="material-symbols-outlined">payments</span>
              ₩${tier.price.toLocaleString()}원 결제하고 즉시 개봉
            </button>
          </div>
        `}

        <button onclick="window.__closeConfirmModal()" class="w-full mt-2.5 py-2 text-gray-400 font-semibold rounded-xl text-xs hover:text-gray-600 transition-colors">
          닫기
        </button>
      </div>
    </div>`;

  const existing = document.getElementById('unboxing-confirm-modal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', confirmModal);
}

export function openDirectPaymentModal(tierId, amount) {
  if (!requireLogin()) return;
  const confirmModal = document.getElementById('unboxing-confirm-modal');
  if (confirmModal) confirmModal.remove();

  const modalHtml = `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop" id="direct-pay-modal" onclick="if(event.target===this)window.__closeDirectPayModal()">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div class="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 class="font-bold text-lg">결제 수단 선택</h3>
            <p class="text-xs text-slate-400">결제 완료 즉시 럭키박스가 자동으로 개봉됩니다</p>
          </div>
          <button onclick="window.__closeDirectPayModal()" class="text-slate-400 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
            <span class="text-xs font-bold text-gray-500">결제 대상 금액</span>
            <span class="font-black text-2xl text-primary font-mono">₩${amount.toLocaleString()}원</span>
          </div>

          <div class="space-y-2.5">
            <!-- 1. Toss / Card -->
            <button onclick="window.__processDirectPayment('${tierId}', ${amount}, 'toss')" class="w-full p-4 bg-blue-50/60 hover:bg-blue-100/80 border border-blue-200 rounded-2xl flex items-center justify-between transition-colors text-left group">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">토스</span>
                <div>
                  <h4 class="font-bold text-sm text-gray-900 group-hover:text-blue-600">토스페이 / 카드 간편결제</h4>
                  <p class="text-[11px] text-gray-500">신용·체크카드, 카카오페이, 토스페이</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-gray-400 group-hover:text-blue-600">chevron_right</span>
            </button>

            <!-- 2. PayPal -->
            <button onclick="window.__processDirectPayment('${tierId}', ${amount}, 'paypal')" class="w-full p-4 bg-indigo-50/60 hover:bg-indigo-100/80 border border-indigo-200 rounded-2xl flex items-center justify-between transition-colors text-left group">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">PayPal</span>
                <div>
                  <h4 class="font-bold text-sm text-gray-900 group-hover:text-indigo-600">PayPal 해외 결제</h4>
                  <p class="text-[11px] text-gray-500">Global Credit Cards & PayPal Balance</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-gray-400 group-hover:text-indigo-600">chevron_right</span>
            </button>
          </div>
        </div>

        <div class="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <button onclick="window.__closeDirectPayModal()" class="text-xs font-bold text-gray-500 hover:text-gray-800">
            결제 취소
          </button>
        </div>
      </div>
    </div>`;

  const existing = document.getElementById('direct-pay-modal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

export function executeUnboxingAnimation(boxId) {
  const confirmModal = document.getElementById('unboxing-confirm-modal');
  if (confirmModal) confirmModal.remove();
  const directPay = document.getElementById('direct-pay-modal');
  if (directPay) directPay.remove();

  const tiers = getRandomBoxTiers();
  const tier = tiers.find(b => b.id === boxId);
  if (!tier) return;

  // Perform random box draw
  const result = openRandomBox(boxId);

  // Stage 1: Shaking Box Animation Modal
  const animModalHtml = `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" id="unboxing-stage-modal">
      <div class="ray-spin-bg"></div>

      <div class="relative z-10 text-center text-white max-w-md w-full" id="unboxing-stage-content">
        <div id="anim-stage-1" class="space-y-6">
          <div class="relative w-44 h-44 mx-auto">
            <img src="${tier.boxImage}" class="w-full h-full object-cover rounded-3xl shadow-2xl border-4 border-amber-400 box-shake-anim" alt="Opening Box">
          </div>
          <div class="space-y-2">
            <h2 class="text-2xl font-black text-amber-300 animate-pulse tracking-wider">럭키박스 개봉 중...</h2>
            <p class="text-sm text-gray-300">100% 실물 득템과 골든 래플 티켓을 확인하는 중입니다!</p>
          </div>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', animModalHtml);

  // Stage 2: Reveal Results after 1.6s
  setTimeout(() => {
    const stageContent = document.getElementById('unboxing-stage-content');
    if (!stageContent) return;

    const gradeBadges = {
      LEGENDARY: 'bg-amber-400 text-amber-950 font-black',
      EPIC: 'bg-purple-500 text-white font-bold',
      RARE: 'bg-blue-500 text-white font-bold',
      NORMAL: 'bg-emerald-500 text-white font-bold'
    };

    stageContent.innerHTML = `
      <div class="reveal-pop bg-white text-gray-900 rounded-3xl p-6 shadow-2xl border-2 border-amber-400 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <!-- Header -->
        <div class="text-center mb-4">
          <span class="text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full ${gradeBadges[result.wonItem.grade] || 'bg-gray-800 text-white'}">
            🎉 ${result.wonItem.grade} GRADE 획득!
          </span>
          <h2 class="text-xl font-black text-gray-900 mt-2">축하합니다! 실물 상품 당첨</h2>
        </div>

        <!-- 1. Won Physical Item Card -->
        <div class="bg-gradient-to-b from-amber-50/60 to-orange-50/30 border-2 border-amber-300 rounded-2xl p-4 text-center mb-4 shadow-sm relative overflow-hidden">
          <div class="w-28 h-28 mx-auto mb-3 relative">
            <img src="${result.wonItem.image}" class="w-full h-full object-cover rounded-xl shadow-md border border-amber-200" alt="${result.wonItem.name}">
          </div>
          <h3 class="font-extrabold text-base text-gray-900 mb-1 leading-snug">${result.wonItem.name}</h3>
          <div class="flex items-center justify-center gap-2 text-xs">
            <span class="text-gray-500">소비자가: <strong class="text-gray-900">₩${result.wonItem.retailPrice.toLocaleString()}원</strong></span>
            <span class="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-md">실물 100% 지급</span>
          </div>
        </div>

        <!-- 2. Bonus Golden Raffle Tickets Earned -->
        <div class="ticket-stamp-anim bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-amber-950 rounded-2xl p-4 mb-5 shadow-lg border border-amber-300 text-left">
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-1.5 font-black text-sm">
              <span class="material-symbols-outlined text-lg">confirmation_number</span>
              <span>골든 티켓 +${result.earnedGoldenTickets}장 적립 완료!</span>
            </div>
            <span class="text-xs font-black bg-amber-950 text-amber-300 px-2.5 py-0.5 rounded-full">
              보유 티켓: ${result.totalGoldenTickets}장
            </span>
          </div>
          <p class="text-[11px] text-amber-950/80 leading-relaxed">
            적립된 골든 티켓은 아이폰 16 Pro, PS5 Pro 등 <strong>원하는 스페셜 상품에 자유롭게 분배하여 응모</strong>할 수 있습니다!
          </p>
        </div>

        <!-- 3. Immediate Action Choice -->
        <div class="space-y-2">
          <button onclick="window.__openVaultItemShipping('${result.vaultRecord.id}')" class="w-full py-3.5 bg-primary text-white font-extrabold rounded-2xl shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined">local_shipping</span>
            내 보관함에서 배송 신청하기
          </button>
          
          <button onclick="window.__quickConvertPoints('${result.vaultRecord.id}')" class="w-full py-3 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-2xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 text-xs">
            <span class="material-symbols-outlined text-base">swap_horiz</span>
            80% 포인트로 즉시 전환 (+₩${result.vaultRecord.refundPoints.toLocaleString()}P 환급)
          </button>

          <button onclick="window.__closeStageModal()" class="w-full py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl text-xs hover:bg-gray-200 transition-colors">
            보관함에 보관하고 계속 둘러보기
          </button>
        </div>
      </div>`;
  }, 1600);
}

// Global Handlers
window.__showProbModal = (boxId) => showProbabilityModal(boxId);
window.__closeProbModal = () => {
  const modal = document.getElementById('prob-modal');
  if (modal) modal.remove();
};

window.__startUnboxing = (boxId) => startUnboxingFlow(boxId);
window.__closeConfirmModal = () => {
  const modal = document.getElementById('unboxing-confirm-modal');
  if (modal) modal.remove();
};

window.__openDirectPaymentModal = (tierId, amount) => openDirectPaymentModal(tierId, amount);
window.__closeDirectPayModal = () => {
  const modal = document.getElementById('direct-pay-modal');
  if (modal) modal.remove();
};

window.__processDirectPayment = async (tierId, amount, method) => {
  if (!requireLogin()) return;
  const tiers = getRandomBoxTiers();
  const tier = tiers.find(b => b.id === tierId);
  const tierName = tier ? tier.name : '럭키박스';
  
  const authUser = getCurrentAuthUser();
  const userId = authUser.uid;
  const userEmail = authUser.email;

  if (method === 'toss') {
    try {
      const modal = document.getElementById('direct-pay-modal');
      if (modal) modal.remove();

      // Store pending unboxing box ID
      sessionStorage.setItem('pending_unboxing_box_id', tierId);

      // Invoke real Toss Payments checkout popup / standard SDK
      await requestTossPayment({
        productId: tierId,
        productName: tierName,
        amount: Number(amount),
        userId: userId,
        userEmail: userEmail
      });
    } catch (err) {
      console.error('[Toss] Payment request error:', err);
      alert(`토스 결제창 호출 실패: ${err.message || err}`);
    }
  } else if (method === 'paypal') {
    const modalContent = document.querySelector('#direct-pay-modal .space-y-2\\.5');
    if (!modalContent) return;

    const usdAmount = Number((amount / 1350).toFixed(2)) || 3.70;

    modalContent.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <span>결제 금액 (USD 환산)</span>
          <span class="font-bold text-amber-950 font-mono text-sm">$${usdAmount} USD (₩${Number(amount).toLocaleString()}원)</span>
        </div>
        <div id="paypal-button-container" class="min-h-[140px] flex items-center justify-center">
          <div class="text-xs text-gray-500 animate-pulse">PayPal 결제창 로딩 중...</div>
        </div>
        <button onclick="window.__openDirectPaymentModal('${tierId}', ${amount})" class="w-full py-2 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          다른 결제 수단 선택
        </button>
      </div>
    `;

    setTimeout(() => {
      renderPayPalButtons('paypal-button-container', {
        productId: tierId,
        amount: usdAmount,
        orderName: `${tierName} (LuckyPick)`,
        onSuccess: (details) => {
          console.log('[PayPal] Payment success, triggering unbox:', details);
          const modal = document.getElementById('direct-pay-modal');
          if (modal) modal.remove();
          executeUnboxingAnimation(tierId);
        },
        onError: (err) => {
          console.error('[PayPal] Payment error:', err);
          alert(`PayPal 결제 처리 중 오류가 발생했습니다: ${err.message || err}`);
        },
        onCancel: () => {
          console.log('[PayPal] Payment cancelled by user');
        }
      });
    }, 100);
  }
};

window.__executeOpenBoxWithPoints = (boxId) => {
  if (!requireLogin()) return;
  const tiers = getRandomBoxTiers();
  const tier = tiers.find(b => b.id === boxId);
  const currentPts = getUserPoints();
  if (currentPts < tier.price) {
    alert('포인트가 부족합니다.');
    return;
  }
  setUserPoints(currentPts - tier.price);
  executeUnboxingAnimation(boxId);
};

window.__closeStageModal = () => {
  const modal = document.getElementById('unboxing-stage-modal');
  if (modal) modal.remove();
  window.dispatchEvent(new CustomEvent('vaultUpdated'));
};

window.__quickConvertPoints = (vaultId) => {
  if (!requireLogin()) return;
  try {
    const res = convertVaultItemToPoints(vaultId);
    alert(`🎉 [${res.item.title}] 상품이 ₩${res.addedPoints.toLocaleString()}P 로 즉시 전환되었습니다!\n현재 보유 포인트: ₩${res.newPoints.toLocaleString()}P`);
    window.__closeStageModal();
    window.location.hash = '#profile';
  } catch (err) {
    alert(err.message);
  }
};

window.__openVaultItemShipping = (vaultId) => {
  window.__closeStageModal();
  window.location.hash = `#profile`;
};
