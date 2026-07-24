"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import { isPlatformAdminEmail } from "@/lib/platformAdmin";
import { Grain } from "@/components/Grain";
import { ViewPublicPageButton } from "@/components/ViewPublicPageButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const eventMatch = pathname.match(/^\/dashboard\/events\/([^/]+)/);
  const currentEventId = eventMatch && eventMatch[1] !== "new" ? eventMatch[1] : null;

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // ルート変更時にモバイルメニューを閉じる
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#f6f5f2] font-mono text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
        Loading…
      </div>
    );
  }

  const navItems = [
    { href: "/dashboard/site", label: "ウェブページ 🌐", active: pathname.startsWith("/dashboard/site") },
    { href: "/dashboard/posts", label: "ジャーナル 📖", active: pathname.startsWith("/dashboard/posts") },
    { href: "/dashboard", label: "イベント 🎟️", active: pathname === "/dashboard" || pathname.startsWith("/dashboard/events") },
    { href: "/dashboard/shop", label: "ECサイト 📦", active: pathname.startsWith("/dashboard/shop") },
    { href: "/dashboard/settings", label: "設定 ⚙️", active: pathname.startsWith("/dashboard/settings") },
  ];

  return (
    <div className="relative flex flex-1 flex-col bg-[#f6f5f2] text-zinc-950">
      {/* ごく薄いフィルムグレイン */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Grain opacity={0.14} />
      </div>

      <header className="relative z-30 border-b-2 border-zinc-950 bg-[#f6f5f2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4 lg:gap-8">
            <Link href="/dashboard/site" className="text-lg font-black tracking-tighter shrink-0">
              GAO<span className="text-zinc-400"> </span>HUB
            </Link>
            
            {/* デスクトップ用ナビゲーション */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[11px] font-black uppercase tracking-[0.15em] shrink-0 whitespace-nowrap transition-colors ${
                    item.active ? "text-zinc-950 border-b-2 border-zinc-950 pb-0.5" : "text-zinc-400 hover:text-zinc-950"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {currentEventId && (
              <div className="shrink-0 whitespace-nowrap">
                <ViewPublicPageButton eventId={currentEventId} />
              </div>
            )}
            {isPlatformAdminEmail(user.email) && (
              <Link
                href="/admin"
                className="hidden sm:inline-block rounded-full bg-zinc-950 px-3 py-1 text-[11px] font-black uppercase tracking-[0.15em] text-white hover:bg-zinc-700 shrink-0 whitespace-nowrap"
              >
                Master
              </Link>
            )}
            <span className="hidden xl:block font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 shrink-0">
              {user.email}
            </span>

            <button
              onClick={async () => {
                await signOut(auth);
                router.push("/");
              }}
              className="hidden sm:block text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 hover:text-zinc-950 shrink-0 whitespace-nowrap"
            >
              Logout
            </button>

            {/* モバイル/狭画面用ハンバーガーボタン */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-900 shadow-sm shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* モバイル/狭画面用ドロワーメニュー */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-300 bg-white p-5 shadow-xl space-y-4">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-black uppercase tracking-wider py-2 px-3 rounded-xl transition-colors ${
                    item.active ? "bg-zinc-950 text-white" : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-zinc-500 truncate max-w-[200px]">
                {user.email}
              </span>
              <button
                onClick={async () => {
                  await signOut(auth);
                  router.push("/");
                }}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-700 hover:bg-zinc-200"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-8 sm:py-10">{children}</main>
    </div>
  );
}
