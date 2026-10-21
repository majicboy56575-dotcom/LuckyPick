import os
import io
import sys
from playwright.sync_api import sync_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

OUTPUT_DIR = r"C:\App\LuckyPick\danal_captures"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# HTML Template for Slide 8 (포인트 사용 프로세스) - 1:1 match with Image 1
# ---------------------------------------------------------------------------
html_slide8 = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Noto Sans KR", sans-serif; }
  body { background: #f1f5f9; display: flex; align-items: center; justify-content: center; width: 1100px; height: 600px; padding: 20px; }
  .container { width: 100%; height: 100%; display: flex; gap: 24px; }
  .panel { flex: 1; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; display: flex; flex-direction: column; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
  
  .step-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 12px; }
  .step-num { width: 20px; height: 20px; background: #0f172a; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; }

  /* Left Panel */
  .category-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 18px; }
  .cat-btn { padding: 8px 4px; text-align: center; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 11px; font-weight: 600; color: #334155; background: #f8fafc; }
  .cat-btn.active { border-color: #f97316; color: #c2410c; background: #fff7ed; }

  .sub-title { font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 8px; }
  .type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 18px; }
  .type-btn { padding: 10px 8px; text-align: center; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 11px; color: #475569; background: #f8fafc; }
  .type-btn.selected { border: 2px solid #f97316; color: #c2410c; background: #fff; font-weight: 700; }

  .notice-bar { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px; font-size: 11px; color: #c2410c; text-align: center; margin-bottom: 14px; font-weight: 600; }
  .input-group { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; background: #fff; font-size: 12px; color: #64748b; }
  .qty-val { font-weight: 700; color: #0f172a; }

  /* Right Panel */
  .header-brand { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px; }
  .brand-logo { font-size: 18px; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; display: flex; align-items: center; gap: 6px; }
  .point-pill { background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #d97706; display: flex; align-items: center; gap: 6px; }

  .order-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
  .order-row { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 8px; }
  .order-row.total { font-size: 15px; font-weight: 800; color: #0f172a; border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 10px; margin-bottom: 0; }
  .order-row.highlight { color: #2563eb; font-weight: 700; }

  .pay-btn { background: #2563eb; color: #fff; font-weight: 800; font-size: 15px; text-align: center; padding: 15px; border-radius: 12px; box-shadow: 0 4px 10px rgba(37,99,235,0.25); margin-bottom: 16px; cursor: pointer; }
  .footnote { font-size: 10.5px; color: #94a3b8; text-align: center; line-height: 1.5; }
</style>
</head>
<body>
  <div class="container">
    <!-- Left: Service/Box Selection -->
    <div class="panel">
      <div class="step-badge"><span class="step-num">1</span> 럭키박스 상품 및 카테고리 선택</div>
      <div class="category-grid">
        <div class="cat-btn active">베이직 5,000P</div>
        <div class="cat-btn">프리미엄 1.5만P</div>
        <div class="cat-btn">VIP 3.0만P</div>
        <div class="cat-btn">배송비 3,000P</div>
      </div>

      <div class="sub-title">서비스 패키지 유형 선택하기</div>
      <div class="type-grid">
        <div class="type-btn selected">실속 베이직 5,000원<br><small style="color:#ea580c; font-weight:bold;">(충전 포인트 차감)</small></div>
        <div class="type-btn">프리미엄 디지털 15,000원<br><small style="color:#64748b;">(충전 포인트 차감)</small></div>
        <div class="type-btn">VIP 명품 패키지 30,000원<br><small style="color:#64748b;">(충전 포인트 차감)</small></div>
        <div class="type-btn">보관함 택배배송비 3,000원<br><small style="color:#64748b;">(포인트 결제)</small></div>
      </div>

      <div class="step-badge" style="margin-top: 4px;"><span class="step-num">2</span> 개봉 수량 및 옵션 확인</div>
      <div class="notice-bar">
        ⓘ 1회 개봉 시 충전된 보유 포인트에서 정찰제 5,000P가 즉시 차감됩니다.
      </div>
      <div class="input-group">
        <span>선택 수량: 1회 개봉 (100% 실물 상품 당첨)</span>
        <span class="qty-val">5,000 P</span>
      </div>
    </div>

    <!-- Right: Point Deduction & Payment Processing -->
    <div class="panel">
      <div class="header-brand">
        <div class="brand-logo">
          <span>🎁</span> LuckyPick
        </div>
        <div class="point-pill">
          <span>🪙 내 보유 포인트</span>
          <span style="font-size: 14px; font-weight: 900; color: #b45309;">10,000 P</span>
        </div>
      </div>

      <div class="step-badge"><span class="step-num">3</span> 포인트 차감 및 결제 승인</div>
      <div class="order-card">
        <div class="order-row">
          <span>선택 상품</span>
          <span style="color:#0f172a; font-weight:600;">베이직 럭키박스 (1회)</span>
        </div>
        <div class="order-row">
          <span>상품 정가</span>
          <span>5,000 원</span>
        </div>
        <div class="order-row highlight">
          <span>결제 수단</span>
          <span>충전 포인트 즉시 차감</span>
        </div>
        <div class="order-row highlight">
          <span>현재 포인트 잔액</span>
          <span>10,000 P</span>
        </div>
        <div class="order-row total">
          <span>결제(차감) 금액</span>
          <span style="color: #2563eb; font-size: 18px;">5,000 P</span>
        </div>
      </div>

      <div class="pay-btn">
        보유 포인트로 결제하기 (5,000P 차감)
      </div>

      <div class="footnote">
        ※ 결제 진행 시 충전된 포인트 잔액에서 5,000P가 자동 차감되며, 실시간 래플 개봉 후 당첨 상품이 마이페이지 보관함에 즉시 지급됩니다.
      </div>
    </div>
  </div>
</body>
</html>
"""

# ---------------------------------------------------------------------------
# HTML Template for Slide 9 (이용약관 환불) - 1:1 match with Image 2
# ---------------------------------------------------------------------------
html_slide9 = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Noto Sans KR", sans-serif; }
  body { background: #ffffff; display: flex; align-items: center; justify-content: center; width: 1100px; height: 520px; padding: 30px; }
  .terms-card { width: 100%; height: 100%; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 36px 44px; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.04); }
  
  .terms-title { font-size: 16px; font-weight: 800; color: #1e293b; margin-bottom: 22px; display: flex; align-items: center; gap: 8px; }
  .terms-body { font-size: 14.5px; line-height: 1.85; color: #334155; }
  .clause { margin-bottom: 20px; }
  
  .red-underline {
    display: inline;
    border-bottom: 3.5px solid #dc2626;
    font-weight: 800;
    color: #0f172a;
    padding-bottom: 2px;
  }
  .highlight-box {
    background: #fef2f2;
    border-left: 4px solid #dc2626;
    padding: 12px 18px;
    margin-top: 16px;
    border-radius: 0 8px 8px 0;
    font-size: 13px;
    color: #991b1b;
    font-weight: 600;
  }
</style>
</head>
<body>
  <div class="terms-card">
    <div class="terms-title">
      <span>📄</span> 럭키픽 이용약관 제 5 조 (청약철회 및 환불 규정)
    </div>
    <div class="terms-body">
      <div class="clause">
        <strong>5. 2.</strong> 회원이 구매한 럭키박스는 개봉 전이거나 실물 상품의 배송 접수 전 상태인 경우 결제일로부터 7일 이내에 주문 취소 및 전액 환불을 제공합니다. 어떠한 이유로든 회사가 주문을 이행할 수 없거나 회원의 정당한 청약철회 요청이 있을 경우, 회원에게 주문 취소를 제공하고, <span class="red-underline">취소된 서비스 구매에 지불된 금액은 구매자의 결제 방법으로 환불됩니다.</span>
      </div>
      <div class="clause" style="margin-bottom: 0;">
        <strong>5. 3.</strong> 충전 포인트 환불: 유료 결제로 충전한 포인트 중 사용하지 않은 잔여 포인트는 결제일로부터 7일 이내 요청 시 <span class="red-underline">구매자의 결제 방법(신용카드 승인 취소, 휴대폰 결제 취소)으로 환불됩니다.</span>
      </div>
    </div>
    <div class="highlight-box">
      ※ 다날 PG 신용카드 및 휴대폰 소액결제 표준 승인 취소 규정을 엄격히 준수하며, 불법 현금 유통(깡) 방지를 위해 별도의 현금/계좌 송금 환불은 일체 불가합니다.
    </div>
  </div>
</body>
</html>
"""

# ---------------------------------------------------------------------------
# HTML Template for Slide 10 (포인트 사용처) - 1:1 match with Image 3
# ---------------------------------------------------------------------------
html_slide10 = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Noto Sans KR", sans-serif; }
  body { background: #ffffff; display: flex; align-items: center; justify-content: center; width: 1100px; height: 520px; padding: 30px; }
  .notice-card { width: 100%; height: 100%; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 44px 48px; display: flex; flex-direction: column; justify-content: flex-start; box-shadow: 0 4px 14px rgba(0,0,0,0.04); }
  
  .big-red-text {
    font-size: 26px;
    font-weight: 900;
    color: #e11d48;
    margin-bottom: 30px;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .specs-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .spec-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px 20px;
  }
  .spec-title {
    font-size: 13.5px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .spec-desc {
    font-size: 12.5px;
    color: #475569;
    line-height: 1.55;
  }
</style>
</head>
<body>
  <div class="notice-card">
    <div class="big-red-text">
      <span>●</span> 해당 사이트에서만 포인트 사용이 가능합니다.
    </div>

    <div class="specs-grid">
      <div class="spec-item">
        <div class="spec-title">1. 적용 사이트 (단독 플랫폼)</div>
        <div class="spec-desc">
          • 공식 서비스 URL: <strong>https://luckypick-ec4cf.web.app</strong><br>
          • 당사 럭키픽 온라인 플랫폼 내에서만 독점 사용되며, 타 사이트 및 오프라인 매장 사용이 원천 불가합니다.
        </div>
      </div>

      <div class="spec-item">
        <div class="spec-title">2. 포인트 사용 용도</div>
        <div class="spec-desc">
          • 당사 플랫폼 내 블라인드 큐레이션 럭키박스 개봉 이용<br>
          • 획득한 실물 상품 출고 시 택배 배송비(3,000P) 결제 이용
        </div>
      </div>

      <div class="spec-item">
        <div class="spec-title">3. 환금성 및 외부 유출 원천 차단</div>
        <div class="spec-desc">
          • 현금 환전 및 계좌 인출 일체 불가 (환금성 0%)<br>
          • 회원 간 포인트 선물, 양도, 이전 및 장외 거래 시스템 원천 차단
        </div>
      </div>

      <div class="spec-item">
        <div class="spec-title">4. 미사용 포인트 100% 환불 보장</div>
        <div class="spec-desc">
          • 결제 후 사용하지 않은 포인트는 7일 이내 원 결제수단(신용카드/휴대폰 승인 취소)으로 100% 전액 환불됩니다.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
"""

def generate_screens():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # Render Slide 8
        page8 = browser.new_page(viewport={"width": 1100, "height": 600}, device_scale_factor=2)
        page8.set_content(html_slide8)
        p8_path = os.path.join(OUTPUT_DIR, "08_point_use_process_v2.png")
        page8.screenshot(path=p8_path)
        print(f"Generated Slide 8 capture: {p8_path}")
        page8.close()

        # Render Slide 9
        page9 = browser.new_page(viewport={"width": 1100, "height": 520}, device_scale_factor=2)
        page9.set_content(html_slide9)
        p9_path = os.path.join(OUTPUT_DIR, "09_refund_terms_v2.png")
        page9.screenshot(path=p9_path)
        print(f"Generated Slide 9 capture: {p9_path}")
        page9.close()

        # Render Slide 10
        page10 = browser.new_page(viewport={"width": 1100, "height": 520}, device_scale_factor=2)
        page10.set_content(html_slide10)
        p10_path = os.path.join(OUTPUT_DIR, "10_point_scope_v2.png")
        page10.screenshot(path=p10_path)
        print(f"Generated Slide 10 capture: {p10_path}")
        page10.close()

        browser.close()
    print("All custom slide captures generated successfully!")

if __name__ == "__main__":
    generate_screens()
