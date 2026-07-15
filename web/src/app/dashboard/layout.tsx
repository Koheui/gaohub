"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-zinc-100">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-bold">
              GAO HUB
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-600">
              <Link href="/dashboard" className="hover:text-zinc-900">
                イベント
              </Link>
              <Link href="/dashboard/settings/payments" className="hover:text-zinc-900">
                決済設定
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-500">{user.email}</span>
            <button
              onClick={async () => {
                await signOut(auth);
                router.push("/");
              }}
              className="text-zinc-500 hover:text-zinc-900"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
