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

  const eventMatch = pathname.match(/^\/dashboard\/events\/([^/]+)/);
  const currentEventId = eventMatch && eventMatch[1] !== "new" ? eventMatch[1] : null;

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#f6f5f2] font-mono text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
        Loading…
      </div>
    );
  }

  const navItems = [
    { href: "/dashboard", label: "イベント", active: pathname === "/dashboard" || pathname.startsWith("/dashboard/events") },
    { href: "/dashboard/site", label: "公式Webサイト 🏛️", active: pathname.startsWith("/dashboard/site") },
    { href: "/dashboard/posts", label: "SNS・EC投稿 📸", active: pathname.startsWith("/dashboard/posts") },
    { href: "/dashboard/settings/payments", label: "決済設定", active: pathname.startsWith("/dashboard/settings") },
  ];

  return (
    <div className="relative flex flex-1 flex-col bg-[#f6f5f2] text-zinc-950">
      {/* ごく薄いフィルムグレイン */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Grain opacity={0.14} />
      </div>

      <header className="relative z-20 border-b-2 border-zinc-950 bg-[#f6f5f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-lg font-black tracking-tighter">
              GAO<span className="text-zinc-400"> </span>HUB
            </Link>
            <nav className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${
                    item.active ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-950"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {currentEventId && <ViewPublicPageButton eventId={currentEventId} />}
            {isPlatformAdminEmail(user.email) && (
              <Link
                href="/admin"
                className="rounded-full bg-zinc-950 px-3 py-1 text-[11px] font-black uppercase tracking-[0.15em] text-white hover:bg-zinc-700"
              >
                Master
              </Link>
            )}
            <span className="hidden font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 sm:block">
              {user.email}
            </span>
            <button
              onClick={async () => {
                await signOut(auth);
                router.push("/");
              }}
              className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-950"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
