import { createPayPalOrder, capturePayPalOrder, confirmTossPayment } from './firestore.js';

const PAYPAL_CONFIG = {
  clientId: 'BAAQd5qD8T0M-kWCigLv7lhFjYOCzRMShNtqn5HtqqBxPU09YUnDupVHiK1nCFZqXEE5oJGeW98XENwlbl',
  clientSecret: '',
  currency: 'USD',
  environment: 'live'
};

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
  PAYPAL: 'paypal',
  TOSS: 'toss',
};

let selectedMethod = PAYMENT_METHODS.TOSS; // Default to Toss for Korean users

function selectPaymentMethod(method) {
  selectedMethod = method;
}

function getSelectedMethod() {
  return selectedMethod;
}

// --- PayPal Integration ---
function renderPayPalButtons(containerId, { productId, amount, orderName, onSuccess, onError, onCancel }) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (!window.paypal) {
    console.error('PayPal SDK not loaded');
    if (onError) onError('PayPal SDK not loaded');
    return;
  }

  window.paypal.Buttons({
    style: {
      layout: 'vertical',
      color: 'gold',
      shape: 'rect',
      label: 'pay'
    },
    createOrder: async (data, actions) => {
      try {
        const res = await createPayPalOrder({
          amount: amount || 50,
          orderName: orderName || 'LuckyPick Entry Ticket',
          productId: productId || ''
        });
        return res.orderId;
      } catch (err) {
        console.warn('[PayPal] Cloud Functions order creation fallback to client SDK:', err);
        return actions.order.create({
          purchase_units: [{
            description: orderName || 'LuckyPick Entry Ticket',
            amount: {
              currency_code: PAYPAL_CONFIG.currency,
              value: (amount || 50).toFixed(2)
            }
          }]
        });
      }
    },
    onApprove: async (data, actions) => {
      try {
        let details;
        try {
          details = await capturePayPalOrder({
            orderId: data.orderID,
            productId: productId || ''
          });
          details.isServerCaptured = true;
        } catch (serverErr) {
          console.warn('[PayPal] Cloud Functions capture fallback to client SDK:', serverErr);
          const clientDetails = await actions.order.capture();
          details = {
            success: true,
            paymentId: clientDetails.id,
            amount: clientDetails.purchase_units[0]?.amount?.value || amount,
            status: clientDetails.status,
            payer: clientDetails.payer,
            isServerCaptured: false
          };
        }

        console.log('[PayPal] Transaction completed:', details);
        if (onSuccess) {
          onSuccess({
            success: true,
            paymentId: details.paymentId || details.id,
            payer: details.payer,
            method: 'PAYPAL',
            amount: details.amount || amount,
            status: details.status,
            isServerCaptured: details.isServerCaptured,
            currentParticipants: details.currentParticipants,
            maxParticipants: details.maxParticipants
          });
        }
      } catch (err) {
        console.error('[PayPal] Capture error:', err);
        if (onError) onError(err);
      }
    },
    onCancel: (data) => {
      console.log('[PayPal] Payment cancelled:', data);
      if (onCancel) onCancel(data);
    },
    onError: (err) => {
      console.error('[PayPal] Error:', err);
      if (onError) onError(err);
    }
  }).render(`#${containerId}`);
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

export {
  PAYPAL_CONFIG,
  PAYMENT_METHODS,
  TOSS_CLIENT_KEY,
  selectPaymentMethod,
  getSelectedMethod,
  renderPayPalButtons,
  renderTossPaymentWidget,
  requestTossWidgetPayment,
  handleTossSuccess,
};
