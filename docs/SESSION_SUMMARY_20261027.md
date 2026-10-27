# LuckyPick 개발 세션 종합 요약 리포트 (2026-10-27)

> **문서 목적:** 본 문서는 2026년 10월 27일에 진행된 다날 PG 입점 심사 질의서 분석 및 회신문 작성, 스페셜 래플 추가 보너스 혜택 삭제, 마감 기한 편집 기능 추가, 참여 티켓 수 버그 해결, 그리고 골든티켓 1일 10회 제한의 상품별(1인당 상품별 1일 10장) 분리 적용 및 3중 영구 방어 체계 구축 내역을 체계적으로 영구 기록하기 위해 작성되었습니다.

---

## 1. 다날(Danal) PG 입점 심사 피드백 분석 및 최적화 회신문 작성
- **배경:** 다날 심사 담당자(이지호 매니저)로부터 서비스 구조 및 사행성 검토를 위한 4대 핵심 질의 메일 수신.
- **분석 및 회신 방침:**
  1. **단일 품목 지정 구매 (질의 1):** 각 등급(베이직/프리미엄/VIP 픽)별로 1~3개 상품을 명확히 진열하고, 소비자가 특정 단일 상품을 직접 선택하여 정가에 확정 구매하는 직관적인 일반 쇼핑몰 구조임을 소명.
  2. **결제 수단 지원 (질의 2):** 신용카드/휴대폰 즉시 결제(바로결제)와 스토어 포인트 충전 결제 두 가지 방식을 모두 완벽히 지원함을 명시.
  3. **골든 티켓 법적 성격 (질의 3):** 유상 판매가 불가능한 비매품(무료 사은품)이며, 정가 상품을 구매한 고객에게 감사의 의미로 무상 적립되는 감사 이벤트 사은권임을 명확히 규정.
  4. **응모 상한선 및 과몰입 방지 (질의 4):** 소비자의 건전한 이용과 특정 경품의 확률 독점(몰빵)을 원천 차단하기 위해 **1인당 상품별 1일 최대 10장(Daily Cap)**의 엄격한 상한선을 시스템적으로 강제 적용함을 입증.

---

## 2. 스페셜 래플(골든 상품) "추가 보너스 혜택" 항목 완전 삭제
- **수정 목적:** 경품 응모 외에 불필요하거나 사행성 오해를 불러일으킬 수 있는 부가 항목을 정리하여 상품 구성을 깔끔하게 정돈.
- **수정 내역:**
  - **관리자 페이지 (`pages/admin.js`):**
    - 신규 래플 등록 모달 및 기존 래플 수정 모달에서 `raffle-bonus` (당첨자 추가 보너스 혜택) 입력 필드 완전 삭제.
    - 데이터 페이로드(`newRaffle`, `updatePayload`)에서 `bonus` 필드 제거.
  - **메인 홈 카드 UI (`services/randombox.js`):**
    - 스페셜 래플 카드 하단에 렌더링되던 `🎁 추가 특별 혜택: ...` 표시 블록 완전 삭제.
  - **Git 커밋:** `2a6990e`

---

## 3. 스페셜 래플 수정 모달 "진행 시간(마감 기한 일수)" 편집 기능 추가
- **기존 문제:** 래플 신규 등록 시에만 진행 시간(일수)을 설정할 수 있고, 이미 등록된 래플을 수정할 때는 진행 시간을 변경할 수 없던 제약.
- **해결 내역 (`pages/admin.js`):**
  - 스페셜 래플 수정 모달 내에 **`진행 시간 (마감 기한)`** 입력 필드 추가.
  - 관리자 편의를 위한 프리셋 버튼(`[1일]`, `[3일]`, `[7일]`) 클릭 연동.
  - 기존 래플의 잔여 시간을 일 단위(`(endTime - now) / 86400000`)로 자동 역산하여 인풋 기본값으로 프리필.
  - 저장 시 `Date.now() + days * 86400000`으로 래플의 `endTime`을 정확히 재계산하여 DB 및 실시간 캐시에 반영.
  - **Git 커밋:** `b65468c`

---

## 4. 스페셜 래플 카드 "총 참여: undefined장" 버그 해결
- **발생 원인:** `pages/home.js`에서 래플 카드 렌더링 시 `groupData.totalActiveEntries`를 참조하였으나, `services/randombox.js`의 `getRaffleGroupData` 함수에서 `totalParticipants`만 반환하고 `totalActiveEntries` 프로퍼티를 누락하여 화면에 `undefined장`으로 노출되던 현상.
- **해결 내역:**
  - `services/randombox.js`의 `getRaffleGroupData` 반환 객체에 `totalActiveEntries: totalCount` 명시적 추가.
  - `pages/home.js`에서 `Number(groupData.totalActiveEntries ?? 0).toLocaleString()` 안전 캐스팅 적용.
  - **Git 커밋:** `5637f65`

---

## 5. 골든티켓 1일 10회 응모 제한의 영구 방어 체계 구축
- **기존 문제:** 모달이나 브라우저 창을 껐다 켜거나 새로고침하면 클라이언트 메모리 변수가 초기화되어 다시 10장 응모가 가능해지던 취약점.
- **해결 내역 (3중 방어 아키텍처):**
  1. **1차 SSOT (데이터베이스 실물 조사):** 특정 래플의 `entries` 배열에서 접속 유저가 **한국 표준시 당일(KST 00:00:00 이후)**에 응모한 실물 티켓 내역을 직접 필터링하여 카운트. (새로고침/재로그인/기기 변경에도 무조건 유지)
  2. **2차 LocalStorage 영구 보관:** 브라우저 로컬 스토리지에 당일 날짜 기반 키로 저장하여 페이지 리로드 시 즉각 동기화.
  3. **3차 Firestore User Document:** `userData.dailyRaffleByProduct`에 일자 및 카운트를 저장하여 유저 프로필과 결합.
  - `Math.max(entriesAppliedToday, localCount, docCount)` 방식을 통해 3개 계층 중 가장 큰 값을 취합함으로써 어떤 상황에서도 1일 10회 상한선이 무력화되지 않도록 영구 방어.
  - **Git 커밋:** `7966b09`

---

## 6. 골든티켓 10장 제한을 "상품별 1인당 1일 10장"으로 개편
- **개편 목적:** 모든 스페셜 상품의 총합으로 10장을 묶는 대신, **상품별(각 래플별)로 1인당 1일 최대 10장씩 독립 응모**할 수 있도록 변경하여 사용자 참여 만족도를 높이고 특정 경품의 확률 독점을 방지.
- **수정된 레이어 및 내역:**
  - **`services/randombox.js`:**
    - `getDailyRaffleStats(raffleId)`로 시그니처 변경. 전달받은 `raffleId`의 래플만 타겟팅하여 당일 응모수를 독립 산출.
    - LocalStorage 키: `lp_daily_raffle_${uid}_${raffleId}_${todayKstStr}`로 분리.
    - 유저 문서 저장 구조: `dailyRaffleByProduct: { [raffleId]: { date, count } }` 형태로 확장.
  - **`pages/home.js`:**
    - 모달 뱃지: `1일 건전 응모 한도 (상품별 10회)` / `해당 상품 잔여: N / 10회`
    - 한도 초과 안내: `이 상품의 오늘 응모 한도(10회)를 모두 사용하셨습니다. 특정 경품의 확률 독점 방지와 건전한 이용을 위해 상품별 1인당 1일 최대 10회까지만 응모 가능합니다.`
    - 에어팟에 10장을 다 썼더라도, 아이폰이나 에어건 등 다른 스페셜 래플에는 추가 10장 응모 정상 가능.
  - **`services/firestore.js` & `functions/index.js`:**
    - 직접 Firestore fallback 및 Cloud Functions 트랜잭션 함수(`applyGoldenRaffle`, `cancelGoldenRaffle`)에서 `dailyRaffleByProduct[raffleId]` 기반 검증 및 차감으로 완벽 동기화.
  - **Git 커밋:** `5c5198b`

---

## 7. 응모 확정 시 ReferenceError 긴급 수정
- **발생 오류:** 응모 확정 버튼 클릭 시 브라우저 얼럿창에 `dailyRaffleByProduct is not defined` 발생.
- **원인:** `applyGoldenTicketsToRaffle` 함수 내부에서 변수명을 `const dailyByProduct`로 선언한 상태에서 객체 단축 프로퍼티 `saveUserDocData({ dailyRaffleByProduct })`를 호출하여 자바스크립트 참조 에러 발생.
- **조치:** `randombox.js`, `firestore.js`, `functions/index.js` 전역에서 변수명을 일관되게 `dailyRaffleByProduct`로 일치시켜 완벽 해결.
- **Git 커밋:** `34a0a93`

---

## 8. 모듈 무결성 검증 및 GitHub 푸시
- **모듈 검증:** `node --experimental-vm-modules check-imports.mjs` 실행 결과 9개 전 모듈 Syntax & Import 100% Passed.
- **원격 동기화:** `git push origin main` 완료 (Commit `1770f36` ➔ `34a0a93`).
- **서버 상태:** 로컬 개발 서버 `http://localhost:5000` 백그라운드 무장애 가동 중.
