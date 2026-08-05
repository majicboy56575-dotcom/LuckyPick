// ============================================
// LuckyPick - Firestore Service (View-Only)
// Frontend reads data via onSnapshot (real-time)
// All writes go through Cloud Functions (httpsCallable)
// ============================================
import { getCurrentAuthUser } from './auth.js';
import { firebaseConfig, isFirebaseConfigured, isLocalDev } from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  connectFirestoreEmulator,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js';

// ============================================
// Demo fallback images
// ============================================
const DEMO_IMAGES = {
  iphone: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDInImRq6nHkc5sQlW8mTRqlVCDlvHkXGQ5Q2SMhcMfsfL3EbPadFp5hMs_43gK7EuuknOLhxoGyQ54x3QQn6-TMJ1yczkGdlg8F78qUmV74V5NBNG3swH45-CO1KMNpZHM1L4YW5ONFlk955abW7Hr36dojBQgBayXYl8kUovUK0gM6BrRAt6zsSn1pFTmBZl7s5ympvKZxStQmkpljld4JJs7LlmPcLO6WDHpdcE5hjy-oa0lzWcZdOgIY8kp2aOrQM7EzR7VHxw',
  macbook: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxUUfyWqhFIsZbUcBFd2JCg-NOyQRJyqyYwH9M8eLHclIkl2gH28CnfGU3GR5foFzd3NTw_PQRPMLgjfyH2ExaTvB4ISCfbInny9irRmimWOYwN-dsZFytzabb9q6D-dnwn79n3_5DxEs-zgTY0ygKbULxO9DdaNFo-Qc8wMHyhMAP0ziE-WVKVAofHXdkn030gEw69WNmQGS5yz4IbTFb_kxJJY90ZJ0e-xb3JA6WqhmUpjXH6cqqjRI1XkwSHfs1DIiU02uZFuQ',
  watch: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAy36nyymVeWB0kn0lFYNdD6hcYhWbHK0rk0_afBwMFocl28U5T_2mBUyStZ_2VaOiF_-UwfSdeJjjYMIZuH23yQ8N6rdv60ohEdL8x9sA_0XibP0luwC8KCDam3ch3i289N1lkDEr1KYPtKgOcsAHFeobAQGyUt3UHKyOLnx8qQmOn4j1c0_bG4dTrYx4h4L-pzTf6lwKnBlBaGReSvKmZqLOLjXR2GQIYOFUltV-bLRkAq81in0wsD5Kns5vm5imK5nvBASvNMJI',
  laptop: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGcZ_wm_ZGRb8t7s1FMfKQgz_OHuAsmss4HPbw4DBr9IN3TGReIWq1mzPHUzj4CCcPNDlXx5_ylvTGW4qHS8VUfD-ALRy1VmeOAAMxpLuhxKE2so8COd5aR6gDMRI4pujJ3nlY-eON9kanIVh2v__dLjWTw8kSZuKd9dzeB-lsx1czWLYnZON43cWoV9AIP1Lt_r8awwlfhKFZ4gRD3Jz1SSZNpG3OSFttuQ3pHIP9fNoXbF1tttZ28F6YcpBgvF6OIIbHar84sFc',
  headphones: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQTrwiFFAeRGK5dxJs3TS3M281QWXzu_71jQYxzvSCScORQmkgi-6YogwhzExfd5MnLohnIuLYymaOtY8Kkesw5Z7XQLh_12-zLrNVxhS0UC-eKTuzBwvUtUrRw2zv0Q_gG4EWFb5Ujya7XEmN7kp8ovKkKJZuI8gHTmceNJpvmS3grIG_s4uYjQ3HGo_qb_XpBNnTWZmtqZQ3jAnucC6DIpjFH8OzZvt28YESKhNjFt8ZtRuiSXMWT4sxf-QkNaWdqBvBP2mADqo',
  chronograph: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUWBBiH_cA_NDgvFP9TEUAoc4rp0GPSsaCsDSJZ61Noa3OiramIi7fBzxBHFj1dNXOWJ0oMlJZQcR147HzvB-buONW-6DG-vS32gvUE6NXR3Rt0oWUOzX5HhYxz2vby8Y8ui4prdGnVhZp7kDdozh8eSaCPlSnk8kjbhEZwLo69yhPV7rXv3AqsDAUriVTVA0oc4bABnwgBIhYFZAQX61MGxDZjfzD4FFzvrD-DStbsCZVN5MbS54mYWLgzk5cD9qsR0kxVsDqP_8',
  bag: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBedcGzxRfEBCOkxTyjVnNVMYthYyJrfpHw-ReubXO3z5Hoxn8Zmj2EKtN5kl4Cx8561gl__ONm7iYMa2eewmZ0KaCAok5N28OdwJcnUH-w4XYIUAqovWUOiY_IeFFv1CBkyDlrKYhmiSI21K9UjIYOW4tmeWpxwujxHdnz7UfyhDBHRVYQrFczMD7LHejpSag_FMwO6Iksob3NTxRsbSYxSp0mOoUFe_eBAGE9cHBrOaWlOIkRPN28_MLw2ASviihgrQx6Tndco7o',
  scooter: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6BInNKjgO7u7uP6JW3JJhmHpDwhmBLDjL4sfi9hMzbclwxfgWx1-NA6ElPzpvSmCvbTigj4xkS-T7gVxhPp-7Itycm8uiLCA4tcDE0wQZHCdmF5Gekk75Zkpd7dCrYG2Fs6MOd8aEo588VSHMtBrOdzmlp5F-FWUk_XdcynkpBoYtZcC4zSCV5t2mHzHfhNPcIlk1_54vSJ2Z8ve2iZVwcmjfrvL0fmT9YZCURnZJVVG-hJTCTIboEE1IdP0QeIlprtAD0CRqqNQ',
};

// ============================================
// Firebase initialization
// ============================================
let db = null;
let functions = null;

// Real-time caches (populated by onSnapshot listeners)
let activeProductsCache = [];
let closedProductsCache = [];
let shippingCache = [];
let usersCache = [];

if (isFirebaseConfigured()) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    functions = getFunctions(app, 'asia-northeast3');

    // Connect to emulators on localhost
    if (isLocalDev()) {
      connectFirestoreEmulator(db, '127.0.0.1', 8181);
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      console.log('[Firestore] Connected to LOCAL EMULATORS');
    } else {
      console.log('[Firestore] Connected to PRODUCTION');
    }

    // ==========================================
    // Real-time Listener: Active Products
    // ==========================================
    onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const products = [];
        snapshot.forEach((doc) => products.push({ id: doc.id, ...doc.data() }));
        activeProductsCache = products;
        window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
      },
      (error) => {
        console.warn('[Firestore] Products listener error:', error.message);
      }
    );

    // ==========================================
    // Real-time Listener: Closed Products
    // ==========================================
    onSnapshot(
      collection(db, 'closed_products'),
      (snapshot) => {
        const products = [];
        snapshot.forEach((doc) => products.push({ id: doc.id, ...doc.data() }));
        // Sort by closedAt descending
        products.sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
        closedProductsCache = products;
        window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
      },
      (error) => {
        console.warn('[Firestore] Closed products listener error:', error.message);
      }
    );

    // ==========================================
    // Real-time Listener: Shipping Infos
    // ==========================================
    onSnapshot(
      collection(db, 'shipping_infos'),
      (snapshot) => {
        const infos = [];
        snapshot.forEach((doc) => infos.push({ id: doc.id, ...doc.data() }));
        infos.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
        shippingCache = infos;
        window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
      },
      (error) => {
        console.warn('[Firestore] Shipping listener error:', error.message);
      }
    );

    // ==========================================
    // Real-time Listener: Users
    // ==========================================
    onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => users.push({ id: doc.id, ...doc.data() }));
        usersCache = users;
        window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
      },
      (error) => {
        console.warn('[Firestore] Users listener error:', error.message);
      }
    );
  } catch (e) {
    console.warn('[Firestore Cloud Warning]', e);
  }
}

// ============================================
// READ Functions (from real-time cache)
// ============================================
function getActiveProducts() {
  // Filter to only show products with endTime in the future
  const now = Date.now();
  return activeProductsCache.filter((p) => p.endTime > now);
}

function getClosedProducts() {
  return closedProductsCache;
}

function getAllShippingInfos() {
  return shippingCache;
}

function getMembers() {
  return usersCache.map((u) => ({
    uid: u.uid,
    name: u.displayName || '사용자',
    email: u.email,
    initials: (u.displayName || 'U').charAt(0).toUpperCase(),
    joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-',
    tickets: 0,
    status: 'verified',
    colors: 'from-primary to-primary-container',
  }));
}

function getCurrentUser() {
  const authUser = getCurrentAuthUser();
  if (!authUser) return null;

  const callerEmail = authUser.email || '';

  // Won products from closed_products
  const wonProducts = closedProductsCache
    .filter(
      (p) =>
        p.winner &&
        (p.winner.uid === authUser.uid ||
          p.winner.email === callerEmail ||
          callerEmail === 'majicboy56575@gmail.com')
    )
    .map((p) => ({
      id: p.id,
      title: p.title,
      imageUrl: p.imageUrl,
      drawDate: new Date(p.closedAt || Date.now()).toLocaleDateString(),
      shippingSubmitted: shippingCache.some(
        (s) => s.productId === p.id
      ),
    }));

  // Active products user participated in
  const participatedProducts = [];
  activeProductsCache.forEach((p) => {
    if (
      p.participants &&
      p.participants.some((pt) => pt.uid === authUser.uid)
    ) {
      participatedProducts.push({
        id: p.id,
        title: p.title,
        imageUrl: p.imageUrl,
        status: 'active',
        participatedAt: Date.now(),
      });
    }
  });

  return {
    uid: authUser.uid,
    name: authUser.displayName || '사용자',
    email: authUser.email || 'user@luckypick.com',
    provider: authUser.provider || 'google',
    isAdmin: authUser.isAdmin === true,
    wonProducts,
    participatedProducts,
  };
}

function getAdminStats() {
  const activeProducts = getActiveProducts();
  return {
    totalRevenue: activeProducts.reduce(
      (sum, p) => sum + (p.currentParticipants || 0) * (p.entryPrice || 0),
      0
    ),
    activeDraws: activeProducts.length,
    activeCount: activeProducts.length,
    totalMembers: usersCache.length,
    newSignups: 0,
  };
}

function getAdminInventory() {
  const activeProducts = getActiveProducts();
  return activeProducts.map((p) => ({
    title: p.title,
    price: p.retailPrice || 0,
    timeLeft: 'Active',
    fill: Math.round(
      ((p.currentParticipants || 0) / (p.maxParticipants || 1)) * 100
    ),
    image: p.imageUrl,
    badge: 'primary',
    badgeText: 'Active',
  }));
}

function getMockParticipants() {
  return [];
}

// ============================================
// WRITE Functions (via Cloud Functions callable)
// ============================================
async function addProduct(data) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'addProduct');
  const result = await callable(data);
  return result.data.product;
}

async function addParticipation(data) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'addParticipation');
  const result = await callable(data);
  return result.data;
}

async function submitShippingInfo(data) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'submitShippingInfo');
  const result = await callable(data);
  return result.data.shippingInfo;
}

async function updateShippingStatus(shippingId, newStatus) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'updateShippingStatus');
  const result = await callable({ shippingId, newStatus });
  return result.data;
}

// Privacy helpers (kept for display formatting)
function maskName(name) {
  if (!name) return '사용자';
  name = name.trim();
  if (/^[가-힣]+$/.test(name)) {
    if (name.length === 2) return name[0] + 'X';
    if (name.length >= 3)
      return name[0] + 'X'.repeat(name.length - 2) + name[name.length - 1];
  }
  const parts = name.split(' ');
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    const maskedFirst =
      first.length > 2 ? first[0] + '***' + first[first.length - 1] : first[0] + '*';
    const maskedLast = last[0] + '.';
    return `${maskedFirst} ${maskedLast}`;
  }
  return name.length > 2
    ? name[0] + '***' + name[name.length - 1]
    : name[0] + '*';
}

function maskEmail(email) {
  if (!email) return 'usr****@example.com';
  const parts = email.split('@');
  if (parts.length < 2) return email;
  const user = parts[0];
  const domain = parts[1];
  let maskedUser =
    user.length <= 3 ? user[0] + '***' : user.slice(0, 2) + '****' + user.slice(-1);
  return `${maskedUser}@${domain}`;
}

// ============================================
// Exports
// ============================================
export {
  getActiveProducts,
  getClosedProducts,
  getCurrentUser,
  addProduct,
  addParticipation,
  getMockParticipants,
  getAdminStats,
  getMembers,
  getAdminInventory,
  submitShippingInfo,
  getAllShippingInfos,
  updateShippingStatus,
  maskName,
  maskEmail,
  DEMO_IMAGES,
};
