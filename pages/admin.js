// ============================================
// LuckyPick - Admin Control Center
// Random Box & Item Pools, Special Raffles, Shipping & Financial Analytics
// ============================================
import { 
  getRandomBoxTiers, 
  saveRandomBoxTiers, 
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
  getRaffleGroupData
} from '../services/randombox.js';

let activeAdminTab = 'boxes'; // 'boxes' | 'raffles' | 'shipping' | 'users' | 'analytics'
let selectedBoxId = 'box_basic';
let shippingFilter = 'all'; // 'all' | 'pending' | 'shipped'

function renderSidebar() {
  const menuItems = [
    { id: 'boxes', icon: 'package_2', label: '럭키박스 품목 관리' },
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

  const totalProb = currentBox.items.reduce((acc, it) => acc + (it.prob || 0), 0);
  const probPercent = Math.round(totalProb * 100);
  const isProbValid = Math.abs(totalProb - 1.0) < 0.001;

  return `
    <div class="space-y-6">
      <!-- Box Tier Tabs -->
      <div class="flex flex-wrap gap-2 border-b border-slate-200 pb-4 items-center justify-between">
        <div class="flex flex-wrap gap-2">
          ${boxes.map(b => `
            <button onclick="window.__selectAdminBox('${b.id}')" class="px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${selectedBoxId === b.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-slate-100 border border-slate-200'}">
              <span>${b.name}</span>
              <span class="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full">₩${b.price.toLocaleString()}원</span>
            </button>
          `).join('')}
        </div>

        <button onclick="window.__openEditBoxTierModal('${currentBox.id}')" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-200">
          <span class="material-symbols-outlined text-sm">settings</span>
          현재 박스 기본설정 수정
        </button>
      </div>

      <!-- Selected Box Overview & Prob Validation -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-black text-xl text-gray-900">${currentBox.name}</h3>
            <span class="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">골든티켓 +${currentBox.goldenTickets}장 지급</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            박스 가격: <strong>₩${currentBox.price.toLocaleString()}원</strong> | 최소 보장 가치: <strong>₩${currentBox.minGuaranteedValue.toLocaleString()}원</strong> | 등록 품목: <strong>${currentBox.items.length}개</strong>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="text-right">
            <span class="text-[10px] text-gray-400 font-bold block">확률 합계</span>
            <span class="font-black text-lg font-mono ${isProbValid ? 'text-emerald-600' : 'text-red-500'}">
              ${probPercent}% ${isProbValid ? '✓ 정상' : '⚠️ 100% 불일치'}
            </span>
          </div>

          ${!isProbValid ? `
            <button onclick="window.__autoBalanceProbs('${currentBox.id}')" class="px-3.5 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors">
              <span class="material-symbols-outlined text-sm">balance</span>
              확률 100% 자동 맞춤
            </button>
          ` : ''}

          <button onclick="window.__openAddItemModal('${currentBox.id}')" class="px-4 py-3 bg-primary text-white font-bold rounded-xl text-xs shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5 active:scale-95">
            <span class="material-symbols-outlined text-base">add_box</span>
            새 품목 추가
          </button>
        </div>
      </div>

      <!-- Items Table -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h4 class="font-bold text-sm text-gray-900">등장 품목 리스트 및 원가표 (${currentBox.items.length}개 품목)</h4>
          <span class="text-xs text-gray-400">행 클릭 또는 [수정] 버튼으로 이미지/가격/확률 수정 가능</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-gray-600">
            <thead class="bg-slate-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="p-4">상품 정보</th>
                <th class="p-4">등급</th>
                <th class="p-4">최소주문(MOQ)</th>
                <th class="p-4">도매 사입가</th>
                <th class="p-4">소비자 정가</th>
                <th class="p-4">80% 환급액</th>
                <th class="p-4">당첨 확률</th>
                <th class="p-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              ${currentBox.items.map((item) => {
                const refundPts = Math.round(item.retailPrice * 0.8);
                const isOverCost = refundPts >= currentBox.price;
                return `
                <tr class="hover:bg-blue-50/40 transition-colors cursor-pointer group">
                  <td class="p-4 flex items-center gap-3" onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')">
                    <img src="${item.image}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform" alt="">
                    <div>
                      <p class="font-bold text-gray-900 group-hover:text-primary transition-colors flex items-center gap-1.5">
                        ${item.name}
                        <span class="material-symbols-outlined text-xs text-gray-300 group-hover:text-primary">edit</span>
                      </p>
                      <p class="text-[10px] text-gray-400 font-mono">ID: ${item.id}</p>
                    </div>
                  </td>
                  <td class="p-4" onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')">
                    <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">${item.grade}</span>
                  </td>
                  <td class="p-4" onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')">
                    <span class="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ${item.moq || '1개 (낱개발송)'}
                    </span>
                  </td>
                  <td class="p-4 font-mono font-bold text-emerald-600" onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')">
                    ₩${(item.wholesalePrice || Math.round(item.retailPrice * 0.25)).toLocaleString()}원
                  </td>
                  <td class="p-4 font-mono font-bold text-gray-900" onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')">
                    ₩${item.retailPrice.toLocaleString()}원
                  </td>
                  <td class="p-4 font-mono font-bold ${isOverCost ? 'text-amber-600' : 'text-slate-600'}" onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')">
                    ₩${refundPts.toLocaleString()} P
                  </td>
                  <td class="p-4 font-mono font-black text-primary text-sm" onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')">
                    ${(item.prob * 100).toFixed(1)}%
                  </td>
                  <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button onclick="window.__openEditItemModal('${currentBox.id}', '${item.id}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1" title="수정">
                        <span class="material-symbols-outlined text-xs">edit</span>
                        수정
                      </button>
                      <button onclick="window.__deleteBoxItem('${currentBox.id}', '${item.id}')" class="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors" title="삭제">
                        <span class="material-symbols-outlined text-base">delete</span>
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
                    <p class="text-[11px] text-amber-700 font-bold mt-1 truncate">🎁 ${r.winnerBonus || '추가 특별 혜택'}</p>
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
                  <button onclick="window.__forceDrawRaffle('${r.id}')" class="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-300 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer">
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
            return `
              <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div class="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
                  <div class="flex items-center gap-3">
                    <img src="${req.imageUrl}" class="w-12 h-12 rounded-xl object-cover border border-slate-200" alt="">
                    <div>
                      <span class="text-[10px] font-mono text-gray-400 block">${req.shippingId}</span>
                      <h4 class="font-bold text-sm text-gray-900">${req.itemTitle}</h4>
                      <p class="text-[11px] text-gray-500 font-mono">정가: ₩${req.retailPrice?.toLocaleString()}원</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black px-3 py-1 rounded-full ${isShipped ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">
                      ${isShipped ? '✓ 출고 완료' : '⏳ 배송 접수 대기'}
                    </span>
                    <button onclick="window.__deleteShipping('${req.shippingId}')" class="p-1 text-gray-400 hover:text-red-500 rounded" title="요청 삭제">
                      <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                <div class="bg-slate-50 p-4 rounded-2xl text-xs space-y-1.5">
                  <div class="flex flex-wrap justify-between items-center pb-1.5 border-b border-slate-200/60">
                    <p><strong>수령인:</strong> ${req.shippingData?.name || '홍길동'} (${req.shippingData?.phone || '010-1234-5678'})</p>
                    <span class="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full font-mono">
                      배송비 ₩${(req.shippingFee || 3000).toLocaleString()}원 (${req.shippingPayMethod === 'points' ? '포인트 결제' : req.shippingPayMethod === 'toss' ? '토스 결제' : req.shippingPayMethod === 'easy_pay' ? '간편결제' : req.shippingPayMethod === 'paypal' ? 'PayPal' : '결제 완료'})
                    </span>
                  </div>
                  <p><strong>배송지:</strong> ${req.shippingData?.address || '서울시 강남구 테헤란로 123'}</p>
                  ${req.shippingData?.memo ? `<p class="text-gray-500"><strong>배송 메모:</strong> ${req.shippingData.memo}</p>` : ''}
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

                  <button onclick="window.__updateTracking('${req.shippingId}')" class="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-container transition-colors shadow-xs active:scale-95">
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
  const currentPts = getUserPoints();
  const currentTickets = getAvailableGoldenTicketsCount();
  const vault = getUserVault();

  return `
    <div class="space-y-6">
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h3 class="font-black text-xl text-gray-900">회원 및 지갑 관리</h3>
          <p class="text-xs text-gray-500 mt-0.5">회원별 보유 포인트 및 골든 티켓 직접 지급/차감 조정</p>
        </div>
        <button onclick="window.__resetAllTestData()" class="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors">
          <span class="material-symbols-outlined text-sm">restart_alt</span>
          전체 테스트 데이터 초기화
        </button>
      </div>

      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-base text-gray-900">현재 테스트 계정 지갑</h4>
              <span class="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">ACTIVE</span>
            </div>
            <p class="text-xs text-gray-500 font-mono mt-0.5">my_account@luckypick.com (UID: my_user_id)</p>
          </div>
          <div class="flex gap-6 text-right">
            <div>
              <span class="text-[10px] text-gray-400 font-bold block">포인트 잔액</span>
              <span class="font-black text-2xl text-primary font-mono">₩${currentPts.toLocaleString()} P</span>
            </div>
            <div>
              <span class="text-[10px] text-gray-400 font-bold block">골든 티켓</span>
              <span class="font-black text-2xl text-amber-600 font-mono">${currentTickets}장</span>
            </div>
          </div>
        </div>

        <!-- Quick Grant Buttons -->
        <div class="space-y-2 pt-2 border-t border-slate-100">
          <span class="text-[11px] font-bold text-gray-500 block">빠른 원클릭 지급</span>
          <div class="flex flex-wrap gap-2">
            <button onclick="window.__adminGrantPoints(10000)" class="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs transition-colors">
              + 10,000P 지급
            </button>
            <button onclick="window.__adminGrantPoints(100000)" class="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs transition-colors">
              + 100,000P 지급
            </button>
            <button onclick="window.__adminGrantPoints(1000000)" class="px-3.5 py-2 bg-primary text-white font-bold rounded-xl text-xs shadow-xs hover:bg-primary-container transition-all">
              + 1,000,000P 지급
            </button>
            <button onclick="window.__adminGrantTickets(20)" class="px-3.5 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold rounded-xl text-xs transition-colors">
              + 골든티켓 20장 지급
            </button>
            <button onclick="window.__adminGrantTickets(500)" class="px-3.5 py-2 bg-amber-100 text-amber-900 font-bold rounded-xl text-xs hover:bg-amber-200 transition-colors">
              + 골든티켓 500장 지급
            </button>
            <button onclick="window.__adminGrantTickets(1000)" class="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-xs hover:from-amber-400 transition-all">
              + 골든티켓 1,000장 지급 (테스트용)
            </button>
          </div>
        </div>

        <!-- Direct Amount Inputs -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <!-- Points Direct Adjust -->
          <div class="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200">
            <label class="font-bold text-xs text-gray-700 block">포인트 직접 조정 (원)</label>
            <div class="flex gap-2">
              <input type="number" id="custom-points-input" class="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold" placeholder="금액 입력">
              <button onclick="window.__adminDirectPoints(1)" class="px-3.5 py-2 bg-primary text-white font-bold rounded-xl text-xs shadow-xs">지급 (+)</button>
              <button onclick="window.__adminDirectPoints(-1)" class="px-3.5 py-2 bg-red-600 text-white font-bold rounded-xl text-xs shadow-xs">차감 (-)</button>
            </div>
          </div>

          <!-- Golden Tickets Direct Adjust -->
          <div class="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200">
            <label class="font-bold text-xs text-gray-700 block">골든 티켓 직접 조정 (장수)</label>
            <div class="flex gap-2">
              <input type="number" id="custom-tickets-input" class="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold" placeholder="수량 입력">
              <button onclick="window.__adminDirectTickets(1)" class="px-3.5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-xs">지급 (+)</button>
              <button onclick="window.__adminDirectTickets(-1)" class="px-3.5 py-2 bg-red-600 text-white font-bold rounded-xl text-xs shadow-xs">차감 (-)</button>
            </div>
          </div>
        </div>

        <!-- User Vault Mini Overview -->
        <div class="pt-4 border-t border-slate-100">
          <div class="flex justify-between items-center mb-3">
            <h5 class="font-bold text-xs text-gray-700">현재 보관함 보유 아이템 (${vault.length}건)</h5>
            <span class="text-[11px] text-gray-400">쇼핑몰 '내 보관함' 탭 연동</span>
          </div>
          <div class="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
            ${vault.length === 0 ? `
              <p class="text-xs text-gray-400 py-2">보관함이 비어 있습니다.</p>
            ` : vault.map(v => `
              <div class="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs">
                <img src="${v.imageUrl}" class="w-8 h-8 rounded-lg object-cover" alt="">
                <span class="font-bold text-gray-800 truncate max-w-[150px]">${v.title}</span>
                <span class="text-[10px] text-gray-400 font-mono">₩${v.retailPrice?.toLocaleString()}원</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

function renderAnalyticsTab() {
  const vault = getUserVault();
  const boxes = getRandomBoxTiers();
  
  // Calculate dynamic metrics from local activity
  const unboxedCount = vault.length;
  const convertedCount = vault.filter(v => v.status === 'converted_to_points').length;
  const shippedCount = vault.filter(v => v.status === 'shipping_requested' || v.status === 'shipped').length;
  
  const estimatedGMV = 14850000 + (unboxedCount * 15000);
  const estimatedCOGS = 4752000 + (unboxedCount * 3800);
  const estimatedNet = estimatedGMV - estimatedCOGS;
  const marginRate = Math.round((estimatedNet / estimatedGMV) * 100);

  return `
    <div class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span class="text-[10px] font-bold text-gray-400 uppercase">TOTAL GMV (총 결제액)</span>
          <h4 class="font-black text-2xl text-gray-900 mt-2 font-mono">₩${estimatedGMV.toLocaleString()}원</h4>
          <span class="text-[11px] text-emerald-600 font-bold mt-1 block">▲ 28% 활성 거래</span>
        </div>

        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span class="text-[10px] font-bold text-gray-400 uppercase">도매 사입 원가 (COGS)</span>
          <h4 class="font-black text-2xl text-slate-700 mt-2 font-mono">₩${estimatedCOGS.toLocaleString()}원</h4>
          <span class="text-[11px] text-gray-500 mt-1 block">원가율 ${(100 - marginRate).toFixed(1)}% (도매꾹 B2B)</span>
        </div>

        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span class="text-[10px] font-bold text-gray-400 uppercase">플랫폼 순수익 (NET PROFIT)</span>
          <h4 class="font-black text-2xl text-emerald-600 mt-2 font-mono">₩${estimatedNet.toLocaleString()}원</h4>
          <span class="text-[11px] text-emerald-700 font-bold mt-1 block">순마진율 ${marginRate}%</span>
        </div>

        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span class="text-[10px] font-bold text-gray-400 uppercase">포인트 전환 방어율</span>
          <h4 class="font-black text-2xl text-primary mt-2 font-mono">${unboxedCount > 0 ? Math.round((convertedCount / unboxedCount) * 100) : 75}%</h4>
          <span class="text-[11px] text-primary font-bold mt-1 block">물류비 0원 즉시 방어</span>
        </div>
      </div>

      <!-- Box Performance Breakdown -->
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h4 class="font-bold text-sm text-gray-900">등급별 럭키박스 마진 및 사입 구조 분석</h4>
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

  // Image Upload Handler (Laptop File -> Base64 DataURL)
  window.__handleImageUpload = (e, targetInputId, previewImgId) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 파일 용량은 5MB 이하만 등록 가능합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const input = document.getElementById(targetInputId);
      const preview = document.getElementById(previewImgId);
      if (input) input.value = dataUrl;
      if (preview) preview.src = dataUrl;
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

  window.__saveEditedBoxTier = (boxId) => {
    const name = document.getElementById('tier-name')?.value?.trim();
    const tagline = document.getElementById('tier-tagline')?.value?.trim();
    const price = parseInt(document.getElementById('tier-price')?.value, 10);
    const goldenTickets = parseInt(document.getElementById('tier-tickets')?.value, 10);
    const minGuaranteedValue = parseInt(document.getElementById('tier-minval')?.value, 10);

    if (!name || isNaN(price)) {
      alert('박스명과 가격을 올바르게 입력해주세요.');
      return;
    }

    updateBoxTierSettings(boxId, { name, tagline, price, goldenTickets, minGuaranteedValue });
    window.__closeAdminModal();
    alert('✓ 럭키박스 기본 설정이 수정되었습니다.');
    window.__switchAdminTab('boxes');
  };

  window.__autoBalanceProbs = (boxId) => {
    try {
      autoBalanceBoxProbabilities(boxId);
      alert('✓ 모든 품목의 확률 합계가 정확히 100%로 균등 조정되었습니다.');
      window.__switchAdminTab('boxes');
    } catch (err) {
      alert(err.message);
    }
  };

  window.__deleteBoxItem = (boxId, itemId) => {
    const boxes = getRandomBoxTiers();
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    const item = box.items.find(it => it.id === itemId);
    const itemName = item ? item.name : '해당 품목';

    if (!confirm(`정말 [${itemName}] 품목을 삭제하시겠습니까?`)) return;

    box.items = box.items.filter(it => it.id !== itemId);
    saveRandomBoxTiers(boxes);
    alert('✓ 품목이 삭제되었습니다.');
    window.__switchAdminTab('boxes');
  };

  window.__openAddItemModal = (boxId) => {
    const modalHtml = `
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop bg-black/60 backdrop-blur-sm" id="admin-item-modal" onclick="if(event.target===this)window.__closeAdminModal()">
        <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div class="flex justify-between items-center border-b pb-3">
            <h3 class="font-bold text-lg text-gray-900">새 럭키박스 품목 추가</h3>
            <button onclick="window.__closeAdminModal()" class="text-gray-400 hover:text-gray-600">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="font-bold block text-gray-700 mb-1">품목명</label>
              <input type="text" id="modal-item-name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" placeholder="예: 무선 블루투스 마우스">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-bold block text-gray-700 mb-1">등급</label>
                <select id="modal-item-grade" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                  <option value="NORMAL">NORMAL</option>
                  <option value="RARE">RARE</option>
                  <option value="EPIC">EPIC</option>
                  <option value="LEGENDARY">LEGENDARY</option>
                </select>
              </div>
              <div>
                <label class="font-bold block text-gray-700 mb-1">최소주문(MOQ)</label>
                <input type="text" id="modal-item-moq" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" value="1개 (낱개발송)">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-bold block text-gray-700 mb-1">소비자 정가 (원)</label>
                <input type="number" id="modal-item-retail" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold" placeholder="15000">
              </div>
              <div>
                <label class="font-bold block text-gray-700 mb-1">도매 사입가 (원)</label>
                <input type="number" id="modal-item-wholesale" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600" placeholder="3500">
              </div>
            </div>
            <div>
              <label class="font-bold block text-gray-700 mb-1">당첨 확률 (0.01 = 1% / 0.35 = 35%)</label>
              <input type="number" step="0.01" id="modal-item-prob" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-primary" placeholder="0.25">
            </div>

            <!-- Laptop File Upload + URL Input -->
            <div class="space-y-1.5 pt-1">
              <label class="font-bold block text-gray-700">상품 이미지 (노트북 사진 업로드 / URL)</label>
              <div class="flex items-center gap-3">
                <div class="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-primary shadow-2xs" onclick="document.getElementById('modal-item-file').click()" title="클릭하여 내 노트북에서 사진 선택">
                  <img id="modal-item-preview" src="https://images.unsplash.com/photo-1544816155-12df9643f363?w=400" class="w-full h-full object-cover" alt="">
                </div>
                <div class="flex-1 space-y-1.5">
                  <button type="button" onclick="document.getElementById('modal-item-file').click()" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs transition-colors">
                    <span class="material-symbols-outlined text-sm">upload_file</span>
                    내 노트북에서 사진 올리기
                  </button>
                  <input type="file" id="modal-item-file" accept="image/*" class="hidden" onchange="window.__handleImageUpload(event, 'modal-item-img', 'modal-item-preview')">
                  <input type="text" id="modal-item-img" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-gray-600" value="https://images.unsplash.com/photo-1544816155-12df9643f363?w=400" placeholder="또는 웹 이미지 URL 입력">
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-2 pt-2 border-t">
            <button onclick="window.__closeAdminModal()" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs">취소</button>
            <button onclick="window.__saveNewItem('${boxId}')" class="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl text-xs shadow-md">추가하기</button>
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
              <h3 class="font-bold text-lg text-gray-900">품목 세부사항 수정</h3>
              <p class="text-[10px] text-gray-400 font-mono">ID: ${item.id}</p>
            </div>
            <button onclick="window.__closeAdminModal()" class="text-gray-400 hover:text-gray-600">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="font-bold block text-gray-700 mb-1">품목명</label>
              <input type="text" id="modal-item-name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold" value="${item.name}">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-bold block text-gray-700 mb-1">등급</label>
                <select id="modal-item-grade" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                  <option value="NORMAL" ${item.grade === 'NORMAL' ? 'selected' : ''}>NORMAL</option>
                  <option value="RARE" ${item.grade === 'RARE' ? 'selected' : ''}>RARE</option>
                  <option value="EPIC" ${item.grade === 'EPIC' ? 'selected' : ''}>EPIC</option>
                  <option value="LEGENDARY" ${item.grade === 'LEGENDARY' ? 'selected' : ''}>LEGENDARY</option>
                </select>
              </div>
              <div>
                <label class="font-bold block text-gray-700 mb-1">최소주문(MOQ)</label>
                <input type="text" id="modal-item-moq" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" value="${item.moq || '1개 (낱개발송)'}">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-bold block text-gray-700 mb-1">소비자 정가 (원)</label>
                <input type="number" id="modal-item-retail" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold" value="${item.retailPrice}">
              </div>
              <div>
                <label class="font-bold block text-gray-700 mb-1">도매 사입가 (원)</label>
                <input type="number" id="modal-item-wholesale" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600" value="${item.wholesalePrice || Math.round(item.retailPrice * 0.25)}">
              </div>
            </div>
            <div>
              <label class="font-bold block text-gray-700 mb-1">당첨 확률 (0.01 = 1% / 0.35 = 35%)</label>
              <input type="number" step="0.01" id="modal-item-prob" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-primary" value="${item.prob}">
            </div>

            <!-- Laptop File Upload + URL Input -->
            <div class="space-y-1.5 pt-1">
              <label class="font-bold block text-gray-700">상품 이미지 (노트북 사진 업로드 / URL)</label>
              <div class="flex items-center gap-3">
                <div class="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-primary shadow-2xs" onclick="document.getElementById('modal-item-file').click()" title="클릭하여 내 노트북에서 사진 선택">
                  <img id="modal-item-preview" src="${item.image}" class="w-full h-full object-cover" alt="">
                </div>
                <div class="flex-1 space-y-1.5">
                  <button type="button" onclick="document.getElementById('modal-item-file').click()" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs transition-colors">
                    <span class="material-symbols-outlined text-sm">upload_file</span>
                    내 노트북에서 사진 올리기
                  </button>
                  <input type="file" id="modal-item-file" accept="image/*" class="hidden" onchange="window.__handleImageUpload(event, 'modal-item-img', 'modal-item-preview')">
                  <input type="text" id="modal-item-img" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-gray-600" value="${item.image}" placeholder="또는 웹 이미지 URL 입력">
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-2 pt-2 border-t">
            <button onclick="window.__closeAdminModal()" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs">취소</button>
            <button onclick="window.__saveEditedItem('${boxId}', '${itemId}')" class="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl text-xs shadow-md">수정 완료</button>
          </div>
        </div>
      </div>`;
    document.getElementById('admin-modal-container').innerHTML = modalHtml;
  };

  window.__closeAdminModal = () => {
    const container = document.getElementById('admin-modal-container');
    if (container) container.innerHTML = '';
  };

  window.__saveNewItem = (boxId) => {
    const name = document.getElementById('modal-item-name')?.value?.trim();
    const retail = parseFloat(document.getElementById('modal-item-retail')?.value) || 10000;
    const wholesale = parseFloat(document.getElementById('modal-item-wholesale')?.value) || 2500;
    const grade = document.getElementById('modal-item-grade')?.value || 'NORMAL';
    const moq = document.getElementById('modal-item-moq')?.value?.trim() || '1개';
    const prob = parseFloat(document.getElementById('modal-item-prob')?.value) || 0.1;
    const img = document.getElementById('modal-item-img')?.value?.trim();

    if (!name) { alert('품목명을 입력해주세요.'); return; }

    const boxes = getRandomBoxTiers();
    const box = boxes.find(b => b.id === boxId);
    if (box) {
      box.items.push({
        id: 'item_' + Date.now(),
        name,
        retailPrice: retail,
        wholesalePrice: wholesale,
        grade,
        moq,
        prob,
        image: img || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400'
      });
      saveRandomBoxTiers(boxes);
      window.__closeAdminModal();
      alert('✓ 새 품목이 성공적으로 추가되었습니다.');
      window.__switchAdminTab('boxes');
    }
  };

  window.__saveEditedItem = (boxId, itemId) => {
    const name = document.getElementById('modal-item-name')?.value?.trim();
    const retail = parseFloat(document.getElementById('modal-item-retail')?.value) || 10000;
    const wholesale = parseFloat(document.getElementById('modal-item-wholesale')?.value) || 2500;
    const grade = document.getElementById('modal-item-grade')?.value || 'NORMAL';
    const moq = document.getElementById('modal-item-moq')?.value?.trim() || '1개';
    const prob = parseFloat(document.getElementById('modal-item-prob')?.value) || 0.1;
    const img = document.getElementById('modal-item-img')?.value?.trim();

    if (!name) { alert('품목명을 입력해주세요.'); return; }

    const boxes = getRandomBoxTiers();
    const box = boxes.find(b => b.id === boxId);
    if (box) {
      const item = box.items.find(it => it.id === itemId);
      if (item) {
        item.name = name;
        item.retailPrice = retail;
        item.wholesalePrice = wholesale;
        item.grade = grade;
        item.moq = moq;
        item.prob = prob;
        item.image = img || item.image;
        saveRandomBoxTiers(boxes);
        window.__closeAdminModal();
        alert('✓ 품목 세부 정보가 성공적으로 수정되었습니다.');
        window.__switchAdminTab('boxes');
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
            <div>
              <label class="font-bold block text-gray-700 mb-1">당첨자 추가 보너스 혜택</label>
              <input type="text" id="raffle-bonus" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" value="공식 애플케어 플러스 무상 증정">
            </div>

            <!-- Laptop File Upload + URL Input -->
            <div class="space-y-1.5 pt-1">
              <label class="font-bold block text-gray-700">상품 이미지 (노트북 사진 업로드 / URL)</label>
              <div class="flex items-center gap-3">
                <div class="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-primary shadow-2xs" onclick="document.getElementById('raffle-file').click()" title="클릭하여 내 노트북에서 사진 선택">
                  <img id="raffle-preview" src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600" class="w-full h-full object-cover" alt="">
                </div>
                <div class="flex-1 space-y-1.5">
                  <button type="button" onclick="document.getElementById('raffle-file').click()" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs transition-colors">
                    <span class="material-symbols-outlined text-sm">upload_file</span>
                    내 노트북에서 사진 올리기
                  </button>
                  <input type="file" id="raffle-file" accept="image/*" class="hidden" onchange="window.__handleImageUpload(event, 'raffle-img', 'raffle-preview')">
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
            <div>
              <label class="font-bold block text-gray-700 mb-1">당첨자 추가 보너스 혜택</label>
              <input type="text" id="raffle-bonus" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" value="${raffle.winnerBonus || ''}">
            </div>

            <!-- Laptop File Upload + URL Input -->
            <div class="space-y-1.5 pt-1">
              <label class="font-bold block text-gray-700">상품 이미지 (노트북 사진 업로드 / URL)</label>
              <div class="flex items-center gap-3">
                <div class="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-primary shadow-2xs" onclick="document.getElementById('raffle-file').click()" title="클릭하여 내 노트북에서 사진 선택">
                  <img id="raffle-preview" src="${raffle.imageUrl}" class="w-full h-full object-cover" alt="">
                </div>
                <div class="flex-1 space-y-1.5">
                  <button type="button" onclick="document.getElementById('raffle-file').click()" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs transition-colors">
                    <span class="material-symbols-outlined text-sm">upload_file</span>
                    내 노트북에서 사진 올리기
                  </button>
                  <input type="file" id="raffle-file" accept="image/*" class="hidden" onchange="window.__handleImageUpload(event, 'raffle-img', 'raffle-preview')">
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

  window.__saveNewRaffle = () => {
    const title = document.getElementById('raffle-title')?.value?.trim();
    const retail = parseFloat(document.getElementById('raffle-retail')?.value) || 1000000;
    const unitSize = parseInt(document.getElementById('raffle-unit-size')?.value, 10) || 200;
    const badge = document.getElementById('raffle-badge')?.value?.trim() || 'SUPER RAFFLE';
    const days = parseFloat(document.getElementById('raffle-days')?.value) || 3;
    const bonus = document.getElementById('raffle-bonus')?.value?.trim() || '무상 보증 혜택';
    const img = document.getElementById('raffle-img')?.value?.trim() || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600';

    if (!title) { alert('래플 상품명을 입력해주세요.'); return; }

    const raffles = getSuperRaffles();
    raffles.push({
      id: 'super_' + Date.now(),
      title,
      retailPrice: retail,
      imageUrl: img,
      unitSize: unitSize,
      endTime: Date.now() + days * 86400000,
      winnerBonus: bonus,
      badge,
      status: 'active',
      entries: []
    });
    saveSuperRaffles(raffles);
    window.__closeAdminModal();
    alert('✓ 새 스페셜 골든래플이 등록되었습니다.');
    window.__switchAdminTab('raffles');
  };

  window.__saveEditedRaffle = (raffleId) => {
    const title = document.getElementById('raffle-title')?.value?.trim();
    const retail = parseFloat(document.getElementById('raffle-retail')?.value) || 1000000;
    const unitSize = parseInt(document.getElementById('raffle-unit-size')?.value, 10) || 200;
    const badge = document.getElementById('raffle-badge')?.value?.trim() || 'SUPER RAFFLE';
    const bonus = document.getElementById('raffle-bonus')?.value?.trim() || '';
    const img = document.getElementById('raffle-img')?.value?.trim();

    if (!title) { alert('래플 상품명을 입력해주세요.'); return; }

    const raffles = getSuperRaffles();
    const raffle = raffles.find(r => r.id === raffleId);
    if (raffle) {
      raffle.title = title;
      raffle.retailPrice = retail;
      raffle.unitSize = unitSize;
      raffle.badge = badge;
      raffle.winnerBonus = bonus;
      if (img) raffle.imageUrl = img;
      saveSuperRaffles(raffles);
      window.__closeAdminModal();
      alert('✓ 스페셜 래플 정보가 수정되었습니다.');
      window.__switchAdminTab('raffles');
    }
  };

  window.__deleteRaffle = (raffleId) => {
    const raffles = getSuperRaffles();
    const raffle = raffles.find(r => r.id === raffleId);
    if (!raffle) return;

    if (!confirm(`정말 [${raffle.title}] 스페셜 래플을 삭제하시겠습니까?`)) return;

    deleteSuperRaffle(raffleId);
    alert('✓ 스페셜 래플이 서버에서 성공적으로 삭제되었습니다.');
    window.__switchAdminTab('raffles');
  };

  // --- Force Draw & Auto-Refund End-to-End ---
  window.__forceDrawRaffle = (raffleId) => {
    try {
      const result = forceDrawAndResolveRaffle(raffleId);
      // 1. Refresh background tab to show closed state
      const tabContent = document.getElementById('admin-tab-content');
      if (tabContent) tabContent.innerHTML = renderRafflesTab();
      // 2. Open result modal
      window.__showDrawResultModal(result);
    } catch (err) {
      console.error('Force draw raffle error:', err);
      alert(err.message || '추첨 진행 중 오류가 발생했습니다.');
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
              <h3 class="font-extrabold text-lg text-white mt-1">[${raffle.title}]</h3>
              <p class="text-xs text-amber-300">소비자 정가 ₩${raffle.retailPrice.toLocaleString()}원 상당</p>
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
  window.__updateTracking = (shippingId) => {
    const carrier = document.getElementById(`carrier-${shippingId}`)?.value || 'CJ대한통운';
    const track = document.getElementById(`track-${shippingId}`)?.value?.trim();
    if (!track) { alert('운송장 번호를 입력해주세요.'); return; }

    updateShippingRequestStatus(shippingId, 'shipped', carrier, track);
    alert(`🎉 송장 번호(${carrier} ${track})가 등록되었습니다!\n고객 보관함에서 실시간 배송 조회가 즉시 가능합니다.`);
    window.__switchAdminTab('shipping');
  };

  window.__deleteShipping = (shippingId) => {
    if (!confirm('이 배송 요청을 목록에서 삭제하시겠습니까?')) return;
    deleteShippingRequest(shippingId);
    alert('✓ 배송 요청이 삭제되었습니다.');
    window.__switchAdminTab('shipping');
  };

  window.__createDemoShipping = () => {
    createDemoShippingRequest();
    alert('✓ 테스트 배송 접수가 생성되었습니다.');
    window.__switchAdminTab('shipping');
  };

  // --- 4. User Wallet & Points Management ---
  window.__adminGrantPoints = (pts) => {
    const cur = getUserPoints();
    setUserPoints(cur + pts);
    alert(`포인트 ₩${pts.toLocaleString()}P 가 정상 지급되었습니다.`);
    window.__switchAdminTab('users');
  };

  window.__adminGrantTickets = (tCount) => {
    const cur = getAvailableGoldenTicketsCount();
    setAvailableGoldenTicketsCount(cur + tCount);
    alert(`골든 티켓 ${tCount}장이 정상 지급되었습니다.`);
    window.__switchAdminTab('users');
  };

  window.__adminDirectPoints = (multiplier) => {
    const input = document.getElementById('custom-points-input');
    const val = parseInt(input?.value || '0', 10);
    if (isNaN(val) || val <= 0) {
      alert('조정할 포인트 금액을 입력해주세요.');
      return;
    }
    const cur = getUserPoints();
    const target = Math.max(0, cur + val * multiplier);
    setUserPoints(target);
    alert(`포인트가 ₩${target.toLocaleString()}P 로 조정되었습니다.`);
    window.__switchAdminTab('users');
  };

  window.__adminDirectTickets = (multiplier) => {
    const input = document.getElementById('custom-tickets-input');
    const val = parseInt(input?.value || '0', 10);
    if (isNaN(val) || val <= 0) {
      alert('조정할 티켓 장수를 입력해주세요.');
      return;
    }
    const cur = getAvailableGoldenTicketsCount();
    const target = Math.max(0, cur + val * multiplier);
    setAvailableGoldenTicketsCount(target);
    alert(`골든 티켓이 ${target}장으로 조정되었습니다.`);
    window.__switchAdminTab('users');
  };

  window.__resetAllTestData = () => {
    if (!confirm('⚠️ 모든 테스트 데이터(보관함, 잔액, 래플 상태)를 초기화하시겠습니까?')) return;
    setUserPoints(35000);
    setAvailableGoldenTicketsCount(500);
    alert('✓ 모든 테스트 데이터가 성공적으로 리셋되었습니다.');
    window.__switchAdminTab('users');
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
}
