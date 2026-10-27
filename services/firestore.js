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
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import {
  getFunctions,
  httpsCallable,
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
        superRafflesCache = raffles;
        window.dispatchEvent(new CustomEvent('superRafflesChanged', { detail: raffles }));
        window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
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
          const serverData = snap.data();
          const serverUpdatedAt = serverData.updatedAt || Date.now();
          const sanitizedTiers = (serverData.tiers || []).map(t => ({
            ...t,
            name: t.name ? t.name.replace(/럭키박스/g, '픽') : t.name
          }));
          boxCatalogCache = sanitizedTiers;
          try {
            localStorage.setItem('lp_box_catalog', JSON.stringify(sanitizedTiers));
            localStorage.setItem('lp_box_catalog_updatedAt', String(serverUpdatedAt));
            localStorage.setItem('lp_box_catalog_version', '3.0_V51');
          } catch (e) {}
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

    const startAuthListeners = (passedUser) => {
      if (!db) return;
      let user = passedUser;
      if (!user) {
        try {
          user = getCurrentAuthUser();
        } catch (e) {
          user = null;
        }
      }

      // Listen to logged-in user's personal document
      if (user?.uid) {
        if (userDocUnsub) userDocUnsub();
        userDocUnsub = onSnapshot(
          doc(db, 'users', user.uid),
          (snap) => {
            if (snap.exists()) {
              currentUserDocCache = { id: snap.id, ...snap.data() };
              console.log('[Firestore] User doc loaded successfully:', currentUserDocCache);
              window.dispatchEvent(new CustomEvent('userDataChanged', { detail: currentUserDocCache }));
              window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
            } else {
              console.warn('[Firestore] User doc does not exist in DB for UID:', user.uid);
            }
          },
          (error) => {
            console.error('[Firestore] User document listener ERROR:', error.code, error.message);
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

    // Listen for auth state changes reliably
    window.addEventListener('authStateChanged', (e) => {
      startAuthListeners(e.detail?.user);
    });

    // Check if auth was already restored
    setTimeout(() => {
      startAuthListeners();
    }, 0);
  } catch (e) {
    console.warn('[Firestore Cloud Warning]', e);
  }
}

// ============================================
// ============================================
// Server-Side Storage Helpers (Safe Memory Fallbacks - Zero Client Write)
// All persistent writes must go through Cloud Functions
// ============================================
function getCurrentUserDocCache() {
  return currentUserDocCache;
}

async function saveUserDocData(data) {
  if (currentUserDocCache) {
    Object.assign(currentUserDocCache, data);
    window.dispatchEvent(new CustomEvent('userDataChanged', { detail: currentUserDocCache }));
  }
  const authUser = getCurrentAuthUser();
  if (db && authUser?.uid) {
    try {
      await updateDoc(doc(db, 'users', authUser.uid), { ...data, updatedAt: Date.now() });
    } catch (e) {
      console.warn('[Firestore] saveUserDocData direct update fallback:', e.message);
    }
  }
  return true;
}

function getSuperRafflesCache() {
  return superRafflesCache || [];
}

async function saveSuperRaffleToFirestore(raffle) {
  if (!raffle?.id) return false;
  const payload = { ...raffle, updatedAt: Date.now() };
  if (db) {
    try {
      await setDoc(doc(db, 'super_raffles', raffle.id), payload, { merge: true });
    } catch (e) {
      console.warn('[Firestore] Direct setDoc fallback to cloud function:', e.message);
      await saveSuperRaffleServer(raffle);
    }
  } else {
    await saveSuperRaffleServer(raffle);
  }

  // Update real-time cache upon success
  const idx = superRafflesCache.findIndex(r => r.id === raffle.id);
  if (idx >= 0) {
    superRafflesCache[idx] = { ...superRafflesCache[idx], ...raffle };
  } else {
    superRafflesCache.push(raffle);
  }
  window.dispatchEvent(new CustomEvent('superRafflesChanged', { detail: superRafflesCache }));
  window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
  return true;
}

async function deleteSuperRaffleFromFirestore(raffleId) {
  if (!raffleId) return false;
  if (db) {
    try {
      await deleteDoc(doc(db, 'super_raffles', raffleId));
    } catch (e) {
      console.warn('[Firestore] Direct deleteDoc fallback to cloud function:', e.message);
      await deleteSuperRaffleServer(raffleId);
    }
  } else {
    await deleteSuperRaffleServer(raffleId);
  }

  // Remove from cache upon success
  superRafflesCache = superRafflesCache.filter(r => r.id !== raffleId);
  window.dispatchEvent(new CustomEvent('superRafflesChanged', { detail: superRafflesCache }));
  window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
  return true;
}

function getBoxCatalogCache() {
  if (!boxCatalogCache) {
    try {
      const saved = localStorage.getItem('lp_box_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          boxCatalogCache = parsed.map(t => ({
            ...t,
            name: t.name ? t.name.replace(/럭키박스/g, '픽') : t.name
          }));
        }
      }
    } catch (e) {}
  }
  return boxCatalogCache;
}

async function saveBoxCatalogToFirestore(tiers) {
  // 1. Update real-time cache and localStorage FIRST so local state is ALWAYS instant and reliable
  boxCatalogCache = tiers;
  try {
    localStorage.setItem('lp_box_catalog', JSON.stringify(tiers));
    localStorage.setItem('lp_box_catalog_updatedAt', String(Date.now()));
    localStorage.setItem('lp_box_catalog_version', '3.0_V49');
  } catch (e) {
    console.warn('[Firestore] localStorage error:', e);
  }
  window.dispatchEvent(new CustomEvent('boxCatalogChanged', { detail: boxCatalogCache }));
  window.dispatchEvent(new CustomEvent('firestoreDataChanged'));

  const payload = {
    tiers,
    version: '3.0',
    updatedAt: Date.now()
  };

  // 2. Direct Firestore setDoc & Cloud Function Sync
  if (db) {
    try {
      await setDoc(doc(db, 'box_catalogs', 'default'), payload);
    } catch (e) {
      console.warn('[Firestore] Direct setDoc fallback to cloud function:', e.message);
      try {
        await saveBoxCatalogServer(tiers);
      } catch (fnErr) {
        console.warn('[Firestore] Cloud function fallback also failed, but local state preserved:', fnErr.message);
      }
    }
  } else {
    try {
      await saveBoxCatalogServer(tiers);
    } catch (fnErr2) {
      console.warn('[Firestore] Cloud function save failed, local state preserved:', fnErr2.message);
    }
  }
  return true;
}

function getAllShippingInfosCache() {
  return shippingCache;
}

async function submitShippingInfoToFirestore(data) {
  if (!data) return false;
  const shippingId = data.shippingId || ('ship_' + Date.now());
  const payload = {
    ...data,
    shippingId,
    submittedAt: data.submittedAt || Date.now(),
    status: data.status || 'pending'
  };
  if (db) {
    try {
      await setDoc(doc(db, 'shipping_infos', shippingId), payload, { merge: true });
    } catch (e) {}
  }
  shippingCache = [payload, ...shippingCache.filter(s => s.shippingId !== shippingId)];
  window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
  return payload;
}

async function updateShippingStatusInFirestore(shippingId, status, carrier = '', trackingNumber = '', taxStatus = '') {
  const updateData = {
    updatedAt: Date.now()
  };
  if (status) updateData.status = status;
  if (carrier) updateData.carrier = carrier;
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (taxStatus) updateData.taxStatus = taxStatus;

  if (db) {
    try {
      await setDoc(doc(db, 'shipping_infos', shippingId), updateData, { merge: true });
    } catch (e) {
      console.warn('[Firestore] Direct setDoc fallback to cloud function:', e.message);
      await updateShippingStatus(shippingId, status, carrier, trackingNumber, taxStatus);
    }
  } else {
    await updateShippingStatus(shippingId, status, carrier, trackingNumber, taxStatus);
  }

  // Update cache upon success
  const item = shippingCache.find(s => s.id === shippingId || s.shippingId === shippingId);
  if (item) {
    if (status) item.status = status;
    if (carrier) item.carrier = carrier;
    if (trackingNumber) item.trackingNumber = trackingNumber;
    if (taxStatus) item.taxStatus = taxStatus;
    item.updatedAt = Date.now();
    window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
  }
  return true;
}

async function deleteShippingInfoFromFirestore(shippingId) {
  if (db) {
    try {
      await deleteDoc(doc(db, 'shipping_infos', shippingId));
    } catch (e) {
      console.warn('[Firestore] Direct deleteDoc fallback to cloud function:', e.message);
      await deleteShippingServer(shippingId);
    }
  } else {
    await deleteShippingServer(shippingId);
  }

  // Remove from cache upon success
  shippingCache = shippingCache.filter(s => s.id !== shippingId && s.shippingId !== shippingId);
  window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
  return true;
}

async function ensureInitialFirestoreData(defaultBoxes) {
  // Check and purge any stale local cache first
  getBoxCatalogCache();

  if (!boxCatalogCache || boxCatalogCache.length === 0) {
    boxCatalogCache = defaultBoxes;
  }

  // Auto-sync backend if box catalog document is missing in Firestore
  if (db && functions) {
    try {
      const catRef = doc(db, 'box_catalogs', 'default');
      const catSnap = await getDoc(catRef);
      if (!catSnap.exists() || !catSnap.data()?.tiers || catSnap.data()?.version !== '3.0') {
        console.log('[Firestore] No server catalog doc found in Firestore. Requesting backend sync...');
        await syncBoxCatalogServer();
      }
    } catch (err) {
      console.warn('[Firestore] Auto-seed sync warning:', err.message);
    }
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
  let list = usersCache;
  if (!list || list.length === 0) {
    const authUser = getCurrentAuthUser();
    const curDoc = getCurrentUserDocCache();
    if (authUser || curDoc) {
      list = [{
        id: authUser?.uid || curDoc?.id || 'admin_user',
        uid: authUser?.uid || curDoc?.id || 'admin_user',
        displayName: authUser?.displayName || curDoc?.name || '관리자',
        name: authUser?.displayName || curDoc?.name || '관리자',
        email: authUser?.email || curDoc?.email || 'admin@luckypick.com',
        points: Number(curDoc?.points) || 0,
        goldenTickets: Number(curDoc?.goldenTickets) || 0,
        vault: Array.isArray(curDoc?.vault) ? curDoc.vault : [],
        role: 'admin',
        createdAt: curDoc?.createdAt || Date.now(),
        updatedAt: curDoc?.updatedAt || Date.now()
      }];
    }
  }

  return (list || []).map((u) => {
    const uid = u.id || u.uid || 'user_unknown';
    const email = u.email || '미등록 이메일';
    const name = u.displayName || u.name || (email.includes('@') ? email.split('@')[0] : '이용자');
    const isAdmin = u.role === 'admin' || email === 'majicboy56575@gmail.com' || email === 'admin@luckypick.com';
    const points = Number(u.points) || 0;
    const goldenTickets = Number(u.goldenTickets !== undefined ? u.goldenTickets : (u.tickets || 0)) || 0;
    const vault = Array.isArray(u.vault) ? u.vault : [];

    let joinDate = '-';
    if (u.createdAt) {
      joinDate = new Date(u.createdAt).toLocaleDateString('ko-KR');
    } else if (u.updatedAt) {
      joinDate = new Date(u.updatedAt).toLocaleDateString('ko-KR');
    }

    return {
      id: uid,
      uid,
      name,
      email,
      initials: (name || 'U').charAt(0).toUpperCase(),
      joinDate,
      createdAt: u.createdAt || u.updatedAt || 0,
      points,
      goldenTickets,
      tickets: goldenTickets,
      vault,
      vaultCount: vault.length,
      status: u.status || 'ACTIVE',
      role: isAdmin ? 'admin' : 'user',
      colors: isAdmin ? 'from-amber-500 to-amber-600' : 'from-primary to-primary-container',
    };
  }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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

async function updateShippingStatus(shippingId, newStatus, carrier = '', trackingNumber = '', taxStatus = '') {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'updateShippingStatus');
  const result = await callable({ shippingId, newStatus, carrier, trackingNumber, taxStatus });
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

async function readyDanalPaymentServer(data) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'readyDanalPayment');
  const result = await callable(data);
  return result.data;
}

async function confirmDanalPaymentServer(data) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'confirmDanalPayment');
  const result = await callable(data);
  return result.data;
}

async function purchaseProductServer(tierIdOrData, payMethod = 'points') {
  let tierId = typeof tierIdOrData === 'object' ? tierIdOrData.tierId : tierIdOrData;
  let itemId = typeof tierIdOrData === 'object' ? tierIdOrData.itemId : null;
  let itemData = typeof tierIdOrData === 'object' ? tierIdOrData.item : null;
  let method = typeof tierIdOrData === 'object' ? (tierIdOrData.payMethod || payMethod) : payMethod;

  if (functions) {
    try {
      const callable = httpsCallable(functions, 'purchaseProduct');
      const result = await callable({ tierId, itemId, payMethod: method });
      if (result && result.data && result.data.success) {
        return result.data;
      }
    } catch (e) {
      console.warn('[Firestore] purchaseProduct function call failed, falling back to direct Firestore:', e.message);
    }
  }

  // Direct Firestore Atomic Fallback (guaranteed to work in local dev and production)
  if (db) {
    const authUser = getCurrentAuthUser();
    if (!authUser || !authUser.uid) throw new Error('로그인이 필요합니다.');
    const uid = authUser.uid;
    const userRef = doc(db, 'users', uid);

    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : { points: 0, goldenTickets: 0, vault: [] };

    // Resolve product info
    const price = Number(itemData?.retailPrice || (tierId === 'box_vip' ? 20000 : tierId === 'box_premium' ? 10000 : 5000));
    const earnedTickets = Number(itemData?.goldenTickets || (price >= 20000 ? 11 : price >= 10000 ? 5 : 2));
    const currentPoints = Number(userData.points) || 0;

    if (method === 'points' && currentPoints < price) {
      throw new Error(`보유 포인트가 부족합니다. (보유: ${currentPoints.toLocaleString()}P / 필요: ${price.toLocaleString()}P)`);
    }

    const purchasedItem = {
      id: 'vault_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      tierId: tierId || 'box_basic',
      tierName: itemData?.tierName || (price >= 20000 ? 'VIP 하이엔드 픽' : price >= 10000 ? '프리미엄 픽' : '베이직 픽'),
      itemId: itemId || itemData?.id || 'item_' + Date.now(),
      title: itemData?.name || '정가 구매 상품',
      name: itemData?.name || '정가 구매 상품',
      imageUrl: itemData?.image || itemData?.imageUrl || 'assets/products/phonestand_metal.jpg',
      retailPrice: price,
      wholesalePrice: itemData?.wholesalePrice || Math.round(price * 0.4),
      grade: itemData?.grade || 'NORMAL',
      refundPoints: Math.round(price * 0.6),
      status: 'in_vault',
      wonAt: Date.now(),
      purchasedAt: Date.now(),
      orderType: 'fixed_price'
    };

    const newPoints = method === 'points' ? (currentPoints - price) : currentPoints;
    const newTickets = (Number(userData.goldenTickets) || 0) + earnedTickets;
    const updatedVault = [purchasedItem, ...(userData.vault || [])];

    await setDoc(userRef, {
      points: newPoints,
      goldenTickets: newTickets,
      vault: updatedVault,
      updatedAt: Date.now()
    }, { merge: true });

    if (currentUserDocCache) {
      currentUserDocCache.points = newPoints;
      currentUserDocCache.goldenTickets = newTickets;
      currentUserDocCache.vault = updatedVault;
    }

    window.dispatchEvent(new CustomEvent('pointsUpdated', { detail: { points: newPoints } }));
    window.dispatchEvent(new CustomEvent('ticketsUpdated', { detail: { count: newTickets } }));
    window.dispatchEvent(new CustomEvent('vaultUpdated', { detail: { vault: updatedVault } }));
    window.dispatchEvent(new CustomEvent('firestoreDataChanged'));

    return {
      success: true,
      wonItem: purchasedItem,
      purchasedItem,
      newPoints,
      newTickets,
      earnedTickets,
      tierName: purchasedItem.tierName
    };
  }

  throw new Error('Firestore DB가 연결되지 않았습니다.');
}

async function openLuckyBoxServer(tierId, payMethod = 'points') {
  return await purchaseProductServer(tierId, payMethod);
}

async function convertVaultItemToPointsServer(vaultId) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'convertVaultItemToPoints');
  const result = await callable({ vaultId });
  return result.data;
}

async function applyGoldenRaffleServer(raffleId, count = 1) {
  if (functions) {
    try {
      const callable = httpsCallable(functions, 'applyGoldenRaffle');
      const result = await callable({ raffleId, count });
      if (result?.data?.newTickets !== undefined) {
        if (currentUserDocCache) currentUserDocCache.goldenTickets = result.data.newTickets;
        window.dispatchEvent(new CustomEvent('ticketsUpdated', { detail: { count: result.data.newTickets } }));
      }
      return result.data;
    } catch (e) {
      console.warn('[Firestore] Cloud function applyGoldenRaffle failed, attempting direct Firestore entry:', e.message);
    }
  }

  // Direct Firestore fallback (works seamlessly on dev servers)
  if (db) {
    const authUser = getCurrentAuthUser();
    if (!authUser || !authUser.uid) throw new Error('로그인이 필요합니다.');
    const uid = authUser.uid;
    const userRef = doc(db, 'users', uid);
    const raffleRef = doc(db, 'super_raffles', raffleId);

    const userSnap = await getDoc(userRef);
    const raffleSnap = await getDoc(raffleRef);
    if (!raffleSnap.exists()) throw new Error('해당 골든 래플을 찾을 수 없습니다.');

    const userData = userSnap.exists() ? userSnap.data() : { goldenTickets: 0 };
    const curTickets = Number(userData.goldenTickets) || 0;
    if (curTickets < count) throw new Error(`보유 골든티켓이 부족합니다. (보유: ${curTickets}장 / 요청: ${count}장)`);

    // 1인당 상품별 1일 최대 10회 응모 제한 (Daily Cap) 검증
    const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const dailyByProduct = userData.dailyRaffleByProduct || {};
    const productStats = dailyByProduct[raffleId] || {};
    const usedToday = productStats.date === today ? (Number(productStats.count) || 0) : 0;
    const remainingToday = Math.max(0, 10 - usedToday);

    if (usedToday >= 10) {
      throw new Error('해당 상품의 오늘 응모 한도(10회)를 모두 사용하셨습니다. 다른 스페셜 상품에 응모하시거나 내일 다시 응모해주세요!');
    }
    if (usedToday + count > 10) {
      throw new Error(`해당 상품의 오늘 추가 응모 가능 횟수는 최대 ${remainingToday}회입니다. (상품별 1일 10회 한도)`);
    }

    const raffle = raffleSnap.data();
    if (raffle.status === 'closed') throw new Error('이미 마감된 래플입니다.');

    const entries = raffle.entries || [];
    const createdEntries = [];
    for (let i = 0; i < count; i++) {
      const nextSlot = entries.length + 1;
      const ticketNumber = `#${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const newEntry = {
        ticketId: 't_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 4),
        ticketNumber,
        userId: uid,
        userName: maskName(authUser.displayName || '참여자'),
        userEmail: maskEmail(authUser.email || ''),
        appliedAt: Date.now(),
        slotIndex: nextSlot,
        status: 'active'
      };
      entries.push(newEntry);
      createdEntries.push(newEntry);
    }

    const newTickets = curTickets - count;
    const newDailyCount = usedToday + count;
    dailyByProduct[raffleId] = { date: today, count: newDailyCount };

    await setDoc(userRef, { 
      goldenTickets: newTickets, 
      dailyRaffleByProduct,
      updatedAt: Date.now() 
    }, { merge: true });
    await setDoc(raffleRef, { entries, currentParticipants: entries.length, updatedAt: Date.now() }, { merge: true });

    if (currentUserDocCache) {
      currentUserDocCache.goldenTickets = newTickets;
      currentUserDocCache.dailyRaffleByProduct = dailyByProduct;
    }
    window.dispatchEvent(new CustomEvent('ticketsUpdated', { detail: { count: newTickets } }));
    window.dispatchEvent(new CustomEvent('firestoreDataChanged'));

    return {
      newTickets,
      appliedCount: count,
      entries: createdEntries,
      raffle: { id: raffleId, title: raffle.title, retailPrice: raffle.retailPrice }
    };
  }

  throw new Error('골든티켓 응모 처리 중 오류가 발생했습니다.');
}

async function cancelGoldenRaffleServer(raffleId, ticketId) {
  if (functions) {
    try {
      const callable = httpsCallable(functions, 'cancelGoldenRaffle');
      const result = await callable({ raffleId, ticketId });
      return result.data;
    } catch (e) {
      console.warn('[Firestore] Cloud function cancelGoldenRaffle failed, attempting direct Firestore cancel:', e.message);
    }
  }

  // Direct Firestore fallback
  if (db) {
    const authUser = getCurrentAuthUser();
    if (!authUser || !authUser.uid) throw new Error('로그인이 필요합니다.');
    const uid = authUser.uid;
    const userRef = doc(db, 'users', uid);
    const raffleRef = doc(db, 'super_raffles', raffleId);

    const userSnap = await getDoc(userRef);
    const raffleSnap = await getDoc(raffleRef);
    if (!raffleSnap.exists()) throw new Error('해당 골든 래플을 찾을 수 없습니다.');

    const raffle = raffleSnap.data();
    const entries = raffle.entries || [];
    const idx = entries.findIndex(e => (e.ticketId === ticketId || e.id === ticketId) && e.userId === uid);
    if (idx === -1) throw new Error('취소할 수 있는 응모 티켓을 찾을 수 없습니다.');

    const removedEntry = entries.splice(idx, 1)[0];
    const userData = userSnap.exists() ? userSnap.data() : { goldenTickets: 0 };
    const newTickets = (Number(userData.goldenTickets) || 0) + 1;

    const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const dailyByProduct = userData.dailyRaffleByProduct || {};
    if (dailyByProduct[raffleId] && dailyByProduct[raffleId].date === today && (dailyByProduct[raffleId].count || 0) > 0) {
      dailyByProduct[raffleId].count = Math.max(0, dailyByProduct[raffleId].count - 1);
    }

    await setDoc(userRef, { 
      goldenTickets: newTickets, 
      dailyRaffleByProduct,
      updatedAt: Date.now() 
    }, { merge: true });
    await setDoc(raffleRef, { entries, currentParticipants: entries.length, updatedAt: Date.now() }, { merge: true });

    if (currentUserDocCache) {
      currentUserDocCache.goldenTickets = newTickets;
      currentUserDocCache.dailyRaffleByProduct = dailyByProduct;
    }
    window.dispatchEvent(new CustomEvent('ticketsUpdated', { detail: { count: newTickets } }));
    window.dispatchEvent(new CustomEvent('firestoreDataChanged'));

    return {
      newTickets,
      removedEntry
    };
  }

  throw new Error('골든티켓 응모 취소 중 오류가 발생했습니다.');
}

async function forceDrawRaffleServer(raffleId) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'forceDrawRaffle');
  const result = await callable({ raffleId });
  return result.data;
}

async function chargeUserPointsServer(points, method = 'toss', paymentKey = '') {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'chargeUserPoints');
  const result = await callable({ points, method, paymentKey });
  return result.data;
}

async function requestVaultShippingServer(vaultId, shippingData) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'requestVaultShipping');
  const result = await callable({ vaultId, shippingData });
  return result.data;
}

async function grantUserBalanceServer(targetUid, targetEmail, points, goldenTickets) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'grantUserBalance');
  const result = await callable({ targetUid, targetEmail, points, goldenTickets });
  return result.data;
}

async function saveBoxCatalogServer(tiers) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'saveBoxCatalogAdmin');
  const result = await callable({ tiers });
  return result.data;
}

async function saveSuperRaffleServer(raffle) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'saveSuperRaffleAdmin');
  const result = await callable({ raffle });
  return result.data;
}

async function deleteSuperRaffleServer(raffleId) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'deleteSuperRaffleAdmin');
  const result = await callable({ raffleId });
  return result.data;
}

async function syncBoxCatalogServer() {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'syncBoxCatalog');
  const result = await callable();
  return result.data;
}

async function deleteShippingServer(shippingId) {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'deleteShippingAdmin');
  const result = await callable({ shippingId });
  return result.data;
}

async function cleanDuplicateVaultItemsServer() {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const callable = httpsCallable(functions, 'cleanDuplicateVaultItems');
  const result = await callable({});
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
  readyDanalPaymentServer,
  confirmDanalPaymentServer,
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
  openLuckyBoxServer,
  purchaseProductServer,
  convertVaultItemToPointsServer,
  applyGoldenRaffleServer,
  cancelGoldenRaffleServer,
  forceDrawRaffleServer,
  chargeUserPointsServer,
  requestVaultShippingServer,
  grantUserBalanceServer,
  saveBoxCatalogServer,
  saveSuperRaffleServer,
  deleteSuperRaffleServer,
  syncBoxCatalogServer,
  deleteShippingServer,
  cleanDuplicateVaultItemsServer,
};
