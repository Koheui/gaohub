import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { isPlatformAdminEmail } from "@/lib/platformAdmin";

let app: App | null = null;

function getAdminApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  // エミュレータ利用時(FIRESTORE_EMULATOR_HOST 設定時)は認証情報不要
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    app = initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket });
    return app;
  }
  // FIREBASE_SERVICE_ACCOUNT: サービスアカウントJSONをbase64エンコードした値
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is not set. Base64-encode the service account JSON and set it."
    );
  }
  const serviceAccount = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  app = initializeApp({ credential: cert(serviceAccount), storageBucket });
  return app;
}

export function adminDb() {
  return getFirestore(getAdminApp());
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminStorageBucket() {
  return getStorage(getAdminApp()).bucket();
}

/** Authorization: Bearer <idToken> を検証して uid を返す */
export async function verifyIdToken(authorization: string | null): Promise<string | null> {
  if (!authorization?.startsWith("Bearer ")) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(authorization.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

/**
 * Authorization: Bearer <idToken> を検証し、プラットフォーム管理者(PLATFORM_ADMIN_EMAILS)
 * であれば uid を返す。email はトークンの署名済みクレームから読むため、クライアントが
 * 詐称することはできない。
 */
export async function verifyPlatformAdmin(authorization: string | null): Promise<string | null> {
  if (!authorization?.startsWith("Bearer ")) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(authorization.slice(7));
    if (!decoded.email || !decoded.email_verified) return null;
    if (!isPlatformAdminEmail(decoded.email)) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}
