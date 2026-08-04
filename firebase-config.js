// ============================================
// LuckyPick - Firebase Configuration
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyCNL3_b-IOq04_Sdq3-N7Ei3CxtSG0ztNs",
  authDomain: "luckypick-ec4cf.firebaseapp.com",
  projectId: "luckypick-ec4cf",
  storageBucket: "luckypick-ec4cf.firebasestorage.app",
  messagingSenderId: "974820827320",
  appId: "1:974820827320:web:9cc0b222d923253e48944d",
  measurementId: "G-8ZSGLFS8VH"
};

// Check if real Firebase credentials are set
const isFirebaseConfigured = () => {
  // Option 1: Local Storage Sandbox mode for local development
  // Prevents local test products from syncing to the live production database.
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhost) {
    console.log('[LuckyPick] Option 1: Running in Local Storage Sandbox mode on localhost.');
    return false;
  }
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey.startsWith("AIzaSy");
};

export { firebaseConfig, isFirebaseConfigured };
