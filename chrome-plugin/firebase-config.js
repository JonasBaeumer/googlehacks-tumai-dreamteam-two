// Firebase configuration for CodeStreak Chrome Extension
// This file contains the Firebase config and initialization

// Firebase configuration (same as web app)
const firebaseConfig = {
  apiKey: "AIzaSyDnSZl4V7RTaIBzrFkRPkTyp9njtQH-vqE",
  authDomain: "tum-cdtm25mun-8774.firebaseapp.com",
  projectId: "tum-cdtm25mun-8774",
  storageBucket: "tum-cdtm25mun-8774.firebasestorage.app",
  messagingSenderId: "804409912656",
  appId: "1:804409912656:web:8b38d4529dff00ec25055",
};

// Firebase Cloud Functions base URL
const FIREBASE_FUNCTIONS_URL = "https://us-central1-tum-cdtm25mun-8774.cloudfunctions.net";

// Make available globally
window.firebaseConfig = firebaseConfig;
window.FIREBASE_FUNCTIONS_URL = FIREBASE_FUNCTIONS_URL;
