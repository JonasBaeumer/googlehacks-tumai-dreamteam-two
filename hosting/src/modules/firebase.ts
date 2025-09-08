import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

let firebaseApp: FirebaseApp | null = null
let authInstance: Auth | null = null

// Hard-coded config provided by user
const firebaseConfig = {
  apiKey: "AIzaSyDnSZl4V7RTaIBzrFkRPkTyp9njtQH-vqE",
  authDomain: "tum-cdtm25mun-8774.firebaseapp.com",
  projectId: "tum-cdtm25mun-8774",
  storageBucket: "tum-cdtm25mun-8774.firebasestorage.app",
  messagingSenderId: "804409912656",
  appId: "1:804409912656:web:8b38d4529dff00eec25055",
}

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp
  firebaseApp = initializeApp(firebaseConfig)
  return firebaseApp
}

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance
  authInstance = getAuth(getFirebaseApp())
  return authInstance
}


