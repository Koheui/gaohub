"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { fetchAdmin } from "@/lib/admin/fetchAdmin";
import type { AdminOrgDetail } from "@/lib/admin/types";
import { formatJpy } from "@/lib/format";
import { chip } from "@/lib/ui";

const statusLabel: Record<AdminOrgDetail["events"][number]["status"], { text: string; tone: "ok" | "warn" | "mute" }> = {
  published: { text: "Live", tone: "ok" },
  draft: { text: "Draft", tone: "mute" },
  ended: { text: "Ended", tone: "warn" },
};

export default function AdminOrgDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const [data, setData] = useState<AdminOrgDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmin<AdminOrgDetail>(`/api/admin/organizations/${orgId}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "取得に失敗しました"));
  }, [orgId]);

  if (error) return <p className="font-mono text-sm font-bold text-red-400">{error}</p>;
  if (!data) {
    return (
      <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
        Loading…
      </p>
    );
  }

  const totalRevenue = data.events.reduce((sum, e) => sum + e.revenueJpy, 0);
  const totalRegistrations = data.events.reduce((sum, e) => sum + e.confirmedRegistrations, 0);

  return (
    <div>
      <Link
        href="/admin/organizations"
        className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white"
      >
        ← 組織一覧
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.35em] text-zinc-500">
            Organization
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tighter sm:text-4xl">{data.name}</h1>
          <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            作成日 {new Date(data.createdAt).toLocaleDateString("ja-JP")} ・ Stripe
            {" "}
            {data.stripeOnboarded ? "接続済み" : "未接続"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="border border-white/15 bg-white/[0.03] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
            [Events]
          </p>
          <p className="mt-3 text-4xl font-black tabular-nums tracking-tighter">{data.events.length}</p>
        </div>
        <div className="border border-white/15 bg-white/[0.03] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
            [Confirmed]
          </p>
          <p className="mt-3 text-4xl font-black tabular-nums tracking-tighter">{totalRegistrations}</p>
        </div>
        <div className="border border-white/15 bg-white/[0.03] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
            [Revenue]
          </p>
          <p className="mt-3 text-4xl font-black tabular-nums tracking-tighter">{formatJpy(totalRevenue)}</p>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-black tracking-tight">イベント</h2>
      {data.events.length === 0 ? (
        <p className="mt-4 text-sm font-medium text-zinc-500">まだイベントがありません。</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/10 border border-white/15">
          {data.events.map((ev) => (
            <li key={ev.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="flex items-center gap-2 font-black tracking-tight">
                  {ev.title}
                  <span className={chip(statusLabel[ev.status].tone)}>[{statusLabel[ev.status].text}]</span>
                </p>
                <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                  {new Date(ev.startsAt).toLocaleDateString("ja-JP")} ・ 申込 {ev.confirmedRegistrations} ・
                  {" "}
                  チェックイン {ev.checkedIn}
                </p>
              </div>
              <span className="font-black tabular-nums">{formatJpy(ev.revenueJpy)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
