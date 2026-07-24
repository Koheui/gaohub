"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { auth, db } from "@/lib/firebase/client";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use":
    "このメールアドレスは登録済みです。下の「ログイン」からサインインしてください。",
  "auth/invalid-credential": "メールアドレスまたはパスワードが正しくありません。",
  "auth/user-not-found": "このメールアドレスのアカウントが見つかりません。",
  "auth/wrong-password": "パスワードが正しくありません。",
  "auth/weak-password": "パスワードが弱すぎます。8文字以上で設定してください。",
  "auth/invalid-email": "メールアドレスの形式が正しくありません。",
  "auth/too-many-requests":
    "試行回数が多すぎます。しばらく時間をおいてからお試しください。",
  "auth/popup-closed-by-user": "Googleログインがキャンセルされました。",
  "auth/network-request-failed": "ネットワークエラーが発生しました。接続を確認してください。",
};

function authErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[err.code] ?? `認証に失敗しました(${err.code})`;
  }
  return err instanceof Error ? err.message : "認証に失敗しました";
}

async function ensureUserProfile() {
  const u = auth.currentUser;
  if (!u) return;
  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: u.email ?? "",
      displayName: u.displayName ?? "",
      orgId: null,
      createdAt: serverTimestamp(),
    });
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function afterAuth() {
    await ensureUserProfile();
    router.push("/dashboard/site");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      await afterAuth();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      await afterAuth();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-bold text-lg">
          GAO HUB
        </Link>
        <h1 className="mt-8 text-2xl font-bold">
          {mode === "signup" ? "アカウント作成" : "ログイン"}
        </h1>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="mt-6 w-full rounded-lg border border-zinc-300 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
        >
          Google で続ける
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-zinc-400">
          <div className="h-px flex-1 bg-zinc-200" />
          または
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="パスワード(8文字以上)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {mode === "signup" ? "登録する" : "ログイン"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-500">
          {mode === "signup" ? "アカウントをお持ちですか? " : "はじめてですか? "}
          <button
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            className="text-zinc-900 underline"
          >
            {mode === "signup" ? "ログイン" : "アカウント作成"}
          </button>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
