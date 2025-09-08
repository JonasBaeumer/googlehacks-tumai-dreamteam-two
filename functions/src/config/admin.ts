import {initializeApp, getApps, App} from "firebase-admin/app";
import {getFirestore, Firestore} from "firebase-admin/firestore";

let adminApp: App | null = null;
let firestoreDb: Firestore | null = null;

/**
 * Returns a singleton Firebase Admin App instance.
 * @return {App} Initialized or cached Admin App
 */
export function getAdminApp(): App {
  if (adminApp) return adminApp;
  const apps = getApps();
  adminApp = apps.length > 0 ? apps[0] : initializeApp();
  return adminApp;
}

/**
 * Returns a singleton Firestore instance using the Admin App.
 * @return {Firestore} Initialized or cached Firestore instance
 */
export function getDb(): Firestore {
  if (firestoreDb) return firestoreDb;
  firestoreDb = getFirestore(getAdminApp());
  return firestoreDb;
}


