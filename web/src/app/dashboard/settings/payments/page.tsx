"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import type { Organization } from "@/lib/types";
import { ui } from "@/lib/ui";

export default function PaymentsSettingsPage() {
  const { profile } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.orgId) return;
    return onSnapshot(doc(db, "organizations", profile.orgId), (snap) => {
      setOrg(snap.exists() ? ({ id: snap.id, ...snap.data() } as Organization) : null);
    });
  }, [profile?.orgId]);

  async function startOnboarding() {
    setBusy(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "エラーが発生しました");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setBusy(false);
    }
  }

  if (!profile?.orgId) return null;

  return (
    <div className="max-w-xl">
      <h1 className={ui.h1}>決済設定</h1>
      <p className="mt-2 text-sm text-zinc-600">
        有料チケットを販売するには、Stripe アカウントの接続が必要です。売上は Stripe
        から主催者様の銀行口座へ直接入金されます。
      </p>

      <div className="mt-8 border-2 border-zinc-950 bg-white p-6">
        {org?.stripeOnboarded ? (
          <div>
            <p className="font-medium text-emerald-700">✓ Stripe 接続済み</p>
            <p className="mt-1 text-sm text-zinc-500">
              有料チケットの販売が有効になっています。
            </p>
            <button
              onClick={startOnboarding}
              disabled={busy}
              className="mt-4 text-sm text-zinc-600 underline hover:text-zinc-900"
            >
              Stripe 設定を更新する
            </button>
          </div>
        ) : (
          <div>
            <p className="font-medium">Stripe 未接続</p>
            <p className="mt-1 text-sm text-zinc-500">
              無料チケットのみのイベントは接続なしで開催できます。
            </p>
            <button
              onClick={startOnboarding}
              disabled={busy}
              className="mt-4 rounded-lg bg-[#635bff] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "リダイレクト中…" : "Stripe に接続する"}
            </button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
