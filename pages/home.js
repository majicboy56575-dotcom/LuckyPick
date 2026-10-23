// ============================================
// LuckyPick - Home Page (Fixed-Price Product Store & Multi-Group Golden Raffle Showcase)
// ============================================
import { t } from '../i18n.js';
import { 
  getRandomBoxTiers, 
  getAllStoreProducts,
  getSuperRaffles, 
  LIVE_WINNING_FEED, 
  getUserPoints, 
  getAvailableGoldenTicketsCount, 
  applyGoldenTicketsToRaffle,
  getRaffleGroupData,
  cancelGoldenTicketApplication,
  checkAndResolveRaffleExpirations
} from '../services/randombox.js';
import { openProductPurchaseModal } from '../services/unboxing-modal.js';
import { isLoggedIn, requireLogin } from '../services/auth.js';

let countdownIntervals = [];
let activeStoreFilter = 'all'; // 'all' | 'box_basic' | 'box_premium' | 'box_vip'

function clearTimers() {
  countdownIntervals.forEach((id) => clearInterval(id));
  countdownIntervals = [];
}

function formatTime(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function renderLiveTicker() {
  const itemsHtml = LIVE_WINNING_FEED.concat(LIVE_WINNING_FEED).map((f) => `
    <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs text-white whitespace-nowrap mr-3 shadow-2xs">
      <span class="material-symbols-outlined text-amber-300 text-sm">${f.icon}</span>
      <span class="font-bold text-amber-300">${f.title}</span>
      <span class="text-white/80 text-[11px]">${f.desc}</span>
    </div>
  `).join('');

  return `
    <div class="w-full bg-slate-900 border-b border-white/10 overflow-hidden py-2 select-none">
      <div class="ticker-track">
        ${itemsHtml}
      </div>
    </div>`;
}

function renderStoreProductCard(item, tier) {
  const loggedIn = isLoggedIn();
  const price = Number(item.retailPrice || tier.price || 5000);
  const tickets = Number(tier.goldenTickets) || (price >= 20000 ? 11 : price >= 10000 ? 5 : 2);

  return `
    <div class="relative bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col overflow-hidden group">
      <!-- Top Badges -->
      <div class="absolute top-3.5 left-3.5 z-10 flex gap-1.5">
        <span class="bg-slate-900/90 backdrop-blur-md text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-sm">
          ${item.badge || tier.badge || '인기'}
        </span>
        <span class="bg-primary text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-sm">
          ${tier.name}
        </span>
      </div>

      <div class="absolute top-3.5 right-3.5 z-10">
        <span class="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1 shadow-sm">
          <span class="material-symbols-outlined text-[13px]">confirmation_number</span>
          사은 티켓 +${tickets}장
        </span>
      </div>

      <!-- Product Image: Full Visibility object-contain -->
      <div class="relative h-60 w-full overflow-hidden bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100">
        <img src="${item.image || 'assets/products/phonestand_metal.jpg'}" alt="${item.name}" onerror="this.onerror=null; this.src='assets/products/phonestand_metal.jpg';" class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105">
      </div>

      <!-- Content Details -->
      <div class="p-6 flex-grow flex flex-col justify-between">
        <div>
          <div class="mb-3">
            <h3 class="font-extrabold text-base text-gray-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">${item.name}</h3>
            <p class="text-xs text-gray-500 mt-1 line-clamp-2">${item.description || tier.tagline}</p>
          </div>

          <!-- Product Specs / Guarantee Tag -->
          <div class="mb-4 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-600 text-lg">verified</span>
              <div>
                <p class="font-bold text-gray-900">100% 정품 실물 배송</p>
                <p class="text-[10px] text-gray-500">결제 즉시 내 보관함 보관</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-gray-400 font-bold block uppercase">정가</span>
              <span class="font-black text-lg text-gray-900 font-mono">₩${price.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- Buy Action Button -->
        <button onclick="window.__openProductPurchase('${item.id}', '${tier.id}')" class="w-full py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-primary hover:to-indigo-600 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-xs">
          <span class="material-symbols-outlined text-base">shopping_cart</span>
          <span>정가 바로 구매하기 (₩${price.toLocaleString()}원)</span>
        </button>
      </div>
    </div>`;
}

function renderSuperRaffleCard(raffle, index) {
  const isClosed = raffle.status === 'closed';
  const remaining = Math.max(0, raffle.endTime - Date.now());
  const loggedIn = isLoggedIn();
  const groupData = getRaffleGroupData(raffle, 'my_user_id');
  if (!loggedIn) groupData.groups.forEach(g => { g.hasMyTicket = false; g.myTicketCount = 0; });

  return `
    <div class="relative bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-6 border-2 ${isClosed ? 'border-slate-700 bg-slate-950/90 opacity-95' : 'border-amber-400/40'} shadow-2xl overflow-hidden flex flex-col justify-between">
      <div class="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div>
        <!-- Showcase Product Hero: Full Visibility (No Clipping) with Ambient Backdrop -->
        <div class="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden bg-slate-950 border-2 ${isClosed ? 'border-slate-700' : 'border-amber-400/50'} shadow-xl mb-4 group flex items-center justify-center p-3">
          <div class="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-25 scale-110 pointer-events-none transition-transform duration-700 group-hover:scale-120" style="background-image: url('${raffle.imageUrl || ''}');"></div>
          <div class="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/50 via-black/10 to-transparent pointer-events-none z-2"></div>

          <img src="${raffle.imageUrl || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80'}" alt="${raffle.title}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80';" class="w-full h-full object-contain relative z-1 transition-transform duration-300 group-hover:scale-[1.03] drop-shadow-md">

          <!-- Top Floating Badges -->
          <div class="absolute top-3 left-3 z-10">
            ${isClosed ? `
              <span class="bg-slate-900/90 backdrop-blur-md text-amber-300 border border-amber-400/40 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                추첨 마감 (CLOSED)
              </span>
            ` : `
              <span class="bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                ${raffle.badge}
              </span>
            `}
          </div>

          <div class="absolute top-3 right-3 z-10">
            <div class="flex items-center gap-1.5 text-xs text-amber-300 font-mono bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/30 shadow-md">
              ${isClosed ? `
                <span class="material-symbols-outlined text-[14px]">emoji_events</span>
                <span>추첨 완료 (${raffle.winners?.length || 0}명)</span>
              ` : `
                <span class="material-symbols-outlined text-[14px]">timer</span>
                <span id="super-timer-${index}">${formatTime(remaining)}</span>
              `}
            </div>
          </div>

          ${raffle.winnerBonus ? `
          <div class="absolute bottom-3 left-3 right-3 z-10 flex justify-between items-end pointer-events-none">
            <span class="text-[11px] text-emerald-300 font-bold bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-emerald-500/40 shadow-sm flex items-center gap-1">
              <span>🎁</span>
              <span>${raffle.winnerBonus}</span>
            </span>
          </div>
          ` : ''}

          ${isClosed ? `
            <div class="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center z-20">
              <span class="px-5 py-2 bg-slate-900/90 text-amber-300 border-2 border-amber-400 font-black text-sm tracking-widest rounded-2xl shadow-2xl">
                🏁 추첨 마감 완료
              </span>
            </div>
          ` : ''}
        </div>

        <!-- Product Title & Retail Price -->
        <div class="mb-4">
          <h4 class="font-black text-xl sm:text-2xl text-white tracking-tight leading-snug">${raffle.title}</h4>
          <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-1">
            <span class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">RETAIL VALUE</span>
            <span class="text-base sm:text-lg font-black text-amber-300 font-mono">₩${Number(raffle.retailPrice || 0).toLocaleString()}원 상당</span>
            <span class="text-[10px] text-slate-400 font-normal">(※ 5만 원 초과 경품으로 제세공과금 22% 당첨자 부담)</span>
          </div>
        </div>

        <!-- Multi-Group Progress Bar -->
        <div class="space-y-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div class="flex justify-between items-center text-xs">
            <div class="flex items-center gap-1.5 font-bold text-amber-300">
              <span class="material-symbols-outlined text-base">format_list_numbered</span>
              <span>현재 참여 큐 현황</span>
            </div>
            <span class="text-slate-300 font-mono">총 참여: <strong>${groupData.totalActiveEntries}장</strong></span>
          </div>

          <!-- Group Status Tags -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            ${groupData.groups.slice(0, 3).map(g => `
              <div class="p-2.5 rounded-xl border ${g.isComplete ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-300'}">
                <div class="flex justify-between text-[11px] mb-1">
                  <span class="font-bold">그룹 ${g.groupNumber}</span>
                  <span class="font-mono">${g.count}/${g.unitSize}</span>
                </div>
                <div class="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                  <div class="h-full ${g.isComplete ? 'bg-emerald-400' : 'bg-amber-400'}" style="width: ${Math.min(100, (g.count / g.unitSize) * 100)}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="space-y-2 pt-2 border-t border-white/10">
        <button onclick="window.__openTransparencyModal('${raffle.id}')" class="w-full py-2.5 bg-white/10 hover:bg-white/15 text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-white/10">
          <span class="material-symbols-outlined text-sm">visibility</span>
          <span>전체 참여자 명부 및 공정 추첨 큐 확인 ↗</span>
        </button>

        ${isClosed ? `
          <button disabled class="w-full py-4 bg-slate-800 text-slate-400 font-black rounded-2xl cursor-not-allowed text-xs">
            추첨이 공식 마감되었습니다
          </button>
        ` : loggedIn ? `
          <button onclick="window.__openApplyTicketModal('${raffle.id}', '${raffle.title}', ${getAvailableGoldenTicketsCount()})" class="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-xl">confirmation_number</span>
            <span>내 사은 골든티켓으로 응모하기</span>
          </button>
        ` : `
          <button onclick="window.__requireLoginForRaffle()" class="w-full py-4 bg-slate-800 hover:bg-slate-700 text-amber-300 font-black rounded-2xl border border-amber-400/30 transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-xl">lock</span>
            <span>로그인하고 사은 골든티켓 응모하기</span>
          </button>
        `}
      </div>
    </div>`;
}

function renderTransparencyModal(raffleId) {
  const allRaffles = getSuperRaffles();
  const raffle = allRaffles.find(r => r.id === raffleId);
  if (!raffle) return '';

  const groupData = getRaffleGroupData(raffle, 'my_user_id');
  const isClosed = raffle.status === 'closed';
  const loggedIn = isLoggedIn();

  return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop" id="transparency-modal" onclick="if(event.target===this)window.__closeTransparencyModal()">
      <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div class="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">공정 추첨 시스템</span>
              <span class="text-xs text-slate-400 font-mono">단위: ${raffle.unitSize || 200}명당 1등 1명</span>
            </div>
            <h3 class="text-xl font-bold mt-1 text-white">${raffle.title}</h3>
            <p class="text-xs text-slate-300">소비자가: ₩${Number(raffle.retailPrice || 0).toLocaleString()}원 상당</p>
          </div>
          <button onclick="window.__closeTransparencyModal()" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-4 custom-scrollbar">
          ${groupData.groups.map(g => {
            const groupWinner = (raffle.winners || []).find(w => w.groupNumber === g.groupNumber);
            return `
            <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div class="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="font-black text-sm text-gray-900">그룹 #${g.groupNumber}</span>
                  ${g.isComplete ? `
                    <span class="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span class="material-symbols-outlined text-[12px]">emoji_events</span>
                      ${isClosed ? '1등 당첨자 선발 완료' : '목표 달성 (추첨 확정)'}
                    </span>
                  ` : `
                    <span class="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                      ${isClosed ? `미달 마감 (골든티켓 100% 환불 반환)` : `⏳ 모집 중 (${g.count}/${g.unitSize})`}
                    </span>
                  `}
                </div>
                ${g.hasMyTicket ? `<span class="text-xs font-black text-primary">🎯 내 티켓: ${g.myTicketCount}장 포함</span>` : ''}
              </div>

              <div class="divide-y divide-slate-100 max-h-48 overflow-y-auto custom-scrollbar">
                ${g.entries.length === 0 ? `
                  <div class="p-6 text-center text-xs text-gray-400">아직 해당 그룹에 응모된 티켓이 없습니다.</div>
                ` : g.entries.map(e => {
                  const isMine = loggedIn && e.userId === 'my_user_id';
                  const isWinner = groupWinner && (groupWinner.ticketId === e.ticketId || groupWinner.ticketNumber === e.ticketNumber);
                  
                  return `
                    <div class="p-3 flex items-center justify-between text-xs ${isWinner ? 'bg-amber-100/80 border-l-4 border-amber-500 font-bold' : isMine ? 'bg-blue-50/70 border-l-4 border-primary font-bold' : 'hover:bg-slate-50'}">
                      <div class="flex items-center gap-3">
                        <span class="font-mono text-gray-400 w-8">#${e.slotIndex}</span>
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-gray-900">${e.userName}</span>
                          <span class="text-[11px] text-gray-500 font-mono">${e.userEmail}</span>
                          ${isWinner ? `<span class="text-[9px] font-black bg-amber-500 text-slate-950 px-2 py-0.2 rounded-full shadow-xs">👑 1등 당첨!</span>` : ''}
                          ${isMine && !isWinner ? `<span class="text-[9px] font-black bg-primary text-white px-2 py-0.2 rounded-full">내 티켓</span>` : ''}
                        </div>
                      </div>

                      <div class="flex items-center gap-3">
                        <span class="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">${e.ticketNumber}</span>
                        ${!isClosed && isMine && !g.isComplete ? `
                          <button onclick="window.__cancelTicket('${raffle.id}', '${e.ticketId}')" class="text-[10px] text-red-600 hover:text-red-800 font-bold underline">
                            응모 취소
                          </button>
                        ` : isClosed && !g.isComplete ? `
                          <span class="text-[10px] text-amber-700 font-bold">전액 환불 완료</span>
                        ` : ''}
                      </div>
                    </div>`;
                }).join('')}
              </div>
            </div>`;
          }).join('')}

          <div class="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-[11px] text-blue-900 leading-relaxed space-y-1">
            <p><strong>💡 FIFO 자동 순번 당김 시스템 & 100% 티켓 반환:</strong></p>
            <p>목표 인원을 채운 그룹은 즉시 공정 추첨으로 1등 당첨자를 선발하며, 인원 미달 그룹의 티켓은 100% 자동 환불 반환됩니다.</p>
          </div>
        </div>

        <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button onclick="window.__closeTransparencyModal()" class="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800">
            닫기
          </button>
        </div>
      </div>
    </div>`;
}

function renderApplyTicketModal(raffleId, raffleTitle, userTickets) {
  return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop" id="apply-ticket-modal" onclick="if(event.target===this)window.__closeApplyTicketModal()">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95">
        <div class="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-3xl">military_tech</span>
        </div>

        <h3 class="font-headline-sm text-lg font-bold text-gray-900 mb-1">스페셜 상품 골든 티켓 응모</h3>
        <p class="text-xs text-gray-500 mb-4 truncate font-semibold">[${raffleTitle}]</p>

        <div class="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-left mb-5 space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">내 보유 골든 티켓</span>
            <span class="font-black text-amber-700 font-mono text-base">${userTickets}장</span>
          </div>
          <p class="text-[11px] text-amber-900/80">원하는 수량만큼 골든 티켓을 자유롭게 분배하여 응모할 수 있습니다.</p>
          <p class="text-[10px] text-amber-900/60 leading-tight">※ 5만 원 초과 경품 당첨 시 소득세법에 따라 제세공과금(22%)이 부과됩니다.</p>
        </div>

        ${userTickets > 0 ? `
          <div class="space-y-3 mb-6">
            <label class="text-xs font-bold text-gray-700 block text-left">응모할 티켓 수량 입력</label>
            <div class="flex items-center gap-2">
              <input type="number" id="apply-ticket-input" min="1" max="${userTickets}" value="1" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center font-mono font-black text-lg text-primary focus:border-primary outline-none">
              <button onclick="document.getElementById('apply-ticket-input').value = '${userTickets}'" class="px-3.5 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs whitespace-nowrap">
                전액 (${userTickets}장)
              </button>
            </div>
            <div class="flex gap-1.5 justify-center pt-1">
              <button onclick="document.getElementById('apply-ticket-input').value = '1'" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">+1장</button>
              ${userTickets >= 3 ? `<button onclick="document.getElementById('apply-ticket-input').value = '3'" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">+3장</button>` : ''}
              ${userTickets >= 5 ? `<button onclick="document.getElementById('apply-ticket-input').value = '5'" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">+5장</button>` : ''}
            </div>
          </div>

          <div class="flex gap-2">
            <button onclick="window.__closeApplyTicketModal()" class="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs hover:bg-gray-200">
              취소
            </button>
            <button onclick="window.__confirmApplyTickets('${raffleId}')" class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md hover:from-amber-400 hover:to-amber-500">
              응모 확정하기
            </button>
          </div>
        ` : `
          <div class="p-4 bg-slate-100 rounded-2xl text-xs text-gray-500 mb-5">
            보유 중인 골든 티켓이 없습니다.<br>
            정가 상품을 구매하시면 골든 티켓이 무료 사은품으로 적립됩니다!
          </div>
          <button onclick="window.__closeApplyTicketModal(); window.location.hash='#store_lineup'" class="w-full py-3.5 bg-primary text-white font-bold rounded-2xl text-xs shadow-md">
            정가 상품 둘러보고 골든티켓 받기
          </button>
        `}
      </div>
    </div>`;
}

export function render() {
  clearTimers();
  checkAndResolveRaffleExpirations();

  const loggedIn = isLoggedIn();
  const userPts = loggedIn ? getUserPoints() : 0;
  const userTickets = loggedIn ? getAvailableGoldenTicketsCount() : 0;
  const tiers = getRandomBoxTiers();
  const allRaffles = getSuperRaffles();
  const raffles = allRaffles.filter(r => r.status === 'active');

  // Filter products based on activeStoreFilter
  const displayTiers = activeStoreFilter === 'all' 
    ? tiers 
    : tiers.filter(t => t.id === activeStoreFilter);

  const html = `
    <!-- Top Live Marquee -->
    ${renderLiveTicker()}

    <main class="pt-8 pb-32 px-container-margin max-w-[1240px] mx-auto page-enter">
      
      <!-- Hero Banner -->
      <section class="mb-12">
        <div class="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-12 text-white shadow-2xl border border-slate-800">
          <div class="absolute -right-16 -bottom-16 w-80 h-80 bg-primary/30 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-16 -top-16 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-300 font-extrabold text-xs mb-4 shadow-sm">
              <span class="material-symbols-outlined text-sm">verified_user</span>
              100% 정품 실물 정가 쇼핑몰 · 구매 고객 사은 래플
            </div>

            <h1 class="font-black text-3xl md:text-5xl leading-tight mb-4 tracking-tight">
              실속 있는 정가 쇼핑!<br>
              <span class="gold-gradient-text">100% 실물 상품 정가 구매</span> + <span class="text-amber-300">구매 사은 래플</span>
            </h1>
            <p class="text-sm md:text-base text-slate-300 mb-8 leading-relaxed">
              5,000원 / 10,000원 / 20,000원 엄선된 실물 정가 상품을 자유롭게 구매하시고, 구매 금액에 따라 무료 증정되는 사은 골든티켓으로 <strong>스페셜 사은품(아이폰 16 Pro, 명품백 등)에 자유롭게 응모</strong>하세요!
            </p>

            <div class="flex flex-wrap items-center gap-4">
              <a href="#store_lineup" class="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2">
                <span class="material-symbols-outlined">shopping_bag</span>
                정가 상품 둘러보기
              </a>
              ${loggedIn ? `
              <div class="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs">
                <div>
                  <span class="text-gray-300 text-[10px] block">내 보유 포인트</span>
                  <span class="font-black text-amber-300 text-sm font-mono">₩${userPts.toLocaleString()} P</span>
                </div>
                <div class="h-6 w-px bg-white/20"></div>
                <div>
                  <span class="text-gray-300 text-[10px] block">보유 골든티켓</span>
                  <span class="font-black text-amber-300 text-sm font-mono">${userTickets}장</span>
                </div>
              </div>
              ` : `
              <a href="#profile?redirect=home" id="hero-login-cta" class="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-bold text-white transition-all active:scale-95">
                <span class="material-symbols-outlined text-amber-300 text-lg">login</span>
                <span>로그인하고 내 포인트·골든티켓 확인</span>
              </a>
              `}
            </div>
          </div>
        </div>
      </section>

      <!-- Super Golden Raffle Showcase (Multi-Group Queue) -->
      <section class="mb-16">
        <div class="flex justify-between items-end mb-6">
          <div>
            <span class="text-xs font-black text-amber-600 uppercase tracking-widest">CUSTOMER APPRECIATION PROMOTION</span>
            <h2 class="text-2xl md:text-3xl font-black text-gray-900 mt-1">구매 고객 사은 프로모션 (스페셜 래플)</h2>
          </div>
          <span class="text-xs text-gray-500 hidden sm:block">목표 달성 그룹별 당첨자 선발 · 5만원 초과 제세공과금(22%) 당첨자 부담 · 미달 시 100% 반환</span>
        </div>

        ${raffles.length === 0 ? `
          <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-white shadow-xl">
            <span class="material-symbols-outlined text-4xl text-amber-400 mb-2">military_tech</span>
            <h4 class="font-bold text-lg">현재 진행 중인 스페셜 래플이 모두 추첨 마감되었습니다</h4>
            <p class="text-xs text-slate-400 mt-1 mb-4">마감된 래플의 당첨자 명단 및 환불 내역은 [당첨자] 메뉴에서 확인하실 수 있습니다.</p>
            <a href="#history" class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md">
              당첨자 & 마감 기록 확인하기 ↗
            </a>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${raffles.map((raffle, idx) => renderSuperRaffleCard(raffle, idx)).join('')}
          </div>
        `}
      </section>

      <!-- Main Fixed-Price Store Products Showcase -->
      <section id="store_lineup" class="mb-16">
        <div class="flex flex-col sm:flex-row justify-between sm:items-end mb-6 gap-4">
          <div>
            <span class="text-xs font-black text-primary uppercase tracking-widest">100% AUTHENTIC FIXED-PRICE COMMERCE</span>
            <h2 class="text-2xl md:text-3xl font-black text-gray-900 mt-1">정가 상품 스토어 (구매 사은 골든티켓 증정)</h2>
          </div>
          <span class="text-xs text-gray-500">100% 정품 실물 배송 가능 · 구매 시 골든티켓 무료 사은 증정</span>
        </div>

        <!-- Filter Tabs -->
        <div id="store-filter-tabs" class="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-4">
          <button onclick="window.__filterStoreProducts('all')" data-filter="all" class="store-filter-btn px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${activeStoreFilter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-slate-100 border border-slate-200'}">
            <span>전체 상품</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full ${activeStoreFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}">9개</span>
          </button>
          
          <button onclick="window.__filterStoreProducts('box_basic')" data-filter="box_basic" class="store-filter-btn px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${activeStoreFilter === 'box_basic' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-slate-100 border border-slate-200'}">
            <span>5,000원 상품관</span>
            <span class="text-[10px] font-mono bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold">+2장</span>
          </button>

          <button onclick="window.__filterStoreProducts('box_premium')" data-filter="box_premium" class="store-filter-btn px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${activeStoreFilter === 'box_premium' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-slate-100 border border-slate-200'}">
            <span>10,000원 상품관</span>
            <span class="text-[10px] font-mono bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold">+5장</span>
          </button>

          <button onclick="window.__filterStoreProducts('box_vip')" data-filter="box_vip" class="store-filter-btn px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${activeStoreFilter === 'box_vip' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-slate-100 border border-slate-200'}">
            <span>20,000원 상품관</span>
            <span class="text-[10px] font-mono bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold">+11장</span>
          </button>
        </div>

        <!-- Products Grid (3 items per tier) -->
        <div id="store-products-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          ${displayTiers.flatMap(tier => (tier.items || []).map(item => renderStoreProductCard(item, tier))).join('')}
        </div>
      </section>

    </main>
    <div id="home-modal-container"></div>`;

  // Setup Timers
  setTimeout(() => {
    raffles.forEach((raffle, idx) => {
      if (raffle.status === 'closed') return;
      const el = document.getElementById(`super-timer-${idx}`);
      if (!el) return;
      const interval = setInterval(() => {
        const remaining = raffle.endTime - Date.now();
        if (remaining <= 0) {
          el.textContent = '00:00:00';
          clearInterval(interval);
          checkAndResolveRaffleExpirations();
          return;
        }
        el.textContent = formatTime(remaining);
      }, 1000);
      countdownIntervals.push(interval);
    });
  }, 100);

  // Store Filter Handler (Smooth local DOM update without resetting timers/scroll)
  window.__filterStoreProducts = (filter) => {
    activeStoreFilter = filter;
    const allTiers = getRandomBoxTiers();
    const currentDisplayTiers = activeStoreFilter === 'all' 
      ? allTiers 
      : allTiers.filter(t => t.id === activeStoreFilter);

    const grid = document.getElementById('store-products-grid');
    if (grid) {
      grid.innerHTML = currentDisplayTiers.flatMap(tier => (tier.items || []).map(item => renderStoreProductCard(item, tier))).join('');
    }

    // Update active tab styles
    const buttons = document.querySelectorAll('.store-filter-btn');
    buttons.forEach(btn => {
      const f = btn.getAttribute('data-filter');
      const isSelected = f === activeStoreFilter;
      btn.className = `store-filter-btn px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${
        isSelected 
          ? (f === 'box_basic' ? 'bg-blue-600 text-white shadow-md' : f === 'box_premium' ? 'bg-purple-600 text-white shadow-md' : f === 'box_vip' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-900 text-white shadow-md')
          : 'bg-white text-gray-700 hover:bg-slate-100 border border-slate-200'
      }`;
    });
  };

  // Fixed-Price Product Direct Purchase Modal Trigger
  window.__openProductPurchase = (itemId, tierId) => {
    openProductPurchaseModal(itemId, tierId);
  };

  // Handlers
  window.__requireLoginForRaffle = () => {
    requireLogin('스페셜 상품 골든 티켓 응모는 로그인 후 이용할 수 있습니다.');
  };

  window.__openApplyTicketModal = (raffleId, title, tickets) => {
    if (!requireLogin()) return;
    const container = document.getElementById('home-modal-container') || document.body;
    const existing = document.getElementById('apply-ticket-modal');
    if (existing) existing.remove();
    container.insertAdjacentHTML('beforeend', renderApplyTicketModal(raffleId, title, tickets));
  };

  window.__closeApplyTicketModal = () => {
    const modal = document.getElementById('apply-ticket-modal');
    if (modal) modal.remove();
  };

  window.__confirmApplyTickets = async (raffleId) => {
    if (!requireLogin()) return;
    const input = document.getElementById('apply-ticket-input');
    const count = parseInt(input?.value || '1', 10);

    try {
      const res = await applyGoldenTicketsToRaffle(raffleId, count);
      const title = res.raffle?.title || '스페셜 래플';
      alert(`🎉 [${title}] 상품에 골든 티켓 ${count}장 응모가 완료되었습니다!\n(잔여 보유 티켓: ${res.remainingTickets}장)`);
      window.__closeApplyTicketModal();
      window.location.reload();
    } catch (err) {
      alert(err.message || '응모에 실패했습니다.');
    }
  };

  window.__openTransparencyModal = (raffleId) => {
    const container = document.getElementById('home-modal-container') || document.body;
    const existing = document.getElementById('transparency-modal');
    if (existing) existing.remove();
    container.insertAdjacentHTML('beforeend', renderTransparencyModal(raffleId));
  };

  window.__closeTransparencyModal = () => {
    const modal = document.getElementById('transparency-modal');
    if (modal) modal.remove();
  };

  window.__cancelTicket = async (raffleId, ticketId) => {
    if (!requireLogin()) return;
    if (!confirm('이 골든 티켓 응모를 취소하시겠습니까?\n취소 시 티켓은 내 지갑으로 즉시 반환되며, 뒤 순서 참여자의 순번이 1칸씩 자동으로 앞당겨집니다.')) return;
    try {
      const res = await cancelGoldenTicketApplication(raffleId, ticketId);
      alert(`✓ 골든 티켓 응모가 취소되어 내 지갑으로 환불 반환되었습니다.\n순번이 자동으로 재배열되었습니다. (잔여 보유 티켓: ${res.newAvailableBalance}장)`);
      window.__closeTransparencyModal();
      window.location.reload();
    } catch (err) {
      alert(err.message || '취소 처리에 실패했습니다.');
    }
  };

  return html;
}

export function cleanup() {
  clearTimers();
  delete window.__requireLoginForRaffle;
  delete window.__openApplyTicketModal;
  delete window.__closeApplyTicketModal;
  delete window.__confirmApplyTickets;
  delete window.__openTransparencyModal;
  delete window.__closeTransparencyModal;
  delete window.__cancelTicket;
  delete window.__filterStoreProducts;
  delete window.__openProductPurchase;
}
