// ============================================
// LuckyPick - Auth Service (Firebase Auth)
// Uses real Firebase Auth only - no local mocks
// ============================================
import { createUserProfile } from './firestore.js';
import { firebaseConfig, isFirebaseConfigured, isLocalDev } from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  connectAuthEmulator,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const ADMIN_EMAIL = 'majicboy56575@gmail.com';

let firebaseApp = null;
let firebaseAuth = null;
let currentUser = null;

if (isFirebaseConfigured()) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);

    // Connect to Auth Emulator on localhost
    if (isLocalDev()) {
      connectAuthEmulator(firebaseAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
      console.log('[Firebase Auth] Connected to LOCAL EMULATOR (port 9099)');
    } else {
      console.log('[Firebase Auth] Connected to PRODUCTION');
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
  return currentUser !== null;
}

function isAdmin() {
  return currentUser?.isAdmin === true;
}

function onAuthStateChanged(callback) {
  window.addEventListener('authStateChanged', (e) => {
    callback(e.detail.user);
  });
  callback(currentUser);
}

export {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signInWithApple,
  continueAsGuest,
  signOut,
  getCurrentAuthUser,
  isLoggedIn,
  isAdmin,
  onAuthStateChanged,
};
