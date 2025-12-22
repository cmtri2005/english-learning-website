/**
 * Firebase Configuration
 * 
 * Firebase SDK initialization for Google Sign-In.
 * API keys are safe to expose in client-side code as Firebase uses security rules.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA6f-k59gXCzpoIKXTpXzbVlsvwonAWOLM",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "php-login-a3255.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "php-login-a3255",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "php-login-a3255.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "553656720802",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:553656720802:web:4d88294ee33b54b58426fb",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XWC21XMKWL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Add scopes for additional user info
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app;
