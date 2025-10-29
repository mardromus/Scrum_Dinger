// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDaUuodhmg8DqpC038PuZp4yzCg8JXH9uE",
  authDomain: "scrumdinger-88827.firebaseapp.com",
  projectId: "scrumdinger-88827",
  storageBucket: "scrumdinger-88827.firebasestorage.app",
  messagingSenderId: "929432897825",
  appId: "1:929432897825:web:234bafe7fcdbda1b6e5660",
  measurementId: "G-5VBTEW3Y5P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// analytics is optional (will error if not available in some environments)
try {
  getAnalytics(app);
} catch (e) {
  // ignore analytics init errors in non-browser or restricted environments
}

// Auth exports and helpers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Opens a Google sign-in popup and returns the firebase user credential result.
 * Caller should use onAuthStateChanged(auth, ...) as the canonical source of truth,
 * but this helper is convenient for flows triggered from the UI.
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result;
}

/** Signs out the currently authenticated user. */
export function signOutUser() {
  return firebaseSignOut(auth);
}

// Firestore (used for lightweight signaling for WebRTC rooms)
export const db = getFirestore(app);