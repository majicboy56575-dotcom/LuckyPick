// ============================================
// LuckyPick - Admin Control Center
// Random Box & Item Pools, Special Raffles, Shipping & Financial Analytics
// ============================================
import { 
  getRandomBoxTiers, 
  saveRandomBoxTiers, 
  deleteBoxTierItem,
  updateBoxTierSettings,
  autoBalanceBoxProbabilities,
  getSuperRaffles, 
  saveSuperRaffles, 
  deleteSuperRaffle,
  forceDrawAndResolveRaffle,
  reopenRaffle,
  getAllShippingRequests, 
  updateShippingRequestStatus,
  deleteShippingRequest,
  createDemoShippingRequest,
  getUserPoints,
  setUserPoints,
  getAvailableGoldenTicketsCount,
  setAvailableGoldenTicketsCount,
  getUserVault,
  deleteVaultItem,
  getRaffleGroupData
} from '../services/randombox.js';
import { getMembers, grantUserBalanceServer } from '../services/firestore.js';

let activeAdminTab = 'boxes'; // 'boxes' | 'raffles' | 'shipping' | 'users' | 'analytics'
let selectedBoxId = 'box_basic';
let shippingFilter = 'all'; // 'all' | 'pending' | 'shipped'

function renderSidebar() {
  const menuItems = [
    { id: 'boxes', icon: 'storefront', label: '정가 상품 관리' },
    { id: 'raffles', icon: 'military_tech', label: '스페셜 골든래플 관리' },
    { id: 'shipping', icon: 'local_shipping', label: '배송 요청 관리' },
    { id: 'users', icon: 'group', label: '회원 및 포인트 관리' },
    { id: 'analytics', icon: 'monitoring', label: '실시간 매출/손익 분석' },
  ];

  return `
    <aside class="w-64 bg-slate-900 text-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex border-r border-slate-800 flex-shrink-0" id="admin-sidebar">
      <div class="space-y-6">
        <div class="px-3 py-2 flex items-center gap-2">
          <span class="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black">LP</span>
          <div>
            <h2 class="font-bold text-sm text-white">럭키픽 관리자</h2>
            <span class="text-[10px] text-emerald-400 font-mono">SYSTEM ONLINE</span>
          </div>
        </div>

        <nav class="space-y-1.5 text-xs" id="admin-nav-container">
          ${menuItems.map(item => {
            const isActive = activeAdminTab === item.id;
            return `
              <button onclick="window.__switchAdminTab('${item.id}')" data-tab-id="${item.id}" class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold transition-all text-left ${isActive ? 'bg-primary text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white hover:bg-slate-800'}">
                <span class="material-symbols-outlined text-lg">${item.icon}</span>
                <span>${item.label}</span>
              </button>`;
          }).join('')}
        </nav>
      </div>

      <div class="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
        <div class="flex justify-between font-bold text-slate-200">
          <span>개발 환경 모드</span>
          <span class="text-amber-400 font-mono">DEV LOCAL</span>
        </div>
        <p>포트: 5000 | Firestore: 8181</p>
      </div>
    </aside>`;
}

function renderBoxesTab() {
  const boxes = getRandomBoxTiers();
  const currentBox = boxes.find(b => b.id === selectedBoxId) || boxes[0];

  return `
    <div class="space-y-6">
      <!-- Tier Tabs (5,000 / 10,000 / 20,000) -->
      <div class="flex flex-wrap gap-2 border-b border-slate-200 pb-4 items-center justify-between">
        <div class="flex flex-wrap gap-2">
          ${boxes.map(b => `
            <button onclick="window.__selectAdminBox('${b.id}')" class="px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${selectedBoxId === b.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-slate-100 border border-slate-200'}">
              <span>${b.name}</span>
              <span class="text-[10px] font-mono bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold">+${b.goldenTickets}장 사은</span>
            </button>
          `).join('')}
        </div>

        <button onclick="window.__openEditBoxTierModal('${currentBox.id}')" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-200">
          <span class="material-symbols-outlined text-sm">settings</span>
          현재 상품관 설정 수정
        </button>
      </div>

      <!-- Selected Tier Overview -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-black text-xl text-gray-900">${currentBox.name}</h3>
            <span class="text-[10px] font-black bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300">
              구매 사은 골든티켓 +${currentBox.goldenTickets}장 증정
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            정가 판매가: <strong>₩${currentBox.price.toLocaleString()}원</strong> | 등록 상품 수: <strong>${currentBox.items.length}개</strong> | 슬로건: ${currentBox.tagline || ''}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button onclick="window.__openAddItemModal('${currentBox.id}')" class="px-5 py-3 bg-primary text-white font-black rounded-xl text-xs shadow-md hover:bg-primary-container transition-all flex items-center gap-2 active:scale-95">
            <span class="material-symbols-outlined text-base">add_shopping_cart</span>
            <span>새 정가 상품 등록</span>
          </button>
        </div>
      </div>

      <!-- Products Table -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h4 class="font-black text-sm text-gray-900">판매 상품 목록 (${currentBox.items.length}개 등록됨)</h4>
          <span class="text-xs text-gray-400">행 클릭 또는 [수정] 버튼으로 이미지/가격/상세정보 수정 가능</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-gray-600">
            <thead class="bg-slate-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="p-4">상품 정보</th>
                <th class="p-4">뱃지 / 태그</th>
                <th class="p-4">소비자 정가</th>
                <th class="p-4">도매 사입원가</th>
                <th class="p-4">구매 사은 혜택</th>
                <th class="p-4">60% 반품적립액</th>
                <th class="p-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              ${currentBox.items.map((item) => {
                const refundPts = Math.round(Number(item.retailPrice || currentBox.price) * 0.6);
                const price = Number(item.retailPrice || currentBox.price);
                return `
                <tr class="hover:bg-blue-50/40 transition-colors cursor-pointer group">
                  <td class="p-4 flex items-center gap-3" onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')">
                    <div class="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                      <img src="${item.image}" class="w-full h-full object-contain" alt="">
                    </div>
                    <div>
                      <p class="font-extrabold text-sm text-gray-900 group-hover:text-primary transition-colors flex items-center gap-1.5">
                        ${item.name}
                        <span class="material-symbols-outlined text-xs text-gray-300 group-hover:text-primary">edit</span>
                      </p>
                      <p class="text-[11px] text-gray-500 mt-0.5 line-clamp-1">${item.description || '100% 정품 실물 상품'}</p>
                      <p class="text-[10px] text-gray-400 font-mono mt-0.5">ID: ${item.id}</p>
                    </div>
                  </td>
                  <td class="p-4" onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')">
                    <span class="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-900 text-white shadow-2xs">
                      ${item.badge || currentBox.badge || '인기'}
                    </span>
                  </td>
                  <td class="p-4 font-mono font-black text-gray-900 text-sm" onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')">
                    ₩${price.toLocaleString()}원
                  </td>
                  <td class="p-4 font-mono font-bold text-emerald-600" onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')">
                    ₩${(item.wholesalePrice || Math.round(price * 0.4)).toLocaleString()}원
                  </td>
                  <td class="p-4" onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')">
                    <span class="font-mono font-black text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md text-[11px]">
                      🎫 티켓 +${currentBox.goldenTickets}장
                    </span>
                  </td>
                  <td class="p-4 font-mono font-bold text-slate-600" onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')">
                    ₩${refundPts.toLocaleString()} P
                  </td>
                  <td class="p-4 text-right" onclick="event.stopPropagation()">
                    <div class="flex items-center justify-end gap-1.5">
                      <button type="button" onclick="event.stopPropagation(); window.__openEditItemModal('${currentBox.id}', '${item.id}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer" title="수정">
                        <span class="material-symbols-outlined text-xs pointer-events-none">edit</span>
                        <span class="pointer-events-none">수정</span>
                      </button>
                      <button type="button" onclick="event.stopPropagation(); window.__confirmDeleteBoxItem('${currentBox.id}', '${item.id}')" class="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer" title="이 상품 삭제">
                        <span class="material-symbols-outlined text-base pointer-events-none">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function renderRafflesTab() {
  const raffles = getSuperRaffles();

  return `
    <div class="space-y-6">
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 class="font-black text-xl text-gray-900">스페셜 골든 래플 관리 (${raffles.length}개 상품)</h3>
          <p class="text-xs text-gray-500 mt-0.5">멀티 그룹 큐(Queue) 자동 생성, 100% 도달 그룹 즉시 추첨 및 미달 그룹 자동 환불 실행</p>
        </div>
        <button onclick="window.__openAddRaffleModal()" class="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center gap-1.5 hover:from-amber-400 transition-all active:scale-95">
          <span class="material-symbols-outlined text-base">add_circle</span>
          새 스페셜 래플 등록
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${raffles.map(r => {
          const groupData = getRaffleGroupData(r);
          const totalCollected = groupData.totalParticipants;
          const currentActiveGroup = groupData.groups.find(g => !g.isComplete) || groupData.groups[groupData.groups.length - 1];
          const activeFill = currentActiveGroup ? currentActiveGroup.fillPercentage : 100;
          const isClosed = r.status === 'closed';

          return `
            <div class="bg-white rounded-3xl border-2 ${isClosed ? 'border-slate-300 bg-slate-50/50' : 'border-amber-300'} p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div class="flex justify-between items-start mb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">${r.badge || 'SUPER RAFFLE'}</span>
                    <span class="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">그룹당 ${r.unitSize || 200}명</span>
                  </div>
                  <span class="text-xs font-bold ${isClosed ? 'text-gray-500' : 'text-emerald-600'} font-mono flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full ${isClosed ? 'bg-gray-400' : 'bg-emerald-500 animate-pulse'}"></span>
                    ${isClosed ? '✓ 추첨 마감 완료' : '실시간 진행 중'}
                  </span>
                </div>

                <div class="flex gap-4 items-center mb-4">
                  <img src="${r.imageUrl}" class="w-20 h-20 rounded-2xl object-cover border border-amber-200 shadow-xs flex-shrink-0" alt="">
                  <div class="min-w-0">
                    <h4 class="font-extrabold text-base text-gray-900 truncate">${r.title}</h4>
                    <p class="text-xs text-gray-500 mt-0.5 font-mono">소비자 정가: <strong>₩${r.retailPrice.toLocaleString()}원</strong></p>
                  </div>
                </div>

                <!-- Multi-Group Statistics -->
                <div class="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl space-y-2 mb-4">
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600 font-bold">총 참여 골든 티켓:</span>
                    <span class="font-black text-amber-700 font-mono text-sm">${totalCollected}장 (${groupData.completedGroupsCount}개 그룹 완료)</span>
                  </div>
                  <div class="flex justify-between items-center text-xs text-gray-500">
                    <span>현재 진행: <strong>그룹 ${currentActiveGroup ? currentActiveGroup.groupNumber : 1}</strong></span>
                    <span class="font-mono">${currentActiveGroup ? currentActiveGroup.count : 0} / ${r.unitSize || 200}장 (${activeFill}%)</span>
                  </div>
                  <div class="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" style="width: ${activeFill}%"></div>
                  </div>
                </div>
              </div>

              <div class="space-y-2 pt-2 border-t border-slate-100">
                <div class="flex gap-2">
                  <button onclick="window.__viewRaffleParticipants('${r.id}')" class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-sm">group</span>
                    참여자 순번 명단 (${totalCollected}명)
                  </button>
                  <button onclick="window.__openEditRaffleModal('${r.id}')" class="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors" title="수정">
                    <span class="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onclick="window.__deleteRaffle('${r.id}')" class="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors" title="삭제">
                    <span class="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>

                ${!isClosed ? `
                  <button onclick="window.__forceDrawRaffle('${r.id}', this)" class="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-300 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer">
                    <span class="material-symbols-outlined text-base">casino</span>
                    완료 그룹 즉시 추첨 & 미달 그룹 티켓 자동 환불 실행
                  </button>
                ` : `
                  <div class="flex gap-2">
                    <button onclick="window.__viewRaffleResults('${r.id}')" class="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm">
                      <span class="material-symbols-outlined text-sm">military_tech</span>
                      당첨자 & 환불 내역 보기 (${r.winners ? r.winners.length : 0}명 당첨)
                    </button>
                    <button onclick="window.__reopenRaffle('${r.id}')" class="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs" title="래플 재오픈 (테스트)">
                      <span class="material-symbols-outlined text-sm">replay</span>
                    </button>
                  </div>
                `}
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderShippingTab() {
  const allRequests = getAllShippingRequests();
  const pendingRequests = allRequests.filter(r => r.status !== 'shipped');
  const shippedRequests = allRequests.filter(r => r.status === 'shipped');

  const displayRequests = shippingFilter === 'pending' ? pendingRequests : shippingFilter === 'shipped' ? shippedRequests : allRequests;

  return `
    <div class="space-y-6">
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 class="font-black text-xl text-gray-900">배송 요청 관리 (${allRequests.length}건)</h3>
          <p class="text-xs text-gray-500 mt-0.5">유저들이 보관함에서 신청한 실물 상품 배송 요청 처리 및 운송장 입력</p>
        </div>
        <div class="flex gap-2">
          <button onclick="window.__createDemoShipping()" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">add</span>
            + 테스트 배송 접수 생성
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-2 border-b border-slate-200 pb-3">
        <button onclick="window.__setShippingFilter('all')" class="px-4 py-2 rounded-xl text-xs font-bold ${shippingFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-slate-100 border border-slate-200'}">
          전체 (${allRequests.length})
        </button>
        <button onclick="window.__setShippingFilter('pending')" class="px-4 py-2 rounded-xl text-xs font-bold ${shippingFilter === 'pending' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-blue-600 hover:bg-blue-50 border border-slate-200'}">
          ⏳ 출고 대기 (${pendingRequests.length})
        </button>
        <button onclick="window.__setShippingFilter('shipped')" class="px-4 py-2 rounded-xl text-xs font-bold ${shippingFilter === 'shipped' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-emerald-600 hover:bg-emerald-50 border border-slate-200'}">
          ✓ 출고 완료 (${shippedRequests.length})
        </button>
      </div>

      ${displayRequests.length === 0 ? `
        <div class="bg-white rounded-3xl p-12 text-center border border-slate-200 text-xs text-gray-500">
          해당 조건의 배송 요청 내역이 없습니다.
        </div>
      ` : `
        <div class="space-y-4">
          ${displayRequests.map(req => {
            const isShipped = req.status === 'shipped';
            const isSpecial = Boolean(req.isSpecialGift || (Number(req.retailPrice) > 50000) || (Number(req.taxAmount) > 0));
            const taxAmount = req.taxAmount || (isSpecial ? Math.round(Number(req.retailPrice) * 0.22) : 0);
            const taxStatus = req.taxStatus || (isSpecial ? 'pending' : 'none');
            const depositName = req.taxDepositName || req.recipientName || req.shippingData?.name || '';
            const hasIdCard = Boolean(req.taxIdCardImage);
            const title = req.itemTitle || req.productTitle || '사은품 상품';
            const recipientName = req.shippingData?.name || req.recipientName || '홍길동';
            const recipientPhone = req.shippingData?.phone || req.recipientPhone || '010-1234-5678';
            const shippingAddress = req.shippingData?.address || req.shippingAddress || '배송지 정보';
            const memo = req.shippingData?.memo || req.shippingMemo || '';

            return `
              <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div class="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
                  <div class="flex items-center gap-3">
                    <img src="${req.imageUrl}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs" alt="">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] font-mono text-gray-400 block">${req.shippingId}</span>
                        ${isSpecial ? '<span class="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">5만 원 초과 스페셜</span>' : ''}
                      </div>
                      <h4 class="font-bold text-sm text-gray-900">${title}</h4>
                      <p class="text-[11px] text-gray-500 font-mono">정가: ₩${req.retailPrice?.toLocaleString()}원</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    ${isSpecial ? `
                      <span class="text-xs font-black px-2.5 py-1 rounded-full ${taxStatus === 'verified' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs'}">
                        ${taxStatus === 'verified' ? '✓ 제세공과금 승인 완료' : '<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>제세공과금 입금 확인 필요'}
                      </span>
                    ` : ''}
                    <span class="text-xs font-black px-3 py-1 rounded-full ${isShipped ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">
                      ${isShipped ? '✓ 출고 완료' : '⏳ 배송 접수 대기'}
                    </span>
                    <button onclick="window.__deleteShipping('${req.shippingId}')" class="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer" title="요청 삭제">
                      <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                ${isSpecial ? `
                <!-- Special Gift Tax & ID Card Verification Panel -->
                <div class="p-4 bg-amber-50/70 border-2 border-amber-300 rounded-2xl text-xs space-y-3">
                  <div class="flex flex-wrap justify-between items-center gap-2">
                    <div class="flex items-center gap-2 font-black text-amber-950">
                      <span class="material-symbols-outlined text-amber-600 text-base">verified_user</span>
                      <span>[5만 원 초과 스페셜 사은품] 제세공과금 22% 입금 및 국세청 신분증 서류</span>
                    </div>
                    <span class="text-[11px] font-black px-2.5 py-0.5 rounded-full ${taxStatus === 'verified' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-200 text-amber-950 border border-amber-400 animate-pulse'}">
                      ${taxStatus === 'verified' ? '✓ 관리자 서류·입금 승인 완료' : '⏳ 카카오뱅크 입금 및 신분증 대조 필요'}
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div class="bg-white p-3 rounded-xl border border-amber-200">
                      <span class="text-[10px] text-gray-500 font-bold block">제세공과금 (22%)</span>
                      <span class="text-amber-700 font-black text-sm">₩${taxAmount.toLocaleString()}원</span>
                      <span class="text-[9px] text-gray-400 block mt-0.5 font-sans">카카오뱅크 3333-05-0344911</span>
                    </div>
                    <div class="bg-white p-3 rounded-xl border border-amber-200">
                      <span class="text-[10px] text-gray-500 font-bold block">유저 입력 입금자 성명</span>
                      <span class="text-gray-900 font-black text-sm">${depositName || '미기재'}</span>
                      <span class="text-[9px] text-gray-400 block mt-0.5 font-sans">실시간 통장 내역 대조</span>
                    </div>
                    <div class="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between">
                      <div>
                        <span class="text-[10px] text-gray-500 font-bold block">국세청 신분증 사본</span>
                        <span class="${hasIdCard ? 'text-blue-600 font-bold' : 'text-gray-400 font-bold'}">${hasIdCard ? '첨부 완료 (대조 가능)' : '미첨부'}</span>
                      </div>
                      ${hasIdCard ? `
                        <button type="button" onclick="window.__previewAdminIdCard('${req.shippingId}')" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[11px] shadow-xs cursor-pointer flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs">visibility</span>
                          신분증 보기
                        </button>
                      ` : ''}
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
                    <p class="text-[11px] text-amber-900/90 leading-tight">
                      ※ 카카오뱅크 통장 입금 및 신분증 사본의 성명이 일치하는지 확인 후 승인 버튼을 눌러주세요.
                    </p>
                    ${taxStatus !== 'verified' ? `
                      <button type="button" onclick="window.__verifyShippingTax('${req.shippingId}')" class="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer">
                        <span class="material-symbols-outlined text-sm">check_circle</span>
                        제세공과금 입금 및 신분증 확인 승인
                      </button>
                    ` : `
                      <span class="text-xs text-emerald-700 font-extrabold flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">verified</span>
                        승인 완료 (운송장 입력 및 출고 가능)
                      </span>
                    `}
                  </div>
                </div>
                ` : ''}

                <div class="bg-slate-50 p-4 rounded-2xl text-xs space-y-1.5">
                  <div class="flex flex-wrap justify-between items-center pb-1.5 border-b border-slate-200/60">
                    <p><strong>수령인:</strong> ${recipientName} (${recipientPhone})</p>
                    <span class="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full font-mono">
                      배송비 ₩${(req.shippingFee || 3000).toLocaleString()}원 (${req.shippingPayMethod === 'points' ? '포인트 결제' : req.shippingPayMethod === 'toss' ? '토스 결제' : req.shippingPayMethod === 'easy_pay' ? '간편결제' : req.shippingPayMethod === 'paypal' ? 'PayPal' : req.shippingPayMethod === 'bank_transfer' ? '계좌 입금' : '결제 완료'}${isSpecial ? ' · 사은품' : ''})
                    </span>
                  </div>
                  <p><strong>배송지:</strong> ${shippingAddress}</p>
                  ${memo ? `<p class="text-gray-500"><strong>배송 메모:</strong> ${memo}</p>` : ''}
                </div>

                <!-- Carrier and Tracking -->
                <div class="flex flex-wrap items-center gap-3 pt-2">
                  <select id="carrier-${req.shippingId}" class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary font-bold">
                    <option value="CJ대한통운" ${req.carrier === 'CJ대한통운' ? 'selected' : ''}>CJ대한통운</option>
                    <option value="우체국택배" ${req.carrier === '우체국택배' ? 'selected' : ''}>우체국택배</option>
                    <option value="한진택배" ${req.carrier === '한진택배' ? 'selected' : ''}>한진택배</option>
                    <option value="로젠택배" ${req.carrier === '로젠택배' ? 'selected' : ''}>로젠택배</option>
                    <option value="롯데택배" ${req.carrier === '롯데택배' ? 'selected' : ''}>롯데택배</option>
                  </select>

                  <input type="text" id="track-${req.shippingId}" value="${req.trackingNumber || ''}" placeholder="운송장 번호 입력" class="flex-1 min-w-[200px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono outline-none focus:border-primary font-bold">

                  <button onclick="window.__updateTracking('${req.shippingId}')" class="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-container transition-colors shadow-xs active:scale-95 cursor-pointer">
                    ${isShipped ? '운송장 수정 저장' : '송장 등록 및 출고 완료'}
                  </button>
                </div>
              </div>`;
          }).join('')}
        </div>
      `}
    </div>`;
}

function renderUsersTab() {
  const members = getMembers();
  const totalPoints = members.reduce((sum, m) => sum + (Number(m.points) || 0), 0);
  const totalTickets = members.reduce((sum, m) => sum + (Number(m.goldenTickets) || 0), 0);
  const totalVaultItems = members.reduce((sum, m) => sum + (Number(m.vaultCount) || 0), 0);

  return `
    <div class="space-y-6">
      <!-- Title & Summary Header -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-black text-xl text-gray-900">회원 및 지갑 관리</h3>
            <span class="text-xs font-black bg-primary text-white px-2.5 py-0.5 rounded-full">${members.length}명 등록</span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">전체 가입 회원 명부 실시간 조회 및 회원별 포인트/골든티켓 직접 지급·차감 관리</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.__switchAdminTab('users')" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer" title="회원 목록 새로고침">
            <span class="material-symbols-outlined text-sm">refresh</span>
            새로고침
          </button>
          <button onclick="window.__resetAllTestData()" class="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-sm">restart_alt</span>
            내 테스트 데이터 초기화
          </button>
        </div>
      </div>

      <!-- 4 KPI Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span class="text-[10px] font-bold text-gray-400 uppercase block">총 가입 회원</span>
          <span class="font-black text-2xl text-slate-900 font-mono mt-1 block">${members.length.toLocaleString()}명</span>
          <span class="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            정상 활동 계정 100%
          </span>
        </div>

        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span class="text-[10px] font-bold text-gray-400 uppercase block">총 유통 포인트</span>
          <span class="font-black text-2xl text-primary font-mono mt-1 block">₩${totalPoints.toLocaleString()} P</span>
          <span class="text-[11px] text-gray-400 mt-1 block">회원 보유 잔액 합계</span>
        </div>

        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span class="text-[10px] font-bold text-gray-400 uppercase block">총 발행 골든티켓</span>
          <span class="font-black text-2xl text-amber-600 font-mono mt-1 block">${totalTickets.toLocaleString()}장</span>
          <span class="text-[11px] text-amber-500 font-bold mt-1 block">래플 응모 가능 티켓</span>
        </div>

        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span class="text-[10px] font-bold text-gray-400 uppercase block">총 보관함 상품</span>
          <span class="font-black text-2xl text-indigo-600 font-mono mt-1 block">${totalVaultItems.toLocaleString()}건</span>
          <span class="text-[11px] text-gray-400 mt-1 block">미배송/보관 실물 상품</span>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div class="relative flex-1 min-w-[240px]">
          <span class="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">search</span>
          <input 
            type="text" 
            id="admin-member-search" 
            oninput="window.__filterAdminMembers(this.value)" 
            placeholder="회원 이름, 이메일, UID로 실시간 검색..." 
            class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          >
        </div>
        <span class="text-xs text-gray-400 font-bold" id="admin-member-count-label">
          검색 결과: ${members.length}명
        </span>
      </div>

      <!-- Full Member Table -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th class="py-3.5 px-5">회원 정보</th>
                <th class="py-3.5 px-4">가입일시</th>
                <th class="py-3.5 px-4 text-center">권한</th>
                <th class="py-3.5 px-4 text-right">보유 포인트</th>
                <th class="py-3.5 px-4 text-right">골든 티켓</th>
                <th class="py-3.5 px-4 text-center">보관함 상품</th>
                <th class="py-3.5 px-5 text-center">관리 액션</th>
              </tr>
            </thead>
            <tbody id="admin-members-tbody" class="divide-y divide-slate-100 text-xs">
              ${members.map((m) => `
                <tr class="hover:bg-slate-50/70 transition-colors member-row" data-search="${(m.name + ' ' + m.email + ' ' + m.uid).toLowerCase()}">
                  <!-- User Info -->
                  <td class="py-4 px-5">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr ${m.role === 'admin' ? 'from-amber-400 to-amber-600 text-slate-950 font-black' : 'from-slate-700 to-slate-900 text-white font-bold'} flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                        ${m.initials}
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                          <span class="font-extrabold text-sm text-gray-900 truncate">${m.name}</span>
                          ${m.role === 'admin' ? '<span class="text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-mono">ADMIN</span>' : ''}
                        </div>
                        <p class="text-xs text-gray-500 font-mono truncate">${m.email}</p>
                        <p class="text-[10px] text-gray-400 font-mono">UID: ${m.uid}</p>
                      </div>
                    </div>
                  </td>

                  <!-- Join Date -->
                  <td class="py-4 px-4 font-mono text-gray-600 text-xs whitespace-nowrap">
                    ${m.joinDate}
                  </td>

                  <!-- Role / Status -->
                  <td class="py-4 px-4 text-center whitespace-nowrap">
                    <span class="text-[10px] font-extrabold px-2.5 py-1 rounded-full ${m.role === 'admin' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700 border border-slate-200'}">
                      ${m.role === 'admin' ? '운영 관리자' : '일반 회원'}
                    </span>
                  </td>

                  <!-- Points -->
                  <td class="py-4 px-4 text-right font-mono font-black text-sm text-primary whitespace-nowrap">
                    ₩${m.points.toLocaleString()} P
                  </td>

                  <!-- Tickets -->
                  <td class="py-4 px-4 text-right font-mono font-black text-sm text-amber-600 whitespace-nowrap">
                    ${m.goldenTickets.toLocaleString()}장
                  </td>

                  <!-- Vault Count -->
                  <td class="py-4 px-4 text-center whitespace-nowrap">
                    <span class="font-mono font-bold text-xs ${m.vaultCount > 0 ? 'text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100' : 'text-gray-400'}">
                      ${m.vaultCount}건
                    </span>
                  </td>

                  <!-- Action Buttons -->
                  <td class="py-4 px-5 text-center whitespace-nowrap">
                    <div class="flex items-center justify-center gap-1.5">
                      <button onclick="window.__openUserWalletModal('${m.uid}')" class="px-3 py-1.5 bg-primary hover:bg-primary-container text-white font-bold rounded-xl text-xs transition-all shadow-2xs flex items-center gap-1 cursor-pointer">
                        <span class="material-symbols-outlined text-sm">account_balance_wallet</span>
                        재화 관리
                      </button>
                      <button onclick="window.__openUserVaultModal('${m.uid}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer" title="회원 보관함 상품 조회">
                        <span class="material-symbols-outlined text-sm">inventory_2</span>
                        보관함
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function renderAnalyticsTab() {
  const vault = getUserVault();
  const boxes = getRandomBoxTiers();
  
  // Calculate dynamic metrics from pure real user transactions (Reset to 0-based clean start)
  const unboxedCount = vault.length;
  const convertedCount = vault.filter(v => v.status === 'converted_to_points').length;
  const shippedCount = vault.filter(v => v.status === 'shipping_requested' || v.status === 'shipped').length;
  
  // Real transaction values (0 if no real transactions yet)
  const totalGMV = vault.reduce((acc, v) => acc + (Number(v.boxPrice || v.price) || 0), 0);
  const totalCOGS = vault.reduce((acc, v) => acc + (Number(v.wholesalePrice) || 0), 0);
  const netProfit = totalGMV - totalCOGS;
  const marginRate = totalGMV > 0 ? Math.round((netProfit / totalGMV) * 100) : 0;
  const defenseRate = unboxedCount > 0 ? Math.round((convertedCount / unboxedCount) * 100) : 0;

  return `
    <div class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span class="text-[10px] font-bold text-gray-400 uppercase">TOTAL GMV (총 결제액)</span>
          <h4 class="font-black text-2xl text-gray-900 mt-2 font-mono">₩${totalGMV.toLocaleString()}원</h4>
          <span class="text-[11px] ${totalGMV > 0 ? 'text-emerald-600' : 'text-gray-400'} font-bold mt-1 block">${totalGMV > 0 ? '▲ 실결제 누적' : '실결제 대기 중'}</span>
        </div>

        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span class="text-[10px] font-bold text-gray-400 uppercase">도매 사입 원가 (COGS)</span>
          <h4 class="font-black text-2xl text-slate-700 mt-2 font-mono">₩${totalCOGS.toLocaleString()}원</h4>
          <span class="text-[11px] text-gray-500 mt-1 block">원가율 ${totalGMV > 0 ? (100 - marginRate).toFixed(1) : '0.0'}% (도매 B2B)</span>
        </div>

        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span class="text-[10px] font-bold text-gray-400 uppercase">플랫폼 순수익 (NET PROFIT)</span>
          <h4 class="font-black text-2xl ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'} mt-2 font-mono">₩${netProfit.toLocaleString()}원</h4>
          <span class="text-[11px] text-emerald-700 font-bold mt-1 block">순마진율 ${marginRate}%</span>
        </div>

        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span class="text-[10px] font-bold text-gray-400 uppercase">포인트 전환 방어율</span>
          <h4 class="font-black text-2xl text-primary mt-2 font-mono">${defenseRate}%</h4>
          <span class="text-[11px] text-primary font-bold mt-1 block">물류비 0원 즉시 방어</span>
        </div>
      </div>

      <!-- Box Performance Breakdown -->
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h4 class="font-bold text-sm text-gray-900">등급별 상품 픽 마진 및 사입 구조 분석</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-gray-600">
            <thead class="bg-slate-50 text-[11px] font-bold text-gray-400 uppercase border-b">
              <tr>
                <th class="p-3">박스명</th>
                <th class="p-3">판매가</th>
                <th class="p-3">지급 골든티켓</th>
                <th class="p-3">등록 품목수</th>
                <th class="p-3">평균 사입원가</th>
                <th class="p-3">최소 보장액</th>
                <th class="p-3">기대 수익률</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              ${boxes.map(b => {
                const avgWholesale = Math.round(b.items.reduce((acc, it) => acc + (it.wholesalePrice || it.retailPrice * 0.25), 0) / (b.items.length || 1));
                const expectedProfit = b.price - avgWholesale;
                return `
                <tr>
                  <td class="p-3 font-bold text-gray-900">${b.name}</td>
                  <td class="p-3 font-mono font-bold text-primary">₩${b.price.toLocaleString()}원</td>
                  <td class="p-3 font-mono text-amber-600 font-bold">+${b.goldenTickets}장</td>
                  <td class="p-3 font-mono">${b.items.length}개</td>
                  <td class="p-3 font-mono text-emerald-600">₩${avgWholesale.toLocaleString()}원</td>
                  <td class="p-3 font-mono">₩${b.minGuaranteedValue.toLocaleString()}원</td>
                  <td class="p-3 font-mono font-bold text-emerald-700">₩${expectedProfit.toLocaleString()}원 (${Math.round((expectedProfit / b.price) * 100)}%)</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function renderAdminContent() {
  return `
    <!-- Top Bar -->
    <header class="h-16 bg-slate-900 text-white flex justify-between items-center px-6 fixed top-0 w-full z-50 border-b border-slate-800">
      <div class="flex items-center gap-3">
        <span class="font-black text-lg text-primary">LuckyPick</span>
        <span class="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 font-mono">ADMIN v2.0</span>
      </div>
      <button onclick="window.location.hash='#home'" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm">
        <span class="material-symbols-outlined text-sm">home</span>
        쇼핑몰 홈으로 이동
      </button>
    </header>

    <div class="flex flex-grow w-full">
      <!-- Sidebar with Active State -->
      ${renderSidebar()}

      <!-- Main Content Area -->
      <main class="flex-grow p-6 md:p-8 max-w-7xl mx-auto w-full page-enter">
        <div id="admin-tab-content">
          ${activeAdminTab === 'boxes' ? renderBoxesTab() : activeAdminTab === 'raffles' ? renderRafflesTab() : activeAdminTab === 'shipping' ? renderShippingTab() : activeAdminTab === 'users' ? renderUsersTab() : renderAnalyticsTab()}
        </div>
      </main>
    </div>

    <div id="admin-modal-container"></div>`;
}

export function render() {
  const html = `
    <div class="min-h-screen bg-slate-100 flex flex-col pt-16" id="admin-root-container">
      ${renderAdminContent()}
    </div>`;

  // --- Handlers ---
  window.__switchAdminTab = (tab) => {
    activeAdminTab = tab;
    const tabContent = document.getElementById('admin-tab-content');
    if (tabContent) {
      if (tab === 'boxes') tabContent.innerHTML = renderBoxesTab();
      else if (tab === 'raffles') tabContent.innerHTML = renderRafflesTab();
      else if (tab === 'shipping') tabContent.innerHTML = renderShippingTab();
      else if (tab === 'users') tabContent.innerHTML = renderUsersTab();
      else if (tab === 'analytics') tabContent.innerHTML = renderAnalyticsTab();
    }

    // Update Sidebar Active Styles
    const navButtons = document.querySelectorAll('#admin-nav-container button');
    navButtons.forEach(btn => {
      const btnTab = btn.getAttribute('data-tab-id');
      if (btnTab === tab) {
        btn.className = 'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold transition-all text-left bg-primary text-white shadow-md font-extrabold';
      } else {
        btn.className = 'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold transition-all text-left text-slate-400 hover:text-white hover:bg-slate-800';
      }
    });
  };

  window.__selectAdminBox = (boxId) => {
    selectedBoxId = boxId;
    window.__switchAdminTab('boxes');
  };

  window.__setShippingFilter = (filter) => {
    shippingFilter = filter;
    window.__switchAdminTab('shipping');
  };

  // Image Upload Handler: 100% Full Visibility (No Crop), Smart Aspect Ratio Preservation & Lightweight Compression
  window.__handleImageUpload = (e, targetInputId, previewImgId, btnId) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      alert('이미지 파일 용량은 25MB 이하만 등록 가능합니다.');
      return;
    }

    const btn = btnId ? document.getElementById(btnId) : null;
    const originalBtnHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">sync</span> 원본 전체(No Crop) 자동 보정 중...`;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Determine Target Specs based on context (Raffle showcase vs Box items)
        const isRaffle = String(targetInputId).includes('raffle');
        // For special raffles: Wide showcase ratio (800x600, 4:3)
        // For box items: Clean square ratio (600x600, 1:1)
        const TARGET_W = isRaffle ? 800 : 600;
        const TARGET_H = 600;

        // 1. Calculate aspect-preserving fit scale (Never crop! 100% of original image visible)
        // Leave a subtle 4% margin so the product breathes nicely inside the card
        const paddingFactor = 0.94;
        const maxDrawW = TARGET_W * paddingFactor;
        const maxDrawH = TARGET_H * paddingFactor;

        const scale = Math.min(maxDrawW / img.width, maxDrawH / img.height);
        const drawW = Math.round(img.width * scale);
        const drawH = Math.round(img.height * scale);
        const drawX = Math.round((TARGET_W - drawW) / 2);
        const drawY = Math.round((TARGET_H - drawH) / 2);

        const canvas = document.createElement('canvas');
        canvas.width = TARGET_W;
        canvas.height = TARGET_H;
        const ctx = canvas.getContext('2d');

        // High quality downsampling & smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 2. Smart Background Sampling from original image edges (Seamless letterboxing)
        let bgStyle = '#FFFFFF';
        try {
          const sampleCanvas = document.createElement('canvas');
          sampleCanvas.width = img.width;
          sampleCanvas.height = img.height;
          const sampleCtx = sampleCanvas.getContext('2d');
          sampleCtx.drawImage(img, 0, 0);
          const p = sampleCtx.getImageData(0, 0, 1, 1).data;
          // If corner pixel is not completely transparent, use it
          if (p[3] > 50) {
            bgStyle = `rgb(${p[0]}, ${p[1]}, ${p[2]})`;
          }
        } catch (_) {
          bgStyle = '#FFFFFF';
        }

        // Clean background fill
        ctx.fillStyle = bgStyle;
        ctx.fillRect(0, 0, TARGET_W, TARGET_H);

        // 3. Draw full original image centered without ANY clipping
        ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawW, drawH);

        // 4. Compress to high-efficiency Web JPEG (~40-70KB) to ensure super-fast mobile loading and Firestore doc safety
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        // Calculate size savings
        const originalKb = Math.round(file.size / 1024);
        const optimizedKb = Math.max(1, Math.round((compressedDataUrl.length * 3 / 4) / 1024));
        const savedPercent = Math.max(0, Math.round((1 - optimizedKb / originalKb) * 100));

        const input = document.getElementById(targetInputId);
        const preview = document.getElementById(previewImgId);
        if (input) {
          input.value = compressedDataUrl;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (preview) {
          preview.src = compressedDataUrl;
          preview.className = 'w-full h-full object-contain bg-white p-0.5';
        }

        // 5. Update button text with success feedback
        if (btn) {
          btn.innerHTML = `<span class="material-symbols-outlined text-sm text-emerald-400">check_circle</span> 원본 100% 보존 (${TARGET_W}×${TARGET_H}) 완료!`;
          btn.classList.add('bg-emerald-950', 'text-emerald-300', 'border', 'border-emerald-500/40');
        }

        // 6. Add or update real-time optimization info badge below the input
        const container = input ? input.parentElement : null;
        if (container) {
          let badge = container.querySelector('.img-opt-badge');
          if (!badge) {
            badge = document.createElement('div');
            badge.className = 'img-opt-badge flex items-center justify-between text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mt-1.5 font-mono shadow-2xs';
            container.appendChild(badge);
          }
          badge.innerHTML = `
            <span class="flex items-center gap-1 font-bold text-emerald-900">
              <span class="material-symbols-outlined text-xs text-emerald-600">aspect_ratio</span> ${TARGET_W}×${TARGET_H} (잘림 없는 원본 100% 보존)
            </span>
            <span class="text-emerald-700">
              ${originalKb.toLocaleString()}KB ➔ <strong>${optimizedKb.toLocaleString()}KB</strong> <span class="bg-emerald-200/80 text-emerald-900 font-bold px-1 rounded text-[9px]">-${savedPercent}%</span>
            </span>
          `;
        }
      };
      img.onerror = () => {
        if (btn) btn.innerHTML = originalBtnHtml;
        alert('이미지 파일을 읽을 수 없습니다. 정상적인 사진 파일(JPG, PNG, WebP)을 선택해주세요.');
      };
      img.src = ev.target.result;
    };
    reader.onerror = () => {
      if (btn) btn.innerHTML = originalBtnHtml;
      alert('파일을 읽는 중 오류가 발생했습니다.');
    };
    reader.readAsDataURL(file);
  };

  window.__closeAdminModal = () => {
    const modalContainer = document.getElementById('admin-modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
  };

  // --- 1. Box Tier & Item Management ---
  window.__openEditBoxTierModal = (boxId) => {
    const boxes = getRandomBoxTiers();
    const box = boxes.find(b => String(b.id) === String(boxId));
    if (!box) return;

    const modalHtml = `
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop bg-black/60 backdrop-blur-sm" id="admin-item-modal" onclick="if(event.target===this)window.__closeAdminModal()">
        <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
          <div class="flex justify-between items-center border-b pb-3">
            <h3 class="font-bold text-lg text-gray-900">${box.name} 기본설정 수정</h3>
            <button onclick="window.__closeAdminModal()" class="text-gray-400 hover:text-gray-600">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="font-bold block text-gray-700 mb-1">박스명</label>
              <input type="text" id="tier-name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" value="${box.name}">
            </div>
            <div>
              <label class="font-bold block text-gray-700 mb-1">한줄 슬로건</label>
              <input type="text" id="tier-tagline" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" value="${box.tagline || ''}">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-bold block text-gray-700 mb-1">개봉 가격 (원)</label>
                <input type="number" id="tier-price" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-primary" value="${box.price}">
              </div>
              <div>
                <label class="font-bold block text-gray-700 mb-1">골든티켓 지급수 (장)</label>
                <input type="number" id="tier-tickets" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-600" value="${box.goldenTickets}">
              </div>
            </div>
            <div>
              <label class="font-bold block text-gray-700 mb-1">최소 보장 가치 (원)</label>
              <input type="number" id="tier-minval" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600" value="${box.minGuaranteedValue}">
            </div>
          </div>
          <div class="flex gap-2 pt-2 border-t">
            <button onclick="window.__closeAdminModal()" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs">취소</button>
            <button onclick="window.__saveEditedBoxTier('${box.id}')" class="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl text-xs shadow-md">저장하기</button>
          </div>
        </div>
      </div>`;
    document.getElementById('admin-modal-container').innerHTML = modalHtml;
  };

  window.__saveEditedBoxTier = async (boxId) => {
    const name = document.getElementById('tier-name')?.value?.trim();
    const tagline = document.getElementById('tier-tagline')?.value?.trim();
    const price = parseInt(document.getElementById('tier-price')?.value, 10);
    const goldenTickets = parseInt(document.getElementById('tier-tickets')?.value, 10);
    const minGuaranteedValue = parseInt(document.getElementById('tier-minval')?.value, 10);

    if (!name || isNaN(price)) {
      alert('박스명과 가격을 올바르게 입력해주세요.');
      return;
    }

    try {
      await updateBoxTierSettings(boxId, { name, tagline, price, goldenTickets, minGuaranteedValue });
      window.__closeAdminModal();
      alert('✓ 상품 픽 기본 설정이 서버 DB에 정상 저장되었습니다.');
      window.__switchAdminTab('boxes');
    } catch (err) {
      console.error('[Admin] saveEditedBoxTier error:', err);
      alert('❌ 서버 DB 저장 실패: ' + err.message);
    }
  };

  window.__autoBalanceProbs = async (boxId) => {
    try {
      await autoBalanceBoxProbabilities(boxId);
      alert('✓ 모든 품목의 확률 합계가 정확히 100%로 균등 조정되어 서버 DB에 저장되었습니다.');
      window.__switchAdminTab('boxes');
    } catch (err) {
      console.error('[Admin] autoBalanceProbs error:', err);
      alert('❌ 확률 서버 저장 실패: ' + err.message);
    }
  };

  window.__confirmDeleteBoxItem = (boxId, itemId) => {
    const boxes = getRandomBoxTiers();
    const box = boxes.find(b => String(b.id) === String(boxId));
    const item = box ? (box.items || []).find(it => String(it.id) === String(itemId)) : null;
    const itemName = item ? item.name : '해당 상품';

    const modalContainer = document.getElementById('admin-modal-container') || document.body;
    const modalHtml = `
      <div class="fixed inset-0 z-[120] flex items-center justify-center p-4 modal-backdrop bg-black/60 backdrop-blur-sm animate-in fade-in" id="admin-delete-modal" onclick="if(event.target===this)document.getElementById('admin-delete-modal')?.remove()">
        <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95">
          <div class="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <span class="material-symbols-outlined text-3xl">delete_forever</span>
          </div>
          <div>
            <h3 class="font-extrabold text-base text-gray-900">정말 이 상품을 삭제하시겠습니까?</h3>
            <p class="text-xs text-gray-700 mt-1 font-bold">[${itemName}]</p>
            <p class="text-[11px] text-gray-400 mt-1">삭제된 상품은 데이터베이스에서 즉시 제거됩니다.</p>
          </div>
          <div class="flex gap-2 pt-2">
            <button type="button" onclick="document.getElementById('admin-delete-modal')?.remove()" class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer">
              취소
            </button>
            <button type="button" id="btn-confirm-delete" onclick="window.__executeDeleteBoxItem('${boxId}', '${itemId}')" class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer">
              삭제하기
            </button>
          </div>
        </div>
      </div>`;
    
    // Remove any existing delete modal
    const existingModal = document.getElementById('admin-delete-modal');
    if (existingModal) existingModal.remove();

    modalContainer.insertAdjacentHTML('beforeend', modalHtml);
  };

  window.__executeDeleteBoxItem = async (boxId, itemId) => {
    const btn = document.getElementById('btn-confirm-delete');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">sync</span> 삭제 중...`;
    }

    try {
      await deleteBoxTierItem(boxId, itemId);
      document.getElementById('admin-delete-modal')?.remove();
      window.__closeAdminModal();
      window.__switchAdminTab('boxes');
      alert('✓ 상품이 정상적으로 삭제되었습니다.');
    } catch (err) {
      console.error('[Admin] executeDeleteBoxItem error:', err);
      alert('❌ 상품 삭제 처리 실패: ' + err.message);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '삭제하기';
      }
    }
  };

  // Backwards compatibility
  window.__deleteBoxItem = window.__confirmDeleteBoxItem;

  window.__openAddItemModal = (boxId) => {
    const boxes = getRandomBoxTiers();
    const box = boxes.find(b => b.id === boxId) || boxes[0];
    const defaultPrice = box.price || 5000;

    const modalHtml = `
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop bg-black/60 backdrop-blur-sm" id="admin-item-modal" onclick="if(event.target===this)window.__closeAdminModal()">
        <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div class="flex justify-between items-center border-b pb-3">
            <h3 class="font-bold text-lg text-gray-900">${box.name} 새 상품 등록</h3>
            <button onclick="window.__closeAdminModal()" class="text-gray-400 hover:text-gray-600">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="font-bold block text-gray-700 mb-1">상품명</label>
              <input type="text" id="modal-item-name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" placeholder="예: 무선 블루투스 마우스">
            </div>
            <div>
              <label class="font-bold block text-gray-700 mb-1">상품 간단 설명</label>
              <input type="text" id="modal-item-desc" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" placeholder="예: 초경량 무소음 무선 연결 및 고감도 DPI 센서">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-bold block text-gray-700 mb-1">뱃지 / 태그</label>
                <input type="text" id="modal-item-badge" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" placeholder="인기 1위, MD추천 등" value="MD추천">
              </div>
              <div>
                <label class="font-bold block text-gray-700 mb-1">최소주문(MOQ)</label>
                <input type="text" id="modal-item-moq" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" value="1개 (낱개발송)">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-bold block text-gray-700 mb-1">소비자 정가 (원)</label>
                <input type="number" id="modal-item-retail" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-900" value="${defaultPrice}">
              </div>
              <div>
                <label class="font-bold block text-gray-700 mb-1">도매 사입원가 (원)</label>
                <input type="number" id="modal-item-wholesale" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600" value="${Math.round(defaultPrice * 0.4)}">
              </div>
            </div>

            <!-- Laptop File Upload + URL Input -->
            <div class="space-y-1.5 pt-1">
              <label class="font-bold block text-gray-700">상품 이미지 (노트북 사진 업로드 / URL)</label>
              <div class="flex items-center gap-3">
                <div class="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-primary shadow-2xs" onclick="document.getElementById('modal-item-file').click()" title="클릭하여 내 노트북에서 사진 선택">
                  <img id="modal-item-preview" src="assets/products/phonestand_metal.jpg" class="w-full h-full object-contain bg-white p-0.5" alt="">
                </div>
                <div class="flex-1 space-y-1.5">
                  <button type="button" id="modal-add-item-upload-btn" onclick="document.getElementById('modal-item-file').click()" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs transition-colors">
                    <span class="material-symbols-outlined text-sm">upload_file</span>
                    내 노트북에서 사진 올리기
                  </button>
                  <input type="file" id="modal-item-file" accept="image/*" class="hidden" onchange="window.__handleImageUpload(event, 'modal-item-img', 'modal-item-preview', 'modal-add-item-upload-btn'); this.value = '';">
                  <input type="text" id="modal-item-img" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-gray-600" value="assets/products/phonestand_metal.jpg" placeholder="또는 웹 이미지 URL 입력">
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-2 pt-2 border-t">
            <button onclick="window.__closeAdminModal()" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs">취소</button>
            <button onclick="window.__saveNewItem('${boxId}')" class="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl text-xs shadow-md">등록하기</button>
          </div>
        </div>
      </div>`;
    document.getElementById('admin-modal-container').innerHTML = modalHtml;
  };

  window.__openEditItemModal = (boxId, itemId) => {
    const boxes = getRandomBoxTiers();
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    const item = box.items.find(it => it.id === itemId);
    if (!item) return;

    const modalHtml = `
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop bg-black/60 backdrop-blur-sm" id="admin-item-modal" onclick="if(event.target===this)window.__closeAdminModal()">
        <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div class="flex justify-between items-center border-b pb-3">
            <div>
              <h3 class="font-bold text-lg text-gray-900">상품 정보 수정</h3>
              <p class="text-[10px] text-gray-400 font-mono">ID: ${item.id}</p>
            </div>
            <button onclick="window.__closeAdminModal()" class="text-gray-400 hover:text-gray-600">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="font-bold block text-gray-700 mb-1">상품명</label>
              <input type="text" id="modal-item-name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" value="${item.name}">
            </div>
            <div>
              <label class="font-bold block text-gray-700 mb-1">상품 간단 설명</label>
              <input type="text" id="modal-item-desc" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" value="${item.description || ''}">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-bold block text-gray-700 mb-1">뱃지 / 태그</label>
                <input type="text" id="modal-item-badge" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" value="${item.badge || '인기'}">
              </div>
              <div>
                <label class="font-bold block text-gray-700 mb-1">최소주문(MOQ)</label>
                <input type="text" id="modal-item-moq" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" value="${item.moq || '1개 (낱개발송)'}">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-bold block text-gray-700 mb-1">소비자 정가 (원)</label>
                <input type="number" id="modal-item-retail" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-900" value="${item.retailPrice}">
              </div>
              <div>
                <label class="font-bold block text-gray-700 mb-1">도매 사입원가 (원)</label>
                <input type="number" id="modal-item-wholesale" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600" value="${item.wholesalePrice || Math.round(item.retailPrice * 0.4)}">
              </div>
            </div>

            <!-- Laptop File Upload + URL Input -->
            <div class="space-y-1.5 pt-1">
              <label class="font-bold block text-gray-700">상품 이미지 (노트북 사진 업로드 / URL)</label>
              <div class="flex items-center gap-3">
                <div class="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-primary shadow-2xs" onclick="document.getElementById('modal-item-file').click()" title="클릭하여 내 노트북에서 사진 선택">
                  <img id="modal-item-preview" src="${item.image}" class="w-full h-full object-contain bg-white p-0.5" alt="">
                </div>
                <div class="flex-1 space-y-1.5">
                  <button type="button" id="modal-item-upload-btn" onclick="document.getElementById('modal-item-file').click()" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs transition-colors">
                    <span class="material-symbols-outlined text-sm">upload_file</span>
                    내 노트북에서 사진 올리기
                  </button>
                  <input type="file" id="modal-item-file" accept="image/*" class="hidden" onchange="window.__handleImageUpload(event, 'modal-item-img', 'modal-item-preview', 'modal-item-upload-btn'); this.value = '';">
                  <input type="text" id="modal-item-img" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-gray-600" value="${item.image}" placeholder="또는 웹 이미지 URL 입력">
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between gap-2 pt-2 border-t">
            <button type="button" onclick="window.__confirmDeleteBoxItem('${boxId}', '${itemId}')" class="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer" title="이 상품 삭제">
              <span class="material-symbols-outlined text-sm pointer-events-none">delete</span>
              <span class="pointer-events-none">상품 삭제</span>
            </button>
            <div class="flex gap-2">
              <button onclick="window.__closeAdminModal()" class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs">취소</button>
              <button onclick="window.__saveEditedItem('${boxId}', '${itemId}')" class="px-5 py-2.5 bg-primary hover:bg-primary-container text-white font-bold rounded-xl text-xs shadow-md">수정 완료</button>
            </div>
          </div>
        </div>
      </div>`;
    document.getElementById('admin-modal-container').innerHTML = modalHtml;
  };

  window.__closeAdminModal = () => {
    const container = document.getElementById('admin-modal-container');
    if (container) container.innerHTML = '';
  };

  window.__saveNewItem = async (boxId) => {
    const name = document.getElementById('modal-item-name')?.value?.trim();
    const desc = document.getElementById('modal-item-desc')?.value?.trim() || '';
    const badge = document.getElementById('modal-item-badge')?.value?.trim() || 'MD추천';
    const retail = parseFloat(document.getElementById('modal-item-retail')?.value) || 5000;
    const wholesale = parseFloat(document.getElementById('modal-item-wholesale')?.value) || Math.round(retail * 0.4);
    const moq = document.getElementById('modal-item-moq')?.value?.trim() || '1개';
    const img = document.getElementById('modal-item-img')?.value?.trim();

    if (!name) { alert('상품명을 입력해주세요.'); return; }

    const boxes = getRandomBoxTiers();
    const box = boxes.find(b => b.id === boxId);
    if (box) {
      box.items.push({
        id: 'item_' + Date.now(),
        name,
        description: desc,
        badge,
        retailPrice: retail,
        wholesalePrice: wholesale,
        grade: 'NORMAL',
        moq,
        prob: 0.333,
        image: img || 'assets/products/phonestand_metal.jpg'
      });
      try {
        await saveRandomBoxTiers(boxes);
        window.__closeAdminModal();
        alert('✓ 새 정가 상품이 서버 DB에 정상 추가되었습니다.');
        window.__switchAdminTab('boxes');
      } catch (err) {
        console.error('[Admin] saveNewItem error:', err);
        alert('❌ 서버 DB 추가 실패: ' + err.message);
      }
    }
  };

  window.__saveEditedItem = async (boxId, itemId) => {
    const name = document.getElementById('modal-item-name')?.value?.trim();
    const desc = document.getElementById('modal-item-desc')?.value?.trim() || '';
    const badge = document.getElementById('modal-item-badge')?.value?.trim() || '인기';
    const retail = parseFloat(document.getElementById('modal-item-retail')?.value) || 5000;
    const wholesale = parseFloat(document.getElementById('modal-item-wholesale')?.value) || Math.round(retail * 0.4);
    const moq = document.getElementById('modal-item-moq')?.value?.trim() || '1개';
    const img = document.getElementById('modal-item-img')?.value?.trim();

    if (!name) { alert('상품명을 입력해주세요.'); return; }

    const boxes = getRandomBoxTiers();
    const box = boxes.find(b => b.id === boxId);
    if (box) {
      const item = box.items.find(it => it.id === itemId);
      if (item) {
        item.name = name;
        item.description = desc;
        item.badge = badge;
        item.retailPrice = retail;
        item.wholesalePrice = wholesale;
        item.moq = moq;
        item.image = img || item.image;
        try {
          await saveRandomBoxTiers(boxes);
          window.__closeAdminModal();
          alert('✓ 상품 정보가 서버 DB에 성공적으로 저장되었습니다.');
          window.__switchAdminTab('boxes');
        } catch (err) {
          console.error('[Admin] saveEditedItem error:', err);
          alert('❌ 서버 DB 저장 실패: ' + err.message);
        }
      }
    }
  };

  // --- 2. Special Raffle Management ---
  window.__openAddRaffleModal = () => {
    const modalHtml = `
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop bg-black/60 backdrop-blur-sm" id="admin-raffle-modal" onclick="if(event.target===this)window.__closeAdminModal()">
        <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div class="flex justify-between items-center border-b pb-3">
            <h3 class="font-bold text-lg text-gray-900">새 스페셜 골든래플 등록</h3>
            <button onclick="window.__closeAdminModal()" class="text-gray-400 hover:text-gray-600">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="font-bold block text-gray-700 mb-1">래플 상품명</label>
              <input type="text" id="raffle-title" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" placeholder="예: 아이패드 프로 13인치 M4">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-bold block text-gray-700 mb-1">소비자 정가 (원)</label>
                <input type="number" id="raffle-retail" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold" placeholder="1790000">
              </div>
              <div>
                <label class="font-bold block text-gray-700 mb-1">그룹당 목표 인원 (명)</label>
                <input type="number" id="raffle-unit-size" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold" value="200">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-bold block text-gray-700 mb-1">배지 문구</label>
                <input type="text" id="raffle-badge" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" value="SUPER RAFFLE">
              </div>
              <div>
                <label class="font-bold block text-gray-700 mb-1">마감 기한 (일 후)</label>
                <input type="number" id="raffle-days" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono" value="3">
              </div>
            </div>

            <!-- Laptop File Upload + URL Input -->
            <div class="space-y-1.5 pt-1">
              <label class="font-bold block text-gray-700">상품 이미지 (노트북 사진 업로드 / URL)</label>
              <div class="flex items-center gap-3">
                <div class="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-primary shadow-2xs" onclick="document.getElementById('raffle-file').click()" title="클릭하여 내 노트북에서 사진 선택">
                  <img id="raffle-preview" src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600" class="w-full h-full object-contain bg-white p-0.5" alt="">
                </div>
                <div class="flex-1 space-y-1.5">
                  <button type="button" id="raffle-add-upload-btn" onclick="document.getElementById('raffle-file').click()" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs transition-colors">
                    <span class="material-symbols-outlined text-sm">upload_file</span>
                    내 노트북에서 사진 올리기
                  </button>
                  <input type="file" id="raffle-file" accept="image/*" class="hidden" onchange="window.__handleImageUpload(event, 'raffle-img', 'raffle-preview', 'raffle-add-upload-btn'); this.value = '';">
                  <input type="text" id="raffle-img" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-gray-600" value="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600" placeholder="또는 웹 이미지 URL 입력">
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-2 pt-2 border-t">
            <button onclick="window.__closeAdminModal()" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs">취소</button>
            <button onclick="window.__saveNewRaffle()" class="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md">등록하기</button>
          </div>
        </div>
      </div>`;
    document.getElementById('admin-modal-container').innerHTML = modalHtml;
  };

  window.__openEditRaffleModal = (raffleId) => {
    const raffles = getSuperRaffles();
    const raffle = raffles.find(r => r.id === raffleId);
    if (!raffle) return;

    const modalHtml = `
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop bg-black/60 backdrop-blur-sm" id="admin-raffle-modal" onclick="if(event.target===this)window.__closeAdminModal()">
        <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div class="flex justify-between items-center border-b pb-3">
            <div>
              <h3 class="font-bold text-lg text-gray-900">스페셜 래플 수정</h3>
              <p class="text-[10px] text-gray-400 font-mono">ID: ${raffle.id}</p>
            </div>
            <button onclick="window.__closeAdminModal()" class="text-gray-400 hover:text-gray-600">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="font-bold block text-gray-700 mb-1">래플 상품명</label>
              <input type="text" id="raffle-title" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" value="${raffle.title}">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-bold block text-gray-700 mb-1">소비자 정가 (원)</label>
                <input type="number" id="raffle-retail" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold" value="${raffle.retailPrice}">
              </div>
              <div>
                <label class="font-bold block text-gray-700 mb-1">그룹당 목표 인원 (명)</label>
                <input type="number" id="raffle-unit-size" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold" value="${raffle.unitSize || 200}">
              </div>
            </div>
            <div>
              <label class="font-bold block text-gray-700 mb-1">배지 문구</label>
              <input type="text" id="raffle-badge" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" value="${raffle.badge || 'SUPER RAFFLE'}">
            </div>

            <!-- Laptop File Upload + URL Input -->
            <div class="space-y-1.5 pt-1">
              <label class="font-bold block text-gray-700">상품 이미지 (노트북 사진 업로드 / URL)</label>
              <div class="flex items-center gap-3">
                <div class="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-primary shadow-2xs" onclick="document.getElementById('raffle-file').click()" title="클릭하여 내 노트북에서 사진 선택">
                  <img id="raffle-preview" src="${raffle.imageUrl}" class="w-full h-full object-contain bg-white p-0.5" alt="">
                </div>
                <div class="flex-1 space-y-1.5">
                  <button type="button" id="raffle-edit-upload-btn" onclick="document.getElementById('raffle-file').click()" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs transition-colors">
                    <span class="material-symbols-outlined text-sm">upload_file</span>
                    내 노트북에서 사진 올리기
                  </button>
                  <input type="file" id="raffle-file" accept="image/*" class="hidden" onchange="window.__handleImageUpload(event, 'raffle-img', 'raffle-preview', 'raffle-edit-upload-btn'); this.value = '';">
                  <input type="text" id="raffle-img" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-gray-600" value="${raffle.imageUrl}" placeholder="또는 웹 이미지 URL 입력">
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-2 pt-2 border-t">
            <button onclick="window.__closeAdminModal()" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs">취소</button>
            <button onclick="window.__saveEditedRaffle('${raffleId}')" class="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl text-xs shadow-md">수정 완료</button>
          </div>
        </div>
      </div>`;
    document.getElementById('admin-modal-container').innerHTML = modalHtml;
  };

  window.__saveNewRaffle = async () => {
    const title = document.getElementById('raffle-title')?.value?.trim();
    const retail = parseFloat(document.getElementById('raffle-retail')?.value) || 1000000;
    const unitSize = parseInt(document.getElementById('raffle-unit-size')?.value, 10) || 200;
    const badge = document.getElementById('raffle-badge')?.value?.trim() || 'SUPER RAFFLE';
    const days = parseFloat(document.getElementById('raffle-days')?.value) || 3;
    const img = document.getElementById('raffle-img')?.value?.trim() || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600';

    if (!title) { alert('래플 상품명을 입력해주세요.'); return; }

    const raffles = getSuperRaffles();
    const newRaffle = {
      id: 'super_' + Date.now(),
      title,
      retailPrice: retail,
      imageUrl: img,
      unitSize: unitSize,
      endTime: Date.now() + days * 86400000,
      badge,
      status: 'active',
      entries: []
    };
    raffles.push(newRaffle);
    try {
      await saveSuperRaffles(raffles);
      window.__closeAdminModal();
      alert('✓ 새 스페셜 골든래플이 서버 DB에 정상 등록되었습니다.');
      window.__switchAdminTab('raffles');
    } catch (err) {
      console.error('[Admin] saveNewRaffle error:', err);
      alert('❌ 래플 등록 실패: ' + err.message);
    }
  };

  window.__saveEditedRaffle = async (raffleId) => {
    const title = document.getElementById('raffle-title')?.value?.trim();
    const retail = parseFloat(document.getElementById('raffle-retail')?.value) || 1000000;
    const unitSize = parseInt(document.getElementById('raffle-unit-size')?.value, 10) || 200;
    const badge = document.getElementById('raffle-badge')?.value?.trim() || 'SUPER RAFFLE';
    const img = document.getElementById('raffle-img')?.value?.trim();

    if (!title) { alert('래플 상품명을 입력해주세요.'); return; }

    const raffles = getSuperRaffles();
    const raffle = raffles.find(r => r.id === raffleId);
    if (raffle) {
      raffle.title = title;
      raffle.retailPrice = retail;
      raffle.unitSize = unitSize;
      raffle.badge = badge;
      delete raffle.winnerBonus;
      if (img) raffle.imageUrl = img;
      try {
        await saveSuperRaffles(raffles);
        window.__closeAdminModal();
        alert('✓ 스페셜 래플 정보가 서버 DB에 정상 수정되었습니다.');
        window.__switchAdminTab('raffles');
      } catch (err) {
        console.error('[Admin] saveEditedRaffle error:', err);
        alert('❌ 래플 수정 실패: ' + err.message);
      }
    }
  };

  window.__deleteRaffle = async (raffleId) => {
    const raffles = getSuperRaffles();
    const raffle = raffles.find(r => r.id === raffleId);
    if (!raffle) return;

    if (!confirm(`정말 [${raffle.title}] 스페셜 래플을 삭제하시겠습니까?`)) return;

    try {
      await deleteSuperRaffle(raffleId);
      alert('✓ 스페셜 래플이 서버 DB에서 성공적으로 삭제되었습니다.');
      window.__switchAdminTab('raffles');
    } catch (err) {
      console.error('[Admin] deleteRaffle error:', err);
      alert('❌ 래플 삭제 실패: ' + err.message);
    }
  };

  // --- Force Draw & Auto-Refund End-to-End ---
  window.__forceDrawRaffle = async (raffleId, btnElem) => {
    if (btnElem) {
      if (btnElem.disabled) return;
      btnElem.disabled = true;
      btnElem.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span> 추첨 및 환불 처리 중...';
      btnElem.classList.add('opacity-70', 'cursor-not-allowed');
    }
    try {
      const result = await forceDrawAndResolveRaffle(raffleId);
      // 1. Refresh background tab to show closed state
      const tabContent = document.getElementById('admin-tab-content');
      if (tabContent) tabContent.innerHTML = renderRafflesTab();
      // 2. Open result modal
      window.__showDrawResultModal(result);
    } catch (err) {
      console.error('Force draw raffle error:', err);
      alert(err.message || '추첨 진행 중 오류가 발생했습니다.');
      if (btnElem) {
        btnElem.disabled = false;
        btnElem.innerHTML = '<span class="material-symbols-outlined text-base">casino</span> 완료 그룹 즉시 추첨 & 미달 그룹 티켓 자동 환불 실행';
        btnElem.classList.remove('opacity-70', 'cursor-not-allowed');
      }
    }
  };

  window.__viewRaffleResults = (raffleId) => {
    const raffles = getSuperRaffles();
    const raffle = raffles.find(r => String(r.id) === String(raffleId));
    if (!raffle) return;

    const unitSize = raffle.unitSize || 200;
    const fullGroups = raffle.winners ? raffle.winners.length : 0;
    const remainder = raffle.refundCount !== undefined ? raffle.refundCount : (raffle.entries ? raffle.entries.length % unitSize : 0);

    const mockResult = {
      raffle,
      fullGroupsCount: fullGroups,
      remainderCount: remainder,
      winners: raffle.winners || [],
      myWinningCount: 0,
      myRefundCount: 0
    };
    window.__showDrawResultModal(mockResult);
  };

  window.__showDrawResultModal = (result) => {
    const { raffle, fullGroupsCount, remainderCount, winners, myWinningCount, myRefundCount } = result;

    const modalHtml = `
      <div class="fixed inset-0 z-[120] flex items-center justify-center p-4 modal-backdrop bg-black/70 backdrop-blur-sm" id="raffle-draw-modal" onclick="if(event.target===this)window.__closeAdminModal()">
        <div class="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
          <div class="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                추첨 및 마감 실행 결과
              </span>
              <h3 class="font-extrabold text-lg text-white mt-1">[${raffle?.title || '스페셜 상품'}]</h3>
              <p class="text-xs text-amber-300">소비자 정가 ₩${(raffle?.retailPrice || 0).toLocaleString()}원 상당</p>
            </div>
            <button onclick="window.__closeAdminModal()" class="text-slate-400 hover:text-white">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            <!-- Winners Section -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="material-symbols-outlined text-amber-500">military_tech</span>
                <h4 class="font-black text-sm text-gray-900">당첨자 명단 (${winners.length}개 그룹 달성)</h4>
              </div>

              ${winners.length === 0 ? `
                <div class="p-4 bg-slate-100 rounded-2xl text-xs text-gray-500 text-center">
                  완료된 정원 그룹이 없어 선발된 당첨자가 없습니다.
                </div>
              ` : `
                <div class="space-y-2">
                  ${winners.map(w => `
                    <div class="p-4 bg-amber-50/70 border-2 border-amber-300 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">그룹 ${w.groupNumber} 당첨</span>
                          <span class="font-black text-sm text-gray-900">${w.winner.userName}</span>
                          <span class="text-xs text-gray-500 font-mono">(${w.winner.userEmail})</span>
                        </div>
                        <p class="text-[11px] text-gray-500 mt-1">슬롯 번호: <strong>#${w.winner.slotIndex}</strong></p>
                      </div>
                      <span class="font-mono text-xs font-extrabold text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
                        ${w.winner.ticketNumber}
                      </span>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>

            <!-- Refund Summary Section -->
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-1.5 text-xs text-blue-950">
              <div class="flex items-center gap-1.5 font-bold text-blue-900">
                <span class="material-symbols-outlined text-base text-blue-600">autorenew</span>
                <span>미달 그룹 골든티켓 100% 자동 환불 완료</span>
              </div>
              <p class="text-blue-800 leading-relaxed">
                정원에 미달된 잔여 <strong>${remainderCount}명</strong>의 골든 티켓은 각 참여자 지갑으로 <strong>전액 100% 자동 환불 반환</strong>되었습니다.
              </p>
              ${myRefundCount > 0 ? `
                <p class="font-bold text-emerald-700 pt-1">🎯 내 계정으로 +${myRefundCount}장의 골든티켓이 즉시 환불 입고되었습니다.</p>
              ` : ''}
              ${myWinningCount > 0 ? `
                <p class="font-black text-amber-700 pt-1">🎉 축하합니다! 내 계정이 1등에 당첨되어 [내 보관함]에 실물 상품이 즉시 지급되었습니다!</p>
              ` : ''}
            </div>
          </div>

          <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button onclick="window.__closeAdminModal(); window.__switchAdminTab('raffles');" class="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800">
              확인
            </button>
          </div>
        </div>
      </div>`;
    const container = document.getElementById('admin-modal-container');
    if (container) container.innerHTML = modalHtml;
  };

  window.__reopenRaffle = (raffleId) => {
    if (!confirm('이 래플을 다시 활성(진행 중) 상태로 변경하시겠습니까? (테스트 편의 기능)')) return;
    try {
      reopenRaffle(raffleId);
      alert('✓ 래플이 다시 실시간 진행 상태로 변경되었습니다.');
      window.__switchAdminTab('raffles');
    } catch (err) {
      alert(err.message);
    }
  };

  window.__viewRaffleParticipants = (raffleId) => {
    const raffles = getSuperRaffles();
    const raffle = raffles.find(r => r.id === raffleId);
    if (!raffle) return;

    const groupData = getRaffleGroupData(raffle);

    const modalHtml = `
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop bg-black/60 backdrop-blur-sm" id="raffle-participants-modal" onclick="if(event.target===this)window.__closeAdminModal()">
        <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[85vh] flex flex-col">
          <div class="flex justify-between items-center border-b pb-3">
            <div>
              <h3 class="font-bold text-lg text-gray-900">${raffle.title}</h3>
              <p class="text-xs text-gray-500">전체 참여 큐: ${groupData.totalParticipants}명 / 그룹당 ${raffle.unitSize || 200}명</p>
            </div>
            <button onclick="window.__closeAdminModal()" class="text-gray-400 hover:text-gray-600">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div class="overflow-y-auto space-y-4 flex-1 pr-1 custom-scrollbar">
            ${groupData.groups.map(g => `
              <div class="border border-slate-200 rounded-2xl p-4 bg-slate-50/60">
                <div class="flex justify-between items-center mb-3">
                  <div class="flex items-center gap-2">
                    <span class="font-extrabold text-sm text-gray-900">그룹 ${g.groupNumber}</span>
                    <span class="text-[10px] font-bold ${g.isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} px-2 py-0.5 rounded-full">
                      ${g.isComplete ? '✓ 정원 달성 완료' : `진행 중 (${g.count}/${g.unitSize})`}
                    </span>
                  </div>
                  <span class="text-xs text-gray-400 font-mono">슬롯 ${g.startSlot} ~ ${g.endSlot}</span>
                </div>

                ${g.entries.length === 0 ? `
                  <p class="text-xs text-gray-400 text-center py-3">대기 중인 참여자가 없습니다.</p>
                ` : `
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar">
                    ${g.entries.map(e => `
                      <div class="p-2.5 bg-white border border-slate-200 rounded-xl text-xs flex justify-between items-center shadow-2xs">
                        <div>
                          <div class="flex items-center gap-1.5 font-bold text-gray-900">
                            <span class="font-mono text-primary">#${e.slotIndex}</span>
                            <span>${e.userName}</span>
                          </div>
                          <p class="text-[10px] text-gray-400 font-mono">${e.userEmail}</p>
                        </div>
                        <span class="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          ${e.ticketNumber}
                        </span>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            `).join('')}
          </div>

          <div class="pt-3 border-t text-right">
            <button onclick="window.__closeAdminModal()" class="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl text-xs">
              닫기
            </button>
          </div>
        </div>
      </div>`;
    document.getElementById('admin-modal-container').innerHTML = modalHtml;
  };

  // --- 3. Shipping Management ---
  window.__updateTracking = async (shippingId) => {
    const carrier = document.getElementById(`carrier-${shippingId}`)?.value || 'CJ대한통운';
    const track = document.getElementById(`track-${shippingId}`)?.value?.trim();
    if (!track) { alert('운송장 번호를 입력해주세요.'); return; }

    try {
      await updateShippingRequestStatus(shippingId, 'shipped', carrier, track);
      alert(`🎉 송장 번호(${carrier} ${track})가 서버 DB에 정상 등록되었습니다!\n고객 보관함에서 실시간 배송 조회가 즉시 가능합니다.`);
      window.__switchAdminTab('shipping');
    } catch (err) {
      console.error('[Admin] updateTracking error:', err);
      alert('❌ 운송장 저장 실패: ' + err.message);
    }
  };

  window.__verifyShippingTax = async (shippingId) => {
    if (!confirm('카카오뱅크 제세공과금(22%) 입금 및 국세청 신분증 사본 대조가 완료되었습니까?\n\n승인 시 고객 보관함의 상태가 [제세공과금 승인 완료]로 전환되며 출고 준비가 진행됩니다.')) return;
    try {
      await updateShippingRequestStatus(shippingId, 'shipping_requested', null, null, 'verified');
      alert('✓ 제세공과금 입금 및 신분증 서류 승인이 완료되었습니다!\n이제 운송장을 등록하여 상품을 출고하실 수 있습니다.');
      window.__switchAdminTab('shipping');
    } catch (err) {
      console.error('[Admin] verifyShippingTax error:', err);
      alert('❌ 승인 처리 실패: ' + err.message);
    }
  };

  window.__previewAdminIdCard = (shippingId) => {
    const allRequests = getAllShippingRequests();
    const req = allRequests.find(r => r.shippingId === shippingId);
    if (!req || !req.taxIdCardImage) {
      alert('첨부된 신분증 이미지가 없습니다.');
      return;
    }

    const modalHtml = `
      <div class="fixed inset-0 z-[110] flex items-center justify-center p-4 modal-backdrop bg-black/75 backdrop-blur-sm" id="admin-idcard-modal" onclick="if(event.target===this)window.__closeAdminModal()">
        <div class="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
          <div class="flex justify-between items-center border-b pb-3">
            <div>
              <h3 class="font-bold text-base text-gray-900">📄 국세청 신고용 신분증 사본 확인</h3>
              <p class="text-xs text-gray-500 font-mono">수령인: ${req.shippingData?.name || req.recipientName || '고객'} (입금자명: ${req.taxDepositName || '확인 중'})</p>
            </div>
            <button onclick="window.__closeAdminModal()" class="text-gray-400 hover:text-gray-600 cursor-pointer">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div class="p-2 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden max-h-[60vh]">
            <img src="${req.taxIdCardImage}" class="max-w-full max-h-[58vh] object-contain rounded-xl" alt="신분증 사본">
          </div>

          <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-snug">
            ⚠️ <strong>세무 및 개인정보 보호 안내:</strong> 본 신분증 사본은 소득세법 제164조에 따른 원천징수이행상황신고서 제출용입니다. 세무 신고 완료 후 안전하게 파기해주시기 바랍니다.
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button onclick="window.__closeAdminModal()" class="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer">
              확인 닫기
            </button>
          </div>
        </div>
      </div>`;
    document.getElementById('admin-modal-container').innerHTML = modalHtml;
  };

  window.__deleteShipping = async (shippingId) => {
    if (!confirm('이 배송 요청을 목록에서 삭제하시겠습니까?')) return;
    try {
      await deleteShippingRequest(shippingId);
      alert('✓ 배송 요청이 서버 DB에서 성공적으로 삭제되었습니다.');
      window.__switchAdminTab('shipping');
    } catch (err) {
      console.error('[Admin] deleteShipping error:', err);
      alert('❌ 배송 요청 삭제 실패: ' + err.message);
    }
  };

  window.__createDemoShipping = () => {
    createDemoShippingRequest();
    alert('✓ 테스트 배송 접수가 생성되었습니다.');
    window.__switchAdminTab('shipping');
  };

  // --- 4. User Directory & Wallet Management ---
  window.__filterAdminMembers = (query) => {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#admin-members-tbody .member-row');
    let visibleCount = 0;
    rows.forEach(row => {
      const searchData = row.getAttribute('data-search') || '';
      if (!q || searchData.includes(q)) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    const label = document.getElementById('admin-member-count-label');
    if (label) label.textContent = `검색 결과: ${visibleCount}명`;
  };

  window.__openUserWalletModal = (uid) => {
    const members = getMembers();
    const member = members.find(m => m.uid === uid || m.id === uid) || members[0];
    if (!member) {
      alert('회원 정보를 찾을 수 없습니다.');
      return;
    }

    const modalHtml = `
      <div class="fixed inset-0 z-[120] flex items-center justify-center p-4 modal-backdrop bg-black/70 backdrop-blur-sm" id="user-wallet-modal" onclick="if(event.target===this)window.__closeAdminModal()">
        <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="p-6 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider bg-primary text-white px-2.5 py-0.5 rounded-full">
                회원 지갑 관리
              </span>
              <h3 class="font-extrabold text-lg text-white mt-1">${member.name} 님 지갑 관리</h3>
              <p class="text-xs text-slate-400 font-mono">${member.email} (UID: ${member.uid})</p>
            </div>
            <button onclick="window.__closeAdminModal()" class="text-slate-400 hover:text-white cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
            <!-- Current Balance Cards -->
            <div class="grid grid-cols-2 gap-3">
              <div class="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-center">
                <span class="text-[10px] text-blue-700 font-bold block uppercase">현재 보유 포인트</span>
                <span class="font-black text-2xl text-primary font-mono mt-1 block">₩${member.points.toLocaleString()} P</span>
              </div>
              <div class="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-center">
                <span class="text-[10px] text-amber-800 font-bold block uppercase">현재 보유 골든티켓</span>
                <span class="font-black text-2xl text-amber-600 font-mono mt-1 block">${member.goldenTickets.toLocaleString()}장</span>
              </div>
            </div>

            <!-- Quick Points Grant -->
            <div class="space-y-2">
              <span class="text-xs font-black text-gray-700 block">⚡ 포인트 빠른 원클릭 지급</span>
              <div class="grid grid-cols-3 gap-2">
                <button onclick="window.__adminAdjustUserBalance('${member.uid}', '${member.email}', 'points_add', 10000)" class="py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center">
                  +10,000 P
                </button>
                <button onclick="window.__adminAdjustUserBalance('${member.uid}', '${member.email}', 'points_add', 100000)" class="py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center">
                  +100,000 P
                </button>
                <button onclick="window.__adminAdjustUserBalance('${member.uid}', '${member.email}', 'points_add', 1000000)" class="py-2.5 bg-primary text-white hover:bg-primary-container font-black rounded-xl text-xs transition-colors cursor-pointer text-center shadow-xs">
                  +1,000,000 P
                </button>
              </div>
            </div>

            <!-- Quick Tickets Grant -->
            <div class="space-y-2">
              <span class="text-xs font-black text-gray-700 block">🎟️ 골든티켓 빠른 원클릭 지급</span>
              <div class="grid grid-cols-3 gap-2">
                <button onclick="window.__adminAdjustUserBalance('${member.uid}', '${member.email}', 'tickets_add', 20)" class="py-2.5 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center">
                  +20 장
                </button>
                <button onclick="window.__adminAdjustUserBalance('${member.uid}', '${member.email}', 'tickets_add', 500)" class="py-2.5 bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center">
                  +500 장
                </button>
                <button onclick="window.__adminAdjustUserBalance('${member.uid}', '${member.email}', 'tickets_add', 1000)" class="py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer text-center shadow-xs">
                  +1,000 장
                </button>
              </div>
            </div>

            <!-- Direct Custom Adjust -->
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span class="text-xs font-black text-gray-700 block">✏️ 직접 수량 입력 지급/차감</span>
              
              <!-- Points Custom -->
              <div>
                <label class="text-[11px] font-bold text-gray-500 block mb-1">포인트 직접 조정 (원)</label>
                <div class="flex gap-2">
                  <input type="number" id="m-custom-points-input" class="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold" placeholder="금액 입력 (예: 50000)">
                  <button onclick="window.__adminDirectAdjustUser('${member.uid}', '${member.email}', 'points', 1)" class="px-3.5 py-2 bg-primary text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer">
                    지급 (+)
                  </button>
                  <button onclick="window.__adminDirectAdjustUser('${member.uid}', '${member.email}', 'points', -1)" class="px-3.5 py-2 bg-red-600 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer">
                    차감 (-)
                  </button>
                </div>
              </div>

              <!-- Tickets Custom -->
              <div>
                <label class="text-[11px] font-bold text-gray-500 block mb-1">골든티켓 직접 조정 (장수)</label>
                <div class="flex gap-2">
                  <input type="number" id="m-custom-tickets-input" class="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold" placeholder="수량 입력 (예: 10)">
                  <button onclick="window.__adminDirectAdjustUser('${member.uid}', '${member.email}', 'tickets', 1)" class="px-3.5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-xs cursor-pointer">
                    지급 (+)
                  </button>
                  <button onclick="window.__adminDirectAdjustUser('${member.uid}', '${member.email}', 'tickets', -1)" class="px-3.5 py-2 bg-red-600 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer">
                    차감 (-)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button onclick="window.__closeAdminModal()" class="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer">
              닫기
            </button>
          </div>
        </div>
      </div>`;

    const container = document.getElementById('admin-modal-container');
    if (container) container.innerHTML = modalHtml;
  };

  window.__adminAdjustUserBalance = async (uid, email, type, amount) => {
    const members = getMembers();
    const member = members.find(m => m.uid === uid || m.id === uid);
    if (!member) {
      alert('회원 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      if (type === 'points_add') {
        const newPts = (member.points || 0) + amount;
        await grantUserBalanceServer(uid, email, newPts, null);
        alert(`✓ [${member.name}] 님에게 포인트 +₩${amount.toLocaleString()}P 가 정상 지급되었습니다.\n현재 잔액: ₩${newPts.toLocaleString()}P`);
      } else if (type === 'tickets_add') {
        const newTickets = (member.goldenTickets || 0) + amount;
        await grantUserBalanceServer(uid, email, null, newTickets);
        alert(`✓ [${member.name}] 님에게 골든티켓 +${amount.toLocaleString()}장이 정상 지급되었습니다.\n현재 보유: ${newTickets.toLocaleString()}장`);
      }
      window.__closeAdminModal();
      window.__switchAdminTab('users');
    } catch (err) {
      console.error('[Admin] adjust balance error:', err);
      alert('❌ 재화 지급 실패: ' + err.message);
    }
  };

  window.__adminDirectAdjustUser = async (uid, email, type, multiplier) => {
    const members = getMembers();
    const member = members.find(m => m.uid === uid || m.id === uid);
    if (!member) {
      alert('회원 정보를 찾을 수 없습니다.');
      return;
    }

    if (type === 'points') {
      const input = document.getElementById('m-custom-points-input');
      const val = parseInt(input?.value || '0', 10);
      if (isNaN(val) || val <= 0) {
        alert('조정할 포인트 금액을 올바르게 입력해주세요.');
        return;
      }
      const newPts = Math.max(0, (member.points || 0) + val * multiplier);
      try {
        await grantUserBalanceServer(uid, email, newPts, null);
        alert(`✓ [${member.name}] 님의 포인트가 ₩${newPts.toLocaleString()}P 로 정상 조정되었습니다.`);
        window.__closeAdminModal();
        window.__switchAdminTab('users');
      } catch (err) {
        alert('❌ 포인트 조정 실패: ' + err.message);
      }
    } else if (type === 'tickets') {
      const input = document.getElementById('m-custom-tickets-input');
      const val = parseInt(input?.value || '0', 10);
      if (isNaN(val) || val <= 0) {
        alert('조정할 골든티켓 장수를 올바르게 입력해주세요.');
        return;
      }
      const newTickets = Math.max(0, (member.goldenTickets || 0) + val * multiplier);
      try {
        await grantUserBalanceServer(uid, email, null, newTickets);
        alert(`✓ [${member.name}] 님의 골든티켓이 ${newTickets.toLocaleString()}장으로 정상 조정되었습니다.`);
        window.__closeAdminModal();
        window.__switchAdminTab('users');
      } catch (err) {
        alert('❌ 골든티켓 조정 실패: ' + err.message);
      }
    }
  };

  window.__openUserVaultModal = (uid) => {
    const members = getMembers();
    const member = members.find(m => m.uid === uid || m.id === uid) || members[0];
    if (!member) {
      alert('회원 정보를 찾을 수 없습니다.');
      return;
    }

    const vault = member.vault || [];

    const modalHtml = `
      <div class="fixed inset-0 z-[120] flex items-center justify-center p-4 modal-backdrop bg-black/70 backdrop-blur-sm" id="user-vault-modal" onclick="if(event.target===this)window.__closeAdminModal()">
        <div class="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="p-6 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider bg-indigo-500 text-white px-2.5 py-0.5 rounded-full">
                회원 실물 보관함
              </span>
              <h3 class="font-extrabold text-lg text-white mt-1">${member.name} 님의 보관함 (${vault.length}건)</h3>
              <p class="text-xs text-slate-400 font-mono">${member.email}</p>
            </div>
            <button onclick="window.__closeAdminModal()" class="text-slate-400 hover:text-white cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-3 overflow-y-auto custom-scrollbar flex-1">
            ${vault.length === 0 ? `
              <div class="p-12 text-center text-gray-400">
                <span class="material-symbols-outlined text-4xl block mb-2 text-gray-300">inventory_2</span>
                <p class="text-xs font-bold">보관함에 보관된 상품이 없습니다.</p>
              </div>
            ` : vault.map(v => {
              const statusBadge = {
                in_vault: '<span class="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">보관 중</span>',
                shipping_requested: '<span class="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">배송 요청</span>',
                shipped: '<span class="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">배송 완료</span>',
                converted_to_points: '<span class="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">포인트 반품</span>'
              }[v.status] || '<span class="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">보관 중</span>';

              return `
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <img src="${v.imageUrl || v.image || 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=200'}" onerror="this.src='https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=200';" class="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0" alt="">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-extrabold text-sm text-gray-900 truncate">${v.title || v.name || '당첨 상품'}</span>
                        ${statusBadge}
                      </div>
                      <p class="text-xs text-gray-500 font-mono">소비자가: ₩${(v.retailPrice || 0).toLocaleString()}원</p>
                      <p class="text-[10px] text-gray-400 font-mono">획득일: ${v.wonAt ? new Date(v.wonAt).toLocaleString('ko-KR') : '-'}</p>
                    </div>
                  </div>
                </div>`;
            }).join('')}
          </div>

          <!-- Footer -->
          <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button onclick="window.__closeAdminModal()" class="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer">
              확인
            </button>
          </div>
        </div>
      </div>`;

    const container = document.getElementById('admin-modal-container');
    if (container) container.innerHTML = modalHtml;
  };

  window.__resetAllTestData = async () => {
    if (!confirm('⚠️ 모든 테스트 데이터(보관함, 잔액, 래플 상태)를 초기화하시겠습니까?')) return;
    try {
      await setUserPoints(35000);
      await setAvailableGoldenTicketsCount(500);
      alert('✓ 모든 테스트 데이터가 서버 DB에 성공적으로 리셋되었습니다.');
      window.__switchAdminTab('users');
    } catch (err) {
      console.error('[Admin] resetAllTestData error:', err);
      alert('❌ 데이터 리셋 실패: ' + err.message);
    }
  };

  window.__deleteAdminVaultItem = async (vaultId, itemTitle) => {
    if (!confirm(`[${itemTitle || '해당 아이템'}]을(를) 보관함에서 삭제하시겠습니까?`)) return;
    try {
      await deleteVaultItem(vaultId);
      alert(`✓ [${itemTitle || '아이템'}]이(가) 보관함에서 정상 삭제되었습니다.`);
      window.__switchAdminTab('users');
    } catch (err) {
      console.error('[Admin] deleteAdminVaultItem error:', err);
      alert('보관함 삭제 오류: ' + (err.message || err));
    }
  };

  return html;
}

export function cleanup() {
  delete window.__switchAdminTab;
  delete window.__selectAdminBox;
  delete window.__setShippingFilter;
  delete window.__handleImageUpload;
  delete window.__openEditBoxTierModal;
  delete window.__saveEditedBoxTier;
  delete window.__autoBalanceProbs;
  delete window.__deleteBoxItem;
  delete window.__openAddItemModal;
  delete window.__openEditItemModal;
  delete window.__closeAdminModal;
  delete window.__saveNewItem;
  delete window.__saveEditedItem;
  delete window.__openAddRaffleModal;
  delete window.__openEditRaffleModal;
  delete window.__saveNewRaffle;
  delete window.__saveEditedRaffle;
  delete window.__deleteRaffle;
  delete window.__forceDrawRaffle;
  delete window.__viewRaffleResults;
  delete window.__showDrawResultModal;
  delete window.__reopenRaffle;
  delete window.__viewRaffleParticipants;
  delete window.__updateTracking;
  delete window.__deleteShipping;
  delete window.__createDemoShipping;
  delete window.__adminGrantPoints;
  delete window.__adminGrantTickets;
  delete window.__adminDirectPoints;
  delete window.__adminDirectTickets;
  delete window.__resetAllTestData;
  delete window.__filterAdminMembers;
  delete window.__openUserWalletModal;
  delete window.__openUserVaultModal;
  delete window.__adminAdjustUserBalance;
  delete window.__adminDirectAdjustUser;
  delete window.__deleteAdminVaultItem;
}
