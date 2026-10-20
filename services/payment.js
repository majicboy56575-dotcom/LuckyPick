import { confirmTossPayment, readyDanalPaymentServer, confirmDanalPaymentServer } from './firestore.js';

// Toss Payments Client Key (주문서형·결제창형 결제위젯 라이브 클라이언트 키)
const TOSS_CLIENT_KEY = 'live_gck_GjLJoQ1aVZX5RWeOzlz58w6KYe2R';

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
  TOSS: 'toss',
  DANAL: 'danal',
};

let selectedMethod = PAYMENT_METHODS.TOSS;

function selectPaymentMethod(method) {
  selectedMethod = method;
}

function getSelectedMethod() {
  return selectedMethod;
}

// --- Toss Payments (Payment Widget v2) Integration ---
let activeTossWidgets = null;

/**
 * Render Toss Payment Widget in specified containers
 */
async function renderTossPaymentWidget({
  methodsSelector = '#toss-payment-methods',
  agreementSelector = '#toss-agreement',
  amount,
  userId,
  userEmail,
  productId,
  productName
}) {
  if (!window.TossPayments) {
    throw new Error('토스페이먼츠 SDK가 로드되지 않았습니다.');
  }

  const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);
  const customerKey = userId
    ? `usr_${String(userId).replace(/[^a-zA-Z0-9-_]/g, '_')}`
    : (window.TossPayments.ANONYMOUS || 'ANONYMOUS');

  const widgets = tossPayments.widgets({ customerKey });
  activeTossWidgets = {
    widgets,
    amount: Number(amount),
    productId,
    productName,
    userId,
    userEmail
  };

  // 1. Set Amount
  await widgets.setAmount({
    currency: 'KRW',
    value: Number(amount)
  });

  // 2. Render Payment Methods and Agreements
  const renderPromises = [];
  if (document.querySelector(methodsSelector)) {
    renderPromises.push(
      widgets.renderPaymentMethods({ selector: methodsSelector }).catch(err => {
        console.warn('[TossWidget] renderPaymentMethods default failed, retrying:', err);
        return widgets.renderPaymentMethods({ selector: methodsSelector });
      })
    );
  }
  if (document.querySelector(agreementSelector)) {
    renderPromises.push(
      widgets.renderAgreement({ selector: agreementSelector }).catch(err => {
        console.warn('[TossWidget] renderAgreement default failed, retrying:', err);
        return widgets.renderAgreement({ selector: agreementSelector });
      })
    );
  }

  await Promise.all(renderPromises);
  return widgets;
}

/**
 * Request payment using the active Toss Payment Widget
 */
async function requestTossWidgetPayment(customParams = {}) {
  if (!activeTossWidgets || !activeTossWidgets.widgets) {
    throw new Error('토스 결제위젯이 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.');
  }

  const { widgets, amount, productId, productName, userId, userEmail } = activeTossWidgets;
  const pId = customParams.productId || productId;
  const pName = customParams.productName || productName;
  const amt = Number(customParams.amount || amount);

  // Store pending box/product in sessionStorage for return flow
  sessionStorage.setItem('toss_pending_product', pId);
  sessionStorage.setItem('pending_unboxing_box_id', pId);

  // Generate unique order ID
  const orderId = `LP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const baseUrl = window.location.origin + window.location.pathname;
  const successUrl = `${baseUrl}?toss=success&productId=${encodeURIComponent(pId)}`;
  const failUrl = `${baseUrl}?toss=fail`;

  // Track Meta Pixel InitiateCheckout
  trackMetaEvent('InitiateCheckout', {
    content_name: pName,
    content_ids: [pId],
    value: amt,
    currency: 'KRW'
  });

  await widgets.requestPayment({
    orderId,
    orderName: `LuckyPick ${pName}`,
    successUrl,
    failUrl,
    customerEmail: customParams.userEmail || userEmail || undefined,
    customerName: customParams.userId || userId || undefined
  });
}

/**
 * Handle Toss Payment success redirect.
 * Parses URL params and calls the backend confirmTossPayment callable.
 */
async function handleTossSuccess(paymentKey, orderId, amount, productId) {
  try {
    const result = await confirmTossPayment({
      paymentKey,
      orderId,
      amount: parseInt(amount),
      productId
    });

    // Track Meta Pixel Purchase Event
    trackMetaEvent('Purchase', {
      content_name: productId,
      content_ids: [productId],
      value: parseInt(amount),
      currency: 'KRW'
    });

    return result;
  } catch (err) {
    console.error('[Toss] Confirm error:', err);
    throw err;
  }
}

/**
 * --- Danal Credit Card & EasyPay (KakaoPay, NaverPay, SamsungPay) Integration ---
 */
async function requestDanalCardPayment({ amount, itemName = '럭키박스', productId }) {
  trackMetaEvent('InitiateCheckout', {
    content_name: itemName,
    content_ids: [productId],
    value: Number(amount),
    currency: 'KRW'
  });

  const baseUrl = window.location.origin + window.location.pathname;
  const returnUrl = `${baseUrl}?danal=card_return&productId=${encodeURIComponent(productId)}&amount=${amount}`;
  const cancelUrl = `${baseUrl}?danal=cancel`;

  const readyRes = await readyDanalPaymentServer({
    method: 'card',
    amount: Number(amount),
    itemName,
    productId,
    returnUrl,
    cancelUrl
  });

  if (!readyRes || !readyRes.success) {
    throw new Error(readyRes?.message || '다날 결제창 호출 준비에 실패했습니다.');
  }

  // Open Danal Payment Popup or create submission form
  const { startUrl, startParams } = readyRes;
  const popupWidth = 500;
  const popupHeight = 680;
  const left = Math.max(0, (window.screen.width - popupWidth) / 2);
  const top = Math.max(0, (window.screen.height - popupHeight) / 2);

  const popup = window.open(
    'about:blank',
    'DanalCardPopup',
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
  );

  if (!popup) {
    alert('팝업 차단이 감지되었습니다. 팝업 차단을 해제 후 다시 시도해 주세요.');
    return;
  }

  // Create form in popup and submit to startUrl
  const formHtml = `
    <!DOCTYPE html>
    <html>
    <head><title>다날 결제 진행 중</title></head>
    <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f8fafc;">
      <div style="text-align:center;">
        <p style="font-size:14px;color:#475569;font-weight:bold;">다날 결제창을 안전하게 연결하고 있습니다...</p>
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
}

/**
 * --- Danal Phone Micro-payment Integration ---
 */
async function requestDanalPhonePayment({ amount, itemName = '럭키박스', productId }) {
  trackMetaEvent('InitiateCheckout', {
    content_name: itemName,
    content_ids: [productId],
    value: Number(amount),
    currency: 'KRW'
  });

  const baseUrl = window.location.origin + window.location.pathname;
  const returnUrl = `${baseUrl}?danal=phone_return&productId=${encodeURIComponent(productId)}&amount=${amount}`;
  const cancelUrl = `${baseUrl}?danal=cancel`;

  const readyRes = await readyDanalPaymentServer({
    method: 'phone',
    amount: Number(amount),
    itemName,
    productId,
    returnUrl,
    cancelUrl
  });

  if (!readyRes || !readyRes.success) {
    throw new Error(readyRes?.message || '다날 휴대폰 결제창 호출 준비에 실패했습니다.');
  }

  const { startUrl, params } = readyRes;
  const popupWidth = 480;
  const popupHeight = 650;
  const left = Math.max(0, (window.screen.width - popupWidth) / 2);
  const top = Math.max(0, (window.screen.height - popupHeight) / 2);

  const popup = window.open(
    'about:blank',
    'DanalPhonePopup',
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
  );

  if (!popup) {
    alert('팝업 차단이 감지되었습니다. 팝업 차단을 해제 후 다시 시도해 주세요.');
    return;
  }

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

export {
  PAYMENT_METHODS,
  TOSS_CLIENT_KEY,
  selectPaymentMethod,
  getSelectedMethod,
  renderTossPaymentWidget,
  requestTossWidgetPayment,
  handleTossSuccess,
  requestDanalCardPayment,
  requestDanalPhonePayment,
  handleDanalSuccess,
};

