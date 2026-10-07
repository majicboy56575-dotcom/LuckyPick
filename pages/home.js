// ============================================
// LuckyPick - Home Page (100% Random Box + Multi-Group Golden Raffle Showcase)
// ============================================
import { t } from '../i18n.js?v=20261007_13';
import { 
  getRandomBoxTiers, 
  getSuperRaffles, 
  LIVE_WINNING_FEED, 
  getUserPoints, 
  getAvailableGoldenTicketsCount, 
  applyGoldenTicketsToRaffle,
  getRaffleGroupData,
  cancelGoldenTicketApplication,
  checkAndResolveRaffleExpirations
} from '../services/randombox.js?v=20261007_13';
import '../services/unboxing-modal.js?v=20261007_13';
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

function renderRandomBoxCard(box) {
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
          골든티켓 +${box.goldenTickets}장 적립
        </span>
      </div>

      <!-- Box Image & Glow Header -->
      <div class="relative h-56 w-full overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200/60 flex items-center justify-center">
        <div class="absolute inset-0 bg-gradient-to-r ${box.color} opacity-10 group-hover:opacity-20 transition-opacity"></div>
        <img src="${box.boxImage}" alt="${box.name}" class="w-36 h-36 object-cover rounded-2xl shadow-xl border-2 border-white group-hover:scale-105 transition-transform duration-300 float-anim">
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
              <span class="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">BOX PRICE</span>
              <span class="font-black text-2xl text-primary font-mono">₩${box.price.toLocaleString()}</span>
            </div>
          </div>

          <!-- 100% Guarantee Badge -->
          <div class="my-4 p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-600 text-xl">verified</span>
              <div>
                <p class="font-bold text-emerald-950">100% 실물 지급 보장 (꽝 없음)</p>
                <p class="text-[10px] text-emerald-700">최소 ₩${box.minGuaranteedValue.toLocaleString()}원 이상 품목 100% 당첨</p>
              </div>
            </div>
            <button onclick="window.__showProbModal('${box.id}')" class="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950 whitespace-nowrap">
              확률표 보기 ↗
            </button>
          </div>

          <!-- Item Pool Preview -->
          <div class="space-y-1.5 mb-5">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">주요 등장 실물 품목 라인업</span>
            <div class="flex flex-wrap gap-1.5">
              ${box.items.slice(0, 3).map(it => `
                <span class="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60 font-medium">
                  ${it.name.split(' ')[0]} ${it.name.split(' ')[1] || ''}
                </span>
              `).join('')}
              <span class="text-[11px] bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border border-amber-200 font-bold">
                외 ${box.items.length - 3}종
              </span>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <button onclick="window.__startUnboxing('${box.id}')" class="w-full py-4 bg-gradient-to-r ${box.color} text-white font-extrabold rounded-2xl shadow-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 group-hover:shadow-primary/20">
          <span class="material-symbols-outlined text-xl">${isLoggedIn() ? 'redeem' : 'lock'}</span>
          ${isLoggedIn() ? '럭키박스 즉시 개봉하기' : '로그인하고 개봉하기'}
        </button>
      </div>
    </div>`;
}

function renderSuperRaffleCard(raffle, index) {
  const isClosed = raffle.status === 'closed';
  const remaining = Math.max(0, raffle.endTime - Date.now());
  const loggedIn = isLoggedIn();
  const userTickets = loggedIn ? getAvailableGoldenTicketsCount() : 0;
  const groupData = getRaffleGroupData(raffle, 'my_user_id');
  // Never show "my ticket" markers to logged-out visitors
  if (!loggedIn) groupData.groups.forEach(g => { g.hasMyTicket = false; g.myTicketCount = 0; });

  return `
    <div class="relative bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-6 border-2 ${isClosed ? 'border-slate-700 bg-slate-950/90 opacity-95' : 'border-amber-400/40'} shadow-2xl overflow-hidden flex flex-col justify-between">
      <div class="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div>
        <div class="flex justify-between items-center mb-4">
          ${isClosed ? `
            <span class="bg-slate-800 text-amber-300 border border-amber-400/40 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              추첨 마감 완료 (CLOSED)
            </span>
          ` : `
            <span class="bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              ${raffle.badge}
            </span>
          `}
          
          <div class="flex items-center gap-1.5 text-xs text-amber-300 font-mono bg-white/5 px-3 py-1 rounded-full border border-white/10">
            ${isClosed ? `
              <span class="material-symbols-outlined text-[14px]">emoji_events</span>
              <span>추첨 완료 (${raffle.winners?.length || 0}명 당첨)</span>
            ` : `
              <span class="material-symbols-outlined text-[14px]">timer</span>
              <span id="super-timer-${index}">${formatTime(remaining)}</span>
            `}
          </div>
        </div>

        <div class="flex gap-4 items-center mb-5">
          <div class="relative">
            <img src="${raffle.imageUrl}" alt="${raffle.title}" class="w-24 h-24 object-cover rounded-2xl border-2 ${isClosed ? 'border-slate-700 opacity-90' : 'border-amber-400/50'} shadow-md">
            ${isClosed ? `
              <span class="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center font-black text-amber-300 text-xs tracking-wider">
                마감
              </span>
            ` : ''}
          </div>
          <div class="min-w-0">
            <h4 class="font-extrabold text-lg text-white leading-snug">${raffle.title}</h4>
            <p class="text-xs text-amber-300/90 mt-1">정가: <strong>₩${raffle.retailPrice.toLocaleString()}원 상당</strong></p>
            <span class="inline-block mt-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              🎁 ${raffle.winnerBonus}
            </span>
          </div>
        </div>

        ${isClosed ? `
          <!-- Closed Draw Results Box -->
          <div class="space-y-3 mb-6 bg-gradient-to-b from-amber-950/30 to-slate-900/80 p-4 rounded-2xl border border-amber-500/30">
            <div class="flex justify-between items-center pb-2 border-b border-white/10">
              <div class="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                <span class="material-symbols-outlined text-base">military_tech</span>
                <span>추첨 결과 및 당첨자 선발 내역</span>
              </div>
              <span class="text-[10px] font-mono text-emerald-400 font-bold">100% 당첨 완료 ✓</span>
            </div>

            <div class="space-y-2">
              ${(raffle.winners || []).map(w => `
                <div class="p-2.5 bg-amber-400/10 border border-amber-400/30 rounded-xl flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded">그룹 ${w.groupNumber}</span>
                    <div>
                      <span class="font-bold text-white text-xs">${w.winner ? w.winner.userName : '당첨자'} 님</span>
                      <span class="text-[10px] text-slate-400 font-mono block">${w.winner ? w.winner.userEmail : ''}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="font-mono font-bold text-amber-300 text-xs">${w.winner ? w.winner.ticketNumber : ''}</span>
                    <span class="block text-[9px] text-emerald-400 font-bold">🎉 1등 실물 당첨</span>
                  </div>
                </div>
              `).join('')}

              ${raffle.refundCount > 0 ? `
                <div class="p-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs text-slate-300">
                  <div class="flex items-center gap-2">
                    <span class="bg-slate-700 text-slate-300 font-bold text-[9px] px-2 py-0.5 rounded">미달 그룹</span>
                    <p class="text-[11px] text-slate-300">미달 인원(${raffle.refundCount}명) 티켓 전액 자동 환불 완료</p>
                  </div>
                  <span class="text-amber-400 font-bold font-mono text-[10px]">100% 환불</span>
                </div>
              ` : ''}
            </div>
          </div>
        ` : `
          <!-- Multi-Group Slots Status Bar -->
          <div class="space-y-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
            <div class="flex justify-between items-center">
              <button onclick="window.__openTransparencyModal('${raffle.id}')" class="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 underline underline-offset-2">
                <span class="material-symbols-outlined text-sm">groups</span>
                참여자 투명 공개 (${groupData.totalParticipants}명 참여 중) ↗
              </button>
              <span class="text-[11px] text-slate-300 font-mono">
                ${groupData.completedGroupsCount > 0 ? `<span class="text-emerald-400 font-bold">✓ ${groupData.completedGroupsCount}개 그룹 달성</span>` : `그룹당 목표: ${groupData.unitSize}명`}
              </span>
            </div>

            <!-- Group Grid Display -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${groupData.groups.map(g => `
                <div class="p-2.5 rounded-xl border ${g.hasMyTicket ? 'border-amber-400 bg-amber-400/10' : g.isComplete ? 'border-emerald-500/40 bg-emerald-950/30' : 'border-white/10 bg-white/5'} text-center text-xs relative">
                  ${g.hasMyTicket ? `<span class="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-xs">🎯 내 티켓 ${g.myTicketCount}장</span>` : ''}
                  <div class="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                    <span>그룹 ${g.groupNumber}</span>
                    <span class="${g.isComplete ? 'text-emerald-400' : 'text-slate-300'} font-mono">${g.count}/${g.unitSize}</span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full ${g.isComplete ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'} rounded-full" style="width: ${g.fillPercentage}%"></div>
                  </div>
                  <span class="text-[9px] mt-1 block font-mono ${g.isComplete ? 'text-emerald-400 font-bold' : 'text-slate-400'}">
                    ${g.isComplete ? '추첨 확정 ✓' : '모집 진행 중'}
                  </span>
                </div>
              `).join('')}
            </div>

            <p class="text-[10px] text-slate-400 leading-relaxed italic">
              ※ 마감 시 목표인원(그룹당 ${groupData.unitSize}명)을 채운 그룹은 즉시 당첨자를 선발하며, 미달된 그룹은 <strong>골든 티켓이 100% 자동 환불 반환</strong>됩니다.
            </p>
          </div>
        `}
      </div>

      <!-- Action Button -->
      ${isClosed ? `
        <button onclick="window.__openTransparencyModal('${raffle.id}')" class="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 font-black rounded-2xl text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-base">military_tech</span>
          당첨자 전체 명단 & 환불 상세 내역 보기 (마감)
        </button>
      ` : loggedIn ? `
        <button onclick="window.__openApplyTicketModal('${raffle.id}', '${raffle.title.replace(/'/g, "\\'")}', ${userTickets})" class="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-base">confirmation_number</span>
          이 상품에 골든 티켓 응모하기 (${userTickets}장 보유)
        </button>
      ` : `
        <button onclick="window.__requireLoginForRaffle()" class="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-base">lock</span>
          로그인하고 골든 티켓 응모하기
        </button>
      `}
    </div>`;
}

function renderTransparencyModal(raffleId) {
  const raffles = getSuperRaffles();
  const raffle = raffles.find(r => r.id === raffleId);
  if (!raffle) return '';

  const isClosed = raffle.status === 'closed';
  const loggedIn = isLoggedIn();
  const groupData = getRaffleGroupData(raffle, 'my_user_id');
  if (!loggedIn) groupData.groups.forEach(g => { g.hasMyTicket = false; g.myTicketCount = 0; });

  // Map winners by group number
  const winnerMap = {};
  if (raffle.winners) {
    raffle.winners.forEach(w => {
      winnerMap[w.groupNumber] = w.winner;
    });
  }

  return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop animate-in fade-in" id="transparency-modal" onclick="if(event.target===this)window.__closeTransparencyModal()">
      <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[85vh] flex flex-col">
        <div class="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <span class="text-[10px] font-black uppercase tracking-wider ${isClosed ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'} px-2.5 py-0.5 rounded-full">
              ${isClosed ? '✓ 추첨 마감 및 결과 확인' : '투명한 참여 현황 및 내 순번 위치'}
            </span>
            <h3 class="font-extrabold text-lg text-white mt-1">[${raffle.title}]</h3>
            <p class="text-xs text-slate-400">총 ${groupData.totalParticipants}개 티켓 응모 완료 (그룹당 ${groupData.unitSize}명 모집)</p>
          </div>
          <button onclick="window.__closeTransparencyModal()" class="text-slate-400 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          ${groupData.groups.map(g => {
            const groupWinner = winnerMap[g.groupNumber];
            return `
            <div class="border ${g.isComplete ? 'border-emerald-200' : 'border-slate-200'} rounded-2xl overflow-hidden shadow-2xs">
              <div class="p-4 ${g.isComplete ? 'bg-emerald-50/60 border-b border-emerald-200' : 'bg-slate-50 border-b border-slate-200'} flex flex-wrap justify-between items-center gap-2">
                <div class="flex items-center gap-2">
                  <span class="font-black text-sm text-gray-900">그룹 ${g.groupNumber} (슬롯 #${g.startSlot} ~ #${g.endSlot})</span>
                  ${g.isComplete ? `
                    <span class="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span class="material-symbols-outlined text-[12px]">emoji_events</span>
                      ${isClosed ? '1등 당첨자 선발 완료' : '목표 달성 (추첨 확정)'}
                    </span>
                  ` : `
                    <span class="text-[10px] font-bold ${isClosed ? 'bg-amber-100 text-amber-900' : 'bg-amber-100 text-amber-900'} px-2 py-0.5 rounded-full">
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
            럭키박스를 개봉하면 골든 티켓이 무료로 적립됩니다!
          </div>
          <button onclick="window.__closeApplyTicketModal(); window.location.hash='#box_lineup'" class="w-full py-3.5 bg-primary text-white font-bold rounded-2xl text-xs shadow-md">
            럭키박스 열고 골든티켓 받기
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
    <!-- Top Live Winning Marquee -->
    ${renderLiveTicker()}

    <main class="pt-8 pb-32 px-container-margin max-w-[1240px] mx-auto page-enter">
      
      <!-- Hero Banner -->
      <section class="mb-10">
        <div class="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-12 text-white shadow-2xl border border-slate-800">
          <div class="absolute -right-16 -bottom-16 w-80 h-80 bg-primary/30 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-16 -top-16 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-300 font-extrabold text-xs mb-4 shadow-sm">
              <span class="material-symbols-outlined text-sm">verified_user</span>
              100% 합법 & 전 품목 실물 당첨 보장 (꽝 없음)
            </div>

            <h1 class="font-black text-3xl md:text-5xl leading-tight mb-4 tracking-tight">
              꽝은 절대 없다!<br>
              <span class="gold-gradient-text">100% 실물 득템</span> + <span class="text-amber-300">골든 래플 티켓</span>
            </h1>
            <p class="text-sm md:text-base text-slate-300 mb-8 leading-relaxed">
              엄선된 디지털 가전 & 프리미엄 실물 품목 100% 득템! 적립된 골든 티켓으로 <strong>원하는 스페셜 사은품(아이폰 16 Pro 등)에 직접 응모</strong>하세요. (인원 미달 시 골든 티켓 100% 자동 환불 반환)
            </p>

            <div class="flex flex-wrap items-center gap-4">
              <a href="#box_lineup" class="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2">
                <span class="material-symbols-outlined">package_2</span>
                럭키박스 라인업 둘러보기
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
            <span class="text-xs font-black text-amber-600 uppercase tracking-widest">BONUS MULTI-GROUP DRAW</span>
            <h2 class="text-2xl md:text-3xl font-black text-gray-900 mt-1">스페셜 골든 래플 (멀티 그룹 큐 시스템)</h2>
          </div>
          <span class="text-xs text-gray-500 hidden sm:block">목표 인원 도달 그룹별 당첨자 선발 · 미달 그룹 티켓 전액 환불</span>
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

      <!-- Main Showcase: Random Box Lineup -->
      <section id="box_lineup" class="mb-16">
        <div class="flex justify-between items-end mb-6">
          <div>
            <span class="text-xs font-black text-primary uppercase tracking-widest">100% GUARANTEED LUCKYBOX</span>
            <h2 class="text-2xl md:text-3xl font-black text-gray-900 mt-1">등급별 럭키박스 라인업</h2>
          </div>
          <span class="text-xs text-gray-500 hidden sm:block">전 품목 실물 배송 가능 · 공정위 확률 고지 준수</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${boxes.map(box => renderRandomBoxCard(box)).join('')}
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

  window.__confirmApplyTickets = (raffleId) => {
    if (!requireLogin()) return;
    const input = document.getElementById('apply-ticket-input');
    const count = parseInt(input?.value || '1', 10);

    try {
      const res = applyGoldenTicketsToRaffle(raffleId, count);
      alert(`🎉 [${res.raffle.title}] 상품에 골든 티켓 ${count}장 응모가 완료되었습니다!\n(잔여 보유 티켓: ${res.remainingTickets}장)`);
      window.__closeApplyTicketModal();
      window.location.reload();
    } catch (err) {
      alert(err.message);
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

  window.__cancelTicket = (raffleId, ticketId) => {
    if (!requireLogin()) return;
    if (!confirm('이 골든 티켓 응모를 취소하시겠습니까?\n취소 시 티켓은 내 지갑으로 즉시 반환되며, 뒤 순서 참여자의 순번이 1칸씩 자동으로 앞당겨집니다.')) return;
    try {
      const res = cancelGoldenTicketApplication(raffleId, ticketId);
      alert(`✓ 골든 티켓 응모가 취소되어 내 지갑으로 환불 반환되었습니다.\n순번이 자동으로 재배열되었습니다. (잔여 보유 티켓: ${res.newAvailableBalance}장)`);
      window.__openTransparencyModal(raffleId);
    } catch (err) {
      alert(err.message);
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
}
