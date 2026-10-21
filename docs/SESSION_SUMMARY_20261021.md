# LuckyPick 작업 히스토리 및 시스템 개선 기록 (2026-10-21)

> **문서 목적:** 본 문서는 2026년 10월 21일에 진행된 다날 PG 심사 대응, 시스템 오류 정밀 원인 분석 및 해결, 관리자 회원 관리 전면 개편 작업의 전체 상세 내역을 코드 실행에 영향이 없도록 독립적인 문서로 보존하기 위해 작성되었습니다.

---

## 1. 다날(Danal) PG 심사 보완 및 소명 대응

### 1-1. 배경 및 담당자 피드백
- **피드백 접수:** 다날 이지호 매니저(`jiholee@danal.co.kr`)로부터 포인트 충전 결제 플로우 및 환금성 방지 규정이 검수요청서에 누락되었다는 보완 요청 수신 (8, 9, 10페이지 예시 참고 요망).
- **대응 조치:** 11페이지 분량의 공식 PPTX 문서 구축 및 100% 실제 서비스 구동 화면 캡처 반영.

### 1-2. 산출물 및 슬라이드 구성
- **파일:**
  - `신용카드 검수요청서(럭키픽).pptx`
  - `포인트_및_환불_검수요청서(럭키픽).pptx`
  - `danal_captures/` (실제 결제창 및 서비스 구동 고해상도 캡처 9종)
- **주요 페이지 구성:**
  - **8페이지 [포인트 충전 단계]:** 마이페이지 포인트 충전 UI, 다날 신용카드/휴대폰 결제창 연동, 실시간 포인트 적립 화면
  - **9페이지 [포인트 사용 단계]:** 포인트 차감을 통한 럭키박스 개봉(100% 실물 득템) 및 보관함 적재 화면
  - **10페이지 [포인트 환불 기준 및 약관]:** 전자상거래법 및 여신전문금융업법 준수 원 결제수단(다날 승인 취소) 환불 원칙 규정화
  - **11페이지 [환금성 방지 및 제한]:** 포인트 타인 양도/매매 및 현금 인출 절대 불가, 부정 결제 모니터링 정책

---

## 2. 발생 오류 정밀 원인 분석 및 해결

### 2-1. [오류 1] 랜덤박스 득템 상품의 내 보관함 미노출 오류
- **발생 위치:** `services/unboxing-modal.js`, `app.js`, `functions/index.js`
- **근본 원인:**
  1. 클라이언트 직접 추첨에서 서버 원자적 추첨(`openLuckyBoxServer`)으로 전환되면서 서버 Firestore DB에는 저장되었으나, 브라우저 로컬 캐시(`currentUserDocCache`)를 즉시 갱신하는 코드가 누락됨.
  2. `app.js`에서 개봉 애니메이션 모달(`unboxing-stage-modal`)이 열려 있는 동안 백그라운드 실시간 갱신을 차단(`debouncedNavigate` 가드)하여 Firestore 스냅샷 이벤트가 버려짐.
  3. 모달 닫기 시 발생하는 `vaultUpdated` 이벤트에 대한 리스너가 등록되어 있지 않았음.
  4. 서버 함수에서 신규 당첨 상품을 배열 맨 끝에 추가하여 최신 상품이 하단으로 밀림.
- **해결 내역:**
  - `services/unboxing-modal.js`: 서버 추첨 성공 직후 `wonItem`을 `getUserVault()` 맨 앞(`unshift`)에 추가하고 `saveUserDocData({ vault, points, goldenTickets })`를 호출하여 로컬 캐시 즉시 동기화.
  - `services/unboxing-modal.js`: 단순변심 포인트 전환(`__quickConvertPoints`) 및 보관함 이동 시에도 로컬 캐시 즉시 갱신.
  - `app.js`: `vaultUpdated` 이벤트 리스너를 라우터에 등록하여 모달 닫힘 시 0ms 즉각 UI 재렌더링.
  - `functions/index.js`: `[wonItem, ...(userData.vault || [])]`로 정렬하여 DB 차원에서도 최신 상품 상단 고정.

### 2-2. [오류 2] 스페셜 상품 즉시추첨 시 `.toLocaleString()` 오류
- **발생 위치:** `functions/index.js:L1781`, `pages/admin.js:L1494`
- **오류 내용:** `Cannot read properties of undefined (reading 'toLocaleString')`
- **근본 원인:**
  1. Cloud Functions `forceDrawRaffle`의 반환 객체에 `raffle: { id, title }`만 반환하고 `retailPrice`가 누락됨.
  2. 관리자 모달(`pages/admin.js`)에서 `raffle.retailPrice.toLocaleString()`을 직접 호출하면서 `undefined` 에러 발생.
- **해결 내역:**
  - `functions/index.js`: 반환 객체에 `retailPrice: Number(raffle.retailPrice) || 0`, `image` 프로퍼티 추가.
  - `pages/admin.js`: `(raffle?.retailPrice || 0).toLocaleString()` 널 안전 방어 코드 적용.

### 2-3. [UI 개선] 배송비 결제 '추천' 배지 삭제
- **발생 위치:** `pages/profile.js:L311-314`
- **반영 내역:** 단일 배송비 결제 모달 내 `보유 포인트 차감 결제` 옆에 노출되던 파란색 `<span ...>추천</span>` 배지 삭제 완료.

---

## 3. 관리자 페이지 [회원 및 포인트 관리] 전면 개편

### 3-1. 개편 배경
- 기존 관리자 페이지의 회원 관리 탭은 초기 단일 테스트 지갑(`my_account@luckypick.com`)만 표시되던 임시 화면이었음.
- 실제 Firestore DB(`users` 컬렉션)에 등록된 전체 회원 목록을 조회하고 회원별로 재화를 관리할 수 있는 진짜 관리자 시스템으로 구축함.

### 3-2. 신규 기능 및 구조
1. **상단 핵심 지표(KPI) 통계 바 (4대 카드):**
   - 총 가입 회원 수 (실시간 등록 회원)
   - 총 유통 포인트 (전체 회원 보유 잔액 합계)
   - 총 발행 골든티켓 (래플 응모 가능 티켓 총합)
   - 총 보관함 상품 (미배송/보관 실물 상품 총 건수)
2. **실시간 검색 바:**
   - 회원 이름, 이메일, UID로 0ms 즉각 필터링 (`__filterAdminMembers`).
3. **전체 등록 회원 명부 테이블:**
   - 아바타 이니셜, 이름, 이메일, UID
   - 가입일시 (`ko-KR` 포맷)
   - 계정 권한 배지 (`운영 관리자 ADMIN` / `일반 회원`)
   - 보유 포인트, 보유 골든티켓, 보관함 상품 수량
4. **회원별 개별 관리 모달 (`__openUserWalletModal`):**
   - 선택한 회원의 실시간 잔액 확인
   - 빠른 원클릭 지급: `+10,000P`, `+100,000P`, `+1,000,000P` / `+20장`, `+500장`, `+1,000장`
   - 직접 수량 입력 포인트/골든티켓 지급(+) 및 차감(-) 기능
   - 서버 함수 `grantUserBalanceServer` 호출로 Firestore DB 즉시 원자적 반영
5. **회원별 보관함 조회 모달 (`__openUserVaultModal`):**
   - 해당 회원의 득템 상품 이미지, 상품명, 소비자가격, 상태(보관중/배송요청/배송완료/반품) 상세 팝업 확인.

---

## 4. 모듈 검증 및 배포 버전

- **구문 및 참조 무결성 검증:** `node --experimental-vm-modules check-imports.mjs` (9개 핵심 모듈 100% PASS)
- **캐시 버스팅 버전:** `index.html` → `20261021_V44`
- **원격 저장소 상태:** GitHub `main` 브랜치에 전원 푸시 완료 (`578b365`)
