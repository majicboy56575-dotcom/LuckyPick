// ============================================
// LuckyPick - Fixed-Price Product Purchase & Checkout Modal
// 100% Zero-Probability Direct Purchase + Free Golden Tickets
// ============================================
import { 
  getRandomBoxTiers, 
  getAllStoreProducts,
  getStoreProductById,
  purchaseFixedPriceProduct,
  convertVaultItemToPoints, 
  getUserPoints, 
  setUserPoints, 
  getAvailableGoldenTicketsCount,
  getUserVault,
  openLuckyBoxServer,
  purchaseProductServer,
  convertVaultItemToPointsServer
} from './randombox.js';
import { saveUserDocData } from './firestore.js';
import { requestDanalCardPayment, requestDanalPhonePayment } from './payment.js';
import { getCurrentAuthUser, requireLogin } from './auth.js';

// Open Fixed-Price Product Purchase Modal
export function openProductPurchaseModal(itemId, tierId) {
  if (!requireLogin('상품 구매 및 사은 골든티켓 적립은 로그인 후 이용하실 수 있습니다.')) return;

  const tiers = getRandomBoxTiers();
  let tier = tiers.find(b => b.id === tierId);
  let item = null;

  if (tier) {
    item = (tier.items || []).find(it => it.id === itemId);
  } else {
    for (const t of tiers) {
      const it = (t.items || []).find(i => i.id === itemId);
      if (it) {
        tier = t;
        item = it;
        break;
      }
    }
  }

  if (!item) {
    const all = getAllStoreProducts();
    item = all.find(p => p.id === itemId) || all[0];
    tier = tiers.find(t => t.id === item?.tierId) || tiers[0];
  }

  const currentPts = getUserPoints();
  const price = Number(item.retailPrice || tier.price || 5000);
  const earnedTickets = Number(tier.goldenTickets) || (price >= 20000 ? 11 : price >= 10000 ? 5 : 2);
  const hasEnoughPoints = currentPts >= price;

  const modalHtml = `
    <div class="fixed inset-0 z-[90] flex items-center justify-center p-4 modal-backdrop" id="purchase-confirm-modal" onclick="if(event.target===this)window.__closePurchaseModal()">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
        <!-- Header -->
        <div class="p-5 bg-gradient-to-r ${tier.color || 'from-slate-900 to-indigo-950'} text-white flex justify-between items-center">
          <div>
            <span class="text-[10px] font-black bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              100% 정품 실물 정가 구매
            </span>
            <h3 class="text-lg font-black mt-1">상품 주문 / 결제</h3>
          </div>
          <button onclick="window.__closePurchaseModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div class="p-6 space-y-5">
          <!-- Product Preview Card -->
          <div class="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div class="w-20 h-20 rounded-xl bg-white border border-slate-200 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
              <img src="${item.image || 'assets/products/phonestand_metal.jpg'}" alt="${item.name}" onerror="this.onerror=null; this.src='assets/products/phonestand_metal.jpg';" class="w-full h-full object-contain">
            </div>
            <div class="flex-grow min-w-0">
              <span class="text-[10px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded">${tier.name}</span>
              <h4 class="font-extrabold text-sm text-gray-900 mt-1 line-clamp-2 leading-snug">${item.name}</h4>
              <div class="flex items-baseline gap-1 mt-1">
                <span class="text-xs text-gray-400 font-bold">정가:</span>
                <span class="text-base font-black text-gray-900 font-mono">₩${price.toLocaleString()}원</span>
              </div>
            </div>
          </div>

          <!-- Bonus Golden Ticket Promotion Box -->
          <div class="p-3.5 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-300 rounded-2xl flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-xs">
                🎫
              </span>
              <div>
                <p class="font-bold text-amber-950">구매 고객 사은 골든티켓 무료 증정</p>
                <p class="text-[11px] text-amber-800">구매 즉시 <strong>골든티켓 +${earnedTickets}장</strong>이 적립됩니다 (스페셜 래플 응모권)</p>
              </div>
            </div>
            <span class="text-xs font-black text-amber-600 font-mono">+${earnedTickets}장</span>
          </div>

          <!-- Payment Summary -->
          <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-gray-500">주문 금액</span>
              <span class="font-black text-gray-900 text-sm font-mono">₩${price.toLocaleString()}원</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500">배송 보관 방식</span>
              <span class="font-bold text-emerald-700">결제 즉시 내 보관함에 안전 보관 (언제든 배송 신청)</span>
            </div>
            <div class="flex justify-between items-center border-t border-slate-200 pt-2">
              <span class="text-gray-500">내 보유 포인트</span>
              <span class="font-bold ${hasEnoughPoints ? 'text-gray-900' : 'text-red-500'} font-mono">
                ₩${currentPts.toLocaleString()} P ${!hasEnoughPoints ? '(부족)' : ''}
              </span>
            </div>
          </div>

          <!-- Payment Options -->
          <div class="space-y-2.5">
            ${hasEnoughPoints ? `
              <button onclick="window.__executePurchaseWithPoints('${item.id}', '${tier.id}')" class="w-full py-4 bg-gradient-to-r from-primary to-indigo-700 text-white font-black rounded-2xl shadow-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-xl">shopping_cart_checkout</span>
                <span>보유 포인트로 바로 결제 (₩${price.toLocaleString()}P)</span>
              </button>
            ` : `
              <div class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-left">
                ⚠️ 보유 포인트가 부족합니다. 아래 결제수단으로 즉시 결제하실 수 있습니다.
              </div>
            `}

            <button onclick="window.__openDirectPaymentModal('${tier.id}', ${price}, '${item.id}')" class="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 text-xs">
              <span class="material-symbols-outlined text-sm">credit_card</span>
              <span>신용카드 / 휴대폰 결제로 즉시 구매 (다날)</span>
            </button>
          </div>
        </div>

        <div class="p-3.5 bg-gray-50 border-t border-gray-100 text-center">
          <button onclick="window.__closePurchaseModal()" class="text-xs font-bold text-gray-400 hover:text-gray-600">
            취소 및 닫기
          </button>
        </div>
      </div>
    </div>`;

  const existing = document.getElementById('purchase-confirm-modal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Direct PG Payment Modal (Credit Card / Phone)
export function openDirectPaymentModal(tierId, amount, itemId = null) {
  if (!requireLogin()) return;
  const confirmModal = document.getElementById('purchase-confirm-modal') || document.getElementById('unboxing-confirm-modal');
  if (confirmModal) confirmModal.remove();

  const modalHtml = `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop" id="direct-pay-modal" onclick="if(event.target===this)window.__closeDirectPayModal()">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div class="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 class="font-bold text-lg">결제 수단 선택</h3>
            <p class="text-xs text-slate-400">결제 완료 즉시 상품이 내 보관함에 보관되고 골든티켓이 지급됩니다</p>
          </div>
          <button onclick="window.__closeDirectPayModal()" class="text-slate-400 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
            <span class="text-xs font-bold text-gray-500">결제 대상 금액</span>
            <span class="font-black text-2xl text-primary font-mono">₩${Number(amount).toLocaleString()}원</span>
          </div>

          <div class="space-y-2.5">
            <!-- 1. Credit Card / KakaoPay / EasyPay -->
            <button onclick="window.__processDirectPayment('${tierId}', ${amount}, 'danal_card', '${itemId || ''}')" class="w-full p-4 bg-gradient-to-r from-red-50/70 to-amber-50/70 hover:from-red-100 hover:to-amber-100 border border-red-200/80 rounded-2xl flex items-center justify-between transition-all text-left group shadow-xs">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <span class="material-symbols-outlined text-xl">credit_card</span>
                </span>
                <div>
                  <div class="flex items-center gap-1.5">
                    <h4 class="font-bold text-sm text-gray-900 group-hover:text-red-600 transition-colors">신용·체크카드 / 간편결제</h4>
                    <span class="text-[10px] font-black bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded font-mono shadow-2xs">카카오페이</span>
                  </div>
                  <p class="text-[11px] text-gray-500">모든 카드사, 카카오페이, 네이버페이, 삼성페이</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-gray-400 group-hover:text-red-600 transition-colors">chevron_right</span>
            </button>

            <!-- 2. Phone Micro-payment -->
            <button onclick="window.__processDirectPayment('${tierId}', ${amount}, 'danal_phone', '${itemId || ''}')" class="w-full p-4 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl flex items-center justify-between transition-all text-left group shadow-xs">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <span class="material-symbols-outlined text-xl">smartphone</span>
                </span>
                <div>
                  <div class="flex items-center gap-1.5">
                    <h4 class="font-bold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors">휴대폰 소액결제</h4>
                    <span class="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">통신 3사</span>
                  </div>
                  <p class="text-[11px] text-gray-500">SKT, KT, LGU+, 알뜰폰 통신요금 합산 청구</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-gray-400 group-hover:text-emerald-700 transition-colors">chevron_right</span>
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

// Show Purchase Success Modal
export function showPurchaseSuccessModal(purchasedItem, earnedTickets, totalTickets, newPoints) {
  const modalHtml = `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in" id="purchase-success-modal">
      <div class="relative z-10 text-center text-white max-w-md w-full animate-in zoom-in-95">
        <div class="bg-white text-gray-900 rounded-3xl p-6 shadow-2xl border-2 border-amber-400 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <!-- Header -->
          <div class="text-center mb-4">
            <span class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500 text-white shadow-sm">
              ✓ 100% 정가 상품 구매 완료
            </span>
            <h2 class="text-xl font-black text-gray-900 mt-2">구매가 성공적으로 완료되었습니다!</h2>
          </div>

          <!-- Purchased Item Card -->
          <div class="bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-4 text-center mb-4 shadow-sm relative overflow-hidden">
            <div class="w-24 h-24 mx-auto mb-3 relative flex items-center justify-center bg-white rounded-xl p-2 border border-slate-200 shadow-xs">
              <img src="${purchasedItem.imageUrl || purchasedItem.image || 'assets/products/phonestand_metal.jpg'}" class="w-full h-full object-contain" alt="${purchasedItem.title || purchasedItem.name}">
            </div>
            <h3 class="font-extrabold text-base text-gray-900 mb-1 leading-snug">${purchasedItem.title || purchasedItem.name}</h3>
            <div class="flex items-center justify-center gap-2 text-xs">
              <span class="text-gray-500">결제 금액: <strong class="text-gray-900">₩${(purchasedItem.retailPrice || 0).toLocaleString()}원</strong></span>
              <span class="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">내 보관함 적재</span>
            </div>
          </div>

          <!-- Bonus Golden Raffle Tickets Earned -->
          <div class="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-amber-950 rounded-2xl p-4 mb-5 shadow-lg border border-amber-300 text-left">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-1.5 font-black text-sm">
                <span class="material-symbols-outlined text-lg">confirmation_number</span>
                <span>골든 티켓 +${earnedTickets}장 사은 지급 완료!</span>
              </div>
              <span class="text-xs font-black bg-amber-950 text-amber-300 px-2.5 py-0.5 rounded-full">
                총 보유: ${totalTickets}장
              </span>
            </div>
            <p class="text-[11px] text-amber-950/80 leading-relaxed">
              사은 지급된 골든티켓으로 <strong>아이폰 16 Pro 등 스페셜 사은품에 즉시 무료 응모</strong>하실 수 있습니다!
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-2">
            <button onclick="window.__closeSuccessModal(); window.location.hash='#'; window.scrollTo({top: 400, behavior: 'smooth'});" class="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm">
              <span class="material-symbols-outlined text-lg">military_tech</span>
              <span>스페셜 래플(아이폰 16 Pro 등) 응모하기 ↗</span>
            </button>
            
            <button onclick="window.__closeSuccessModal(); window.location.hash='#profile';" class="w-full py-3 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 text-xs">
              <span class="material-symbols-outlined text-base">local_shipping</span>
              <span>내 보관함(배송 신청) 확인하기</span>
            </button>

            <button onclick="window.__closeSuccessModal()" class="w-full py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl text-xs hover:bg-gray-200 transition-colors">
              계속 쇼핑하기
            </button>
          </div>
        </div>
      </div>
    </div>`;

  const existing = document.getElementById('purchase-success-modal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Global Handlers
window.__openProductPurchase = (itemId, tierId) => openProductPurchaseModal(itemId, tierId);

window.__startUnboxing = (boxId) => {
  const tiers = getRandomBoxTiers();
  const tier = tiers.find(t => t.id === boxId) || tiers[0];
  const firstItem = (tier.items && tier.items[0]) || null;
  openProductPurchaseModal(firstItem?.id, tier.id);
};

window.__closePurchaseModal = () => {
  const modal = document.getElementById('purchase-confirm-modal');
  if (modal) modal.remove();
};

window.__closeConfirmModal = () => window.__closePurchaseModal();

window.__openDirectPaymentModal = (tierId, amount, itemId) => openDirectPaymentModal(tierId, amount, itemId);
window.__closeDirectPayModal = () => {
  const modal = document.getElementById('direct-pay-modal');
  if (modal) modal.remove();
};

window.__closeSuccessModal = () => {
  const modal = document.getElementById('purchase-success-modal');
  if (modal) modal.remove();
  window.dispatchEvent(new CustomEvent('vaultUpdated'));
  window.dispatchEvent(new CustomEvent('userDataChanged'));
  window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
};

window.__executePurchaseWithPoints = async (itemId, tierId) => {
  if (!requireLogin()) return;
  const confirmModal = document.getElementById('purchase-confirm-modal');
  if (confirmModal) confirmModal.remove();

  try {
    const result = await purchaseFixedPriceProduct(itemId, tierId, 'points');
    const item = result.purchasedItem || result.wonItem;
    const earnedTickets = result.earnedTickets || (item.retailPrice >= 20000 ? 11 : item.retailPrice >= 10000 ? 5 : 2);
    const totalTickets = result.newTickets || getAvailableGoldenTicketsCount();

    showPurchaseSuccessModal(item, earnedTickets, totalTickets, result.newPoints);
  } catch (err) {
    alert(`구매 실패: ${err.message || '결제 중 오류가 발생했습니다.'}`);
  }
};

window.__processDirectPayment = async (tierId, amount, method, itemId) => {
  if (!requireLogin()) return;
  const tiers = getRandomBoxTiers();
  const tier = tiers.find(b => b.id === tierId);
  const tierName = tier ? tier.name : '상품 구매';

  const modalContainer = document.querySelector('#direct-pay-modal .space-y-2\\.5');
  const originalHtml = modalContainer ? modalContainer.innerHTML : '';

  const showLoading = (label) => {
    if (modalContainer) {
      modalContainer.innerHTML = `
        <div class="p-8 text-center space-y-4">
          <div class="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
          <div>
            <h4 class="font-extrabold text-base text-gray-900">${label}</h4>
            <p class="text-xs text-gray-500 mt-1">다날 보안 결제창을 안전하게 호출하고 있습니다...</p>
          </div>
        </div>
      `;
    }
  };

  const restoreModal = () => {
    if (modalContainer && originalHtml) {
      modalContainer.innerHTML = originalHtml;
    }
  };

  if (method === 'danal_card') {
    showLoading('신용·체크카드 / 간편결제 연결 중');
    try {
      await requestDanalCardPayment({
        amount: Number(amount),
        itemName: tierName,
        productId: tierId,
        metadata: { itemId }
      });
    } catch (err) {
      console.error('[DanalCard] Error:', err);
      restoreModal();
      alert(`다날 카드 결제 준비 실패: ${err.message || err}`);
    }
    return;
  }

  if (method === 'danal_phone') {
    showLoading('휴대폰 소액결제 연결 중');
    try {
      await requestDanalPhonePayment({
        amount: Number(amount),
        itemName: tierName,
        productId: tierId,
        metadata: { itemId }
      });
    } catch (err) {
      console.error('[DanalPhone] Error:', err);
      restoreModal();
      alert(`다날 휴대폰 결제 준비 실패: ${err.message || err}`);
    }
    return;
  }
};

// Legacy alias handlers for profile/vault
window.__quickConvertPoints = async (vaultId) => {
  if (!requireLogin()) return;
  try {
    const res = await convertVaultItemToPointsServer(vaultId);
    alert(`🎉 [${res.item?.title || res.item?.name || '상품'}] 상품이 ₩${res.addedPoints.toLocaleString()}P 로 즉시 전환되었습니다!\n현재 보유 포인트: ₩${res.newPoints.toLocaleString()}P`);

    const currentVault = getUserVault().filter(v => v.id !== vaultId);
    await saveUserDocData({
      vault: currentVault,
      points: res.newPoints
    });

    window.__closeSuccessModal();
    window.location.hash = '#profile';
    if (typeof window.__switchProfileTab === 'function') {
      window.__switchProfileTab('vault');
    }
  } catch (err) {
    alert(err.message || '포인트 전환 실패');
  }
};

window.__openVaultItemShipping = (vaultId) => {
  window.__closeSuccessModal();
  window.location.hash = `#profile`;
  if (typeof window.__switchProfileTab === 'function') {
    window.__switchProfileTab('vault');
  }
};

// Legacy compatibility export for app.js and router
export async function executeUnboxingAnimation(tierOrItemId, paymentMethod = 'points') {
  const all = getAllStoreProducts();
  const product = all.find(p => p.id === tierOrItemId) || all.find(p => p.tierId === tierOrItemId) || all[0];
  if (!product) return;

  if (paymentMethod === 'danal' || paymentMethod === 'danal_phone') {
    try {
      const res = await purchaseProductServer(product.id, product.tierId || 'tier_5k', paymentMethod);
      showPurchaseSuccessModal(res.item, res.tier, res.earnedTickets, res.newPoints, res.newGoldenTickets);
    } catch (err) {
      alert(`구매 처리 오류: ${err.message || err}`);
    }
  } else {
    openProductPurchaseModal(product.id, product.tierId);
  }
}
