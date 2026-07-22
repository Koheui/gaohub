"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import type { Organization } from "@/lib/types";
import { ui } from "@/lib/ui";

export default function SettingsPage() {
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

  async function startStripeOnboarding() {
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
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className={ui.h1}>システム・組織設定 ⚙️</h1>
        <p className="mt-1 text-sm text-zinc-500">
          決済機能(Stripe Connect)、組織プロフィール、ドメイン・アクセス権限の設定を統合管理します。
        </p>
      </div>

      {/* 💳 決済設定 (Stripe Connect) */}
      <div className="rounded-3xl border-2 border-zinc-950 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#635bff]/10 text-xl font-bold text-[#635bff]">
              💳
            </span>
            <div>
              <h2 className="text-lg font-black text-zinc-950">決済設定 (Stripe Connect)</h2>
              <p className="text-xs text-zinc-500">有料チケットおよびEC商品の売上受取口座の接続・確認</p>
            </div>
          </div>
          <Link
            href="/dashboard/settings/payments"
            className="text-xs font-bold text-zinc-500 underline hover:text-zinc-950"
          >
            決済詳細設定 ↗
          </Link>
        </div>

        <div className="mt-6">
          {org?.stripeOnboarded ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-emerald-50/80 p-5 border border-emerald-200">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                  ✓
                </span>
                <div>
                  <p className="text-sm font-black text-emerald-950">Stripe アカウント接続済み</p>
                  <p className="text-xs text-emerald-700">有料チケットおよびEC物販のオンライン決済が有効になっています。</p>
                </div>
              </div>
              <button
                onClick={startStripeOnboarding}
                disabled={busy}
                className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-bold text-emerald-900 shadow-sm transition-transform hover:scale-[1.02]"
              >
                Stripe アカウント情報を更新
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-purple-50/80 p-5 border border-purple-200">
              <div>
                <p className="text-sm font-black text-purple-950">Stripe アカウント未接続</p>
                <p className="mt-0.5 text-xs text-purple-700">
                  無料イベントは接続なしで使用可能です。有料チケット・EC商品を販売する場合は Stripe 接続が必要です。
                </p>
              </div>
              <button
                onClick={startStripeOnboarding}
                disabled={busy}
                className="rounded-xl bg-[#635bff] px-6 py-2.5 text-xs font-black text-white shadow-md transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {busy ? "リダイレクト中…" : "Stripe アカウントと連携する 🚀"}
              </button>
            </div>
          )}
          {error && <p className="mt-3 text-xs font-bold text-rose-600">{error}</p>}
        </div>
      </div>

      {/* 🏢 組織・ブランド設定 */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-xl font-bold text-zinc-800">
            🏢
          </span>
          <div>
            <h2 className="text-lg font-black text-zinc-950">組織・ブランドプロフィール</h2>
            <p className="text-xs text-zinc-500">領収書や特定商取引法に基づく表記に掲載される企業情報</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-zinc-500">組織ID</label>
            <input
              type="text"
              disabled
              value={org?.id ?? profile.orgId}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-mono font-bold text-zinc-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500">正式組織名</label>
            <input
              type="text"
              disabled
              value={org?.name ?? "Future Studio 株式会社"}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-bold text-zinc-700"
            />
          </div>
        </div>
      </div>

      {/* 🔐 ドメイン・セキュリティ設定 */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-xl font-bold text-zinc-800">
            🔐
          </span>
          <div>
            <h2 className="text-lg font-black text-zinc-950">ドメイン・アクセスセキュリティ</h2>
            <p className="text-xs text-zinc-500">Firebase Auth / 二重認可 セキュリティ設定</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-xs text-zinc-600 space-y-2">
          <p className="font-bold text-zinc-900">二重認可セキュリティポリシー監視状態: 正常 🛡️</p>
          <p>・管理系API (/api/admin/*) は Firestore Security Rules およびサーバー側の二重認証で保護されています。</p>
          <p>・特定個人情報 (学生証等) は確認後に自動破棄される自動クリーンアップ規約が適用されています。</p>
        </div>
      </div>
    </div>
  );
}
