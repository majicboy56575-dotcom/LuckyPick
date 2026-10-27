// ============================================
// LuckyPick - Home Page (Fixed-Price Product Commerce & Multi-Group Golden Raffle Showcase)
// ============================================
import { t } from '../i18n.js';
import { 
  getRandomBoxTiers, 
  getAllStoreProducts,
  getSuperRaffles, 
  LIVE_WINNING_FEED, 
  getUserPoints, 
  getAvailableGoldenTicketsCount, 
  getDailyRaffleStats,
  applyGoldenTicketsToRaffle,
  getRaffleGroupData,
  cancelGoldenTicketApplication,
  checkAndResolveRaffleExpirations
} from '../services/randombox.js';
import { openProductPurchaseModal } from '../services/unboxing-modal.js';
import { isLoggedIn, requireLogin } from '../services/auth.js';

let countdownIntervals = [];

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

function renderProductTierCard(box) {
  const loggedIn = isLoggedIn();
  return `
    <div class="relative bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col overflow-hidden group">
      <!-- Top Badges -->
      <div class="absolute top-4 left-4 z-10 flex gap-2">
        <span class="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-[11px] px-3 py-1 rounded-full shadow-sm">
          ${box.badge}
        </span>
      </div>

      <div class="absolute top-4 right-4 z-10">
        <span class="bg-slate-900/80 backdrop-blur-md text-amber-300 font-extrabold text-[11px] px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1 shadow-sm">
          <span class="material-symbols-outlined text-[14px]">confirmation_number</span>
          골든티켓 +${box.goldenTickets}장 증정
        </span>
      </div>

      <!-- Box Image & Glow Header -->
      <div class="relative h-56 w-full overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200/60 flex items-center justify-center">
        <div class="absolute inset-0 bg-gradient-to-r ${box.color} opacity-10 group-hover:opacity-20 transition-opacity"></div>
        <img src="${box.boxImage || 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&auto=format&fit=crop&q=80'}" alt="${box.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&auto=format&fit=crop&q=80';" class="w-36 h-36 object-cover rounded-2xl shadow-xl border-2 border-white group-hover:scale-105 transition-transform duration-300 float-anim">
      </div>

      <!-- Content Details -->
      <div class="p-6 flex-grow flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start mb-2">
            <div>
              <h3 class="font-black text-xl text-gray-900">${box.name}</h3>
              <p class="text-xs text-gray-500 mt-0.5">${box.tagline}</p>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">FIXED PRICE</span>
              <span class="font-black text-2xl text-primary font-mono">₩${box.price.toLocaleString()}</span>
            </div>
          </div>

          <!-- 100% Genuine Direct Delivery Guarantee Badge -->
          <div class="my-4 p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-600 text-xl">verified</span>
              <div>
                <p class="font-bold text-emerald-950">100% 정품 실물 지정 배송</p>
                <p class="text-[10px] text-emerald-700">원하는 품목 100% 지정 확정 구매 (가챠 추첨 X)</p>
              </div>
            </div>
            <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">정가 직구매</span>
          </div>

          <!-- 3 Selectable Fixed-Price Items in this Tier -->
          <div class="space-y-2 mb-5">
            <div class="flex justify-between items-center text-xs">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">지정 구매 가능 품목 (3종)</span>
              <span class="text-[10px] text-primary font-bold">클릭 시 바로 구매</span>
            </div>
            <div class="space-y-1.5">
              ${(box.items || []).map(it => `
                <div onclick="window.__openProductPurchase('${it.id}', '${box.id}')" class="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 flex items-center justify-between cursor-pointer transition-colors group/item">
                  <div class="flex items-center gap-2.5 overflow-hidden">
                    <img src="${it.image || 'assets/products/phonestand_metal.jpg'}" alt="${it.name}" onerror="this.onerror=null; this.src='assets/products/phonestand_metal.jpg';" class="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5 flex-shrink-0">
                    <span class="text-xs font-bold text-gray-800 group-hover/item:text-primary transition-colors truncate">${it.name}</span>
                  </div>
                  <div class="text-right flex-shrink-0 ml-2">
                    <span class="text-[11px] font-black text-gray-900 font-mono">₩${(it.retailPrice || box.price).toLocaleString()}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <button onclick="window.__openTierProductSelect('${box.id}')" class="w-full py-4 bg-gradient-to-r ${box.color} text-white font-extrabold rounded-2xl shadow-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 group-hover:shadow-primary/20">
          <span class="material-symbols-outlined text-xl">${loggedIn ? 'shopping_bag' : 'lock'}</span>
          <span>${loggedIn ? '내가 지정한 상품 구매하기' : '로그인하고 상품 구매하기'}</span>
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
              <span class="bg-amber-500 text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse"></span>
                실시간 응모 진행 중
              </span>
            `}
          </div>

          <div class="absolute top-3 right-3 z-10">
            <span class="bg-slate-900/90 backdrop-blur-md text-white font-mono text-[11px] px-3 py-1 rounded-full border border-white/20 flex items-center gap-1 shadow-md">
              <span class="material-symbols-outlined text-amber-300 text-[14px]">timer</span>
              <span id="super-timer-${index}">${formatTime(remaining)}</span>
            </span>
          </div>

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
  const dailyStats = getDailyRaffleStats();
  const maxAllowed = Math.min(userTickets, dailyStats.remaining);
  const isDailyLimitReached = dailyStats.remaining <= 0;

  return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop" id="apply-ticket-modal" onclick="if(event.target===this)window.__closeApplyTicketModal()">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-gray-900">골든 티켓 응모하기</h3>
          <button onclick="window.__closeApplyTicketModal()" class="text-gray-400 hover:text-gray-600">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-3">
          <span class="text-xs text-gray-500 font-medium">대상 스페셜 래플</span>
          <p class="font-bold text-gray-900 mt-0.5">${raffleTitle}</p>
        </div>

        <!-- Daily Cap Status Badge -->
        <div class="flex items-center justify-between px-3.5 py-2.5 ${isDailyLimitReached ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50/80 border-indigo-100'} border rounded-2xl mb-4 text-xs">
          <span class="font-bold flex items-center gap-1.5 ${isDailyLimitReached ? 'text-amber-900' : 'text-indigo-900'}">
            <span class="material-symbols-outlined text-sm ${isDailyLimitReached ? 'text-amber-600' : 'text-indigo-600'}">verified_user</span>
            1일 건전 응모 한도
          </span>
          <span class="font-mono font-bold ${isDailyLimitReached ? 'text-amber-700' : 'text-indigo-700'}">
            오늘 잔여: ${dailyStats.remaining} / ${dailyStats.limit}회
          </span>
        </div>

        ${isDailyLimitReached ? `
          <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-5 text-xs text-amber-900">
            <p class="font-black text-sm text-amber-950 flex items-center gap-1.5 mb-1">
              <span>⏳</span> 오늘 응모 한도(10회)를 모두 사용하셨습니다
            </p>
            <p class="text-amber-800 leading-relaxed">
              골든티켓 응모는 과몰입 방지와 건전한 참여를 위해 <strong>1인당 1일 최대 10회까지만 가능</strong>합니다. 내일 다시 응모해주세요!
            </p>
          </div>
          <button onclick="window.__closeApplyTicketModal()" class="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs">
            확인 및 닫기
          </button>
        ` : userTickets > 0 ? `
          <div class="mb-5">
            <div class="flex justify-between text-xs text-gray-500 mb-2">
              <span>내 보유 골든 티켓</span>
              <span class="font-bold text-amber-600 font-mono">${userTickets}장</span>
            </div>

            <label class="block text-xs font-semibold text-gray-700 mb-1">응모할 티켓 수량 입력 (오늘 최대 ${dailyStats.remaining}장)</label>
            <div class="flex items-center gap-2">
              <input type="number" id="apply-ticket-input" min="1" max="${maxAllowed}" value="1" class="flex-grow p-3 bg-slate-100 border border-slate-300 rounded-xl font-bold font-mono text-center text-lg focus:outline-primary">
              <button onclick="document.getElementById('apply-ticket-input').value = '${maxAllowed}'" class="px-3.5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold whitespace-nowrap">
                최대(${maxAllowed}장)
              </button>
            </div>

            <div class="flex gap-1.5 mt-2">
              <button onclick="document.getElementById('apply-ticket-input').value = '1'" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">+1장</button>
              ${maxAllowed >= 3 ? `<button onclick="document.getElementById('apply-ticket-input').value = '3'" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">+3장</button>` : ''}
              ${maxAllowed >= 5 ? `<button onclick="document.getElementById('apply-ticket-input').value = '5'" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">+5장</button>` : ''}
              ${maxAllowed >= 10 ? `<button onclick="document.getElementById('apply-ticket-input').value = '10'" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">+10장</button>` : ''}
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
          <button onclick="window.__closeApplyTicketModal(); window.location.hash='#box_lineup'" class="w-full py-3.5 bg-primary text-white font-bold rounded-2xl text-xs shadow-md">
            지정 상품 둘러보고 골든티켓 받기
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
  const boxes = getRandomBoxTiers();
  const allRaffles = getSuperRaffles();
  const raffles = allRaffles.filter(r => r.status === 'active');

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
              100% 정품 실물 상품 라인업 · 구매 사은 골든티켓 증정
            </div>

            <h1 class="font-black text-3xl md:text-5xl leading-tight mb-4 tracking-tight">
              실속 있는 정가 쇼핑!<br>
              <span class="gold-gradient-text">지정한 실물 상품 정가 구매</span> + <span class="text-amber-300">구매 사은 래플</span>
            </h1>
            <p class="text-sm md:text-base text-slate-300 mb-8 leading-relaxed">
              소비자가 기준 최저 보장 가치 100% 보장! 5,000원 / 10,000원 / 20,000원 엄선된 실물 정가 상품을 자유롭게 지정 구매하시고, 구매 금액에 따라 무료 증정되는 사은 골든티켓으로 <strong>스페셜 사은품(아이폰 16 Pro 등)에 자유롭게 응모</strong>하세요!
            </p>

            <div class="flex flex-wrap items-center gap-4">
              <a href="#box_lineup" class="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2">
                <span class="material-symbols-outlined">package_2</span>
                지정 상품 라인업 둘러보기
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

      <!-- Main Showcase: 3 Fixed-Price Tiers (Selectable 3 Items each) -->
      <section id="box_lineup" class="mb-16">
        <div class="flex justify-between items-end mb-6">
          <div>
            <span class="text-xs font-black text-primary uppercase tracking-widest">100% AUTHENTIC FIXED-PRICE COMMERCE</span>
            <h2 class="text-2xl md:text-3xl font-black text-gray-900 mt-1">등급별 정가 상품 라인업</h2>
          </div>
          <span class="text-xs text-gray-500 hidden sm:block">전 품목 실물 배송 가능 · 구매 시 사은 골든티켓 무료 증정</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${boxes.map(box => renderProductTierCard(box)).join('')}
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

  // Fixed-Price Product Direct Purchase Modal Trigger
  window.__openProductPurchase = (itemId, tierId) => {
    openProductPurchaseModal(itemId, tierId);
  };

  // Open Tier Product Selector (defaults to first item of the tier, allows 3-way toggle inside modal)
  window.__openTierProductSelect = (tierId) => {
    const tiers = getRandomBoxTiers();
    const tier = tiers.find(t => t.id === tierId) || tiers[0];
    const firstItem = tier?.items?.[0];
    openProductPurchaseModal(firstItem?.id, tier.id);
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

    const dailyStats = getDailyRaffleStats();
    if (dailyStats.remaining <= 0) {
      alert('골든티켓 응모는 건전한 참여를 위해 1인당 1일 최대 10회까지만 가능합니다. 내일 다시 응모해주세요!');
      return;
    }
    if (count > dailyStats.remaining) {
      alert(`오늘 추가로 응모할 수 있는 수량은 최대 ${dailyStats.remaining}장입니다. (1일 한도 10장)`);
      return;
    }

    try {
      const res = await applyGoldenTicketsToRaffle(raffleId, count);
      const title = res.raffle?.title || '스페셜 래플';
      alert(`🎉 [${title}] 상품에 골든 티켓 ${count}장 응모가 완료되었습니다!\n(잔여 보유 티켓: ${res.remainingTickets}장 / 오늘 추가 응모 가능: ${Math.max(0, dailyStats.remaining - count)}회)`);
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
  delete window.__openProductPurchase;
  delete window.__openTierProductSelect;
}
