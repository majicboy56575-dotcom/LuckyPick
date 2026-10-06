import { createPayPalOrder, capturePayPalOrder, confirmTossPayment } from './firestore.js';

const PAYPAL_CONFIG = {
  clientId: 'BAAIYArbS9Tv4eh1sD7CNm2ruF4mT1uEJytLaU_KXQ_T1ZC9tGCmEGXFP5HJTBH9zguanWW1fyP78Q6ly4',
  clientSecret: '',
  currency: 'USD',
  environment: 'live'
};

// Toss Payments Client Key (사용자 테스트 클라이언트 키)
const TOSS_CLIENT_KEY = 'test_ck_ZLKGPx4M3MbNoAwdPzJoVBaWypv1';

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

// --- Toss Payments Integration ---
/**
 * Request Toss Payment - opens the Toss payment popup.
 * On success, Toss redirects to successUrl with paymentKey, orderId, amount params.
 */
async function requestTossPayment({ productId, productName, amount, userId, userEmail }) {
  if (!window.TossPayments) {
    throw new Error('토스페이먼츠 SDK가 로드되지 않았습니다.');
  }

  const tossPayments = TossPayments(TOSS_CLIENT_KEY);

  // Store pending productId in sessionStorage so it survives redirects
  sessionStorage.setItem('toss_pending_product', productId);

  // Generate unique order ID
  const orderId = `LP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Build success/fail URLs with query parameters
  const baseUrl = window.location.origin + window.location.pathname;
  const successUrl = `${baseUrl}?toss=success&productId=${encodeURIComponent(productId)}`;
  const failUrl = `${baseUrl}?toss=fail`;

  // Track Meta Pixel InitiateCheckout
  trackMetaEvent('InitiateCheckout', {
    content_name: productName,
    content_ids: [productId],
    value: amount,
    currency: 'KRW'
  });

  await tossPayments.requestPayment('카드', {
    amount: amount,
    orderId: orderId,
    orderName: `LuckyPick ${productName}`,
    successUrl: successUrl,
    failUrl: failUrl,
    customerEmail: userEmail || '',
    customerName: userId || 'guest'
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
  requestTossPayment,
  handleTossSuccess,
};
