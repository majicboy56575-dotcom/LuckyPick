// ============================================
// LuckyPick - History Page (마감 상품 기록)
// Reads from Firestore closed_products and Closed Super Raffles
// ============================================
import { t } from '../i18n.js';
import { getClosedProducts, getAllShippingInfos } from '../services/firestore.js';
import { getSuperRaffles } from '../services/randombox.js';

function renderParticipantsModal(product) {
  return `
    <div class="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" id="history-modal" onclick="if(event.target===this)window.__closeHistoryModal()">
      <div class="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[707px] transform transition-all duration-300 scale-100 opacity-100">
        <div class="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
          <div>
            <h2 class="font-headline-sm text-headline-sm">${t('participantsList')}</h2>
            <p class="font-label-caps text-label-caps text-on-surface-variant mt-1">${product.title}</p>
          </div>
          <button class="w-10 h-10 rounded-full hover:bg-surface-variant/30 flex items-center justify-center" onclick="window.__closeHistoryModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="overflow-y-auto p-4 space-y-2">
          ${(product.participants || []).map((p, i) => {
            const gradients = ['from-primary/20 to-surface-variant text-primary', 'from-secondary/20 to-surface-variant text-secondary', 'from-tertiary/20 to-surface-variant text-tertiary'];
            const gradient = gradients[i % 3];
            return `
              <div class="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br ${gradient} border border-outline-variant/30 flex items-center justify-center font-label-caps">${p.initial || 'U'}</div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <p class="font-body-md text-body-md font-semibold">${p.name}</p>
                      ${p.groupNumber ? `<span class="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">그룹 ${p.groupNumber}</span>` : ''}
                    </div>
                    <p class="text-[12px] text-on-surface-variant font-mono">${p.email}</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="font-mono text-xs font-bold text-primary">${p.ticketNumber || ''}</span>
                  <span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors filled text-sm block">verified</span>
                </div>
              </div>`;
          }).join('')}
        </div>
        <div class="p-6 bg-surface-bright border-t border-outline-variant/30 text-center">
          <button class="w-full py-3 bg-primary text-on-primary rounded-full font-bold transition-transform active:scale-95 shadow-md" onclick="window.__closeHistoryModal()">${t('close')}</button>
        </div>
      </div>
    </div>`;
}

function renderWinnersModal(product, winners, shippingInfos) {
  return `
    <div class="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" id="history-modal" onclick="if(event.target===this)window.__closeHistoryModal()">
      <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transform transition-all duration-300 scale-100 opacity-100">
        <div class="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-tertiary text-2xl">emoji_events</span>
            </div>
            <div>
              <h2 class="font-headline-sm text-headline-sm text-on-surface">${t('winnersListLabel')} (${winners.length}${t('personUnit')})</h2>
              <p class="font-label-caps text-label-caps text-on-surface-variant mt-0.5">${product.title}</p>
            </div>
          </div>
          <button class="w-10 h-10 rounded-full hover:bg-surface-variant/30 flex items-center justify-center text-on-surface-variant" onclick="window.__closeHistoryModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-4 bg-surface-container-low/40 border-b border-outline-variant/20">
          <input type="text" id="winner-search-input" placeholder="그룹 번호, 이름, 티켓 검색..." class="w-full bg-white border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" oninput="window.__filterWinners()">
        </div>

        <div class="overflow-y-auto p-4 space-y-2.5 flex-1" id="winner-modal-list">
          ${winners.map(w => {
            const hasShipping = shippingInfos.some(s => s.productId === product.id && s.winnerUid === w.uid);
            return `
              <div class="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/30 bg-surface-bright hover:border-primary/40 transition-colors group winner-item" data-search="${w.groupNumber} ${w.name} ${w.ticketNumber} ${w.email}">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-tertiary-container/30 text-tertiary flex items-center justify-center font-bold text-xs shrink-0">
                    G${w.groupNumber}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="font-bold text-sm text-on-surface">${w.name}</p>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${hasShipping ? 'bg-tertiary-container/20 text-tertiary' : 'bg-surface-variant text-on-surface-variant'}">
                        ${hasShipping ? t('shippedComplete') : t('shippingNotSubmitted')}
                      </span>
                    </div>
                    <p class="text-xs text-on-surface-variant font-mono mt-0.5">${w.email}</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="font-timer-numeric font-bold text-primary text-sm">${w.ticketNumber || ''}</span>
                  <span class="block text-[10px] text-on-surface-variant font-semibold mt-0.5">${t('groupLabel')} ${w.groupNumber} ${t('winnerBadge')}</span>
                </div>
              </div>`;
          }).join('')}
        </div>

        <div class="p-4 bg-surface-bright border-t border-outline-variant/30 text-center">
          <button class="w-full py-3 bg-primary text-on-primary rounded-full font-bold transition-transform active:scale-95 shadow-md" onclick="window.__closeHistoryModal()">${t('close')}</button>
        </div>
      </div>
    </div>`;
}

function renderHistoryCard(product, shippingInfos = []) {
  const shipInfo = shippingInfos.find(s => s.productId === product.id);
  let statusBadge = `<span class="px-3 py-1 rounded-full bg-outline text-white font-label-caps text-label-caps">${t('closed')}</span>`;
  
  if (product.isSuperRaffle) {
    statusBadge = `<span class="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] uppercase shadow-xs">스페셜 래플 마감</span>`;
  } else if (shipInfo) {
    if (shipInfo.status === 'shipped') {
      statusBadge = `<span class="px-3 py-1 rounded-full bg-secondary text-on-secondary font-label-caps text-label-caps">${t('shippedComplete')}</span>`;
    } else {
      statusBadge = `<span class="px-3 py-1 rounded-full bg-primary text-on-primary font-label-caps text-label-caps">${t('shippingPending')}</span>`;
    }
  } else {
    statusBadge = `<span class="px-3 py-1 rounded-full bg-outline text-white font-label-caps text-label-caps">${t('shippingNotSubmitted')}</span>`;
  }

  const winners = product.winners && product.winners.length > 0
    ? product.winners
    : (product.winner && product.winner.uid ? [{ ...product.winner, groupNumber: 1, ticketNumber: product.ticketNumber }] : []);
  
  const isMultiWinner = winners.length > 1;
  const refundedCount = product.refundCount || product.refundedParticipants?.length || 0;

  return `
    <div class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col group transition-all duration-300 hover:shadow-xl hover:border-primary/20">
      <div class="relative h-64 overflow-hidden">
        <div class="absolute top-4 left-4 z-10">${statusBadge}</div>
        <div class="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style="background-image: url('${product.imageUrl}')"></div>
        <div class="absolute bottom-0 w-full bg-slate-900/90 text-white py-3 px-4 glass-panel border-t border-white/10">
          <div class="flex items-center justify-between">
            <span class="font-label-caps text-label-caps opacity-80 uppercase text-amber-300">${isMultiWinner ? t('winnersListLabel') : t('winnerAnnouncement')}</span>
            <span class="font-timer-numeric text-timer-numeric font-bold text-white">
              ${isMultiWinner ? `${t('groupLabel')} 1~${winners.length} (${winners.length}${t('personUnit')} 당첨)` : (winners[0]?.ticketNumber || product.ticketNumber || '#---')}
            </span>
          </div>
        </div>
      </div>

      <div class="p-6 flex-grow flex flex-col justify-between space-y-4">
        <div>
          <h3 class="font-headline-sm text-lg font-bold text-gray-900 mb-1 leading-snug">${product.title}</h3>
          ${product.retailPrice ? `<p class="text-xs text-gray-500 font-mono mb-3">소비자가: ₩${product.retailPrice.toLocaleString()}원</p>` : ''}

          ${isMultiWinner ? `
            <!-- Multi-Winner Group Card -->
            <div class="bg-surface-container-low rounded-xl p-4 mb-3 border border-tertiary/20">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-tertiary/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-tertiary text-[16px]">emoji_events</span>
                  </div>
                  <span class="font-headline-sm text-xs text-on-surface font-bold">${t('winnersListLabel')} (${winners.length}${t('personUnit')})</span>
                </div>
                <button class="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5" onclick="window.__showHistoryWinners('${product.id}')">
                  ${t('viewAllInventory')} (${winners.length})
                  <span class="material-symbols-outlined text-[14px]">open_in_new</span>
                </button>
              </div>

              <!-- Scrollable Group Winners List -->
              <div class="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                ${winners.map(w => `
                  <div class="p-2 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-between shadow-2xs text-xs">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-[9px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded shrink-0">
                        그룹 ${w.groupNumber}
                      </span>
                      <div class="min-w-0">
                        <p class="font-bold text-xs text-gray-900 truncate">${w.name}</p>
                        <p class="text-[10px] text-gray-400 font-mono truncate">${w.email}</p>
                      </div>
                    </div>
                    <span class="font-mono text-xs font-bold text-primary shrink-0 ml-2">${w.ticketNumber || ''}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : winners.length === 1 ? `
            <!-- Single Winner View -->
            <div class="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 mb-3 text-xs">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-1.5 font-bold text-amber-950">
                  <span class="material-symbols-outlined text-amber-600 text-base">emoji_events</span>
                  <span>1등 당첨: ${winners[0].name} 님</span>
                </div>
                <span class="font-mono font-bold text-primary">${winners[0].ticketNumber || ''}</span>
              </div>
              <p class="text-[11px] text-amber-800 font-mono">${winners[0].email || ''}</p>
            </div>
          ` : `
            <div class="bg-slate-50 rounded-xl p-3 mb-3 text-xs text-slate-500">
              추첨 당첨자 확인 중
            </div>
          `}

          ${refundedCount > 0 ? `
            <!-- Refunded Group Participants Notice -->
            <div class="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
              <span class="text-amber-900 font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined text-sm text-amber-600">undo</span>
                인원 미달 그룹 (${refundedCount}명)
              </span>
              <span class="font-bold text-amber-800">골든티켓 100% 자동 환불</span>
            </div>
          ` : ''}
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100">
          <div class="flex items-center gap-1.5 text-gray-500 text-xs">
            <span class="material-symbols-outlined text-base">groups</span>
            <span class="font-bold">${(product.totalParticipants || 0).toLocaleString()}명 참여</span>
          </div>
          <button class="flex items-center gap-1 text-primary font-bold text-xs hover:underline cursor-pointer" onclick="window.__showHistoryParticipants('${product.id}')">
            <span>참여자 순번 명단</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>`;
}

export function render() {
  const firestoreClosedProducts = getClosedProducts() || [];
  const shippingInfos = getAllShippingInfos() || [];

  // Convert closed super raffles into history product items
  const closedRaffles = getSuperRaffles()
    .filter(r => r.status === 'closed')
    .map(r => {
      const entries = r.entries || [];
      const participants = entries.map(e => ({
        name: e.userName,
        email: e.userEmail,
        initial: (e.userName || 'U').charAt(0),
        ticketNumber: e.ticketNumber,
        groupNumber: Math.floor((e.slotIndex - 1) / (r.unitSize || 200)) + 1
      }));

      const winners = (r.winners || []).map(w => ({
        uid: w.winner?.userId || '',
        name: w.winner?.userName || '당첨자',
        email: w.winner?.userEmail || '',
        ticketNumber: w.winner?.ticketNumber || '',
        groupNumber: w.groupNumber
      }));

      return {
        id: r.id,
        title: r.title,
        imageUrl: r.imageUrl,
        retailPrice: r.retailPrice,
        totalParticipants: entries.length,
        closedAt: r.closedAt || Date.now(),
        winners: winners,
        winner: winners[0] || null,
        ticketNumber: winners[0]?.ticketNumber || '',
        participants: participants,
        isSuperRaffle: true,
        refundCount: r.refundCount || 0,
        unitSize: r.unitSize || 200
      };
    });

  // Merge closed raffles with firestore closed products and sort by closedAt descending
  const products = [...closedRaffles, ...firestoreClosedProducts].sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));

  const html = `
    <main class="pt-24 pb-32 max-w-[1200px] mx-auto px-container-margin page-enter">
      <div class="mb-stack-lg">
        <h1 class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">${t('historyTitle')}</h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant">${t('historySubtitle')}</p>
      </div>
      ${products.length === 0 ? `
        <div class="glass-card rounded-3xl p-12 text-center bg-white border border-slate-200">
          <span class="material-symbols-outlined text-slate-400 text-6xl mb-4">history</span>
          <h3 class="font-headline-sm text-lg text-gray-900 font-bold mb-2">${t('noClosedProducts')}</h3>
          <p class="text-xs text-gray-500">${t('noClosedProductsDesc')}</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${products.map(p => renderHistoryCard(p, shippingInfos)).join('')}
        </div>
      `}
    </main>
    <div id="history-modal-container"></div>`;

  window.__showHistoryParticipants = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    document.getElementById('history-modal-container').innerHTML = renderParticipantsModal(product);
  };

  window.__showHistoryWinners = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const winners = product.winners || [];
    document.getElementById('history-modal-container').innerHTML = renderWinnersModal(product, winners, shippingInfos);
  };

  window.__filterWinners = () => {
    const input = document.getElementById('winner-search-input');
    const term = (input?.value || '').toLowerCase().trim();
    const items = document.querySelectorAll('.winner-item');
    items.forEach(el => {
      const data = el.getAttribute('data-search') || '';
      if (!term || data.toLowerCase().includes(term)) {
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    });
  };

  window.__closeHistoryModal = () => {
    document.getElementById('history-modal-container').innerHTML = '';
  };

  return html;
}

export function cleanup() {
  delete window.__showHistoryParticipants;
  delete window.__showHistoryWinners;
  delete window.__filterWinners;
  delete window.__closeHistoryModal;
}

