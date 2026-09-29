// ============================================
// LuckyPick - Cloud Functions Backend
// All business logic runs server-side
// ============================================
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp();
const db = getFirestore();

// ============================================
// ADMIN EMAIL (used for admin privilege checks)
// ============================================
const ADMIN_EMAIL = "majicboy56575@gmail.com";

// Toss Payments Secret Key (loaded from functions/.env)
const TOSS_SECRET_KEY =
  process.env.TOSS_SECRET_KEY || "test_sk_24xLea5zVAjlGnv5D0e7rQAMYNwW";

// ============================================
// Helper: Privacy Masking
// ============================================
function maskName(name) {
  if (!name) return "사용자";
  name = name.trim();
  if (/^[가-힣]+$/.test(name)) {
    if (name.length === 2) return name[0] + "X";
    if (name.length >= 3)
      return name[0] + "X".repeat(name.length - 2) + name[name.length - 1];
  }
  const parts = name.split(" ");
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    const maskedFirst =
      first.length > 2 ? first[0] + "***" + first[first.length - 1] : first[0] + "*";
    const maskedLast = last[0] + ".";
    return `${maskedFirst} ${maskedLast}`;
  }
  return name.length > 2
    ? name[0] + "***" + name[name.length - 1]
    : name[0] + "*";
}

function maskEmail(email) {
  if (!email) return "usr****@example.com";
  const parts = email.split("@");
  if (parts.length < 2) return email;
  const user = parts[0];
  const domain = parts[1];
  let maskedUser =
    user.length <= 3 ? user[0] + "***" : user.slice(0, 2) + "****" + user.slice(-1);
  return `${maskedUser}@${domain}`;
}

// ============================================
// 1. addProduct (Callable) - Admin Only
// ============================================
exports.addProduct = onCall({ region: "asia-northeast3" }, async (request) => {
  // Auth check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  // Admin check
  const callerEmail = request.auth.token.email || "";
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
  if (callerEmail !== ADMIN_EMAIL && !isEmulator) {
    throw new HttpsError("permission-denied", "관리자만 상품을 등록할 수 있습니다.");
  }

  const {
    title,
    description,
    imageUrl,
    retailPrice,
    entryPrice,
    maxParticipants,
    timerHours,
    timerMinutes,
  } = request.data;

  // Validation
  if (!title || !retailPrice || !entryPrice || !maxParticipants) {
    throw new HttpsError("invalid-argument", "모든 필수 항목을 입력해주세요.");
  }

  const hours = parseFloat(timerHours) || 0;
  const minutes = parseFloat(timerMinutes) || 0;
  let durationMs = (hours * 3600 + minutes * 60) * 1000;
  if (durationMs <= 0) {
    throw new HttpsError("invalid-argument", "제한 시간을 1분 이상 설정해주세요.");
  }

  const now = Date.now();
  const id =
    "prod_" + now.toString(36) + "_" + Math.random().toString(36).slice(2, 6);

  const newProduct = {
    id,
    title,
    description: description || "",
    category: "NEW",
    imageUrl: imageUrl || "",
    retailPrice: parseFloat(retailPrice) || 0,
    entryPrice: parseFloat(entryPrice) || 1,
    maxParticipants: parseInt(maxParticipants) || 100,
    currentParticipants: 0,
    endTime: now + durationMs,
    status: "active",
    participants: [],
    createdAt: now,
  };

  await db.collection("products").doc(id).set(newProduct);

  return { success: true, product: newProduct };
});

// ============================================
// 2. addParticipation (Callable) - Authenticated Users
// ============================================
exports.addParticipation = onCall({ region: "asia-northeast3" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  const { productId, paymentId } = request.data;
  if (!productId) {
    throw new HttpsError("invalid-argument", "상품 ID가 필요합니다.");
  }

  const uid = request.auth.uid;
  const userName = request.auth.token.name || request.auth.token.email?.split("@")[0] || "사용자";
  const userEmail = request.auth.token.email || "user@luckypick.com";

  const productRef = db.collection("products").doc(productId);

  const result = await db.runTransaction(async (transaction) => {
    const productDoc = await transaction.get(productRef);
    if (!productDoc.exists) {
      throw new HttpsError("not-found", "상품을 찾을 수 없습니다.");
    }

    const product = productDoc.data();

    // Check if still active
    if (product.status !== "active" || product.endTime <= Date.now()) {
      throw new HttpsError("failed-precondition", "마감된 상품입니다.");
    }

    // Check capacity
    if (product.currentParticipants >= product.maxParticipants) {
      throw new HttpsError("resource-exhausted", "참여 인원이 가득 찼습니다.");
    }

    // Check duplicate participation
    const isDuplicate = (product.participants || []).some((p) => p.uid === uid);
    if (isDuplicate) {
      throw new HttpsError("already-exists", "이미 참여한 상품입니다.");
    }

    const newParticipant = {
      uid,
      name: maskName(userName),
      email: maskEmail(userEmail),
      phone: "",
      initial: userName ? userName.charAt(0).toUpperCase() : "U",
      paymentId: paymentId || "",
      joinedAt: Date.now(),
    };

    transaction.update(productRef, {
      currentParticipants: product.currentParticipants + 1,
      participants: [...(product.participants || []), newParticipant],
    });

    return {
      currentParticipants: product.currentParticipants + 1,
      maxParticipants: product.maxParticipants,
    };
  });

  return { success: true, ...result };
});

// ============================================
// 3. submitShippingInfo (Callable) - Authenticated Winners
// ============================================
exports.submitShippingInfo = onCall({ region: "asia-northeast3" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  const {
    productId,
    productTitle,
    imageUrl,
    recipientName,
    recipientPhone,
    shippingAddress,
    zipCode,
  } = request.data;

  if (!recipientName || !shippingAddress) {
    throw new HttpsError(
      "invalid-argument",
      "수령인 이름과 배송 주소를 입력해 주세요."
    );
  }

  const uid = request.auth.uid;
  const callerEmail = request.auth.token.email || "";
  const callerName = request.auth.token.name || callerEmail.split("@")[0] || "당첨자";

  const id = "ship_" + Date.now();
  const newInfo = {
    id,
    productId: productId || "",
    productTitle: productTitle || "당첨 상품",
    imageUrl: imageUrl || "",
    winnerUid: uid,
    winnerName: callerName,
    winnerEmail: callerEmail,
    recipientName,
    recipientPhone: recipientPhone || "",
    shippingAddress,
    zipCode: zipCode || "",
    status: "pending",
    submittedAt: Date.now(),
  };

  await db.collection("shipping_infos").doc(id).set(newInfo);

  return { success: true, shippingInfo: newInfo };
});

// ============================================
// 4. updateShippingStatus (Callable) - Admin Only
// ============================================
exports.updateShippingStatus = onCall({ region: "asia-northeast3" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  const callerEmail = request.auth.token.email || "";
  if (callerEmail !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "관리자만 배송 상태를 변경할 수 있습니다.");
  }

  const { shippingId, newStatus } = request.data;
  if (!shippingId || !newStatus) {
    throw new HttpsError("invalid-argument", "배송 ID와 새 상태가 필요합니다.");
  }

  const shippingRef = db.collection("shipping_infos").doc(shippingId);
  const shippingDoc = await shippingRef.get();
  if (!shippingDoc.exists) {
    throw new HttpsError("not-found", "배송 정보를 찾을 수 없습니다.");
  }

  await shippingRef.update({ status: newStatus });

  return { success: true };
});

// ============================================
// 5. checkExpiredProducts (Scheduled - every 1 minute)
//    Automatically closes expired products, draws winners per completed group,
//    and auto-refunds participants in incomplete groups via PayPal.
// ============================================
exports.checkExpiredProducts = onSchedule(
  { schedule: "every 1 minutes", region: "asia-northeast3", timeoutSeconds: 300 },
  async () => {
    const now = Date.now();
    const productsSnap = await db
      .collection("products")
      .where("endTime", "<=", now)
      .get();

    if (productsSnap.empty) {
      console.log("[Scheduler] No expired products found.");
      return;
    }

    for (const productDoc of productsSnap.docs) {
      const product = productDoc.data();
      const productId = productDoc.id;
      const unitSize = product.maxParticipants || 20;
      const sortedParticipants = [...(product.participants || [])].sort(
        (a, b) => (a.joinedAt || 0) - (b.joinedAt || 0)
      );
      const totalCount = sortedParticipants.length;
      const completedGroups = Math.floor(totalCount / unitSize);
      const remainderCount = totalCount % unitSize;

      const winners = [];
      const refundedParticipants = [];

      if (totalCount === 0) {
        // No participants at all
        winners.push({
          groupNumber: 0,
          name: "미당첨 (참여자 없음)",
          email: "-",
          phone: "-",
          uid: "",
          ticketNumber: "#NONE",
        });
      } else {
        // Draw one winner per completed group
        for (let g = 0; g < completedGroups; g++) {
          const groupStart = g * unitSize;
          const groupMembers = sortedParticipants.slice(
            groupStart,
            groupStart + unitSize
          );
          const winnerIndex = Math.floor(Math.random() * groupMembers.length);
          const w = groupMembers[winnerIndex];

          const ticketPrefix = product.title
            .split(" ")
            .map((c) => c[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          const ticketNum = String(
            Math.floor(Math.random() * 999)
          ).padStart(3, "0");

          winners.push({
            groupNumber: g + 1,
            name: w.name,
            email: w.email,
            phone: w.phone || "",
            uid: w.uid || "",
            ticketNumber: `#${ticketPrefix}-${ticketNum}`,
          });
        }

        // Auto-refund participants in the incomplete last group
        if (remainderCount > 0) {
          const refundGroup = sortedParticipants.slice(
            completedGroups * unitSize
          );
          for (const p of refundGroup) {
            if (p.paymentId) {
              try {
                if (p.paymentMethod === "TOSS") {
                  // Toss refund via paymentKey
                  await refundTossPayment(
                    p.paymentId,
                    `LuckyPick 자동 환불: ${product.title} - 목표 인원 미달`
                  );
                } else {
                  // PayPal refund (default for legacy participants)
                  await refundPayPalCapture(
                    p.paymentId,
                    null,
                    `LuckyPick 자동 환불: ${product.title} - 목표 인원 미달`
                  );
                }
                console.log(
                  `[Scheduler] Refunded ${p.name} (${p.paymentMethod || "PAYPAL"}: ${p.paymentId})`
                );
              } catch (refundErr) {
                console.error(
                  `[Scheduler] Refund failed for ${p.name}:`,
                  refundErr.message
                );
              }
            }
            refundedParticipants.push({
              uid: p.uid,
              name: p.name,
              email: p.email,
              paymentId: p.paymentId || "",
              paymentMethod: p.paymentMethod || "PAYPAL",
              refundedAt: now,
            });
          }
        }
      }

      // Create closed product document with multi-winner structure
      const closedProduct = {
        id: productId,
        title: product.title,
        description: product.description || "",
        category: product.category || "",
        imageUrl: product.imageUrl,
        retailPrice: product.retailPrice,
        entryPrice: product.entryPrice,
        status: "closed",
        unitSize,
        completedGroups,
        totalParticipants: totalCount,
        maxParticipants: unitSize,
        winners,
        // Keep legacy single winner field for backward compat
        winner:
          winners.length > 0 && winners[0].uid
            ? winners[0]
            : { name: "미당첨 (참여자 없음)", email: "-", phone: "-" },
        ticketNumber:
          winners.length > 0 ? winners[0].ticketNumber : "#NONE",
        participants: sortedParticipants,
        refundedParticipants,
        endTime: product.endTime,
        closedAt: now,
      };

      const batch = db.batch();
      const closedRef = db.collection("closed_products").doc(productId);
      batch.set(closedRef, closedProduct);
      batch.delete(productDoc.ref);
      await batch.commit();

      console.log(
        `[Scheduler] Closed: ${product.title} | Groups: ${completedGroups} | Winners: ${winners.length} | Refunded: ${refundedParticipants.length}`
      );
    }

    console.log(
      `[Scheduler] Processed ${productsSnap.size} expired product(s).`
    );
  }
);

// ============================================
// 6. createUserProfile (Callable) - Authenticated Users
//    Ensures user document exists in Firestore on login/signup
// ============================================
exports.createUserProfile = onCall({ region: "asia-northeast3" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }
  const uid = request.auth.uid;
  const email = request.auth.token.email || "";
  const displayName = request.auth.token.name || email.split("@")[0] || "사용자";
  const provider = request.auth.token.firebase?.sign_in_provider || "email";

  const userRef = db.collection("users").doc(uid);
  const docSnap = await userRef.get();
  if (!docSnap.exists) {
    await userRef.set({
      uid,
      displayName,
      email,
      provider,
      isAdmin: email === ADMIN_EMAIL,
      createdAt: Date.now(),
    });
    console.log(`[Auth] Created user profile: ${displayName} (${email})`);
  }
  return { success: true };
});

// ============================================
// PayPal REST API Helpers & Cloud Functions
// ============================================
const PAYPAL_CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID ||
  "AfpgoZ6e_ILYGliBdTpax8I2ikXh0itt9BE1wFFsYUYM4grXZ-Uln529Cetf5nPnl0VBJ45vqOnshtHU";
const PAYPAL_CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET ||
  "ECYUxw80Q6KcqVaA5kw6FIeLL-CYQ7-PlGoHfNEhCZ1kyyh24GpCeGY8felnklmWv3zRz6cBpdI5tI5N";
const PAYPAL_ENV = process.env.PAYPAL_ENV || "sandbox";

function getPayPalBaseUrl() {
  return PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[PayPal] Access token error:", errText);
    throw new HttpsError("internal", "PayPal 인증 토큰 발급에 실패했습니다.");
  }

  const data = await response.json();
  return data.access_token;
}

async function refundPayPalCapture(captureId, amount = null, note = "LuckyPick 환불") {
  const accessToken = await getPayPalAccessToken();
  const body = { note_to_payer: note };
  if (amount) {
    body.amount = {
      currency_code: "USD",
      value: parseFloat(amount).toFixed(2),
    };
  }
  const response = await fetch(
    `${getPayPalBaseUrl()}/v2/payments/captures/${captureId}/refund`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    console.error("[PayPal] Refund error:", errText);
    throw new Error(`PayPal 환불 실패: ${errText}`);
  }
  const refundData = await response.json();
  console.log(`[PayPal] Refund success: ${refundData.id} for capture ${captureId}`);
  return refundData;
}

// ============================================
// 7. createPayPalOrder (Callable) - Authenticated Users
// ============================================
exports.createPayPalOrder = onCall({ region: "asia-northeast3" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  const { amount, orderName, productId } = request.data;
  if (!amount || !productId) {
    throw new HttpsError("invalid-argument", "결제 금액과 상품 ID가 필요합니다.");
  }

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: orderName || "LuckyPick Ticket",
          custom_id: productId,
          amount: {
            currency_code: "USD",
            value: parseFloat(amount).toFixed(2),
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[PayPal] Order creation error:", errText);
    throw new HttpsError("internal", "PayPal 주문 생성에 실패했습니다.");
  }

  const order = await response.json();
  console.log(`[PayPal] Order created: ${order.id}`);
  return { success: true, orderId: order.id };
});

// ============================================
// 8. capturePayPalOrder (Callable) - Authenticated Users
// ============================================
exports.capturePayPalOrder = onCall({ region: "asia-northeast3" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  const { orderId, productId } = request.data;
  if (!orderId || !productId) {
    throw new HttpsError("invalid-argument", "주문 ID와 상품 ID가 필요합니다.");
  }

  const uid = request.auth.uid;
  const userName = request.auth.token.name || request.auth.token.email?.split("@")[0] || "사용자";
  const userEmail = request.auth.token.email || "user@luckypick.com";

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(
    `${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("[PayPal] Capture error:", errText);
    throw new HttpsError("internal", "PayPal 결제 캡처 승인에 실패했습니다.");
  }

  const captureData = await response.json();
  if (captureData.status !== "COMPLETED") {
    throw new HttpsError(
      "failed-precondition",
      `결제가 완료되지 않았습니다. (상태: ${captureData.status})`
    );
  }

  // Record participation in Firestore via transaction
  const productRef = db.collection("products").doc(productId);
  const result = await db.runTransaction(async (transaction) => {
    const productDoc = await transaction.get(productRef);
    if (!productDoc.exists) {
      throw new HttpsError("not-found", "상품을 찾을 수 없습니다.");
    }
    const product = productDoc.data();

    if (product.status !== "active" || product.endTime <= Date.now()) {
      throw new HttpsError("failed-precondition", "마감된 상품입니다.");
    }

    // No maxParticipants cap - allow multi-slot expansion
    const isDuplicate = (product.participants || []).some((p) => p.uid === uid);
    if (isDuplicate) {
      throw new HttpsError("already-exists", "이미 참여한 상품입니다.");
    }

    // Extract capture ID from PayPal capture response
    const captureId =
      captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
      captureData.id;

    const newParticipant = {
      uid,
      name: maskName(userName),
      email: maskEmail(userEmail),
      phone: "",
      initial: userName ? userName.charAt(0).toUpperCase() : "U",
      paymentId: captureId,
      joinedAt: Date.now(),
    };

    transaction.update(productRef, {
      currentParticipants: product.currentParticipants + 1,
      participants: [...(product.participants || []), newParticipant],
    });

    return {
      currentParticipants: product.currentParticipants + 1,
      maxParticipants: product.maxParticipants,
    };
  });

  console.log(
    `[PayPal] Capture & Participation success for user ${uid}, order ${orderId}`
  );
  return {
    success: true,
    paymentId: captureData.id,
    orderId,
    status: captureData.status,
    ...result,
  };
});

// ============================================
// 9. cancelUserParticipation (Callable) - Authenticated Users
//    Allows a user to cancel their participation and receive a PayPal refund
// ============================================
exports.cancelUserParticipation = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const { productId } = request.data;
    if (!productId) {
      throw new HttpsError("invalid-argument", "상품 ID가 필요합니다.");
    }

    const uid = request.auth.uid;
    const productRef = db.collection("products").doc(productId);

    const result = await db.runTransaction(async (transaction) => {
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists) {
        throw new HttpsError("not-found", "상품을 찾을 수 없습니다.");
      }
      const product = productDoc.data();

      if (product.status !== "active" || product.endTime <= Date.now()) {
        throw new HttpsError(
          "failed-precondition",
          "마감된 상품은 취소할 수 없습니다."
        );
      }

      const participantIndex = (product.participants || []).findIndex(
        (p) => p.uid === uid
      );
      if (participantIndex === -1) {
        throw new HttpsError("not-found", "참여 내역이 없습니다.");
      }

      const participant = product.participants[participantIndex];
      const paymentId = participant.paymentId;
      const paymentMethod = participant.paymentMethod || "PAYPAL";

      // Remove participant from array
      const updatedParticipants = [...product.participants];
      updatedParticipants.splice(participantIndex, 1);

      transaction.update(productRef, {
        currentParticipants: Math.max(
          (product.currentParticipants || 1) - 1,
          0
        ),
        participants: updatedParticipants,
      });

      return { paymentId, paymentMethod, participantName: participant.name };
    });

    // Process refund outside the transaction (branch by payment method)
    if (result.paymentId) {
      try {
        if (result.paymentMethod === "TOSS") {
          await refundTossPayment(
            result.paymentId,
            "LuckyPick 참여 취소 환불"
          );
        } else {
          await refundPayPalCapture(
            result.paymentId,
            null,
            "LuckyPick 참여 취소 환불"
          );
        }
        console.log(
          `[Cancel] Refunded user ${uid}, ${result.paymentMethod}: ${result.paymentId}`
        );
      } catch (refundErr) {
        console.error(`[Cancel] Refund failed for user ${uid}:`, refundErr);
        // Participation is already removed; log the refund failure
      }
    }

    return { success: true, refunded: !!result.paymentId };
  }
);

// ============================================
// Toss Payments REST API Helpers
// ============================================
async function refundTossPayment(paymentKey, cancelReason = "LuckyPick 환불") {
  const encryptedKey = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");

  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${encryptedKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancelReason }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("[Toss] Cancel/Refund error:", errText);
    throw new Error(`토스 환불 실패: ${errText}`);
  }

  const data = await response.json();
  console.log(`[Toss] Refund success: ${data.paymentKey}`);
  return data;
}

// ============================================
// 10. confirmTossPayment (Callable) - Authenticated Users
//     Confirms Toss payment server-side and records participation
// ============================================
exports.confirmTossPayment = onCall(
  {
    region: "asia-northeast3",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const { paymentKey, orderId, amount, productId } = request.data;
    if (!paymentKey || !orderId || !amount || !productId) {
      throw new HttpsError(
        "invalid-argument",
        "paymentKey, orderId, amount, productId가 모두 필요합니다."
      );
    }

    const uid = request.auth.uid;
    const userName =
      request.auth.token.name ||
      request.auth.token.email?.split("@")[0] ||
      "사용자";
    const userEmail = request.auth.token.email || "user@luckypick.com";

    // 1. Toss Payments Confirm API
    const encryptedKey = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");

    const confirmResponse = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encryptedKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      }
    );

    if (!confirmResponse.ok) {
      const errText = await confirmResponse.text();
      console.error("[Toss] Confirm error:", errText);
      throw new HttpsError(
        "internal",
        `토스 결제 승인 실패: ${errText}`
      );
    }

    const paymentData = await confirmResponse.json();
    console.log(`[Toss] Payment confirmed: ${paymentData.paymentKey}, status: ${paymentData.status}`);

    if (paymentData.status !== "DONE") {
      throw new HttpsError(
        "failed-precondition",
        `결제가 완료되지 않았습니다. (상태: ${paymentData.status})`
      );
    }

    // 2. Record participation in Firestore via transaction
    const productRef = db.collection("products").doc(productId);
    const result = await db.runTransaction(async (transaction) => {
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists) {
        throw new HttpsError("not-found", "상품을 찾을 수 없습니다.");
      }
      const product = productDoc.data();

      if (product.status !== "active" || product.endTime <= Date.now()) {
        throw new HttpsError("failed-precondition", "마감된 상품입니다.");
      }

      const isDuplicate = (product.participants || []).some(
        (p) => p.uid === uid
      );
      if (isDuplicate) {
        throw new HttpsError("already-exists", "이미 참여한 상품입니다.");
      }

      const newParticipant = {
        uid,
        name: maskName(userName),
        email: maskEmail(userEmail),
        phone: "",
        initial: userName ? userName.charAt(0).toUpperCase() : "U",
        paymentId: paymentKey,
        paymentMethod: "TOSS",
        tossOrderId: orderId,
        joinedAt: Date.now(),
      };

      transaction.update(productRef, {
        currentParticipants: product.currentParticipants + 1,
        participants: [...(product.participants || []), newParticipant],
      });

      return {
        currentParticipants: product.currentParticipants + 1,
        maxParticipants: product.maxParticipants,
      };
    });

    console.log(
      `[Toss] Confirm & Participation success for user ${uid}, paymentKey ${paymentKey}`
    );
    return {
      success: true,
      paymentKey,
      orderId,
      status: paymentData.status,
      ...result,
    };
  }
);
