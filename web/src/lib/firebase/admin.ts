import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App | null = null;

function getAdminApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
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
  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

export function adminDb() {
  return getFirestore(getAdminApp());
}

export function adminAuth() {
  return getAuth(getAdminApp());
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
