import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-WWTYX4YVQD" // Keep measurementId or move if preferred
};

let app;
let db;

// Initialize Firebase for SSR compatibility and network resilience
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // Force long polling instead of WebSockets. 
    // This resolves the "Failed to get document because the client is offline" 
    // error commonly caused by corporate firewalls or aggressive ad blockers.
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true
    });
} else {
    app = getApp();
    db = getFirestore(app);
}

const auth = getAuth(app);
const storage = getStorage(app);

// Optimize storage for better resilience on slower/restricted networks
storage.maxOperationRetryTime = 60000; // Increase to 60 seconds
storage.maxUploadRetryTime = 120000;   // Increase to 120 seconds (2 minutes)

export { auth, db, storage };
