// ============================================
// LuckyPick - Auth Service (Firebase Auth)
// Uses real Firebase Auth only - no local mocks
// ============================================
import { createUserProfile, saveUserDocData } from './firestore.js';
import { firebaseConfig, isFirebaseConfigured, isLocalDev } from '../firebase-config.js';
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  connectAuthEmulator,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const ADMIN_EMAIL = 'majicboy56575@gmail.com';

let firebaseApp = null;
let firebaseAuth = null;
// No mock user: the app must reflect the real Firebase Auth state (logged out by default)
let currentUser = null;

if (isFirebaseConfigured()) {
  try {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);

    // Log active environment
    if (isLocalDev()) {
      console.log('[Firebase Auth] Connected to DEV PROJECT (lucky-pick-dev)');
    } else {
      console.log('[Firebase Auth] Connected to PRODUCTION (luckypick-ec4cf)');
    }

    // Listen for real-time auth state changes
    firebaseOnAuthStateChanged(firebaseAuth, (fbUser) => {
      if (fbUser) {
        currentUser = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || '사용자',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL,
          provider: fbUser.providerData?.[0]?.providerId || 'email',
          isAdmin: fbUser.email === ADMIN_EMAIL,
        };
        createUserProfile();
      } else {
        currentUser = null;
      }
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: currentUser } }));
      window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
    });
  } catch (e) {
    console.error('[Firebase] SDK Initialization error:', e);
  }
}

// --- Email Auth Functions ---
async function signUpWithEmail(email, password, displayName) {
  if (!firebaseAuth) throw new Error('Firebase Auth not initialized');

  const res = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  if (displayName) {
    await updateProfile(res.user, { displayName });
  }

  currentUser = {
    uid: res.user.uid,
    displayName: displayName || email.split('@')[0],
    email: res.user.email,
    photoURL: null,
    provider: 'email',
    isAdmin: res.user.email === ADMIN_EMAIL,
  };
  return currentUser;
}

async function signInWithEmail(email, password) {
  if (!firebaseAuth) throw new Error('Firebase Auth not initialized');

  const res = await signInWithEmailAndPassword(firebaseAuth, email, password);
  currentUser = {
    uid: res.user.uid,
    displayName: res.user.displayName || res.user.email.split('@')[0],
    email: res.user.email,
    photoURL: res.user.photoURL,
    provider: 'email',
    isAdmin: res.user.email === ADMIN_EMAIL,
  };
  return currentUser;
}

async function sendPasswordReset(email) {
  if (!firebaseAuth) throw new Error('Firebase Auth not initialized');
  if (!email || !email.includes('@')) {
    throw new Error('올바른 이메일 주소를 입력해주세요.');
  }
  await sendPasswordResetEmail(firebaseAuth, email);
  return true;
}

// --- Social Auth ---
async function signInWithGoogle() {
  if (!firebaseAuth) throw new Error('Firebase Auth not initialized');

  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(firebaseAuth, provider);
  currentUser = {
    uid: res.user.uid,
    displayName: res.user.displayName || 'Google 사용자',
    email: res.user.email,
    photoURL: res.user.photoURL,
    provider: 'google',
    isAdmin: res.user.email === ADMIN_EMAIL,
  };
  return currentUser;
}

async function signInWithApple() {
  if (!firebaseAuth) throw new Error('Firebase Auth not initialized');

  const provider = new OAuthProvider('apple.com');
  const res = await signInWithPopup(firebaseAuth, provider);
  currentUser = {
    uid: res.user.uid,
    displayName: res.user.displayName || 'Apple 사용자',
    email: res.user.email,
    photoURL: res.user.photoURL,
    provider: 'apple',
    isAdmin: res.user.email === ADMIN_EMAIL,
  };
  return currentUser;
}

async function continueAsGuest() {
  // Guest mode: create anonymous-style local object (no Firebase anonymous auth to avoid cluttering)
  // Note: Guests cannot participate in draws (requires real auth for Cloud Functions calls)
  currentUser = {
    uid: 'guest_' + Date.now(),
    displayName: '게스트 사용자',
    email: 'guest@luckypick.com',
    photoURL: null,
    provider: 'guest',
    isAdmin: false,
  };
  window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: currentUser } }));
  window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
  return currentUser;
}

async function signOut() {
  if (firebaseAuth) {
    try {
      await firebaseSignOut(firebaseAuth);
    } catch (e) {
      console.error('Firebase Sign-out error:', e);
    }
  }
  currentUser = null;
  window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: null } }));
  window.dispatchEvent(new CustomEvent('firestoreDataChanged'));
}

function getCurrentAuthUser() {
  return currentUser;
}

function isLoggedIn() {
  // Guest sessions are not treated as logged-in for purchases / point usage
  return currentUser !== null && currentUser.provider !== 'guest';
}

// In-App Login Required Modal (100% reliable, never suppressed by browser)
function showLoginRequiredModal(message = '해당 서비스는 로그인 후 이용하실 수 있습니다.') {
  const existing = document.getElementById('login-required-modal');
  if (existing) existing.remove();

  const current = (window.location.hash.replace('#', '').split('?')[0]) || 'home';

  const modalHtml = `
    <div class="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" id="login-required-modal" onclick="if(event.target===this)window.__closeLoginRequiredModal()">
      <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
        <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-3xl">lock</span>
        </div>
        
        <h3 class="font-headline-sm text-lg font-bold text-gray-900 mb-2">로그인이 필요합니다</h3>
        <p class="text-xs text-gray-500 mb-6 leading-relaxed whitespace-pre-line">${message}</p>

        <div class="space-y-2">
          <button onclick="window.__goToLoginFromModal('${current}')" class="w-full py-3.5 bg-primary text-white font-bold rounded-2xl text-xs hover:bg-primary-container shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-base">login</span>
            <span>로그인 페이지로 이동</span>
          </button>
          <button onclick="window.__closeLoginRequiredModal()" class="w-full py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer">
            닫기
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.__closeLoginRequiredModal = () => {
  const modal = document.getElementById('login-required-modal');
  if (modal) modal.remove();
};

window.__goToLoginFromModal = (redirectTarget = 'home') => {
  window.__closeLoginRequiredModal();
  window.location.hash = `#profile?redirect=${redirectTarget}`;
};

// Returns true if logged in; otherwise displays the in-app login modal
function requireLogin(message = '해당 서비스는 로그인 후 이용하실 수 있습니다.') {
  if (isLoggedIn()) return true;
  showLoginRequiredModal(message);
  return false;
}

function isAdmin() {
  return currentUser?.isAdmin === true || (currentUser?.email && currentUser.email === ADMIN_EMAIL);
}

function onAuthStateChanged(callback) {
  window.addEventListener('authStateChanged', (e) => {
    callback(e.detail.user);
  });
  callback(currentUser);
}

function waitForAuth(timeoutMs = 4000) {
  return new Promise((resolve) => {
    if (currentUser) {
      resolve(currentUser);
      return;
    }
    const handler = (e) => {
      window.removeEventListener('authStateChanged', handler);
      resolve(e.detail.user);
    };
    window.addEventListener('authStateChanged', handler);
    setTimeout(() => {
      window.removeEventListener('authStateChanged', handler);
      resolve(currentUser);
    }, timeoutMs);
  });
}

export {
  signUpWithEmail,
  signInWithEmail,
  sendPasswordReset,
  signInWithGoogle,
  signInWithApple,
  continueAsGuest,
  signOut,
  getCurrentAuthUser,
  isLoggedIn,
  requireLogin,
  showLoginRequiredModal,
  isAdmin,
  onAuthStateChanged,
  waitForAuth,
};
