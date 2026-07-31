// ============================================
// LuckyPick - Firebase Configuration (Placeholder)
// ============================================
// TODO: Replace with actual Firebase project config
// Use Firebase MCP or Firebase Console to get these values

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase is not initialized yet - using mock data
const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY";
};

export { firebaseConfig, isFirebaseConfigured };
