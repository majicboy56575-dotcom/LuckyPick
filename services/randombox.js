// ============================================
// LuckyPick - Multi-Group Golden Raffle & Auto-Refund Pipeline
// Supports Multi-Group Queues, FIFO Slot Shifting, and Incomplete Group Refunds
// 100% Server-Backed via Cloud Firestore
// ============================================
import { 
  getCurrentUserDocCache, 
  saveUserDocData, 
  getSuperRafflesCache, 
  saveSuperRaffleToFirestore, 
  deleteSuperRaffleFromFirestore,
  getBoxCatalogCache, 
  saveBoxCatalogToFirestore,
  getAllShippingInfosCache,
  submitShippingInfoToFirestore,
  updateShippingStatusInFirestore,
  deleteShippingInfoFromFirestore,
  ensureInitialFirestoreData
} from './firestore.js';
import { getCurrentAuthUser } from './auth.js';

// Default Catalog Configuration (Used for initial Firestore seed)
export const DEFAULT_BOX_TIERS = [
  {
    id: 'box_basic',
    name: '베이직 럭키박스',
    nameEn: 'Basic LuckyBox',
    tagline: '5천원으로 즐기는 100% 실물 득템 & 골든티켓 2장',
    price: 5000,
    minGuaranteedValue: 3900,
    color: 'from-blue-600 via-indigo-600 to-blue-800',
    accentColor: '#3b82f6',
    boxImage: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&auto=format&fit=crop&q=80',
    goldenTickets: 2,
    badge: 'BEST POPULAR',
    items: [
      { id: 'b_item_1', name: '대용량 LED 디지털 잔량표시 보조배터리 10,000mAh', retailPrice: 18900, wholesalePrice: 8700, prob: 0.005, image: 'assets/products/powerbank_10000mah.jpg', grade: 'RARE', moq: '1개' },
      { id: 'b_item_2', name: '차량용 듀얼 초고속 충전 시가잭 45W', retailPrice: 12900, wholesalePrice: 4500, prob: 0.025, image: 'assets/products/carcharger_45w.jpg', grade: 'RARE', moq: '1개' },
      { id: 'b_item_3', name: '304 스테인리스 이중 진공 보온보냉 텀블러 500ml', retailPrice: 7900, wholesalePrice: 3200, prob: 0.170, image: 'assets/products/tumbler_500ml.jpg', grade: 'NORMAL', moq: '1개' },
      { id: 'b_item_4', name: '휴대용 접이식 각도조절 메탈 스마트폰 거치대', retailPrice: 4900, wholesalePrice: 1800, prob: 0.350, image: 'assets/products/phonestand_metal.jpg', grade: 'NORMAL', moq: '1개' },
      { id: 'b_item_5', name: '3in1 패브릭 메탈 초고속 충전 케이블 1.5M', retailPrice: 3900, wholesalePrice: 1400, prob: 0.450, image: 'assets/products/cable_3in1_braided.jpg', grade: 'NORMAL', moq: '1개' },
    ]
  },
  {
    id: 'box_premium',
    name: '프리미엄 럭키박스',
    nameEn: 'Premium LuckyBox',
    tagline: '스마트 IT & 라이프스타일 프리미엄 (골든티켓 4장)',
    price: 15000,
    minGuaranteedValue: 13900,
    color: 'from-purple-600 via-fuchsia-600 to-indigo-800',
    accentColor: '#a855f7',
    boxImage: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
    goldenTickets: 4,
    badge: 'HOT CHOICE',
    items: [
      { id: 'p_item_1', name: '소니 노이즈캔슬링 블루투스 헤드폰 WH-CH520', retailPrice: 69000, wholesalePrice: 49000, prob: 0.003, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80', grade: 'EPIC', moq: '1개' },
      { id: 'p_item_2', name: '무선 고출력 딥티슈 전동 마사지건 (헤드 4종)', retailPrice: 49000, wholesalePrice: 14500, prob: 0.027, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&auto=format&fit=crop&q=80', grade: 'EPIC', moq: '1개' },
      { id: 'p_item_3', name: '캠핑/테이블 휴대용 무선 무드등 서큘레이터', retailPrice: 24000, wholesalePrice: 7900, prob: 0.170, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&auto=format&fit=crop&q=80', grade: 'RARE', moq: '1개' },
      { id: 'p_item_4', name: '블루투스 5.3 초경량 무선 이어폰 C타입', retailPrice: 15900, wholesalePrice: 6500, prob: 0.350, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80', grade: 'RARE', moq: '1개' },
      { id: 'p_item_5', name: 'GaN 65W 3포트 초고속 멀티 충전기', retailPrice: 13900, wholesalePrice: 5800, prob: 0.450, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&auto=format&fit=crop&q=80', grade: 'NORMAL', moq: '1개' },
    ]
  },
  {
    id: 'box_vip',
    name: 'VIP 하이엔드 럭키박스',
    nameEn: 'VIP High-End LuckyBox',
    tagline: '하이엔드 가전 및 명품 굿즈 100% 지급',
    price: 30000,
    minGuaranteedValue: 26900,
    color: 'from-amber-500 via-yellow-600 to-amber-800',
    accentColor: '#eab308',
    boxImage: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=600&auto=format&fit=crop&q=80',
    goldenTickets: 8,
    badge: '👑 HIGH-END',
    items: [
      { id: 'v_item_1', name: '애플 에어팟 4세대 액티브 노이즈 캔슬링', retailPrice: 269000, wholesalePrice: 249000, prob: 0.001, image: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=400&auto=format&fit=crop&q=80', grade: 'LEGENDARY', moq: '1개' },
      { id: 'v_item_2', name: '네스프레소 버츄오 팝 캡슐 커피머신', retailPrice: 139000, wholesalePrice: 99000, prob: 0.009, image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&auto=format&fit=crop&q=80', grade: 'LEGENDARY', moq: '1개' },
      { id: 'v_item_3', name: '스마트 터치 무드등 블루투스 5.0 스피커', retailPrice: 59000, wholesalePrice: 14500, prob: 0.150, image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&auto=format&fit=crop&q=80', grade: 'EPIC', moq: '1개' },
      { id: 'v_item_4', name: '고출력 무선 터보 에어건 먼지제거기 100,000RPM', retailPrice: 29900, wholesalePrice: 13500, prob: 0.400, image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=80', grade: 'RARE', moq: '1개' },
      { id: 'v_item_5', name: '3D 온열 지압 무선 목 어깨 안마기', retailPrice: 26900, wholesalePrice: 12800, prob: 0.440, image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&auto=format&fit=crop&q=80', grade: 'RARE', moq: '1개' },
    ]
  }
];

// Super Golden Raffles with Multi-Group Configuration
export const DEFAULT_SUPER_RAFFLES = [
  {
    id: 'super_iphone16',
    title: '아이폰 16 Pro 256GB 데저트 티타늄',
    retailPrice: 1550000,
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
    unitSize: 200, // 200 tickets per Group
    endTime: Date.now() + 86400000 * 2.5,
    winnerBonus: '공식 애플케어 플러스 무상 증정',
    badge: 'SUPER RAFFLE #1',
    status: 'active',
    entries: [] // Queue of active participants
  },
  {
    id: 'super_ps5',
    title: 'PlayStation 5 Pro 콘솔',
    retailPrice: 1118000,
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
    unitSize: 150, // 150 tickets per Group
    endTime: Date.now() + 86400000 * 4.2,
    winnerBonus: '듀얼센스 추가 컨트롤러 1EA 동봉',
    badge: 'SUPER RAFFLE #2',
    status: 'active',
    entries: []
  }
];

export const LIVE_WINNING_FEED = [
  { icon: 'verified', title: '100% 정품 실물 재화 보장', desc: '모든 럭키박스는 엄선된 정품 실물 상품만 제공됩니다' },
  { icon: 'local_shipping', title: '안전 무료 배송 지원', desc: '획득한 상품은 마이페이지에서 안전하게 택배 배송 신청 가능합니다' },
  { icon: 'undo', title: '100% 자동 환불 보장', desc: '골든 래플 목표 인원 미달 시 응모 티켓이 전액 자동 환불 반환됩니다' },
  { icon: 'security', title: '구매안전서비스(에스크로) 가입', desc: '네이버파이낸셜 구매안전서비스 가입 안전 쇼핑몰' }
];

// Trigger Initial Auto-Seeding to Firestore on startup
setTimeout(() => {
  ensureInitialFirestoreData(DEFAULT_BOX_TIERS, DEFAULT_SUPER_RAFFLES);
}, 300);

// Get Catalog Boxes (100% Firestore Cloud DB backed)
export function getRandomBoxTiers() {
  const serverTiers = getBoxCatalogCache();
  if (serverTiers && Array.isArray(serverTiers) && serverTiers.length > 0) {
    return serverTiers;
  }
  return DEFAULT_BOX_TIERS;
}

export function saveRandomBoxTiers(tiers) {
  saveBoxCatalogToFirestore(tiers);
}

// Get Super Raffles (100% Firestore Cloud DB backed)
export function getSuperRaffles() {
  const serverRaffles = getSuperRafflesCache();
  if (serverRaffles && Array.isArray(serverRaffles) && serverRaffles.length > 0) {
    return serverRaffles;
  }
  return DEFAULT_SUPER_RAFFLES;
}

export function saveSuperRaffles(raffles) {
  if (Array.isArray(raffles)) {
    raffles.forEach(r => saveSuperRaffleToFirestore(r));
  }
}

export function deleteSuperRaffle(raffleId) {
  deleteSuperRaffleFromFirestore(raffleId);
}

export const RANDOM_BOX_TIERS = getRandomBoxTiers();
export const SUPER_GOLDEN_RAFFLES = getSuperRaffles();

// Points Management (100% Firestore User Doc backed)
export function getUserPoints() {
  const docData = getCurrentUserDocCache();
  if (docData && typeof docData.points === 'number') {
    return docData.points;
  }
  return 0;
}

export function setUserPoints(points) {
  saveUserDocData({ points });
  window.dispatchEvent(new CustomEvent('pointsUpdated', { detail: { points } }));
}

// User Vault (100% Firestore User Doc vault backed)
export function getUserVault() {
  const docData = getCurrentUserDocCache();
  if (docData && Array.isArray(docData.vault)) {
    return docData.vault;
  }
  return [];
}

// Unassigned Golden Tickets (100% Firestore User Doc goldenTickets backed)
export function getAvailableGoldenTicketsCount() {
  const docData = getCurrentUserDocCache();
  if (docData && typeof docData.goldenTickets === 'number') {
    return docData.goldenTickets;
  }
  return 0;
}

export function setAvailableGoldenTicketsCount(count) {
  saveUserDocData({ goldenTickets: count });
  window.dispatchEvent(new CustomEvent('ticketsUpdated', { detail: { count } }));
}

// Automatic Initial Migration (Runs at most once per account):
// When a user logs in, if their server document is empty (new account)
// but this local browser has existing test points/tickets/vault, upload them once.
const migratedUserIds = new Set();

window.addEventListener('userDataChanged', (e) => {
  const userDoc = e.detail;
  if (!userDoc || !userDoc.id || migratedUserIds.has(userDoc.id) || userDoc.migratedAt) return;

  const localPts = parseInt(localStorage.getItem(USER_POINTS_KEY) || '0', 10);
  const localTickets = parseInt(localStorage.getItem(UNASSIGNED_TICKETS_KEY) || '0', 10);
  let localVault = [];
  try { localVault = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY) || '[]'); } catch(err) {}

  const needsPointsMigration = (userDoc.points === 0 || userDoc.points === undefined) && localPts > 0;
  const needsTicketsMigration = (userDoc.goldenTickets === 0 || userDoc.goldenTickets === undefined) && localTickets > 0;
  const needsVaultMigration = (!userDoc.vault || userDoc.vault.length === 0) && localVault.length > 0;

  if (needsPointsMigration || needsTicketsMigration || needsVaultMigration) {
    migratedUserIds.add(userDoc.id);
    const updates = { migratedAt: Date.now() };
    if (needsPointsMigration) updates.points = localPts;
    if (needsTicketsMigration) updates.goldenTickets = localTickets;
    if (needsVaultMigration) updates.vault = localVault;
    saveUserDocData(updates);
  } else {
    migratedUserIds.add(userDoc.id);
  }
});

export function getAppliedGoldenTickets(currentUserId) {
  const authUser = getCurrentAuthUser();
  const myId = currentUserId || authUser?.uid || 'my_user_id';
  const myEmail = authUser?.email || '';
  const raffles = getSuperRaffles();
  const applied = [];
  
  raffles.forEach(raffle => {
    const entries = raffle.entries || [];
    const unitSize = raffle.unitSize || 200;
    const isClosed = raffle.status === 'closed';
    const isExpired = Date.now() >= (raffle.endTime || 0);
    const winners = raffle.winners || [];
    const fullGroupsCount = Math.floor(entries.length / unitSize);

    entries.forEach((entry, idx) => {
      if (entry.userId === myId || (myEmail && entry.userEmail === myEmail) || (myId === 'my_user_id' && entry.userId === 'my_user_id')) {
        const groupNumber = Math.floor(idx / unitSize) + 1;
        const isGroupComplete = (groupNumber * unitSize) <= entries.length;

        // Check if this specific ticket won
        const isWinningTicket = winners.some(w => 
          (w.winner && w.winner.ticketNumber === entry.ticketNumber) ||
          w.ticketNumber === entry.ticketNumber ||
          (w.winner && w.winner.ticketId === entry.ticketId)
        );

        // Check if this ticket was in an incomplete group and refunded
        const isRefunded = isClosed && (groupNumber > fullGroupsCount);

        let statusText = 'active'; // 'active' | 'group_locked' | 'won' | 'closed_lost' | 'refunded'
        if (isWinningTicket) {
          statusText = 'won';
        } else if (isRefunded) {
          statusText = 'refunded';
        } else if (isClosed) {
          statusText = 'closed_lost';
        } else if (isGroupComplete) {
          statusText = 'group_locked';
        }

        applied.push({
          ...entry,
          raffleId: raffle.id,
          raffleTitle: raffle.title,
          raffleStatus: raffle.status || (isExpired ? 'closed' : 'active'),
          groupNumber,
          isGroupComplete,
          isWinningTicket,
          isRefunded,
          resolvedStatus: statusText,
          closedAt: raffle.closedAt || null
        });
      }
    });
  });

  return applied;
}


// Multi-Group Calculation Helper
export function getRaffleGroupData(raffle, currentUserId) {
  const authUser = getCurrentAuthUser();
  const myId = currentUserId || authUser?.uid || 'my_user_id';
  const myEmail = authUser?.email || '';
  const unitSize = raffle.unitSize || 200;
  const entries = raffle.entries || [];
  const totalCount = entries.length;

  const totalGroups = Math.max(1, Math.ceil(totalCount / unitSize) || 1);
  const groups = [];

  for (let g = 0; g < totalGroups; g++) {
    const startIdx = g * unitSize;
    const endIdx = startIdx + unitSize;
    const groupEntries = entries.slice(startIdx, endIdx);
    const count = groupEntries.length;
    const isComplete = count >= unitSize;

    // Check user's participation in this group
    const myEntriesInGroup = groupEntries.filter(e => 
      e.userId === myId || (myEmail && e.userEmail === myEmail) || (myId === 'my_user_id' && e.userId === 'my_user_id')
    );

    groups.push({
      groupNumber: g + 1,
      startSlot: startIdx + 1,
      endSlot: endIdx,
      count,
      unitSize,
      fillPercentage: Math.min(100, Math.round((count / unitSize) * 100)),
      isComplete,
      entries: groupEntries,
      hasMyTicket: myEntriesInGroup.length > 0,
      myTicketCount: myEntriesInGroup.length,
      mySlots: myEntriesInGroup.map(e => e.slotIndex)
    });
  }

  // If the last group is complete, create an empty pending next group
  const lastGroup = groups[groups.length - 1];
  if (lastGroup && lastGroup.isComplete) {
    const nextG = groups.length + 1;
    const nextStart = groups.length * unitSize + 1;
    groups.push({
      groupNumber: nextG,
      startSlot: nextStart,
      endSlot: nextStart + unitSize - 1,
      count: 0,
      unitSize,
      fillPercentage: 0,
      isComplete: false,
      entries: [],
      hasMyTicket: false,
      myTicketCount: 0,
      mySlots: []
    });
  }

  const completedGroupsCount = groups.filter(g => g.isComplete).length;

  return {
    totalParticipants: totalCount,
    unitSize,
    completedGroupsCount,
    groups
  };
}

// Apply Golden Tickets to a Super Raffle (Append to Multi-Group Queue)
export function applyGoldenTicketsToRaffle(raffleId, ticketCount, userInfo = {}) {
  const available = getAvailableGoldenTicketsCount();
  const count = parseInt(ticketCount, 10);
  if (isNaN(count) || count <= 0) throw new Error('올바른 티켓 수량을 입력해주세요.');
  if (count > available) throw new Error(`보유 티켓이 부족합니다. (보유: ${available}장 / 신청: ${count}장)`);

  const raffles = getSuperRaffles();
  const targetRaffle = raffles.find(r => r.id === raffleId);
  if (!targetRaffle) throw new Error('해당 스페셜 래플을 찾을 수 없습니다.');

  if (!targetRaffle.entries) targetRaffle.entries = [];

  setAvailableGoldenTicketsCount(available - count);

  const newApplied = [];
  const authUser = getCurrentAuthUser();
  const userName = authUser?.displayName || userInfo.name || '나(회원)';
  const userEmail = authUser?.email || userInfo.email || 'my_account@luckypick.com';
  const userId = authUser?.uid || userInfo.uid || 'my_user_id';

  for (let i = 0; i < count; i++) {
    const currentSlot = targetRaffle.entries.length + 1;
    const num = '#' + String(Math.floor(1000 + Math.random() * 9000)) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    const entry = {
      ticketId: 'ticket_' + Date.now() + '_' + i,
      ticketNumber: num,
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      appliedAt: Date.now(),
      slotIndex: currentSlot,
      status: 'active'
    };
    targetRaffle.entries.push(entry);
    newApplied.push(entry);
  }

  saveSuperRaffles(raffles);

  return {
    raffle: targetRaffle,
    appliedCount: count,
    remainingTickets: available - count,
    newTickets: newApplied
  };
}

// Cancel User's Ticket & FIFO Slot Shifting (Requirement 4)
export function cancelGoldenTicketApplication(raffleId, ticketId) {
  const raffles = getSuperRaffles();
  const targetRaffle = raffles.find(r => r.id === raffleId);
  if (!targetRaffle || !targetRaffle.entries) throw new Error('해당 래플을 찾을 수 없습니다.');

  if (targetRaffle.status === 'closed') {
    throw new Error('이미 마감된 래플의 응모는 취소할 수 없습니다.');
  }

  const index = targetRaffle.entries.findIndex(e => e.ticketId === ticketId);
  if (index === -1) throw new Error('해당 응모 내역을 찾을 수 없습니다.');

  // Check if ticket is in a completed group
  const unitSize = targetRaffle.unitSize || 200;
  const groupIndex = Math.floor(index / unitSize);
  const groupStart = groupIndex * unitSize;
  const groupCount = Math.min(unitSize, targetRaffle.entries.length - groupStart);
  if (groupCount >= unitSize && (groupStart + unitSize) <= targetRaffle.entries.length && index < (groupStart + unitSize)) {
    // If the group is already 100% full and locked
    const isCompletedGroup = (groupIndex + 1) * unitSize <= targetRaffle.entries.length;
    if (isCompletedGroup) {
      throw new Error('이미 목표 인원을 100% 달성하여 추첨이 확정된 그룹은 응모를 취소할 수 없습니다.');
    }
  }

  // Remove the cancelled ticket
  const removedEntry = targetRaffle.entries.splice(index, 1)[0];

  // Re-index all subsequent slots sequentially (FIFO Shift Forward)
  targetRaffle.entries.forEach((entry, idx) => {
    entry.slotIndex = idx + 1;
  });

  saveSuperRaffles(raffles);

  // Refund ticket back to wallet
  const currentAvailable = getAvailableGoldenTicketsCount();
  const newBalance = currentAvailable + 1;
  setAvailableGoldenTicketsCount(newBalance);

  return {
    remainingActiveCount: targetRaffle.entries.length,
    refundedTickets: 1,
    newAvailableBalance: newBalance,
    removedEntry,
    raffle: targetRaffle
  };
}

// Force Draw and Auto-Refund Raffle (Admin & Expiration Resolver)
export function forceDrawAndResolveRaffle(raffleId) {
  const raffles = getSuperRaffles();
  const raffle = raffles.find(r => String(r.id) === String(raffleId));
  if (!raffle) throw new Error('해당 스페셜 래플을 찾을 수 없습니다.');
  if (raffle.status === 'closed') throw new Error('이미 추첨 및 마감 처리가 완료된 래플입니다.');

  if (!raffle.entries || raffle.entries.length === 0) {
    initializeSuperRafflesSeed([raffle]);
  }

  const entries = raffle.entries || [];
  const unitSize = raffle.unitSize || 200;
  const fullGroupsCount = Math.floor(entries.length / unitSize);
  const remainderCount = entries.length % unitSize;

  if (entries.length === 0) throw new Error('참여자가 없어 추첨을 진행할 수 없습니다.');

  // 1. Draw winners for full complete groups
  const winners = [];
  const vault = getUserVault();
  let myWinningCount = 0;

  for (let g = 0; g < fullGroupsCount; g++) {
    const groupEntries = entries.slice(g * unitSize, (g + 1) * unitSize);
    const winnerEntry = groupEntries[Math.floor(Math.random() * groupEntries.length)];
    winners.push({
      groupNumber: g + 1,
      startSlot: g * unitSize + 1,
      endSlot: (g + 1) * unitSize,
      winner: winnerEntry,
      wonAt: Date.now()
    });

    // If test user won, deliver prize into user's vault!
    if (winnerEntry.userId === 'my_user_id') {
      myWinningCount++;
      vault.unshift({
        id: 'vault_raffle_' + Date.now() + '_' + g,
        tierId: 'super_raffle',
        tierName: `스페셜 래플 [그룹 ${g + 1}] 1등 당첨!`,
        itemId: raffle.id,
        title: raffle.title,
        imageUrl: raffle.imageUrl,
        retailPrice: raffle.retailPrice,
        grade: 'LEGENDARY',
        refundPoints: Math.round(raffle.retailPrice * 0.8),
        status: 'in_vault',
        wonAt: Date.now()
      });
    }
  }

  if (myWinningCount > 0) {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(vault));
  }

  // 2. Auto-refund Golden Tickets for incomplete tail group
  let myRefundCount = 0;
  if (remainderCount > 0) {
    const incompleteEntries = entries.slice(fullGroupsCount * unitSize);
    incompleteEntries.forEach(entry => {
      if (entry.userId === 'my_user_id') {
        myRefundCount++;
      }
    });

    if (myRefundCount > 0) {
      const cur = getAvailableGoldenTicketsCount();
      setAvailableGoldenTicketsCount(cur + myRefundCount);

      const refundNotices = getTicketRefundNotices();
      refundNotices.push({
        id: 'refund_' + Date.now(),
        raffleTitle: raffle.title,
        groupNumber: fullGroupsCount + 1,
        gathered: remainderCount,
        target: unitSize,
        refundCount: myRefundCount,
        createdAt: Date.now()
      });
      saveUserDocData({ ticketRefundNotices: refundNotices });
    }
  }

  raffle.winners = winners;
  raffle.status = 'closed';
  raffle.closedAt = Date.now();
  raffle.refundCount = remainderCount;
  saveSuperRaffles(raffles);

  window.dispatchEvent(new CustomEvent('raffleUpdated', { detail: { raffle } }));

  return {
    raffle,
    fullGroupsCount,
    remainderCount,
    winners,
    myWinningCount,
    myRefundCount
  };
}

// Reopen a closed raffle (For testing/admin convenience)
export function reopenRaffle(raffleId, extendDays = 3) {
  const raffles = getSuperRaffles();
  const raffle = raffles.find(r => String(r.id) === String(raffleId));
  if (!raffle) throw new Error('해당 래플을 찾을 수 없습니다.');

  raffle.status = 'active';
  raffle.winners = [];
  raffle.endTime = Date.now() + extendDays * 86400000;
  saveSuperRaffles(raffles);
  window.dispatchEvent(new CustomEvent('raffleUpdated', { detail: { raffle } }));
  return raffle;
}

// Update Box Tier Settings
export function updateBoxTierSettings(boxId, newSettings) {
  const boxes = getRandomBoxTiers();
  const box = boxes.find(b => b.id === boxId);
  if (!box) throw new Error('해당 럭키박스를 찾을 수 없습니다.');

  if (newSettings.name) box.name = newSettings.name;
  if (newSettings.tagline) box.tagline = newSettings.tagline;
  if (newSettings.price !== undefined) box.price = Number(newSettings.price);
  if (newSettings.goldenTickets !== undefined) box.goldenTickets = Number(newSettings.goldenTickets);
  if (newSettings.minGuaranteedValue !== undefined) box.minGuaranteedValue = Number(newSettings.minGuaranteedValue);
  if (newSettings.boxImage) box.boxImage = newSettings.boxImage;

  saveRandomBoxTiers(boxes);
  return box;
}

// Auto-balance Box Probabilities to 100%
export function autoBalanceBoxProbabilities(boxId) {
  const boxes = getRandomBoxTiers();
  const box = boxes.find(b => b.id === boxId);
  if (!box || !box.items || box.items.length === 0) throw new Error('품목이 존재하지 않습니다.');

  const count = box.items.length;
  const equalProb = Number((1 / count).toFixed(4));
  let sum = 0;

  box.items.forEach((item, idx) => {
    if (idx === count - 1) {
      item.prob = Number((1.0 - sum).toFixed(4));
    } else {
      item.prob = equalProb;
      sum += equalProb;
    }
  });

  saveRandomBoxTiers(boxes);
  return box;
}

// Expiration / Underflow Auto-Refund Pipeline
export function checkAndResolveRaffleExpirations() {
  const raffles = getSuperRaffles();
  let updated = false;

  raffles.forEach(raffle => {
    if (raffle.status !== 'active') return;

    // Check if expired
    const isExpired = Date.now() >= raffle.endTime;
    if (!isExpired) return;

    try {
      forceDrawAndResolveRaffle(raffle.id);
      updated = true;
    } catch (e) {
      console.warn('Auto resolve raffle failed:', e);
    }
  });

  return updated;
}

// Refund Notices (100% Firestore User Doc backed)
export function getTicketRefundNotices() {
  const docData = getCurrentUserDocCache();
  if (docData && Array.isArray(docData.ticketRefundNotices)) {
    return docData.ticketRefundNotices;
  }
  return [];
}

export function clearTicketRefundNotices() {
  saveUserDocData({ ticketRefundNotices: [] });
}

// Open Random Box (100% Firestore User Doc backed)
export function openRandomBox(tierId) {
  const tiers = getRandomBoxTiers();
  const tier = tiers.find(t => t.id === tierId);
  if (!tier) throw new Error('존재하지 않는 럭키박스입니다.');

  const rand = Math.random();
  let cumulative = 0;
  let wonItem = tier.items[tier.items.length - 1];

  for (const item of tier.items) {
    cumulative += item.prob;
    if (rand <= cumulative) {
      wonItem = item;
      break;
    }
  }

  const vaultId = 'vault_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const refundPoints = Math.round(wonItem.retailPrice * 0.8);

  const vaultRecord = {
    id: vaultId,
    tierId: tier.id,
    tierName: tier.name,
    itemId: wonItem.id,
    title: wonItem.name,
    imageUrl: wonItem.image,
    retailPrice: wonItem.retailPrice,
    grade: wonItem.grade,
    refundPoints: refundPoints,
    status: 'in_vault',
    wonAt: Date.now(),
  };

  const vault = getUserVault();
  vault.unshift(vaultRecord);

  const currentTickets = getAvailableGoldenTicketsCount();
  const newTicketBalance = currentTickets + tier.goldenTickets;

  saveUserDocData({ 
    vault, 
    goldenTickets: newTicketBalance 
  });

  return {
    tier,
    wonItem,
    vaultRecord,
    earnedGoldenTickets: tier.goldenTickets,
    totalGoldenTickets: newTicketBalance
  };
}

// Convert won item into points (80% value) (100% Firestore backed)
export function convertVaultItemToPoints(vaultId) {
  const vault = getUserVault();
  let index = vault.findIndex(v => String(v.id) === String(vaultId));
  if (index === -1) {
    index = vault.findIndex(v => !v.status || v.status === 'in_vault');
  }
  if (index === -1) throw new Error('해당 보관함 아이템을 찾을 수 없습니다.');

  const item = vault[index];
  if (item.status === 'shipping_requested') {
    throw new Error('이미 배송 접수가 진행 중인 상품은 포인트로 전환할 수 없습니다.');
  }
  if (item.status === 'converted_to_points') {
    throw new Error('이미 포인트로 전환 완료된 상품입니다.');
  }

  const refundPoints = item.refundPoints || Math.round((Number(item.retailPrice) || 5000) * 0.8);
  item.refundPoints = refundPoints;
  item.status = 'converted_to_points';
  item.convertedAt = Date.now();

  const currentPoints = getUserPoints();
  const newPoints = currentPoints + refundPoints;

  saveUserDocData({ 
    vault, 
    points: newPoints 
  });

  return { item, newPoints, addedPoints: refundPoints };
}

// Request Individual Shipping (100% Firestore collection shipping_infos & userDoc backed)
export function requestShippingForVaultItem(vaultId, shippingData) {
  const vault = getUserVault();
  let index = vault.findIndex(v => String(v.id) === String(vaultId));
  if (index === -1 && shippingData?.itemTitle) {
    index = vault.findIndex(v => v.title === shippingData.itemTitle && (!v.status || v.status === 'in_vault'));
  }
  if (index === -1) {
    index = vault.findIndex(v => !v.status || v.status === 'in_vault');
  }
  if (index === -1) throw new Error('해당 보관함 아이템을 찾을 수 없습니다.');

  const item = vault[index];
  if (item.status === 'shipping_requested') {
    throw new Error('이미 배송 접수가 완료된 상품입니다.');
  }
  if (item.status === 'converted_to_points') {
    throw new Error('이미 포인트로 환급 전환된 상품입니다.');
  }

  const fee = Number(shippingData.fee) || 3000;
  const payMethod = shippingData.payMethod || 'points';

  // If paid with points, deduct from points balance
  let curPts = getUserPoints();
  if (payMethod === 'points') {
    if (curPts < fee) {
      throw new Error(`보유 포인트가 부족합니다. (보유: ₩${curPts.toLocaleString()}P / 배송비: ₩${fee.toLocaleString()}원)`);
    }
    curPts -= fee;
  }

  item.status = 'shipping_requested';
  item.shippingData = shippingData;
  item.shippingFee = fee;
  item.shippingPayMethod = payMethod;
  item.requestedAt = Date.now();

  const authUser = getCurrentAuthUser();
  const shippingId = 'ship_' + Date.now();

  const newShippingRecord = {
    shippingId,
    vaultId: item.id || vaultId,
    userId: authUser?.uid || 'guest',
    userEmail: authUser?.email || 'guest@luckypick.com',
    itemTitle: item.title,
    retailPrice: item.retailPrice,
    imageUrl: item.imageUrl,
    shippingData,
    shippingFee: fee,
    shippingPayMethod: payMethod,
    status: 'pending',
    requestedAt: Date.now(),
    carrier: 'CJ대한통운',
    trackingNumber: ''
  };

  // Submit to central shipping_infos Firestore collection
  submitShippingInfoToFirestore(newShippingRecord);

  // Also update user's own document
  const userShippingRequests = (getCurrentUserDocCache()?.shippingRequests || []);
  userShippingRequests.unshift(newShippingRecord);

  saveUserDocData({ 
    vault, 
    points: curPts,
    shippingRequests: userShippingRequests 
  });

  return item;
}

// Admin Shipping Requests (100% Firestore collection shipping_infos backed)
export function getAllShippingRequests() {
  const serverShipping = getAllShippingInfosCache();
  if (serverShipping && Array.isArray(serverShipping) && serverShipping.length > 0) {
    return serverShipping;
  }
  const userDoc = getCurrentUserDocCache();
  if (userDoc && Array.isArray(userDoc.shippingRequests)) {
    return userDoc.shippingRequests;
  }
  return [];
}

export function updateShippingRequestStatus(shippingId, status, carrier = '', trackingNumber = '') {
  // Update central shipping_infos collection
  updateShippingStatusInFirestore(shippingId, status, carrier, trackingNumber);

  // Update in user vault if applicable
  const vault = getUserVault();
  const vaultItem = vault.find(v => v.id === shippingId || (v.shippingData && v.status === 'shipping_requested'));
  if (vaultItem) {
    vaultItem.status = status;
    vaultItem.carrier = carrier;
    vaultItem.trackingNumber = trackingNumber;
    vaultItem.shippedAt = Date.now();
    saveUserDocData({ vault });
  }

  return { shippingId, status, carrier, trackingNumber };
}

export function deleteShippingRequest(shippingId) {
  deleteShippingInfoFromFirestore(shippingId);
}

export function createDemoShippingRequest() {
  const authUser = getCurrentAuthUser();
  const demo = {
    shippingId: 'ship_demo_' + Date.now(),
    vaultId: 'vault_demo_' + Date.now(),
    userId: authUser?.uid || 'demo_user',
    userEmail: authUser?.email || 'admin@luckypick.com',
    itemTitle: '애플 에어팟 4세대 ANC (노이즈 캔슬링)',
    retailPrice: 269000,
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400',
    shippingData: {
      name: '이재영',
      phone: '010-4710-5657',
      address: '경기도 화성시 만세구 수노을1로 148, 101동 902호',
      memo: '부재 시 문 앞에 놓아주세요.'
    },
    shippingFee: 3000,
    shippingPayMethod: 'points',
    status: 'pending',
    requestedAt: Date.now(),
    carrier: 'CJ대한통운',
    trackingNumber: ''
  };
  submitShippingInfoToFirestore(demo);
  return demo;
}

