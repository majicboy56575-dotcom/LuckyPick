// ============================================
// LuckyPick - History Page (마감 상품 기록)
// ============================================
import { t } from '../i18n.js';
import { getClosedProducts } from '../services/firestore.js';

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
          ${product.participants.map((p, i) => {
            const gradients = ['from-primary/20 to-surface-variant text-primary', 'from-secondary/20 to-surface-variant text-secondary', 'from-tertiary/20 to-surface-variant text-tertiary'];
            const gradient = gradients[i % 3];
            return `
              <div class="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br ${gradient} border border-outline-variant/30 flex items-center justify-center font-label-caps">${p.initial}</div>
                  <div>
                    <p class="font-body-md text-body-md font-semibold">${p.name}</p>
                    <p class="text-[12px] text-on-surface-variant">${p.email}</p>
                  </div>
                </div>
                <span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors filled">verified</span>
              </div>`;
          }).join('')}
        </div>
        <div class="p-6 bg-surface-bright border-t border-outline-variant/30 text-center">
          <button class="w-full py-3 bg-primary text-on-primary rounded-full font-bold transition-transform active:scale-95 shadow-md" onclick="window.__closeHistoryModal()">${t('close')}</button>
        </div>
      </div>
    </div>`;
}

function renderHistoryCard(product) {
  const statusBadge = product.status === 'shipped'
    ? `<span class="px-3 py-1 rounded-full bg-secondary text-on-secondary font-label-caps text-label-caps">${t('shipped')}</span>`
    : `<span class="px-3 py-1 rounded-full bg-outline text-white font-label-caps text-label-caps">${t('closed')}</span>`;

  return `
    <div class="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm flex flex-col group transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      <div class="relative h-64 overflow-hidden">
        <div class="absolute top-4 left-4 z-10">${statusBadge}</div>
        <div class="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="background-image: url('${product.imageUrl}')"></div>
        <div class="absolute bottom-0 w-full bg-primary/90 text-on-primary py-3 px-4 glass-panel">
          <div class="flex items-center justify-between">
            <span class="font-label-caps text-label-caps opacity-80 uppercase">${t('winnerAnnouncement')}</span>
            <span class="font-timer-numeric text-timer-numeric">${product.ticketNumber}</span>
          </div>
        </div>
      </div>
      <div class="p-6 flex-grow flex flex-col">
        <h3 class="font-headline-sm text-headline-sm mb-4">${product.title}</h3>
        <div class="bg-surface-container-low rounded-lg p-4 mb-6 border border-primary/10">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
              <span class="material-symbols-outlined text-on-primary-container text-[18px] filled">emoji_events</span>
            </div>
            <span class="font-headline-sm text-[16px] text-primary">${t('winnerIdentified')}</span>
          </div>
          <p class="font-body-md text-body-md text-on-surface leading-relaxed">
            ${product.winner.name}, ${product.winner.email}, ${product.winner.phone}
          </p>
        </div>
        <div class="mt-auto flex items-center justify-between">
          <div class="flex items-center gap-2 text-on-surface-variant">
            <span class="material-symbols-outlined text-[20px]">groups</span>
            <span class="font-label-caps text-label-caps">${product.totalParticipants.toLocaleString()} ${t('participants')}</span>
          </div>
          <button class="flex items-center gap-1 text-primary font-label-caps text-label-caps hover:underline cursor-pointer" onclick="window.__showHistoryParticipants('${product.id}')">
            ${t('viewList')}
            <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>`;
}

export function render() {
  const products = getClosedProducts();

  const html = `
    <main class="pt-24 pb-32 max-w-[1200px] mx-auto px-container-margin page-enter">
      <div class="mb-stack-lg">
        <h1 class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">${t('historyTitle')}</h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant">${t('historySubtitle')}</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        ${products.map(p => renderHistoryCard(p)).join('')}
      </div>
    </main>
    <div id="history-modal-container"></div>`;

  window.__showHistoryParticipants = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    document.getElementById('history-modal-container').innerHTML = renderParticipantsModal(product);
  };
  window.__closeHistoryModal = () => {
    document.getElementById('history-modal-container').innerHTML = '';
  };

  return html;
}

export function cleanup() {
  delete window.__showHistoryParticipants;
  delete window.__closeHistoryModal;
}
