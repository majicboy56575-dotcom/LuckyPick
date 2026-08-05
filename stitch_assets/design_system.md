# Kinetic Prestige 디자인 시스템

## 브랜드 & 스타일

본 디자인 시스템은 **"절제된 흥분감(Controlled Excitement)"**을 불러일으키도록 설계되었습니다. 프리미엄 핀테크 플랫폼의 세심한 신뢰성과 고급 럭셔리 옥션의 높은 몰입감을 균형 있게 결합했습니다. 타겟 고객층은 "행운" 요소가 공정하고 투명하며 프리미엄하게 느껴지는 매끄럽고 전문적인 경험을 기대합니다.

시각적 스타일은 **촉각적 포인트를 더한 모던 코퍼레이트(Corporate Modern with Tactile Accents)**입니다. 신뢰감을 구축하기 위해 고품질 타이포그래피와 구조화된 그리드를 활용하며, 참여를 유도하기 위해 생동감 있는 칼라 포인트와 부드러운 알약(Pill) 형태의 지오메트리를 적용합니다. 인터페이스는 전반적으로 깔끔하고 여유롭게 유지되어 "당첨" 순간과 "임박" 지표가 가볍지 않고 무게감 있게 다가옵니다.

## 색상 (Colors)

상태와 감정을 직관적으로 전달하기 위해 논리 중심의 컬러 팔레트를 사용합니다:

- **Primary (Vibrant Blue / #0058BE):** 주요 액션 버튼, 진행률 바, "인증된" 상태에 사용됩니다. 애플리케이션의 "신뢰" 레이어를 상징합니다.
- **Secondary (Energetic Amber / #855300):** "당첨", "잭팟", "5분 이내 마감 임박" 타이머에만 전용으로 사용됩니다. 강렬한 임팩트를 위해 절제되어 사용해야 합니다.
- **Success (Emerald / #006947):** 거래 완료 및 성공적인 참여 확인 상태에 사용됩니다.
- **Neutral (Slate):** 정교한 세이지/슬레이트 계열 그레이를 사용해 글자 및 테두리를 표현하며, 프리미엄 SaaS 감성을 위해 순수 블랙(#000000) 사용을 지양합니다.
- **Background:** 카드는 순백색(#FFFFFF), 전체 배경은 미세한 톤의 옅은 블루/그레이(#F8FAFC)를 사용하는 레이어드 방식을 통해 소프트한 입체감을 연출합니다.

## 타이포그래피 (Typography)

전 세계적인 접근성과 모던하고 중립적인 캐릭터를 위해 **Inter** 폰트를 기반으로 하며, 다국어 지원(한국어, 영어, 태국어)에 최적화되어 있습니다.

- **Headlines (헤드라인):** 조밀한 자간(letter-spacing)과 두꺼운 굵기(Bold/ExtraBold)를 사용하여 뉴스/경매 시스템의 권위감을 형성합니다.
- **Body (본문):** 넉넉한 줄 간격(Line height)을 적용하여 최상의 읽기 환경을 제공합니다.
- **Data/Timers (카운트다운 및 티켓 번호):** **JetBrains Mono** 등 고정폭(Monospaced) 폰트를 적용합니다. 숫자 변경 시 레이어의 떨림(Jittering)을 방지하고 기술적이고 안전한 느낌을 부여합니다.
- **다국어 처리:** 한국어 및 태국어로 전환 시 동일한 글자 굵기 비율을 유지하되, 태국어의 경우 글자 짤림 방지를 위해 줄 간격을 10% 더 넓힙니다.

## 레이아웃 및 여백 (Layout & Spacing)

레이아웃은 **유동형-고정 혼합(Fluid-Fixed Hybrid)** 모델을 따릅니다. 데스크톱 환경에서는 최대 너비 1200px 컨테이너를 유지하며, 모바일에서는 24px 외곽 여백과 4열 유동 그리드를 사용합니다.

- **수직 리듬 (Vertical Rhythm):** 8px 기준 그리드를 사용합니다. 모든 컴포넌트의 높이와 여백은 8의 배수입니다.
- **안전 영역 (Safe Areas):** 상품 및 참여 카드는 최소 24px의 내부 패딩을 두어 고급스럽고 여유로운 느낌을 줍니다.
- **밀도 (Density):** 개인정보 보호 참여자 목록은 "고밀도(High Density)"를 적용하고, 메인 상품 카드는 "저밀도(Low Density)"를 적용합니다.

## 입체감 및 깊이 (Elevation & Depth)

**톤 레이어링(Tonal Layering)** 및 **은은한 그림자(Ambient Shadows)**를 통해 입체감을 표현합니다.

1. **Level 0 (바닥):** 앱 전역 배경 (#F8FAFC)
2. **Level 1 (카드):** 퍼짐이 넓고 은은한 그림자(Y: 4px, Blur: 20px, 불투명도 4% Black)와 1px 중립 테두리(#E2E8F0)가 적용된 흰색 표면
3. **Level 2 (액티브/플로팅):** 주요 CTA 버튼 및 활성화된 참여 상태. 상호작용 가능성을 시각화하기 위해 그림자 강도가 증가함 (Primary Color 불투명도 10%)
4. **글래스모피즘 (Glassmorphism):** 상단 네비게이션 바 및 다국어 토글은 12px 백드롭 블러와 80% 불투명도를 적용하여 뒤쪽 콘텐츠의 맥락을 유지합니다.

## 형태 (Shapes)

형태 언어는 **울트라 라운디드(Ultra-Rounded)** 스타일을 적용합니다.

- **주요 컨테이너:** 카드 및 모달은 16px (rounded-lg) 적용
- **버튼 및 토글:** 모든 기본 클릭 요소를 100px (Full Pill) 알약 모양으로 처리하여 친근하고 누르고 싶은 형태 제공
- **소형 요소:** 칩(Chip) 및 입력 필드는 8px 적용
- **프로그레스 바:** 친근하면서도 모던한 감성을 위해 트랙과 인디케이터 양쪽 끝을 모두 완전히 둥글게(Pill caps) 처리

## 주요 컴포넌트

### 버튼 (Buttons)
- **Primary:** 알약 모양(Pill), Primary Blue 배경, 흰색 텍스트, Bold 굵기
- **Urgency (임박 타이머):** 알약 모양(Pill), Secondary Amber 배경. 남은 시간이 5분 미만일 때만 한정 사용

### 참여 카드 (Participation Cards)
- `display-md` 타이틀, `label-caps` 카테고리 태그, 눈에 띄는 **프로그레스 바** 포함
- 프로그레스 바는 8px 두께로 제작하며 앞쪽에 은은한 "펄스(Pulse)" 애니메이션 적용

### 카운트다운 타이머 (Countdown Timers)
- **JetBrains Mono** 폰트로 표시
- 비활성 상태: 슬레이트 그레이
- 경고 상태 (< 1시간): Primary Blue
- 최종 마감 상태 (< 5분): 은은한 글로우(Glow) 효과가 적용된 Secondary Amber

### 개인정보 보호 목록 (Privacy List Items)
- "최근 참여자" 목록에 사용
- 형식: `J***n L.` 또는 `0x4...3e2`
- 익명성을 보장하면서도 고급스러운 형태를 유지하도록 기하학적 패턴이나 부드러운 컬러의 원형 아바타 적용

### 다국어 토글 (Multi-language Toggle)
- 헤더에 중첩되거나 플로팅 형태의 세그먼트 컨트롤
- KO, EN, TH 간 자연스러운 슬라이드 애니메이션과 대비 높은 선택 상태 제공

---

## 시스템 아키텍처 (Architecture)

본 앱은 **프론트엔드(View) / 백엔드(Cloud Functions)** 분리 구조를 따릅니다.

```
┌─────────────────────────────────────┐
│  Frontend (Firebase Hosting)        │
│  - HTML/CSS/JS (SPA)                │
│  - Firestore onSnapshot (읽기 전용) │
│  - Cloud Functions httpsCallable    │
│    (쓰기 요청)                       │
└──────────────┬──────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────┐
│  Backend (Firebase Cloud Functions)  │
│  - addProduct (관리자 전용)           │
│  - addParticipation (회원 전용)       │
│  - submitShippingInfo (당첨자)        │
│  - updateShippingStatus (관리자)      │
│  - checkExpiredProducts (매 1분 자동) │
│  - onUserCreated (회원가입 트리거)    │
└──────────────┬──────────────────────┘
               │ Admin SDK
┌──────────────▼──────────────────────┐
│  Database (Cloud Firestore)          │
│  - products (진행 중 상품)            │
│  - closed_products (마감 상품)        │
│  - shipping_infos (배송 정보)         │
│  - users (회원 정보)                  │
└─────────────────────────────────────┘
```

### 핵심 원칙
- **프론트엔드는 화면 렌더링만** 담당 (Firestore 실시간 구독으로 데이터 수신)
- **모든 데이터 쓰기는 Cloud Functions를 통해** 서버에서 처리
- **클라이언트의 직접 Firestore 쓰기는 Security Rules로 완전 차단**
- **타이머 만료 및 당첨자 추첨은 서버 Scheduled Function이 자동 수행** (브라우저를 닫아도 실행됨)

---

## Cloud Functions API 명세

### 1. `addProduct` (HTTPS Callable)
- **권한**: 관리자(ADMIN_EMAIL)만 호출 가능
- **입력**: `{ title, description, imageUrl, retailPrice, entryPrice, maxParticipants, timerHours, timerMinutes }`
- **처리**: 입력 검증 → `products` 컬렉션에 `status: 'active'`로 저장
- **출력**: `{ success: true, product: {...} }`

### 2. `addParticipation` (HTTPS Callable)
- **권한**: 인증된 사용자만 호출 가능
- **입력**: `{ productId, paymentId }`
- **처리**: Firestore Transaction으로 중복 참여 검증, 인원 초과 검증, 마감 여부 확인 후 참여 등록
- **출력**: `{ success: true, currentParticipants, maxParticipants }`

### 3. `submitShippingInfo` (HTTPS Callable)
- **권한**: 인증된 사용자만 호출 가능
- **입력**: `{ productId, productTitle, imageUrl, recipientName, recipientPhone, shippingAddress, zipCode }`
- **처리**: 서버에서 입력 검증 후 `shipping_infos` 컬렉션에 저장
- **출력**: `{ success: true, shippingInfo: {...} }`

### 4. `updateShippingStatus` (HTTPS Callable)
- **권한**: 관리자만 호출 가능
- **입력**: `{ shippingId, newStatus }`
- **처리**: 관리자 권한 검증 후 배송 상태 업데이트
- **출력**: `{ success: true }`

### 5. `checkExpiredProducts` (Scheduled - 매 1분)
- **트리거**: Cloud Scheduler에 의해 매 1분 자동 실행
- **처리**: `products` 컬렉션에서 `status == 'active'` & `endTime <= now`인 상품 탐색 → 참여자 중 무작위 당첨자 선정 → `closed_products` 컬렉션으로 이동 → 원본 삭제
- **출력**: 콘솔 로그

### 6. `onUserCreated` (Auth Trigger)
- **트리거**: Firebase Auth에 새 사용자 생성 시 자동 실행
- **처리**: `users` 컬렉션에 사용자 프로필 문서 자동 생성

---

## Firestore 데이터 구조

### `products` (진행 중 상품)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 상품 고유 ID |
| title | string | 상품명 |
| description | string | 설명 |
| category | string | 카테고리 |
| imageUrl | string | 상품 이미지 URL |
| retailPrice | number | 정가 (USD) |
| entryPrice | number | 참여 티켓 가격 (USD) |
| maxParticipants | number | 최대 참여 인원 |
| currentParticipants | number | 현재 참여 인원 |
| endTime | number | 마감 시각 (Unix ms) |
| status | string | 상태 (`'active'`) |
| participants | array | 참여자 배열 `[{uid, name, email, initial, joinedAt}]` |
| createdAt | number | 생성 시각 (Unix ms) |

### `closed_products` (마감 상품)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 상품 고유 ID |
| title | string | 상품명 |
| imageUrl | string | 상품 이미지 URL |
| retailPrice | number | 정가 (USD) |
| entryPrice | number | 참여 티켓 가격 (USD) |
| status | string | 상태 (`'closed'`) |
| ticketNumber | string | 당첨 티켓 번호 (예: `#IP-042`) |
| totalParticipants | number | 총 참여 인원 |
| winner | object | 당첨자 `{name, email, phone, uid}` |
| participants | array | 참여자 전체 배열 |
| closedAt | number | 마감 처리 시각 (Unix ms) |

### `shipping_infos` (배송 정보)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 배송 정보 고유 ID |
| productId | string | 연결 상품 ID |
| productTitle | string | 상품명 |
| winnerUid | string | 당첨자 UID |
| winnerName | string | 당첨자 이름 |
| winnerEmail | string | 당첨자 이메일 |
| recipientName | string | 수령인 이름 |
| recipientPhone | string | 수령인 연락처 |
| shippingAddress | string | 배송 주소 |
| zipCode | string | 우편번호 |
| status | string | 상태 (`'pending'` / `'shipped'`) |
| submittedAt | number | 제출 시각 (Unix ms) |

### `users` (회원 정보)
| 필드 | 타입 | 설명 |
|------|------|------|
| uid | string | Firebase Auth UID |
| displayName | string | 표시 이름 |
| email | string | 이메일 |
| provider | string | 인증 제공자 (`'google'`, `'email'`, `'apple'`) |
| isAdmin | boolean | 관리자 여부 |
| createdAt | number | 가입 시각 (Unix ms) |

---

## Firestore Security Rules

```
- products: 읽기 전체 허용, 쓰기 차단 (Cloud Functions Admin SDK만 가능)
- closed_products: 읽기 전체 허용, 쓰기 차단
- shipping_infos: 인증 사용자만 읽기, 쓰기 차단
- users: 본인 또는 관리자만 읽기, 쓰기 차단
```

---

## 화면별 데이터 흐름

### 홈 (진행 중 상품)
`Firestore products (onSnapshot)` → 프론트 캐시 → 카드 렌더링 + 타이머 표시
- 타이머 0 도달 시: 화면만 갱신 (서버가 자동 마감 처리)

### 지난 기록 (마감 상품)
`Firestore closed_products (onSnapshot)` → 프론트 캐시 → 카드 렌더링
- 서버가 매분 만료 상품을 자동으로 이 컬렉션에 이동

### 프로필/결제
- 참여 등록: `httpsCallable('addParticipation')` → 서버 Transaction
- 배송 정보: `httpsCallable('submitShippingInfo')` → 서버 검증 후 저장

### 관리자 페이지
- 상품 등록: `httpsCallable('addProduct')` → 서버에서 관리자 권한 검증
- 배송 관리: `httpsCallable('updateShippingStatus')` → 서버에서 관리자 권한 검증
- 통계/회원: `Firestore products, users (onSnapshot)` → 실시간 데이터 기반 계산
