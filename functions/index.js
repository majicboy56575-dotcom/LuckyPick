// ============================================
// LuckyPick - Cloud Functions Backend
// All business logic runs server-side
// ============================================
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp();
const db = getFirestore();

// ============================================
// ADMIN EMAIL (used for admin privilege checks)
// ============================================
const ADMIN_EMAIL = "majicboy56575@gmail.com";

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
  if (callerEmail !== ADMIN_EMAIL) {
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
//    Automatically closes expired products and picks winners
// ============================================
exports.checkExpiredProducts = onSchedule(
  { schedule: "every 1 minutes", region: "asia-northeast3", timeoutSeconds: 120 },
  async () => {
    const now = Date.now();
    const productsSnap = await db
      .collection("products")
      .where("status", "==", "active")
      .where("endTime", "<=", now)
      .get();

    if (productsSnap.empty) {
      console.log("[Scheduler] No expired products found.");
      return;
    }

    const batch = db.batch();

    for (const productDoc of productsSnap.docs) {
      const product = productDoc.data();
      const productId = productDoc.id;

      let winner;
      let ticketNumber;

      if (!product.participants || product.participants.length === 0) {
        // No participants
        winner = {
          name: "미당첨 (참여자 없음)",
          email: "-",
          phone: "-",
        };
        ticketNumber = "#NONE";
      } else {
        // Random winner selection
        const winnerIndex = Math.floor(
          Math.random() * product.participants.length
        );
        const winnerParticipant = product.participants[winnerIndex];
        winner = {
          name: winnerParticipant.name,
          email: winnerParticipant.email,
          phone: winnerParticipant.phone || "",
          uid: winnerParticipant.uid || "",
        };

        const ticketPrefix = product.title
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        const ticketNum = String(Math.floor(Math.random() * 999)).padStart(
          3,
          "0"
        );
        ticketNumber = `#${ticketPrefix}-${ticketNum}`;
      }

      // Create closed product document
      const closedProduct = {
        id: productId,
        title: product.title,
        description: product.description || "",
        category: product.category || "",
        imageUrl: product.imageUrl,
        retailPrice: product.retailPrice,
        entryPrice: product.entryPrice,
        status: "closed",
        ticketNumber,
        totalParticipants: product.currentParticipants || 0,
        maxParticipants: product.maxParticipants || 0,
        winner,
        participants: product.participants || [],
        endTime: product.endTime,
        closedAt: now,
      };

      // Write to closed_products collection
      const closedRef = db.collection("closed_products").doc(productId);
      batch.set(closedRef, closedProduct);

      // Delete from active products collection
      batch.delete(productDoc.ref);

      console.log(
        `[Scheduler] Closed product: ${product.title} | Winner: ${winner.name} | Ticket: ${ticketNumber}`
      );
    }

    await batch.commit();
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
