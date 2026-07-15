import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

// NEXT_PUBLIC_* はビルド時にインライン化される。env未設定のビルド(CI等)でも
// モジュール評価時に initializeApp/getAuth が落ちないようプレースホルダーを入れる。
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "build-placeholder",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "build-placeholder",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "build-placeholder",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "build-placeholder",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "0",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "build-placeholder",
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ローカル開発: NEXT_PUBLIC_USE_EMULATORS=1 で Firebase エミュレータに接続
declare global {
  var __emulatorsConnected: boolean | undefined;
}
if (
  process.env.NEXT_PUBLIC_USE_EMULATORS === "1" &&
  !globalThis.__emulatorsConnected
) {
  globalThis.__emulatorsConnected = true;
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8090);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}
