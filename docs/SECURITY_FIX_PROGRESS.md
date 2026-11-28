# LuckyPick 1단계 보안·확장성 수정 진행 기록 (Handoff 문서)

> **다른 AI / 새 대화 이어받기 안내**
> - 이 문서와 `git log --oneline -10`을 먼저 확인하세요.
> - 아래 체크리스트에서 `[ ]` (미완료) 항목부터 순서대로 진행하고, 각 단계 완료 시 이 문서를 업데이트하고 **로컬 git 커밋만** 남기세요.
> - **절대 규칙: 사용자가 명시적으로 요청하기 전까지 `git push`를 실행하지 마세요.**
> - JS 수정 후에는 반드시 `node --experimental-vm-modules check-imports.mjs`를 실행해 12/12 통과를 확인하고, `index.html` 및 `app.js`의 캐시 버전(`?v=`)을 갱신하세요.
> - Windows PowerShell 5.1 환경이므로 `&&` 대신 `; if ($LASTEXITCODE -eq 0) { ... }`를 사용하세요.

---

## 목표 (1단계: 긴급 결제·보안 + 전체 구독 차단 + 기본 최적화)

| ID | 항목 | 대상 파일 | 상태 | 커밋 |
| :-- | :-- | :-- | :--: | :-- |
| **DOC** | 진행 기록 문서 생성 | `docs/SECURITY_FIX_PROGRESS.md` | `[x]` | `7e7b93c` |
| **A1/A2/B2** | 카드 결제(`purchaseProduct`)·포인트 충전(`chargeUserPoints`)·배송비(`requestVaultShipping`) 서버 결제 검증 (`payments/{tid}` + `consumed` 중복 방지) + `app.js`/`unboxing-modal.js` `tid` 전달 + 배송 ID 고유화(`crypto.randomUUID`) | `functions/index.js`, `app.js`, `services/unboxing-modal.js`, `services/firestore.js` | `[x]` | `46ccf11` |
| **A3** | 브라우저 직접 Firestore 쓰기 fallback 제거 + `deleteVaultItem`/`clearTicketRefundNotices` 서버 Callable 추가 + 관리자 쓰기 Cloud Functions 통일 | `services/firestore.js`, `services/randombox.js`, `services/unboxing-modal.js`, `functions/index.js` | `[x]` | `b089a00` |
| **기존1 + 규칙** | 일반 유저 전체 `users`/`shipping_infos` 실시간 구독 차단 + `firestore.rules` 보안 잠금 + CI에 `firestore:rules` 배포 추가 | `services/firestore.js`, `firestore.rules`, `.github/workflows/firebase-hosting-merge.yml` | `[x]` | `16beee8` |
| **A4/A5** | 하드코딩된 Toss/PayPal 시크릿 제거 + 모든 관리자 함수 `assertAdmin()` 통일 (`syncBoxCatalog`, `saveBoxCatalogAdmin` 허점 제거) | `functions/index.js` | `[x]` | 커밋 중 |
| **기존3** | `firebase.json` 이미지 캐시(7일) + `closed_products` `limit(30)` + 캐시 버전(`20261128_V66`) 갱신 및 전체 검증 | `firebase.json`, `services/firestore.js`, `index.html`, `app.js` | `[x]` | 커밋 중 |

---

## 중요 기술 주의사항

1. **다날(Danal) 실결제 키 유지:**
   - `.github/workflows/firebase-hosting-merge.yml`은 `functions/.env` 없이 `firebase deploy --only functions`를 실행합니다.
   - `functions/danal.js`의 다날 라이브 키 fallback을 지금 제거하면 다음 GitHub Actions 배포 시 실결제가 중단됩니다.
   - 따라서 이번 1단계에서는 **미사용 중인 Toss/PayPal 하드코딩 키만 제거**하고, 다날 키의 Firebase Secret Manager 이전은 Firebase CLI로 시크릿 등록 후 별도 진행합니다.
2. **Firestore 보안 규칙 배포:**
   - 현재 `.github/workflows/firebase-hosting-merge.yml`은 `deploy --only functions`만 실행합니다.
   - 푸시 시 `firestore.rules`도 자동 배포되게 하려면 워크플로우를 `deploy --only functions,firestore:rules`로 맞추거나, Firebase CLI로 별도 배포해야 합니다.
3. **2~4단계 (후속 작업 - 1단계 완료 후 별도 진행):**
   - **2단계:** `super_raffles/{id}/entries` 하위 컬렉션 분리(1MB 한계 해결), `forceDrawRaffle` `drawing` 잠금 + `BulkWriter` 멱등 환불(B1)
   - **3단계:** 관리자 페이지 회원 목록 페이징(B3), `users/{uid}/vault` 하위 컬렉션 분리(B4)
   - **4단계:** 상품 이미지 WebP 압축(C1), Tailwind 사전 빌드(C2), `crypto.randomInt()` 공정 추첨(C3), `closed_products` 경량화(C4)

---

## 변경 로그
- **2026-11-28:** 1단계 작업 시작 및 Handoff 문서 생성.
