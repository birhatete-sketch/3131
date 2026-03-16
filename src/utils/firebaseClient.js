import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return !!(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
}

export function getFirebaseAuth() {
  if (!isFirebaseConfigured()) return null;
  if (getApps().length === 0) {
    initializeApp(getFirebaseConfig());
  }
  return getAuth();
}

