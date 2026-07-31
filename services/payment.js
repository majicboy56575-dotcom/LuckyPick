// ============================================
// LuckyPick - Payment Service (Toss, Kakao, PayPal)
// ============================================

const PAYPAL_CONFIG = {
  clientId: 'ARnBA2jfyTPLQ_Q3AAUjoWIc_9PVYE_o_Klc1nWUNt_7rsFJZABm9ijFx7UAAPM9zHkgGb3kfCkRfRqZ',
  clientSecret: 'EPKfWmVywQFWdwa4SYz-bxKMP5gnn_CM-lxg-032-BNs2XfiH9QnwDPXIRggAanz7LfvV3p3bIqyvNmj',
  currency: 'USD',
  environment: 'sandbox'
};

const PAYMENT_METHODS = {
  TOSS: 'toss',
  KAKAO: 'kakao',
  PAYPAL: 'paypal'
};

let selectedMethod = PAYMENT_METHODS.PAYPAL;

function selectPaymentMethod(method) {
  selectedMethod = method;
}

function getSelectedMethod() {
  return selectedMethod;
}

// --- PayPal Integration ---
function renderPayPalButtons(containerId, { amount, orderName, onSuccess, onError, onCancel }) {
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
    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [{
          description: orderName || 'LuckyPick Entry Ticket',
          amount: {
            currency_code: PAYPAL_CONFIG.currency,
            value: (amount || 50).toFixed(2)
          }
        }]
      });
    },
    onApprove: async (data, actions) => {
      try {
        const details = await actions.order.capture();
        console.log('[PayPal] Transaction completed:', details);
        if (onSuccess) {
          onSuccess({
            success: true,
            paymentId: details.id,
            payer: details.payer,
            method: 'PAYPAL',
            amount: details.purchase_units[0].amount.value,
            status: details.status
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

// --- Toss Pay Integration Stub ---
async function requestTossPayment({ orderId, orderName, amount, customerName, customerEmail }) {
  console.log('[TossPay] Payment requested:', { orderId, orderName, amount });
  return {
    success: true,
    paymentId: 'toss_' + Date.now(),
    method: 'TOSS_PAY',
    amount,
    orderId,
  };
}

// --- Kakao Pay Integration Stub ---
async function requestKakaoPayment({ orderId, orderName, amount, customerName }) {
  console.log('[KakaoPay] Payment requested:', { orderId, orderName, amount });
  return {
    success: true,
    paymentId: 'kakao_' + Date.now(),
    method: 'KAKAO_PAY',
    amount,
    orderId,
  };
}

// --- Unified Payment Request ---
async function processPayment({ productId, productTitle, amount, userName, userEmail }) {
  const orderId = `LP_${productId}_${Date.now()}`;
  const params = {
    orderId,
    orderName: `LuckyPick: ${productTitle}`,
    amount,
    customerName: userName,
    customerEmail: userEmail,
  };

  let result;
  if (selectedMethod === PAYMENT_METHODS.TOSS) {
    result = await requestTossPayment(params);
  } else if (selectedMethod === PAYMENT_METHODS.KAKAO) {
    result = await requestKakaoPayment(params);
  } else if (selectedMethod === PAYMENT_METHODS.PAYPAL) {
    result = { success: true, pendingPayPalButtons: true };
  }

  if (result?.success && !result?.pendingPayPalButtons) {
    console.log('[Payment] Success:', result);
  }

  return result;
}

export {
  PAYPAL_CONFIG,
  PAYMENT_METHODS,
  selectPaymentMethod,
  getSelectedMethod,
  renderPayPalButtons,
  processPayment,
  requestTossPayment,
  requestKakaoPayment,
};
