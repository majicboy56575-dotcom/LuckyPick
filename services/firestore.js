// ============================================
// LuckyPick - Firestore Service (View-Only)
// Frontend reads data via onSnapshot (real-time)
// All writes go through Cloud Functions (httpsCallable)
// ============================================
import { getCurrentAuthUser } from './auth.js';
import { firebaseConfig, isFirebaseConfigured, isLocalDev } from '../firebase-config.js';
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
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
let currentUserDocCache = null;
let superRafflesCache = [];
let boxCatalogCache = null;

if (isFirebaseConfigured()) {
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    functions = getFunctions(app, 'asia-northeast3');

    // Log active environment
    if (isLocalDev()) {
      console.log('[Firestore] Connected to DEV PROJECT (lucky-pick-dev)');
    } else {
      console.log('[Firestore] Connected to PRODUCTION (luckypick-ec4cf)');
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
    // Real-time Listener: Super Raffles
    // ==========================================
    onSnapshot(
      collection(db, 'super_raffles'),
      (snapshot) => {
        const raffles = [];
        snapshot.forEach((doc) => raffles.push({ id: doc.id, ...doc.data() }));
        if (raffles.length > 0) {
          superRafflesCache = raffles;
          window.dispatchEvent(new CustomEvent('superRafflesChanged', { detail: raffles }));
          window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
        }
      },
      (error) => {
        console.warn('[Firestore] super_raffles listener error:', error.message);
      }
    );

    // ==========================================
    // Real-time Listener: Box Catalog Tiers
    // ==========================================
    onSnapshot(
      doc(db, 'box_catalogs', 'default'),
      (snap) => {
        if (snap.exists() && snap.data()?.tiers) {
          boxCatalogCache = snap.data().tiers;
          window.dispatchEvent(new CustomEvent('boxCatalogChanged', { detail: boxCatalogCache }));
          window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
        }
      },
      (error) => {
        // Doc may not exist yet on fresh databases
      }
    );

    // ==========================================
    // Real-time Listener: Shipping Infos & Users
    // ==========================================
    let shippingUnsub = null;
    let usersUnsub = null;
    let userDocUnsub = null;

    const startAuthListeners = () => {
      if (!db) return;
      const user = getCurrentAuthUser();

      // Listen to logged-in user's personal document
      if (user?.uid) {
        if (userDocUnsub) userDocUnsub();
        userDocUnsub = onSnapshot(
          doc(db, 'users', user.uid),
          (snap) => {
            if (snap.exists()) {
              currentUserDocCache = { id: snap.id, ...snap.data() };
              window.dispatchEvent(new CustomEvent('userDataChanged', { detail: currentUserDocCache }));
              window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
            }
          },
          (error) => {
            console.warn('[Firestore] User document listener error:', error.message);
          }
        );
      } else {
        currentUserDocCache = null;
        if (userDocUnsub) { userDocUnsub(); userDocUnsub = null; }
      }

      if (!shippingUnsub) {
        shippingUnsub = onSnapshot(
          collection(db, 'shipping_infos'),
          (snapshot) => {
            const infos = [];
            snapshot.forEach((doc) => infos.push({ id: doc.id, ...doc.data() }));
            infos.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
            shippingCache = infos;
            window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
          },
          (error) => {
            console.warn('[Firestore] Shipping listener warning:', error.message);
          }
        );
      }

      if (!usersUnsub) {
        usersUnsub = onSnapshot(
          collection(db, 'users'),
          (snapshot) => {
            const users = [];
            snapshot.forEach((doc) => users.push({ id: doc.id, ...doc.data() }));
            usersCache = users;
            window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
          },
          (error) => {
            // Non-admin will receive permission denied for whole collection, which is normal
          }
        );
      }
    };

    // If local emulator or already authenticated, start immediately
    if (isLocalDev() || getCurrentAuthUser()) {
      startAuthListeners();
    }

    window.addEventListener('authStateChanged', (e) => {
      startAuthListeners();
    });
  } catch (e) {
    console.warn('[Firestore Cloud Warning]', e);
  }
}

// ============================================
// Server-Side Storage Helpers (Users, Raffles, Catalog)
// ============================================
function getCurrentUserDocCache() {
  return currentUserDocCache;
}

async function saveUserDocData(data) {
  const authUser = getCurrentAuthUser();
  if (!db || !authUser?.uid) return false;
  try {
    const userRef = doc(db, 'users', authUser.uid);
    await setDoc(userRef, data, { merge: true });
    if (currentUserDocCache) {
      Object.assign(currentUserDocCache, data);
    }
    return true;
  } catch (err) {
    console.error('[Firestore] saveUserDocData error:', err);
    return false;
  }
}

function getSuperRafflesCache() {
  return superRafflesCache;
}

async function saveSuperRaffleToFirestore(raffle) {
  if (!db || !raffle?.id) return false;
  try {
    const ref = doc(db, 'super_raffles', raffle.id);
    await setDoc(ref, raffle, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] saveSuperRaffleToFirestore error:', err);
    return false;
  }
}

async function deleteSuperRaffleFromFirestore(raffleId) {
  if (!db || !raffleId) return false;
  try {
    const ref = doc(db, 'super_raffles', raffleId);
    await deleteDoc(ref);
    superRafflesCache = superRafflesCache.filter(r => r.id !== raffleId);
    window.dispatchEvent(new CustomEvent('superRafflesChanged', { detail: superRafflesCache }));
    window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
    return true;
  } catch (err) {
    console.error('[Firestore] deleteSuperRaffleFromFirestore error:', err);
    return false;
  }
}

function getBoxCatalogCache() {
  return boxCatalogCache;
}

async function saveBoxCatalogToFirestore(tiers) {
  if (!db) return false;
  try {
    const ref = doc(db, 'box_catalogs', 'default');
    await setDoc(ref, { tiers, updatedAt: Date.now() }, { merge: true });
    boxCatalogCache = tiers;
    window.dispatchEvent(new CustomEvent('boxCatalogChanged', { detail: boxCatalogCache }));
    window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
    return true;
  } catch (err) {
    console.error('[Firestore] saveBoxCatalogToFirestore error:', err);
    return false;
  }
}

function getAllShippingInfosCache() {
  return shippingCache;
}

async function submitShippingInfoToFirestore(data) {
  if (!db || !data) return false;
  try {
    const shippingId = data.shippingId || ('ship_' + Date.now());
    const ref = doc(db, 'shipping_infos', shippingId);
    const payload = {
      ...data,
      shippingId,
      submittedAt: data.submittedAt || Date.now(),
      status: data.status || 'pending'
    };
    await setDoc(ref, payload, { merge: true });
    return payload;
  } catch (err) {
    console.error('[Firestore] submitShippingInfoToFirestore error:', err);
    return false;
  }
}

async function updateShippingStatusInFirestore(shippingId, status, carrier = '', trackingNumber = '') {
  if (!db || !shippingId) return false;
  try {
    const ref = doc(db, 'shipping_infos', shippingId);
    const updateData = {
      status,
      carrier: carrier || 'CJ대한통운',
      trackingNumber: trackingNumber || '',
      updatedAt: Date.now()
    };
    await updateDoc(ref, updateData);
    return updateData;
  } catch (err) {
    console.error('[Firestore] updateShippingStatusInFirestore error:', err);
    return false;
  }
}

async function deleteShippingInfoFromFirestore(shippingId) {
  if (!db || !shippingId) return false;
  try {
    const ref = doc(db, 'shipping_infos', shippingId);
    await deleteDoc(ref);
    shippingCache = shippingCache.filter(s => s.id !== shippingId && s.shippingId !== shippingId);
    window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
    return true;
  } catch (err) {
    console.error('[Firestore] deleteShippingInfoFromFirestore error:', err);
    return false;
  }
}

async function ensureInitialFirestoreData(defaultBoxes, defaultRaffles) {
  if (!db) return;
  try {
    // 1. Seed Box Catalogs if not present on server
    if (!boxCatalogCache && defaultBoxes && defaultBoxes.length > 0) {
      const catRef = doc(db, 'box_catalogs', 'default');
      await setDoc(catRef, { tiers: defaultBoxes, updatedAt: Date.now() }, { merge: true });
      boxCatalogCache = defaultBoxes;
      console.log('[Firestore] Box catalogs seeded to server');
    }

    // 2. Seed Super Raffles if empty on server
    if ((!superRafflesCache || superRafflesCache.length === 0) && defaultRaffles && defaultRaffles.length > 0) {
      for (const raffle of defaultRaffles) {
        const ref = doc(db, 'super_raffles', raffle.id);
        await setDoc(ref, raffle, { merge: true });
      }
      superRafflesCache = defaultRaffles;
      console.log('[Firestore] Super raffles seeded to server');
    }
  } catch (e) {
    console.warn('[Firestore] Initial seeding note:', e);
  }
}

// ============================================
// READ Functions (from real-time cache)
// ============================================
const DEFAULT_DEMO_PRODUCTS = [
  {
    id: 'prod_001',
    title: 'iPhone 15 Pro Max',
    description: 'Natural Titanium 256GB, Unlocked',
    category: 'TECH',
    imageUrl: DEMO_IMAGES.iphone,
    retailPrice: 1199,
    entryPrice: 1.00,
    maxParticipants: 1000,
    currentParticipants: 842,
    endTime: Date.now() + 3600000 * 24,
    status: 'active',
    participants: [],
  },
  {
    id: 'prod_002',
    title: 'MacBook Pro 16" M3 Max',
    description: 'Space Black, 36GB RAM, 1TB SSD',
    category: 'PREMIUM',
    imageUrl: DEMO_IMAGES.macbook,
    retailPrice: 3499,
    entryPrice: 5.00,
    maxParticipants: 700,
    currentParticipants: 698,
    endTime: Date.now() + 180000,
    status: 'active',
    participants: [],
  },
];

function getActiveProducts() {
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
    name: u.displayName || u.name || '사용자',
    email: u.email || '미등록 이메일',
    initials: (u.displayName || u.name || 'U').charAt(0).toUpperCase(),
    joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-',
    tickets: u.tickets || (u.participatedRaffles ? u.participatedRaffles.length : 0),
    status: u.status || 'verified',
    role: u.role || 'user',
    colors: u.role === 'admin' ? 'from-tertiary to-tertiary-container' : 'from-primary to-primary-container',
  }));
}

function getCurrentUser() {
  const authUser = getCurrentAuthUser();
  if (!authUser) return null;

  const callerEmail = authUser.email || '';

  // Won products from closed_products (supports multi-winner groups)
  const wonProducts = [];
  closedProductsCache.forEach((p) => {
    if (p.winners && Array.isArray(p.winners)) {
      // Multi-winner structure
      p.winners.forEach((w) => {
        if (
          w.uid === authUser.uid ||
          w.email === callerEmail ||
          callerEmail === 'majicboy56575@gmail.com'
        ) {
          wonProducts.push({
            id: p.id,
            title: p.title,
            imageUrl: p.imageUrl,
            drawDate: new Date(p.closedAt || Date.now()).toLocaleDateString(),
            groupNumber: w.groupNumber,
            ticketNumber: w.ticketNumber,
            shippingSubmitted: shippingCache.some(
              (s) => s.productId === p.id && s.winnerUid === authUser.uid
            ),
          });
        }
      });
    } else if (
      p.winner &&
      (p.winner.uid === authUser.uid ||
        p.winner.email === callerEmail ||
        callerEmail === 'majicboy56575@gmail.com')
    ) {
      // Legacy single-winner
      wonProducts.push({
        id: p.id,
        title: p.title,
        imageUrl: p.imageUrl,
        drawDate: new Date(p.closedAt || Date.now()).toLocaleDateString(),
        groupNumber: 1,
        ticketNumber: p.ticketNumber || '',
        shippingSubmitted: shippingCache.some((s) => s.productId === p.id),
      });
    }
  });

  // Active products user participated in (with group/slot info)
  const participatedProducts = [];
  activeProductsCache.forEach((p) => {
    const sorted = [...(p.participants || [])].sort(
      (a, b) => (a.joinedAt || 0) - (b.joinedAt || 0)
    );
    const myIndex = sorted.findIndex((pt) => pt.uid === authUser.uid);
    if (myIndex !== -1) {
      const unitSize = p.maxParticipants || 20;
      const myGroupNumber = Math.floor(myIndex / unitSize) + 1;
      participatedProducts.push({
        id: p.id,
        title: p.title,
        imageUrl: p.imageUrl,
        status: 'active',
        mySequence: myIndex + 1,
        myGroupNumber,
        unitSize,
        totalParticipants: sorted.length,
        participatedAt: sorted[myIndex].joinedAt || Date.now(),
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
async function createUserProfile() {
  if (!functions) return;
  try {
    const callable = httpsCallable(functions, 'createUserProfile');
    await callable();
  } catch (e) {
    console.warn('[Firestore] Failed to sync user profile:', e);
  }
}

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

async function updateShippingStatus(shippingId, newStatus, carrier = '', trackingNumber = '') {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'updateShippingStatus');
  const result = await callable({ shippingId, newStatus, carrier, trackingNumber });
  return result.data;
}

async function deleteProduct(productId) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'deleteProduct');
  const result = await callable({ productId });
  return result.data;
}

async function updateUserStatus(uid, status, role) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'updateUserStatus');
  const result = await callable({ uid, status, role });
  return result.data;
}

async function forceCloseProduct(productId) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'forceCloseProduct');
  const result = await callable({ productId });
  return result.data;
}

async function createPayPalOrder(data) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'createPayPalOrder');
  const result = await callable(data);
  return result.data;
}

async function capturePayPalOrder(data) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'capturePayPalOrder');
  const result = await callable(data);
  return result.data;
}

async function cancelUserParticipation(productId) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'cancelUserParticipation');
  const result = await callable({ productId });
  return result.data;
}

async function confirmTossPayment(data) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'confirmTossPayment');
  const result = await callable(data);
  return result.data;
}

/**
 * Compute group/slot info for a product.
 * @param {object} product - The active product object.
 * @param {string|null} currentUid - Current user UID (optional).
 * @returns {{ unitSize, totalGroups, completedGroups, remainder, groups: Array, myGroupNumber, mySequence }}
 */
function getGroupSlots(product, currentUid = null) {
  const unitSize = product.maxParticipants || 20;
  const sorted = [...(product.participants || [])].sort(
    (a, b) => (a.joinedAt || 0) - (b.joinedAt || 0)
  );
  const total = sorted.length;
  const completedGroups = Math.floor(total / unitSize);
  const remainder = total % unitSize;
  const totalGroups = completedGroups + (remainder > 0 ? 1 : 0);

  let myGroupNumber = 0;
  let mySequence = 0;

  const groups = [];
  for (let g = 0; g < Math.max(totalGroups, 1); g++) {
    const start = g * unitSize;
    const members = sorted.slice(start, start + unitSize);
    const isComplete = members.length >= unitSize;
    const isMine =
      currentUid && members.some((m) => m.uid === currentUid);
    if (isMine) {
      myGroupNumber = g + 1;
      const myIdx = sorted.findIndex((m) => m.uid === currentUid);
      mySequence = myIdx + 1;
    }
    groups.push({
      groupNumber: g + 1,
      count: members.length,
      unitSize,
      isComplete,
      isMine: !!isMine,
      members,
    });
  }

  return {
    unitSize,
    totalGroups,
    completedGroups,
    remainder,
    groups,
    myGroupNumber,
    mySequence,
    totalParticipants: total,
  };
}

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
  createUserProfile,
  addProduct,
  deleteProduct,
  updateUserStatus,
  forceCloseProduct,
  addParticipation,
  getMockParticipants,
  getAdminStats,
  getMembers,
  getAdminInventory,
  submitShippingInfo,
  getAllShippingInfos,
  updateShippingStatus,
  createPayPalOrder,
  capturePayPalOrder,
  cancelUserParticipation,
  confirmTossPayment,
  getGroupSlots,
  maskName,
  maskEmail,
  DEMO_IMAGES,
  getCurrentUserDocCache,
  saveUserDocData,
  getSuperRafflesCache,
  saveSuperRaffleToFirestore,
  deleteSuperRaffleFromFirestore,
  getBoxCatalogCache,
  saveBoxCatalogToFirestore,
  getAllShippingInfosCache,
  submitShippingInfoToFirestore,
  updateShippingStatusInFirestore,
  deleteShippingInfoFromFirestore,
  ensureInitialFirestoreData,
};
