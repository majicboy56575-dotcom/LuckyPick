// ============================================
// LuckyPick - Real-time Firebase Cloud Firestore Service
// ============================================
import { getCurrentAuthUser } from './auth.js';
import { firebaseConfig, isFirebaseConfigured } from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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

const STORAGE_KEY_PRODUCTS = 'luckypick_active_products_v9';
const STORAGE_KEY_CLOSED = 'luckypick_closed_products_v9';
const STORAGE_KEY_SHIPPING = 'luckypick_shipping_infos_v9';

let db = null;
let cloudProductsCache = null;
let cloudShippingCache = null;

if (isFirebaseConfigured()) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('[Firestore Cloud] Connected to Firestore project:', firebaseConfig.projectId);

    // Realtime Listener for Active Products
    onSnapshot(collection(db, 'products'), (snapshot) => {
      const cloudProducts = [];
      snapshot.forEach(doc => cloudProducts.push({ id: doc.id, ...doc.data() }));
      cloudProductsCache = cloudProducts;
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(cloudProducts));
      window.dispatchEvent(new CustomEvent('languageChanged'));
    });

    // Realtime Listener for Shipping Infos
    onSnapshot(collection(db, 'shipping_infos'), (snapshot) => {
      const cloudShipping = [];
      snapshot.forEach(doc => cloudShipping.push({ id: doc.id, ...doc.data() }));
      cloudShippingCache = cloudShipping;
      localStorage.setItem(STORAGE_KEY_SHIPPING, JSON.stringify(cloudShipping));
      window.dispatchEvent(new CustomEvent('languageChanged'));
    });
  } catch (e) {
    console.warn('[Firestore Cloud Warning]', e);
  }
}

// --- Privacy Masking Helpers ---
function maskName(name) {
  if (!name) return '사용자';
  name = name.trim();
  if (/^[가-힣]+$/.test(name)) {
    if (name.length === 2) return name[0] + 'X';
    if (name.length >= 3) return name[0] + 'X'.repeat(name.length - 2) + name[name.length - 1];
  }
  const parts = name.split(' ');
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    const maskedFirst = first.length > 2 ? first[0] + '***' + first[first.length - 1] : first[0] + '*';
    const maskedLast = last[0] + '.';
    return `${maskedFirst} ${maskedLast}`;
  } else {
    return name.length > 2 ? name[0] + '***' + name[name.length - 1] : name[0] + '*';
  }
}

function maskEmail(email) {
  if (!email) return 'usr****@example.com';
  const parts = email.split('@');
  if (parts.length < 2) return email;
  const user = parts[0];
  const domain = parts[1];
  
  let maskedUser = '';
  if (user.length <= 3) {
    maskedUser = user[0] + '***';
  } else {
    maskedUser = user.slice(0, 2) + '****' + user.slice(-1);
  }
  return `${maskedUser}@${domain}`;
}

const DEFAULT_DEMO_PRODUCTS = [
  {
    id: 'prod_demo_iphone',
    title: 'iPhone 15 Pro 256GB',
    description: 'Natural Titanium, 256GB',
    category: 'TECH',
    imageUrl: DEMO_IMAGES.iphone,
    retailPrice: 1199,
    entryPrice: 1,
    maxParticipants: 100,
    currentParticipants: 84,
    endTime: Date.now() + 3600000 * 48,
    status: 'active',
    participants: [
      { name: '김*민', email: 'maj****@gmail.com', phone: '010-4XX4-XXX7', initial: 'K' },
      { name: '이*우', email: 'yuh****@naver.com', phone: '010-4XX0-XXX4', initial: 'L' }
    ]
  },
  {
    id: 'prod_demo_macbook',
    title: 'MacBook Pro 16" M3 Max',
    description: 'Space Black, 36GB RAM, 1TB SSD',
    category: 'TECH',
    imageUrl: DEMO_IMAGES.macbook,
    retailPrice: 3499,
    entryPrice: 5,
    maxParticipants: 50,
    currentParticipants: 42,
    endTime: Date.now() + 3600000 * 24,
    status: 'active',
    participants: [
      { name: '박*준', email: 'par****@gmail.com', phone: '010-2XX3-XXX9', initial: 'P' }
    ]
  },
  {
    id: 'prod_demo_watch',
    title: 'Apple Watch Ultra 2',
    description: 'Titanium Case with Trail Loop',
    category: 'LUXURY',
    imageUrl: DEMO_IMAGES.watch,
    retailPrice: 799,
    entryPrice: 1,
    maxParticipants: 200,
    currentParticipants: 195,
    endTime: Date.now() + 3600000 * 12,
    status: 'active',
    participants: [
      { name: '최*서', email: 'cho****@kakao.com', phone: '010-8XX1-XXX2', initial: 'C' }
    ]
  }
];

function loadActiveProducts() {
  if (cloudProductsCache !== null) {
    const now = Date.now();
    return cloudProductsCache.filter(p => p.endTime > now);
  }
  const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
  if (saved !== null) {
    try {
      const products = JSON.parse(saved);
      if (Array.isArray(products)) {
        const now = Date.now();
        const active = [];
        const expired = [];
        products.forEach(p => {
          if (p.endTime && p.endTime <= now) {
            expired.push(p);
          } else {
            if (p.participants && Array.isArray(p.participants)) {
              p.participants.forEach(pt => {
                if (pt.name && !pt.name.includes('*') && !pt.name.includes('X')) {
                  pt.name = maskName(pt.name);
                }
                if (pt.email && !pt.email.includes('****') && !pt.email.includes('XXXX')) {
                  pt.email = maskEmail(pt.email);
                }
              });
            }
            active.push(p);
          }
        });

        if (expired.length > 0) {
          setTimeout(() => {
            expired.forEach(p => closeExpiredProduct(p.id));
          }, 0);
        }

        return active;
      }
    } catch (e) {
      console.error('Failed to parse saved products:', e);
    }
  }
  saveActiveProducts(DEFAULT_DEMO_PRODUCTS);
  return DEFAULT_DEMO_PRODUCTS;
}

function saveActiveProducts(products) {
  cloudProductsCache = products;
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
}

function getActiveProducts() {
  return loadActiveProducts();
}

async function addProduct({ title, description, imageUrl, retailPrice, entryPrice, maxParticipants, timerHours, timerMinutes }) {
  const id = 'prod_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  const now = Date.now();

  const hours = parseFloat(timerHours) || 0;
  const minutes = parseFloat(timerMinutes) || 0;
  let durationMs = (hours * 3600 + minutes * 60) * 1000;
  if (durationMs <= 0) {
    durationMs = 24 * 3600 * 1000; // fallback to 24 hours
  }

  const newProduct = {
    id,
    title,
    description,
    category: 'NEW',
    imageUrl: imageUrl || DEMO_IMAGES.iphone,
    retailPrice: parseFloat(retailPrice) || 0,
    entryPrice: parseFloat(entryPrice) || 1,
    maxParticipants: parseInt(maxParticipants) || 100,
    currentParticipants: 0,
    endTime: now + durationMs,
    timerHours: hours + minutes / 60,
    timerMinutes: minutes,
    status: 'active',
    participants: [],
  };

  if (db) {
    try {
      await setDoc(doc(db, 'products', id), newProduct);
      console.log(`[Firestore Cloud] Product synced to Firestore DB: ${title}`);
    } catch (e) {
      console.warn('[Firestore Cloud Sync Exception]', e);
    }
  }

  const products = loadActiveProducts();
  products.unshift(newProduct);
  saveActiveProducts(products);
  return newProduct;
}

async function addParticipation({ productId, paymentId, payer }) {
  const products = loadActiveProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return null;

  const authUser = getCurrentAuthUser();
  const userName = authUser?.displayName || '사용자';
  const userEmail = authUser?.email || 'user@luckypick.com';

  const maskedName = maskName(userName);
  const maskedEmail = maskEmail(userEmail);

  const newParticipant = {
    name: maskedName,
    email: maskedEmail,
    phone: '',
    initial: userName ? userName.charAt(0).toUpperCase() : 'U'
  };

  if (product.currentParticipants < product.maxParticipants) {
    product.currentParticipants += 1;
    product.participants.unshift(newParticipant);
    saveActiveProducts(products);

    if (db) {
      try {
        await updateDoc(doc(db, 'products', productId), {
          currentParticipants: product.currentParticipants,
          participants: product.participants
        });
      } catch (e) {
        console.warn('[Firestore Cloud Sync Exception]', e);
      }
    }
  }

  return product;
}

// --- Closed Products ---
function loadClosedProducts() {
  const saved = localStorage.getItem(STORAGE_KEY_CLOSED);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse closed products:', e);
    }
  }
  return [];
}

function saveClosedProducts(products) {
  localStorage.setItem(STORAGE_KEY_CLOSED, JSON.stringify(products));
}

function getClosedProducts() {
  return loadClosedProducts();
}

function closeExpiredProduct(productId) {
  const activeProducts = loadActiveProducts();
  const productIndex = activeProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) return null;

  const product = activeProducts[productIndex];
  if (product.endTime > Date.now()) return null;

  if (!product.participants || product.participants.length === 0) {
    const closedProduct = {
      id: product.id,
      title: product.title,
      imageUrl: product.imageUrl,
      retailPrice: product.retailPrice,
      entryPrice: product.entryPrice,
      status: 'closed',
      ticketNumber: '#NONE',
      totalParticipants: 0,
      winner: {
        name: '미당첨 (참여자 없음)',
        email: '-',
        phone: '-',
      },
      participants: [],
      closedAt: Date.now(),
    };
    activeProducts.splice(productIndex, 1);
    saveActiveProducts(activeProducts);

    const closedProducts = loadClosedProducts();
    closedProducts.unshift(closedProduct);
    saveClosedProducts(closedProducts);

    return closedProduct;
  }

  const winnerIndex = Math.floor(Math.random() * product.participants.length);
  const winner = product.participants[winnerIndex];

  const ticketPrefix = product.title.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const ticketNum = String(Math.floor(Math.random() * 999)).padStart(3, '0');
  const ticketNumber = `#${ticketPrefix}-${ticketNum}`;

  const closedProduct = {
    id: product.id,
    title: product.title,
    imageUrl: product.imageUrl,
    retailPrice: product.retailPrice,
    entryPrice: product.entryPrice,
    status: 'closed',
    ticketNumber,
    totalParticipants: product.currentParticipants,
    winner: {
      name: winner.name,
      email: winner.email,
      phone: winner.phone || '',
    },
    participants: product.participants,
    closedAt: Date.now(),
  };

  activeProducts.splice(productIndex, 1);
  saveActiveProducts(activeProducts);

  const closedProducts = loadClosedProducts();
  closedProducts.unshift(closedProduct);
  saveClosedProducts(closedProducts);

  if (db) {
    try {
      updateDoc(doc(db, 'products', productId), { status: 'closed', winner, ticketNumber });
    } catch (e) {
      console.warn(e);
    }
  }

  return closedProduct;
}

// --- Shipping Info Persistence & Cloud Sync ---
function loadShippingInfos() {
  if (cloudShippingCache !== null) {
    return cloudShippingCache;
  }
  const saved = localStorage.getItem(STORAGE_KEY_SHIPPING);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse shipping infos:', e);
    }
  }
  return [];
}

function saveShippingInfos(list) {
  cloudShippingCache = list;
  localStorage.setItem(STORAGE_KEY_SHIPPING, JSON.stringify(list));
}

async function submitShippingInfo({ productId, productTitle, imageUrl, recipientName, recipientPhone, shippingAddress, zipCode }) {
  const authUser = getCurrentAuthUser();
  const list = loadShippingInfos();

  const id = 'ship_' + Date.now();
  const newInfo = {
    id,
    productId: productId || 'prod_closed_001',
    productTitle: productTitle || '당첨 상품',
    imageUrl: imageUrl || DEMO_IMAGES.iphone,
    winnerName: authUser?.displayName || '당첨자',
    winnerEmail: authUser?.email || 'winner@luckypick.com',
    recipientName: recipientName || authUser?.displayName || '수령인',
    recipientPhone: recipientPhone || '010-0000-0000',
    shippingAddress: shippingAddress || '',
    zipCode: zipCode || '',
    status: 'pending',
    submittedAt: Date.now(),
  };

  list.unshift(newInfo);
  saveShippingInfos(list);

  if (db) {
    try {
      await setDoc(doc(db, 'shipping_infos', id), newInfo);
      console.log(`[Firestore Cloud] Shipping info synced for ${productTitle}`);
    } catch (e) {
      console.warn('[Firestore Cloud Sync Exception]', e);
    }
  }

  return newInfo;
}

function getAllShippingInfos() {
  return loadShippingInfos();
}

async function updateShippingStatus(shippingId, newStatus) {
  const list = loadShippingInfos();
  const item = list.find(s => s.id === shippingId);
  if (item) {
    item.status = newStatus;
    saveShippingInfos(list);

    if (db) {
      try {
        await updateDoc(doc(db, 'shipping_infos', shippingId), { status: newStatus });
      } catch (e) {
        console.warn(e);
      }
    }
  }
  return list;
}

// --- User Data ---
function getCurrentUser() {
  const authUser = getCurrentAuthUser();
  if (!authUser) return null;

  const allShipping = loadShippingInfos();
  const userShipping = allShipping.filter(s => s.winnerEmail === authUser.email || authUser.email === 'majicboy56575@gmail.com');
  const closedProducts = loadClosedProducts();
  const activeProducts = loadActiveProducts();

  const wonProducts = closedProducts
    .filter(p => p.winner && (p.winner.email === authUser.email || authUser.email === 'majicboy56575@gmail.com'))
    .map(p => ({
      id: p.id,
      title: p.title,
      imageUrl: p.imageUrl,
      drawDate: new Date(p.closedAt || Date.now()).toLocaleDateString(),
      shippingSubmitted: userShipping.some(s => s.productId === p.id),
    }));

  const participatedProducts = [];
  activeProducts.forEach(p => {
    if (p.participants && p.participants.some(pt => pt.email === authUser.email)) {
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

function getMockParticipants(count) {
  return [];
}

function getAdminStats() {
  const activeProducts = loadActiveProducts();
  const members = getMembers();
  return {
    totalRevenue: activeProducts.reduce((sum, p) => sum + (p.currentParticipants * p.entryPrice), 0),
    activeDraws: activeProducts.length,
    activeCount: activeProducts.length,
    totalMembers: members.length,
    newSignups: 0,
  };
}

function getMembers() {
  return [];
}

function getAdminInventory() {
  const activeProducts = loadActiveProducts();
  return activeProducts.map(p => ({
    title: p.title,
    price: p.retailPrice,
    timeLeft: 'Active',
    fill: Math.round((p.currentParticipants / p.maxParticipants) * 100),
    image: p.imageUrl,
    badge: 'primary',
    badgeText: 'Active'
  }));
}

export {
  getActiveProducts, getClosedProducts, getCurrentUser,
  addProduct, addParticipation, closeExpiredProduct, getMockParticipants, getAdminStats, getMembers, getAdminInventory,
  submitShippingInfo, getAllShippingInfos, updateShippingStatus,
  maskName, maskEmail,
  DEMO_IMAGES
};
