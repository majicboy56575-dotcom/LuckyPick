// ============================================
// LuckyPick - Local Emulator Admin Seed Script
// Injects rich sample data into local Firestore emulator (127.0.0.1:8181)
// ============================================
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8181';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'lucky-pick-dev',
  });
}

const db = admin.firestore();

async function seedData() {
  console.log('🌱 로컬 에뮬레이터 샘플 데이터 주입 시작...');

  const now = Date.now();

  // 1. Users Sample Data (회원 6명)
  const users = [
    {
      uid: 'user_001_kim',
      name: '김민준',
      email: 'minjun.kim@naver.com',
      displayName: '김민준',
      createdAt: now - 86400000 * 15, // 15일 전
      role: 'user',
      status: 'verified',
      tickets: 14,
      participatedRaffles: ['prod_sample_iphone', 'prod_sample_macbook'],
    },
    {
      uid: 'user_002_lee',
      name: '이서연',
      email: 'seoyeon.lee@kakao.com',
      displayName: '이서연',
      createdAt: now - 86400000 * 8, // 8일 전
      role: 'user',
      status: 'verified',
      tickets: 28,
      participatedRaffles: ['prod_sample_iphone', 'prod_sample_ps5'],
    },
    {
      uid: 'user_003_park',
      name: '박지훈',
      email: 'jihoon.park@gmail.com',
      displayName: '박지훈',
      createdAt: now - 86400000 * 3, // 3일 전
      role: 'user',
      status: 'verified',
      tickets: 5,
      participatedRaffles: ['prod_sample_ps5'],
    },
    {
      uid: 'user_004_choi',
      name: '최예은',
      email: 'yeeun.choi@daum.net',
      displayName: '최예은',
      createdAt: now - 86400000 * 1, // 어제
      role: 'user',
      status: 'restricted', // 제재 상태 샘플
      tickets: 2,
      participatedRaffles: [],
    },
    {
      uid: 'user_005_jung',
      name: '정우진',
      email: 'woojin.jung@outlook.com',
      displayName: '정우진',
      createdAt: now - 86400000 * 20,
      role: 'user',
      status: 'verified',
      tickets: 42,
      participatedRaffles: ['prod_sample_iphone', 'prod_sample_macbook', 'prod_sample_ps5'],
    },
    {
      uid: 'admin_master',
      name: '관리자 (운영팀)',
      email: 'majicboy56575@gmail.com',
      displayName: '운영 마스터',
      createdAt: now - 86400000 * 60,
      role: 'admin',
      status: 'verified',
      tickets: 0,
      participatedRaffles: [],
    },
  ];

  for (const u of users) {
    await db.collection('users').doc(u.uid).set(u, { merge: true });
  }
  console.log(`✅ 회원 데이터 ${users.length}명 등록 완료`);

  // 2. Active Products (진행 중 상품 2개)
  const activeProducts = [
    {
      id: 'prod_sample_iphone',
      title: 'Apple iPhone 16 Pro 256GB',
      description: '내추럴 티타늄, 정품 미개봉 새상품 (국내 정식 발매품)',
      category: 'TECH',
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
      retailPrice: 1700000,
      entryPrice: 2000,
      maxParticipants: 20, // 그룹 정원 20명
      currentParticipants: 16,
      endTime: now + 3600000 * 18, // 18시간 후 마감
      status: 'active',
      createdAt: now - 3600000 * 6,
      participants: [
        { uid: 'user_001_kim', name: '김*준', email: 'mi****@naver.com', joinedAt: now - 18000000 },
        { uid: 'user_002_lee', name: '이*연', email: 'se****@kakao.com', joinedAt: now - 17000000 },
        { uid: 'user_005_jung', name: '정*진', email: 'wo****@outlook.com', joinedAt: now - 15000000 },
        { uid: 'user_001_kim', name: '김*준', email: 'mi****@naver.com', joinedAt: now - 14000000 },
        { uid: 'user_002_lee', name: '이*연', email: 'se****@kakao.com', joinedAt: now - 12000000 },
      ],
    },
    {
      id: 'prod_sample_ps5',
      title: 'PlayStation 5 Pro 콘솔 에디션',
      description: '2TB 초고속 SSD 탑재 차세대 콘솔 (듀얼센스 1기 포함)',
      category: 'TECH',
      imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80',
      retailPrice: 1118000,
      entryPrice: 2000,
      maxParticipants: 20,
      currentParticipants: 8,
      endTime: now + 3600000 * 42, // 42시간 후 마감
      status: 'active',
      createdAt: now - 3600000 * 12,
      participants: [
        { uid: 'user_003_park', name: '박*훈', email: 'ji****@gmail.com', joinedAt: now - 10000000 },
        { uid: 'user_005_jung', name: '정*진', email: 'wo****@outlook.com', joinedAt: now - 9000000 },
      ],
    },
  ];

  for (const p of activeProducts) {
    await db.collection('products').doc(p.id).set(p, { merge: true });
  }
  console.log(`✅ 활성 래플 상품 ${activeProducts.length}개 등록 완료`);

  // 3. Closed Products & Winners (마감 및 당첨 상품 1개)
  const closedProduct = {
    id: 'prod_sample_macbook_closed',
    title: 'MacBook Pro 16" M3 Max',
    description: '스페이스 블랙, 36GB 통합 메모리, 1TB SSD',
    category: 'TECH',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    retailPrice: 4200000,
    entryPrice: 5000,
    maxParticipants: 20,
    currentParticipants: 40,
    totalParticipants: 40,
    completedGroups: 2,
    remainderCount: 0,
    status: 'closed',
    closedAt: now - 86400000 * 2, // 2일 전 마감
    winners: [
      {
        groupNumber: 1,
        uid: 'user_001_kim',
        name: '김민준',
        email: 'minjun.kim@naver.com',
        ticketNumber: 'MB-107',
        wonAt: now - 86400000 * 2,
      },
      {
        groupNumber: 2,
        uid: 'user_005_jung',
        name: '정우진',
        email: 'woojin.jung@outlook.com',
        ticketNumber: 'MB-214',
        wonAt: now - 86400000 * 2,
      },
    ],
    refundedParticipants: [],
  };

  await db.collection('closed_products').doc(closedProduct.id).set(closedProduct, { merge: true });
  console.log(`✅ 마감 및 당첨자 상품 데이터 등록 완료`);

  // 4. Shipping Infos (배송 정보 2건: 1건 배송준비중, 1건 배송완료)
  const shippingInfos = [
    {
      id: 'ship_001_pending',
      productId: 'prod_sample_macbook_closed',
      productTitle: 'MacBook Pro 16" M3 Max',
      imageUrl: closedProduct.imageUrl,
      winnerUid: 'user_001_kim',
      winnerName: '김민준',
      winnerEmail: 'minjun.kim@naver.com',
      recipientName: '김민준',
      recipientPhone: '010-1234-5678',
      shippingAddress: '서울특별시 강남구 테헤란로 152, 12층 (역삼동)',
      zipCode: '06236',
      status: 'preparing', // 배송 준비중
      carrier: '',
      trackingNumber: '',
      submittedAt: now - 86400000 * 1.5,
    },
    {
      id: 'ship_002_completed',
      productId: 'prod_sample_macbook_closed',
      productTitle: 'MacBook Pro 16" M3 Max',
      imageUrl: closedProduct.imageUrl,
      winnerUid: 'user_005_jung',
      winnerName: '정우진',
      winnerEmail: 'woojin.jung@outlook.com',
      recipientName: '정우진',
      recipientPhone: '010-9876-5432',
      shippingAddress: '경기도 성남시 분당구 판교역로 166, 801호',
      zipCode: '13529',
      status: 'shipped', // 배송 완료
      carrier: 'CJ대한통운',
      trackingNumber: '683920184920',
      submittedAt: now - 86400000 * 1.8,
      updatedAt: now - 86400000 * 0.5,
    },
  ];

  for (const s of shippingInfos) {
    await db.collection('shipping_infos').doc(s.id).set(s, { merge: true });
  }
  console.log(`✅ 배송 정보 데이터 ${shippingInfos.length}건 등록 완료`);

  console.log('🎉 모든 샘플 데이터가 로컬 에뮬레이터에 성공적으로 주입되었습니다!');
  process.exit(0);
}

seedData().catch(err => {
  console.error('❌ 시드 주입 에러:', err);
  process.exit(1);
});
