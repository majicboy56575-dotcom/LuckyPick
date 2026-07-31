// ============================================
// LuckyPick - Auth Service (Stub)
// ============================================
// Mock auth until Firebase is configured

import { isFirebaseConfigured } from '../firebase-config.js';

let currentUser = null;

// --- Mock Auth State ---
function getMockUser() {
  return {
    uid: 'user_mock_001',
    displayName: '박윤우',
    email: 'majXXXX@gmail.com',
    photoURL: null,
    isAdmin: true,
  };
}

// --- Auth Functions ---
async function signInWithGoogle() {
  if (isFirebaseConfigured()) {
    // TODO: Implement real Firebase Google Auth
    // const provider = new GoogleAuthProvider();
    // const result = await signInWithPopup(auth, provider);
    // currentUser = result.user;
  }
  // Mock
  currentUser = getMockUser();
  window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: currentUser } }));
  return currentUser;
}

async function signInWithApple() {
  if (isFirebaseConfigured()) {
    // TODO: Implement real Firebase Apple Auth
    // const provider = new OAuthProvider('apple.com');
    // const result = await signInWithPopup(auth, provider);
    // currentUser = result.user;
  }
  currentUser = getMockUser();
  window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: currentUser } }));
  return currentUser;
}

async function continueAsGuest() {
  currentUser = {
    uid: 'guest_' + Date.now(),
    displayName: 'Guest',
    email: null,
    photoURL: null,
    isAdmin: false,
  };
  window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: currentUser } }));
  return currentUser;
}

async function signOut() {
  currentUser = null;
  window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: null } }));
}

function getCurrentAuthUser() {
  return currentUser;
}

function isAdmin() {
  return currentUser?.isAdmin === true;
}

// --- Auth State Observer ---
function onAuthStateChanged(callback) {
  window.addEventListener('authStateChanged', (e) => {
    callback(e.detail.user);
  });
  // Immediately call with current state
  callback(currentUser);
}

export {
  signInWithGoogle,
  signInWithApple,
  continueAsGuest,
  signOut,
  getCurrentAuthUser,
  isAdmin,
  onAuthStateChanged,
};
