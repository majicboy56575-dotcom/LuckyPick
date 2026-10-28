# 럭키픽(LuckyPick) AI 비디오 마케팅 & 서비스 구조 마스터 가이드

> **문서 목적:** 본 문서는 AI 영상 생성 엔진(TubeInsight, Sora, Kling, Runway, Midjourney 등) 및 마케팅 카피라이팅 AI가 럭키픽(LuckyPick)의 실제 서비스 아키텍처, 화면 흐름, 스페셜 래플 메커니즘을 정확히 학습하여 고효율 바이럴 마케팅 영상을 생성할 수 있도록 작성된 독립 가이드입니다.

---

## 1. 핵심 후킹 및 마케팅 컨셉 (Core Hook & Concept)

### 1-1. 킬러 후킹 메시지 (Killer Hook)
- **메인 카피:**  
  *"단돈 1,000원(커피 한 잔 값)으로 구찌 가방, 아이폰 16 Pro, 에어팟을 내 손에 넣는 법?!"*
- **타깃 심리 자극:**  
  "누구나 갖고 싶지만 선뜻 사기 힘든 수백만 원대 워너비 명품과 전자기기를 초소액으로 도전할 수 있다."

### 1-2. 의심 해소 및 무위험 가치 (No-Risk Anti-Scam Hook)
- **사기/도박 의심 원천 차단 반전:**  
  *"사기 아니냐고요? 꽝은 절대 없습니다! 5천원~1만원짜리 필수 생활·IT 정품 꿀템은 100% 확정으로 즉시 받고, 구매 사은품으로 쏟아지는 '골든티켓'으로 구찌 가방·아이폰 16 Pro에 무료 응모하는 구조!"*
- **핵심 가치 제안:**  
  - ❌ 꽝이나 손실(0원 소멸)이 일절 없음.
  - ⭕ 100% 실물 공산품 확정 지급 + 보너스 명품 래플 무료 응모.
  - ⭕ 마음에 안 들면 보관함에서 60% 스토어 포인트로 즉시 교환 가능.

---

## 2. 서비스 화면 흐름 및 사용자 여정 (Screen & User Journey)

AI가 영상의 장면(Scene)을 기획하고 렌더링할 때 참고하는 5대 표준 화면 플로우입니다.

```mermaid
graph TD
    A["Screen 1: 랜딩페이지 (메인 홈)<br>- 스페셜 래플 쇼케이스 (구찌/아이폰)<br>- 3대 균일가 픽 라인업"] --> B["Screen 2: 단일 상품 선택 & 주문 모달<br>- 정가 단품 확인 (5천/1만/2만원)<br>- 신용카드/휴대폰 즉시 결제"]
    B --> C["Screen 3: 100% 실물 득템 & 골든티켓 팡파레<br>- 100% 실물 확정 축하<br>- 골든티켓 N장 무료 적립 연출"]
    C --> D["Screen 4: 스페셜 골든 래플 실시간 응모<br>- 구찌/아이폰 실시간 게이지<br>- 티켓 투입 및 1일 10회 건전 응모"]
    D --> E["Screen 5: 마이페이지 보관함 (Vault)<br>- 원클릭 실물 택배 배송 신청<br>- 또는 60% 스토어 포인트 전환 교환"]
```

---

### [Screen 1] 랜딩페이지 (메인 홈 화면)
- **상단 히어로 3D 쇼케이스:**
  - 반짝이는 골드빛 3D 럭셔리 카드: **구찌 오피디아 숄더백 (245만원)**, **아이폰 16 Pro 데저트 티타늄 (155만원)**, **에어팟**.
  - 실시간 참여 인원 게이지 바 (`184 / 200명 참여 중 - 마감 임박!`).
- **중단 3대 균일가 정가 픽 라인업:**
  1. **베이직 픽 (₩5,000):**  
     - 실물 라인업: 메탈 스마트폰 거치대, 3in1 고속 충전 케이블, 304 스테인리스 텀블러 중 택1
     - 사은 혜택: **골든티켓 2장 무료 증정**
  2. **프리미엄 픽 (₩10,000):**  
     - 실물 라인업: 10,000mAh LED 디지털 보조배터리, 맥세이프 3in1 무선충전패드, GaN 45W 충전기 중 택1
     - 사은 혜택: **골든티켓 5장 무료 증정**
  3. **VIP 하이엔드 픽 (₩20,000):**  
     - 실물 라인업: ANC 무선 노이즈캔슬링 이어폰, 휴대용 무선 무드등 서큘레이터, PD 65W 20,000mAh 보조배터리 중 택1
     - 사은 혜택: **골든티켓 11장 무료 증정**

---

### [Screen 2] 단일 상품 선택 및 결제 모달
- 소비자가 원하는 단일 상품을 클릭하면 열리는 모달 팝업.
- 상품 실물 이미지, 시중 정가, 무료 증정 골든티켓 수량 표시.
- **[신용카드 / 휴대폰 결제로 즉시 구매]** 버튼으로 안전하고 빠른 결제.

---

### [Screen 3] 100% 실물 득템 및 골든티켓 팡파레 연출
- 결제 완료 즉시 화면 전체에 골드빛 폭죽과 팡파레 이펙트 발생.
- `"축하합니다! 메탈 거치대 100% 확정 획득!"`
- 이어서 황금빛으로 눈부시게 빛나는 **`[골든티켓 2장] 무료 증정 카드`**가 날아와 내 지갑에 꽂히는 화려한 인터랙션.

---

### [Screen 4] 스페셜 골든 래플 실시간 응모 화면
- 구찌 숄더백 / 아이폰 16 Pro 상세 카드 진열.
- **실시간 프로그레스 바:** `184 / 200명 참여 중! (마감 임박)`
- 보유 골든티켓으로 간편 응모 (+1장, +3장, +5장, +10장 퀵 버튼).
- **건전 응모 상한선(Daily Cap):** 사행성 및 특정인 독점을 방지하기 위해 **1인당 상품별 1일 최대 10장**까지만 응모 가능.

---

### [Screen 5] 마이페이지 보관함(Vault) 안심 관리
- 내가 획득한 모든 실물 상품이 보관되어 있는 개인 금고(보관함) 화면.
- **옵션 A (실물 수령):** 집 주소 입력 후 `[택배 배송 신청]` 클릭 ➔ 1~3일 내 우체국/CJ대한통운 정품 포장 출고.
- **옵션 B (간편 반품 교환):** 실물 수령을 원치 않을 경우 `[스토어 포인트 60% 전환]` 클릭 ➔ 배송비 없이 0초 만에 적립금으로 바꿔 다른 픽 상품 재구매!

---

## 3. 스페셜 래플(골든 상품) 세부 스펙

| 상품명 | 시중 소비자가 | 모집 정원 (1그룹) | 1티켓 환산 가치 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **구찌 오피디아 GG 스몰 숄더백** | ₩2,450,000 | 250명 한정 | 약 ₩9,800 상당 | 100% 백화점 정품 / 보증서 동봉 |
| **아이폰 16 Pro 256GB 데저트티타늄** | ₩1,550,000 | 200명 한정 | 약 ₩7,750 상당 | 애플 코리아 정품 자급제 미개봉 |
| **에어팟 4세대 / 에어팟 프로** | ₩269,000 ~ ₩349,000 | 50명 ~ 80명 한정 | 약 ₩4,500 상당 | 애플 공식 서비스 보증 |

---

## 4. 숏폼(유튜브 쇼츠 / 틱톡 / 인스타 릴스) 30초 바이럴 콘티

AI 영상 제작 도구(TubeInsight 등)에 나레이션과 프롬프트로 바로 입력할 수 있는 표준 30초 스토리보드입니다.

| 씬 | 시간 | 비주얼 연출 (Visual Direction) | 나레이션 대본 (TTS Voice) | 온스크린 자막 (Caption) |
| :---: | :---: | :--- | :--- | :--- |
| **1** | 0~5초 | 구찌 오피디아 백과 아이폰 16 Pro 실물이 다크 마블 위에서 황금빛 조명을 받으며 클로즈업 회전. | "아직도 명품을 제값 다 주고 사세요? 단돈 1,000원에 구찌 가방, 아이폰 16 Pro를 득템하는 법!" | 🚨 1,000원으로 구찌 가방을?! |
| **2** | 5~11초 | 스마트폰 거치대와 LED 보조배터리 실물이 고급스러운 패키지에서 언박싱되는 세련된 컷. | "사기 아니냐고요? 꽝은 절대 없습니다! 5천원짜리 필수 실물 꿀템은 100% 확정으로 받고!" | ❌ 꽝 없음! 100% 실물 득템 |
| **3** | 11~19초 | 화면에 황금빛 '골든티켓'이 생성되어 날아가고, 구찌 가방 래플 게이지가 99%로 차오르는 UI 연출. | "상품마다 무료로 쏟아지는 '골든티켓'으로 245만원짜리 구찌 가방 래플에 즉시 응모하는 거죠!" | 🎟️ 무료 사은 골든티켓으로 응모! |
| **4** | 19~25초 | 택배 박스가 집 앞에 도착하고, 스마트폰 화면에서 보관함 포인트 교환 버튼이 부드럽게 눌리는 장면. | "마음에 안 들면 보관함에서 즉시 포인트로 교환까지! 손해 볼 확률 0%의 안심 쇼핑!" | 📦 안심 택배 배송 & 간편 교환 |
| **5** | 25~30초 | 럭키픽 골드 로고와 함께 네이버 검색창 그래픽 연출, 경쾌한 징글 사운드. | "이번 주 구찌의 주인공은 당신입니다. 지금 '럭키픽'에서 확인해보세요!" | 👉 지금 네이버에 '럭키픽' 검색! |

---

## 5. 생성형 AI 비디오 프롬프트 (Sora / Kling / Midjourney / Veo)

```text
[Scene 1 - Luxury Hook]
Cinematic close-up commercial shot of a luxurious Gucci Ophidia GG shoulder bag and the latest Desert Titanium iPhone 16 Pro resting on a polished dark marble pedestal. Dramatic golden volumetric god-rays, 8k resolution, ultra-photorealistic, high-end fashion commercial style, slow dolly zoom-in, 60fps.

[Scene 2 - Unboxing 100% Guaranteed Goods]
A trendy young South Korean in their 20s smiling excitedly while unboxing a sleek, premium metallic aluminum smartphone stand and an LED digital power bank on a minimalist wooden desk. Warm aesthetic lighting, crisp depth of field, realistic lifestyle product commercial, 4k.

[Scene 3 - Glowing Golden Ticket & Mobile UI]
A luminous 3D holographic Golden Ticket floating in mid-air, emitting glowing golden sparkle particles. The ticket swoops into a modern futuristic smartphone screen displaying a neon dark-mode raffle app interface, causing a live progress bar to surge to 99%, exciting and dynamic particle FX.

[Scene 4 - Safe Delivery & Vault UI]
A pristine matte-black delivery parcel with a gleaming gold 'LuckyPick' emblem being delivered to an elegant apartment doorstep, cutting smoothly to a smartphone screen showing a secure digital vault with a 'Store Credit Exchange' button clicked seamlessly.
```
