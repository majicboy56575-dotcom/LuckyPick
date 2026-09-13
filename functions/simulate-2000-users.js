// Simulation Script: 2,007 Users Multi-Slot Draw, Queue Shift & Refund Verification
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8181';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'luckypick-7c257',
  });
}

const db = admin.firestore();

async function runSimulation() {
  console.log('====================================================');
  console.log('🚀 [LuckyPick] 2,007명 대규모 시뮬레이션 시작');
  console.log('====================================================\n');

  const unitSize = 20; // 1개 복표(그룹)당 정원
  const initialCount = 2007; // 총 2,007명 (100개 완료 그룹 + 1개 미달 7명 그룹)
  const productId = 'prod_ps5_pro_sim_' + Date.now();
  const startTime = Date.now() - 3600000; // 1시간 전 시작
  const endTime = Date.now() + 60000; // 1분 후 마감

  console.log(`[Step 1] 상품 생성: PlayStation 5 Pro (그룹 정원: ${unitSize}명)`);
  
  // 1. 2,007명 참여자 데이터 생성
  console.log(`[Step 2] 2,007명 가상 유저 결제 및 티켓 발급 중...`);
  const participants = [];
  for (let i = 1; i <= initialCount; i++) {
    const pad = String(i).padStart(4, '0');
    const groupNum = Math.floor((i - 1) / unitSize) + 1;
    const ticketPrefix = 'PS';
    const ticketNum = String(Math.floor(Math.random() * 900) + 100);

    participants.push({
      uid: `sim_user_${pad}`,
      name: `가상참여자_${pad}`,
      email: `user_${pad}@luckypick.test`,
      phone: `010-${String(Math.floor(1000 + Math.random() * 9000))}-${pad}`,
      paymentId: `PAYID_SANDBOX_CAPTURE_${pad}`,
      orderId: `ORDER_SANDBOX_${pad}`,
      joinedAt: startTime + (i * 1000),
      ticketNumber: `#${ticketPrefix}-${ticketNum}`,
      sequenceNumber: i,
      groupNumber: groupNum,
      status: 'active',
      amount: 5,
      currency: 'USD'
    });
  }

  const initialProduct = {
    id: productId,
    title: 'Sony PlayStation 5 Pro 2TB Edition',
    description: '차세대 하이엔드 콘솔 게임기 (2,007명 참여 대규모 복표 테스트)',
    category: 'Gaming',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
    retailPrice: 990,
    entryPrice: 5,
    maxParticipants: unitSize,
    currentParticipants: initialCount,
    participants: participants,
    startTime: startTime,
    endTime: endTime,
    createdAt: startTime,
    status: 'active'
  };

  await db.collection('products').doc(productId).set(initialProduct);

  const initialCompleted = Math.floor(initialCount / unitSize);
  const initialRemainder = initialCount % unitSize;
  console.log(`✅ 상품 등록 완료!`);
  console.log(`   - 총 참여자 수: ${initialCount}명`);
  console.log(`   - 완성된 100% 그룹: ${initialCompleted}개 그룹 (Group 1 ~ 100)`);
  console.log(`   - 진행 중인 미완성 그룹: Group 101 (${initialRemainder}/${unitSize}명)\n`);

  // 2. 중간 취소 및 순번 당기기 (Queue Shift) 시뮬레이션
  console.log('----------------------------------------------------');
  console.log('[Step 3] 중간 참여 취소 및 순번 자동 앞당기기(Queue Shift) 테스트');
  const cancelIndex = 4; // 5번째 유저 (1그룹 5번)
  const cancelledUser = participants[cancelIndex];
  console.log(`⚠️  1그룹 5번 유저 (${cancelledUser.name}, ${cancelledUser.email}) 가 취소를 요청했습니다.`);

  // 취소 유저 제거 및 순번 재정렬
  participants.splice(cancelIndex, 1);
  const refundedList = [{
    uid: cancelledUser.uid,
    name: cancelledUser.name,
    email: cancelledUser.email,
    paymentId: cancelledUser.paymentId,
    reason: '사용자 자진 취소 (환불 완료)',
    refundId: `REFUND_USER_CANCEL_${cancelledUser.uid}`,
    refundedAt: Date.now()
  }];

  // 순번 재계산 (21번 유저 -> 20번(1그룹 마지막)으로 진입 확인)
  const old21stUser = participants[19]; // 원래 21번째였던 유저 (0-indexed 19)
  participants.forEach((p, idx) => {
    p.sequenceNumber = idx + 1;
    p.groupNumber = Math.floor(idx / unitSize) + 1;
  });

  console.log(`✅ 취소 처리 및 순번 재정렬 완료!`);
  console.log(`   - 원래 2그룹 1번(전체 21번)이었던 [${old21stUser.name}] 유저가`);
  console.log(`     ➡️ [Group ${old21stUser.groupNumber}, 순번 #${old21stUser.sequenceNumber}] (1그룹의 20번째 자리)로 자동 앞당겨짐!`);
  console.log(`   - 현재 총 유효 참여자: ${participants.length}명\n`);

  // 3. 타이머 마감 및 그룹별 당첨자 추첨 + 마지막 미달 그룹 환불
  console.log('----------------------------------------------------');
  console.log('[Step 4] 마감 타이머 종료 및 100개 그룹 당첨자 추첨 + 미달 그룹 환불 실행');
  
  const currentCount = participants.length; // 2,006명
  const completedGroups = Math.floor(currentCount / unitSize); // 100개
  const remainderCount = currentCount % unitSize; // 6명

  const winners = [];
  for (let g = 0; g < completedGroups; g++) {
    const groupMembers = participants.slice(g * unitSize, (g + 1) * unitSize);
    const winnerIdx = Math.floor(Math.random() * groupMembers.length);
    const winnerUser = groupMembers[winnerIdx];
    winners.push({
      groupNumber: g + 1,
      name: winnerUser.name,
      email: winnerUser.email,
      phone: winnerUser.phone,
      uid: winnerUser.uid,
      ticketNumber: winnerUser.ticketNumber
    });
  }

  console.log(`🏆 100개 완료 그룹에서 100명의 당첨자가 성공적으로 선출되었습니다!`);
  console.log(`   - Group 1 당첨자:  ${winners[0].name} (${winners[0].ticketNumber})`);
  console.log(`   - Group 50 당첨자: ${winners[49].name} (${winners[49].ticketNumber})`);
  console.log(`   - Group 100 당첨자: ${winners[99].name} (${winners[99].ticketNumber})`);

  // 마지막 미달 그룹 6명 자동 환불 처리
  console.log(`\n💸 [마지막 Group 101 (${remainderCount}/${unitSize}명)] 정원 미달로 전원 PayPal 자동 환불 실행 중...`);
  const remainderMembers = participants.slice(completedGroups * unitSize);
  remainderMembers.forEach((p) => {
    refundedList.push({
      uid: p.uid,
      name: p.name,
      email: p.email,
      paymentId: p.paymentId,
      reason: '목표 인원 미달 자동 환불 (Group 101)',
      refundId: `REFUND_AUTO_${p.uid}`,
      refundedAt: Date.now()
    });
  });

  console.log(`✅ Group 101 미달 인원 ${remainderCount}명 전원 PayPal 환불 완료!`);
  remainderMembers.forEach((m, idx) => {
    console.log(`   ${idx + 1}. [환불완료] ${m.name} (${m.email}) - $5.00 전액 환불`);
  });

  // closed_products에 저장
  const closedProduct = {
    id: productId,
    title: initialProduct.title,
    description: initialProduct.description,
    category: initialProduct.category,
    imageUrl: initialProduct.imageUrl,
    retailPrice: initialProduct.retailPrice,
    entryPrice: initialProduct.entryPrice,
    status: 'closed',
    unitSize: unitSize,
    completedGroups: completedGroups,
    totalParticipants: currentCount,
    maxParticipants: unitSize,
    winners: winners,
    winner: winners[0],
    ticketNumber: winners[0].ticketNumber,
    participants: participants,
    refundedParticipants: refundedList,
    endTime: endTime,
    closedAt: Date.now()
  };

  await db.collection('closed_products').doc(productId).set(closedProduct);
  await db.collection('products').doc(productId).delete();

  // 4. 홈 화면에서 실시간으로 볼 수 있는 활성 상품도 1개 추가 (진행 중인 다중 슬롯 시연용)
  const activeProdId = 'prod_iphone_16_active';
  const activeParticipants = [];
  for (let i = 1; i <= 35; i++) {
    const pad = String(i).padStart(4, '0');
    activeParticipants.push({
      uid: `sim_user_${pad}`,
      name: `가상참여자_${pad}`,
      email: `user_${pad}@luckypick.test`,
      phone: `010-1234-${pad}`,
      joinedAt: Date.now() - (36 - i) * 60000,
      ticketNumber: `#IP-${pad}`,
      sequenceNumber: i,
      groupNumber: Math.floor((i - 1) / 20) + 1,
      status: 'active'
    });
  }

  await db.collection('products').doc(activeProdId).set({
    id: activeProdId,
    title: 'Apple iPhone 16 Pro 256GB Desert Titanium',
    description: '현재 35명 참여 중 (1그룹 20/20 완료, 2그룹 15/20 진행 중 실시간 시연)',
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    retailPrice: 1199,
    entryPrice: 10,
    maxParticipants: 20,
    currentParticipants: 35,
    participants: activeParticipants,
    startTime: Date.now() - 3600000,
    endTime: Date.now() + 7200000, // 2시간 후 마감
    createdAt: Date.now() - 3600000,
    status: 'active'
  });

  console.log('\n====================================================');
  console.log('🎉 [LuckyPick] 시뮬레이션 완료 결과 요약');
  console.log('====================================================');
  console.log(`• 마감 상품: PlayStation 5 Pro`);
  console.log(`• 총 참여자: 2,007명 ➡️ 취소 후 2,006명`);
  console.log(`• 생성된 총 그룹 수: 101개`);
  console.log(`• 정원 충족 그룹: 100개 (Group 1 ~ 100)`);
  console.log(`• 선출된 당첨자 수: 총 ${winners.length}명 (각 그룹당 1명)`);
  console.log(`• 환불 처리된 인원: 총 ${refundedList.length}명`);
  console.log(`  - 1명 (1그룹 5번 자진 취소 환불 ➡️ 뒤 순번 자동 전진)`);
  console.log(`  - 6명 (101그룹 미달 자동 환불)`);
  console.log(`• 추가로 홈 화면에 [아이폰 16 프로 (35명 참여 중, 1그룹 완료+2그룹 진행중)] 활성 상품 등록 완료`);
  console.log('====================================================\n');
}

runSimulation().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('시뮬레이션 실행 오류:', err);
  process.exit(1);
});
