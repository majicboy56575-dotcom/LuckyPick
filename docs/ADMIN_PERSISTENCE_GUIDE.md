# LuckyPick 관리자 페이지 데이터 영구 보존 및 이미지 업로드 아키텍처 가이드

**문서 버전**: 1.2 (V12)  
**최종 업데이트**: 2026-10-13  
**관련 커밋**: `564c6e8`, `6099823`, `b10326f`, `e816a44`

---

## 1. 개요
LuckyPick 관리자 페이지(`#admin`)에서 변경하는 모든 정보(럭키박스 품목 사진/가격/확률, 박스 기본설정, 스페셜 골든래플, 배송 운송장 번호, 회원 포인트/골든티켓)는 **Firebase Firestore Cloud DB**와 **브라우저 로컬 캐시**의 이중 보존 레이어를 통해 영구 저장되며, 프론트엔드는 백엔드 데이터를 1순위 단일 진실 공급원(Single Source of Truth)으로 화면에 직통 렌더링합니다.

---

## 2. 주요 구조 및 데이터 흐름

```
[관리자 UI: pages/admin.js]
        │
        ├─▶ 이미지 선택 시 HTML5 Canvas 자동 압축 (최대 600px, JPEG 0.85, <100KB)
        │
        ▼
[서비스 레이어: services/randombox.js]
        │
        ├─▶ getRandomBoxTiers(): serverTiers를 1순위로 온전히 매핑 (삭제 품목 부활 방지)
        │
        ▼
[Firestore 레이어: services/firestore.js]
        │
        ├─▶ 1. onSnapshot 수신 시 타임스탬프 차단 없이 서버 데이터를 100% 최우선 반영 (SSOT 확립)
        ├─▶ 2. localStorage 구형 캐시(VIP 30,000원 등) 감지 시 자동 즉시 폐기(Purge)
        ├─▶ 3. ensureInitialFirestoreData(): 서버 카탈로그 누락 시 backend syncBoxCatalog 자동 호출
        │
        ▼
[백엔드: functions/index.js (Cloud Functions)]
        │
        ├─▶ saveBoxCatalogAdmin: box_catalogs/default 문서에 원자적 저장
        ├─▶ syncBoxCatalog: SERVER_DEFAULT_BOXES (5k/10k/20k) 정규화 동기화
        ├─▶ saveSuperRaffleAdmin: super_raffles/{raffleId} 문서 저장
        ├─▶ deleteSuperRaffleAdmin: super_raffles 문서 삭제
        ├─▶ updateShippingStatus: shipping_infos 운송장/출고상태 저장
        └─▶ grantUserBalance: users/{uid} 포인트/골든티켓 저장
        │
        ▼
[Firebase Firestore Cloud DB] ──▶ onSnapshot 실시간 동기화로 전 접속자에게 브로드캐스트
        │
        ▼
[로컬 에뮬레이터 디스크 영구 저장] ──▶ .firebase-emulator-data/ 디렉터리로 재시작 시 자동 복원
```

---

## 3. 핵심 규칙 및 주의사항

1. **이미지 파일 업로드**:
   - `pages/admin.js`의 `__handleImageUpload`는 스마트폰/노트북 원본 사진(2~15MB)을 자동으로 600px 이하 및 100KB 이하로 압축하여 Firestore 1MB 단일 문서 제한을 초과하지 않도록 보장합니다.
2. **보안 규칙 (Zero Client Write)**:
   - 프론트엔드에서 Firestore에 직접 쓰지 않고 항상 `Cloud Functions`를 통해 쓰기 작업을 수행합니다.
3. **병합 우선순위 (SSOT)**:
   - `services/firestore.js`의 `onSnapshot`은 클라이언트 로컬 타임스탬프와 상관없이 서버 스냅샷을 100% 즉시 반영합니다.
4. **브라우저 모듈 캐시 버스팅 (Import Map)**:
   - `index.html`에 `<script type="importmap">`을 정의하여, 상대 경로로 import되는 공통 서비스 모듈(`firestore.js`, `auth.js` 등)이 브라우저 디스크 캐시에 갇히지 않고 최신 버전으로 즉시 갱신되도록 보장합니다.
5. **로컬 에뮬레이터 데이터 보존**:
   - `firebase emulators:start --import=./.firebase-emulator-data --export-on-exit=./.firebase-emulator-data` 플래그로 구동되어 개발 중 저장한 DB 데이터가 영구 보존됩니다.

---

## 4. 확정 당첨 확률 체계 (2026-10-13 V12 기준)

전 티어(5,000원 베이직, 10,000원 프리미엄, 20,000원 VIP 하이엔드)에 통일 적용된 확률 템플릿입니다.

| 순위 | 품목 등급 | 당첨 확률 | 비고 |
| :---: | :---: | :---: | :---: |
| **1등** | RARE / EPIC / LEGENDARY | **1.0%** (0.010) | 최고가 시그니처 상품 |
| **2등** | RARE / EPIC | **2.0%** (0.020) | 프리미엄 준고가 상품 |
| **3등** | NORMAL / RARE | **8.0%** (0.080) | 중가 실속 상품 |
| **4등** | NORMAL / RARE | **30.0%** (0.300) | 대중적 인기 상품 |
| **5등** | NORMAL | **59.0%** (0.590) | 기본 보장 상품 |
| **합계** | **5개 전 품목 총합** | **100.0% (✓ 정상)** | 전 티어 정확히 100% 검증 완료 |

---

## 5. 변경 이력 및 커밋 내역
- `564c6e8`: fix(admin): 관리자 사진 업로드, 데이터 덮어쓰기 버그 수정 및 백엔드 영구 보존 연동
- `33b3196`: docs: 관리자 페이지 데이터 보존 및 이미지 압축 가이드 작성
- `b89de12`: fix(admin): 실시간 스냅샷 덮어쓰기 방어 및 V9 캐시 버스팅 적용
- `7ad1923`: feat(odds): 5,000원/10,000원/20,000원 전 럭키박스 당첨 확률(1%, 2%, 8%, 30%, 59%) 일괄 적용 (V10)
- `b10326f`: fix(persistence): 로컬 에뮬레이터 연결 복구, 구형 캐시 자동 퍼지 및 디스크 영구 저장(`.firebase-emulator-data`) 적용
- `e816a44`: fix(sync): 서버 스냅샷 무조건 반영(타임스탬프 가드 제거) 및 ImportMap 모듈 캐시 버스팅 적용 (V12)

