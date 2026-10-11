# LuckyPick 관리자 페이지 데이터 영구 보존 및 이미지 업로드 아키텍처 가이드

**문서 버전**: 1.0  
**최종 업데이트**: 2026-10-11  
**관련 커밋**: `564c6e8`

---

## 1. 개요
LuckyPick 관리자 페이지(`#admin`)에서 변경하는 모든 정보(럭키박스 품목 사진/가격/확률, 박스 기본설정, 스페셜 골든래플, 배송 운송장 번호, 회원 포인트/골든티켓)는 **Firebase Firestore Cloud DB**와 **브라우저 로컬 캐시**의 이중 보존 레이어를 통해 영구 저장됩니다.

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
        ├─▶ getRandomBoxTiers(): 서버/관리자 수정값 최우선 반영 (serverItem || defaultItem)
        │
        ▼
[Firestore 레이어: services/firestore.js]
        │
        ├─▶ 1. localStorage 즉시 캐싱 (새로고침/오프라인 방어)
        │
        ▼
[백엔드: functions/index.js (Cloud Functions)]
        │
        ├─▶ saveBoxCatalogAdmin: box_catalogs/default 문서에 원자적 저장
        ├─▶ saveSuperRaffleAdmin: super_raffles/{raffleId} 문서 저장
        ├─▶ deleteSuperRaffleAdmin: super_raffles 문서 삭제
        ├─▶ updateShippingStatus: shipping_infos 운송장/출고상태 저장
        └─▶ grantUserBalance: users/{uid} 포인트/골든티켓 저장
        │
        ▼
[Firebase Firestore Cloud DB] ──▶ onSnapshot 실시간 동기화로 전 접속자에게 브로드캐스트
```

---

## 3. 핵심 규칙 및 주의사항

1. **이미지 파일 업로드**:
   - `pages/admin.js`의 `__handleImageUpload`는 스마트폰/노트북 원본 사진(2~15MB)을 자동으로 600px 이하 및 100KB 이하로 압축하여 Firestore 1MB 단일 문서 제한을 초과하지 않도록 보장합니다.
2. **보안 규칙 (Zero Client Write)**:
   - 프론트엔드에서 Firestore에 직접 쓰지 않고 항상 `Cloud Functions`를 통해 쓰기 작업을 수행합니다.
3. **병합 우선순위**:
   - `services/randombox.js`의 `getRandomBoxTiers()`는 항상 `serverItem` 속성을 `defaultItem`보다 우선순위로 둡니다.
