import { createPayPalOrder, capturePayPalOrder } from './firestore.js';

const PAYPAL_CONFIG = {
  clientId: 'BAAIYArbS9Tv4eh1sD7CNm2ruF4mT1uEJytLaU_KXQ_T1ZC9tGCmEGXFP5HJTBH9zguanWW1fyP78Q6ly4',
  clientSecret: '',
  currency: 'USD',
  environment: 'live'
};

const PAYMENT_METHODS = {
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

export {
  PAYPAL_CONFIG,
  PAYMENT_METHODS,
  selectPaymentMethod,
  getSelectedMethod,
  renderPayPalButtons,
};
