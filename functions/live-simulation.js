// Live Simulation for Real-Time UI Observation
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8181';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'luckypick-7c257',
  });
}

const db = admin.firestore();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLiveSimulation() {
  console.log('====================================================');
  console.log('🎬 [LuckyPick] 화면 실시간 관전용 시뮬레이션 시작');
  console.log('====================================================\n');

  const unitSize = 20; // 1개 그룹당 20명
  const productId = 'prod_live_demo_' + Date.now();
  const startTime = Date.now() - 3600000;
  const endTime = Date.now() + 3600000 * 24; // 24시간 후 마감 (화면에서 여유있게 보실 수 있도록 유지)

  console.log(`[Step 1] 실시간 관전용 상품 등록: 디올 어딕트 립 글로우 (그룹당 ${unitSize}명)`);

  const initialProduct = {
    id: productId,
    title: '디올 어딕트 립 글로우 & 립스틱 세트',
    description: '2,007명 참여 대규모 다중 그룹 실시간 시연 (Group 1~100 완료 + Group 101 미달 대기)',
    category: 'BEAUTY',
    imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80',
    retailPrice: 90,
    entryPrice: 1,
    maxParticipants: unitSize,
    currentParticipants: 0,
    participants: [],
    startTime: startTime,
    endTime: endTime,
    createdAt: startTime,
    status: 'active'
  };

  await db.collection('products').doc(productId).set(initialProduct);
  console.log('✅ 상품이 등록되었습니다! (브라우저 화면을 보고 계시면 실시간으로 변합니다)');
  await sleep(1500);

  // 1단계: 1그룹 20명 채우기
  console.log('\n[Step 2] 1그룹 (20명) 결제 유입 중...');
  const participants = [];
  for (let i = 1; i <= 20; i++) {
    const pad = String(i).padStart(4, '0');
    participants.push({
      uid: `sim_user_${pad}`,
      name: `참여자_${pad}`,
      email: `user_${pad}@luckypick.test`,
      paymentId: `PAYID_CAPTURE_${pad}`,
      joinedAt: startTime + i * 1000,
      ticketNumber: `#DIOR-${pad}`,
      sequenceNumber: i,
      groupNumber: 1,
      status: 'active'
    });
  }
  await db.collection('products').doc(productId).update({
    currentParticipants: 20,
    participants: participants
  });
  console.log('✅ [Group 1] 20/20명 (100% 완료!) - 화면에 1그룹 완료 카드가 표시됩니다.');
  await sleep(1500);

  // 2단계: 2그룹 (20명 추가 -> 총 40명)
  console.log('\n[Step 3] 2그룹 자동 생성 및 20명 결제 유입 중...');
  for (let i = 21; i <= 40; i++) {
    const pad = String(i).padStart(4, '0');
    participants.push({
      uid: `sim_user_${pad}`,
      name: `참여자_${pad}`,
      email: `user_${pad}@luckypick.test`,
      paymentId: `PAYID_CAPTURE_${pad}`,
      joinedAt: startTime + i * 1000,
      ticketNumber: `#DIOR-${pad}`,
      sequenceNumber: i,
      groupNumber: 2,
      status: 'active'
    });
  }
  await db.collection('products').doc(productId).update({
    currentParticipants: 40,
    participants: participants
  });
  console.log('✅ [Group 2] 20/20명 (100% 완료!) - 화면에 2번째 그룹 카드가 뿅 생겨났습니다.');
  await sleep(1500);

  // 3단계: 2,007명까지 대규모 유저 일괄 유입 (총 101개 그룹)
  console.log('\n[Step 4] 총 2,007명까지 대규모 유입 처리 중 (Group 1~100 완성 + Group 101 생성)...');
  for (let i = 41; i <= 2007; i++) {
    const pad = String(i).padStart(4, '0');
    const grp = Math.floor((i - 1) / unitSize) + 1;
    participants.push({
      uid: `sim_user_${pad}`,
      name: `참여자_${pad}`,
      email: `user_${pad}@luckypick.test`,
      paymentId: `PAYID_CAPTURE_${pad}`,
      joinedAt: startTime + i * 1000,
      ticketNumber: `#DIOR-${pad}`,
      sequenceNumber: i,
      groupNumber: grp,
      status: 'active'
    });
  }
  await db.collection('products').doc(productId).update({
    currentParticipants: 2007,
    participants: participants
  });
  console.log('✅ 총 2,007명 참여 완료!');
  console.log('   - 100개 그룹 (Group 1 ~ 100) 100% 완성!');
  console.log('   - 마지막 101번째 그룹 (Group 101) 7/20명 대기 중');
  await sleep(2000);

  // 4단계: 중간 취소 및 순번 당기기 (1그룹 5번 유저 취소)
  console.log('\n[Step 5] 1그룹 5번 유저 자진 취소 & 순번 당기기 실행...');
  const cancelIdx = 4;
  const cancelledUser = participants.splice(cancelIdx, 1)[0];
  participants.forEach((p, idx) => {
    p.sequenceNumber = idx + 1;
    p.groupNumber = Math.floor(idx / unitSize) + 1;
  });
  await db.collection('products').doc(productId).update({
    currentParticipants: participants.length,
    participants: participants
  });
  console.log(`✅ [${cancelledUser.name}] 취소 완료! 2그룹 1번 유저가 1그룹 20번으로 자동 이동하여 1그룹을 유지합니다.`);
  console.log(`   - 현재 참여자: 총 ${participants.length}명 (100개 완료 그룹 + 101그룹 6명)`);

  console.log('\n====================================================');
  console.log('🎉 현재 브라우저 [진행 중] 탭에 활성 상태로 띄워두었습니다!');
  console.log('   - 웹 브라우저(localhost:5000/#home)를 지금 바로 확인해보세요!');
  console.log('   - 총 100개의 꽉 찬 그룹과 마지막 101번째(6/20명) 그룹을 스크롤하며 확인하실 수 있습니다.');
  console.log('====================================================\n');
}

runLiveSimulation().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('시뮬레이션 오류:', err);
  process.exit(1);
});
