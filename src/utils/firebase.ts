import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only in browser and when measurementId is provided
let analytics: ReturnType<typeof getAnalytics> | null = null;
const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined;
if (typeof window !== 'undefined' && measurementId) {
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        // non-fatal: analytics may not work in some environments (SSR, restricted browsers)
        // keep app functional without throwing
        // eslint-disable-next-line no-console
        console.warn('Firebase analytics not initialized:', e);
        analytics = null;
    }
}

export { analytics };
