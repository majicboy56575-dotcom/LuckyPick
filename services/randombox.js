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
  ensureInitialFirestoreData,
  openLuckyBoxServer,
  purchaseProductServer,
  convertVaultItemToPointsServer,
  applyGoldenRaffleServer,
  cancelGoldenRaffleServer,
  forceDrawRaffleServer,
  requestVaultShippingServer,
  grantUserBalanceServer
} from './firestore.js';
import { getCurrentAuthUser } from './auth.js';

// Default Catalog Configuration (3 Tiers x 3 Items = 9 Fixed-Price Products)
export const DEFAULT_BOX_TIERS = [
  {
    id: 'box_basic',
    name: '베이직 픽',
    nameEn: 'Basic Pick',
    tagline: '5천원으로 즐기는 100% 정품 실물 픽 & 골든티켓 2장',
    price: 5000,
    minGuaranteedValue: 5000,
    color: 'from-blue-600 via-indigo-600 to-blue-800',
    accentColor: '#3b82f6',
    boxImage: 'assets/products/phonestand_metal.jpg',
    goldenTickets: 2,
    badge: 'BEST POPULAR',
    items: [
      { id: 'b_item_1', name: '휴대용 접이식 각도조절 메탈 스마트폰 거치대', retailPrice: 5000, wholesalePrice: 1800, prob: 0.334, image: 'assets/products/phonestand_metal.jpg', grade: 'NORMAL', moq: '1개', badge: '인기 1위', description: '고강도 알루미늄 합금, 자유로운 각도 조절 및 안정적인 미끄럼 방지 실리콘' },
      { id: 'b_item_2', name: '3in1 패브릭 메탈 초고속 충전 케이블 1.5M', retailPrice: 5000, wholesalePrice: 1400, prob: 0.333, image: 'assets/products/cable_3in1_braided.jpg', grade: 'NORMAL', moq: '1개', badge: 'MD추천', description: 'C타입, 8핀, 5핀 동시 고속 충전, 단선 방지 고내구성 나일론 브레이디드' },
      { id: 'b_item_3', name: '304 스테인리스 이중 진공 보온보냉 텀블러 500ml', retailPrice: 5000, wholesalePrice: 2800, prob: 0.333, image: 'assets/products/tumbler_500ml.jpg', grade: 'NORMAL', moq: '1개', badge: '스테디셀러', description: '식품용 최고급 304 스테인리스, 24시간 보온/보냉 완벽 유지 진공 텀블러' },
    ]
  },
  {
    id: 'box_premium',
    name: '프리미엄 픽',
    nameEn: 'Premium Pick',
    tagline: '만원의 행복! 스마트 IT & 라이프스타일 픽 (골든티켓 5장)',
    price: 10000,
    minGuaranteedValue: 10000,
    color: 'from-purple-600 via-fuchsia-600 to-indigo-800',
    accentColor: '#a855f7',
    boxImage: 'assets/products/powerbank_10000mah.jpg',
    goldenTickets: 5,
    badge: 'HOT CHOICE',
    items: [
      { id: 'p_item_1', name: '대용량 LED 디지털 잔량표시 보조배터리 10,000mAh', retailPrice: 10000, wholesalePrice: 4800, prob: 0.334, image: 'assets/products/powerbank_10000mah.jpg', grade: 'RARE', moq: '1개', badge: '베스트셀러', description: '1% 단위 정밀 LED 배터리 잔량 표시, 듀얼 초고속 동시 충전' },
      { id: 'p_item_2', name: '맥세이프 15W 3in1 무선 고속 충전패드', retailPrice: 10000, wholesalePrice: 3900, prob: 0.333, image: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=400&auto=format&fit=crop&q=80', grade: 'RARE', moq: '1개', badge: 'HIT', description: '스마트폰, 무선이어폰, 스마트워치를 케이블 하나로 동시 고속 무선 충전' },
      { id: 'p_item_3', name: 'GaN 45W 초고속 듀얼 충전기', retailPrice: 10000, wholesalePrice: 5200, prob: 0.333, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&auto=format&fit=crop&q=80', grade: 'RARE', moq: '1개', badge: '고출력', description: '차세대 질화갈륨(GaN) 기술 적용, 초소형 초경량 45W 초고속 듀얼 포트' },
    ]
  },
  {
    id: 'box_vip',
    name: 'VIP 하이엔드 픽',
    nameEn: 'VIP High-End Pick',
    tagline: '하이엔드 프리미엄 라이프 굿즈 100% 지급 (골든티켓 11장)',
    price: 20000,
    minGuaranteedValue: 20000,
    color: 'from-amber-500 via-yellow-600 to-amber-800',
    accentColor: '#eab308',
    boxImage: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80',
    goldenTickets: 11,
    badge: '👑 HIGH-END',
    items: [
      { id: 'v_item_1', name: '블루투스 5.3 초경량 무선 노이즈캔슬링 이어폰', retailPrice: 20000, wholesalePrice: 8900, prob: 0.334, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80', grade: 'EPIC', moq: '1개', badge: '👑 프리미엄', description: '최신 Bluetooth 5.3 탑재, ENC 통화 노이즈 캔슬링 및 Hi-Fi 고음질 사운드' },
      { id: 'v_item_2', name: '캠핑/테이블 휴대용 무선 무드등 서큘레이터', retailPrice: 20000, wholesalePrice: 6800, prob: 0.333, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&auto=format&fit=crop&q=80', grade: 'RARE', moq: '1개', badge: '감성 캠핑', description: '무선 대용량 배터리 내장, 3단계 풍속 조절 및 감성 웜톤 LED 무드등' },
      { id: 'v_item_3', name: '초고속 프리미엄 PD 65W 20,000mAh 보조배터리', retailPrice: 20000, wholesalePrice: 5900, prob: 0.333, image: 'assets/products/powerbank_10000mah.jpg', grade: 'RARE', moq: '1개', badge: '대용량', description: '노트북까지 충전 가능한 65W 초고출력 PD 고속 충전 및 메탈릭 슬림 바디' },
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
    badge: 'SUPER RAFFLE #1',
    status: 'active',
    entries: [] // Queue of active participants
  },
  {
    id: 'super_gucci_bag',
    title: '구찌 오피디아 GG 스몰 숄더백',
    retailPrice: 2450000,
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
    unitSize: 250, // 250 tickets per Group
    endTime: 1791980800000,
    badge: 'SUPER RAFFLE #2',
    status: 'active',
    entries: []
  }
];

export const LIVE_WINNING_FEED = [
  { icon: 'verified', title: '100% 정품 실물 재화 보장', desc: '모든 상품은 엄선된 제조사 정품 실물로만 구성되어 있습니다' },
  { icon: 'local_shipping', title: '전국 안심 택배 배송', desc: '획득한 모든 실물 상품은 마이페이지에서 간편하게 택배 배송 신청 가능합니다' },
  { icon: 'published_with_changes', title: '단순변심 반품 적립 지원', desc: '배송 전 단순변심 시 60% 스토어 적립금으로 즉시 반품 전환 가능합니다' },
  { icon: 'security', title: '구매안전서비스(에스크로) 가입', desc: '네이버파이낸셜 구매안전서비스 정식 가입 안전 쇼핑몰' }
];

// Trigger Initial Auto-Seeding to Firestore on startup (Box Catalog only)
setTimeout(() => {
  ensureInitialFirestoreData(DEFAULT_BOX_TIERS);
}, 300);

// Get Catalog Boxes (100% Firestore Cloud DB backed with resilient defaults fallback)
export function getRandomBoxTiers() {
  const serverTiers = getBoxCatalogCache();
  if (serverTiers && Array.isArray(serverTiers) && serverTiers.length > 0) {
    return serverTiers.map(serverTier => {
      // Find fallback default tier for missing styling/theme attributes (e.g., color gradients)
      const defaultTier = DEFAULT_BOX_TIERS.find(dt => dt.id === serverTier.id) || {};
      
      // Map items strictly based on serverTier.items so deleted items are NOT resurrected
      const items = (serverTier.items || []).map(serverItem => {
        const defaultItem = (defaultTier.items || []).find(di => di.id === serverItem.id) || {};
        return {
          id: serverItem.id || 'item_' + Date.now(),
          name: serverItem.name || defaultItem.name || '새 품목',
          retailPrice: (serverItem.retailPrice !== undefined && serverItem.retailPrice !== null) ? Number(serverItem.retailPrice) : (defaultItem.retailPrice || 10000),
          wholesalePrice: (serverItem.wholesalePrice !== undefined && serverItem.wholesalePrice !== null) ? Number(serverItem.wholesalePrice) : (defaultItem.wholesalePrice || 2500),
          prob: (serverItem.prob !== undefined && serverItem.prob !== null) ? Number(serverItem.prob) : (defaultItem.prob !== undefined ? defaultItem.prob : 0.1),
          grade: serverItem.grade || defaultItem.grade || 'NORMAL',
          moq: serverItem.moq || defaultItem.moq || '1개',
          image: serverItem.image || defaultItem.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400'
        };
      });

      const rawName = serverTier.name || defaultTier.name;
      const formattedName = rawName ? rawName.replace(/럭키박스/g, '픽') : defaultTier.name;
      const rawTagline = serverTier.tagline || defaultTier.tagline;
      const formattedTagline = rawTagline ? rawTagline.replace(/럭키박스/g, '픽') : defaultTier.tagline;

      return {
        ...defaultTier,
        ...serverTier,
        name: formattedName,
        price: (serverTier.price !== undefined && serverTier.price !== null) ? Number(serverTier.price) : defaultTier.price,
        goldenTickets: (serverTier.goldenTickets !== undefined && serverTier.goldenTickets !== null) ? Number(serverTier.goldenTickets) : defaultTier.goldenTickets,
        minGuaranteedValue: (serverTier.minGuaranteedValue !== undefined && serverTier.minGuaranteedValue !== null) ? Number(serverTier.minGuaranteedValue) : defaultTier.minGuaranteedValue,
        tagline: formattedTagline,
        boxImage: serverTier.boxImage || defaultTier.boxImage || 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&auto=format&fit=crop&q=80',
        color: serverTier.color || defaultTier.color || 'from-blue-600 via-indigo-600 to-blue-800',
        accentColor: serverTier.accentColor || defaultTier.accentColor || '#3b82f6',
        badge: serverTier.badge || defaultTier.badge || 'HOT',
        items
      };
    });
  }
  return DEFAULT_BOX_TIERS;
}

export async function saveRandomBoxTiers(tiers) {
  return await saveBoxCatalogToFirestore(tiers);
}

export async function deleteBoxTierItem(boxId, itemId) {
  const tiers = getRandomBoxTiers();
  const tier = tiers.find(t => String(t.id) === String(boxId));
  if (!tier) return false;

  tier.items = (tier.items || []).filter(it => String(it.id) !== String(itemId));

  // Also remove from in-memory DEFAULT_BOX_TIERS if present
  const defaultTier = DEFAULT_BOX_TIERS.find(t => String(t.id) === String(boxId));
  if (defaultTier && Array.isArray(defaultTier.items)) {
    defaultTier.items = defaultTier.items.filter(it => String(it.id) !== String(itemId));
  }

  await saveRandomBoxTiers(tiers);
  return true;
}

// Get Super Raffles (100% Pure Firestore Cloud DB - Zero Hardcoded Fallbacks)
export function getSuperRaffles() {
  const serverRaffles = getSuperRafflesCache();
  if (serverRaffles && Array.isArray(serverRaffles)) {
    return serverRaffles;
  }
  return [];
}

export async function saveSuperRaffles(raffles) {
  if (Array.isArray(raffles)) {
    for (const r of raffles) {
      await saveSuperRaffleToFirestore(r);
    }
  }
}

export async function deleteSuperRaffle(raffleId) {
  return await deleteSuperRaffleFromFirestore(raffleId);
}

export const RANDOM_BOX_TIERS = getRandomBoxTiers();
export const SUPER_GOLDEN_RAFFLES = getSuperRaffles();

// Points Management (100% Firestore User Doc backed)
export function getUserPoints() {
  const docData = getCurrentUserDocCache();
  if (docData && docData.points !== undefined && docData.points !== null) {
    const pts = Number(docData.points);
    if (!isNaN(pts)) return pts;
  }
  return 0;
}

export async function setUserPoints(points) {
  const authUser = getCurrentAuthUser();
  await grantUserBalanceServer(authUser?.uid || null, authUser?.email || null, Number(points), null);
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
export const DAILY_RAFFLE_LIMIT = 10;

export function getDailyRaffleStats(raffleId) {
  const authUser = getCurrentAuthUser();
  const myId = authUser?.uid;
  const myEmail = authUser?.email;

  // 1. Calculate today's date in KST (Asia/Seoul)
  const now = new Date();
  const todayKstStr = new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const startOfTodayKst = new Date(todayKstStr + 'T00:00:00+09:00').getTime();
  const endOfTodayKst = startOfTodayKst + 24 * 3600 * 1000;

  // 2. Count actual active tickets entered TODAY for THIS specific raffle (SSOT)
  let entriesAppliedToday = 0;
  try {
    const raffles = getSuperRaffles();
    const targetRaffles = raffleId ? raffles.filter(r => r.id === raffleId) : raffles;
    targetRaffles.forEach(raffle => {
      (raffle.entries || []).forEach(entry => {
        const isMe = (myId && entry.userId === myId) || 
                     (myEmail && entry.userEmail === myEmail) ||
                     (!myId && (entry.userId === 'my_user_id' || entry.userEmail === 'user@example.com'));
        const appliedTime = Number(entry.appliedAt) || 0;
        if (isMe && appliedTime >= startOfTodayKst && appliedTime < endOfTodayKst) {
          entriesAppliedToday++;
        }
      });
    });
  } catch (e) {
    console.warn('[Raffle] Error counting today entries:', e);
  }

  // 3. Multi-layer persistence: LocalStorage & Firestore User Doc cache per product
  const localKey = raffleId ? `lp_daily_raffle_${myId || 'guest'}_${raffleId}_${todayKstStr}` : `lp_daily_raffle_${myId || 'guest'}_${todayKstStr}`;
  let localCount = 0;
  try {
    localCount = parseInt(localStorage.getItem(localKey) || '0', 10) || 0;
  } catch (e) {}

  const docData = getCurrentUserDocCache() || {};
  let docCount = 0;
  if (raffleId && docData.dailyRaffleByProduct && docData.dailyRaffleByProduct[raffleId]) {
    const pStats = docData.dailyRaffleByProduct[raffleId];
    docCount = (pStats.date === todayKstStr) ? (Number(pStats.count) || 0) : 0;
  } else if (!raffleId && docData.dailyRaffleDate === todayKstStr) {
    docCount = Number(docData.dailyRaffleCount) || 0;
  }

  // Maximum across all sources guarantees persistent cap per product
  const usedToday = Math.max(entriesAppliedToday, localCount, docCount);

  return {
    today: todayKstStr,
    raffleId,
    usedToday,
    limit: DAILY_RAFFLE_LIMIT,
    remaining: Math.max(0, DAILY_RAFFLE_LIMIT - usedToday)
  };
}

export function getAvailableGoldenTicketsCount() {
  const docData = getCurrentUserDocCache();
  if (docData && docData.goldenTickets !== undefined && docData.goldenTickets !== null) {
    const tickets = Number(docData.goldenTickets);
    if (!isNaN(tickets)) return tickets;
  }
  return 0;
}

export async function setAvailableGoldenTicketsCount(count) {
  const authUser = getCurrentAuthUser();
  await grantUserBalanceServer(authUser?.uid || null, authUser?.email || null, null, Number(count));
  saveUserDocData({ goldenTickets: count });
  window.dispatchEvent(new CustomEvent('ticketsUpdated', { detail: { count } }));
}

// User is initialized directly via Cloud Functions / Firestore cache


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
    totalActiveEntries: totalCount,
    totalCount,
    unitSize,
    completedGroupsCount,
    groups
  };
}

// Apply Golden Tickets to a Super Raffle (Server-Backed Atomic Deduction & Entry)
export async function applyGoldenTicketsToRaffle(raffleId, ticketCount = 1, userInfo = {}) {
  try {
    const count = Math.max(1, parseInt(ticketCount, 10) || 1);

    // 1. Strict Per-Product Daily Cap Verification
    const stats = getDailyRaffleStats(raffleId);
    if (stats.remaining <= 0) {
      throw new Error('해당 상품의 오늘 응모 한도(10회)를 모두 사용하셨습니다. 다른 스페셜 상품에 응모하시거나 내일 다시 응모해주세요!');
    }
    if (count > stats.remaining) {
      throw new Error(`해당 상품의 오늘 추가 응모 가능 횟수는 최대 ${stats.remaining}회입니다. (상품별 1일 10회 한도)`);
    }

    const res = await applyGoldenRaffleServer(raffleId, count);

    // 2. Multi-layer immediate persistence per product
    const authUser = getCurrentAuthUser();
    const myId = authUser?.uid;
    const now = new Date();
    const todayKstStr = new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const localKey = `lp_daily_raffle_${myId || 'guest'}_${raffleId}_${todayKstStr}`;
    const newUsed = stats.usedToday + count;
    try {
      localStorage.setItem(localKey, String(newUsed));
    } catch (e) {}

    const docData = getCurrentUserDocCache() || {};
    const dailyRaffleByProduct = docData.dailyRaffleByProduct || {};
    dailyRaffleByProduct[raffleId] = { date: todayKstStr, count: newUsed };
    docData.dailyRaffleByProduct = dailyRaffleByProduct;
    saveUserDocData({ dailyRaffleByProduct });

    return {
      appliedCount: res.appliedCount || count,
      remainingTickets: res.newTickets,
      newTickets: res.entries || [],
      raffle: res.raffle || { id: raffleId, title: '골든 래플' }
    };
  } catch (err) {
    console.error('[Raffle] applyGoldenRaffleServer error:', err);
    throw new Error(err.message || '골든티켓 응모 처리 중 오류가 발생했습니다.');
  }
}

// Cancel User's Ticket & FIFO Slot Shifting (Server-Backed)
export async function cancelGoldenTicketApplication(raffleId, ticketId) {
  try {
    const res = await cancelGoldenRaffleServer(raffleId, ticketId);

    // Decrement local daily count per product if today
    const authUser = getCurrentAuthUser();
    const myId = authUser?.uid;
    const now = new Date();
    const todayKstStr = new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const localKey = `lp_daily_raffle_${myId || 'guest'}_${raffleId}_${todayKstStr}`;
    try {
      const localCount = parseInt(localStorage.getItem(localKey) || '0', 10);
      if (localCount > 0) localStorage.setItem(localKey, String(localCount - 1));
    } catch (e) {}

    const docData = getCurrentUserDocCache();
    if (docData && docData.dailyRaffleByProduct && docData.dailyRaffleByProduct[raffleId]) {
      const pStats = docData.dailyRaffleByProduct[raffleId];
      if (pStats.date === todayKstStr && (pStats.count || 0) > 0) {
        pStats.count = Math.max(0, pStats.count - 1);
        saveUserDocData({ dailyRaffleByProduct: docData.dailyRaffleByProduct });
      }
    }

    return {
      refundedTickets: 1,
      newAvailableBalance: res.newTickets,
      removedEntry: res.removedEntry
    };
  } catch (err) {
    console.error('[Raffle] cancelGoldenRaffleServer error:', err);
    throw new Error(err.message || '골든티켓 응모 취소 중 오류가 발생했습니다.');
  }
}

// Force Draw and Auto-Refund Raffle (Admin Server-Backed)
export async function forceDrawAndResolveRaffle(raffleId) {
  try {
    const res = await forceDrawRaffleServer(raffleId);
    return res;
  } catch (err) {
    console.error('[Raffle] forceDrawRaffleServer error:', err);
    throw new Error(err.message || '추첨 처리 중 오류가 발생했습니다.');
  }
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
export async function updateBoxTierSettings(boxId, newSettings) {
  const boxes = getRandomBoxTiers();
  const box = boxes.find(b => b.id === boxId);
  if (!box) throw new Error('해당 픽 상품을 찾을 수 없습니다.');

  if (newSettings.name) box.name = newSettings.name;
  if (newSettings.tagline) box.tagline = newSettings.tagline;
  if (newSettings.price !== undefined) box.price = Number(newSettings.price);
  if (newSettings.goldenTickets !== undefined) box.goldenTickets = Number(newSettings.goldenTickets);
  if (newSettings.minGuaranteedValue !== undefined) box.minGuaranteedValue = Number(newSettings.minGuaranteedValue);
  if (newSettings.boxImage) box.boxImage = newSettings.boxImage;

  await saveRandomBoxTiers(boxes);
  return box;
}

// Auto-balance Box Probabilities to 100%
export async function autoBalanceBoxProbabilities(boxId) {
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

  await saveRandomBoxTiers(boxes);
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
  if (!tier) throw new Error('존재하지 않는 상품 픽입니다.');

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
  const refundPoints = Math.round(wonItem.retailPrice * 0.6);

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

// Convert won item into points (60% value) (Server-Backed Atomic Refund)
export async function convertVaultItemToPoints(vaultId) {
  try {
    return await convertVaultItemToPointsServer(vaultId);
  } catch (err) {
    console.error('[Vault] convertVaultItemToPoints error:', err);
    throw new Error(err.message || '포인트 전환 중 오류가 발생했습니다.');
  }
}

// Direct Delete Item from User Vault
export async function deleteVaultItem(vaultId) {
  const vault = getUserVault();
  const targetIdx = vault.findIndex(v => String(v.id) === String(vaultId));
  if (targetIdx === -1) return false;
  vault.splice(targetIdx, 1);
  await saveUserDocData({ vault });
  window.dispatchEvent(new CustomEvent('vaultUpdated', { detail: { vault } }));
  return true;
}

// Request Individual Shipping (Server-Backed Atomic Shipping Request)
export async function requestShippingForVaultItem(vaultId, shippingData) {
  try {
    const res = await requestVaultShippingServer(vaultId, shippingData);
    return res.shippingInfo;
  } catch (err) {
    console.error('[Shipping] requestShippingForVaultItem error:', err);
    throw new Error(err.message || '배송 신청 중 오류가 발생했습니다.');
  }
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

export async function updateShippingRequestStatus(shippingId, status, carrier = '', trackingNumber = '', taxStatus = '') {
  // Update central shipping_infos collection in Firestore
  await updateShippingStatusInFirestore(shippingId, status, carrier, trackingNumber, taxStatus);

  // Update in user vault if applicable
  const vault = getUserVault();
  const vaultItem = vault.find(v => v.id === shippingId || (v.shippingData && v.status === 'shipping_requested'));
  if (vaultItem) {
    if (status) vaultItem.status = status;
    if (carrier) vaultItem.carrier = carrier;
    if (trackingNumber) vaultItem.trackingNumber = trackingNumber;
    if (taxStatus) vaultItem.taxStatus = taxStatus;
    if (status === 'shipped') vaultItem.shippedAt = Date.now();
    saveUserDocData({ vault });
  }

  return { shippingId, status, carrier, trackingNumber, taxStatus };
}

export async function deleteShippingRequest(shippingId) {
  return await deleteShippingInfoFromFirestore(shippingId);
}

// Fixed-Price Store Products Helper Functions
export function getAllStoreProducts() {
  const tiers = getRandomBoxTiers();
  const products = [];
  tiers.forEach(tier => {
    (tier.items || []).forEach(item => {
      products.push({
        ...item,
        tierId: tier.id,
        tierName: tier.name,
        tierPrice: tier.price,
        goldenTickets: tier.goldenTickets,
        badge: item.badge || tier.badge,
        color: tier.color,
        accentColor: tier.accentColor
      });
    });
  });
  return products;
}

export function getStoreProductById(itemId) {
  const all = getAllStoreProducts();
  return all.find(p => p.id === itemId) || null;
}

// Purchase Fixed-Price Product (100% Zero-Probability Direct Purchase)
export async function purchaseFixedPriceProduct(itemId, tierId, payMethod = 'points') {
  const tiers = getRandomBoxTiers();
  let tier = tiers.find(t => t.id === tierId);
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

  if (!item) throw new Error('구매할 상품을 찾을 수 없습니다.');
  if (!tier) tier = tiers[0];

  const result = await purchaseProductServer({
    tierId: tier.id,
    itemId: item.id,
    item: {
      ...item,
      tierName: tier.name,
      goldenTickets: tier.goldenTickets
    },
    payMethod
  });

  return result;
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
    carrier: 'CJ대한통운',
    trackingNumber: ''
  };
  submitShippingInfoToFirestore(demo);
  return demo;
}

export {
  openLuckyBoxServer,
  purchaseProductServer,
  convertVaultItemToPointsServer
};

