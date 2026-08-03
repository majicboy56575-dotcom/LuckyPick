// ============================================
// LuckyPick - Mock Firestore Service
// ============================================
// Returns mock data with localStorage persistence for real-time state updates

import { getCurrentAuthUser } from './auth.js';

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

const STORAGE_KEY_PRODUCTS = 'luckypick_active_products_v4';

// --- Privacy Masking Helpers ---
function maskName(name) {
  if (!name) return '사용자';
  name = name.trim();
  // Korean name (e.g., 홍길동 -> 홍X동, 박윤우 -> 박XX)
  if (/^[가-힣]+$/.test(name)) {
    if (name.length === 2) return name[0] + 'X';
    if (name.length >= 3) return name[0] + 'X'.repeat(name.length - 2) + name[name.length - 1];
  }
  // English name (e.g., "John Doe" -> "J***n D.")
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

// --- Mock Active Products with Persistence & Auto Masking ---
function loadActiveProducts() {
  const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
  if (saved) {
    try {
      const products = JSON.parse(saved);
      // Auto-sanitize and mask any existing unmasked participants in local storage
      products.forEach(p => {
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
      });
      return products;
    } catch (e) {
      console.error('Failed to parse saved products:', e);
    }
  }
  const now = Date.now();
  const initial = [
    {
      id: 'prod_chanel_001',
      title: '샤넬 립스틱',
      description: '샤넬 루쥬 코코 립스틱 세트',
      category: 'BEAUTY LUXE',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDInImRq6nHkc5sQlW8mTRqlVCDlvHkXGQ5Q2SMhcMfsfL3EbPadFp5hMs_43gK7EuuknOLhxoGyQ54x3QQn6-TMJ1yczkGdlg8F78qUmV74V5NBNG3swH45-CO1KMNpZHM1L4YW5ONFlk955abW7Hr36dojBQgBayXYl8kUovUK0gM6BrRAt6zsSn1pFTmBZl7s5ympvKZxStQmkpljld4JJs7LlmPcLO6WDHpdcE5hjy-oa0lzWcZdOgIY8kp2aOrQM7EzR7VHxw',
      retailPrice: 10,
      entryPrice: 1,
      maxParticipants: 12,
      currentParticipants: 2,
      endTime: now + (55 * 60 + 30) * 1000,
      status: 'active',
      participants: getMockParticipants(2),
    },
    {
      id: 'prod_001',
      title: 'iPhone 15 Pro',
      description: 'Natural Titanium, 256GB',
      category: 'TECH ELITE',
      imageUrl: DEMO_IMAGES.iphone,
      retailPrice: 999,
      entryPrice: 50,
      maxParticipants: 20,
      currentParticipants: 15,
      endTime: now + (62 * 3600 + 59 * 60 + 3) * 1000,
      status: 'active',
      participants: getMockParticipants(15),
    },
    {
      id: 'prod_002',
      title: 'MacBook Pro M3',
      description: '14-inch, Space Black',
      category: 'PRODUCTIVITY',
      imageUrl: DEMO_IMAGES.macbook,
      retailPrice: 1599,
      entryPrice: 80,
      maxParticipants: 20,
      currentParticipants: 12,
      endTime: now + (4 * 60 + 52) * 1000,
      status: 'active',
      participants: getMockParticipants(12),
    },
  ];
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(initial));
  return initial;
}

function saveActiveProducts(products) {
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
}

function getActiveProducts() {
  return loadActiveProducts();
}

function addProduct({ title, description, imageUrl, retailPrice, entryPrice, maxParticipants, timerHours }) {
  const products = loadActiveProducts();
  const id = 'prod_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  const now = Date.now();

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
    endTime: now + (parseFloat(timerHours) || 24) * 3600 * 1000,
    status: 'active',
    participants: [],
  };

  products.unshift(newProduct);
  saveActiveProducts(products);
  console.log(`[Firestore] New product registered: ${title} (${id})`);
  return newProduct;
}

function addParticipation({ productId, paymentId, payer }) {
  const products = loadActiveProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return null;

  // Use logged-in user info (not PayPal payer info)
  const authUser = getCurrentAuthUser();
  const userName = authUser?.displayName || '사용자';
  const userEmail = authUser?.email || 'user@luckypick.com';

  // Apply privacy masking
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
    console.log(`[Firestore] Added participant (${maskedName}) to ${productId}. New count: ${product.currentParticipants}`);
  }

  return product;
}

// --- Closed Products with Persistence ---
const STORAGE_KEY_CLOSED = 'luckypick_closed_products';

function loadClosedProducts() {
  const saved = localStorage.getItem(STORAGE_KEY_CLOSED);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse closed products:', e);
    }
  }
  // Default seed data
  const initial = [
    {
      id: 'prod_closed_001',
      title: 'Precision Chronograph Series X',
      imageUrl: DEMO_IMAGES.watch,
      retailPrice: 4200,
      entryPrice: 50,
      status: 'shipped',
      ticketNumber: '#DP-992',
      totalParticipants: 1248,
      winner: { name: '박XX', email: 'majXXXX@gmail.com', phone: '010-4XX4-XXX7' },
      participants: getMockParticipants(20),
    },
    {
      id: 'prod_closed_002',
      title: 'EliteBook Pro 14" Titanium',
      imageUrl: DEMO_IMAGES.laptop,
      retailPrice: 2800,
      entryPrice: 80,
      status: 'closed',
      ticketNumber: '#LP-041',
      totalParticipants: 856,
      winner: { name: '김XX', email: 'dmsXXXX@naver.com', phone: '010-8XX2-XXX1' },
      participants: getMockParticipants(20),
    },
    {
      id: 'prod_closed_003',
      title: 'SonicFlow Studio Wireless',
      imageUrl: DEMO_IMAGES.headphones,
      retailPrice: 350,
      entryPrice: 10,
      status: 'shipped',
      ticketNumber: '#AU-219',
      totalParticipants: 2014,
      winner: { name: 'Lee XX', email: 'chXXXX@gmail.com', phone: '010-3XX9-XXX4' },
      participants: getMockParticipants(20),
    },
  ];
  localStorage.setItem(STORAGE_KEY_CLOSED, JSON.stringify(initial));
  return initial;
}

function saveClosedProducts(products) {
  localStorage.setItem(STORAGE_KEY_CLOSED, JSON.stringify(products));
}

function getClosedProducts() {
  return loadClosedProducts();
}

// --- Draw: Close expired product, pick random winner, move to history ---
function closeExpiredProduct(productId) {
  const activeProducts = loadActiveProducts();
  const productIndex = activeProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) return null;

  const product = activeProducts[productIndex];

  // Only close if actually expired
  if (product.endTime > Date.now()) return null;

  // Must have at least 1 participant to draw
  if (!product.participants || product.participants.length === 0) {
    console.log(`[Draw] No participants for ${product.title}. Removing without winner.`);
    activeProducts.splice(productIndex, 1);
    saveActiveProducts(activeProducts);
    return null;
  }

  // Pick random winner
  const winnerIndex = Math.floor(Math.random() * product.participants.length);
  const winner = product.participants[winnerIndex];

  // Generate ticket number
  const ticketPrefix = product.title.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const ticketNum = String(Math.floor(Math.random() * 999)).padStart(3, '0');
  const ticketNumber = `#${ticketPrefix}-${ticketNum}`;

  // Build closed product record
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

  // Remove from active
  activeProducts.splice(productIndex, 1);
  saveActiveProducts(activeProducts);

  // Add to closed (prepend)
  const closedProducts = loadClosedProducts();
  closedProducts.unshift(closedProduct);
  saveClosedProducts(closedProducts);

  console.log(`[Draw] 🎉 Winner for "${product.title}": ${winner.name} (${winner.email}) | Ticket: ${ticketNumber}`);

  // Dispatch global event so UI can react
  window.dispatchEvent(new CustomEvent('productDrawCompleted', {
    detail: {
      product: closedProduct,
      winner,
    }
  }));

  return closedProduct;
}


// --- Shipping Info Persistence & Management ---
const STORAGE_KEY_SHIPPING = 'luckypick_shipping_infos';

function loadShippingInfos() {
  const saved = localStorage.getItem(STORAGE_KEY_SHIPPING);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse shipping infos:', e);
    }
  }
  const initial = [
    {
      id: 'ship_001',
      productId: 'prod_closed_001',
      productTitle: 'Precision Chronograph Series X',
      imageUrl: DEMO_IMAGES.chronograph,
      winnerName: '박윤우',
      winnerEmail: 'majXXXX@gmail.com',
      recipientName: '박윤우',
      recipientPhone: '010-1234-5678',
      shippingAddress: '서울특별시 강남구 테헤란로 123 럭키타워 4층',
      zipCode: '06234',
      status: 'pending',
      submittedAt: Date.now() - 3600 * 1000,
    }
  ];
  localStorage.setItem(STORAGE_KEY_SHIPPING, JSON.stringify(initial));
  return initial;
}

function saveShippingInfos(list) {
  localStorage.setItem(STORAGE_KEY_SHIPPING, JSON.stringify(list));
}

function submitShippingInfo({ productId, productTitle, imageUrl, recipientName, recipientPhone, shippingAddress, zipCode }) {
  const authUser = getCurrentAuthUser();
  const list = loadShippingInfos();

  const newInfo = {
    id: 'ship_' + Date.now(),
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
  console.log(`[Firestore] Shipping info submitted for ${productTitle} by ${newInfo.winnerName}`);
  return newInfo;
}

function getAllShippingInfos() {
  return loadShippingInfos();
}

function updateShippingStatus(shippingId, newStatus) {
  const list = loadShippingInfos();
  const item = list.find(s => s.id === shippingId);
  if (item) {
    item.status = newStatus;
    saveShippingInfos(list);
  }
  return list;
}

// --- Mock User Data ---
function getCurrentUser() {
  const authUser = getCurrentAuthUser();
  if (!authUser) return null;

  const allShipping = loadShippingInfos();
  const userShipping = allShipping.filter(s => s.winnerEmail === authUser.email || authUser.email === 'majXXXX@gmail.com');

  return {
    uid: authUser.uid,
    name: authUser.displayName || '사용자',
    email: authUser.email || 'user@luckypick.com',
    provider: authUser.provider || 'google',
    isAdmin: authUser.isAdmin === true,
    wonProducts: [
      {
        id: 'prod_closed_001',
        title: 'Precision Chronograph Series X',
        imageUrl: DEMO_IMAGES.chronograph,
        drawDate: '2026.08.03',
        shippingSubmitted: userShipping.some(s => s.productId === 'prod_closed_001'),
      }
    ],
    participatedProducts: [
      {
        id: 'prod_001',
        title: 'iPhone 15 Pro',
        imageUrl: DEMO_IMAGES.iphone,
        status: 'active',
        participatedAt: Date.now() - 2 * 3600 * 1000,
      },
      {
        id: 'prod_closed_002',
        title: 'EliteBook Pro 14" Titanium',
        imageUrl: DEMO_IMAGES.laptop,
        status: 'not_won',
        resultMessage: 'EliteBook Pro 14" Titanium 상품 추첨 결과, 당첨되지 않았습니다.',
        participatedAt: Date.now() - 24 * 3600 * 1000,
      }
    ],
  };
}

// --- Mock Participants ---
function getMockParticipants(count) {
  const names = [
    { name: '박XX', email: 'majXXXX@gmail.com', phone: '010-4XX4-XXX7', initial: 'P' },
    { name: '정XX', email: 'yuhXXX@naver.com', phone: '010-4XX0-XXX4', initial: 'J' },
    { name: '김XX', email: 'dmsXXXX@naver.com', phone: '010-8XX2-XXX1', initial: 'K' },
    { name: 'Lee XX', email: 'chXXXX@gmail.com', phone: '010-3XX9-XXX4', initial: 'L' },
    { name: '이XX', email: 'leeXXX@gmail.com', phone: '010-2XX1-XXX8', initial: 'L' },
    { name: '최XX', email: 'choXXX@naver.com', phone: '010-5XX3-XXX9', initial: 'C' },
    { name: '강XX', email: 'kanXXX@gmail.com', phone: '010-7XX6-XXX2', initial: 'K' },
    { name: '윤XX', email: 'yunXXX@daum.net', phone: '010-1XX8-XXX5', initial: 'Y' },
    { name: '한XX', email: 'hanXXX@gmail.com', phone: '010-9XX7-XXX3', initial: 'H' },
    { name: '서XX', email: 'seoXXX@naver.com', phone: '010-6XX5-XXX1', initial: 'S' },
    { name: 'J***n L.', email: '0x4...3e2', phone: '', initial: 'J' },
    { name: 'K***m S.', email: '0x1...7a5', phone: '', initial: 'K' },
    { name: 'M***a P.', email: '0x9...4f1', phone: '', initial: 'M' },
    { name: 'A***n K.', email: '0x2...d8c', phone: '', initial: 'A' },
    { name: 'T***o H.', email: '0x6...1b9', phone: '', initial: 'T' },
    { name: 'S***y W.', email: '0x3...5e7', phone: '', initial: 'S' },
    { name: 'W***t P.', email: '0xA...2c4', phone: '', initial: 'W' },
    { name: 'R***l D.', email: '0x7...9f6', phone: '', initial: 'R' },
    { name: 'N***k M.', email: '0x5...8b3', phone: '', initial: 'N' },
    { name: 'P***r G.', email: '0x8...1a7', phone: '', initial: 'P' },
  ];
  return names.slice(0, Math.min(count, names.length));
}

// --- Mock Admin Stats ---
function getAdminStats() {
  return {
    totalRevenue: 142500,
    activeDraws: 24,
    activeCount: 8,
    totalMembers: 1284,
    newSignups: 24,
  };
}

// --- Mock Members list ---
function getMembers() {
  return [
    { id: 'u1', name: 'J***n L.', initials: 'JL', joinDate: '2023.10.24', tickets: 42, status: 'verified', colors: 'from-primary to-surface-variant' },
    { id: 'u2', name: '0x4...3e2', initials: '0X', joinDate: '2023.10.25', tickets: 118, status: 'verified', colors: 'from-secondary to-secondary-container' },
    { id: 'u3', name: 'S***m K.', initials: 'SK', joinDate: '2023.10.25', tickets: 3, status: 'restricted', colors: 'from-outline to-outline-variant' },
    { id: 'u4', name: 'W***t P.', initials: 'WP', joinDate: '2023.10.26', tickets: 12, status: 'verified', colors: 'from-primary-container to-surface-container-high' },
  ];
}

// --- Mock Admin Inventory ---
function getAdminInventory() {
  return [
    { title: 'Premium Chronograph', price: 4200, timeLeft: '15h 22m left', fill: 80, image: DEMO_IMAGES.chronograph, badge: 'primary', badgeText: '80% FULL' },
    { title: 'Ultra-Slim Laptop M3', price: 2800, timeLeft: '04m 12s left', fill: 95, image: DEMO_IMAGES.macbook, badge: 'secondary', badgeText: 'Closing Soon', urgent: true },
    { title: 'Leather Travel Set', price: 1200, timeLeft: '2d 04h left', fill: 35, image: DEMO_IMAGES.bag, badge: 'tertiary', badgeText: 'Active' },
    { title: 'Smart E-Scooter X', price: 950, timeLeft: 'Not Started', fill: 0, image: DEMO_IMAGES.scooter, badge: 'outline', badgeText: 'Draft' },
  ];
}

export {
  getActiveProducts, getClosedProducts, getCurrentUser,
  addProduct, addParticipation, closeExpiredProduct, getMockParticipants, getAdminStats, getMembers, getAdminInventory,
  submitShippingInfo, getAllShippingInfos, updateShippingStatus,
  maskName, maskEmail,
  DEMO_IMAGES
};

