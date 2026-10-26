import { readyDanalPaymentServer, confirmDanalPaymentServer } from './firestore.js';

/**
 * Trigger standard Meta Pixel Events
 */
export function trackMetaEvent(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      window.fbq('track', eventName, params);
      console.log(`[MetaPixel] Tracked: ${eventName}`, params);
    } catch (e) {
      console.warn('[MetaPixel] Tracking failed:', e);
    }
  }
}

const PAYMENT_METHODS = {
  DANAL_CARD: 'danal_card',
  DANAL_PHONE: 'danal_phone',
};

let selectedMethod = PAYMENT_METHODS.DANAL_CARD;

function selectPaymentMethod(method) {
  selectedMethod = method;
}

function getSelectedMethod() {
  return selectedMethod;
}

/**
 * --- Danal Credit Card & EasyPay (KakaoPay, NaverPay, SamsungPay) Integration ---
 */
async function requestDanalCardPayment({ amount, itemName = '럭키픽 상품', productId }) {
  trackMetaEvent('InitiateCheckout', {
    content_name: itemName,
    content_ids: [productId],
    value: Number(amount),
    currency: 'KRW'
  });

  // Store pending unboxing target in sessionStorage
  sessionStorage.setItem('danal_pending_product', productId);
  sessionStorage.setItem('pending_unboxing_box_id', productId);

  const baseUrl = window.location.origin + window.location.pathname;
  const returnUrl = `${baseUrl}?danal=card_return&productId=${encodeURIComponent(productId)}&amount=${amount}`;
  const cancelUrl = `${baseUrl}?danal=cancel`;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  let popup = null;

  // On PC, try opening a popup immediately within the click event context to avoid browser popup blockers
  if (!isMobile) {
    const popupWidth = 500;
    const popupHeight = 680;
    const left = Math.max(0, (window.screen.width - popupWidth) / 2);
    const top = Math.max(0, (window.screen.height - popupHeight) / 2);

    try {
      popup = window.open(
        'about:blank',
        'DanalCardPopup',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
      if (popup) {
        popup.document.write(`
          <!DOCTYPE html>
          <html>
          <head><title>다날 결제창 연결 중</title></head>
          <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#0f172a;color:#fff;">
            <div style="text-align:center;">
              <div style="width:36px;height:36px;border:3px solid #38bdf8;border-top-color:transparent;border-radius:50%;margin:0 auto 16px;animation:spin 1s linear infinite;"></div>
              <p style="font-size:15px;font-weight:bold;margin:0;">다날 카드 결제창을 안전하게 연결하고 있습니다...</p>
              <p style="font-size:12px;color:#94a3b8;margin-top:8px;">잠시만 기다려주세요.</p>
            </div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
          </body>
          </html>
        `);
      }
    } catch (e) {
      console.warn('[DanalCard] Pre-opening popup failed:', e);
      popup = null;
    }
  }

  let readyRes;
  try {
    readyRes = await readyDanalPaymentServer({
      method: 'card',
      amount: Number(amount),
      itemName,
      productId,
      returnUrl,
      cancelUrl
    });
  } catch (err) {
    if (popup && !popup.closed) popup.close();
    throw err;
  }

  if (!readyRes || !readyRes.success) {
    if (popup && !popup.closed) popup.close();
    throw new Error(readyRes?.message || '다날 결제창 호출 준비에 실패했습니다.');
  }

  const { startUrl, startParams } = readyRes;

  // If popup window is available and open, post form in the popup
  if (popup && !popup.closed) {
    const formHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>다날 결제 진행 중</title></head>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f8fafc;">
        <div style="text-align:center;">
          <p style="font-size:14px;color:#475569;font-weight:bold;">다날 결제창을 연결하고 있습니다...</p>
        </div>
        <form name="danal_form" action="${startUrl}" method="POST">
          <input type="hidden" name="STARTPARAMS" value="${startParams}">
        </form>
        <script>
          document.danal_form.submit();
        </script>
      </body>
      </html>
    `;
    popup.document.open();
    popup.document.write(formHtml);
    popup.document.close();
  } else {
    // If popup blocked or on mobile device, submit in the current window
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = startUrl;
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'STARTPARAMS';
    input.value = startParams;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  }
}

/**
 * --- Danal Phone Micro-payment Integration ---
 */
async function requestDanalPhonePayment({ amount, itemName = '럭키픽 상품', productId }) {
  trackMetaEvent('InitiateCheckout', {
    content_name: itemName,
    content_ids: [productId],
    value: Number(amount),
    currency: 'KRW'
  });

  // Store pending unboxing target in sessionStorage
  sessionStorage.setItem('danal_pending_product', productId);
  sessionStorage.setItem('pending_unboxing_box_id', productId);

  const baseUrl = window.location.origin + window.location.pathname;
  const returnUrl = `${baseUrl}?danal=phone_return&productId=${encodeURIComponent(productId)}&amount=${amount}`;
  const cancelUrl = `${baseUrl}?danal=cancel`;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  let popup = null;

  // On PC, try opening a popup immediately within the click event context
  if (!isMobile) {
    const popupWidth = 480;
    const popupHeight = 650;
    const left = Math.max(0, (window.screen.width - popupWidth) / 2);
    const top = Math.max(0, (window.screen.height - popupHeight) / 2);

    try {
      popup = window.open(
        'about:blank',
        'DanalPhonePopup',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
      if (popup) {
        popup.document.write(`
          <!DOCTYPE html>
          <html>
          <head><title>다날 휴대폰 결제창 연결 중</title></head>
          <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#0f172a;color:#fff;">
            <div style="text-align:center;">
              <div style="width:36px;height:36px;border:3px solid #10b981;border-top-color:transparent;border-radius:50%;margin:0 auto 16px;animation:spin 1s linear infinite;"></div>
              <p style="font-size:15px;font-weight:bold;margin:0;">다날 휴대폰 결제창을 안전하게 연결하고 있습니다...</p>
              <p style="font-size:12px;color:#94a3b8;margin-top:8px;">잠시만 기다려주세요.</p>
            </div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
          </body>
          </html>
        `);
      }
    } catch (e) {
      console.warn('[DanalPhone] Pre-opening popup failed:', e);
      popup = null;
    }
  }

  let readyRes;
  try {
    readyRes = await readyDanalPaymentServer({
      method: 'phone',
      amount: Number(amount),
      itemName,
      productId,
      returnUrl,
      cancelUrl
    });
  } catch (err) {
    if (popup && !popup.closed) popup.close();
    throw err;
  }

  if (!readyRes || !readyRes.success) {
    if (popup && !popup.closed) popup.close();
    throw new Error(readyRes?.message || '다날 휴대폰 결제창 호출 준비에 실패했습니다.');
  }

  const { startUrl, params } = readyRes;

  if (popup && !popup.closed) {
    let inputs = '';
    for (const [k, v] of Object.entries(params)) {
      inputs += `<input type="hidden" name="${k}" value="${v}">\n`;
    }

    const formHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>다날 휴대폰 결제 진행 중</title></head>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f8fafc;">
        <div style="text-align:center;">
          <p style="font-size:14px;color:#475569;font-weight:bold;">다날 휴대폰 결제창을 연결하고 있습니다...</p>
        </div>
        <form name="danal_phone_form" action="${startUrl}" method="POST">
          ${inputs}
        </form>
        <script>
          document.danal_phone_form.submit();
        </script>
      </body>
      </html>
    `;

    popup.document.open();
    popup.document.write(formHtml);
    popup.document.close();
  } else {
    // If popup blocked or on mobile device, submit in current window
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = startUrl;
    for (const [k, v] of Object.entries(params)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = v;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }
}

/**
 * Handle Danal Payment Confirm
 */
async function handleDanalSuccess(returnParams, amount, productId, orderId, method = 'card') {
  try {
    const result = await confirmDanalPaymentServer({
      returnParams,
      amount: parseInt(amount),
      productId,
      orderId,
      method
    });

    if (result && result.success) {
      trackMetaEvent('Purchase', {
        content_name: productId,
        content_ids: [productId],
        value: parseInt(amount),
        currency: 'KRW'
      });
    }

    return result;
  } catch (err) {
    console.error('[Danal] Confirm error:', err);
    throw err;
  }
}

// Backward-compatibility no-op (Toss Payments removed)
async function handleTossSuccess() {
  console.warn('[Toss] Toss Payments has been deprecated and removed.');
  return { success: false, message: '토스페이가 제거되었습니다.' };
}

export {
  PAYMENT_METHODS,
  selectPaymentMethod,
  getSelectedMethod,
  requestDanalCardPayment,
  requestDanalPhonePayment,
  handleDanalSuccess,
  handleTossSuccess,
};
