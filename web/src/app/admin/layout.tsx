"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import { isPlatformAdminEmail } from "@/lib/platformAdmin";
import { Grain } from "@/components/Grain";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = isPlatformAdminEmail(user?.email);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-950 font-mono text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
        Loading…
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "サマリー", active: pathname === "/admin" },
    { href: "/admin/organizations", label: "組織一覧", active: pathname.startsWith("/admin/organizations") },
  ];

  return (
    <div className="relative flex flex-1 flex-col bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Grain opacity={0.18} />
      </div>

      <header className="relative z-20 border-b border-white/15 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2 text-lg font-black tracking-tighter">
              GAO<span className="text-zinc-500"> </span>HUB
              <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-950">
                Master
              </span>
            </Link>
            <nav className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${
                    item.active ? "text-white" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white"
            >
              主催者ダッシュボードへ
            </Link>
            <button
              onClick={async () => {
                await signOut(auth);
                router.push("/");
              }}
              className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white"
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
