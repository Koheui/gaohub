"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAdmin } from "@/lib/admin/fetchAdmin";
import type { AdminOverview } from "@/lib/admin/types";
import { formatJpy } from "@/lib/format";
import { StatCard, EventsStatusBar } from "./AdminWidgets";

export default function AdminSummaryPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmin<AdminOverview>("/api/admin/summary")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "取得に失敗しました"));
  }, []);

  if (error) {
    return <p className="font-mono text-sm font-bold text-red-400">{error}</p>;
  }
  if (!data) {
    return (
      <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
        Loading…
      </p>
    );
  }

  const { summary, organizations } = data;
  const topOrgs = organizations.slice(0, 5);

  return (
    <div>
      <p className="font-mono text-[11px] font-black uppercase tracking-[0.35em] text-zinc-500">
        Platform Overview
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tighter sm:text-4xl">サマリー</h1>
      <p className="mt-3 max-w-xl text-sm font-medium text-zinc-400">
        全テナントを横断したプラットフォーム全体の状況です。個社のイベント詳細は組織一覧から確認できます。
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Organizations"
          value={String(summary.totalOrganizations)}
          sub={`今月 +${summary.newOrganizationsThisMonth}`}
        />
        <StatCard label="Events" value={String(summary.totalEvents)} />
        <StatCard
          label="Confirmed Registrations"
          value={summary.totalConfirmedRegistrations.toLocaleString("ja-JP")}
        />
        <StatCard
          label="Platform Fee"
          value={formatJpy(summary.totalPlatformFeeJpy)}
          sub={`流通総額 ${formatJpy(summary.totalRevenueJpy)}`}
        />
      </div>

      <div className="mt-6">
        <EventsStatusBar counts={summary.eventsByStatus} />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-black tracking-tight">売上上位の組織</h2>
        <Link
          href="/admin/organizations"
          className="text-xs font-bold text-zinc-400 underline underline-offset-4 hover:text-white"
        >
          全組織を見る →
        </Link>
      </div>

      {topOrgs.length === 0 ? (
        <p className="mt-4 text-sm font-medium text-zinc-500">まだ組織がありません。</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/10 border border-white/15">
          {topOrgs.map((org, i) => (
            <li key={org.id}>
              <Link
                href={`/admin/organizations/${org.id}`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-bold text-zinc-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-black tracking-tight">{org.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                      イベント {org.eventCount} ・ 申込 {org.confirmedRegistrations}
                    </p>
                  </div>
                </div>
                <span className="font-black tabular-nums">{formatJpy(org.revenueJpy)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
