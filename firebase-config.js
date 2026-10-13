// ============================================
// LuckyPick - Firebase Configuration
// Production & Development Environment Switching
// ============================================

// Production (Live App - luckypick-ec4cf)
const firebaseConfigProd = {
  apiKey: "AIzaSyCNL3_b-IoQ04_Sdq3-N7Ei3CxtSG0ztNs",
  authDomain: "luckypick-ec4cf.firebaseapp.com",
  projectId: "luckypick-ec4cf",
  storageBucket: "luckypick-ec4cf.firebasestorage.app",
  messagingSenderId: "974820827320",
  appId: "1:974820827320:web:9cc0b222d923253e48944d",
  measurementId: "G-8ZSGLFS8VH"
};

// Development (Dev App - lucky-pick-dev)
const firebaseConfigDev = {
  apiKey: "AIzaSyDckVY0_98XcVOe0BpzvGgsXJwoZDlyUoA",
  authDomain: "lucky-pick-dev.firebaseapp.com",
  projectId: "lucky-pick-dev",
  storageBucket: "lucky-pick-dev.firebasestorage.app",
  messagingSenderId: "813005388637",
  appId: "1:813005388637:web:a684e2dab6533f0e03c6b4"
};

// Check if running on localhost (uses local Firebase emulators)
const isLocalDev = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

// Use the canonical luckypick-ec4cf config across both local emulators and live deployment
const firebaseConfig = firebaseConfigProd;

// Check if real Firebase credentials are set
const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey.startsWith("AIzaSy");
};

export { firebaseConfig, firebaseConfigProd, firebaseConfigDev, isFirebaseConfigured, isLocalDev };

